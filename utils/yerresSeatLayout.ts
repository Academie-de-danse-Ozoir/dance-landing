/**
 * Carte des sièges — **schéma** aligné sur la logique du plan Yerres (pairs / impairs / allée),
 * pas une reproduction pixel-perfect du JPEG 3D (cela exigerait des coordonnées mesurées à la main
 * ou un outil de calage, pas de l’OCR).
 */

import {
  SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_EVEN_P,
  SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_EVEN_Q,
  SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_ODD_P,
  SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_ODD_Q,
  SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_PER_STEP,
  SEAT_MAP_BALCONY_QP_OUTER_WING_EVEN_OFFSET_STEPS,
  SEAT_MAP_BALCONY_QP_OUTER_WING_ODD_OFFSET_STEPS,
  SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_STEP,
  SEAT_MAP_BALCONY_VP_WING_OUTWARD_BASE_STEPS,
  SEAT_MAP_BALCONY_WP_WING_GLOBAL_OFFSET_STEPS,
  SEAT_MAP_BALCONY_WING_NUDGE_SCALE,
  SEAT_MAP_BALCONY_WING_OUTER_OFFSET_STEPS,
  SEAT_MAP_BALCONY_V_OUTER_OFFSET_STEPS,
  SEAT_MAP_BALCONY_W_OUTER_OFFSET_STEPS,
  SEAT_MAP_ORCH_CENTER_NUDGE_PER_TIER,
  SEAT_MAP_BALCONY_VP_CENTER_NUDGE_PER_TIER,
  SEAT_MAP_ORCH_OA_WING_GLOBAL_OFFSET_STEPS,
  SEAT_MAP_ORCH_WING_AISLE_PROGRESS_STEP,
  SEAT_MAP_ORCH_WING_NUDGE_SCALE,
  SEAT_MAP_VIEWBOX_EXTRA_HORIZONTAL
} from '../constants'
import { BALCONY_GAP_PER_X, balconyExplicitSequence } from './yerresBalconyExplicit'

type SeatLike = {
  id: string
  label: string
  status: string
}

/** Pas horizontal du layout (carte sièges) — même valeur que `SEAT_SIZE` dans SeatMap. */
const SEAT_CELL = 13
const AISLE_GAP = 7
/** Allée latérale (aile ↔ bloc centre), comme sur le plan entre 18|16 et 17|19, O6|O4, O3|O5. */
const SIDE_AISLE_GAP = 14
/** +4 px entre chaque rangée balcon (P→X) et parterre (O→A). */
const ROW_VERTICAL_EXTRA = 1
const ROW_HEIGHT_BAL = 15 + ROW_VERTICAL_EXTRA
const ROW_HEIGHT_ORCH = 16 + ROW_VERTICAL_EXTRA
/** Monte tout le bloc P→X d’un seul coup (repère y vers le bas → soustraire). */
const BALCONY_BLOCK_SHIFT_UP = 50
const BALCONY_ROW_COUNT = 9
const GAP_BALCONY_ORCHESTRA = 28

/**
 * Ordre vertical du plan (haut → bas) : balcon puis parterre.
 * Brief : X…P puis « Q,N,M,…,A » — la 2ᵉ tête de ligne est interprétée comme **O** (rangée O),
 * sinon la lettre Q serait en double (une seule rangée Q en base).
 */
const ROW_ORDER_TOP_TO_BOTTOM = [
  'X',
  'W',
  'V',
  'U',
  'T',
  'S',
  'R',
  'Q',
  'P',
  'O',
  'N',
  'M',
  'L',
  'K',
  'J',
  'I',
  'H',
  'G',
  'F',
  'E',
  'D',
  'C',
  'B',
  'A'
] as const
const LAYOUT_PAD = 22
const FALLBACK_CELL = 14
const FALLBACK_COLS = 26
/**
 * Décalage +x **après** `centerRowsHorizontally` (sinon le centrage par rangée annule le décalage).
 * Valeurs = nombre de « pas » siège (`SEAT_CELL`) ; négatif = gauche.
 * G : aligner les colonnes (ex. G18 sous H18) quand le centrage par rangée seul décale la ligne.
 */
const ROW_NUDGE_SEAT_SPACES_AFTER_CENTER: Partial<Record<string, number>> = {
  E: 4,
  F: 4,
  G: -0.5
}

/**
 * Balcon V→P : rampe d’amplitude comme le parterre N→A (`(index+1)×0.5×SEAT_CELL×scale`).
 * Seuils : pairs ≥ `leftEvenMin` → gauche ; impairs ≥ `rightOddMin` → droite.
 */
const BALCONY_WING_RAMP_ROWS_V_TO_P = ['V', 'U', 'T', 'S', 'R', 'Q', 'P'] as const

const BALCONY_WING_RAMP_THRESHOLDS: Record<
  (typeof BALCONY_WING_RAMP_ROWS_V_TO_P)[number],
  { leftEvenMin: number; rightOddMin: number }
> = {
  V: { leftEvenMin: 18, rightOddMin: 19 },
  U: { leftEvenMin: 18, rightOddMin: 19 },
  T: { leftEvenMin: 18, rightOddMin: 17 },
  S: { leftEvenMin: 16, rightOddMin: 17 },
  R: { leftEvenMin: 16, rightOddMin: 15 },
  Q: { leftEvenMin: 14, rightOddMin: 15 },
  P: { leftEvenMin: 14, rightOddMin: 15 }
}

