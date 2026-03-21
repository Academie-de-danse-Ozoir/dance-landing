/**
 * Flux : commande PAID + sièges PAID + ticket_sent === false → envoi Mailjet (+ PDF) → si OK, ticket_sent = true.
 * (ticket_sent ne « déclenche » pas le mail : il marque que l’envoi a réussi.)
 * Appelé depuis le webhook Stripe (checkout.session.completed).
 */
import type Stripe from 'stripe'
import Mailjet from 'node-mailjet'
import { stripe } from '../lib/stripe'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ORDER_STATUS, SEAT_STATUS } from '../../constants'
import {
  brand,
  billetterieSenderName,
  emailAggregateLineDescription,
  emailTicketSubject
} from '../../locales/frDisplay'
import type { TicketEmailData } from './ticketEmailTemplate'
import { buildTicketEmailHtml } from './ticketEmailTemplate'
import { buildTicketPdfBuffer } from './ticketPdf'
import {
  appendPaidOrderRowToGoogleSheetIfConfigured,
  buildGoogleSheetsRegisterUrl
} from './googleSheetsAppendOrder'
import { sendAdminNewOrderNotificationIfConfigured } from './sendAdminNewOrderNotification'

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC!,
  process.env.MJ_APIKEY_PRIVATE!
)

const LOG = '[billetterie:mail]'

