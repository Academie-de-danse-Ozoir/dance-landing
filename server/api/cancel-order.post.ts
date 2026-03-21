import { supabaseAdmin } from '../lib/supabaseAdmin'
import { stripe } from '../lib/stripe'
import { RATE_LIMIT_CANCEL_ORDER_PER_MINUTE, ORDER_STATUS, CANCEL_REASON } from '../../constants'
import { tApiError } from '../../locales/frDisplay'
import { checkRateLimit, getClientIp } from '../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  
  if (!checkRateLimit(ip, 'cancel', RATE_LIMIT_CANCEL_ORDER_PER_MINUTE).ok) {
    throw createError({ statusCode: 429, statusMessage: tApiError('rateLimit') })
  }

  const body = await readBody(event)
  const orderId = body?.orderId
  const orderToken = body?.orderToken
  const reason = body?.reason === CANCEL_REASON.TIMER ? CANCEL_REASON.TIMER : CANCEL_REASON.USER

  console.info('[billetterie:cancel-order] Demande', {
    orderId,
    reason,
    reasonRaw: body?.reason,
    ip
  })

  if (!orderId || !orderToken) {
    throw createError({
      statusCode: 400,
      statusMessage: orderToken ? tApiError('missingOrderId') : tApiError('missingOrderToken')
    })
  }

  const { data: order, error } = await supabaseAdmin
    .from('order')
    .select('id, status, stripe_session_id')
    .eq('id', orderId)
    .eq('order_token', orderToken)
    .single()

  if (error || !order) {
    throw createError({ statusCode: 404, statusMessage: tApiError('missingOrderToken') })
  }

  if (order.status === ORDER_STATUS.PAID) {
    console.warn('[billetterie:cancel-order] Refusé : commande déjà PAID', { orderId })
    throw createError({
      statusCode: 409,
      statusMessage: tApiError('paidOrderCannotBeCancelled')
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

  console.info('[billetterie:cancel-order] Statut mis à jour', {
    orderId,
    ancienStatut: order.status,
    nouveauStatut: newStatus,
    reason
  })

  // 2️⃣ Libérer les seats
  await supabaseAdmin
    .from('seat_reservation')
    .delete()
    .eq('order_id', orderId)

  // 3️⃣ Expirer la session Stripe
  if (order.stripe_session_id) {
    try {
      await stripe.checkout.sessions.expire(order.stripe_session_id)
      console.info('[billetterie:cancel-order] Session Stripe expirée', { stripeSessionId: order.stripe_session_id })
    } catch (err) {
      console.info('[billetterie:cancel-order] expire session Stripe (déjà complétée ou expirée)', err)
    }
  }

  console.info('[billetterie:cancel-order] Terminé OK', { orderId })
  return { ok: true }
})