function balconyWingRampMultiplierSeatCells(row: string): number | null {
  const R = row.toUpperCase()
  const idx = BALCONY_WING_RAMP_ROWS_V_TO_P.indexOf(
    R as (typeof BALCONY_WING_RAMP_ROWS_V_TO_P)[number]
  )
  if (idx < 0) return null
  return (idx + 1) * 0.5
}

/**
 * Parterre N→A (pas O) : aile gauche pairs ≥18 jusqu’à 40, aile droite impairs ≥19 jusqu’à 41.
 * Décalage en multiples de `SEAT_CELL` : N=0.5, M=1, L=1.5 … A=7 ; gauche −x, droite +x.
 */
const ORCH_SIDE_NUDGE_ROWS_N_TO_A = [
  'N',
  'M',
  'L',
  'K',
  'J',
  'I',
  'H',
  'G',
  'F',
  'E',
  'D',
  'C',
  'B',
  'A'
] as const

const ORCH_SIDE_NUDGE_LEFT_EVEN_MIN = 18
const ORCH_SIDE_NUDGE_LEFT_EVEN_MAX = 40
const ORCH_SIDE_NUDGE_RIGHT_ODD_MIN = 19
const ORCH_SIDE_NUDGE_RIGHT_ODD_MAX = 41

function orchSideNudgeMultiplierSeatCells(row: string): number | null {
  const R = row.toUpperCase()
  const idx = ORCH_SIDE_NUDGE_ROWS_N_TO_A.indexOf(
    R as (typeof ORCH_SIDE_NUDGE_ROWS_N_TO_A)[number]
  )
  if (idx < 0) return null
  return (idx + 1) * 0.5
}

/**
 * Bloc central N→A : écart **par numéro** (en ×`SEAT_CELL`), puis ×k (N=1…A=14).
 * Ex. rangée N : N2→−0,25, N4→−0,5… ; N3→+0,25, N5→+0,5… (N1 reste 0).
 */
const ORCH_CENTER_NUDGE_TIER_SEAT_CELLS = 0.25

function orchCenterNudgeRowStepsMultiplier(row: string): number | null {
  const R = row.toUpperCase()
  const idx = ORCH_SIDE_NUDGE_ROWS_N_TO_A.indexOf(
    R as (typeof ORCH_SIDE_NUDGE_ROWS_N_TO_A)[number]
  )
  if (idx < 0) return null
  return idx + 1
}

function nudgeOrchestraNWingRamp<T extends SeatLike & { x: number; y: number }>(items: T[]): T[] {
  const scale = SEAT_MAP_ORCH_WING_NUDGE_SCALE
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const mult = orchSideNudgeMultiplierSeatCells(pr.row)
    if (mult == null) return p
    const n = pr.num
    let dx = 0
    if (n % 2 === 0 && n >= ORCH_SIDE_NUDGE_LEFT_EVEN_MIN && n <= ORCH_SIDE_NUDGE_LEFT_EVEN_MAX) {
      dx -= mult * SEAT_CELL * scale
    } else if (
      n % 2 === 1 &&
      n >= ORCH_SIDE_NUDGE_RIGHT_ODD_MIN &&
      n <= ORCH_SIDE_NUDGE_RIGHT_ODD_MAX
    ) {
      dx += mult * SEAT_CELL * scale
    }
    if (dx === 0) return p
    return { ...p, x: p.x + dx }
  })
}

/**
 * Parterre N→A : depuis l’allée (18 pair / 19 impair), écarte encore vers l’extérieur, de plus en plus,
 * avec le même multiplicateur de rangée `k` que le bloc central (N=1 … A=14).
 * Droite : impairs 21→41 (19 inchangé). Gauche : pairs 20→40 (18 inchangé).
 */
function nudgeOrchestraWingProgressiveFromAisle<T extends SeatLike & { x: number; y: number }>(
  items: T[]
): T[] {
  const base = SEAT_MAP_ORCH_WING_AISLE_PROGRESS_STEP * SEAT_CELL
  if (base === 0) return items
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const k = orchCenterNudgeRowStepsMultiplier(pr.row)
    if (k == null) return p
    const n = pr.num

    if (n % 2 === 1 && n >= 21 && n <= ORCH_SIDE_NUDGE_RIGHT_ODD_MAX) {
      const stepIndex = (n - 19) / 2
      return { ...p, x: p.x + stepIndex * base * k }
    }
    if (n % 2 === 0 && n >= 20 && n <= ORCH_SIDE_NUDGE_LEFT_EVEN_MAX) {
      const stepIndex = (n - 18) / 2
      return { ...p, x: p.x - stepIndex * base * k }
    }
    return p
  })
}

/** Rangée O (plan explicite) : bornes des ailes. */
const ORCH_O_RIGHT_ODD_MIN = 5
const ORCH_O_RIGHT_ODD_MAX = 21
const ORCH_O_LEFT_EVEN_MIN = 6
const ORCH_O_LEFT_EVEN_MAX = 22

function orchOaGlobalRowIsOrchestraOToA(row: string): boolean {
  const R = row.toUpperCase()
  if (R === 'O') return true
  return R.length === 1 && R >= 'A' && R <= 'N'
}

/** Aile droite : O5 et impairs vers la droite ; N…A : N19 et impairs vers la droite (jusqu’à 41). */
function orchOaGlobalSeatOnRightWing(row: string, n: number): boolean {
  if (n % 2 !== 1) return false
  const R = row.toUpperCase()
  if (R === 'O') return n >= ORCH_O_RIGHT_ODD_MIN && n <= ORCH_O_RIGHT_ODD_MAX
  if (R >= 'A' && R <= 'N') {
    return n >= ORCH_SIDE_NUDGE_RIGHT_ODD_MIN && n <= ORCH_SIDE_NUDGE_RIGHT_ODD_MAX
  }
  return false
}

