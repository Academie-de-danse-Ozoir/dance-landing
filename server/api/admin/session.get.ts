import { isAdminEvent } from '../../utils/adminSession'

export default defineEventHandler((event) => {
  if (!isAdminEvent(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Non authentifié' })
  }
  return { ok: true as const }
})
