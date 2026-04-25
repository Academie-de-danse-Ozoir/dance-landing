import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { createError, getCookie, setCookie, deleteCookie, type H3Event } from 'h3'

const COOKIE_NAME = 'dance_backoffice'
const PAYLOAD_MAX_AGE_MS = 12 * 60 * 60 * 1000

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() || ''
}

function passwordFromEnv(): string {
  return process.env.ADMIN_BACKOFFICE_PASSWORD?.trim() || ''
}

function signPayload(b64: string): string {
  return createHmac('sha256', sessionSecret()).update(b64).digest('base64url')
}

export function createSessionTokenValue(): string | null {
  if (!sessionSecret() || sessionSecret().length < 32) {
    return null
  }
  const exp = Date.now() + PAYLOAD_MAX_AGE_MS
  const nonce = randomBytes(8).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ v: 1 as const, exp, n: nonce }), 'utf8').toString('base64url')
  return `${payload}.${signPayload(payload)}`
}

export function verifySessionTokenValue(raw: string | undefined | null): boolean {
  if (!raw || !sessionSecret()) return false
  const i = raw.lastIndexOf('.')
  if (i <= 0) return false
  const b64 = raw.slice(0, i)
  const sig = raw.slice(i + 1)
  if (signPayload(b64) !== sig) return false
  try {
    const o = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as { v?: number; exp?: number }
    if (o.v !== 1 || typeof o.exp !== 'number' || o.exp < Date.now()) return false
    return true
  } catch {
    return false
  }
}

/**
 * Vérifie le mot de passe (hash SHA-256, comparaison en temps constant sur les digest de même taille).
 */
export function checkAdminPassword(attempt: string | undefined | null): boolean {
  const expected = passwordFromEnv()
  if (!expected || !attempt) return false
  const a = createHash('sha256').update(attempt, 'utf8').digest()
  const b = createHash('sha256').update(expected, 'utf8').digest()
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function isAdminEvent(event: H3Event): boolean {
  return verifySessionTokenValue(getCookie(event, COOKIE_NAME) ?? null)
}

export function setAdminSessionCookie(event: H3Event, token: string) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: PAYLOAD_MAX_AGE_MS / 1000
  })
}

export function clearAdminSessionCookie(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function requireAdminOrThrow(event: H3Event) {
  if (!isAdminEvent(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
