export const STORAGE_ORDER_KEY = 'order_id'

export const EVENT_ID = '1f616667-67e6-4907-bd61-21360736fdc7'

// Erreurs API
export const ERROR_MISSING_ORDER_ID = 'Missing orderId'
export const ERROR_ORDER_NOT_FOUND = 'Order not found'
export const ERROR_ORDER_NOT_PAYABLE = 'Order not payable'
export const ERROR_RESERVATION_EXPIRED = 'Reservation expired'
export const ERROR_PAID_ORDER_CANNOT_BE_CANCELLED = 'Paid order cannot be cancelled'

// Statuts commande
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  HOLD: 'hold',
  EXPIRED: 'expired',
  CANCELED: 'canceled',
  REFUNDED: 'refunded'
} as const

// Statuts siège / réservation
export const SEAT_STATUS = {
  FREE: 'free',
  HOLD: 'hold',
  PAID: 'paid'
} as const

// Raison d'annulation
export const CANCEL_REASON = {
  TIMER: 'timer',
  USER: 'cancel'
} as const
