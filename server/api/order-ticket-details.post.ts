/**
 * Enregistre les détails par billet (titulaire + type adulte/enfant).
 * Nécessite sur la table `order` une colonne JSONB `ticket_attendees` :
 * { [seatId]: { firstName, lastName, ticketType } }
 */
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ORDER_STATUS, SEAT_STATUS, ERROR_ORDER_NOT_FOUND, ERROR_SEATS_UNAVAILABLE } from '../../constants'

type TicketPayload = {
  seatId: string
  firstName: string
  lastName: string
  ticketType: 'adult' | 'child'
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { orderId, tickets } = body as { orderId: string; tickets: TicketPayload[] }

  if (!orderId || !Array.isArray(tickets) || tickets.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'orderId et tickets requis.'
    })
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select('id, status')
    .eq('id', orderId)
    .single()

  if (orderError || !order || order.status !== ORDER_STATUS.PENDING) {
    throw createError({
      statusCode: 404,
      statusMessage: ERROR_ORDER_NOT_FOUND
    })
  }

  const { data: reservations } = await supabaseAdmin
    .from('seat_reservation')
    .select('seat_id')
    .eq('order_id', orderId)
    .eq('status', SEAT_STATUS.HOLD)

  const reservationSeatIds = new Set((reservations ?? []).map((r) => r.seat_id))
  const payloadSeatIds = new Set(tickets.map((t) => t.seatId))

  if (
    payloadSeatIds.size !== reservationSeatIds.size ||
    [...payloadSeatIds].some((id) => !reservationSeatIds.has(id))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: ERROR_SEATS_UNAVAILABLE
    })
  }

  const ticketAttendees: Record<string, { firstName: string; lastName: string; ticketType: string }> = {}
  for (const t of tickets) {
    ticketAttendees[t.seatId] = {
      firstName: String(t.firstName).trim(),
      lastName: String(t.lastName).trim(),
      ticketType: t.ticketType
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('order')
    .update({ ticket_attendees: ticketAttendees })
    .eq('id', orderId)

  if (updateError) {
    console.error('order-ticket-details update:', updateError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible d\'enregistrer les détails des billets.'
    })
  }

  return { ok: true }
})
