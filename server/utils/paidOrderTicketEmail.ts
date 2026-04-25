/**
 * Flux : commande PAID + sièges PAID + ticket_sent === false → envoi Mailjet (+ PDF) → si OK, ticket_sent = true.
 * (ticket_sent ne « déclenche » pas le mail : il marque que l’envoi a réussi.)
 * Appelé depuis le webhook Stripe (checkout.session.completed) ou depuis l’espace billeterie orga (gratuit).
 */
import type Stripe from 'stripe'
import Mailjet from 'node-mailjet'
import { stripe } from '../lib/stripe'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  ORDER_STATUS,
  PRICE_ADULT_CENTS,
  PRICE_CHILD_CENTS,
  SEAT_STATUS
} from '../../constants'
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
  appendPaidPaymentRowToGoogleSheetIfConfigured,
  buildGoogleSheetsRegisterUrl
} from './googleSheetsAppendOrder'
import { sendAdminNewOrderNotificationIfConfigured } from './sendAdminNewOrderNotification'
import { formatFrenchPhoneForDisplay } from '../../utils/phoneInput'

const mailjet = Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC!, process.env.MJ_APIKEY_PRIVATE!)

function formatAmount(cents: number, currency: string = 'eur'): string {
  const value = (cents / 100).toFixed(2).replace('.', ',')
  return currency.toUpperCase() === 'EUR' ? `${value} €` : `${value} ${currency.toUpperCase()}`
}

function formatAmountDecimal(cents: number): string {
  return (cents / 100).toFixed(2)
}

function formatSeatLabelsForSheet(labels: string[]): string {
  if (labels.length === 0) return '—'
  const chunks: string[] = []
  for (let i = 0; i < labels.length; i += 5) {
    chunks.push(labels.slice(i, i + 5).join(', '))
  }
  return chunks.join('\n')
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

type OrderEmailRow = {
  id: string
  status: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
}

type PaymentEmailDetails = {
  amountTotal: number
  amountSubtotal: number
  amountTax: number
  amountNet: number
  vatRatePercent: string
  currency: string
  lineItems: TicketEmailData['lineItems']
  receiptUrl: string | null
  stripeSessionId: string | null
  paymentStatus: string
}

async function sendTicketEmail(data: TicketEmailData, pdfBuffer?: Buffer) {
  const ref = orderRefShort(data.orderId)
  void ref

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
    CustomID: data.orderId
  }
  if (pdfBuffer && pdfBuffer.length > 0) {
    message.Attachments = [
      {
        ContentType: 'application/pdf',
        Filename: `billets-${data.orderId}.pdf`,
        Base64Content: pdfBuffer.toString('base64')
      }
    ]
  }

  if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
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
      throw new Error(`Mailjet: ${detail}`)
    }
  } catch (err: unknown) {
    throw err
  }
}

export type SendPaidOrderTicketEmailResult =
  | { sent: true }
  | {
      sent: false
      reason: 'order_not_found' | 'not_paid' | 'already_sent' | 'no_seats' | 'no_email'
    }

async function buildPaymentDetailsFromStripeSession(
  session: Stripe.Checkout.Session,
  seatCount: number
): Promise<PaymentEmailDetails> {
  const sessionId = session.id
  const currency = (session.currency ?? 'eur').toLowerCase()
  const amountTotal = session.amount_total ?? 0
  const amountSubtotal = session.amount_subtotal ?? amountTotal
  const amountTax = session.total_details?.amount_tax ?? Math.max(0, amountTotal - amountSubtotal)
  const amountNet = Math.max(0, amountTotal - amountTax)
  const vatRatePercent =
    amountNet > 0 && amountTax > 0 ? ((amountTax / amountNet) * 100).toFixed(2) : '0.00'

  let receiptUrl: string | null = null
  const lineItems: TicketEmailData['lineItems'] = []

  try {
    const sessionWithCharge = (await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge']
    })) as Stripe.Checkout.Session & {
      payment_intent?: { id?: string; latest_charge?: { receipt_url?: string } }
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

  return {
    amountTotal,
    amountSubtotal,
    amountTax,
    amountNet,
    vatRatePercent,
    currency,
    lineItems,
    receiptUrl,
    stripeSessionId: sessionId,
    paymentStatus: session.payment_status ?? 'paid'
  }
}