/** Aile gauche : O6 et pairs vers la gauche ; N…A : N18 et pairs vers la gauche (jusqu’à 40). */
function orchOaGlobalSeatOnLeftWing(row: string, n: number): boolean {
  if (n % 2 !== 0) return false
  const R = row.toUpperCase()
  if (R === 'O') return n >= ORCH_O_LEFT_EVEN_MIN && n <= ORCH_O_LEFT_EVEN_MAX
  if (R >= 'A' && R <= 'N') {
    return n >= ORCH_SIDE_NUDGE_LEFT_EVEN_MIN && n <= ORCH_SIDE_NUDGE_LEFT_EVEN_MAX
  }
  return false
}

function nudgeOrchestraOaWingGlobalOffset<T extends SeatLike & { x: number; y: number }>(items: T[]): T[] {
  const dx = SEAT_MAP_ORCH_OA_WING_GLOBAL_OFFSET_STEPS * SEAT_CELL
  if (dx === 0) return items
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    if (!orchOaGlobalRowIsOrchestraOToA(pr.row)) return p
    const n = pr.num

    if (orchOaGlobalSeatOnRightWing(pr.row, n)) {
      return { ...p, x: p.x + dx }
    }
    if (orchOaGlobalSeatOnLeftWing(pr.row, n)) {
      return { ...p, x: p.x - dx }
    }
    return p
  })
}

/** Balcon V→P (haut → bas) pour ancres impaires 19→15 / paires 18→14. */
const BALCONY_VP_PROGRESS_ROWS = ['V', 'U', 'T', 'S', 'R', 'Q', 'P'] as const
const BALCONY_VP_PROGRESS_LAST = BALCONY_VP_PROGRESS_ROWS.length - 1

function balconyVpProgressRowIndex(row: string): number | null {
  const R = row.toUpperCase()
  const idx = BALCONY_VP_PROGRESS_ROWS.indexOf(R as (typeof BALCONY_VP_PROGRESS_ROWS)[number])
  return idx === -1 ? null : idx
}

/** Impair d’allée côté droit : 19 en V … 15 en P. */
function balconyVpAnchorOdd(rowIndex: number): number {
  const raw = 19 + ((15 - 19) * rowIndex) / BALCONY_VP_PROGRESS_LAST
  let a = Math.round(raw)
  if (a % 2 === 0) a -= 1
  return Math.max(15, Math.min(19, a))
}

/** Pair d’allée côté gauche : 18 en V … 14 en P (symétrique). */
function balconyVpAnchorEven(rowIndex: number): number {
  const raw = 18 + ((14 - 18) * rowIndex) / BALCONY_VP_PROGRESS_LAST
  let a = Math.round(raw)
  if (a % 2 === 1) a -= 1
  return Math.max(14, Math.min(18, a))
}

/** Ajustements plan Yerres : T16 reste centre (aile gauche à partir de T18) ; R15 dans l’aile droite. */
function balconyVpWingEffectiveAnchors(
  row: string,
  rowIndex: number
): { anchorOdd: number; anchorEven: number } {
  let anchorOdd = balconyVpAnchorOdd(rowIndex)
  let anchorEven = balconyVpAnchorEven(rowIndex)
  const R = row.toUpperCase()
  if (R === 'T') anchorEven = 18
  if (R === 'R') anchorOdd = 15
  return { anchorOdd, anchorEven }
}

/**
 * Partie **progressive** seule : ramp × **k** jusqu’au seuil ; sur Q/P au-delà, pas **fixe** = `fixedBase` (sans × k).
 */
function balconyVpWingAisleProgressDx(
  stepIndex: number,
  k: number,
  row: string,
  oddWing: boolean,
  anchorOdd: number,
  anchorEven: number,
  progressBase: number,
  fixedBase: number
): number {
  if (stepIndex <= 0) return 0

  const rampPerStep = progressBase * k
  const fixedPerStep = fixedBase
  if (rampPerStep === 0 && fixedPerStep === 0) return 0

  const R = row.toUpperCase()
  const anchor = oddWing ? anchorOdd : anchorEven
  let thr: number | undefined
  if (oddWing) {
    if (R === 'Q') thr = SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_ODD_Q
    else if (R === 'P') thr = SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_ODD_P
  } else {
    if (R === 'Q') thr = SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_EVEN_Q
    else if (R === 'P') thr = SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_FROM_EVEN_P
  }
  if (thr === undefined) return stepIndex * rampPerStep
  if ((oddWing && thr % 2 === 0) || (!oddWing && thr % 2 === 1)) return stepIndex * rampPerStep

  const stepAtThr = (thr - anchor) / 2
  if (stepAtThr < 1) return stepIndex * rampPerStep
  const sBreak = stepAtThr - 1
  if (stepIndex <= sBreak) return stepIndex * rampPerStep
  return sBreak * rampPerStep + (stepIndex - sBreak) * fixedPerStep
}

/**
 * Balcon V→P : ancres impaires 19 (V) → 15 (P), paires 18 → 14 ; k = 1 (V) … 7 (P).
 * Voir `SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_STEP` + `…_FIXED_PER_STEP` + seuils `…_FIXED_FROM_*` + `…_OUTWARD_BASE_STEPS`.
 */
