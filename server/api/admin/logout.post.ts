import { clearAdminSessionCookie } from '../../utils/adminSession'

export default defineEventHandler((event) => {
  clearAdminSessionCookie(event)
  return { ok: true as const }
})
