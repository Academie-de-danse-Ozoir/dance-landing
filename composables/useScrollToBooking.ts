import { nextTick } from 'vue'
import { NATIVE_SCROLL_VIEWPORT_MQ, SEAT_SELECTION_SECTION_ID } from '../constants'

function isNarrowViewport(): boolean {
  if (import.meta.server || typeof window === 'undefined') return false
  return window.matchMedia(NATIVE_SCROLL_VIEWPORT_MQ).matches
}

/**
 * Scroll vers #seat-selection. Sous `NATIVE_SCROLL_VIEWPORT_MQ` : pas de Lenis → scroll natif smooth.
 * Desktop : Lenis.scrollTo si dispo (hero, footer « Choisir mes sièges » + sessionStorage après navigation).
 */
export function useScrollToBooking() {
  const lenis = useLenis()

  async function scrollToBookingSection() {
    await nextTick()
    if (import.meta.client) {
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
    }
    const el = document.getElementById(SEAT_SELECTION_SECTION_ID)
    if (!el) return

    if (isNarrowViewport()) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    const l = lenis.value
    if (l) {
      l.scrollTo(el, { offset: 0, immediate: false })
      return
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return { scrollToBookingSection }
}
