/** `BookingBlock` enregistre le recalcul hauteur plan ; le bandeau layout y accède sans import circulaire. */
let snapSeatMapHeight: (() => void) | null = null

export function registerBookingSeatMapSnap(fn: () => void) {
  snapSeatMapHeight = fn
  return () => {
    snapSeatMapHeight = null
  }
}

export function snapBookingSeatMapHeight() {
  snapSeatMapHeight?.()
}
