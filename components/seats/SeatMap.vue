<template>
  <div class="seat-map_container">
    <svg :viewBox="svgViewBox" class="container__svg" preserveAspectRatio="xMidYMid meet">
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
import { parseTheaterSeatLabel, rowIsBalcony, seatMapViewBoxString } from '../../utils/yerresSeatLayout'

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

function seatArcTransform(seat: Seat): string | undefined {
  const pr = parseTheaterSeatLabel(seat.label)
  if (!pr || !rowIsBalcony(pr.row)) return undefined

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
  if (!hasRot && !hasScaleX && !hasDepth) return undefined

  const parts: string[] = []
  if (hasDepth) parts.push(`translate(${tx} ${ty})`)
  if (hasRot && hasScaleX) {
    parts.push(`translate(${cx} ${cy}) rotate(${deg}) scale(${scaleX} 1) translate(${-cx} ${-cy})`)
  } else if (hasRot) {
    parts.push(`rotate(${deg} ${cx} ${cy})`)
  } else if (hasScaleX) {
    parts.push(`translate(${cx} ${cy}) scale(${scaleX} 1) translate(${-cx} ${-cy})`)
  }
  return parts.join(' ')
}

const svgViewBox = computed(() => seatMapViewBoxString(props.seats, SEAT_SIZE, 18))

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
  overflow: visible;

  .container__svg {
    width: 100%;
    max-width: 100%;
    overflow: visible;
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
  }
}
</style>
