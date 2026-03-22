// =============================================================================
// Application
// =============================================================================

export const STORAGE_ORDER_KEY = 'order_id'

// =============================================================================
// Événement & tarification
// =============================================================================

export const EVENT_ID = 'f179039c-c6a9-4c93-ac39-2153c02105ec'

/** Tarifs en centimes (affichage front + Stripe) */
export const PRICE_ADULT_CENTS = 100
export const PRICE_CHILD_CENTS = 50

// =============================================================================
// Réservation
// =============================================================================

/** Nombre max de sièges par réservation */
export const MAX_SEATS_PER_ORDER = 10

// =============================================================================
// API — rate limits & validation (voir server/utils/rateLimit.ts, hold-seats)
// =============================================================================

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

// =============================================================================
// Statuts & énumérations métier (BDD / Stripe — pas des libellés UI)
// =============================================================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  HOLD: 'hold',
  EXPIRED: 'expired',
  CANCELED: 'canceled',
  REFUNDED: 'refunded'
} as const

export const SEAT_STATUS = {
  FREE: 'free',
  HOLD: 'hold',
  PAID: 'paid'
} as const

export const CANCEL_REASON = {
  TIMER: 'timer',
  USER: 'cancel'
} as const

// =============================================================================
// Carte sièges — affichage & viewBox (SeatMap, yerresSeatLayout)
// =============================================================================

/** Fond plan Yerres sous la carte (debug calage). Mettre `false` une fois terminé. */
export const SEAT_MAP_DEBUG_BACKGROUND = true

/**
 * Marge horizontale **en plus** du `pad` du viewBox (chaque côté, unités SVG).
 * Les décalages d’ailes (balcon / parterre) élargissent le plan : sans ça, `meet` peut tasser ou border le clip.
 */
export const SEAT_MAP_VIEWBOX_EXTRA_HORIZONTAL = 72

// =============================================================================
// Carte sièges — parterre (O→A, N→A)
// =============================================================================

/**
 * Bloc **central** N→A : écart par palier (× numéro de siège × rangée k), en × `SEAT_CELL`. `0` = désactivé.
 */
export const SEAT_MAP_ORCH_CENTER_NUDGE_PER_TIER = 0.025

/**
 * **Ailes** N→A : pairs 18–40 / impairs 19–41, rampe vers l’extérieur.
 * `1` = plein effet ; `0.5` = moitié ; `0` = off.
 */
export const SEAT_MAP_ORCH_WING_NUDGE_SCALE = 0.5

/**
 * **Ailes** N→A depuis l’allée : impairs ≥21 / pairs ≥20, écart progressif (× `SEAT_CELL` × k).
 * `0` = désactivé.
 */
export const SEAT_MAP_ORCH_WING_AISLE_PROGRESS_STEP = 0.025

/**
 * **Offset global** O→A (× `SEAT_CELL`) : droite impairs O5→O21 puis N19→41… ; gauche pairs O6→O22 puis N18→40….
 * `0` = off.
 */
export const SEAT_MAP_ORCH_OA_WING_GLOBAL_OFFSET_STEPS = 1

// =============================================================================
// Carte sièges — balcon : bloc central V→P
// =============================================================================

/**
 * Bloc **central** V→P : même logique que le parterre ; × k (V=1 … P=7). Bornes V16|17 … P12|13. `0` = off.
 */
export const SEAT_MAP_BALCONY_VP_CENTER_NUDGE_PER_TIER = 0.025

// =============================================================================
// Carte sièges — balcon : ailes V→P & W (rampe, progressifs, offsets)
// =============================================================================

/**
 * **Rampe** ailes V→P (pairs / impairs ≥ seuils), amplitude de V vers P.
 * `1` = plein effet ; `0` = off.
 */
export const SEAT_MAP_BALCONY_WING_NUDGE_SCALE = 0

/**
 * Pas **en plus** vers l’extérieur sur les ailes **U→P** (la rampe V utilise aussi `SEAT_MAP_BALCONY_V_OUTER_OFFSET_STEPS` ; rangée **W** : constante dédiée).
 */
export const SEAT_MAP_BALCONY_WING_OUTER_OFFSET_STEPS = 2

/**
 * Rangée **V** seule : décalage fixe (× `SEAT_CELL`) sur les ailes **V18…V48** (−x) et **V19…V49** (+x). `0` = off.
 */
export const SEAT_MAP_BALCONY_V_OUTER_OFFSET_STEPS = 0.5

/** Rangée **W** seule (W20…W48 / W21…W49). */
export const SEAT_MAP_BALCONY_W_OUTER_OFFSET_STEPS = 2

/**
 * Ailes V→P depuis l’allée (impair V19…P15 / pair 18…14) : écart **progressif**.
 * Indépendant de `SEAT_MAP_ORCH_WING_AISLE_PROGRESS_STEP`. `0` = off.
 */
export const SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_STEP = 0.05

/**
 * Même zone : décalage **fixe** supplémentaire (× `SEAT_CELL` × k, V=1…P=7), en plus du progressif. `0` = rien.
 */
export const SEAT_MAP_BALCONY_VP_WING_OUTWARD_BASE_STEPS = 0

// =============================================================================
// Carte sièges — balcon : offset global W→P
// =============================================================================

/**
 * Décalage **global** (× `SEAT_CELL`) sur l’aile depuis **W21…P15** (impairs +x) / pairs **20…14** (−x). `0` = off.
 */
export const SEAT_MAP_BALCONY_WP_WING_GLOBAL_OFFSET_STEPS = 0
