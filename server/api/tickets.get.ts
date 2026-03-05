import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ORDER_STATUS, SEAT_STATUS, EVENT_DATE, EVENT_VENUE } from '../../constants'
import { buildTicketPdfBuffer } from '../utils/ticketPdf'
import { verifyTicketsSignature } from '../utils/ticketsLink'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const orderId = query.orderId as string
  const exp = parseInt(query.exp as string, 10)
  const sig = query.sig as string

  const secret = process.env.TICKETS_LINK_SECRET
  if (!secret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Téléchargement des billets non configuré.'
    })
  }

  if (!orderId || !exp || !sig) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Lien de téléchargement invalide.'
    })
  }

  if (!verifyTicketsSignature(orderId, exp, sig, secret)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Lien de téléchargement invalide ou expiré.'
    })
  }

  const now = Math.floor(Date.now() / 1000)
  if (exp < now) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Ce lien de téléchargement a expiré.'
    })
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('order')
    .select('id, status, email, first_name, last_name, phone, ticket_attendees')
    .eq('id', orderId)
    .single()

  if (orderError || !order || order.status !== ORDER_STATUS.PAID) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commande introuvable ou non payée.'
    })
  }

  const { data: reservations, error: resError } = await supabaseAdmin
    .from('seat_reservation')
    .select('seat_id')
    .eq('order_id', orderId)
    .eq('status', SEAT_STATUS.PAID)

  if (resError || !reservations || reservations.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Aucune place trouvée pour cette commande.'
    })
  }

  const seatIds = reservations.map((r) => r.seat_id)
  const { data: seats, error: seatsError } = await supabaseAdmin
    .from('seat')
    .select('id, label')
    .in('id', seatIds)

  if (seatsError || !seats || seats.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de charger les places.'
    })
  }

  const labelById = new Map(seats.map((s) => [s.id, s.label]))
  const seatLabels = seatIds
    .map((id) => labelById.get(id))
    .filter((l): l is string => typeof l === 'string')

  const attendees = (order as { ticket_attendees?: Record<string, { firstName?: string; lastName?: string; ticketType?: string }> }).ticket_attendees
  const tickets = seatIds.map((seatId) => {
    const label = labelById.get(seatId) ?? seatId
    const att = attendees?.[seatId]
    return {
      seatLabel: label,
      firstName: att?.firstName ?? null,
      lastName: att?.lastName ?? null,
      ticketType: (att?.ticketType === 'adult' || att?.ticketType === 'child' ? att.ticketType : null) as 'adult' | 'child' | null
    }
  })

  const customerName =
    order.first_name || order.last_name
      ? [order.first_name, order.last_name].filter(Boolean).join(' ')
      : null

  const pdfBuffer = await buildTicketPdfBuffer({
    orderId: order.id,
    seatLabels,
    tickets,
    customerName: customerName ?? undefined,
    customerEmail: order.email ?? undefined,
    customerPhone: order.phone ?? undefined,
    eventDate: EVENT_DATE,
    eventVenue: EVENT_VENUE
  })

  setResponseHeader(event, 'Content-Type', 'application/pdf')
  setResponseHeader(
    event,
    'Content-Disposition',
    `attachment; filename="billets-${orderId}.pdf"`
  )
  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  return pdfBuffer
})
