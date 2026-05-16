import { useLenis } from './useLenis'

let syncTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Après mount / decode des images parallax : `resize` natif + Lenis.resize()
 * pour recaler les rects (souvent faux avant chargement ou avant fin du loader).
 */
export function useParallaxLayoutSync() {
  const lenis = useLenis()

  function scheduleParallaxLayoutSync(delayMs = 64) {
    if (!import.meta.client) return
    if (syncTimer !== null) clearTimeout(syncTimer)
    syncTimer = window.setTimeout(() => {
      syncTimer = null
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'))
        lenis.value?.resize?.()
      })
    }, delayMs)
  }

  return { scheduleParallaxLayoutSync }
}
