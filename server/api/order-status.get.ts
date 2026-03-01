import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ERROR_MISSING_ORDER_ID, ORDER_STATUS, SEAT_STATUS } from '../../constants'

export default defineEventHandler(async (event) => {
  const orderId = getQuery(event).orderId as string

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: ERROR_MISSING_ORDER_ID
    })
  }

  /* =====================
     1️⃣ Charger la commande
  ===================== */
  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select('id, status')
    .eq('id', orderId)
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
