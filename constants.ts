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

/** Fond plan Yerres sous la carte (debug calage). Mettre `false` une fois terminé. */
export const SEAT_MAP_DEBUG_BACKGROUND = true

/**
 * Marge horizontale **en plus** du `pad` du viewBox (chaque côté, unités SVG).
 * Les décalages d’ailes (balcon / parterre) élargissent le plan : sans ça, `meet` peut tasser ou border le clip.
 */
export const SEAT_MAP_VIEWBOX_EXTRA_HORIZONTAL = 72

/**
 * Carte sièges — parterre N→A, **bloc central** : écart par palier (× numéro de siège × rangée k).
 * En multiples de `SEAT_CELL` (13 px dans le layout). `0` = désactivé.
 */
export const SEAT_MAP_ORCH_CENTER_NUDGE_PER_TIER = 0.025

/**
 * Parterre N→A, **ailes** : pairs 18–40 vers la gauche, impairs 19–41 vers la droite (ramp N→A).
 * Multiplicateur sur ce décalage : `1` = réglage actuel ; `0.5` = moitié moins ; `0` = pas de décalage.
 */
export const SEAT_MAP_ORCH_WING_NUDGE_SCALE = 0.5

/**
 * Balcon V→P, **ailes** : même logique que le parterre (pairs ≥ seuil gauche → −x, impairs ≥ seuil droit → +x),
 * amplitude qui augmente de V vers P. `1` = plein effet ; `0` = off.
 */
export const SEAT_MAP_BALCONY_WING_NUDGE_SCALE = -0.5

/**
 * Pas `SEAT_CELL` **en plus** vers l’extérieur sur les ailes **V→P** (en plus de la rampe × scale).
 * Ne s’applique pas à la rangée W (voir `SEAT_MAP_BALCONY_W_OUTER_OFFSET_STEPS`).
 */
export const SEAT_MAP_BALCONY_WING_OUTER_OFFSET_STEPS = 2

/** Même chose **uniquement pour la rangée W** (W20…W48 / W21…W49). */
export const SEAT_MAP_BALCONY_W_OUTER_OFFSET_STEPS = 1
