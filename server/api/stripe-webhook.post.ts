import Stripe from 'stripe'
import { buffer } from 'node:stream/consumers'
import { supabaseAdmin } from '../lib/supabaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export default defineEventHandler(async (event) => {
  const rawBody = await buffer(event.node.req)
  const signature = event.node.req.headers['stripe-signature'] as string

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    throw createError({ statusCode: 400 })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    if (!orderId) return { received: true }
    if (session.payment_status !== 'paid') return { received: true }

    const { data: order } = await supabaseAdmin
      .from('order')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (!order) return { received: true }
    if (order.status === 'paid') return { received: true }
    if (order.status === 'refunded') return { received: true }

    // Source de vérité : les réservations hold encore valides (expires_at > now)
    const { data: reservations } = await supabaseAdmin
      .from('seat_reservation')
      .select('id, expires_at')
      .eq('order_id', orderId)
      .eq('status', 'hold')

    const now = Date.now()
    const hasValidHolds =
      reservations &&
      reservations.length > 0 &&
      reservations.every((r) => new Date(r.expires_at).getTime() > now)

    // Paiement trop tard : order déjà expired/canceled OU plus de réservations valides
    if (order.status === 'expired' || order.status === 'canceled' || !hasValidHolds) {
      await supabaseAdmin
        .from('order')
        .update({ status: 'refunded' })
        .eq('id', orderId)

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent as { id?: string })?.id
      if (paymentIntentId) {
        try {
          await stripe.refunds.create({ payment_intent: paymentIntentId })
        } catch (e: any) {
          if (e?.code !== 'charge_already_refunded') console.error(e)
        }
      }

      if (reservations?.length) {
        await supabaseAdmin
          .from('seat_reservation')
          .delete()
          .eq('order_id', orderId)
          .eq('status', 'hold')
      }
      return { received: true }
    }

    // Paiement OK : réservations encore valides
    await supabaseAdmin
      .from('order')
      .update({ status: 'paid' })
      .eq('id', orderId)

    await supabaseAdmin
      .from('seat_reservation')
      .update({ status: 'paid', expires_at: null })
      .eq('order_id', orderId)
      .eq('status', 'hold')
  }

  return { received: true }
})

