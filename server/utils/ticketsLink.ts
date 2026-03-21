import { createHmac, timingSafeEqual } from 'node:crypto'

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
