<template>
  <div class="seat-map_container">
    <div
      ref="viewportRef"
      class="seat-map_viewport"
      :class="{ 'seat-map_viewport--is-grabbing': isMapGrabbing }"
      tabindex="0"
      role="application"
      :aria-label="mapUi.viewportLabel"
      @wheel.prevent="onMapWheel"
      @pointerdown="onMapPointerDown"
      @pointermove="onMapPointerMove"
      @pointerup="onMapPointerUp"
      @pointercancel="onMapPointerUp"
    >
      <svg
        ref="svgRef"
        :viewBox="svgViewBox"
        class="container__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <g :transform="mapNavTransform">
          <rect
            class="svg__pannable-bg"
            :x="viewBoxParsed.x"
            :y="viewBoxParsed.y"
            :width="viewBoxParsed.w"
            :height="viewBoxParsed.h"
            fill="transparent"
          />
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
          class="svg__stage-rect"
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
        </g>
      </svg>
    </div>
    <div class="seat-map_overlay" role="region" :aria-label="mapUi.viewportLabel">
      <section
        class="seat-map_hints seat-map_hints--desktop"
        :aria-labelledby="mapHintsTitleId"
      >
        <h2 :id="mapHintsTitleId" class="seat-map_hints-title">{{ mapUi.hintsTitle }}</h2>
        <dl class="seat-map_hints-list">
          <template v-for="(row, i) in mapUi.hintsRows" :key="i">
            <dt>{{ row.label }}</dt>
            <dd v-html="seatMapLayoutMobile ? row.textMobile : row.textDesktop" />
          </template>
        </dl>
      </section>

      <div
        ref="mapToolbarHostRef"
        class="seat-map_toolbar-host"
        :class="{ 'seat-map_toolbar-host--open': mapToolbarMenuOpen }"
      >
        <div class="seat-map_mobile-left-stack">
          <div class="seat-map_toolbar-help">
            <button
              type="button"
              class="seat-map_toolbar-trigger"
              :aria-expanded="mapToolbarMenuOpen"
              :aria-controls="mapToolbarPanelId"
              @click.stop="toggleMapToolbarMenu"
            >
              {{ mapUi.toolbarMenuTrigger }}
            </button>
            <div :id="mapToolbarPanelId" class="seat-map_toolbar-hints-panel">
              <section
                class="seat-map_hints seat-map_hints--in-popover"
                :aria-labelledby="mapHintsTitlePopoverId"
              >
                <h2 :id="mapHintsTitlePopoverId" class="seat-map_hints-title">{{ mapUi.hintsTitle }}</h2>
                <dl class="seat-map_hints-list">
                  <template v-for="(row, i) in mapUi.hintsRows" :key="i">
                    <dt>{{ row.label }}</dt>
                    <dd v-html="seatMapLayoutMobile ? row.textMobile : row.textDesktop" />
                  </template>
                </dl>
              </section>
            </div>
          </div>
        </div>
        <div class="seat-map_toolbar" role="toolbar" :aria-label="mapUi.toolbarLabel">
          <button
            type="button"
            class="seat-map_toolbar-row"
            :aria-label="mapUi.zoomOut"
            :disabled="mapZoom <= mapZoomMinEffective + 1e-6"
            @click="zoomMapByStep(1 / MAP_ZOOM_STEP)"
          >
            <span class="seat-map_toolbar-label">{{ mapUi.zoomOutCaption }}</span>
            <span class="seat-map_toolbar-icon" aria-hidden="true">−</span>
          </button>
          <button
            type="button"
            class="seat-map_toolbar-row"
            :aria-label="mapUi.zoomIn"
            :disabled="mapZoom >= MAP_ZOOM_MAX - 1e-6"
            @click="zoomMapByStep(MAP_ZOOM_STEP)"
          >
            <span class="seat-map_toolbar-label">{{ mapUi.zoomInCaption }}</span>
            <span class="seat-map_toolbar-icon" aria-hidden="true">+</span>
          </button>
          <button
            type="button"
            class="seat-map_toolbar-row seat-map_toolbar-row--reset"
            :aria-label="mapUi.resetView"
            @click="resetMapView"
          >
            <span class="seat-map_toolbar-label">{{ mapUi.resetViewCaption }}</span>
            <span class="seat-map_toolbar-icon" aria-hidden="true">⟲</span>
          </button>
        </div>
        <div
          class="seat-map_legend-help"
          :class="{ 'seat-map_legend-help--open': mapLegendMenuOpen }"
        >
          <button
            type="button"
            class="seat-map_toolbar-trigger seat-map_legend-menu-trigger"
            :aria-expanded="mapLegendMenuOpen"
            :aria-controls="mapLegendPanelId"
            @click.stop="toggleMapLegendMenu"
          >
            {{ mapUi.legendMenuTrigger }}
          </button>
          <div :id="mapLegendPanelId" class="seat-map_legend-popover-panel">
            <div
              class="seat-map_legend seat-map_legend--in-popover"
              role="group"
              :aria-labelledby="mapLegendPopoverTitleId"
            >
              <h2 :id="mapLegendPopoverTitleId" class="seat-map_hints-title">{{ mapUi.legendTitle }}</h2>
              <ul class="seat-map_legend-list">
                <li
                  v-for="row in seatStatusLegendRows"
                  :key="'p-' + row.key"
                  class="seat-map_legend-item"
                >
                  <span
                    class="seat-map_legend-swatch"
                    :class="{ 'seat-map_legend-swatch--border': row.border }"
                    :style="row.swatchStyle"
                    aria-hidden="true"
                  />
                  <span class="seat-map_legend-label">{{ row.label }}</span>
                </li>
              </ul>
              <p class="seat-map_legend-foot seat-map_legend-foot--strong">
                {{ legendMaxPerOrderLine }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div v-if="mapZoomPercent > 100" class="seat-map_zoom-badge">{{ mapZoomBadgeText }}</div>
      <div
        class="seat-map_legend seat-map_legend--desktop"
        role="group"
        :aria-labelledby="mapLegendTitleId"
      >
        <h2 :id="mapLegendTitleId" class="seat-map_hints-title">{{ mapUi.legendTitle }}</h2>
        <ul class="seat-map_legend-list">
          <li
            v-for="row in seatStatusLegendRows"
            :key="row.key"
            class="seat-map_legend-item"
          >
            <span
              class="seat-map_legend-swatch"
              :class="{ 'seat-map_legend-swatch--border': row.border }"
              :style="row.swatchStyle"
              aria-hidden="true"
            />
            <span class="seat-map_legend-label">{{ row.label }}</span>
          </li>
        </ul>
        <p class="seat-map_legend-foot seat-map_legend-foot--strong">
          {{ legendMaxPerOrderLine }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
  useId,
  watch,
  type Ref
} from 'vue'
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

type MapHintRow = { label: string; textDesktop: string; textMobile: string }

type SeatMapNavCopy = {
  hintsTitle: string
  hintsRows: MapHintRow[]
  zoomIn: string
  zoomOut: string
  resetView: string
  zoomInCaption: string
  zoomOutCaption: string
  resetViewCaption: string
  zoomPercent: string
  viewportLabel: string
  toolbarLabel: string
  toolbarMenuTrigger: string
  legendMenuTrigger: string
  legendTitle: string
  legendFree: string
  legendSelected: string
  legendHold: string
  legendPaid: string
  legendStaff: string
  legendMaxPerOrder: string
}
const mapUi: SeatMapNavCopy = (content.home.seats as unknown as { map: SeatMapNavCopy }).map
const mapHintsTitleId = useId()
const mapHintsTitlePopoverId = useId()
const mapToolbarPanelId = useId()
const mapLegendPanelId = useId()
const mapLegendTitleId = useId()
const mapLegendPopoverTitleId = useId()
const mapToolbarHostRef = ref<HTMLElement | null>(null)
const mapToolbarMenuOpen = ref(false)
const mapLegendMenuOpen = ref(false)
/** Synchronisé avec le breakpoint 640px (aide desktop vs mobile dans les hints). */
const seatMapLayoutMobile = ref(false)

function closeMobileMapPopovers() {
  mapToolbarMenuOpen.value = false
  mapLegendMenuOpen.value = false
}

const SEAT_SIZE = 13
const SEAT_RADIUS = 1.2

const SEAT_COLORS = {
  paid: '#e53935',
  hold: '#ffb300',
  selected: '#43a047',
  /** Violet : lisible sur fond gris, distinct vendu / réservation / dispo */
  staff: '#6d4bae',
  free: 'rgba(250, 250, 250, 0.78)'
} as const

type LegendRow = {
  key: string
  label: string
  border: boolean
  swatchStyle: Record<string, string>
}

const seatStatusLegendRows = computed((): LegendRow[] => [
  {
    key: 'free',
    label: mapUi.legendFree,
    border: true,
    swatchStyle: { background: SEAT_COLORS.free }
  },
  {
    key: 'selected',
    label: mapUi.legendSelected,
    border: false,
    swatchStyle: { background: SEAT_COLORS.selected }
  },
  {
    key: 'hold',
    label: mapUi.legendHold,
    border: false,
    swatchStyle: { background: SEAT_COLORS.hold }
  },
  {
    key: 'paid',
    label: mapUi.legendPaid,
    border: false,
    swatchStyle: { background: SEAT_COLORS.paid }
  },
  {
    key: 'staff',
    label: mapUi.legendStaff,
    border: false,
    swatchStyle: { background: SEAT_COLORS.staff }
  }
])

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

const legendMaxPerOrderLine = computed(() =>
  mapUi.legendMaxPerOrder.replace('{max}', String(props.maxSeatsPerOrder))
)

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

/** Bbox de toute la carte dessinée (sièges + arc balcon si applicable), pour le clamp de pan. */
function seatBoundsAllSeatsWithArc(seats: Seat[]): SeatBounds | null {
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
    const spec = computeBalconyArcSpec(s)
    const useArc = pr && pr.row.length === 1 && rowIsBalcony(pr.row) && spec.mode !== 'identity'
    if (useArc) {
      for (const [dx, dy] of corners) {
        const pt = mapBalconyArcPoint(s.x + dx, s.y + dy, spec)
        minX = Math.min(minX, pt.x)
        minY = Math.min(minY, pt.y)
        maxX = Math.max(maxX, pt.x)
        maxY = Math.max(maxY, pt.y)
      }
    } else {
      minX = Math.min(minX, s.x)
      minY = Math.min(minY, s.y)
      maxX = Math.max(maxX, s.x + SEAT_SIZE)
      maxY = Math.max(maxY, s.y + SEAT_SIZE)
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

const MAP_ZOOM_MIN = 1
/** Sur mobile : on ne peut pas dézoomer en dessous (évite la carte trop petite dans le viewport). */
const MAP_ZOOM_MIN_MOBILE = 1.32
/** 15 = 1500 % dans le badge et les contrôles */
const MAP_ZOOM_MAX = 15
const MAP_ZOOM_STEP = 1.25
/** En px écran : au-delà, un geste commencé sur un siège devient un pan (sinon = clic siège). */
const MAP_PAN_DRAG_THRESHOLD_PX = 6

/** Breakpoint aligné sur le SCSS du plan (mobile). */
const SEAT_MAP_MOBILE_MAX_PX = 640

function isSeatMapMobileViewport() {
  if (!import.meta.client) return false
  return window.matchMedia(`(max-width: ${SEAT_MAP_MOBILE_MAX_PX}px)`).matches
}

/** Zoom initial sur mobile après chargement / recalcul du viewBox (132 %). */
const MAP_ZOOM_DEFAULT_MOBILE = MAP_ZOOM_MIN_MOBILE

function defaultMapZoomForViewport(): number {
  return isSeatMapMobileViewport() ? MAP_ZOOM_DEFAULT_MOBILE : 1
}

/** Min zoom effectif (réactif au breakpoint 640px via seatMapLayoutMobile). */
const mapZoomMinEffective = computed(() => {
  void seatMapLayoutMobile.value
  return isSeatMapMobileViewport() ? MAP_ZOOM_MIN_MOBILE : MAP_ZOOM_MIN
})

const svgRef = ref<SVGSVGElement | null>(null)
const viewportRef = ref<HTMLElement | null>(null)
/** Affichage (interpolé). */
const mapPanX = ref(0)
const mapPanY = ref(0)
const mapZoom = ref(1)
/** Cibles pour zoom / dézoom lissés (molette, boutons, clavier). */
const mapTargetPanX = ref(0)
const mapTargetPanY = ref(0)
const mapTargetZoom = ref(1)

/**
 * Lissage zoom / pan (≈ s⁻¹, indépendant du framerate). Zoom plus rapide que le pan pour que la molette
 * colle mieux à la cible (sinon sensation de lag pendant zoom / dézoom).
 */
const MAP_NAV_SMOOTHING_RATE_PAN = 15
const MAP_NAV_SMOOTHING_RATE_ZOOM = 15
const MAP_NAV_SNAP_ZOOM_EPS = 1e-5
const MAP_NAV_SNAP_PAN_EPS = 1e-3
/** Si le zoom affiché est déjà quasi égal à la cible, le lerp du pan reste dans les bornes (même z) : évite de reclamper chaque frame pendant que le zoom animé déplace les limites → sensation plus fluide. */
const MAP_NAV_ZOOM_CLAMP_SYNC_EPS = 0.001

let mapNavRafId = 0
let mapNavLastTs = 0
const isMapPanning = ref(false)
/** Pointeur posé sur un siège, en attente de savoir si c’est un clic ou un drag. */
const mapPanAwaitingThreshold = ref(false)
/**
 * Main fermée (comme au clic sur une zone `grab`) : dès l’appui jusqu’au relâchement,
 * y compris le seuil avant pan sur siège et tout le déplacement — le curseur SVG seul ne suffit pas partout.
 */
const isMapGrabbing = computed(() => isMapPanning.value || mapPanAwaitingThreshold.value)
let mapPanLastSvgX = 0
let mapPanLastSvgY = 0
let mapPanDownClientX = 0
let mapPanDownClientY = 0
/** Après un pan lancé depuis un siège, ignorer le clic `click` qui suit. */
let suppressNextSeatClick = false

const viewBoxParsed = computed(() => {
  const parts = svgViewBox.value.trim().split(/[\s,]+/).map(Number)
  const x = parts[0] ?? 0
  const y = parts[1] ?? 0
  const w = parts[2] ?? 560
  const h = parts[3] ?? 420
  return { x, y, w, h }
})

const mapPivotX = computed(() => viewBoxParsed.value.x + viewBoxParsed.value.w / 2)
const mapPivotY = computed(() => viewBoxParsed.value.y + viewBoxParsed.value.h / 2)

/**
 * Étendue réelle de la carte (sièges + arc balcon, cadres zone, scène) — pas la viewBox avec ses marges.
 * Le clamp de pan s’aligne sur ça pour que les bords utiles touchent les bords du SVG.
 */
const mapClampBounds = computed((): SeatBounds => {
  const vb = viewBoxParsed.value
  const seatB = seatBoundsAllSeatsWithArc(props.seats)
  const rects = mapOverlayRects.value
  let minX = seatB?.minX ?? Infinity
  let minY = seatB?.minY ?? Infinity
  let maxX = seatB?.maxX ?? -Infinity
  let maxY = seatB?.maxY ?? -Infinity
  if (rects) {
    for (const r of rects) {
      minX = Math.min(minX, r.x)
      minY = Math.min(minY, r.y)
      maxX = Math.max(maxX, r.x + r.w)
      maxY = Math.max(maxY, r.y + r.h)
    }
  }
  if (!Number.isFinite(minX)) {
    return { minX: vb.x, minY: vb.y, maxX: vb.x + vb.w, maxY: vb.y + vb.h }
  }
  return { minX, minY, maxX, maxY }
})

/**
 * Pan borné : pas de bande vide sur les 4 côtés (bords de la carte réelle contre bords de la vue).
 * Bornes sur px : tx_max ≥ vx+vw ⇒ px ≥ pxMin ; tx_min ≤ vx ⇒ px ≤ pxMax.
 */
function clampPanXYForZoom(z: number, px: Ref<number>, py: Ref<number>) {
  if (z < 1e-9) return
  const { x: vx, y: vy, w: vw, h: vh } = viewBoxParsed.value
  const cx = mapPivotX.value
  const cy = mapPivotY.value
  const { minX, minY, maxX, maxY } = mapClampBounds.value

  let pxMin = vx + vw - z * (maxX - cx) - cx
  let pxMax = vx - z * (minX - cx) - cx
  let pyMin = vy + vh - z * (maxY - cy) - cy
  let pyMax = vy - z * (minY - cy) - cy

  if (pxMin > pxMax) {
    const mid = (pxMin + pxMax) / 2
    pxMin = pxMax = mid
  }
  if (pyMin > pyMax) {
    const mid = (pyMin + pyMax) / 2
    pyMin = pyMax = mid
  }

  px.value = Math.min(pxMax, Math.max(pxMin, px.value))
  py.value = Math.min(pyMax, Math.max(pyMin, py.value))
}

function clampMapPan() {
  clampPanXYForZoom(mapZoom.value, mapPanX, mapPanY)
}

function clampTargetMapPan() {
  clampPanXYForZoom(mapTargetZoom.value, mapTargetPanX, mapTargetPanY)
}

function stopMapNavRaf() {
  if (mapNavRafId) {
    cancelAnimationFrame(mapNavRafId)
    mapNavRafId = 0
  }
  mapNavLastTs = 0
}

function syncMapNavTargetsFromDisplay() {
  mapTargetPanX.value = mapPanX.value
  mapTargetPanY.value = mapPanY.value
  mapTargetZoom.value = mapZoom.value
}

function mapNavSmoothingTick(ts: number) {
  mapNavRafId = 0
  const dt =
    mapNavLastTs > 0 ? Math.min(0.05, Math.max(0, (ts - mapNavLastTs) / 1000)) : 1 / 60
  mapNavLastTs = ts

  const zoomDiffBefore = Math.abs(mapZoom.value - mapTargetZoom.value)
  const alphaZ = 1 - Math.exp(-MAP_NAV_SMOOTHING_RATE_ZOOM * dt)
  // Même pas pour X/Y pendant que z anime : sinon le zoom accéléré et le pan lent décalent le pivot (molette).
  const alphaXY =
    zoomDiffBefore > MAP_NAV_ZOOM_CLAMP_SYNC_EPS
      ? alphaZ
      : 1 - Math.exp(-MAP_NAV_SMOOTHING_RATE_PAN * dt)
  mapZoom.value += (mapTargetZoom.value - mapZoom.value) * alphaZ
  mapPanX.value += (mapTargetPanX.value - mapPanX.value) * alphaXY
  mapPanY.value += (mapTargetPanY.value - mapPanY.value) * alphaXY
  if (zoomDiffBefore > MAP_NAV_ZOOM_CLAMP_SYNC_EPS) {
    clampMapPan()
  }

  const zDone = Math.abs(mapZoom.value - mapTargetZoom.value) < MAP_NAV_SNAP_ZOOM_EPS
  const xDone = Math.abs(mapPanX.value - mapTargetPanX.value) < MAP_NAV_SNAP_PAN_EPS
  const yDone = Math.abs(mapPanY.value - mapTargetPanY.value) < MAP_NAV_SNAP_PAN_EPS

  if (zDone && xDone && yDone) {
    mapZoom.value = mapTargetZoom.value
    mapPanX.value = mapTargetPanX.value
    mapPanY.value = mapTargetPanY.value
    clampMapPan()
    mapNavLastTs = 0
    return
  }

  mapNavRafId = requestAnimationFrame(mapNavSmoothingTick)
}

function requestMapNavSmoothingFrame() {
  if (!import.meta.client) return
  if (mapNavRafId) return
  mapNavRafId = requestAnimationFrame(mapNavSmoothingTick)
}

const mapNavTransform = computed(() => {
  const cx = mapPivotX.value
  const cy = mapPivotY.value
  const z = mapZoom.value
  const px = mapPanX.value
  const py = mapPanY.value
  return `translate(${px} ${py}) translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})`
})

const mapZoomPercent = computed(() => Math.round(mapZoom.value * 100))
const mapZoomBadgeText = computed(() => mapUi.zoomPercent.replace('{n}', String(mapZoomPercent.value)))

watch(svgViewBox, () => {
  stopMapNavRaf()
  mapPanX.value = 0
  mapPanY.value = 0
  mapZoom.value = defaultMapZoomForViewport()
  mapTargetPanX.value = mapPanX.value
  mapTargetPanY.value = mapPanY.value
  mapTargetZoom.value = mapZoom.value
  if (import.meta.client) {
    nextTick(() => {
      clampTargetMapPan()
      clampMapPan()
      syncMapNavTargetsFromDisplay()
    })
  }
})

if (import.meta.client) {
  watch(
    isMapGrabbing,
    (grabbing) => {
      document.documentElement.style.cursor = grabbing ? 'grabbing' : ''
    },
    { flush: 'sync' }
  )
  onBeforeUnmount(() => {
    document.documentElement.style.cursor = ''
  })
}

function clientToSvgPoint(clientX: number, clientY: number): { x: number; y: number } {
  const svg = svgRef.value
  if (!svg) return { x: 0, y: 0 }
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const p = pt.matrixTransform(ctm.inverse())
  return { x: p.x, y: p.y }
}

/** Met à jour les cibles (zoom autour du point focus) puis lisse vers l’affichage via rAF. */
function setMapZoomAtPoint(z1: number, focusX: number, focusY: number) {
  const z0 = mapTargetZoom.value
  const next = Math.min(MAP_ZOOM_MAX, Math.max(mapZoomMinEffective.value, z1))
  if (Math.abs(next - z0) < 1e-9) return
  const cx = mapPivotX.value
  const cy = mapPivotY.value
  const r = next / z0
  mapTargetPanX.value = focusX - cx - r * (focusX - mapTargetPanX.value - cx)
  mapTargetPanY.value = focusY - cy - r * (focusY - mapTargetPanY.value - cy)
  mapTargetZoom.value = next
  clampTargetMapPan()
  closeMobileMapPopovers()
  requestMapNavSmoothingFrame()
}

function onMapWheel(e: WheelEvent) {
  const z0 = mapTargetZoom.value
  const factor = Math.exp(-e.deltaY * 0.0012)
  const p = clientToSvgPoint(e.clientX, e.clientY)
  setMapZoomAtPoint(z0 * factor, p.x, p.y)
}

function zoomMapByStep(mult: number) {
  const svg = svgRef.value
  if (!svg) return
  const r = svg.getBoundingClientRect()
  const p = clientToSvgPoint(r.left + r.width / 2, r.top + r.height / 2)
  setMapZoomAtPoint(mapTargetZoom.value * mult, p.x, p.y)
}

function resetMapView() {
  stopMapNavRaf()
  const z = defaultMapZoomForViewport()
  mapTargetPanX.value = 0
  mapTargetPanY.value = 0
  mapTargetZoom.value = z
  mapPanX.value = 0
  mapPanY.value = 0
  mapZoom.value = z
  clampTargetMapPan()
  clampMapPan()
  closeMobileMapPopovers()
}

function closeMapToolbarMenu() {
  mapToolbarMenuOpen.value = false
}

function closeMapLegendMenu() {
  mapLegendMenuOpen.value = false
}

function toggleMapToolbarMenu() {
  const next = !mapToolbarMenuOpen.value
  mapToolbarMenuOpen.value = next
  if (next) closeMapLegendMenu()
}

function toggleMapLegendMenu() {
  const next = !mapLegendMenuOpen.value
  mapLegendMenuOpen.value = next
  if (next) closeMapToolbarMenu()
}

function onDocumentPointerDownCloseMenu(e: PointerEvent) {
  if (!isSeatMapMobileViewport()) return
  if (!mapToolbarMenuOpen.value && !mapLegendMenuOpen.value) return
  const host = mapToolbarHostRef.value
  if (host && !host.contains(e.target as Node)) {
    closeMobileMapPopovers()
  }
}

let teardownMapToolbarMenuListeners: (() => void) | undefined

onMounted(() => {
  if (!import.meta.client) return
  window.addEventListener('keydown', onWindowMapKeydownCapture, true)
  const mq = window.matchMedia(`(max-width: ${SEAT_MAP_MOBILE_MAX_PX}px)`)
  const onMq = () => {
    seatMapLayoutMobile.value = mq.matches
    if (!mq.matches) {
      closeMobileMapPopovers()
    }
  }
  onMq()
  mq.addEventListener('change', onMq)
  document.addEventListener('pointerdown', onDocumentPointerDownCloseMenu, true)
  teardownMapToolbarMenuListeners = () => {
    window.removeEventListener('keydown', onWindowMapKeydownCapture, true)
    mq.removeEventListener('change', onMq)
    document.removeEventListener('pointerdown', onDocumentPointerDownCloseMenu, true)
  }
})

onBeforeUnmount(() => {
  stopMapNavRaf()
  teardownMapToolbarMenuListeners?.()
})

function beginMapPan(e: PointerEvent) {
  e.preventDefault()
  stopMapNavRaf()
  syncMapNavTargetsFromDisplay()
  viewportRef.value?.setPointerCapture(e.pointerId)
  isMapPanning.value = true
  const p = clientToSvgPoint(e.clientX, e.clientY)
  mapPanLastSvgX = p.x
  mapPanLastSvgY = p.y
}

function onMapPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  viewportRef.value?.focus({ preventScroll: true })
  const target = e.target as Element | null
  if (target?.closest?.('.svg__seat')) {
    mapPanAwaitingThreshold.value = true
    mapPanDownClientX = e.clientX
    mapPanDownClientY = e.clientY
    return
  }
  mapPanAwaitingThreshold.value = false
  beginMapPan(e)
}

function onMapPointerMove(e: PointerEvent) {
  if (mapPanAwaitingThreshold.value && !isMapPanning.value) {
    const dx = e.clientX - mapPanDownClientX
    const dy = e.clientY - mapPanDownClientY
    if (dx * dx + dy * dy >= MAP_PAN_DRAG_THRESHOLD_PX * MAP_PAN_DRAG_THRESHOLD_PX) {
      mapPanAwaitingThreshold.value = false
      suppressNextSeatClick = true
      beginMapPan(e)
    } else {
      return
    }
  }
  if (!isMapPanning.value) return
  const p = clientToSvgPoint(e.clientX, e.clientY)
  const dx = p.x - mapPanLastSvgX
  const dy = p.y - mapPanLastSvgY
  mapPanLastSvgX = p.x
  mapPanLastSvgY = p.y
  mapTargetPanX.value += dx
  mapTargetPanY.value += dy
  clampTargetMapPan()
  requestMapNavSmoothingFrame()
}

function onMapPointerUp(e: PointerEvent) {
  if (mapPanAwaitingThreshold.value) {
    mapPanAwaitingThreshold.value = false
  }
  if (!isMapPanning.value) return
  isMapPanning.value = false
  requestMapNavSmoothingFrame()
  try {
    viewportRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    /* capture déjà relâché */
  }
  // Le clic post-pan ne passe pas toujours par handleSeatClick (capture sur le viewport) :
  // sans ça, suppressNextSeatClick reste vrai et le prochain vrai clic est mangé.
  setTimeout(() => {
    suppressNextSeatClick = false
  }, 0)
}

/** Raccourcis clavier : le focus doit être sur le viewport (fait au pointerdown sur la carte). */
function applyMapKeyboardShortcuts(e: KeyboardEvent) {
  const el = e.target as HTMLElement
  if (el.closest?.('button, input, textarea, select, [contenteditable]')) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === '+' || e.key === '=') {
    e.preventDefault()
    zoomMapByStep(MAP_ZOOM_STEP)
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault()
    zoomMapByStep(1 / MAP_ZOOM_STEP)
  } else if (e.key === '0' || e.code === 'Numpad0' || e.code === 'Digit0') {
    e.preventDefault()
    resetMapView()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    resetMapView()
  }
}

function onWindowMapKeydownCapture(e: KeyboardEvent) {
  const vp = viewportRef.value
  if (!vp) return
  const ae = document.activeElement
  if (ae !== vp && !(ae instanceof Node && vp.contains(ae))) return
  applyMapKeyboardShortcuts(e)
}

function getSeatFill(seat: Seat) {
  if (seat.status === 'paid') return SEAT_COLORS.paid
  if (seat.status === 'hold') return SEAT_COLORS.hold
  if (seat.status === 'staff') return SEAT_COLORS.staff
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
  if (seat.status === 'staff') return content.home.seats.tooltip.seatStaffReserved
  if (props.activeOrder && seat.status === 'free') return content.home.seats.tooltip.reservationInProgress
  if (seat.status !== 'free') return content.home.seats.tooltip.seatUnavailable
  return ''
}

function handleSeatClick(seat: Seat) {
  if (suppressNextSeatClick) {
    suppressNextSeatClick = false
    return
  }
  if (!isSeatClickable(seat)) return
  emit('seat-click', seat.id)
}
</script>

<style lang="scss" scoped>
.seat-map_container {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  overflow: hidden;
  height: 100dvh;

  .seat-map_viewport {
    width: 100%;
    height: 100%;
    min-height: 0;
    touch-action: none;
    outline: none;

    &:focus-visible {
      outline: 2px solid rgba(74, 144, 217, 0.55);
      outline-offset: 2px;
    }
  }

  /*
   * Pendant le pan, le curseur est celui du nœud sous le pointeur : les sièges imposent `pointer` plus bas
   * dans la feuille (même spécificité → cascade). `inherit !important` depuis le <svg> impose le mode grab.
   * Personnaliser : --seat-map-pan-cursor (ex. url(...) 16 16, grabbing) sur .seat-map_container ou parent.
   */
  .seat-map_viewport--is-grabbing {
    --seat-map-pan-cursor: grabbing;
  }

  .seat-map_viewport--is-grabbing .container__svg {
    cursor: var(--seat-map-pan-cursor);
  }

  .seat-map_viewport--is-grabbing .container__svg * {
    cursor: inherit !important;
  }

  .seat-map_overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .seat-map_hints {
    position: absolute;
    top: 10px;
    left: 12px;
    right: auto;
    max-width: min(calc(100% - 120px), 16.5rem);
    margin: 0;
    padding: 9px 12px 10px;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 8px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.07);
    pointer-events: none;

    .seat-map_hints-title {
      margin-bottom: 1rem;
    }
  }

  .seat-map_hints-title {
    margin: 0 0 0.55em;
    padding: 0;
    border: none;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6b7580;
    line-height: 1.3;
  }

  .seat-map_hints-list {
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: minmax(4.5rem, 32%) 1fr;
    column-gap: 0.5rem;
    row-gap: 0.42em;
    align-items: baseline;

    dt {
      margin: 0;
      font-size: 0.68rem;
      font-weight: 600;
      color: #2a3138;
      line-height: 1.35;
    }

    dd {
      margin: 0;
      font-size: 0.68rem;
      font-weight: 500;
      line-height: 1.4;
      color: #4d5660;
    }
  }

  $seat-map-mobile-bp: 640px;
  /** Même retrait que `.seat-map_hints` (gauche) et colonne d’icônes (droite). */
  $seat-map-controls-inset: 12px;
  /** Largeur réservée aux boutons icône empilés (≈ 40px + bordure). */
  $seat-map-mobile-icons-column: 44px;
  $seat-map-mobile-popup-icons-gap: 10px;

  .seat-map_hints--desktop {
    @media (max-width: $seat-map-mobile-bp) {
      display: none !important;
    }
  }

  .seat-map_hints--in-popover {
    display: none !important;

    @media (max-width: $seat-map-mobile-bp) {
      display: block !important;
      position: static;
      margin: 0;
      padding: 0;
      max-width: none;
      background: transparent;
      box-shadow: none;
      border-radius: 0;
      border: none;
    }
  }

  .seat-map_legend--in-popover {
    display: none !important;

    @media (max-width: $seat-map-mobile-bp) {
      display: block !important;
      position: static;
      margin: 0;
      padding: 0;
      max-width: none;
      background: transparent;
      box-shadow: none;
      border-radius: 0;
      border: none;
      pointer-events: none;
    }
  }

  .seat-map_toolbar-host {
    position: absolute;
    top: 10px;
    right: $seat-map-controls-inset;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
    pointer-events: none;

    @media (max-width: $seat-map-mobile-bp) {
      left: 0;
      right: 0;
      top: 0;
      width: 100%;
      height: 100%;
      min-height: 0;
      align-items: stretch;
    }
  }

  .seat-map_mobile-left-stack {
    display: none;

    @media (max-width: $seat-map-mobile-bp) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      position: absolute;
      left: $seat-map-controls-inset;
      top: 10px;
      z-index: 1;
      pointer-events: none;
    }
  }

  .seat-map_toolbar-help {
    display: none;
    flex-direction: column;
    align-items: flex-start;

    @media (max-width: $seat-map-mobile-bp) {
      display: flex;
      position: static;
      pointer-events: none;
    }
  }

  .seat-map_toolbar-help .seat-map_toolbar-trigger,
  .seat-map_toolbar-help .seat-map_toolbar-hints-panel {
    pointer-events: auto;
  }

  .seat-map_legend-help {
    display: none;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 6px;

    @media (max-width: $seat-map-mobile-bp) {
      display: flex;
      position: absolute;
      right: $seat-map-controls-inset;
      bottom: 14px;
      z-index: 2;
      pointer-events: none;
    }
  }

  .seat-map_legend-help .seat-map_toolbar-trigger,
  .seat-map_legend-help .seat-map_legend-popover-panel {
    pointer-events: auto;
  }

  .seat-map_toolbar-trigger {
    display: none;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 0 12px;
    margin: 0;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    color: #2c333a;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #ced4da;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover {
      background: #fff;
      border-color: #adb5bd;
    }

    @media (max-width: $seat-map-mobile-bp) {
      display: inline-flex;
    }
  }

  .seat-map_toolbar-hints-panel {
    display: none;

    @media (max-width: $seat-map-mobile-bp) {
      margin-top: 6px;
      margin-left: 0;
      padding: 10px 11px;
      background: rgba(255, 255, 255, 0.97);
      border: 1px solid #ced4da;
      border-radius: 10px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
      min-width: 0;
      /* Gauche : inset · droite : inset + colonne icônes + marge — évite le chevauchement */
      max-width: min(
        calc(
          100vw - #{$seat-map-controls-inset} - #{$seat-map-mobile-icons-column} - #{$seat-map-controls-inset} -
            #{$seat-map-mobile-popup-icons-gap}
        ),
        16.77rem
      );
      box-sizing: border-box;
      max-height: min(52dvh, 22rem);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  .seat-map_legend-popover-panel {
    display: none;

    @media (max-width: $seat-map-mobile-bp) {
      margin: 0;
      padding: 10px 11px;
      background: rgba(255, 255, 255, 0.97);
      border: 1px solid #ced4da;
      border-radius: 10px;
      box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.1);
      min-width: 0;
      width: max-content;
      max-width: min(
        calc(
          100vw - #{$seat-map-controls-inset} - #{$seat-map-mobile-icons-column} - #{$seat-map-controls-inset} -
            #{$seat-map-mobile-popup-icons-gap}
        ),
        14rem
      );
      box-sizing: border-box;
      max-height: min(48dvh, 20rem);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  .seat-map_toolbar-host--open .seat-map_toolbar-hints-panel,
  .seat-map_legend-help--open .seat-map_legend-popover-panel {
    @media (max-width: $seat-map-mobile-bp) {
      display: block;
    }
  }

  .seat-map_toolbar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
    width: max-content;
    max-width: min(calc(100vw - 100px), 17rem);
    pointer-events: none;

    @media (max-width: $seat-map-mobile-bp) {
      position: absolute;
      right: $seat-map-controls-inset;
      top: 10px;
      z-index: 1;
      max-width: min(calc(100vw - #{2 * $seat-map-controls-inset}), 17rem);
    }
  }

  .seat-map_toolbar-row {
    pointer-events: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 36px;
    align-items: center;
    column-gap: 8px;
    min-height: 36px;
    padding: 0 4px 0 10px;
    margin: 0;
    font: inherit;
    text-align: left;
    color: #2c333a;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #ced4da;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover:not(:disabled) {
      background: #fff;
      border-color: #adb5bd;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;

      .seat-map_toolbar-label,
      .seat-map_toolbar-icon {
        opacity: 0.65;
      }
    }
  }

  .seat-map_toolbar-label {
    font-size: 0.68rem;
    font-weight: 600;
    line-height: 1.25;
    color: #3d454d;
    justify-self: start;
  }

  .seat-map_toolbar-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1;
    justify-self: end;
  }

  .seat-map_toolbar-row--reset .seat-map_toolbar-icon {
    font-size: 1.05rem;
  }

  @media (max-width: $seat-map-mobile-bp) {
    .seat-map_toolbar-row {
      grid-template-columns: 36px;
      width: 40px;
      padding: 0;
      justify-items: center;

      .seat-map_toolbar-label {
        display: none !important;
      }
    }
  }

  .seat-map_zoom-badge {
    position: absolute;
    bottom: 14px;
    left: 12px;
    padding: 4px 9px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #495057;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    pointer-events: none;
  }

  .seat-map_legend--desktop {
    position: absolute;
    right: 12px;
    bottom: 14px;
    z-index: 2;
    max-width: min(16rem, calc(100vw - 96px));
    padding: 8px 10px 9px;
    background: rgba(255, 255, 255, 0.94);
    border-radius: 8px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
    pointer-events: none;

    @media (max-width: $seat-map-mobile-bp) {
      display: none !important;
    }
  }

  .seat-map_legend {
    .seat-map_hints-title {
      margin-bottom: 1rem;
    }

    .seat-map_legend-foot {
      margin-top: 1rem;

      &--strong {
        margin-top: 1rem;
      }
    }
  }

  .seat-map_legend-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .seat-map_legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 0.32em;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .seat-map_legend-swatch {
    flex-shrink: 0;
    width: 11px;
    height: 11px;
    border-radius: 2px;

    &--border {
      box-shadow: inset 0 0 0 1px rgba(30, 30, 30, 0.22);
    }
  }

  .seat-map_legend-label {
    font-size: 0.62rem;
    font-weight: 500;
    line-height: 1.35;
    color: #3d454d;
  }

  .seat-map_legend-foot {
    margin: 0.55em 0 0;
    font-size: 0.58rem;
    font-weight: 500;
    line-height: 1.4;
    color: #6b7580;

    &--strong {
      margin-top: 0.35em;
      font-weight: 600;
      color: #4d5660;
    }
  }

  @media (max-width: $seat-map-mobile-bp) {
    .seat-map_legend--in-popover .seat-map_legend-label {
      font-size: 0.6rem;
    }
  }

  .container__svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: hidden;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    background: #e8eaed;
    user-select: none;
    cursor: grab;

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

    .svg__stage-rect {
      fill: rgba(72, 62, 56, 0.1);
      stroke: rgba(30, 30, 30, 0.14);
      stroke-width: 0.5;
      pointer-events: none;
    }

    .svg__stage-label {
      text-anchor: middle;
      font-size: 9px;
      font-weight: 700;
      fill: #4a4542;
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

    .svg__pannable-bg {
      cursor: grab;
    }
  }
}
</style>