function nudgeBalconyVpWingProgressiveFromAisle<T extends SeatLike & { x: number; y: number }>(
  items: T[]
): T[] {
  const progressBase = SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_STEP * SEAT_CELL
  const fixedCoeff =
    SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_PER_STEP <= 0
      ? SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_STEP
      : SEAT_MAP_BALCONY_VP_WING_AISLE_PROGRESS_FIXED_PER_STEP
  const fixedBase = fixedCoeff * SEAT_CELL
  const extraPerK = SEAT_MAP_BALCONY_VP_WING_OUTWARD_BASE_STEPS * SEAT_CELL
  if (progressBase === 0 && fixedBase === 0 && extraPerK === 0) return items
  const maxOdd = 55
  const maxEven = 56
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const idx = balconyVpProgressRowIndex(pr.row)
    if (idx == null) return p
    const k = idx + 1
    const { anchorOdd, anchorEven } = balconyVpWingEffectiveAnchors(pr.row, idx)
    const n = pr.num

    if (n % 2 === 1 && n >= anchorOdd && n <= maxOdd) {
      const stepIndex = (n - anchorOdd) / 2
      if (stepIndex < 0) return p
      const dx =
        balconyVpWingAisleProgressDx(
          stepIndex,
          k,
          pr.row,
          true,
          anchorOdd,
          anchorEven,
          progressBase,
          fixedBase
        ) + extraPerK * k
      return { ...p, x: p.x + dx }
    }
    if (n % 2 === 0 && n >= anchorEven && n <= maxEven) {
      const stepIndex = (n - anchorEven) / 2
      if (stepIndex < 0) return p
      const dx =
        balconyVpWingAisleProgressDx(
          stepIndex,
          k,
          pr.row,
          false,
          anchorOdd,
          anchorEven,
          progressBase,
          fixedBase
        ) + extraPerK * k
      return { ...p, x: p.x - dx }
    }
    return p
  })
}

/** Balcon W→P : ancre impair **W21 … P15** / pair **20 … 14**. */
const BALCONY_WP_GLOBAL_ROWS = ['W', 'V', 'U', 'T', 'S', 'R', 'Q', 'P'] as const
const BALCONY_WP_GLOBAL_LAST = BALCONY_WP_GLOBAL_ROWS.length - 1

function balconyWpGlobalRowIndex(row: string): number | null {
  const R = row.toUpperCase()
  const idx = BALCONY_WP_GLOBAL_ROWS.indexOf(R as (typeof BALCONY_WP_GLOBAL_ROWS)[number])
  return idx === -1 ? null : idx
}

function balconyWpGlobalAnchorOdd(rowIndex: number): number {
  const raw = 21 + ((15 - 21) * rowIndex) / BALCONY_WP_GLOBAL_LAST
  let a = Math.round(raw)
  if (a % 2 === 0) a -= 1
  return Math.max(15, Math.min(21, a))
}

function balconyWpGlobalAnchorEven(rowIndex: number): number {
  const raw = 20 + ((14 - 20) * rowIndex) / BALCONY_WP_GLOBAL_LAST
  let a = Math.round(raw)
  if (a % 2 === 1) a -= 1
  return Math.max(14, Math.min(20, a))
}

function balconyWpGlobalEffectiveAnchors(
  row: string,
  rowIndex: number
): { anchorOdd: number; anchorEven: number } {
  let anchorOdd = balconyWpGlobalAnchorOdd(rowIndex)
  let anchorEven = balconyWpGlobalAnchorEven(rowIndex)
  const R = row.toUpperCase()
  if (R === 'T') anchorEven = 18
  if (R === 'R') anchorOdd = 15
  return { anchorOdd, anchorEven }
}

/**
 * Offset horizontal **constant** (× `SEAT_CELL`) sur l’aile W→P depuis W21 / P15 (impairs) et symétrie pairs.
 */
function nudgeBalconyWpWingGlobalOffset<T extends SeatLike & { x: number; y: number }>(items: T[]): T[] {
  const dx = SEAT_MAP_BALCONY_WP_WING_GLOBAL_OFFSET_STEPS * SEAT_CELL
  if (dx === 0) return items
  const maxOdd = 55
  const maxEven = 56
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const idx = balconyWpGlobalRowIndex(pr.row)
    if (idx == null) return p
    const { anchorOdd, anchorEven } = balconyWpGlobalEffectiveAnchors(pr.row, idx)
    const n = pr.num

    if (n % 2 === 1 && n >= anchorOdd && n <= maxOdd) {
      return { ...p, x: p.x + dx }
    }
    if (n % 2 === 0 && n >= anchorEven && n <= maxEven) {
      return { ...p, x: p.x - dx }
    }
    return p
  })
}

function normalizeSeatLabel(label: string): string {
  return label
    .trim()
    .replace(/[\s\-–—]/g, '')
    .toUpperCase()
}

export function parseTheaterSeatLabel(label: string): { row: string; num: number } | null {
  const m = normalizeSeatLabel(label).match(/^([A-Z]{1,2})(\d+)$/)
  if (!m) return null
  return { row: m[1], num: parseInt(m[2], 10) }
}

function rowVerticalIndex(row: string): number {
  const R = row.toUpperCase()
  const order = ROW_ORDER_TOP_TO_BOTTOM as readonly string[]
  const idx = order.indexOf(R)
  return idx === -1 ? 999 : idx
}

