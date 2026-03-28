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
export const RATE_LIMIT_UPDATE_ORDER_CONTACT_PER_MINUTE = 20

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
  PAID: 'paid',
  STAFF: 'staff'
} as const

/**
 * UUID des sièges affichés comme « réservés personnel » (non sélectionnables).
 * À terme, peut être remplacé par une colonne en base (ex. `seat.staff_only`).
 */
export const STAFF_RESERVED_SEAT_IDS: readonly string[] = []

export const CANCEL_REASON = {
  TIMER: 'timer',
  USER: 'cancel'
} as const

// =============================================================================
// Carte sièges — général (SeatMap, yerresSeatLayout)
// =============================================================================

/**
 * Marge horizontale **en plus** du `pad` du viewBox (chaque côté, unités SVG).
 * Les décalages d’ailes (balcon / parterre) élargissent le plan : sans ça, `meet` peut tasser ou border le clip.
 */
export const SEAT_MAP_VIEWBOX_EXTRA_HORIZONTAL = 72

// -----------------------------------------------------------------------------
// Carte sièges — arc balcon P→X (SeatMap, coordonnées monde SVG)
// -----------------------------------------------------------------------------

/**
 * Géométrie fictive d’arc : pivot sous le balcon, référence au centre du bloc ; rotation, scaleX latéral,
 * translation « profondeur » (nudge). Courbes = exposants sur `|Δangle|/max` ou `|dx|/max` ; seuils = `EPS_*`.
 */

/** --- Pivot d’arc (centre du cercle fictif, sous le balcon) */
export const SEAT_MAP_BALCONY_ARC_PIVOT_OFFSET_X = 0
/** Distance (px SVG) du **bas du balcon** au pivot (+y = salle / parterre). */
export const SEAT_MAP_BALCONY_ARC_PIVOT_OFFSET_Y = 250

/** --- Point de référence pour `atan2` et pour le `scaleX` latéral (vs centre auto du bloc) */
export const SEAT_MAP_BALCONY_ARC_REF_OFFSET_X = 0
export const SEAT_MAP_BALCONY_ARC_REF_OFFSET_Y = 0

/** --- Rotation (inclinaison des carrés, écart vs référence au centre du bloc) */
/**
 * Intensité globale : `deg ≈ ROTATION_SIGN × shaped(Δangle) × cette valeur + bias` (puis clamp).
 * `0` = pas de rotation liée au centre ; régler ex. `0.08`–`0.2` pour un arc visible.
 */
export const SEAT_MAP_BALCONY_ARC_ANGLE_SCALE = 0.05
/** Décalage global (deg), tous sièges. */
export const SEAT_MAP_BALCONY_ARC_BIAS_DEGREES = 0
/** Plafond |rotation| (deg). */
export const SEAT_MAP_BALCONY_ARC_MAX_ABS_DEGREES = 40
/**
 * Courbe sur `|Δangle|/max` **avant** × `ANGLE_SCALE` : `1` linéaire ; `>1` plus fort sur les côtés ;
 * `]0,1[` adoucit les bords.
 */
export const SEAT_MAP_BALCONY_ARC_ANGLE_CURVE_POWER = 1
/**
 * Sens de l’inclinaison : `1` ou `-1` uniquement. `-1` = inverse gauche/droite par rapport au calcul
 * géométrique (équivalent à un `ANGLE_SCALE` négatif, sans toucher au `BIAS_DEGREES`).
 */
export const SEAT_MAP_BALCONY_ARC_ROTATION_SIGN = 1

/** --- Scale horizontal (perspective latérale, `1` = off) */
export const SEAT_MAP_BALCONY_ARC_SCALE_X_MIN = 1
export const SEAT_MAP_BALCONY_ARC_SCALE_X_CURVE_POWER = 1

/** --- Translation « profondeur » vers le pivot (sans scale) */
export const SEAT_MAP_BALCONY_ARC_DEPTH_NUDGE_MAX = 100
export const SEAT_MAP_BALCONY_ARC_DEPTH_NUDGE_CURVE_POWER = 10

/** --- Seuils d’omission des transforms (bruit / perf SVG) */
export const SEAT_MAP_BALCONY_ARC_EPS_ROTATION_DEG = 1
export const SEAT_MAP_BALCONY_ARC_EPS_SCALE_X = 0.002
export const SEAT_MAP_BALCONY_ARC_EPS_DEPTH_PX = 0.005

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
 * Pas **fixe** sur Q/P au-delà des seuils (× `SEAT_CELL` par place vers l’extérieur, **sans** × **k**).
 * `≤ 0` = recopie automatiquement `SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_STEP`.
 */
export const SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_PER_STEP = 1

/**
 * Sur **Q** et **P** : à partir des places seuil, le progressif passe en pas fixe (`…_FIXED_PER_STEP`). En dessous : × **k** comme ailleurs.
 */
export const SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_ODD_Q = 43
export const SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_ODD_P = 41
export const SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_EVEN_Q = 42
export const SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_EVEN_P = 40

/**
 * Même zone : décalage **fixe** supplémentaire (× `SEAT_CELL` × k, V=1…P=7), en plus du progressif. `0` = rien.
 */
export const SEAT_MAP_BALCONY_VP_WING_OUTWARD_BASE_STEPS = 0

/**
 * Bord extérieur **Q/P** (zones allée) : impairs **Q43–51**, **P41–55** — × `SEAT_CELL` vers la **gauche** si `> 0` (−x).
 */
export const SEAT_MAP_BALCONY_QP_OUTER_WING_ODD_OFFSET_STEPS = -1

/**
 * Même zone : pairs **Q42–50**, **P40–54** — × `SEAT_CELL` vers la **droite** si `> 0` (+x).
 */
export const SEAT_MAP_BALCONY_QP_OUTER_WING_EVEN_OFFSET_STEPS = -1

// =============================================================================
// Carte sièges — balcon : offset global W→P
// =============================================================================

/**
 * Décalage **global** (× `SEAT_CELL`) sur l’aile depuis **W21…P15** (impairs +x) / pairs **20…14** (−x). `0` = off.
 */
export const SEAT_MAP_BALCONY_WP_WING_GLOBAL_OFFSET_STEPS = 0
