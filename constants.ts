export const STORAGE_ORDER_KEY = 'order_id'

export const EVENT_ID = '1f616667-67e6-4907-bd61-21360736fdc7'

/** Date et lieu du spectacle (affichés sur les billets PDF) */
export const EVENT_DATE = 'Samedi 17 mai 2025'
export const EVENT_VENUE = 'Salle des fêtes – Ozoir-la-Ferrière'

/** Tarifs en centimes (affichage front + Stripe) */
export const PRICE_ADULT_CENTS = 100
export const PRICE_CHILD_CENTS = 50

// Erreurs API (messages utilisateur en français)
export const ERROR_MISSING_ORDER_ID = 'Identifiant de commande manquant.'
export const ERROR_ORDER_NOT_FOUND = 'Commande introuvable.'
export const ERROR_ORDER_NOT_PAYABLE = 'Cette commande ne peut pas être payée.'
export const ERROR_RESERVATION_EXPIRED = 'Réservation expirée.'
export const ERROR_PAID_ORDER_CANNOT_BE_CANCELLED = 'Une commande payée ne peut pas être annulée.'
export const ERROR_NO_SEATS_SELECTED = 'Aucun siège sélectionné.'
export const ERROR_MISSING_CUSTOMER_INFO = 'Informations client manquantes.'
export const ERROR_SEATS_UNAVAILABLE = 'Un ou plusieurs sièges ne sont plus disponibles.'
export const ERROR_CREATE_RESERVATION_FAILED = 'Impossible de créer la réservation.'
export const ERROR_LOAD_SEATS_FAILED = 'Impossible de charger les sièges.'
export const ERROR_LOAD_RESERVATIONS_FAILED = 'Impossible de charger les réservations.'
export const ERROR_INVALID_REQUEST = 'Requête invalide.'
export const ERROR_ADULT_CHILD_MISMATCH = 'Répartition adultes/enfants incohérente avec le nombre de places.'
export const ERROR_MISSING_ORDER_TOKEN = 'Lien de réservation invalide. Recommencez la réservation.'
export const ERROR_TOO_MANY_SEATS = 'Nombre maximum de places par réservation dépassé.'
export const ERROR_FIELD_TOO_LONG = 'Un champ est trop long.'
export const ERROR_RATE_LIMIT = 'Trop de requêtes. Réessayez dans un instant.'
export const ERROR_CAPTCHA_TURNSTILE = 'Vérification anti-robot échouée ou expirée. Rechargez la page et réessayez.'

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