function centerBoundsForRow(row: string): { maxEven: number; maxOdd: number } {
  const R = row.toUpperCase()
  if (R === 'O') return { maxEven: 4, maxOdd: 3 }
  if (R >= 'A' && R <= 'N') return { maxEven: 16, maxOdd: 17 }

  const balcony: Record<string, { maxEven: number; maxOdd: number }> = {
    P: { maxEven: 12, maxOdd: 13 },
    Q: { maxEven: 10, maxOdd: 11 },
    R: { maxEven: 10, maxOdd: 11 },
    S: { maxEven: 8, maxOdd: 9 },
    T: { maxEven: 8, maxOdd: 9 },
    U: { maxEven: 6, maxOdd: 7 },
    V: { maxEven: 6, maxOdd: 7 },
    W: { maxEven: 4, maxOdd: 5 },
    X: { maxEven: 16, maxOdd: 17 }
  }
  return balcony[R] ?? { maxEven: 12, maxOdd: 13 }
}

/** y : suit `ROW_ORDER_TOP_TO_BOTTOM` (balcon puis parterre, écart entre les deux blocs). */
function baseRowY(row: string): number {
  const idx = rowVerticalIndex(row)
  if (idx >= 999) {
    return 9000 + idx
  }

  let y = 0
  for (let i = 0; i < idx; i++) {
    y += i < BALCONY_ROW_COUNT ? ROW_HEIGHT_BAL : ROW_HEIGHT_ORCH
  }
  if (idx >= BALCONY_ROW_COUNT) {
    y += GAP_BALCONY_ORCHESTRA
  }
  return y
}

type Partitioned = {
  leftEvens: number[]
  centerEvens: number[]
  centerOdds: number[]
  rightOdds: number[]
}

function partitionSeatNumbers(nums: number[], row: string): Partitioned {
  const { maxEven, maxOdd } = centerBoundsForRow(row)
  const leftEvens: number[] = []
  const centerEvens: number[] = []
  const centerOdds: number[] = []
  const rightOdds: number[] = []

  for (const n of nums) {
    if (n % 2 === 0) {
      if (n <= maxEven) centerEvens.push(n)
      else leftEvens.push(n)
    } else {
      if (n <= maxOdd) centerOdds.push(n)
      else rightOdds.push(n)
    }
  }

  leftEvens.sort((a, b) => b - a)
  centerEvens.sort((a, b) => b - a)
  centerOdds.sort((a, b) => a - b)
  rightOdds.sort((a, b) => a - b)

  return { leftEvens, centerEvens, centerOdds, rightOdds }
}

/** Balcon P–W : ordre et trous « X » du plan officiel. */
function placeBalconyExplicitRow<T extends SeatLike>(
  rowKey: string,
  seatByNum: Map<number, T>,
  sequence: (string | null)[]
): { seat: T; x: number; y: number }[] {
  const seatByLabel = new Map<string, T>()
  for (const n of seatByNum.keys()) {
    const s = seatByNum.get(n)
    if (s) seatByLabel.set(normalizeSeatLabel(s.label), s)
  }
  const y = baseRowY(rowKey)
  let x = 0
  const positions: { seat: T; x: number; y: number }[] = []
  for (const token of sequence) {
    if (token === null) {
      x += BALCONY_GAP_PER_X
      continue
    }
    const seat = seatByLabel.get(normalizeSeatLabel(token))
    if (seat) {
      positions.push({ seat, x, y })
    }
    x += SEAT_CELL
  }
  return positions
}

/** Allée en x = 0 : gauche négatif, droit positif, puis translation vers le quadrant +. */
function placeRowSeatsRaw<T extends SeatLike>(
  rowKey: string,
  seatByNum: Map<number, T>
): { seat: T; x: number; y: number }[] {
  const explicit = balconyExplicitSequence(rowKey)
  if (explicit) {
    return placeBalconyExplicitRow(rowKey, seatByNum, explicit)
  }

  const nums = [...seatByNum.keys()]
  const { leftEvens, centerEvens, centerOdds, rightOdds } = partitionSeatNumbers(nums, rowKey)
  const positions: { seat: T; x: number; y: number }[] = []
  const y = baseRowY(rowKey)

  const R = rowKey.toUpperCase()
  /** Parterre A–O : une allée latérale de plus à chaque trou (aile ↔ centre), pour aérer le schéma. */
  const lateralAisle =
    R.length === 1 && R >= 'A' && R <= 'O' ? SIDE_AISLE_GAP * 2 : SIDE_AISLE_GAP

  const gapLeftToCenter = leftEvens.length > 0 && centerEvens.length > 0 ? lateralAisle : 0
  const gapCenterToRight = centerOdds.length > 0 && rightOdds.length > 0 ? lateralAisle : 0

  const leftBlockWidth =
    leftEvens.length * SEAT_CELL + gapLeftToCenter + centerEvens.length * SEAT_CELL

  /** Parterre A–O et rangée X : pas d’allée schématique entre le dernier pair central et le 1er impair (ex. A2|A1, N2|N1, X2|X1). */
  const halfCenterAisle =
    (R.length === 1 && R >= 'A' && R <= 'O') || R === 'X' ? 0 : AISLE_GAP / 2

  let x = -halfCenterAisle - leftBlockWidth

  for (const n of leftEvens) {
    const s = seatByNum.get(n)
    if (s) {
      positions.push({ seat: s, x, y })
      x += SEAT_CELL
    }
  }
  if (gapLeftToCenter) {
    x += gapLeftToCenter
  }
  for (const n of centerEvens) {
    const s = seatByNum.get(n)
    if (s) {
      positions.push({ seat: s, x, y })
      x += SEAT_CELL
    }
  }

  let xr = halfCenterAisle
  for (const n of centerOdds) {
    const s = seatByNum.get(n)
    if (s) {
      positions.push({ seat: s, x: xr, y })
      xr += SEAT_CELL
    }
  }
  if (gapCenterToRight) {
    xr += gapCenterToRight
  }
  for (const n of rightOdds) {
    const s = seatByNum.get(n)
    if (s) {
      positions.push({ seat: s, x: xr, y })
      xr += SEAT_CELL
    }
  }

  return positions
}

