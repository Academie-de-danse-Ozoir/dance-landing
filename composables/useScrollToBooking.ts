import { nextTick } from 'vue'
import { HOME_TOP_SECTION_ID, NARROW_VIEWPORT_MQ, SEAT_SELECTION_SECTION_ID } from '../constants'
import { useLenis } from './useLenis'

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

/** Côté document, mis à jour par `measureBookingSectionLayout` (mount + resize du bloc réservation). */
let cachedBookingSectionDocTop: number | null = null

/**
 * Mis à jour à chaque exécution de `useScrollToBooking` : même règle partout (scroll natif + Lenis `scroll`).
 * Pas d’appel de composable ici (SeatMap) — d’où le module.
 */
let getPageScrollY: () => number = () =>
  import.meta.client && typeof window !== 'undefined' ? window.scrollY : 0

/**
 * `getBoundingClientRect` seulement ici, au mount / resize (cf. `HeroBlock` / `EventLocationMap`).
 */
export function measureBookingSectionLayout(el: HTMLElement | null) {
  if (import.meta.server) return
  if (!el) {
    cachedBookingSectionDocTop = null
    return
  }
  const rect = el.getBoundingClientRect()
  cachedBookingSectionDocTop = rect.top + getPageScrollY()
}

export function clearBookingSectionLayoutCache() {
  cachedBookingSectionDocTop = null
}

function bookingSectionViewportTopFromCache(): number | null {
  if (import.meta.server) return null
  if (cachedBookingSectionDocTop == null) return null
  return cachedBookingSectionDocTop - getPageScrollY()
}

/** Même règle que `scrollToBookingSectionIfMisaligned` : sans `getBoundingClientRect` (cache + `scrollY` / `lenis.scroll`). */
export function isBookingSectionAlignedToViewport(): boolean {
  if (import.meta.server) return true
  const top = bookingSectionViewportTopFromCache()
  if (top == null) return false
  return top >= BOOKING_SECTION_ALIGNED_TOP_MIN_PX && top <= BOOKING_SECTION_ALIGNED_TOP_MAX_PX
}

/**
 * Scroll vers #seat-selection. Sous `NARROW_VIEWPORT_MQ` : pas de Lenis → scroll natif smooth.
 * Au-delà : Lenis.scrollTo si dispo (hero, footer « Choisir mes sièges » + sessionStorage après navigation).
 */
export function useScrollToBooking() {
  const lenis = useLenis()

  getPageScrollY = () => {
    if (import.meta.server) return 0
    if (isNarrowViewport()) return window.scrollY
    return lenis.value?.scroll ?? window.scrollY
  }

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
    if (isBookingSectionAlignedToViewport()) return
    await scrollToBookingSection()
  }

  return { scrollToBookingSection, scrollToBookingSectionIfMisaligned, scrollToHomeTop }
}
