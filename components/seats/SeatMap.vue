<template>
  <div class="seat-map_container">
    <svg :viewBox="svgViewBox" class="container__svg" preserveAspectRatio="xMidYMid meet">
      <g v-if="balconyZone" class="svg__zone svg__zone--balcony">
        <rect
          :x="balconyZone.x"
          :y="balconyZone.y"
          :width="balconyZone.w"
          :height="balconyZone.h"
          rx="3"
          ry="3"
          class="svg__zone-rect svg__zone-rect--balcony"
        />
        <text :x="balconyZone.titleX" :y="balconyZone.titleY" class="svg__zone-title">Balcon</text>
        <text :x="balconyZone.subtitleX" :y="balconyZone.subtitleY" class="svg__zone-subtitle">
          Rangées P à X
        </text>
      </g>
      <g v-if="parterreZone" class="svg__zone svg__zone--parterre">
        <rect
          :x="parterreZone.x"
          :y="parterreZone.y"
          :width="parterreZone.w"
          :height="parterreZone.h"
          rx="3"
          ry="3"
          class="svg__zone-rect svg__zone-rect--parterre"
        />
        <text :x="parterreZone.titleX" :y="parterreZone.titleY" class="svg__zone-title">Parterre</text>
        <text :x="parterreZone.subtitleX" :y="parterreZone.subtitleY" class="svg__zone-subtitle">
          Rangées O à A
        </text>
      </g>
      <g v-if="stageBlock" class="svg__stage">
        <rect
          :x="stageBlock.x"
          :y="stageBlock.y"
          :width="stageBlock.w"
          :height="stageBlock.h"
          rx="2"
          ry="2"
          fill="#5c4033"
          stroke="rgba(30, 30, 30, 0.4)"
          stroke-width="0.5"
        />
        <text
          :x="stageBlock.cx"
          :y="stageBlock.cy"
          class="svg__stage-label"
          dominant-baseline="middle"
        >
          Scène
        </text>
      </g>
      <rect
        v-for="seat in seats"
        :key="seat.id"
        :x="seat.x"
        :y="seat.y"
        :width="SEAT_SIZE"
        :height="SEAT_SIZE"
        :rx="SEAT_RADIUS"
        :ry="SEAT_RADIUS"
        :transform="seatArcTransform(seat)"
        :fill="getSeatFill(seat)"
        stroke="rgba(30, 30, 30, 0.35)"
        stroke-width="0.45"
        :class="[
          'svg__seat',
          {
            'svg__seat--clickable': isSeatClickable(seat),
            'svg__seat--disabled': !isSeatClickable(seat),
            'svg__seat--dimmed': getSeatOpacity(seat) < 1
          }
        ]"
        :title="getSeatTitle(seat)"
        @click="handleSeatClick(seat)"
      />
      <text
        v-for="seat in seats"
        :key="seat.id + '-label'"
        :x="seat.x + SEAT_SIZE / 2"
        :y="seat.y + SEAT_SIZE / 2 + 1.5"
        :transform="seatArcTransform(seat)"
        class="svg__label"
      >
        {{ seat.label }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Seat, ActiveOrder } from '../../types'
import content from '../../locales/fr.json'
import {
  SEAT_MAP_BALCONY_ARC_ANGLE_CURVE_POWER,
  SEAT_MAP_BALCONY_ARC_ANGLE_SCALE,
  SEAT_MAP_BALCONY_ARC_BIAS_DEGREES,
  SEAT_MAP_BALCONY_ARC_DEPTH_NUDGE_CURVE_POWER,
  SEAT_MAP_BALCONY_ARC_DEPTH_NUDGE_MAX,
  SEAT_MAP_BALCONY_ARC_EPS_DEPTH_PX,
  SEAT_MAP_BALCONY_ARC_EPS_ROTATION_DEG,
  SEAT_MAP_BALCONY_ARC_EPS_SCALE_X,
  SEAT_MAP_BALCONY_ARC_MAX_ABS_DEGREES,
  SEAT_MAP_BALCONY_ARC_PIVOT_OFFSET_X,
  SEAT_MAP_BALCONY_ARC_PIVOT_OFFSET_Y,
  SEAT_MAP_BALCONY_ARC_REF_OFFSET_X,
  SEAT_MAP_BALCONY_ARC_REF_OFFSET_Y,
  SEAT_MAP_BALCONY_ARC_ROTATION_SIGN,
  SEAT_MAP_BALCONY_ARC_SCALE_X_CURVE_POWER,
  SEAT_MAP_BALCONY_ARC_SCALE_X_MIN
} from '../../constants'
import {
  parseTheaterSeatLabel,
  rowIsBalcony,
  seatMapViewBoxString
} from '../../utils/yerresSeatLayout'

