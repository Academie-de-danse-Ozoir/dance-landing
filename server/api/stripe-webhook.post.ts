import Stripe from 'stripe'
import { buffer } from 'node:stream/consumers'
import { supabaseAdmin } from '../lib/supabaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export default defineEventHandler(async (event) => {
  const rawBody = await buffer(event.node.req)
  const sig = event.node.req.headers['stripe-signature'] as string

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    throw createError({ statusCode: 400, statusMessage: 'Webhook error' })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const order_id = session.metadata?.order_id

    if (order_id) {
      await supabaseAdmin.from('order')
        .update({ status: 'paid' })
        .eq('id', order_id)

      await supabaseAdmin
        .from('seat_reservation')
        .update({ status: 'paid', expires_at: null })
        .eq('order_id', order_id)
    }
  }

  return { received: true }
})
