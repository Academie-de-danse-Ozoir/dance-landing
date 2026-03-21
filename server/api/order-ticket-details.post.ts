/**
 * Enregistre les détails par billet (titulaire + type adulte/enfant).
 * Nécessite sur la table `order` une colonne JSONB `ticket_attendees` :
 * { [seatId]: { firstName, lastName, ticketType } }
 */
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ORDER_STATUS, SEAT_STATUS, RATE_LIMIT_ORDER_TICKET_DETAILS_PER_MINUTE } from '../../constants'
import { tApiError } from '../../locales/frDisplay'
import { checkRateLimit, getClientIp } from '../utils/rateLimit'

type TicketPayload = {
  seatId: string
  firstName: string
  lastName: string
  ticketType: 'adult' | 'child'
}

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!checkRateLimit(ip, 'ticket-details', RATE_LIMIT_ORDER_TICKET_DETAILS_PER_MINUTE).ok) {
    throw createError({ statusCode: 429, statusMessage: tApiError('rateLimit') })
  }

  const body = await readBody(event)
  const { orderId, orderToken: rawToken, tickets } = body as {
    orderId?: string
    orderToken?: string
    tickets?: TicketPayload[]
  }

  const orderToken =
    typeof rawToken === 'string' ? rawToken.trim() : rawToken != null ? String(rawToken).trim() : ''

  if (!orderId || !orderToken || !Array.isArray(tickets) || tickets.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: !orderToken ? tApiError('missingOrderToken') : tApiError('orderAndTicketsRequired')
    })
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select('id, status')
    .eq('id', orderId)
    .eq('order_token', orderToken)
    .single()

  if (orderError || !order || order.status !== ORDER_STATUS.PENDING) {
    throw createError({
      statusCode: 404,
      statusMessage: tApiError('orderNotFound')
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
      statusMessage: tApiError('seatsUnavailable')
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
      statusMessage: tApiError('ticketDetailsSaveFailed')
    })
  }

  return { ok: true }
})
