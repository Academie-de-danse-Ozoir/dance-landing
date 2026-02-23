import { supabaseAdmin } from '../lib/supabaseAdmin'
import { stripe } from '../lib/stripe'

export default defineEventHandler(async (event) => {
  const { orderId } = await readBody(event)

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing orderId'
    })
  }

  const { data: order, error } = await supabaseAdmin
    .from('order')
    .select('id, status, stripe_session_id')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return { ok: true }
  }

  if (order.status === 'paid') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Paid order cannot be cancelled'
    })
  }

  // 1️⃣ Marquer comme expired
  await supabaseAdmin
    .from('order')
    .update({ status: 'expired' })
    .eq('id', orderId)

  // 2️⃣ Libérer les seats
  await supabaseAdmin
    .from('seat_reservation')
    .delete()
    .eq('order_id', orderId)

  // 3️⃣ Expirer la session Stripe
  if (order.stripe_session_id) {
    try {
      await stripe.checkout.sessions.expire(order.stripe_session_id)
    } catch (err) {
      console.log('Stripe session already expired or completed')
    }
  }

  return { ok: true }
})

