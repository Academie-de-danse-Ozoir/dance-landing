export const STORAGE_ORDER_KEY = 'order_id'

export const EVENT_ID = 'f179039c-c6a9-4c93-ac39-2153c02105ec'

/** Tarifs en centimes (affichage front + Stripe) */
export const PRICE_ADULT_CENTS = 100
export const PRICE_CHILD_CENTS = 50

/** Nombre max de sièges par réservation */
export const MAX_SEATS_PER_ORDER = 10

/**
 * Rate limit (requêtes / minute / IP) — voir server/utils/rateLimit.ts
 */
export const RATE_LIMIT_HOLD_SEATS_PER_MINUTE = 10
export const RATE_LIMIT_CANCEL_ORDER_PER_MINUTE = 10
export const RATE_LIMIT_CREATE_CHECKOUT_PER_MINUTE = 10
export const RATE_LIMIT_ORDER_TICKET_DETAILS_PER_MINUTE = 10

/** Longueurs max pour validation (hold-seats) */
export const MAX_LENGTH = {
  firstName: 100,
  lastName: 100,
  email: 255,
  phone: 30
} as const

// Statuts commande (valeurs BDD / Stripe — pas des libellés affichés)
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
