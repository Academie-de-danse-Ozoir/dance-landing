import { getClientIp, checkRateLimit } from '../../utils/rateLimit'
import {
  checkAdminPassword,
  createSessionTokenValue,
  setAdminSessionCookie
} from '../../utils/adminSession'

const RATE = 8

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!checkRateLimit(ip, 'admin_login', RATE).ok) {
    throw createError({ statusCode: 429, statusMessage: 'Too many login attempts' })
  }

  const body = await readBody(event).catch(() => ({} as Record<string, unknown>))
  const password = typeof body.password === 'string' ? body.password : ''

  if (!checkAdminPassword(password)) {
    throw createError({ statusCode: 401, statusMessage: 'Identifiants invalides' })
  }

  const token = createSessionTokenValue()
  if (!token) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Configuration serveur incomplète (ADMIN_SESSION_SECRET manquant ou trop court, min. 32 caractères).'
    })
  }

  setAdminSessionCookie(event, token)
  return { ok: true as const }
})
