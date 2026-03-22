/**
 * Carte des sièges — **schéma** aligné sur la logique du plan Yerres (pairs / impairs / allée),
 * pas une reproduction pixel-perfect du JPEG 3D (cela exigerait des coordonnées mesurées à la main
 * ou un outil de calage, pas de l’OCR).
 */

import {
  SEAT_MAP_ORCH_CENTER_NUDGE_PER_TIER,
  SEAT_MAP_ORCH_WING_NUDGE_SCALE
} from '../constants'
import { BALCONY_GAP_PER_X, balconyExplicitSequence } from './yerresBalconyExplicit'

export type SeatLike = {
  id: string
  label: string
  status: string
}

const SEAT_CELL = 13
const AISLE_GAP = 7
/** Allée latérale (aile ↔ bloc centre), comme sur le plan entre 18|16 et 17|19, O6|O4, O3|O5. */
const SIDE_AISLE_GAP = 14
const ROW_HEIGHT_BAL = 15
const ROW_HEIGHT_ORCH = 16
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
 * Balcon (lignes explicites `yerresBalconyExplicit`) : décalage des ailes gauche / droite en pas `SEAT_CELL`.
 * Gauche : pairs avec num ≥ `leftEvenMin` (segment avant le 1ᵉʳ `X X`).
 * Droite : impairs avec num ≥ `rightOddMin` (segment après le 2ᵉ `X X`).
 */
type BalconyWingNudgeSpec = {
  rowLetter: string
  leftEvenMin: number
  leftSeatSpaces: number
  rightOddMin: number
  rightSeatSpaces: number
}

const BALCONY_WING_NUDGE_BY_ROW: BalconyWingNudgeSpec[] = [
  { rowLetter: 'V', leftEvenMin: 18, leftSeatSpaces: -1, rightOddMin: 19, rightSeatSpaces: 1 },
  { rowLetter: 'U', leftEvenMin: 18, leftSeatSpaces: -1, rightOddMin: 19, rightSeatSpaces: 1 },
  { rowLetter: 'T', leftEvenMin: 18, leftSeatSpaces: -1.5, rightOddMin: 17, rightSeatSpaces: 1.5 },
  { rowLetter: 'S', leftEvenMin: 16, leftSeatSpaces: -2, rightOddMin: 17, rightSeatSpaces: 2 },
  { rowLetter: 'R', leftEvenMin: 16, leftSeatSpaces: -2.5, rightOddMin: 15, rightSeatSpaces: 2.5 },
  { rowLetter: 'Q', leftEvenMin: 14, leftSeatSpaces: -3, rightOddMin: 15, rightSeatSpaces: 3 },
  { rowLetter: 'P', leftEvenMin: 14, leftSeatSpaces: -3, rightOddMin: 15, rightSeatSpaces: 3 }
]

const BALCONY_WING_NUDGE_LOOKUP = new Map(
  BALCONY_WING_NUDGE_BY_ROW.map((s) => [s.rowLetter, s])
)

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

export function normalizeSeatLabel(label: string): string {
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

function nudgeBalconyWingBlocks<T extends SeatLike & { x: number; y: number }>(items: T[]): T[] {
  return items.map((p) => {
    const pr = parseTheaterSeatLabel((p.label ?? '').trim())
    if (!pr || pr.row.length !== 1) return p
    const spec = BALCONY_WING_NUDGE_LOOKUP.get(pr.row.toUpperCase())
    if (!spec) return p
    const n = pr.num
    let dx = 0
    if (n % 2 === 0 && n >= spec.leftEvenMin) dx += spec.leftSeatSpaces * SEAT_CELL
    if (n % 2 === 1 && n >= spec.rightOddMin) dx += spec.rightSeatSpaces * SEAT_CELL
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
    nudgeOrchestraNCenterAlternatingRamp(
      nudgeOrchestraNWingRamp(
        nudgeBalconyWingBlocks(
          applyRowLetterXAfterCenter(centerRowsHorizontally(raw), ROW_NUDGE_SEAT_SPACES_AFTER_CENTER)
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
  const w = maxX - minX + 2 * pad
  const h = maxY - minY + 2 * pad
  return `${minX - pad} ${minY - pad} ${w} ${h}`
}
