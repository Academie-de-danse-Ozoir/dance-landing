// server/api/cancel-order.post.ts
import { supabaseAdmin } from '../lib/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const { orderId } = await readBody(event)

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing orderId'
    })
  }

  /* =====================
     1) Charger la commande
  ===================== */
  const { data: order, error } = await supabaseAdmin
    .from('order')
    .select('id, status')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return { ok: true } // idempotent
  }

  /* =====================
     2) Sécurité : commande payée = INTERDIT
  ===================== */
  if (order.status === 'paid') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Paid order cannot be cancelled'
    })
  }

  /* =====================
     3) Supprimer les réservations
  ===================== */
  await supabaseAdmin
    .from('seat_reservation')
    .delete()
    .eq('order_id', orderId)

  /* =====================
     4) SUPPRIMER LA COMMANDE
  ===================== */
  await supabaseAdmin
    .from('order')
    .delete()
    .eq('id', orderId)

  return { ok: true }
})