function seatDisplayWidth(p: { w?: number }): number {
  return p.w ?? SEAT_CELL
}

function rowHorizontalBand(rowLetter: string): 'balcony' | 'orchestra' | 'other' {
  const u = rowLetter.toUpperCase()
  if (u.length !== 1) return 'other'
  if (u >= 'P' && u <= 'X') return 'balcony'
  if (u >= 'A' && u <= 'O') return 'orchestra'
  return 'other'
}

/** Rangée balcon P→X (pour arc visuel, etc.). */
export function rowIsBalcony(rowLetter: string): boolean {
  return rowHorizontalBand(rowLetter) === 'balcony'
}

/** Centre chaque lettre de rangée sur le milieu horizontal d’un sous-ensemble de sièges. */
function centerRowGroup<T extends SeatLike & { x: number; y: number; w?: number }>(
  items: T[]
): { shifted: T[]; groupMid: number } {
  if (items.length === 0) return { shifted: items, groupMid: NaN }

  const byRowKey = new Map<string, T[]>()
  for (const p of items) {
    const pr = parseTheaterSeatLabel(p.label)
    const key = pr?.row ?? `__${p.id}`
    const arr = byRowKey.get(key) ?? []
    arr.push(p)
    byRowKey.set(key, arr)
  }

  let globalLeft = Infinity
  let globalRight = -Infinity
  const rowBounds = new Map<string, { left: number; right: number }>()

  for (const [key, arr] of byRowKey) {
    let left = Infinity
    let right = -Infinity
    for (const p of arr) {
      const w = seatDisplayWidth(p)
      left = Math.min(left, p.x)
      right = Math.max(right, p.x + w)
    }
    if (Number.isFinite(left)) {
      rowBounds.set(key, { left, right })
      globalLeft = Math.min(globalLeft, left)
      globalRight = Math.max(globalRight, right)
    }
  }

  if (!Number.isFinite(globalLeft)) return { shifted: items, groupMid: NaN }

  const globalMid = (globalLeft + globalRight) / 2
  const dxByRow = new Map<string, number>()
  for (const [key, { left, right }] of rowBounds) {
    dxByRow.set(key, globalMid - (left + right) / 2)
  }

  const shifted = items.map((p) => {
    const pr = parseTheaterSeatLabel(p.label)
    const key = pr?.row ?? `__${p.id}`
    const dx = dxByRow.get(key) ?? 0
    return { ...p, x: p.x + dx }
  })
  return { shifted, groupMid: globalMid }
}

/**
 * Balcon (P–X) et parterre (A–O) : centrages indépendants pour aligner les colonnes dans chaque bloc,
 * puis même axe vertical global qu’avant (parterre recalé sur l’axe du balcon) pour rester centré à l’écran.
 */
function centerRowsHorizontally<T extends SeatLike & { x: number; y: number; w?: number }>(
  items: T[]
): T[] {
  if (items.length === 0) return items

  const balcony: T[] = []
  const orchestra: T[] = []
  const rest: T[] = []

  for (const p of items) {
    const pr = parseTheaterSeatLabel(p.label)
    if (!pr) {
      rest.push(p)
      continue
    }
    const band = rowHorizontalBand(pr.row)
    if (band === 'balcony') balcony.push(p)
    else if (band === 'orchestra') orchestra.push(p)
    else rest.push(p)
  }

  const bal = centerRowGroup(balcony)
  const orch = centerRowGroup(orchestra)
  const r = centerRowGroup(rest)

  let orchShifted = orch.shifted
  if (Number.isFinite(bal.groupMid) && Number.isFinite(orch.groupMid)) {
    const d = bal.groupMid - orch.groupMid
    orchShifted = orch.shifted.map((p) => ({ ...p, x: p.x + d }))
  }

  return [...bal.shifted, ...orchShifted, ...r.shifted]
}

function applyRowLetterXAfterCenter<T extends SeatLike & { x: number; y: number }>(
  items: T[],
  seatSpacesByRow: Partial<Record<string, number>>
): T[] {
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const spaces = seatSpacesByRow[pr.row.toUpperCase()]
    if (spaces == null || spaces === 0) return p
    return { ...p, x: p.x + spaces * SEAT_CELL }
  })
}

/** Balcon rangée V : offset dédié sur les ailes (en plus de la rampe V + `outerVp`). */
const BALCONY_V_WING_LEFT_EVEN_MIN = 18
const BALCONY_V_WING_LEFT_EVEN_MAX = 48
const BALCONY_V_WING_RIGHT_ODD_MIN = 19
const BALCONY_V_WING_RIGHT_ODD_MAX = 49

/** Balcon rangée W : ailes (W20…W48 / W21…W49), amplitude `SEAT_MAP_BALCONY_W_OUTER_OFFSET_STEPS` seule. */
const BALCONY_W_WING_LEFT_EVEN_MIN = 20
const BALCONY_W_WING_LEFT_EVEN_MAX = 48
const BALCONY_W_WING_RIGHT_ODD_MIN = 21
const BALCONY_W_WING_RIGHT_ODD_MAX = 49