function formatAmount(cents: number, currency: string = 'eur'): string {
  const value = (cents / 100).toFixed(2).replace('.', ',')
  return currency.toUpperCase() === 'EUR' ? `${value} €` : `${value} ${currency.toUpperCase()}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** 8 premiers caractères de l’UUID — suffisant pour distinguer les sujets (évite le fil « conversation » Gmail). */
function orderRefShort(orderId: string): string {
  const first = orderId.split('-')[0]
  return first && first.length >= 8 ? first : orderId.slice(0, 8)
}

async function sendTicketEmail(data: TicketEmailData, pdfBuffer?: Buffer) {
  const ref = orderRefShort(data.orderId)
  console.info(`${LOG} Mailjet — envoi demandé`, {
    orderId: data.orderId,
    ref,
    to: data.customerEmail,
    hasPdf: !!pdfBuffer && pdfBuffer.length > 0,
    pdfBytes: pdfBuffer?.length ?? 0
  })

  const html = buildTicketEmailHtml(data)
  const message: Record<string, unknown> = {
    From: {
      Email: brand.senderEmail,
      Name: billetterieSenderName()
    },
    To: [{ Email: data.customerEmail }],
    Subject: emailTicketSubject(ref),
    HTMLPart: html,
    /** Mailjet : traçabilité ; un envoi par commande (pas de fusion avec un autre achat). */
    CustomID: data.orderId,
  }
  if (pdfBuffer && pdfBuffer.length > 0) {
    message.Attachments = [
      {
        ContentType: 'application/pdf',
        Filename: `billets-${data.orderId}.pdf`,
        Base64Content: pdfBuffer.toString('base64'),
      },
    ]
  }

  if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
    console.error(`${LOG} Variables MJ_APIKEY_PUBLIC / MJ_APIKEY_PRIVATE manquantes`)
    throw new Error('Mailjet: clés API manquantes')
  }

  try {
    const res = await mailjet.post('send', { version: 'v3.1' }).request({ Messages: [message] })
    const body = res.body as {
      Messages?: Array<{
        Status?: string
        Errors?: Array<{ ErrorMessage?: string; ErrorCode?: string; ErrorIdentifier?: string }>
        To?: Array<{ Email?: string; MessageUUID?: string; MessageID?: string }>
      }>
    }

    const first = body.Messages?.[0]
    const mjStatus = first?.Status
    const mjErrors = first?.Errors

    if (mjStatus !== 'success' || (mjErrors && mjErrors.length > 0)) {
      const detail =
        mjErrors?.map((e) => e.ErrorMessage ?? e.ErrorCode ?? String(e)).join(' | ') ||
        `Status Mailjet: ${mjStatus ?? '(absent)'}`
      console.error(`${LOG} Mailjet — refus dans le corps de réponse (pas d’envoi réel)`, {
        orderId: data.orderId,
        to: data.customerEmail,
        detail,
        full: JSON.stringify(body).slice(0, 2000)
      })
      throw new Error(`Mailjet: ${detail}`)
    }

    const messageUuid = first?.To?.[0]?.MessageUUID
    console.info(`${LOG} Mailjet — accepté pour envoi`, {
      orderId: data.orderId,
      to: data.customerEmail,
      messageUuid,
      hint: 'Si le mail n’arrive pas : courrier indésirable, expéditeur à valider sur app.mailjet.com, stats Mailjet.'
    })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; response?: { body?: unknown }; message?: string }
    console.error(`${LOG} Mailjet — ERREUR`, {
      orderId: data.orderId,
      to: data.customerEmail,
      statusCode: e?.statusCode,
      message: e?.message,
      body: e?.response?.body != null ? JSON.stringify(e.response.body).slice(0, 1500) : undefined
    })
    throw err
  }
}

export type SendPaidOrderTicketEmailResult =
  | { sent: true }
  | { sent: false; reason: 'order_not_found' | 'not_paid' | 'already_sent' | 'no_seats' | 'no_email' }

/**
 * Envoie l’email billet si commande PAID et ticket_sent false.
 */
export async function sendPaidOrderTicketEmailIfNeeded(
  session: Stripe.Checkout.Session,
  orderId: string
): Promise<SendPaidOrderTicketEmailResult> {
  const { data: order, error } = await supabaseAdmin
    .from('order')
    .select('id, status, email, ticket_sent, first_name, last_name, phone')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return { sent: false, reason: 'order_not_found' }
  }

  if (order.status !== ORDER_STATUS.PAID) {
    return { sent: false, reason: 'not_paid' }
  }

  if (order.ticket_sent) {
    return { sent: false, reason: 'already_sent' }
  }

  if (!order.email?.trim()) {
    console.warn(`${LOG} sendPaidOrderTicketEmailIfNeeded — pas d’email client`, { orderId })
    return { sent: false, reason: 'no_email' }
  }

  const { data: paidRows } = await supabaseAdmin
    .from('seat_reservation')
    .select('seat_id')
    .eq('order_id', orderId)
    .eq('status', SEAT_STATUS.PAID)

  const seatIds = (paidRows ?? []).map((r) => r.seat_id)
  const seatCount = seatIds.length

  if (seatCount === 0) {
    console.warn(`${LOG} sendPaidOrderTicketEmailIfNeeded — aucun siège PAID`, { orderId })
    return { sent: false, reason: 'no_seats' }
  }

  const sessionId = session.id
  const currency = (session.currency ?? 'eur').toLowerCase()
  const amountTotal = session.amount_total ?? 0

  let receiptUrl: string | null = null
  const lineItems: TicketEmailData['lineItems'] = []

  try {
    const sessionWithCharge = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge']
    }) as Stripe.Checkout.Session & {
      payment_intent?: { latest_charge?: { receipt_url?: string } }
    }
    const charge = sessionWithCharge.payment_intent?.latest_charge
    if (charge && typeof charge === 'object' && 'receipt_url' in charge) {
      receiptUrl = charge.receipt_url ?? null
    }
  } catch {
    /* reçu indispo */
  }

  try {
    const { data: items } = await stripe.checkout.sessions.listLineItems(sessionId)
    if (items?.length) {
      for (const item of items) {
        const qty = item.quantity ?? 1
        const totalCents = item.amount_total ?? 0
        const unitCents = qty > 0 ? Math.round(totalCents / qty) : 0
        lineItems.push({
          description: item.description ?? 'Billet',
          quantity: qty,
          unitPriceFormatted: formatAmount(unitCents, currency),
          totalFormatted: formatAmount(totalCents, currency)
        })
      }
    }
  } catch {
    lineItems.push({
      description: brand.spectacleName,
      quantity: seatCount,
      unitPriceFormatted: formatAmount(amountTotal / Math.max(1, seatCount), currency),
      totalFormatted: formatAmount(amountTotal, currency)
    })
  }

  const firstName = order.first_name ?? null
  const lastName = order.last_name ?? null
  const customerName = [firstName, lastName].filter(Boolean).join(' ') || null
  const paidAtFormatted = formatDate(new Date())
  const amountTotalFormatted = formatAmount(amountTotal, currency)

  const emailData: TicketEmailData = {
    orderId: order.id,
    customerEmail: order.email,
    firstName,
    lastName,
    seatCount,
    amountTotalFormatted,
    currency,
    lineItems: lineItems.length > 0 ? lineItems : [{
      description: emailAggregateLineDescription(),
      quantity: seatCount,
      unitPriceFormatted: formatAmount(amountTotal / Math.max(1, seatCount), currency),
      totalFormatted: formatAmount(amountTotal, currency)
    }],
    ticketsUrl: null,
    ticketsInAttachment: true,
    receiptUrl: receiptUrl ?? null,
    stripeSessionId: sessionId,
    paymentStatus: session.payment_status ?? 'paid',
    paidAtFormatted
  }

  type TicketRow = {
    seatLabel: string
    firstName: string | null
    lastName: string | null
    ticketType: 'adult' | 'child' | null
  }
  let tickets: TicketRow[] = []
  try {
    const [{ data: orderWithAttendees }, { data: seats }] = await Promise.all([
      supabaseAdmin.from('order').select('ticket_attendees').eq('id', order.id).single(),
      supabaseAdmin.from('seat').select('id, label').in('id', seatIds)
    ])
    const labelById = new Map((seats ?? []).map((s) => [s.id, s.label]))
    const attendees = (orderWithAttendees as { ticket_attendees?: Record<string, { firstName?: string; lastName?: string; ticketType?: string }> } | null)?.ticket_attendees
    tickets = seatIds.map((seatId) => {
      const label = labelById.get(seatId) ?? seatId
      const att = attendees?.[seatId]
      return {
        seatLabel: label,
        firstName: att?.firstName ?? null,
        lastName: att?.lastName ?? null,
        ticketType: (att?.ticketType === 'adult' || att?.ticketType === 'child' ? att.ticketType : null) as 'adult' | 'child' | null
      }
    })
  } catch (e) {
    console.error(`${LOG} Chargement détails billets (PDF / admin):`, e)
  }

  let pdfBuffer: Buffer | undefined
  const seatLabels = tickets.map((t) => t.seatLabel)
  if (seatLabels.length > 0) {
    try {
      pdfBuffer = await buildTicketPdfBuffer({
        orderId: order.id,
        seatLabels,
        tickets,
        customerName: customerName ?? undefined,
        customerEmail: order.email ?? undefined,
        customerPhone: order.phone ?? undefined,
        amountTotalFormatted,
        paidAtFormatted,
        eventDate: brand.eventDate,
        eventVenue: brand.eventVenue,
        lineItems: lineItems.length > 0 ? lineItems : undefined
      })
    } catch (e) {
      console.error(`${LOG} Génération PDF billets:`, e)
    }
  }

  await sendTicketEmail(emailData, pdfBuffer)

  const registerUrl = buildGoogleSheetsRegisterUrl()

  const ticketsDetailLines = tickets.map((t) => {
    const n = [t.firstName, t.lastName].filter(Boolean).join(' ') || '—'
    const typ = t.ticketType === 'child' ? 'Enfant' : t.ticketType === 'adult' ? 'Adulte' : '—'
    return `${t.seatLabel}: ${n} (${typ})`
  })
  const seatLabelsJoined = seatLabels.length > 0 ? seatLabels.join(', ') : '—'

  const [adminResult, sheetResult] = await Promise.allSettled([
    sendAdminNewOrderNotificationIfConfigured({
      orderRefShort: orderRefShort(order.id),
      registerUrl,
      emailData,
      customerPhone: order.phone ?? null,
      seatLabelsJoined,
      ticketsDetailLines
    }),
    appendPaidOrderRowToGoogleSheetIfConfigured({
      orderId: order.id,
      buyerLastName: lastName?.trim() ?? '',
      buyerFirstName: firstName?.trim() ?? '',
      buyerEmail: order.email,
      buyerPhone: order.phone?.trim() ?? '',
      seats:
        tickets.length > 0
          ? tickets.map((t) => ({
              seatLabel: String(t.seatLabel),
              attendeeFirstName: t.firstName?.trim() ?? '',
              attendeeLastName: t.lastName?.trim() ?? '',
              ticketTypeLabel:
                t.ticketType === 'child' ? 'Enfant' : t.ticketType === 'adult' ? 'Adulte' : '—'
            }))
          : seatIds.map((id) => ({
              seatLabel: String(id),
              attendeeFirstName: '',
              attendeeLastName: '',
              ticketTypeLabel: '—'
            }))
    })
  ])
  if (sheetResult.status === 'rejected') {
    console.error(`${LOG} append Google Sheet — promesse rejetée`, {
      orderId: order.id,
      reason: sheetResult.reason
    })
  }
  if (adminResult.status === 'rejected') {
    console.error(`${LOG} email admin — promesse rejetée`, { orderId: order.id, reason: adminResult.reason })
  }

  const { error: ticketSentErr } = await supabaseAdmin
    .from('order')
    .update({ ticket_sent: true })
    .eq('id', order.id)

  if (ticketSentErr) {
    console.error(`${LOG} Échec update ticket_sent — voir supabase/order_ticket_sent.sql`, ticketSentErr)
    throw ticketSentErr
  }

  console.info(`${LOG} sendPaidOrderTicketEmailIfNeeded — OK (ticket_sent=true)`, { orderId: order.id })
  return { sent: true }
}