/**
 * Montants = tarif catalogue (comme la vente publique), pour traçabilité email / PDF / Sheets,
 * même si l’encaissement réel est 0 € (réservation orga sans paiement).
 */
function buildPaymentDetailsAdminFree(
  adultCount: number,
  childCount: number
): PaymentEmailDetails {
  const currency = 'eur'
  const lineItems: TicketEmailData['lineItems'] = []
  if (adultCount > 0) {
    const lineTotal = adultCount * PRICE_ADULT_CENTS
    lineItems.push({
      description: brand.stripeLineAdult,
      quantity: adultCount,
      unitPriceFormatted: formatAmount(PRICE_ADULT_CENTS, currency),
      totalFormatted: formatAmount(lineTotal, currency)
    })
  }
  if (childCount > 0) {
    const lineTotal = childCount * PRICE_CHILD_CENTS
    lineItems.push({
      description: brand.stripeLineChild,
      quantity: childCount,
      unitPriceFormatted: formatAmount(PRICE_CHILD_CENTS, currency),
      totalFormatted: formatAmount(lineTotal, currency)
    })
  }

  const amountTotal = adultCount * PRICE_ADULT_CENTS + childCount * PRICE_CHILD_CENTS

  return {
    amountTotal,
    amountSubtotal: amountTotal,
    amountTax: 0,
    amountNet: amountTotal,
    vatRatePercent: '0.00',
    currency,
    lineItems,
    receiptUrl: null,
    stripeSessionId: null,
    paymentStatus: 'no_payment_required'
  }
}

type PrepareResult =
  | { ok: true; order: OrderEmailRow; seatIds: string[] }
  | { ok: false; result: SendPaidOrderTicketEmailResult }

async function tryPreparePaidOrderTicketSend(orderId: string): Promise<PrepareResult> {
  const { data: order, error } = await supabaseAdmin
    .from('order')
    .select('id, status, email, ticket_sent, first_name, last_name, phone')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return { ok: false, result: { sent: false, reason: 'order_not_found' } }
  }

  if (order.status !== ORDER_STATUS.PAID) {
    return { ok: false, result: { sent: false, reason: 'not_paid' } }
  }

  const { data: lockedOrder, error: lockError } = await supabaseAdmin
    .from('order')
    .update({ ticket_sent: true })
    .eq('id', order.id)
    .eq('ticket_sent', false)
    .select('id')
    .single()

  if (lockError || !lockedOrder) {
    return { ok: false, result: { sent: false, reason: 'already_sent' } }
  }

  if (!order.email?.trim()) {
    return { ok: false, result: { sent: false, reason: 'no_email' } }
  }

  const { data: paidRows } = await supabaseAdmin
    .from('seat_reservation')
    .select('seat_id')
    .eq('order_id', orderId)
    .eq('status', SEAT_STATUS.PAID)

  const seatIds = (paidRows ?? []).map((r) => r.seat_id)
  if (seatIds.length === 0) {
    return { ok: false, result: { sent: false, reason: 'no_seats' } }
  }

  return { ok: true, order, seatIds }
}

