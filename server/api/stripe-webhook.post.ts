import Stripe from 'stripe'
import { buffer } from 'node:stream/consumers'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ORDER_STATUS, SEAT_STATUS } from '../../constants'
import { tApiError } from '../../locales/frDisplay'
import { sendPaidOrderTicketEmailIfNeeded } from '../utils/paidOrderTicketEmail'
import { updateOrderStatusAndClearContact } from '../utils/updateOrderStatusAndClearContact'

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
    throw createError({ statusCode: 400, statusMessage: tApiError('invalidRequest') })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const eventId = stripeEvent.id
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    if (!orderId) {
      return { received: true }
    }
    if (session.payment_status !== ORDER_STATUS.PAID) {
      return { received: true }
    }

    const { data: order } = await supabaseAdmin
      .from('order')
      .select('id, status, email, ticket_sent, first_name, last_name, phone')
      .eq('id', orderId)
      .single()

    if (!order) {
      return { received: true }
    }

    /* Sync-checkout a souvent déjà mis PAID avant ce handler — envoyer le mail si pas encore fait */
    if (order.status === ORDER_STATUS.PAID) {
      if (!order.ticket_sent) {
        try {
          await sendPaidOrderTicketEmailIfNeeded(session, orderId)
        } catch (mailError) {
          throw mailError
        }
      }
      return { received: true }
    }

    if (order.status === ORDER_STATUS.REFUNDED) {
      return { received: true }
    }

    const { data: reservations } = await supabaseAdmin
      .from('seat_reservation')
      .select('id, expires_at')
      .eq('order_id', orderId)
      .eq('status', SEAT_STATUS.HOLD)

    const now = Date.now()

    const hasValidHolds =
      reservations &&
      reservations.length > 0 &&
      reservations.every(
        (r) => new Date(r.expires_at).getTime() > now
      )

    if (
      order.status === ORDER_STATUS.EXPIRED ||
      order.status === ORDER_STATUS.CANCELED ||
      !hasValidHolds
    ) {
      await supabaseAdmin
        .from('order')
        .update({ status: ORDER_STATUS.REFUNDED })
        .eq('id', orderId)

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent as { id?: string })?.id

      if (paymentIntentId) {
        try {
          await stripe.refunds.create({ payment_intent: paymentIntentId })
        } catch {
          // ignore refund errors
        }
      }

      if (reservations?.length) {
        await supabaseAdmin
          .from('seat_reservation')
          .delete()
          .eq('order_id', orderId)
          .eq('status', SEAT_STATUS.HOLD)
      }

      return { received: true }
    }

    const { data: updatedOrder } = await supabaseAdmin
      .from('order')
      .update({ status: ORDER_STATUS.PAID })
      .eq('id', orderId)
      .select('id, email, ticket_sent')
      .single()

    await supabaseAdmin
      .from('seat_reservation')
      .update({ status: SEAT_STATUS.PAID, expires_at: null })
      .eq('order_id', orderId)
      .eq('status', SEAT_STATUS.HOLD)

    if (updatedOrder && !updatedOrder.ticket_sent) {
      try {
        await sendPaidOrderTicketEmailIfNeeded(session, orderId)
      } catch (mailErr) {
        throw mailErr
      }
    }
  }

  if (stripeEvent.type === 'checkout.session.expired') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId) {
      const { data: ord } = await supabaseAdmin.from('order').select('status').eq('id', orderId).single()
      if (ord?.status === ORDER_STATUS.PENDING) {
        await supabaseAdmin
          .from('seat_reservation')
          .delete()
          .eq('order_id', orderId)
          .eq('status', SEAT_STATUS.HOLD)
        await updateOrderStatusAndClearContact(orderId, ORDER_STATUS.EXPIRED)
      }
    }
  }

  return { received: true }
})