const SEAT_SIZE = 13
const SEAT_RADIUS = 1.2

const SEAT_COLORS = {
  paid: '#e53935',
  hold: '#ffb300',
  selected: '#43a047',
  free: 'rgba(250, 250, 250, 0.78)'
} as const

const props = defineProps<{
  seats: Seat[]
  selectedSeatIds: string[]
  activeOrder: ActiveOrder | null
  /** Aligné sur `MAX_SEATS_PER_ORDER` (API hold-seats). */
  maxSeatsPerOrder: number
}>()

const emit = defineEmits<{
  'seat-click': [seatId: string]
}>()

const selectedSet = computed(() => new Set(props.selectedSeatIds))

function arcCurvePower(p: number): number {
  return Number.isFinite(p) && p > 0 ? p : 1
}

/** Écart angulaire siège vs référence (non borné), radians ∈ ]−π, π]. */
function balconyDeltaRadFromRef(
  scx: number,
  scy: number,
  pivot: { x: number; y: number },
  refX: number,
  refY: number
): number {
  const radSeat = Math.atan2(scy - pivot.y, scx - pivot.x)
  const radRef = Math.atan2(refY - pivot.y, refX - pivot.x)
  let d = radSeat - radRef
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

function balconySeatsFiltered(): Seat[] {
  return props.seats.filter((s) => {
    const p = parseTheaterSeatLabel(s.label)
    return p && rowIsBalcony(p.row)
  })
}

/** Centre horizontal du balcon (monde SVG). */
const balconyCenterX = computed(() => {
  const list = balconySeatsFiltered()
  if (list.length === 0) return 0
  let min = Infinity
  let max = -Infinity
  for (const s of list) {
    const cx = s.x + SEAT_SIZE / 2
    min = Math.min(min, cx)
    max = Math.max(max, cx)
  }
  return (min + max) / 2
})

/** Milieu vertical des centres sièges balcon (référence d’angle au centre du bloc). */
const balconyMidCenterY = computed(() => {
  const list = balconySeatsFiltered()
  if (list.length === 0) return 0
  let sum = 0
  for (const s of list) {
    sum += s.y + SEAT_SIZE / 2
  }
  return sum / list.length
})

/** Bas du balcon (bord bas des sièges) en monde SVG. */
const balconyBottomY = computed(() => {
  const list = balconySeatsFiltered()
  if (list.length === 0) return 0
  let max = -Infinity
  for (const s of list) {
    max = Math.max(max, s.y + SEAT_SIZE)
  }
  return max
})

/** Pivot d’arc en coordonnées monde : sous le balcon. */
const balconyArcPivotWorld = computed(() => ({
  x: balconyCenterX.value + SEAT_MAP_BALCONY_ARC_PIVOT_OFFSET_X,
  y: balconyBottomY.value + SEAT_MAP_BALCONY_ARC_PIVOT_OFFSET_Y
}))

/** Demi-envergure horizontale du balcon (max |centre siège − ref x|), pour normaliser le scaleX. */
const balconyMaxAbsDx = computed(() => {
  const list = balconySeatsFiltered()
  const axis = balconyCenterX.value + SEAT_MAP_BALCONY_ARC_REF_OFFSET_X
  if (list.length === 0) return 0
  let max = 0
  for (const s of list) {
    const scx = s.x + SEAT_SIZE / 2
    max = Math.max(max, Math.abs(scx - axis))
  }
  return max
})

/** Max |Δangle| sur le balcon (géométrie réelle), pour normaliser la translation « profondeur ». */
const balconyMaxAbsDeltaRad = computed(() => {
  const list = balconySeatsFiltered()
  const pivot = balconyArcPivotWorld.value
  const refX = balconyCenterX.value + SEAT_MAP_BALCONY_ARC_REF_OFFSET_X
  const refY = balconyMidCenterY.value + SEAT_MAP_BALCONY_ARC_REF_OFFSET_Y
  if (list.length === 0) return 0
  let max = 0
  for (const s of list) {
    const scx = s.x + SEAT_SIZE / 2
    const scy = s.y + SEAT_SIZE / 2
    const d = Math.abs(balconyDeltaRadFromRef(scx, scy, pivot, refX, refY))
    max = Math.max(max, d)
  }
  return max
})

type BalconyArcSpec =
  | { mode: 'identity' }
  | {
      mode: 'depthRotScale' | 'rotScale'
      tx: number
      ty: number
      cx: number
      cy: number
      deg: number
      sx: number
    }
  | { mode: 'depthRot' | 'rot'; tx: number; ty: number; cx: number; cy: number; deg: number }
  | { mode: 'depthScale' | 'scale'; tx: number; ty: number; cx: number; cy: number; sx: number }

/** Même géométrie que l’attribut `transform` SVG des sièges balcon (pour bbox zone / arc). */
function computeBalconyArcSpec(seat: Seat): BalconyArcSpec {
  const pr = parseTheaterSeatLabel(seat.label)
  if (!pr || !rowIsBalcony(pr.row)) return { mode: 'identity' }

  const cx = seat.x + SEAT_SIZE / 2
  const cy = seat.y + SEAT_SIZE / 2
  const pivot = balconyArcPivotWorld.value
  const refX = balconyCenterX.value + SEAT_MAP_BALCONY_ARC_REF_OFFSET_X
  const refY = balconyMidCenterY.value + SEAT_MAP_BALCONY_ARC_REF_OFFSET_Y

  const powAngle = arcCurvePower(SEAT_MAP_BALCONY_ARC_ANGLE_CURVE_POWER)
  const powDepth = arcCurvePower(SEAT_MAP_BALCONY_ARC_DEPTH_NUDGE_CURVE_POWER)
  const powScaleX = arcCurvePower(SEAT_MAP_BALCONY_ARC_SCALE_X_CURVE_POWER)

  const maxDx = balconyMaxAbsDx.value
  const minSx = Math.min(1, Math.max(0, SEAT_MAP_BALCONY_ARC_SCALE_X_MIN))
  let scaleX = 1
  if (maxDx > 0 && minSx < 1) {
    const u0 = Math.min(1, Math.abs(cx - refX) / maxDx)
    const u = Math.pow(u0, powScaleX)
    scaleX = 1 - u * (1 - minSx)
  }

  const deltaRad = balconyDeltaRadFromRef(cx, cy, pivot, refX, refY)
  const maxAbs = balconyMaxAbsDeltaRad.value
  const u0Lat = maxAbs > 0 ? Math.min(1, Math.abs(deltaRad) / maxAbs) : 0
  const uDepth = Math.pow(u0Lat, powDepth)

  const nudgeMax = Math.max(0, SEAT_MAP_BALCONY_ARC_DEPTH_NUDGE_MAX)
  let tx = 0
  let ty = 0
  if (nudgeMax > 0 && maxAbs > 0) {
    const len = Math.hypot(pivot.x - cx, pivot.y - cy)
    if (len > 1e-6) {
      const step = uDepth * nudgeMax
      tx = ((pivot.x - cx) / len) * step
      ty = ((pivot.y - cy) / len) * step
    }
  }

  let shapedRad = deltaRad
  if (maxAbs > 0) {
    const u = Math.pow(u0Lat, powAngle)
    shapedRad = Math.sign(deltaRad) * u * maxAbs
  }

  const rotSign = SEAT_MAP_BALCONY_ARC_ROTATION_SIGN < 0 ? -1 : 1
  let deg =
    ((shapedRad * 180) / Math.PI) * SEAT_MAP_BALCONY_ARC_ANGLE_SCALE * rotSign +
    SEAT_MAP_BALCONY_ARC_BIAS_DEGREES
  const cap = SEAT_MAP_BALCONY_ARC_MAX_ABS_DEGREES
  deg = Math.max(-cap, Math.min(cap, deg))

  const hasRot = Math.abs(deg) >= SEAT_MAP_BALCONY_ARC_EPS_ROTATION_DEG
  const hasScaleX = scaleX < 1 - SEAT_MAP_BALCONY_ARC_EPS_SCALE_X
  const hasDepth =
    Math.abs(tx) > SEAT_MAP_BALCONY_ARC_EPS_DEPTH_PX ||
    Math.abs(ty) > SEAT_MAP_BALCONY_ARC_EPS_DEPTH_PX
  if (!hasRot && !hasScaleX && !hasDepth) return { mode: 'identity' }

  const dtx = hasDepth ? tx : 0
  const dty = hasDepth ? ty : 0

  if (hasRot && hasScaleX) {
    return { mode: hasDepth ? 'depthRotScale' : 'rotScale', tx: dtx, ty: dty, cx, cy, deg, sx: scaleX }
  }
  if (hasRot) {
    return { mode: hasDepth ? 'depthRot' : 'rot', tx: dtx, ty: dty, cx, cy, deg }
  }
  return { mode: hasDepth ? 'depthScale' : 'scale', tx: dtx, ty: dty, cx, cy, sx: scaleX }
}

function mapBalconyArcPoint(px: number, py: number, spec: BalconyArcSpec): { x: number; y: number } {
  if (spec.mode === 'identity') return { x: px, y: py }

  switch (spec.mode) {
    case 'depthRotScale':
    case 'rotScale': {
      const { tx, ty, cx, cy, deg, sx } = spec
      const rad = (deg * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const x = px + tx + cx
      const y = py + ty + cy
      const rx = x * cos - y * sin
      const ry = x * sin + y * cos
      return { x: rx * sx - cx, y: ry - cy }
    }
    case 'depthRot':
    case 'rot': {
      const { tx, ty, cx, cy, deg } = spec
      const rad = (deg * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const x = px + tx - cx
      const y = py + ty - cy
      return { x: x * cos - y * sin + cx, y: x * sin + y * cos + cy }
    }
    case 'depthScale':
    case 'scale': {
      const { tx, ty, cx, cy, sx } = spec
      const x = px + tx + cx
      const y = py + ty + cy
      return { x: x * sx - cx, y: y - cy }
    }
    default:
      return { x: px, y: py }
  }
}

function seatArcTransform(seat: Seat): string | undefined {
  const spec = computeBalconyArcSpec(seat)
  if (spec.mode === 'identity') return undefined

  const cx = seat.x + SEAT_SIZE / 2
  const cy = seat.y + SEAT_SIZE / 2
  const hasDepth =
    spec.mode === 'depthRotScale' ||
    spec.mode === 'depthRot' ||
    spec.mode === 'depthScale'

  const parts: string[] = []
  if (hasDepth) parts.push(`translate(${spec.tx} ${spec.ty})`)
  if (spec.mode === 'depthRotScale' || spec.mode === 'rotScale') {
    parts.push(`translate(${cx} ${cy}) rotate(${spec.deg}) scale(${spec.sx} 1) translate(${-cx} ${-cy})`)
  } else if (spec.mode === 'depthRot' || spec.mode === 'rot') {
    parts.push(`rotate(${spec.deg} ${cx} ${cy})`)
  } else if (spec.mode === 'depthScale' || spec.mode === 'scale') {
    parts.push(`translate(${cx} ${cy}) scale(${spec.sx} 1) translate(${-cx} ${-cy})`)
  }
  return parts.join(' ')
}

function rowHorizontalExtent(seats: Seat[], rowLetter: string): { minX: number; maxX: number } | null {
  const R = rowLetter.toUpperCase()
  let minX = Infinity
  let maxX = -Infinity
  for (const s of seats) {
    const pr = parseTheaterSeatLabel(s.label)
    if (!pr || pr.row.toUpperCase() !== R) continue
    minX = Math.min(minX, s.x)
    maxX = Math.max(maxX, s.x + SEAT_SIZE)
  }
  if (!Number.isFinite(minX)) return null
  return { minX, maxX }
}

function rowMaxBottomY(seats: Seat[], rowLetter: string): number | null {
  const R = rowLetter.toUpperCase()
  let maxY = -Infinity
  for (const s of seats) {
    const pr = parseTheaterSeatLabel(s.label)
    if (!pr || pr.row.toUpperCase() !== R) continue
    maxY = Math.max(maxY, s.y + SEAT_SIZE)
  }
  if (!Number.isFinite(maxY)) return null
  return maxY
}

/**
 * Écart souhaité sièges → bord du cadre, **identique** en haut / bas / gauche / droite (balcon et parterre).
 * Réduit si besoin pour garder un vide entre les deux cadres.
 */
/** Inset sièges → bord du cadre (identique les 4 côtés, balcon et parterre). */
const ZONE_FRAME_UNIFORM_INSET_DESIRED = 22
/** Espace minimal entre le bas du cadre balcon et le haut du cadre parterre. */
const MIN_GAP_BETWEEN_BALCONY_PARTERRE_ZONES = 12
/** Marge du texte depuis le coin haut-gauche du cadre (identique balcon / parterre). */
const ZONE_FRAME_LABEL_CORNER_PAD_X = 6.75
const ZONE_FRAME_LABEL_CORNER_PAD_Y = 6
/** Écart vertical entre le haut du titre et le haut du sous-titre (`dominant-baseline: hanging`). */
const ZONE_FRAME_LABEL_LINE_STEP = 7.85
/** Allonge un peu le cadre balcon vers le bas (sièges P–X inchangés). */
const BALCONY_ZONE_EXTRA_BOTTOM = 6

type SeatBounds = { minX: number; minY: number; maxX: number; maxY: number }
type ZoneFrameOptions = { extraBottom?: number }

function seatBoundsForRowFilter(
  seats: Seat[],
  includeRow: (rowUpper: string) => boolean
): SeatBounds | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of seats) {
    const pr = parseTheaterSeatLabel(s.label)
    if (!pr || pr.row.length !== 1) continue
    const R = pr.row.toUpperCase()
    if (!includeRow(R)) continue
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + SEAT_SIZE)
    maxY = Math.max(maxY, s.y + SEAT_SIZE)
  }
  if (!Number.isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

/** Cadre autour d’une bbox sièges : inset identique sur les quatre côtés ; `extraBottom` optionnel (balcon). */
function paddedZoneFrameFromBounds(b: SeatBounds, inset: number, opts?: ZoneFrameOptions) {
  const extraBottom = opts?.extraBottom ?? 0
  const x = b.minX - inset
  const y = b.minY - inset
  const w = b.maxX - b.minX + 2 * inset
  const h = b.maxY - b.minY + 2 * inset + extraBottom
  const titleX = x + ZONE_FRAME_LABEL_CORNER_PAD_X
  const titleY = y + ZONE_FRAME_LABEL_CORNER_PAD_Y
  const subtitleX = titleX
  const subtitleY = titleY + ZONE_FRAME_LABEL_LINE_STEP
  return {
    x,
    y,
    w,
    h,
    titleX,
    titleY,
    subtitleX,
    subtitleY
  }
}

/**
 * Inset unique : identique partout ; plafonné pour que
 * (espace entre bbox balcon et parterre) − 2×inset ≥ MIN_GAP.
 */
function uniformInsetForBalconyParterre(bBal: SeatBounds | null, bPar: SeatBounds | null): number {
  if (!bBal || !bPar) return ZONE_FRAME_UNIFORM_INSET_DESIRED
  const span = bPar.minY - bBal.maxY
  const maxInset = (span - MIN_GAP_BETWEEN_BALCONY_PARTERRE_ZONES) / 2
  return Math.max(0, Math.min(ZONE_FRAME_UNIFORM_INSET_DESIRED, maxInset))
}

/** Bbox balcon P–X en coordonnées finales (coins sièges après transform d’arc). */
function seatBoundsBalconyRowsWithArc(seats: Seat[]): SeatBounds | null {
  const corners: [number, number][] = [
    [0, 0],
    [SEAT_SIZE, 0],
    [SEAT_SIZE, SEAT_SIZE],
    [0, SEAT_SIZE]
  ]
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of seats) {
    const pr = parseTheaterSeatLabel(s.label)
    if (!pr || pr.row.length !== 1) continue
    const R = pr.row.toUpperCase()
    if (R < 'P' || R > 'X') continue
    const spec = computeBalconyArcSpec(s)
    for (const [dx, dy] of corners) {
      const pt = mapBalconyArcPoint(s.x + dx, s.y + dy, spec)
      minX = Math.min(minX, pt.x)
      minY = Math.min(minY, pt.y)
      maxX = Math.max(maxX, pt.x)
      maxY = Math.max(maxY, pt.y)
    }
  }
  if (!Number.isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

const balconySeatBounds = computed(() => seatBoundsBalconyRowsWithArc(props.seats))
const parterreSeatBounds = computed(() =>
  seatBoundsForRowFilter(props.seats, (R) => R >= 'A' && R <= 'O')
)

const zoneFrameUniformInset = computed(() =>
  uniformInsetForBalconyParterre(balconySeatBounds.value, parterreSeatBounds.value)
)

/** Balcon : rangées P à X. */
const balconyZone = computed(() => {
  const b = balconySeatBounds.value
  if (!b) return null
  return paddedZoneFrameFromBounds(b, zoneFrameUniformInset.value, {
    extraBottom: BALCONY_ZONE_EXTRA_BOTTOM
  })
})

/** Parterre : rangées O à A (sans la scène). */
const parterreZone = computed(() => {
  const b = parterreSeatBounds.value
  if (!b) return null
  return paddedZoneFrameFromBounds(b, zoneFrameUniformInset.value)
})

/** Espace entre le bas des sièges A (et le cadre parterre) et le haut du bloc « Scène ». */
const STAGE_GAP_BELOW_ROW_A = 30

/** Bloc « Scène » sous la rangée A, largeur = emprise horizontale de la rangée H. */
const stageBlock = computed(() => {
  const hBand = rowHorizontalExtent(props.seats, 'H')
  const aBottom = rowMaxBottomY(props.seats, 'A')
  if (!hBand || aBottom == null) return null
  const gap = STAGE_GAP_BELOW_ROW_A
  const h = Math.max(26, Math.min(40, (hBand.maxX - hBand.minX) * 0.12))
  const y = aBottom + gap
  const w = hBand.maxX - hBand.minX
  return {
    x: hBand.minX,
    y,
    w,
    h,
    cx: hBand.minX + w / 2,
    cy: y + h / 2 + 0.5
  }
})

const mapOverlayRects = computed(() => {
  const out: { x: number; y: number; w: number; h: number }[] = []
  if (balconyZone.value) out.push(balconyZone.value)
  if (parterreZone.value) out.push(parterreZone.value)
  if (stageBlock.value) out.push(stageBlock.value)
  return out.length ? out : undefined
})

const svgViewBox = computed(() => seatMapViewBoxString(props.seats, SEAT_SIZE, 18, mapOverlayRects.value))

function getSeatFill(seat: Seat) {
  if (seat.status === 'paid') return SEAT_COLORS.paid
  if (seat.status === 'hold') return SEAT_COLORS.hold
  if (selectedSet.value.has(seat.id)) return SEAT_COLORS.selected
  return SEAT_COLORS.free
}

function isSeatClickable(seat: Seat) {
  if (seat.status !== 'free' || props.activeOrder) return false
  if (selectedSet.value.has(seat.id)) return true
  return props.selectedSeatIds.length < props.maxSeatsPerOrder
}

function getSeatOpacity(seat: Seat) {
  return seat.status === 'free' && props.activeOrder ? 0.4 : 1
}

function getSeatTitle(seat: Seat) {
  if (props.activeOrder && seat.status === 'free') return content.home.seats.tooltip.reservationInProgress
  if (seat.status !== 'free') return content.home.seats.tooltip.seatUnavailable
  return ''
}

function handleSeatClick(seat: Seat) {
  if (!isSeatClickable(seat)) return
  emit('seat-click', seat.id)
}
</script>

<style lang="scss" scoped>
.seat-map_container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  overflow: hidden;
  height: 100dvh;

  .container__svg {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    background: #e8eaed;
    user-select: none;

    .svg__seat {
      &--clickable {
        cursor: pointer;
      }

      &--disabled {
        cursor: not-allowed;
      }

      &--dimmed {
        opacity: 0.4;
      }
    }

    .svg__label {
      text-anchor: middle;
      font-size: 4.5px;
      font-weight: 600;
      fill: #000000;
      pointer-events: none;
    }

    .svg__stage-label {
      text-anchor: middle;
      font-size: 9px;
      font-weight: 700;
      fill: #f5ebe0;
      letter-spacing: 0.04em;
      pointer-events: none;
    }

    .svg__zone-rect {
      stroke: none;
      pointer-events: none;

      &--balcony {
        fill: rgba(78, 98, 128, 0.055);
      }

      &--parterre {
        fill: rgba(118, 102, 92, 0.048);
      }
    }

    .svg__zone-title {
      text-anchor: start;
      dominant-baseline: hanging;
      font-size: 6.5px;
      font-weight: 700;
      fill: #1e2a3d;
      letter-spacing: 0.02em;
      pointer-events: none;
    }

    .svg__zone-subtitle {
      text-anchor: start;
      dominant-baseline: hanging;
      font-size: 4.25px;
      font-weight: 600;
      fill: rgba(30, 42, 61, 0.82);
      pointer-events: none;
    }
  }
}
</style>
