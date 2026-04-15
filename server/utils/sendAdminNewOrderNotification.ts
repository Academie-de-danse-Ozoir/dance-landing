import Mailjet from 'node-mailjet'
import fr from '../../locales/fr.json'
import { brand, billetterieSenderName } from '../../locales/frDisplay'
import { escapeHtml } from './htmlEscape'
import type { TicketEmailData } from './ticketEmailTemplate'

const LOG = '[billetterie:admin-mail]'

/** Destinataire fixe pour les notifications de nouvelle commande (admin). */
const ADMIN_ORDER_NOTIFICATION_EMAIL = 'spectacle.academiedanseozoir@gmail.com'

const mailjet = Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC!, process.env.MJ_APIKEY_PRIVATE!)

const a = fr.admin

function adminSubject(orderRefShort: string): string {
  return a.newOrderEmailSubject
    .replace(/\{\{ref\}\}/g, orderRefShort)
    .replace(/\{\{spectacle\}\}/g, brand.spectacleName)
}

export type AdminNotificationInput = {
  orderRefShort: string
  registerUrl: string | null
  emailData: TicketEmailData
  customerPhone: string | null
  seatLabelsJoined: string
  ticketsDetailLines: string[]
}

function buildLineItemsRows(data: TicketEmailData): string {
  return data.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;">${escapeHtml(item.description)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;text-align:right;">${escapeHtml(item.unitPriceFormatted)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;text-align:right;">${escapeHtml(item.totalFormatted)}</td>
    </tr>`
    )
    .join('')
}

function buildHtml(input: AdminNotificationInput): string {
  const { emailData, registerUrl, ticketsDetailLines } = input
  const d = emailData
  const contactName = [d.firstName, d.lastName].filter(Boolean).join(' ') || '—'
  const ticketsBlock = ticketsDetailLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')

  const registerBlock = registerUrl
    ? `
    <p style="margin:24px 0 8px;font-size:14px;color:#1c1917;font-weight:600;">${escapeHtml(a.registerLinkIntro)}</p>
    <p style="margin:0;">
      <a href="${escapeHtml(registerUrl)}" style="display:inline-block;padding:12px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${escapeHtml(a.registerLinkCta)}</a>
    </p>`
    : ''

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;background:#f5f3f0;color:#1c1917;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <h1 style="margin:0 0 20px;font-size:20px;">${escapeHtml(a.newOrderEmailTitle)}</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#57534e;">${escapeHtml(brand.spectacleName)}</p>
    <table style="width:100%;font-size:14px;margin-bottom:20px;">
      <tr><td style="padding:6px 0;color:#78716c;width:40%;">${escapeHtml(a.labelOrderId)}</td><td style="padding:6px 0;"><code>${escapeHtml(d.orderId)}</code></td></tr>
      <tr><td style="padding:6px 0;color:#78716c;">${escapeHtml(a.labelPaidAt)}</td><td style="padding:6px 0;">${escapeHtml(d.paidAtFormatted)}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c;">${escapeHtml(a.labelContactEmail)}</td><td style="padding:6px 0;">${escapeHtml(d.customerEmail)}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c;">${escapeHtml(a.labelContactPhone)}</td><td style="padding:6px 0;">${escapeHtml(input.customerPhone?.trim() || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c;">${escapeHtml(a.labelContactName)}</td><td style="padding:6px 0;">${escapeHtml(contactName)}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c;">${escapeHtml(a.labelSeatCount)}</td><td style="padding:6px 0;">${d.seatCount}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c;">${escapeHtml(a.labelSeats)}</td><td style="padding:6px 0;">${escapeHtml(input.seatLabelsJoined)}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c;">${escapeHtml(a.labelAmount)}</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(d.amountTotalFormatted)}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c;">${escapeHtml(a.labelStripeSession)}</td><td style="padding:6px 0;font-size:12px;word-break:break-all;">${escapeHtml(d.stripeSessionId ?? '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c;">${escapeHtml(a.labelEvent)}</td><td style="padding:6px 0;">${escapeHtml(brand.eventDate)} — ${escapeHtml(brand.eventVenue)}</td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#78716c;">${escapeHtml(a.labelTicketHolders)}</p>
    <ul style="margin:0 0 20px;padding-left:20px;">${ticketsBlock}</ul>
    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#78716c;">Détail paiement (Stripe)</p>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <thead><tr style="background:#fafaf9;">
        <th style="text-align:left;padding:8px 12px;">Désignation</th>
        <th style="text-align:center;padding:8px 12px;">Qté</th>
        <th style="text-align:right;padding:8px 12px;">P.U.</th>
        <th style="text-align:right;padding:8px 12px;">Total</th>
      </tr></thead>
      <tbody>${buildLineItemsRows(d)}</tbody>
    </table>
    ${registerBlock}
  </div>
</body></html>`
}

/**
 * Envoie un email à l’administrateur (adresse fixe), indépendamment du client.
 * N’échoue pas le flux billet si Mailjet refuse (log seulement).
 */
export async function sendAdminNewOrderNotificationIfConfigured(
  input: AdminNotificationInput
): Promise<void> {
  if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
    console.warn(`${LOG} Mailjet non configuré — email admin ignoré`)
    return
  }

  const html = buildHtml(input)
  const subject = adminSubject(input.orderRefShort)

  try {
    const res = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: { Email: brand.senderEmail, Name: billetterieSenderName() },
          To: [{ Email: ADMIN_ORDER_NOTIFICATION_EMAIL }],
          Subject: subject,
          HTMLPart: html,
          CustomID: `admin-${input.emailData.orderId}`
        }
      ]
    })
    const body = res.body as {
      Messages?: Array<{ Status?: string; Errors?: unknown }>
    }
    const first = body.Messages?.[0]
    if (first?.Status !== 'success') {
      console.error(`${LOG} Mailjet refus`, {
        orderId: input.emailData.orderId,
        body: JSON.stringify(body).slice(0, 1500)
      })
      return
    }
    console.info(`${LOG} Envoyé`, {
      orderId: input.emailData.orderId,
      to: ADMIN_ORDER_NOTIFICATION_EMAIL
    })
  } catch (e) {
    console.error(`${LOG} Erreur`, { orderId: input.emailData.orderId, e })
  }
}
