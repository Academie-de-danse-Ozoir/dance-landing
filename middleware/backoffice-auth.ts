/**
 * Protège les pages `/admin` (sauf `/admin/login`) : le cookie est httpOnly, vérification côté client via `/api/admin/session`.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') {
    return
  }
  if (!import.meta.client) {
    return
  }
  try {
    await $fetch('/api/admin/session', { credentials: 'include' })
  } catch {
    return navigateTo({ path: '/admin/login', query: { redirect: to.fullPath } })
  }
})
