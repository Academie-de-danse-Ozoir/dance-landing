import { getMethod } from 'h3'
import { requireAdminOrThrow } from '../utils/adminSession'

/**
 * Toutes les routes `/api/admin/*` exigent une session admin valide (cookie httpOnly signé),
 * sauf `POST /api/admin/login` — impossible de clôturer une commande gratuite ou d’appeler
 * les autres endpoints admin sans s’être authentifié.
 */
export default defineEventHandler((event) => {
  const path = event.path
  if (!path.startsWith('/api/admin/')) return

  if (path === '/api/admin/login' && getMethod(event) === 'POST') return

  requireAdminOrThrow(event)
})
