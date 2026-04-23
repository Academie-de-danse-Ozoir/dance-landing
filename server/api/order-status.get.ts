import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ORDER_STATUS, SEAT_STATUS } from '../../constants'
import { tApiError } from '../../locales/frDisplay'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const orderId = query.orderId as string
  const rawToken = query.orderToken
  const orderToken =
    typeof rawToken === 'string' ? rawToken.trim() : rawToken != null ? String(rawToken).trim() : ''

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: tApiError('missingOrderId')
    })
  }
  if (!orderToken) {
    throw createError({
      statusCode: 400,
      statusMessage: tApiError('missingOrderToken')
    })
  }

  /* =====================
     1️⃣ Charger la commande
  ===================== */
  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select('id, status')
    .eq('id', orderId)
    .eq('order_token', orderToken)
    .single()

  if (orderError || !order) {
    return { status: 'not_found' }
  }

  /* =====================
     2️⃣ SI PAYÉ → STOP IMMÉDIAT
  ===================== */
  if (order.status === ORDER_STATUS.PAID) {
    return { status: ORDER_STATUS.PAID }
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    return { status: order.status }
  }

  /* =====================
     3️⃣ Charger les réservations hold
  ===================== */
  const { data: reservations, error: resError } = await supabaseAdmin
    .from('seat_reservation')
    .select('expires_at')
    .eq('order_id', orderId)
    .eq('status', SEAT_STATUS.HOLD)

  if (resError || !reservations || reservations.length === 0) {
    return { status: ORDER_STATUS.EXPIRED }
  }

  /* =====================
     4️⃣ Vérifier expiration
  ===================== */
  const expiresAt = reservations[0].expires_at

  if (new Date(expiresAt).getTime() <= Date.now()) {
    return { status: ORDER_STATUS.EXPIRED }
  }

  /* =====================
     5️⃣ Pending valide
  ===================== */
  return {
    status: ORDER_STATUS.PENDING,
    expiresAt,
    seatCount: reservations.length
  }
})