async function completePaidOrderTicketDelivery(
  order: OrderEmailRow,
  orderId: string,
  seatIds: string[],
  details: PaymentEmailDetails
): Promise<SendPaidOrderTicketEmailResult> {
  const seatCount = seatIds.length
  const {
    amountTotal,
    amountSubtotal,
    amountTax,
    amountNet,
    vatRatePercent,
    currency,
    lineItems: rawLineItems
  } = details
  const { receiptUrl, stripeSessionId, paymentStatus } = details

  const lineItems: TicketEmailData['lineItems'] =
    rawLineItems.length > 0
      ? rawLineItems
      : [
          {
            description: emailAggregateLineDescription(),
            quantity: seatCount,
            unitPriceFormatted: formatAmount(amountTotal / Math.max(1, seatCount), currency),
            totalFormatted: formatAmount(amountTotal, currency)
          }
        ]

  const firstName = order.first_name ?? null
  const lastName = order.last_name ?? null
  const customerName = [firstName, lastName].filter(Boolean).join(' ') || null
  const paidAtFormatted = formatDate(new Date())
  const amountTotalFormatted = formatAmount(amountTotal, currency)

  const publicSiteFromEnv =
    process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    process.env.NUXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const vercelUrl = process.env.VERCEL_URL?.trim()
  const vercelBase = vercelUrl
    ? (vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`).replace(/\/$/, '')
    : undefined

  const emailData: TicketEmailData = {
    orderId: order.id,
    customerEmail: order.email!,
    firstName,
    lastName,
    seatCount,
    amountTotalFormatted,
    currency,
    publicSiteUrl: publicSiteFromEnv || vercelBase,
    lineItems,
    ticketsUrl: null,
    ticketsInAttachment: true,
    receiptUrl: receiptUrl ?? null,
    stripeSessionId: stripeSessionId ?? null,
    paymentStatus,
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
    const attendees = (
      orderWithAttendees as {
        ticket_attendees?: Record<
          string,
          { firstName?: string; lastName?: string; ticketType?: string }
        >
      } | null
    )?.ticket_attendees
    tickets = seatIds.map((seatId) => {
      const label = labelById.get(seatId) ?? seatId
      const att = attendees?.[seatId]
      return {
        seatLabel: label,
        firstName: att?.firstName ?? null,
        lastName: att?.lastName ?? null,
        ticketType: (att?.ticketType === 'adult' || att?.ticketType === 'child'
          ? att.ticketType
          : null) as 'adult' | 'child' | null
      }
    })
  } catch {
    // ignore optional ticket detail loading failures
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
    } catch {
      // ignore PDF generation failures
    }
  }

  await sendTicketEmail(emailData, pdfBuffer)

  const registerUrl = buildGoogleSheetsRegisterUrl()
  const phoneForSheets = formatFrenchPhoneForDisplay(order.phone) || order.phone?.trim() || ''

  const ticketsDetailLines = tickets.map((t) => {
    const n = [t.firstName, t.lastName].filter(Boolean).join(' ') || '—'
    const typ = t.ticketType === 'child' ? 'Enfant' : t.ticketType === 'adult' ? 'Adulte' : '—'
    return `${t.seatLabel}: ${n} (${typ})`
  })
  const seatLabelsJoined = formatSeatLabelsForSheet(seatLabels)
  const [adminResult, sheetResult, paymentSheetResult] = await Promise.allSettled([
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
      buyerEmail: order.email!,
      buyerPhone: phoneForSheets,
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
    }),
    appendPaidPaymentRowToGoogleSheetIfConfigured({
      paidAtIso: new Date().toISOString(),
      orderId: order.id,
      amountTotalEuros: formatAmountDecimal(amountTotal),
      amountSubtotalEuros: formatAmountDecimal(amountSubtotal),
      amountTaxEuros: formatAmountDecimal(amountTax),
      amountNetEuros: formatAmountDecimal(amountNet),
      vatRatePercent,
      currency,
      seatCount,
      customerEmail: order.email!,
      customerName: customerName ?? '',
      customerPhone: phoneForSheets,
      seatLabelsJoined,
      receiptUrl: receiptUrl ?? ''
    })
  ])
  void adminResult
  void sheetResult
  void paymentSheetResult
  return { sent: true }
}

/**
 * Envoie l’email billet si commande PAID et ticket_sent false.
 */
export async function sendPaidOrderTicketEmailIfNeeded(
  session: Stripe.Checkout.Session,
  orderId: string
): Promise<SendPaidOrderTicketEmailResult> {
  const prep = await tryPreparePaidOrderTicketSend(orderId)
  if (!prep.ok) {
    return prep.result
  }
  const details = await buildPaymentDetailsFromStripeSession(session, prep.seatIds.length)
  return completePaidOrderTicketDelivery(prep.order, orderId, prep.seatIds, details)
}

/**
 * Même parcours d’envoi (Mailjet, PDF, feuilles, notif orga) sans session Stripe (réservation offerte côté billeterie).
 */
export async function sendPaidOrderTicketEmailForAdminFreeOrder(
  orderId: string,
  adultCount: number,
  childCount: number
): Promise<SendPaidOrderTicketEmailResult> {
  const prep = await tryPreparePaidOrderTicketSend(orderId)
  if (!prep.ok) {
    return prep.result
  }
  const details = buildPaymentDetailsAdminFree(adultCount, childCount)
  return completePaidOrderTicketDelivery(prep.order, orderId, prep.seatIds, details)
}
