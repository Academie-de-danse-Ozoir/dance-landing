import type { ActiveOrder } from '~/types'

/**
 * État réservation partagé entre la page d’accueil (`BookingBlock`) et le bandeau
 * (`BookingOrderBanner` dans le layout) pour que le fade-out survive au changement de route.
 */
export function useBookingSession() {
  const activeOrder = useState<ActiveOrder | null>('booking-active-order', () => null)
  const showModal = useState('booking-show-modal', () => false)
  const suppressPageOrderAlert = useState('booking-suppress-alert', () => false)
  const seatsReady = useState('booking-seats-ready', () => false)
  const orderBannerAnimating = useState('booking-banner-animating', () => false)
  /** Synchronisé depuis `BookingBlock` (timer) pour l’alerte hors page. */
  const bookingTimerDisplay = useState('booking-timer-display', () => '0:00')

  return {
    activeOrder,
    showModal,
    suppressPageOrderAlert,
    seatsReady,
    orderBannerAnimating,
    bookingTimerDisplay
  }
}
