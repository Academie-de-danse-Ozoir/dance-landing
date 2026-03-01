import { supabaseAdmin } from '../lib/supabaseAdmin'
import { stripe } from '../lib/stripe'
import {
  ERROR_MISSING_ORDER_ID,
  ERROR_PAID_ORDER_CANNOT_BE_CANCELLED,
  ORDER_STATUS,
  CANCEL_REASON
} from '../../constants'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const orderId = body?.orderId
  const reason = body?.reason === CANCEL_REASON.TIMER ? CANCEL_REASON.TIMER : CANCEL_REASON.USER

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: ERROR_MISSING_ORDER_ID
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

  if (order.status === ORDER_STATUS.PAID) {
    throw createError({
      statusCode: 409,
      statusMessage: ERROR_PAID_ORDER_CANNOT_BE_CANCELLED
    })
  }

  // expired = timer terminé, canceled = annulation utilisateur ou autre (ne pas écraser expired)
  const newStatus =
    reason === CANCEL_REASON.TIMER
      ? ORDER_STATUS.EXPIRED
      : order.status === ORDER_STATUS.EXPIRED
        ? ORDER_STATUS.EXPIRED
        : ORDER_STATUS.CANCELED
  await supabaseAdmin
    .from('order')
    .update({ status: newStatus })
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

