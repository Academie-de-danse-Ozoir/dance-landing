/**
 * Retarder le scroll jusqu’après le fade « out » (mode out-in), sinon la page remonte avant la transition.
 * Pattern courant : https://github.com/nuxt/nuxt/issues/31650#issuecomment-2766523934
 *
 * Durée = celle du CSS (.page-opacity-* dans assets/styles/page-transitions.scss).
 */
const PAGE_TRANSITION_MS = 600
const PENDING_SCROLL_TO_SEATS_KEY = 'billetterie:pending-seat-scroll'
const PENDING_SCROLL_TO_HOME_KEY = 'billetterie:pending-home-scroll'

function delayScroll(position: { left: number; top: number } | { el: string; top?: number }) {
  return new Promise<typeof position>((resolve) => {
    setTimeout(() => resolve(position), PAGE_TRANSITION_MS)
  })
}

export default {
  scrollBehavior(to, _from, savedPosition) {
    if (import.meta.server) {
      return { left: 0, top: 0 }
    }

    // Si un scroll custom est prévu (fade out/in + jump instantané),
    // on laisse les composants gérer entièrement le positionnement.
    try {
      if (
        sessionStorage.getItem(PENDING_SCROLL_TO_SEATS_KEY) ||
        sessionStorage.getItem(PENDING_SCROLL_TO_HOME_KEY)
      ) {
        return false
      }
    } catch {
      /* private mode / quota */
    }

    if (savedPosition) {
      return delayScroll(savedPosition)
    }

    if (to.hash) {
      return delayScroll({ el: to.hash, top: 0 })
    }

    return delayScroll({ left: 0, top: 0 })
  }
}
