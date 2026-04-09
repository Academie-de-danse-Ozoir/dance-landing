import { useState } from '#app'

/**
 * Gère l'état global du chargement initial pour coordonner les animations.
 */
export const useAppLoader = () => {
  const isRevealed = useState<boolean>('app-is-revealed', () => false)

  const setRevealed = (value: boolean) => {
    isRevealed.value = value
  }

  return {
    isRevealed,
    setRevealed
  }
}