function nudgeBalconyWingBlocks<T extends SeatLike & { x: number; y: number }>(items: T[]): T[] {
  const scale = SEAT_MAP_BALCONY_WING_NUDGE_SCALE
  const outerVp = SEAT_MAP_BALCONY_WING_OUTER_OFFSET_STEPS * SEAT_CELL
  const outerV = SEAT_MAP_BALCONY_V_OUTER_OFFSET_STEPS * SEAT_CELL
  const outerW = SEAT_MAP_BALCONY_W_OUTER_OFFSET_STEPS * SEAT_CELL
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const R = pr.row.toUpperCase()
    const n = pr.num

    if (R === 'W') {
      let dx = 0
      if (n % 2 === 0 && n >= BALCONY_W_WING_LEFT_EVEN_MIN && n <= BALCONY_W_WING_LEFT_EVEN_MAX) {
        dx -= outerW
      }
      if (n % 2 === 1 && n >= BALCONY_W_WING_RIGHT_ODD_MIN && n <= BALCONY_W_WING_RIGHT_ODD_MAX) {
        dx += outerW
      }
      if (dx === 0) return p
      return { ...p, x: p.x + dx }
    }

    if (R === 'V') {
      const thresholds = BALCONY_WING_RAMP_THRESHOLDS.V
      const mult = balconyWingRampMultiplierSeatCells('V')
      if (mult == null) return p
      let dx = 0
      if (n % 2 === 0 && n >= thresholds.leftEvenMin) dx -= mult * SEAT_CELL * scale + outerVp
      if (n % 2 === 1 && n >= thresholds.rightOddMin) dx += mult * SEAT_CELL * scale + outerVp
      if (n % 2 === 0 && n >= BALCONY_V_WING_LEFT_EVEN_MIN && n <= BALCONY_V_WING_LEFT_EVEN_MAX) {
        dx -= outerV
      }
      if (n % 2 === 1 && n >= BALCONY_V_WING_RIGHT_ODD_MIN && n <= BALCONY_V_WING_RIGHT_ODD_MAX) {
        dx += outerV
      }
      if (dx === 0) return p
      return { ...p, x: p.x + dx }
    }

    const rowVp = R as (typeof BALCONY_WING_RAMP_ROWS_V_TO_P)[number]
    const thresholds = BALCONY_WING_RAMP_THRESHOLDS[rowVp]
    const mult = balconyWingRampMultiplierSeatCells(rowVp)
    if (!thresholds || mult == null) return p
    let dx = 0
    if (n % 2 === 0 && n >= thresholds.leftEvenMin) dx -= mult * SEAT_CELL * scale + outerVp
    if (n % 2 === 1 && n >= thresholds.rightOddMin) dx += mult * SEAT_CELL * scale + outerVp
    if (dx === 0) return p
    return { ...p, x: p.x + dx }
  })
}

/**
 * Balcon P/Q : bord extérieur allée — `…_ODD_OFFSET_STEPS` → gauche (−x) ; `…_EVEN_OFFSET_STEPS` → droite (+x).
 * Voir `constants.ts` pour les plages Q/P.
 */
function nudgeBalconyPQOuterWingTips<T extends SeatLike & { x: number; y: number }>(items: T[]): T[] {
  const oddLeft = SEAT_MAP_BALCONY_QP_OUTER_WING_ODD_OFFSET_STEPS * SEAT_CELL
  const evenRight = SEAT_MAP_BALCONY_QP_OUTER_WING_EVEN_OFFSET_STEPS * SEAT_CELL
  if (oddLeft === 0 && evenRight === 0) return items
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const R = pr.row.toUpperCase()
    const n = pr.num

    if (R === 'Q') {
      if (n % 2 === 1 && n >= 43 && n <= 51 && oddLeft !== 0) return { ...p, x: p.x - oddLeft }
      if (n % 2 === 0 && n >= 42 && n <= 50 && evenRight !== 0) return { ...p, x: p.x + evenRight }
      return p
    }
    if (R === 'P') {
      if (n % 2 === 1 && n >= 41 && n <= 55 && oddLeft !== 0) return { ...p, x: p.x - oddLeft }
      if (n % 2 === 0 && n >= 40 && n <= 54 && evenRight !== 0) return { ...p, x: p.x + evenRight }
      return p
    }
    return p
  })
}

/** Balcon V→P : bloc central — même formule que le parterre ; limites paires / impaires par rangée. */
const BALCONY_VP_CENTER_RAMP_ROWS = ['V', 'U', 'T', 'S', 'R', 'Q', 'P'] as const

const BALCONY_VP_CENTER_BOUNDS = {
  V: { maxEven: 16, maxOdd: 17 },
  U: { maxEven: 16, maxOdd: 17 },
  T: { maxEven: 16, maxOdd: 15 },
  S: { maxEven: 14, maxOdd: 15 },
  R: { maxEven: 14, maxOdd: 13 },
  Q: { maxEven: 12, maxOdd: 13 },
  P: { maxEven: 12, maxOdd: 13 }
} as const satisfies Record<
  (typeof BALCONY_VP_CENTER_RAMP_ROWS)[number],
  { maxEven: number; maxOdd: number }
>

function balconyVpCenterRowK(row: string): number | null {
  const R = row.toUpperCase() as (typeof BALCONY_VP_CENTER_RAMP_ROWS)[number]
  const idx = BALCONY_VP_CENTER_RAMP_ROWS.indexOf(R)
  return idx === -1 ? null : idx + 1
}

