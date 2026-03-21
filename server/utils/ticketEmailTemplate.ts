/**
 * Données pour l'email de confirmation de billet
 * Spectacle de Danse d'Ozoir – Billetterie officielle
 */
export interface TicketEmailLineItem {
  description: string
  quantity: number
  unitPriceFormatted: string
  totalFormatted: string
}

export interface TicketEmailData {
  orderId: string
  customerEmail: string
  /** Prénom (si disponible en BDD) */
  firstName?: string | null
  /** Nom (si disponible en BDD) */
  lastName?: string | null
  /** Nombre de places réservées */
  seatCount: number
  /** Montant total formaté (ex: "150,00 €") */
  amountTotalFormatted: string
  /** Devise (ex: "eur") */
  currency: string
  /** Détail des lignes (adultes / enfants) */
  lineItems: TicketEmailLineItem[]
  /** Lien vers le PDF des billets (téléchargement) — non utilisé si billets en pièce jointe */
  ticketsUrl?: string | null
  /** Si true, les billets sont envoyés en pièce jointe (pas de lien de téléchargement) */
  ticketsInAttachment?: boolean
  /** Lien vers le reçu Stripe (PDF) */
  receiptUrl?: string | null
  /** ID de la session Stripe (pour référence) */
  stripeSessionId?: string | null
  /** Statut du paiement (ex: "paid") */
  paymentStatus: string
  /** Date de paiement formatée */
  paidAtFormatted: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Affiche le statut de paiement en français */
function formatPaymentStatus(status: string): string {
  const map: Record<string, string> = {
    paid: 'Payé',
    unpaid: 'Non payé',
    no_payment_required: 'Paiement non requis'
  }
  return map[status] ?? status
}

/**
 * Génère le HTML complet de l'email de confirmation de billet.
 */
export function buildTicketEmailHtml(data: TicketEmailData): string {
  const orderRef = data.orderId.split('-')[0] ?? data.orderId.slice(0, 8)

  const customerName =
    data.firstName || data.lastName
      ? [data.firstName, data.lastName].filter(Boolean).join(' ')
      : null

  const lineItemsRows = data.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 16px; font-size: 14px; color: #1c1917; border-bottom: 1px solid #e7e5e4;">${escapeHtml(item.description)}</td>
      <td style="padding: 12px 16px; font-size: 14px; color: #57534e; text-align: center; border-bottom: 1px solid #e7e5e4;">${item.quantity}</td>
      <td style="padding: 12px 16px; font-size: 14px; color: #57534e; text-align: right; border-bottom: 1px solid #e7e5e4;">${escapeHtml(item.unitPriceFormatted)}</td>
      <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #1c1917; text-align: right; border-bottom: 1px solid #e7e5e4;">${escapeHtml(item.totalFormatted)}</td>
    </tr>`
    )
    .join('')

  const ticketsBlock = data.ticketsInAttachment
    ? `
    <p style="margin: 24px 0 8px 0; font-size: 13px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Vos billets</p>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #57534e; line-height: 1.5;">Vos billets sont en <strong>pièce jointe</strong> de cet email (fichier PDF, un billet par place). Ouvrez ou téléchargez la pièce jointe pour les consulter et présentez-les à l'entrée du spectacle.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
      <tr>
        <td style="padding: 14px 24px; background-color: #198754; color: #ffffff; font-size: 14px; font-weight: 600; border-radius: 8px; text-align: center;">📎 Billets en pièce jointe</td>
      </tr>
    </table>`
    : data.ticketsUrl
      ? `
    <p style="margin: 24px 0 8px 0; font-size: 13px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Vos billets</p>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #57534e; line-height: 1.5;">Téléchargez vos billets au format PDF (un billet par place). Présentez-les à l'entrée du spectacle.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
      <tr>
        <td>
          <a href="${escapeHtml(data.ticketsUrl)}" style="display: inline-block; padding: 14px 24px; background-color: #198754; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Télécharger mes billets (PDF)</a>
        </td>
      </tr>
    </table>`
      : ''

  const receiptBlock = data.receiptUrl
    ? `
    <p style="margin: 24px 0 8px 0; font-size: 13px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Reçu de paiement</p>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #57534e; line-height: 1.5;">Vous pouvez télécharger votre reçu de paiement officiel au format PDF en cliquant sur le bouton ci-dessous.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
      <tr>
        <td>
          <a href="${escapeHtml(data.receiptUrl)}" style="display: inline-block; padding: 14px 24px; background-color: #2d2a26; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Télécharger le reçu de paiement (PDF)</a>
        </td>
      </tr>
    </table>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commande ${escapeHtml(orderRef)} — Confirmation billet – Spectacle de Danse d'Ozoir</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f3f0; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f3f0;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 720px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- En-tête -->
          <tr>
            <td style="background-color: #2d2a26; padding: 36px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c9b896; font-weight: 600;">Billetterie officielle</p>
              <h1 style="margin: 12px 0 0 0; font-size: 24px; font-weight: 600; color: #ffffff; letter-spacing: -0.02em;">Spectacle de Danse d'Ozoir</h1>
              <p style="margin: 16px 0 0 0; font-size: 14px; color: #a8a29e;">Confirmation — commande ${escapeHtml(orderRef)}</p>
            </td>
          </tr>
          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <p style="margin: 0 0 8px 0; font-size: 18px; color: #1c1917; line-height: 1.5;">Merci pour votre achat. Votre réservation est bien confirmée.</p>
              ${customerName ? `<p style="margin: 0 0 24px 0; font-size: 15px; color: #57534e;">Bonjour ${escapeHtml(customerName)},</p>` : ''}
              <!-- Numéro de commande -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafaf9; border-radius: 8px; border: 1px solid #e7e5e4; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Numéro de commande</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1c1917; letter-spacing: 0.02em;">${escapeHtml(data.orderId)}</p>
                  </td>
                </tr>
              </table>
              <!-- Nombre de places -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafaf9; border-radius: 8px; border: 1px solid #e7e5e4; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Nombre de places</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 600; color: #1c1917;">${data.seatCount} place${data.seatCount > 1 ? 's' : ''}</p>
                  </td>
                </tr>
              </table>
              <!-- Détail du paiement -->
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Détail du paiement</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e7e5e4; margin-bottom: 16px;">
                <thead>
                  <tr style="background-color: #fafaf9;">
                    <th style="padding: 12px 16px; font-size: 11px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; border-bottom: 1px solid #e7e5e4;">Désignation</th>
                    <th style="padding: 12px 16px; font-size: 11px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; border-bottom: 1px solid #e7e5e4;">Qté</th>
                    <th style="padding: 12px 16px; font-size: 11px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; border-bottom: 1px solid #e7e5e4;">Prix unitaire</th>
                    <th style="padding: 12px 16px; font-size: 11px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; border-bottom: 1px solid #e7e5e4;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsRows}
                </tbody>
              </table>
              <!-- Total -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 16px 0; text-align: right;">
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1c1917;">Total payé : ${escapeHtml(data.amountTotalFormatted)}</p>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #78716c;">Statut : ${escapeHtml(formatPaymentStatus(data.paymentStatus))} • ${escapeHtml(data.paidAtFormatted)}</p>
                  </td>
                </tr>
              </table>
              ${ticketsBlock}
              ${receiptBlock}
              <p style="margin: 28px 0 0 0; font-size: 15px; color: #57534e; line-height: 1.6;">Conservez cet email et présentez votre numéro de commande à l'entrée du spectacle. Nous avons hâte de vous retrouver.</p>
              ${data.stripeSessionId ? `<p style="margin: 12px 0 0 0; font-size: 11px; color: #a8a29e;">Réf. paiement : ${escapeHtml(data.stripeSessionId)}</p>` : ''}
            </td>
          </tr>
          <!-- Pied de page -->
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #e7e5e4; background-color: #fafaf9;">
              <p style="margin: 0; font-size: 13px; color: #78716c; text-align: center; line-height: 1.5;">Billetterie officielle – Spectacle de Danse d'Ozoir</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #a8a29e; text-align: center;">Cet email confirme votre réservation et votre paiement.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
