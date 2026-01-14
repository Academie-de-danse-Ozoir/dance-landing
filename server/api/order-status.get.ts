import { supabaseAdmin } from '../lib/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const orderId = getQuery(event).orderId as string

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing orderId'
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
     (CRITIQUE POUR TON BUG)
  ===================== */
  if (order.status === 'paid') {
    return { status: 'paid' }
  }

  if (order.status !== 'pending') {
    return { status: order.status }
  }

  /* =====================
     3️⃣ Charger les réservations hold
  ===================== */
  const { data: reservations, error: resError } = await supabaseAdmin
    .from('seat_reservation')
    .select('expires_at')
    .eq('order_id', orderId)
    .eq('status', 'hold')

  if (resError || !reservations || reservations.length === 0) {
    return { status: 'expired' }
  }

  /* =====================
     4️⃣ Vérifier expiration
  ===================== */
  const expiresAt = reservations[0].expires_at

  if (new Date(expiresAt).getTime() <= Date.now()) {
    return { status: 'expired' }
  }

  /* =====================
     5️⃣ Pending valide
  ===================== */
  return {
    status: 'pending',
    expiresAt,
    seatCount: reservations.length
  }
})
