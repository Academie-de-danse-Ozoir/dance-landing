import Stripe from 'stripe'
import { buffer } from 'node:stream/consumers'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { ORDER_STATUS, SEAT_STATUS, ERROR_INVALID_REQUEST } from '../../constants'
import Mailjet from 'node-mailjet'
import type { TicketEmailData } from '../utils/ticketEmailTemplate'
import { buildTicketEmailHtml } from '../utils/ticketEmailTemplate'
import { buildTicketsDownloadUrl } from '../utils/ticketsLink'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC!,
  process.env.MJ_APIKEY_PRIVATE!
)

/** Formate un montant en centimes en chaîne lisible (ex: 15000 → "150,00 €") */
function formatAmount(cents: number, currency: string = 'eur'): string {
  const value = (cents / 100).toFixed(2).replace('.', ',')
  return currency.toUpperCase() === 'EUR' ? `${value} €` : `${value} ${currency.toUpperCase()}`
}

/** Formate une date pour l'affichage en français */
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

async function sendTicketEmail(data: TicketEmailData) {
  const html = buildTicketEmailHtml(data)
  await mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
            Email: 'thoma.lecornu@gmail.com',
            Name: 'Billetterie officielle – Spectacle de Danse d’Ozoir',
          },
          To: [{ Email: data.customerEmail }],
          Subject: 'Votre billet – Spectacle de Danse d\'Ozoir 🎭',
          HTMLPart: html,
        },
      ],
    })
}

export default defineEventHandler(async (event) => {
  const rawBody = await buffer(event.node.req)
  const signature = event.node.req.headers['stripe-signature'] as string

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: ERROR_INVALID_REQUEST })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    if (!orderId) return { received: true }
    if (session.payment_status !== ORDER_STATUS.PAID) return { received: true }

    const { data: order } = await supabaseAdmin
      .from('order')
      .select('id, status, email, ticket_sent')
      .eq('id', orderId)
      .single()

    if (!order) return { received: true }
    if (order.status === ORDER_STATUS.PAID) return { received: true }
    if (order.status === ORDER_STATUS.REFUNDED) return { received: true }

    // Vérifier réservations encore valides
    const { data: reservations } = await supabaseAdmin
      .from('seat_reservation')
      .select('id, expires_at')
      .eq('order_id', orderId)
      .eq('status', SEAT_STATUS.HOLD)

    const now = Date.now()

    const hasValidHolds =
      reservations &&
      reservations.length > 0 &&
      reservations.every(
        (r) => new Date(r.expires_at).getTime() > now
      )

    if (
      order.status === ORDER_STATUS.EXPIRED ||
      order.status === ORDER_STATUS.CANCELED ||
      !hasValidHolds
    ) {
      await supabaseAdmin
        .from('order')
        .update({ status: ORDER_STATUS.REFUNDED })
        .eq('id', orderId)

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent as { id?: string })?.id

      if (paymentIntentId) {
        try {
          await stripe.refunds.create({ payment_intent: paymentIntentId })
        } catch (e: any) {
          if (e?.code !== 'charge_already_refunded') console.error(e)
        }
      }

      if (reservations?.length) {
        await supabaseAdmin
          .from('seat_reservation')
          .delete()
          .eq('order_id', orderId)
          .eq('status', SEAT_STATUS.HOLD)
      }

      return { received: true }
    }

    // ✅ Paiement valide
    const { data: updatedOrder } = await supabaseAdmin
      .from('order')
      .update({ status: ORDER_STATUS.PAID })
      .eq('id', orderId)
      .select('id, email, ticket_sent')
      .single()

    await supabaseAdmin
      .from('seat_reservation')
      .update({ status: SEAT_STATUS.PAID, expires_at: null })
      .eq('order_id', orderId)
      .eq('status', SEAT_STATUS.HOLD)

    // 📧 Envoi email (anti-doublon)
    if (updatedOrder && !updatedOrder.ticket_sent) {
      const sessionId = session.id
      const currency = (session.currency ?? 'eur').toLowerCase()
      const amountTotal = session.amount_total ?? 0

      // Récupérer le reçu Stripe (lien PDF) et les line items
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
      } catch (_) {
        // Reçu non disponible (ex: mode test)
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
      } catch (_) {
        // Fallback si les line items ne sont pas disponibles
        lineItems.push({
          description: 'Spectacle de Danse d\'Ozoir',
          quantity: reservations!.length,
          unitPriceFormatted: formatAmount(amountTotal / Math.max(1, reservations!.length), currency),
          totalFormatted: formatAmount(amountTotal, currency)
        })
      }

      const ticketsUrl = buildTicketsDownloadUrl(updatedOrder.id)

      const emailData: TicketEmailData = {
        orderId: updatedOrder.id,
        customerEmail: updatedOrder.email,
        firstName: (order as { first_name?: string } | null)?.first_name ?? null,
        lastName: (order as { last_name?: string } | null)?.last_name ?? null,
        seatCount: reservations!.length,
        amountTotalFormatted: formatAmount(amountTotal, currency),
        currency,
        lineItems: lineItems.length > 0 ? lineItems : [{
          description: 'Billet(s) – Spectacle de Danse d\'Ozoir',
          quantity: reservations!.length,
          unitPriceFormatted: formatAmount(amountTotal / Math.max(1, reservations!.length), currency),
          totalFormatted: formatAmount(amountTotal, currency)
        }],
        ticketsUrl: ticketsUrl ?? null,
        receiptUrl: receiptUrl ?? null,
        stripeSessionId: sessionId,
        paymentStatus: session.payment_status ?? 'paid',
        paidAtFormatted: formatDate(new Date())
      }

      await sendTicketEmail(emailData)

      await supabaseAdmin
        .from('order')
        .update({ ticket_sent: true })
        .eq('id', updatedOrder.id)
    }
  }

  return { received: true }
})