function nudgeBalconyVpCenterAlternatingRamp<T extends SeatLike & { x: number; y: number }>(
  items: T[]
): T[] {
  const tier = SEAT_MAP_BALCONY_VP_CENTER_NUDGE_PER_TIER
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const k = balconyVpCenterRowK(pr.row)
    if (k == null) return p
    const R = pr.row.toUpperCase() as (typeof BALCONY_VP_CENTER_RAMP_ROWS)[number]
    const bounds = BALCONY_VP_CENTER_BOUNDS[R]
    const n = pr.num
    const unit = tier * k * SEAT_CELL
    let dx = 0
    if (n % 2 === 0 && n >= 2 && n <= bounds.maxEven) {
      dx -= (n / 2) * unit
    } else if (n % 2 === 1 && n >= 1 && n <= bounds.maxOdd) {
      dx += ((n - 1) / 2) * unit
    }
    if (dx === 0) return p
    return { ...p, x: p.x + dx }
  })
}

/** Parterre N→A : sièges centraux — pairs −(n/2)×unit, impairs +((n−1)/2)×unit ; unit = PER_TIER×k×SEAT_CELL. */
function nudgeOrchestraNCenterAlternatingRamp<T extends SeatLike & { x: number; y: number }>(
  items: T[]
): T[] {
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const k = orchCenterNudgeRowStepsMultiplier(pr.row)
    if (k == null) return p
    const { maxEven, maxOdd } = centerBoundsForRow(pr.row)
    const n = pr.num
    const unit = SEAT_MAP_ORCH_CENTER_NUDGE_PER_TIER * k * SEAT_CELL
    let dx = 0
    if (n % 2 === 0 && n >= 2 && n <= maxEven) {
      dx -= (n / 2) * unit
    } else if (n % 2 === 1 && n >= 1 && n <= maxOdd) {
      dx += ((n - 1) / 2) * unit
    }
    if (dx === 0) return p
    return { ...p, x: p.x + dx }
  })
}

function shiftBalconyBlockUp<T extends SeatLike & { x: number; y: number }>(items: T[]): T[] {
  const dy = BALCONY_BLOCK_SHIFT_UP
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const R = pr.row.toUpperCase()
    if (R >= 'P' && R <= 'X') return { ...p, y: p.y - dy }
    return p
  })
}

function translatePositive<T extends { x: number; y: number }>(
  items: T[],
  pad: number
): T[] {
  if (!items.length) return items
  let minX = Infinity
  let minY = Infinity
  for (const p of items) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
  }
  const dx = pad - minX
  const dy = pad - minY
  return items.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }))
}

export function layoutYerresTheaterSeats<T extends SeatLike>(seats: T[]): (T & { x: number; y: number })[] {
  const byRow = new Map<string, { seat: T; num: number }[]>()
  const unparsed: T[] = []

  for (const s of seats) {
    const p = parseTheaterSeatLabel(s.label)
    if (!p) {
      unparsed.push(s)
      continue
    }
    const list = byRow.get(p.row) ?? []
    list.push({ seat: s, num: p.num })
    byRow.set(p.row, list)
  }

  const raw: (T & { x: number; y: number })[] = []
  const rowKeys = [...byRow.keys()].sort((a, b) => rowVerticalIndex(a) - rowVerticalIndex(b))

  for (const rowKey of rowKeys) {
    const rowSeats = byRow.get(rowKey)!
    const seatByNum = new Map<number, T>()
    for (const { seat, num } of rowSeats) {
      seatByNum.set(num, seat)
    }
    const placed = placeRowSeatsRaw(rowKey, seatByNum)
    for (const { seat, x, y } of placed) {
      raw.push({ ...seat, x, y })
    }
  }

  const shifted = translatePositive(
    shiftBalconyBlockUp(
      nudgeOrchestraNCenterAlternatingRamp(
        nudgeBalconyVpCenterAlternatingRamp(
          nudgeOrchestraWingProgressiveFromAisle(
            nudgeBalconyVpWingProgressiveFromAisle(
              nudgeBalconyWpWingGlobalOffset(
                nudgeOrchestraOaWingGlobalOffset(
                  nudgeOrchestraNWingRamp(
                    nudgeBalconyPQOuterWingTips(
                      nudgeBalconyWingBlocks(
                        applyRowLetterXAfterCenter(centerRowsHorizontally(raw), ROW_NUDGE_SEAT_SPACES_AFTER_CENTER)
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),
    LAYOUT_PAD
  )

  let maxY = 0
  let maxX = 0
  for (const s of shifted) {
    maxY = Math.max(maxY, s.y)
    maxX = Math.max(maxX, s.x)
  }

  unparsed.forEach((seat, i) => {
    shifted.push({
      ...seat,
      x: LAYOUT_PAD + (i % FALLBACK_COLS) * FALLBACK_CELL,
      y: maxY + ROW_HEIGHT_ORCH + 8 + Math.floor(i / FALLBACK_COLS) * FALLBACK_CELL
    } as T & { x: number; y: number })
  })

  return shifted
}

/** viewBox SVG à partir des sièges placés (coin haut-gauche du carré). */
export function seatMapViewBoxString(
  seats: { x: number; y: number; w?: number; h?: number }[],
  seatSize: number,
  pad = 16
): string {
  if (!seats.length) return '0 0 560 420'
  const padX = pad + SEAT_MAP_VIEWBOX_EXTRA_HORIZONTAL
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of seats) {
    const sw = s.w ?? seatSize
    const sh = s.h ?? seatSize
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + sw)
    maxY = Math.max(maxY, s.y + sh)
  }
  const w = maxX - minX + 2 * padX
  const h = maxY - minY + 2 * pad
  return `${minX - padX} ${minY - pad} ${w} ${h}`
}
