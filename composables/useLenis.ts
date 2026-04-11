import type Lenis from 'lenis'
import { useState } from '#imports'

/**
 * Fournit l'accès à l'instance Lenis globale gérée manuellement dans app.vue.
 * Évite les erreurs "No lenis instance found" en proposant une ref stable.
 */
export function useLenis() {
  const lenis = useState<Lenis | null>('global-lenis-instance', () => null)
  return lenis
}
