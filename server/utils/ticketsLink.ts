import { createHmac, timingSafeEqual } from 'node:crypto'

const TICKETS_LINK_VALIDITY_DAYS = 365

export function signTicketsPayload(orderId: string, exp: number, secret: string): string {
  const payload = `${orderId}|${exp}`
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function verifyTicketsSignature(
  orderId: string,
  exp: number,
  sig: string,
  secret: string
): boolean {
  if (!orderId || !exp || !sig || !secret) return false
  const expected = signTicketsPayload(orderId, exp, secret)
  if (expected.length !== sig.length) return false
  return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
}

/**
 * Génère l'URL signée pour télécharger les billets PDF.
 * À appeler côté serveur (webhook) pour insérer le lien dans l'email.
 */
export function buildTicketsDownloadUrl(orderId: string): string | null {
  const baseUrl = process.env.PUBLIC_SITE_URL
  const secret = process.env.TICKETS_LINK_SECRET
  if (!baseUrl || !secret) return null

  const exp = Math.floor(Date.now() / 1000) + TICKETS_LINK_VALIDITY_DAYS * 24 * 3600
  const sig = signTicketsPayload(orderId, exp, secret)

  const params = new URLSearchParams({ orderId, exp: String(exp), sig })
  return `${baseUrl.replace(/\/$/, '')}/api/tickets?${params.toString()}`
}
