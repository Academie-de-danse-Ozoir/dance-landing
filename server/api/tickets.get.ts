import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ORDER_STATUS, SEAT_STATUS } from '../../constants'
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
    .select('id, status')
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

  const pdfBuffer = await buildTicketPdfBuffer({
    orderId: order.id,
    seatLabels,
    customerName: undefined
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
