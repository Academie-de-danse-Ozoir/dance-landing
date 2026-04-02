import { nextTick } from 'vue'
import { HOME_TOP_SECTION_ID, NARROW_VIEWPORT_MQ, SEAT_SELECTION_SECTION_ID } from '../constants'

function isNarrowViewport(): boolean {
  if (import.meta.server || typeof window === 'undefined') return false
  return window.matchMedia(NARROW_VIEWPORT_MQ).matches
}

/**
 * Tolérance vs `scrollIntoView({ block: 'start' })` : haut de #seat-selection proche du haut du viewport
 * (barres / safe area : un peu de marge).
 */
const BOOKING_SECTION_ALIGNED_TOP_MIN_PX = -10
const BOOKING_SECTION_ALIGNED_TOP_MAX_PX = 80

function isBookingSectionAlignedToScrollTarget(): boolean {
  if (import.meta.server || typeof document === 'undefined') return true
  const el = document.getElementById(SEAT_SELECTION_SECTION_ID)
  if (!el) return true
  const top = el.getBoundingClientRect().top
  return top >= BOOKING_SECTION_ALIGNED_TOP_MIN_PX && top <= BOOKING_SECTION_ALIGNED_TOP_MAX_PX
}

/**
 * Scroll vers #seat-selection. Sous `NARROW_VIEWPORT_MQ` : pas de Lenis → scroll natif smooth.
 * Au-delà : Lenis.scrollTo si dispo (hero, footer « Choisir mes sièges » + sessionStorage après navigation).
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

  /**
   * Scroll vers le haut de la page d’accueil (`#home-top`). Même règle que `scrollToBookingSection` :
   * natif smooth sous `NARROW_VIEWPORT_MQ`, sinon Lenis.
   */
  async function scrollToHomeTop() {
    await nextTick()
    if (import.meta.client) {
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
    }
    const el = document.getElementById(HOME_TOP_SECTION_ID)
    if (!el) {
      if (import.meta.client) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

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

  /** Même scroll que le CTA, seulement si la section n’est plus alignée en haut (mobile : natif, desktop : Lenis). */
  async function scrollToBookingSectionIfMisaligned() {
    if (isBookingSectionAlignedToScrollTarget()) return
    await scrollToBookingSection()
  }

  return { scrollToBookingSection, scrollToBookingSectionIfMisaligned, scrollToHomeTop }
}
