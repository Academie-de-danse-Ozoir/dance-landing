import { nextTick } from 'vue'
import { SEAT_SELECTION_SECTION_ID } from '../constants'

/**
 * Scroll Lenis vers le bloc plan de salle (pas d’ancre dans l’URL).
 */
export function useScrollToBooking() {
  const lenis = useLenis()

  async function scrollToBookingSection() {
    await nextTick()
    const el = document.getElementById(SEAT_SELECTION_SECTION_ID)
    const l = lenis.value
    if (l && el) {
      l.scrollTo(el, { offset: 0, immediate: false })
      return
    }
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return { scrollToBookingSection }
}
