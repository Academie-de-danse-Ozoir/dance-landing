import { supabaseAdmin } from '../lib/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const { orderId } = await readBody(event)

  if (!orderId) return { ok: true }

  const { data: order } = await supabaseAdmin
    .from('order')
    .select('id, status')
    .eq('id', orderId)
    .single()

  if (!order) return { ok: true }

  if (order.status === 'paid') return { ok: true }

  if (order.status !== 'pending') return { ok: true }

  await supabaseAdmin
    .from('seat_reservation')
    .delete()
    .eq('order_id', orderId)

  await supabaseAdmin
    .from('order')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  return { ok: true }
})
