<template>
  <div
    class="seatMap"
    :class="{ 'seatMap--fillHeight': fillHeight, 'seatMap--activeOrderLock': !!activeOrder }"
  >
    <div
      ref="viewportRef"
      class="seatMap__viewport"
      :class="{ 'seatMap__viewport--isGrabbing': isMapGrabbing }"
      tabindex="0"
      role="application"
      :aria-label="mapUi.viewportLabel"
      @pointerdown="onMapPointerDown"
      @pointermove="onMapPointerMove"
      @pointerup="onMapPointerUp"
      @pointercancel="onMapPointerUp"
    >
      <svg
        ref="svgRef"
        :viewBox="svgViewBox"
        class="viewport__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <g :transform="mapNavTransform">
          <rect
            class="svg__pannableBg"
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
              class="svg__zoneRect svg__zoneRect--balcony"
            />
            <text :x="balconyZone.titleX" :y="balconyZone.titleY" class="svg__zoneTitle">
              Balcon
            </text>
            <text :x="balconyZone.subtitleX" :y="balconyZone.subtitleY" class="svg__zoneSubtitle">
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
              class="svg__zoneRect svg__zoneRect--parterre"
            />
            <text :x="parterreZone.titleX" :y="parterreZone.titleY" class="svg__zoneTitle">
              Parterre
            </text>
            <text :x="parterreZone.subtitleX" :y="parterreZone.subtitleY" class="svg__zoneSubtitle">
              Rangées O à A
            </text>
          </g>
          <g v-if="accessibilityZone" class="svg__zone svg__zone--accessibility">
            <rect
              :x="accessibilityZone.x"
              :y="accessibilityZone.y"
              :width="accessibilityZone.w"
              :height="accessibilityZone.h"
              rx="3"
              ry="3"
              class="svg__zoneRect svg__zoneRect--accessibility"
            />
            <text
              :x="accessibilityZone.titleX"
              :y="accessibilityZone.titleY"
              class="svg__zoneTitle svg__zoneTitle--end"
              text-anchor="end"
            >
              {{ mapUi.accessibilityZoneTitle }}
            </text>
            <text
              :x="accessibilityZone.subtitleX"
              :y="accessibilityZone.subtitleY"
              class="svg__zoneSubtitle svg__zoneSubtitle--end"
              text-anchor="end"
            >
              {{ mapUi.accessibilityZoneSubtitle }}
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
              class="svg__stageRect"
            />
            <text
              :x="stageBlock.cx"
              :y="stageBlock.cy"
              class="svg__stageLabel"
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
            :class="[
              'svg__seat',
              seatVisualClass(seat),
              {
                'svg__seat--clickable': isSeatClickable(seat),
                'svg__seat--disabled': !isSeatClickable(seat)
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
          <g v-if="pmrZoneBelowG26to30" class="svg__zone svg__zone--pmr">
            <title>{{ mapUi.pmrZoneAreaLabel }}</title>
            <path :d="pmrZoneBelowG26to30.zonePath" class="svg__zoneRect svg__zoneRect--pmr" />
            <!-- Icône fauteuil (Font Awesome–style, repère 512 après translate/scale) -->
            <g
              class="svg__pmrIcon"
              :transform="pmrZoneBelowG26to30.iconTransform"
              fill="currentColor"
              aria-hidden="true"
            >
              <g transform="translate(0,512) scale(0.1,-0.1)">
                <path
                  d="M2021 5104 c-181 -49 -322 -203 -354 -388 -15 -89 1 -189 47 -280 144 -291 526 -354 756 -125 225 226 166 610 -118 754 -103 53 -226 67 -331 39z"
                />
                <path
                  d="M2037 3866 c-94 -26 -181 -113 -207 -204 -6 -24 -10 -385 -10 -1032 0 -946 1 -997 19 -1035 22 -48 54 -79 103 -100 32 -13 121 -15 660 -15 l623 0 475 -475 c529 -528 518 -519 645 -519 116 0 214 59 265 161 21 41 25 62 25 138 0 75 -4 98 -24 135 -16 30 -203 225 -579 603 l-557 557 -527 0 -528 0 0 305 0 304 578 3 577 3 47 27 c218 129 206 430 -21 537 l-56 26 -562 3 -561 3 -4 177 c-3 155 -6 183 -25 224 -63 139 -216 214 -356 174z"
                />
                <path
                  d="M1389 3127 c-456 -232 -771 -643 -881 -1150 -19 -88 -22 -133 -23 -322 0 -194 3 -233 23 -329 154 -720 733 -1242 1459 -1317 491 -50 978 126 1331 482 89 91 212 243 212 264 0 18 -209 220 -218 210 -4 -6 -30 -44 -57 -85 -63 -94 -237 -269 -335 -337 -445 -304 -1014 -322 -1473 -46 -95 58 -244 181 -310 257 -168 195 -284 442 -323 689 -26 159 -15 387 24 537 93 359 303 639 625 835 l77 46 0 160 c0 127 -3 159 -14 159 -7 0 -60 -24 -117 -53z"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
      <Transition name="seatMapActiveOrderLock">
        <div v-if="activeOrder" class="seatMap__activeOrderLock" role="status" aria-live="polite">
          <div class="seatMap__activeOrderLockCard">
            <svg
              class="activeOrderLock__icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p class="activeOrderLock__title">{{ mapUi.activeOrderLockTitle }}</p>
            <p class="activeOrderLock__hint">{{ mapUi.activeOrderLockHint }}</p>
          </div>
        </div>
      </Transition>
    </div>
    <div class="seatMap__overlay" role="region" :aria-label="mapUi.viewportLabel">
      <section class="seatMap__hints seatMap__hints--desktop" :aria-labelledby="mapHintsTitleId">
        <h2 :id="mapHintsTitleId" class="hints__title">{{ mapUi.hintsTitle }}</h2>
        <dl class="hints__list">
          <template v-for="(row, i) in mapUi.hintsRows" :key="i">
            <dt>{{ row.label }}</dt>
            <dd v-html="seatMapLayoutMobile ? row.textMobile : row.textDesktop" />
          </template>
        </dl>
      </section>

      <div
        ref="mapToolbarHostRef"
        class="seatMap__toolbarHost"
        :class="{ 'seatMap__toolbarHost--open': mapToolbarMenuOpen }"
      >
        <div class="seatMap__mobileLeftStack">
          <div class="seatMap__toolbarHelp">
            <button
              type="button"
              class="seatMap__toolbarTrigger"
              :aria-expanded="mapToolbarMenuOpen"
              :aria-controls="mapToolbarPanelId"
              @pointerdown="triggerToolbarTap"
              @click.stop="toggleMapToolbarMenu"
            >
              {{ mapUi.toolbarMenuTrigger }}
            </button>
            <Transition name="seatMapPopoverFade">
              <div
                v-if="mapToolbarMenuOpen"
                :id="mapToolbarPanelId"
                class="seatMap__toolbarHintsPanel"
              >
                <section
                  class="seatMap__hints seatMap__hints--inPopover"
                  :aria-labelledby="mapHintsTitlePopoverId"
                >
                  <h2 :id="mapHintsTitlePopoverId" class="hints__title">{{ mapUi.hintsTitle }}</h2>
                  <dl class="hints__list">
                    <template v-for="(row, i) in mapUi.hintsRows" :key="i">
                      <dt>{{ row.label }}</dt>
                      <dd v-html="seatMapLayoutMobile ? row.textMobile : row.textDesktop" />
                    </template>
                  </dl>
                </section>
              </div>
            </Transition>
          </div>
        </div>
        <div class="seatMap__toolbar" role="toolbar" :aria-label="mapUi.toolbarLabel">
          <button
            type="button"
            class="seatMap__toolbarRow"
            :aria-label="mapUi.zoomOut"
            :disabled="mapZoom <= mapZoomMinEffective + 1e-6"
            @pointerdown="triggerToolbarTap"
            @click="zoomMapByStep(1 / MAP_ZOOM_STEP)"
          >
            <span class="toolbarRow__label">{{ mapUi.zoomOutCaption }}</span>
            <span class="toolbarRow__icon" aria-hidden="true">−</span>
          </button>
          <button
            type="button"
            class="seatMap__toolbarRow"
            :aria-label="mapUi.zoomIn"
            :disabled="mapZoom >= MAP_ZOOM_MAX - 1e-6"
            @pointerdown="triggerToolbarTap"
            @click="zoomMapByStep(MAP_ZOOM_STEP)"
          >
            <span class="toolbarRow__label">{{ mapUi.zoomInCaption }}</span>
            <span class="toolbarRow__icon" aria-hidden="true">+</span>
          </button>
          <button
            type="button"
            class="seatMap__toolbarRow seatMap__toolbarRow--reset"
            :aria-label="mapUi.resetView"
            @pointerdown="triggerToolbarTap"
            @click="resetMapView"
          >
            <span class="toolbarRow__label">{{ mapUi.resetViewCaption }}</span>
            <span class="toolbarRow__icon" aria-hidden="true">⟲</span>
          </button>
        </div>
        <div
          class="seatMap__legendHelp"
          :class="{ 'seatMap__legendHelp--open': mapLegendMenuOpen }"
        >
          <button
            type="button"
            class="seatMap__toolbarTrigger seatMap__legendMenuTrigger"
            :aria-expanded="mapLegendMenuOpen"
            :aria-controls="mapLegendPanelId"
            @pointerdown="triggerToolbarTap"
            @click.stop="toggleMapLegendMenu"
          >
            {{ mapUi.legendMenuTrigger }}
          </button>
          <Transition name="seatMapPopoverFade">
            <div
              v-if="mapLegendMenuOpen"
              :id="mapLegendPanelId"
              class="seatMap__legendPopoverPanel"
            >
              <div
                class="seatMap__legend seatMap__legend--inPopover"
                role="group"
                :aria-labelledby="mapLegendPopoverTitleId"
              >
                <h2 :id="mapLegendPopoverTitleId" class="hints__title">{{ mapUi.legendTitle }}</h2>
                <ul class="legend__list">
                  <li
                    v-for="row in seatStatusLegendRows"
                    :key="'p-' + row.key"
                    class="legend__item"
                  >
                    <span
                      class="legend__swatch"
                      :class="[
                        `legend__swatch--${row.key}`,
                        { 'legend__swatch--border': row.border }
                      ]"
                      aria-hidden="true"
                    />
                    <span class="legend__label">{{ row.label }}</span>
                  </li>
                </ul>
                <p class="legend__foot legend__foot--strong">
                  {{ legendMaxPerOrderLine }}
                </p>
              </div>
            </div>
          </Transition>
        </div>
      </div>
      <Transition name="seatMapZoomBadge">
        <div v-if="mapZoomPercent > 100" class="seatMap__zoomBadge">{{ mapZoomBadgeText }}</div>
      </Transition>
      <div
        class="seatMap__legend seatMap__legend--desktop"
        role="group"
        :aria-labelledby="mapLegendTitleId"
      >
        <h2 :id="mapLegendTitleId" class="hints__title">{{ mapUi.legendTitle }}</h2>
        <ul class="legend__list">
          <li v-for="row in seatStatusLegendRows" :key="row.key" class="legend__item">
            <span
              class="legend__swatch"
              :class="[`legend__swatch--${row.key}`, { 'legend__swatch--border': row.border }]"
              aria-hidden="true"
            />
            <span class="legend__label">{{ row.label }}</span>
          </li>
        </ul>
        <p class="legend__foot legend__foot--strong">
          {{ legendMaxPerOrderLine }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, useId, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
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
  SEAT_MAP_BALCONY_ARC_SCALE_X_MIN,
  NARROW_VIEWPORT_MQ,
  SEAT_MAP_PMR_ZONE_GAP_BELOW_ROW_G,
  SEAT_MAP_PMR_ZONE_INSET_RIGHT_SVG,
  SEAT_MAP_PMR_ZONE_PAD_BOTTOM_SVG,
  SEAT_MAP_PMR_ZONE_PAD_TOP_SVG,
  SEAT_MAP_PMR_ZONE_RIGHT_SKEW_SVG
} from '../../constants'
import {
  isAccessibilityEaseSeatLabel,
  parseTheaterSeatLabel,
  rowIsBalcony,
  seatMapViewBoxString
} from '../../utils/yerresSeatLayout'
import {
  cancelAndAnimate,
  seatMapToolbarSurfaceTapKeyframes,
  seatMapToolbarIconTapKeyframes,
  SEAT_MAP_TOOLBAR_TAP_MS
} from '../../utils/tapPulse'
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
  legendMaxPerOrder: string
  activeOrderLockTitle: string
  activeOrderLockHint: string
  accessibilityZoneTitle: string
  accessibilityZoneSubtitle: string
  pmrZoneAreaLabel: string
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
/** Aligné sur `NARROW_VIEWPORT_MQ` (constants.ts) / `$bp-lg` — UI plan mobile + zoom par défaut. */
const seatMapLayoutMobile = ref(false)

function triggerToolbarTap(e: PointerEvent) {
  if (e.pointerType !== 'touch') return
  const btn = e.currentTarget as HTMLElement
  if (!btn) return
  cancelAndAnimate(btn, seatMapToolbarSurfaceTapKeyframes(), SEAT_MAP_TOOLBAR_TAP_MS)
  const icon = btn.querySelector('.toolbarRow__icon') as HTMLElement
  if (icon) {
    cancelAndAnimate(icon, seatMapToolbarIconTapKeyframes(), SEAT_MAP_TOOLBAR_TAP_MS)
  }
}

function closeMobileMapPopovers() {
  mapToolbarMenuOpen.value = false
  mapLegendMenuOpen.value = false
}

const SEAT_SIZE = 13
const SEAT_RADIUS = 1.2

/**
 * Polygone convexe avec coins arrondis (rayon comme les sièges).
 * Points en ordre **horaire** (Y vers le bas).
 */
function roundedConvexPolygonPath(points: [number, number][], radius: number): string {
  const n = points.length
  if (n < 3) return ''

  let minEdge = Infinity
  for (let i = 0; i < n; i++) {
    const p = points[i]!
    const q = points[(i + 1) % n]!
    minEdge = Math.min(minEdge, Math.hypot(q[0] - p[0], q[1] - p[1]))
  }
  const r = Math.min(radius, Math.max(0.2, minEdge * 0.25 - 0.02))

  const parts: string[] = []
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]!
    const curr = points[i]!
    const next = points[(i + 1) % n]!
    const v1x = curr[0] - prev[0]
    const v1y = curr[1] - prev[1]
    const v2x = next[0] - curr[0]
    const v2y = next[1] - curr[1]
    const len1 = Math.hypot(v1x, v1y)
    const len2 = Math.hypot(v2x, v2y)
    if (len1 < 1e-9 || len2 < 1e-9) continue
    const u1x = v1x / len1
    const u1y = v1y / len1
    const u2x = v2x / len2
    const u2y = v2y / len2
    const d = -(u1x * u2x + u1y * u2y)
    const innerAngle = Math.acos(Math.max(-1, Math.min(1, d)))
    const tf = r / Math.tan(innerAngle / 2)
    const s1x = curr[0] - u1x * tf
    const s1y = curr[1] - u1y * tf
    const s2x = curr[0] + u2x * tf
    const s2y = curr[1] + u2y * tf

    const cross = u1x * u2y - u1y * u2x
    const sweep = cross < 0 ? 0 : 1

    if (i === 0) {
      parts.push(`M ${s1x} ${s1y}`)
    } else {
      parts.push(`L ${s1x} ${s1y}`)
    }
    parts.push(`A ${r} ${r} 0 0 ${sweep} ${s2x} ${s2y}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

type LegendRow = {
  key: 'free' | 'selected' | 'hold' | 'paid'
  label: string
  border: boolean
}

const seatStatusLegendRows = computed((): LegendRow[] => [
  { key: 'free', label: mapUi.legendFree, border: true },
  { key: 'selected', label: mapUi.legendSelected, border: false },
  { key: 'hold', label: mapUi.legendHold, border: false },
  { key: 'paid', label: mapUi.legendPaid, border: false }
])

const props = withDefaults(
  defineProps<{
    seats: Seat[]
    selectedSeatIds: string[]
    activeOrder: ActiveOrder | null
    /** Aligné sur `MAX_SEATS_PER_ORDER` (API hold-seats). */
    maxSeatsPerOrder: number
    /**
     * Hauteur pilotée par le parent (px + transition) au lieu de 100dvh —
     * utilisé sur la page réservation quand le bandeau commande modifie l’espace.
     */
    fillHeight?: boolean
  }>(),
  { fillHeight: false }
)

const emit = defineEmits<{
  'seat-click': [seatId: string]
  /** Mobile : interaction sur le viewport carte — le parent peut rescroller vers #seat-selection si besoin. */
  'booking-section-scroll-if-needed': []
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
    return {
      mode: hasDepth ? 'depthRotScale' : 'rotScale',
      tx: dtx,
      ty: dty,
      cx,
      cy,
      deg,
      sx: scaleX
    }
  }
  if (hasRot) {
    return { mode: hasDepth ? 'depthRot' : 'rot', tx: dtx, ty: dty, cx, cy, deg }
  }
  return { mode: hasDepth ? 'depthScale' : 'scale', tx: dtx, ty: dty, cx, cy, sx: scaleX }
}

function mapBalconyArcPoint(
  px: number,
  py: number,
  spec: BalconyArcSpec
): { x: number; y: number } {
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
    spec.mode === 'depthRotScale' || spec.mode === 'depthRot' || spec.mode === 'depthScale'

  const parts: string[] = []
  if (hasDepth) parts.push(`translate(${spec.tx} ${spec.ty})`)
  if (spec.mode === 'depthRotScale' || spec.mode === 'rotScale') {
    parts.push(
      `translate(${cx} ${cy}) rotate(${spec.deg}) scale(${spec.sx} 1) translate(${-cx} ${-cy})`
    )
  } else if (spec.mode === 'depthRot' || spec.mode === 'rot') {
    parts.push(`rotate(${spec.deg} ${cx} ${cy})`)
  } else if (spec.mode === 'depthScale' || spec.mode === 'scale') {
    parts.push(`translate(${cx} ${cy}) scale(${spec.sx} 1) translate(${-cx} ${-cy})`)
  }
  return parts.join(' ')
}

function rowHorizontalExtent(
  seats: Seat[],
  rowLetter: string
): { minX: number; maxX: number } | null {
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
/**
 * Cadre « accès facilité » : marge basse réduite (collage aux sièges), colonne texte à droite.
 */
const ACCESSIBILITY_ZONE_INSET_TOP = 9
const ACCESSIBILITY_ZONE_INSET_LEFT = 7
const ACCESSIBILITY_ZONE_INSET_BOTTOM = 2
const ACCESSIBILITY_ZONE_INSET_AFTER_SEATS = 5
/** Largeur réservée au titre / sous-titre (alignés à droite dans cette bande). */
const ACCESSIBILITY_ZONE_LABEL_COLUMN = 100
/** Décale le bloc texte vers la gauche (depuis le bord droit du cadre). */
const ACCESSIBILITY_ZONE_TEXT_NUDGE_LEFT = 90
/** Décale le titre + sous-titre vers le bas (px SVG, positif = plus bas). */
const ACCESSIBILITY_ZONE_TEXT_OFFSET_DOWN = 4

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

function seatBoundsForAccessibilitySeats(seats: Seat[]): SeatBounds | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of seats) {
    if (!isAccessibilityEaseSeatLabel(s.label)) continue
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + SEAT_SIZE)
    maxY = Math.max(maxY, s.y + SEAT_SIZE)
  }
  if (!Number.isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

/**
 * Bbox des sièges listés (même rangée) : largeur = du bord gauche au bord droit
 * (ex. G26…G30 → emprise de G26 à G30 selon la disposition sur le plan).
 */
function seatBoundsForSeatNumbers(
  seats: Seat[],
  rowLetter: string,
  nums: number[]
): SeatBounds | null {
  const R = rowLetter.toUpperCase()
  const set = new Set(nums)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of seats) {
    const pr = parseTheaterSeatLabel(s.label)
    if (!pr || pr.row.toUpperCase() !== R) continue
    if (!set.has(pr.num)) continue
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + SEAT_SIZE)
    maxY = Math.max(maxY, s.y + SEAT_SIZE)
  }
  if (!Number.isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

/** Cadre zone accès facilité : serré en bas, extension à droite pour les libellés (text-anchor end). */
function accessibilityZoneFrameFromBounds(b: SeatBounds) {
  const x = b.minX - ACCESSIBILITY_ZONE_INSET_LEFT
  const y = b.minY - ACCESSIBILITY_ZONE_INSET_TOP
  const seatW = b.maxX - b.minX
  const seatH = b.maxY - b.minY
  const w =
    seatW +
    ACCESSIBILITY_ZONE_INSET_LEFT +
    ACCESSIBILITY_ZONE_INSET_AFTER_SEATS +
    ACCESSIBILITY_ZONE_LABEL_COLUMN
  const h = seatH + ACCESSIBILITY_ZONE_INSET_TOP + ACCESSIBILITY_ZONE_INSET_BOTTOM
  const padRight = ZONE_FRAME_LABEL_CORNER_PAD_X + ACCESSIBILITY_ZONE_TEXT_NUDGE_LEFT
  const titleX = x + w - padRight
  const subtitleX = titleX
  const lineStep = ZONE_FRAME_LABEL_LINE_STEP
  const blockApprox = 6.5 + lineStep + 4.25
  const titleY = y + Math.max(0, (h - blockApprox) / 2) + ACCESSIBILITY_ZONE_TEXT_OFFSET_DOWN
  const subtitleY = titleY + lineStep
  return { x, y, w, h, titleX, titleY, subtitleX, subtitleY }
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

/** Sous-zone rangée O : places accès facilité (O22–O2 et O5–O21). */
const accessibilitySeatBounds = computed(() => seatBoundsForAccessibilitySeats(props.seats))
const accessibilityZone = computed(() => {
  const b = accessibilitySeatBounds.value
  if (!b) return null
  return accessibilityZoneFrameFromBounds(b)
})

/** Zone PMR sous G26–G30 : hauteur de base = 2 × `SEAT_SIZE`, + pads dans `constants.ts`. */
/** Taille logique de l’icône PMR (Font Awesome 512×512 après `translate(0,512) scale(0.1,-0.1)`). */
const PMR_ICON_UNITS = 512

const pmrZoneBelowG26to30 = computed(() => {
  const b = seatBoundsForSeatNumbers(props.seats, 'G', [26, 27, 28, 29, 30])
  if (!b) return null
  const padTop = SEAT_MAP_PMR_ZONE_PAD_TOP_SVG
  const padBottom = SEAT_MAP_PMR_ZONE_PAD_BOTTOM_SVG
  const h = SEAT_SIZE * 2 + padTop + padBottom
  const x = b.minX
  const y = b.maxY + SEAT_MAP_PMR_ZONE_GAP_BELOW_ROW_G - padTop
  const w = Math.max(SEAT_SIZE, b.maxX - b.minX - SEAT_MAP_PMR_ZONE_INSET_RIGHT_SVG)
  const skew = SEAT_MAP_PMR_ZONE_RIGHT_SKEW_SVG
  const zonePath = roundedConvexPolygonPath(
    [
      [x, y],
      [x + w, y],
      [x + w - skew, y + h],
      [x, y + h]
    ],
    SEAT_RADIUS
  )
  const iconSize = Math.min(w, h) * 0.5
  const s = iconSize / PMR_ICON_UNITS
  const cx = x + w / 2 - skew / 4
  const cy = y + h / 2
  const iconTransform = `translate(${cx - (PMR_ICON_UNITS / 2) * s} ${cy - (PMR_ICON_UNITS / 2) * s}) scale(${s})`
  return { x, y, w, h, zonePath, iconTransform }
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
  if (accessibilityZone.value) out.push(accessibilityZone.value)
  if (pmrZoneBelowG26to30.value) out.push(pmrZoneBelowG26to30.value)
  if (stageBlock.value) out.push(stageBlock.value)
  return out.length ? out : undefined
})

const svgViewBox = computed(() =>
  seatMapViewBoxString(props.seats, SEAT_SIZE, 18, mapOverlayRects.value)
)

const MAP_ZOOM_MIN = 1
/** Sous `NARROW_VIEWPORT_MQ` : zoom mini > 1 (carte lisible sur petits viewports). */
const MAP_ZOOM_MIN_MOBILE = 1.32
/** 15 = 1500 % dans le badge et les contrôles */
const MAP_ZOOM_MAX = 15
/** Boutons ±, raccourcis clavier : pas multiplicatif (inchangé par le réglage pincement desktop). */
const MAP_ZOOM_STEP = 1.25
/**
 * Pincement desktop uniquement (viewport large, hors `NARROW_VIEWPORT_MQ`) :
 * Chrome / Firefox — Ctrl + molette / trackpad. Plus proche de 1 = zoom plus doux (ex. 1.04 ≈ 4 % par impulsion).
 * @see MAP_DESKTOP_SAFARI_PINCH_SENSITIVITY pour Safari (gesture*).
 */
const MAP_DESKTOP_TRACKPAD_PINCH_STEP = 1.1
/**
 * Safari (Mac) — `gesturechange` : atténue `scale` autour de 1. 1 = natif ; ~0.35–0.5 = plus doux.
 * Ajuste ici si le pincement Safari reste trop fort après `MAP_DESKTOP_TRACKPAD_PINCH_STEP`.
 */
const MAP_DESKTOP_SAFARI_PINCH_SENSITIVITY = 1
/** En px écran : au-delà, un geste commencé sur un siège devient un pan (sinon = clic siège). */
const MAP_PAN_DRAG_THRESHOLD_PX = 6

function isSeatMapMobileViewport() {
  if (!import.meta.client) return false
  return window.matchMedia(NARROW_VIEWPORT_MQ).matches
}

/** Zoom initial si `NARROW_VIEWPORT_MQ` après chargement / recalcul du viewBox (132 %). */
const MAP_ZOOM_DEFAULT_MOBILE = MAP_ZOOM_MIN_MOBILE

function defaultMapZoomForViewport(): number {
  return isSeatMapMobileViewport() ? MAP_ZOOM_DEFAULT_MOBILE : 1
}

/** Réduit l’effet du `scale` Safari autour de 1 (desktop). */
function dampenDesktopSafariPinchScale(scale: number): number {
  return 1 + (scale - 1) * MAP_DESKTOP_SAFARI_PINCH_SENSITIVITY
}

/** Min zoom effectif (réactif à `NARROW_VIEWPORT_MQ` via seatMapLayoutMobile). */
const mapZoomMinEffective = computed(() => {
  void seatMapLayoutMobile.value
  return isSeatMapMobileViewport() ? MAP_ZOOM_MIN_MOBILE : MAP_ZOOM_MIN
})

const route = useRoute()

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
  const parts = svgViewBox.value
    .trim()
    .split(/[\s,]+/)
    .map(Number)
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
  const dt = mapNavLastTs > 0 ? Math.min(0.05, Math.max(0, (ts - mapNavLastTs) / 1000)) : 1 / 60
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
const mapZoomBadgeText = computed(() =>
  mapUi.zoomPercent.replace('{n}', String(mapZoomPercent.value))
)

watch(
  svgViewBox,
  () => {
    if (import.meta.client) {
      stopMapNavRaf()
    }
    mapPanX.value = 0
    mapPanY.value = 0
    // SSR : pas de `matchMedia` — ne pas figer le zoom à 1 puis omettre de relancer le watch à l’hydratation.
    mapZoom.value = import.meta.client ? defaultMapZoomForViewport() : 1
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
  },
  { immediate: true }
)

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

function isMapNavLocked() {
  return !!props.activeOrder
}

/** Met à jour les cibles (zoom autour du point focus) puis lisse vers l’affichage via rAF. */
function setMapZoomAtPoint(z1: number, focusX: number, focusY: number) {
  if (isMapNavLocked()) return
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

function zoomMapByStep(mult: number) {
  if (isMapNavLocked()) return
  emit('booking-section-scroll-if-needed')
  const svg = svgRef.value
  if (!svg) return
  const r = svg.getBoundingClientRect()
  const p = clientToSvgPoint(r.left + r.width / 2, r.top + r.height / 2)
  setMapZoomAtPoint(mapTargetZoom.value * mult, p.x, p.y)
}

function resetMapView() {
  if (isMapNavLocked()) return
  emit('booking-section-scroll-if-needed')
  const z = defaultMapZoomForViewport()
  mapTargetPanX.value = 0
  mapTargetPanY.value = 0
  mapTargetZoom.value = z
  clampTargetMapPan()
  closeMobileMapPopovers()
  /** Même lissage que zoom / pan : ne pas assigner mapZoom/mapPan directement. */
  requestMapNavSmoothingFrame()
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
let removeViewportPinchListeners: (() => void) | undefined

/** Safari (Mac / iOS) : événements `gesture*` ; Chrome / Firefox Mac : molette + ctrl (pincement trackpad). */
let safariGestureBaseZoom = 1

function touchPinchDistance(t: TouchList) {
  const a = t.item(0)
  const b = t.item(1)
  if (!a || !b) return 0
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function touchPinchMidClient(t: TouchList) {
  const a = t.item(0)
  const b = t.item(1)
  if (!a || !b) return { x: 0, y: 0 }
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
}

let touchPinchStartDist = 0
let touchPinchStartZoom = 1

onMounted(() => {
  if (!import.meta.client) return
  window.addEventListener('keydown', onWindowMapKeydownCapture, true)
  const mq = window.matchMedia(NARROW_VIEWPORT_MQ)
  const onMq = () => {
    seatMapLayoutMobile.value = mq.matches
    if (!mq.matches) {
      closeMobileMapPopovers()
    }
  }
  onMq()
  mq.addEventListener('change', onMq)
  document.addEventListener('pointerdown', onDocumentPointerDownCloseMenu, true)
  void nextTick(() => {
    const vp = viewportRef.value
    if (!vp) return
    const nonPassive: AddEventListenerOptions = { passive: false }

    const onGestureStart = (e: Event) => {
      if (isMapNavLocked()) return
      ;(e as unknown as { preventDefault(): void }).preventDefault()
      emit('booking-section-scroll-if-needed')
      safariGestureBaseZoom = mapTargetZoom.value
    }
    const onGestureChange = (e: Event) => {
      if (isMapNavLocked()) return
      const ev = e as unknown as {
        preventDefault(): void
        scale: number
        clientX: number
        clientY: number
      }
      ev.preventDefault()
      const scale = isSeatMapMobileViewport() ? ev.scale : dampenDesktopSafariPinchScale(ev.scale)
      const z = safariGestureBaseZoom * scale
      const p = clientToSvgPoint(ev.clientX, ev.clientY)
      setMapZoomAtPoint(z, p.x, p.y)
    }
    const onGestureEnd = (e: Event) => {
      if (isMapNavLocked()) return
      ;(e as unknown as { preventDefault(): void }).preventDefault()
    }

    /** Chrome / Firefox (Mac) : pincement trackpad = molette + ctrlKey (Safari utilise gesture*). */
    const onWheelPinch = (e: WheelEvent) => {
      if (isMapNavLocked()) return
      if (!e.ctrlKey) return
      emit('booking-section-scroll-if-needed')
      e.preventDefault()
      const step = isSeatMapMobileViewport() ? MAP_ZOOM_STEP : MAP_DESKTOP_TRACKPAD_PINCH_STEP
      const mult = e.deltaY < 0 ? step : 1 / step
      const p = clientToSvgPoint(e.clientX, e.clientY)
      setMapZoomAtPoint(mapTargetZoom.value * mult, p.x, p.y)
    }

    vp.addEventListener('gesturestart', onGestureStart, nonPassive)
    vp.addEventListener('gesturechange', onGestureChange, nonPassive)
    vp.addEventListener('gestureend', onGestureEnd, nonPassive)

    const onTouchStart = (e: TouchEvent) => {
      if (isMapNavLocked()) return
      if (e.touches.length === 2) {
        emit('booking-section-scroll-if-needed')
        stopMapNavRaf()
        isMapPanning.value = false
        mapPanAwaitingThreshold.value = false
        touchPinchStartDist = touchPinchDistance(e.touches)
        touchPinchStartZoom = mapTargetZoom.value
        if (touchPinchStartDist > 1) e.preventDefault()
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (isMapNavLocked()) return
      if (e.touches.length === 2 && touchPinchStartDist > 1) {
        const d = touchPinchDistance(e.touches)
        const z = touchPinchStartZoom * (d / touchPinchStartDist)
        const { x, y } = touchPinchMidClient(e.touches)
        const p = clientToSvgPoint(x, y)
        setMapZoomAtPoint(z, p.x, p.y)
        e.preventDefault()
      }
    }
    const onTouchEndOrCancel = (e: TouchEvent) => {
      if (e.touches.length < 2) touchPinchStartDist = 0
    }

    vp.addEventListener('wheel', onWheelPinch, nonPassive)
    vp.addEventListener('touchstart', onTouchStart, nonPassive)
    vp.addEventListener('touchmove', onTouchMove, nonPassive)
    vp.addEventListener('touchend', onTouchEndOrCancel)
    vp.addEventListener('touchcancel', onTouchEndOrCancel)

    removeViewportPinchListeners = () => {
      vp.removeEventListener('gesturestart', onGestureStart, nonPassive)
      vp.removeEventListener('gesturechange', onGestureChange, nonPassive)
      vp.removeEventListener('gestureend', onGestureEnd, nonPassive)
      vp.removeEventListener('wheel', onWheelPinch, nonPassive)
      vp.removeEventListener('touchstart', onTouchStart, nonPassive)
      vp.removeEventListener('touchmove', onTouchMove, nonPassive)
      vp.removeEventListener('touchend', onTouchEndOrCancel)
      vp.removeEventListener('touchcancel', onTouchEndOrCancel)
    }
  })
  teardownMapToolbarMenuListeners = () => {
    window.removeEventListener('keydown', onWindowMapKeydownCapture, true)
    mq.removeEventListener('change', onMq)
    document.removeEventListener('pointerdown', onDocumentPointerDownCloseMenu, true)
  }
})

onBeforeUnmount(() => {
  stopMapNavRaf()
  removeViewportPinchListeners?.()
  teardownMapToolbarMenuListeners?.()
})

function beginMapPan(e: PointerEvent) {
  if (isMapNavLocked()) return
  emit('booking-section-scroll-if-needed')
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
  if (isMapNavLocked()) return
  if (isSeatMapMobileViewport()) {
    emit('booking-section-scroll-if-needed')
  }
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
  if (isMapNavLocked()) return
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

/** Cible clavier où saisir + / − ne doit pas piloter le plan (email, etc.). */
function isEditableFieldKeyTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el?.closest) return false
  return !!el.closest('input, textarea, select, [contenteditable]')
}

/**
 * Zoom avant : uniquement le caractère tapé (+, =) ou pavé num. « + ».
 * On évite `code === 'Equal'` : selon clavier / OS le code physique ne correspond pas au caractère
 * et peut se chevaucher avec d’autres touches (surtout AZERTY / ISO).
 */
function isMapZoomInKeyEvent(e: KeyboardEvent): boolean {
  return e.code === 'NumpadAdd' || e.key === '+' || e.key === '='
}

/**
 * Zoom arrière : uniquement les caractères « moins » / underscore, ou pavé num. « − ».
 * Ne pas matcher `code === 'Minus'` seul : sur AZERTY la même position physique peut produire « ) »,
 * ce qui déclenchait un dézoom intempestif ; inversement « - » est souvent sur `Digit6` (key = '-').
 */
function isMapZoomOutKeyEvent(e: KeyboardEvent): boolean {
  const k = e.key
  if (k === '-' || k === '−' || k === '_') return true
  return e.code === 'NumpadSubtract'
}

/**
 * Raccourcis avec focus sur le viewport : + / − / = / _, 0, Échap.
 * Les boutons (sièges, toolbar) sont exclus pour laisser le comportement natif si besoin.
 */
function applyMapKeyboardShortcuts(e: KeyboardEvent) {
  if (isMapNavLocked()) return
  const el = e.target as HTMLElement
  if (el.closest?.('button, input, textarea, select, [contenteditable]')) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (isMapZoomOutKeyEvent(e)) {
    e.preventDefault()
    zoomMapByStep(1 / MAP_ZOOM_STEP)
  } else if (isMapZoomInKeyEvent(e)) {
    e.preventDefault()
    zoomMapByStep(MAP_ZOOM_STEP)
  } else if (e.key === '0' || e.code === 'Numpad0' || e.code === 'Digit0') {
    e.preventDefault()
    resetMapView()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    resetMapView()
  }
}

/**
 * Accueil : + / − (et =, _, pavé num.) zooment le plan ; 0 / Échap réinitialisent la vue —
 * sans focus sur le viewport, comme pour le zoom global — sauf champ de saisie.
 */
function tryHomeGlobalMapZoom(e: KeyboardEvent): boolean {
  if (isMapNavLocked()) return false
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  const path = route.path
  if (path !== '/' && path !== '') return false
  if (isEditableFieldKeyTarget(e.target)) return false

  if (isMapZoomOutKeyEvent(e)) {
    e.preventDefault()
    zoomMapByStep(1 / MAP_ZOOM_STEP)
    return true
  }
  if (isMapZoomInKeyEvent(e)) {
    e.preventDefault()
    zoomMapByStep(MAP_ZOOM_STEP)
    return true
  }
  if (e.key === '0' || e.code === 'Numpad0' || e.code === 'Digit0') {
    e.preventDefault()
    resetMapView()
    return true
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    resetMapView()
    return true
  }
  return false
}

function onWindowMapKeydownCapture(e: KeyboardEvent) {
  const vp = viewportRef.value
  if (!vp) return

  if (tryHomeGlobalMapZoom(e)) return

  const ae = document.activeElement
  if (ae !== vp && !(ae instanceof Node && vp.contains(ae))) return
  applyMapKeyboardShortcuts(e)
}

/** Classe CSS pour `fill` animé (évite l’attribut `:fill` qui ne transitionne pas bien). */
function seatVisualClass(seat: Seat) {
  if (seat.status === 'paid') return 'svg__seat--paid'
  if (seat.status === 'hold') return 'svg__seat--hold'
  if (seat.status === 'staff') return 'svg__seat--paid'
  if (selectedSet.value.has(seat.id)) return 'svg__seat--selected'
  return 'svg__seat--free'
}

function isSeatClickable(seat: Seat) {
  if (seat.status !== 'free' || props.activeOrder) return false
  if (selectedSet.value.has(seat.id)) return true
  return props.selectedSeatIds.length < props.maxSeatsPerOrder
}

function getSeatTitle(seat: Seat) {
  if (props.activeOrder && seat.status === 'free')
    return content.home.seats.tooltip.reservationInProgress
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
.seatMap {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  overflow: hidden;
  height: 100dvh;
  box-shadow: 0 4px 12px rgba(33, 37, 41, 0.04);

  &--fillHeight {
    height: 100%;
    min-height: 0;
    margin-bottom: 0;
  }

  .seatMap__viewport {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    touch-action: none;
    outline: none;

    &:focus-visible {
      outline: 2px solid $seat-map-focus-outline;
      outline-offset: 2px;
    }
  }

  &--activeOrderLock {
    pointer-events: none;

    .seatMap__viewport {
      touch-action: auto;
    }
  }

  .seatMap__activeOrderLock {
    position: absolute;
    inset: 0;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    box-sizing: border-box;
    border-radius: 4px;
    background: rgba(15, 23, 42, 0.38);
    backdrop-filter: blur(4px) saturate(0.92);
    -webkit-backdrop-filter: blur(4px) saturate(0.92);
  }

  .seatMapActiveOrderLock-enter-active,
  .seatMapActiveOrderLock-leave-active {
    transition:
      opacity 0.42s cubic-bezier(0.33, 1, 0.68, 1),
      backdrop-filter 0.52s ease,
      -webkit-backdrop-filter 0.52s ease;
  }

  .seatMapActiveOrderLock-enter-active .seatMap__activeOrderLockCard,
  .seatMapActiveOrderLock-leave-active .seatMap__activeOrderLockCard {
    transition:
      opacity 0.36s cubic-bezier(0.33, 1, 0.68, 1) 0.06s,
      transform 0.4s cubic-bezier(0.33, 1, 0.68, 1) 0.06s;
  }

  .seatMapActiveOrderLock-enter-from,
  .seatMapActiveOrderLock-leave-to {
    opacity: 0;
    backdrop-filter: blur(0);
    -webkit-backdrop-filter: blur(0);
  }

  .seatMapActiveOrderLock-enter-from .seatMap__activeOrderLockCard,
  .seatMapActiveOrderLock-leave-to .seatMap__activeOrderLockCard {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }

  @media (prefers-reduced-motion: reduce) {
    .seatMapActiveOrderLock-enter-active,
    .seatMapActiveOrderLock-leave-active {
      transition-duration: 0.01ms !important;
    }

    .seatMapActiveOrderLock-enter-active .seatMap__activeOrderLockCard,
    .seatMapActiveOrderLock-leave-active .seatMap__activeOrderLockCard {
      transition-duration: 0.01ms !important;
    }

    .seatMap__activeOrderLock {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    .seatMapActiveOrderLock-enter-from,
    .seatMapActiveOrderLock-leave-to {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
  }

  .seatMap__activeOrderLockCard {
    max-width: 16.5rem;
    padding: 14px 16px 16px;
    text-align: center;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 4px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.8);
  }

  .activeOrderLock__icon {
    display: block;
    width: 28px;
    height: 28px;
    margin: 0 auto 10px;
    color: $color-text-muted;
  }

  .activeOrderLock__title {
    margin: 0 0 6px;
    font-size: 0.875rem;
    font-weight: 700;
    color: $color-text-primary;
    line-height: 1.3;
  }

  .activeOrderLock__hint {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 500;
    color: $color-text-secondary;
    line-height: 1.4;
  }

  &.seatMap--activeOrderLock {
    .seatMap__toolbarHost {
      opacity: 0.42;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
  }

  /*
   * Pendant le pan, le curseur est celui du nœud sous le pointeur : les sièges imposent `pointer` plus bas
   * dans la feuille (même spécificité → cascade). `inherit !important` depuis le <svg> impose le mode grab.
   * Personnaliser : --seat-map-pan-cursor (ex. url(...) 16 16, grabbing) sur .seatMap ou parent.
   */
  .seatMap__viewport--isGrabbing {
    --seat-map-pan-cursor: grabbing;
  }

  .seatMap__viewport--isGrabbing .viewport__svg {
    cursor: var(--seat-map-pan-cursor);
  }

  .seatMap__viewport--isGrabbing .viewport__svg * {
    cursor: inherit !important;
  }

  .seatMap__overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .seatMap__hints {
    position: absolute;
    top: 10px;
    left: 12px;
    right: auto;
    max-width: min(calc(100% - 120px), 16.5rem);
    margin: 0;
    padding: 9px 12px 10px;
    background: $color-surface-panel;
    border-radius: 4px;
    box-shadow: 0 1px 6px $seat-map-ui-shadow-soft;
    pointer-events: none;

    .hints__title {
      margin-bottom: 1rem;
    }
  }

  .hints__title {
    margin: 0 0 0.55em;
    padding: 0;
    border: none;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $seat-map-ui-text-muted;
    line-height: 1.3;
  }

  .hints__list {
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
      color: $seat-map-ui-text-strong;
      line-height: 1.35;
    }

    dd {
      margin: 0;
      font-size: 0.68rem;
      font-weight: 500;
      line-height: 1.4;
      color: $seat-map-ui-text-soft;
    }
  }

  .seatMap__hints--desktop {
    @include media-down(lg) {
      display: none !important;
    }
  }

  .seatMap__hints--inPopover {
    display: none !important;

    @include media-down(lg) {
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

  .seatMap__legend--inPopover {
    display: none !important;

    @include media-down(lg) {
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

  .seatMap__toolbarHost {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
    pointer-events: none;

    @include media-down(lg) {
      left: 0;
      right: 0;
      top: 0;
      width: 100%;
      height: 100%;
      min-height: 0;
      align-items: stretch;
    }
  }

  .seatMap__mobileLeftStack {
    display: none;

    @include media-down(lg) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      position: absolute;
      left: 12px;
      top: 10px;
      z-index: 1;
      pointer-events: none;
    }
  }

  .seatMap__toolbarHelp {
    display: none;
    flex-direction: column;
    align-items: flex-start;

    @include media-down(lg) {
      display: flex;
      position: static;
      pointer-events: none;
    }
  }

  .seatMap__toolbarHelp .seatMap__toolbarTrigger,
  .seatMap__toolbarHelp .seatMap__toolbarHintsPanel {
    pointer-events: auto;
  }

  .seatMap__legendHelp {
    display: none;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 6px;

    @include media-down(lg) {
      display: flex;
      position: absolute;
      right: 12px;
      bottom: 14px;
      z-index: 2;
      pointer-events: none;
    }
  }

  .seatMap__legendHelp .seatMap__toolbarTrigger,
  .seatMap__legendHelp .seatMap__legendPopoverPanel {
    pointer-events: auto;
  }

  .seatMap__toolbarTrigger {
    display: none;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 0 12px;

    @include media-down(lg) {
      position: relative;
      &::after {
        content: '';
        position: absolute;
        inset: -6px -6px;
        z-index: 1;
      }
    }

    margin: 0;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    color: $seat-map-hint-text;
    background: $seat-map-ui-surface;
    border: 1px solid $seat-map-ui-border;
    border-radius: 4px;
    box-shadow: 0 1px 4px $seat-map-ui-shadow-soft;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition:
      transform 0.12s ease,
      background 0.25s ease,
      color 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease;

    &:active {
      transform: scale(0.94);
      box-shadow: inset 0 1px 2px rgba(33, 37, 41, 0.12);
    }

    @media (hover: hover) {
      &:hover {
        background: $seat-map-hint-text;
        border-color: $seat-map-hint-text;
        color: $seat-map-ui-surface-solid;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
      }
    }

    @include media-down(lg) {
      display: inline-flex;
    }
  }

  .seatMap__toolbarHintsPanel {
    display: none;

    @include media-down(lg) {
      display: block;
      margin-top: 6px;
      margin-left: 0;
      padding: 10px 11px;
      background: $seat-map-ui-surface-elevated;
      border: 1px solid $seat-map-ui-border;
      border-radius: 4px;
      box-shadow: $seat-map-ui-shadow-popover-up;
      min-width: 0;
      /* Gauche : inset · droite : inset + colonne icônes + marge — évite le chevauchement */
      max-width: min(calc(100vw - 12px - 44px - 12px - 10px), 16.77rem);
      box-sizing: border-box;
      max-height: min(52dvh, 22rem);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  .seatMap__legendPopoverPanel {
    display: none;

    @include media-down(lg) {
      display: block;
      margin: 0;
      padding: 10px 11px;
      background: $seat-map-ui-surface-elevated;
      border: 1px solid $seat-map-ui-border;
      border-radius: 4px;
      box-shadow: $seat-map-ui-shadow-popover-down;
      min-width: 0;
      width: max-content;
      max-width: min(calc(100vw - 12px - 44px - 12px - 10px), 14rem);
      box-sizing: border-box;
      max-height: min(48dvh, 20rem);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  .seatMapPopoverFade-enter-active,
  .seatMapPopoverFade-leave-active {
    transition: opacity 0.16s ease;
  }

  .seatMapPopoverFade-enter-from,
  .seatMapPopoverFade-leave-to {
    opacity: 0;
  }

  .seatMap__toolbar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
    width: max-content;
    max-width: min(calc(100vw - 100px), 17rem);
    pointer-events: none;

    @include media-down(lg) {
      position: absolute;
      right: 12px;
      top: 10px;
      z-index: 1;
      max-width: min(calc(100vw - 24px), 17rem);
    }
  }

  .seatMap__toolbarRow {
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
    color: $seat-map-hint-text;
    background: $seat-map-ui-surface;
    border: 1px solid $seat-map-ui-border;
    border-radius: 4px;
    box-shadow: 0 1px 4px $seat-map-ui-shadow-soft;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition:
      transform 0.12s ease,
      background 0.25s ease,
      color 0.25s ease,
      border-color 0.25s ease,
      opacity 0.25s ease,
      box-shadow 0.25s ease;

    &:active:not(:disabled) {
      transform: scale(0.94);
      box-shadow: inset 0 1px 2px rgba(33, 37, 41, 0.12);
    }

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background: $seat-map-hint-text;
        border-color: $seat-map-hint-text;
        color: $seat-map-ui-surface-solid;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
      }
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.48;
    }
  }

  .toolbarRow__label {
    font-size: 0.68rem;
    font-weight: 600;
    line-height: 1.25;
    color: currentColor;
    justify-self: start;
    transition:
      color 0.25s ease,
      opacity 0.25s ease;
  }

  .toolbarRow__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1;
    justify-self: end;
    color: currentColor;
    transition:
      color 0.25s ease,
      opacity 0.25s ease;
  }

  .seatMap__toolbarRow--reset .toolbarRow__icon {
    font-size: 1.05rem;
  }

  @include media-down(lg) {
    .seatMap__toolbarRow {
      position: relative;
      grid-template-columns: 36px;
      width: 40px;
      padding: 0;
      justify-items: center;

      &::after {
        content: '';
        position: absolute;
        inset: -4px -12px;
        z-index: 1;
      }

      .toolbarRow__icon {
        width: 36px;
        height: 36px;
      }

      .toolbarRow__label {
        display: none !important;
      }
    }
  }

  .seatMap__zoomBadge {
    position: absolute;
    bottom: 14px;
    left: 12px;
    padding: 4px 9px;
    font-size: 0.7rem;
    font-weight: 600;
    color: $color-text-secondary;
    background: $color-surface-panel;
    border-radius: 4px;
    box-shadow: 0 1px 4px $seat-map-ui-shadow-soft;
    pointer-events: none;
  }

  .seatMapZoomBadge-enter-active,
  .seatMapZoomBadge-leave-active {
    transition: opacity 0.2s ease;
  }

  .seatMapZoomBadge-enter-from,
  .seatMapZoomBadge-leave-to {
    opacity: 0;
  }

  .seatMap__legend--desktop {
    position: absolute;
    right: 12px;
    bottom: 14px;
    z-index: 2;
    max-width: min(16rem, calc(100vw - 96px));
    padding: 8px 10px 9px;
    background: rgba(255, 255, 255, 0.94);
    border-radius: 4px;
    box-shadow: 0 1px 6px $seat-map-ui-shadow-medium;
    pointer-events: none;

    @include media-down(lg) {
      display: none !important;
    }
  }

  .seatMap__legend {
    .hints__title {
      margin-bottom: 1rem;
    }

    .legend__foot {
      margin-top: 1rem;

      &--strong {
        margin-top: 1rem;
      }
    }
  }

  .legend__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .legend__item {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 0.32em;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .legend__swatch {
    flex-shrink: 0;
    width: 11px;
    height: 11px;
    border-radius: 4px;

    &--border {
      box-shadow: inset 0 0 0 1px $seat-map-legend-swatch-border;
    }

    &--free {
      background: $seat-map-seat-fill-free;
    }
    &--selected {
      background: $seat-map-seat-fill-selected;
    }
    &--hold {
      background: $seat-map-seat-fill-hold;
    }
    &--paid {
      background: $seat-map-seat-fill-paid;
    }
  }

  .legend__label {
    font-size: 0.62rem;
    font-weight: 500;
    line-height: 1.35;
    color: $seat-map-hint-text;
  }

  .legend__foot {
    margin: 0.55em 0 0;
    font-size: 0.58rem;
    font-weight: 500;
    line-height: 1.4;
    color: $seat-map-ui-text-muted;

    &--strong {
      margin-top: 0.35em;
      font-weight: 600;
      color: $seat-map-ui-text-soft;
    }
  }

  @include media-down(lg) {
    .seatMap__legend--inPopover .legend__label {
      font-size: 0.6rem;
    }
  }

  .viewport__svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: hidden;
    border: 2px solid $seat-map-viewport-border;
    border-radius: 4px;
    background: $seat-map-viewport-bg;
    user-select: none;
    cursor: grab;

    .svg__seat {
      stroke: $seat-map-seat-stroke;
      stroke-width: 0.45;
      transition: fill 0.35s ease;

      &--free {
        fill: $seat-map-seat-fill-free;
      }
      &--selected {
        fill: $seat-map-seat-fill-selected;
      }
      &--hold {
        fill: $seat-map-seat-fill-hold;
      }
      &--paid {
        fill: $seat-map-seat-fill-paid;
      }

      &--clickable {
        cursor: pointer;
      }

      &--disabled {
        cursor: not-allowed;
      }
    }

    .svg__label {
      text-anchor: middle;
      font-size: 4.5px;
      font-weight: 600;
      fill: $seat-map-label-fill;
      pointer-events: none;
    }

    .svg__stageRect {
      fill: $seat-map-stage-fill;
      stroke: $seat-map-stage-stroke;
      stroke-width: 0.5;
      pointer-events: none;
    }

    .svg__stageLabel {
      text-anchor: middle;
      font-size: 9px;
      font-weight: 700;
      fill: $seat-map-stage-label;
      letter-spacing: 0.04em;
      pointer-events: none;
    }

    .svg__zoneRect {
      stroke: none;
      pointer-events: none;

      &--balcony {
        fill: $seat-map-zone-balcony-fill;
      }

      &--parterre {
        fill: $seat-map-zone-parterre-fill;
      }

      &--accessibility {
        fill: $seat-map-zone-accessibility-fill;
      }

      &--pmr {
        fill: $seat-map-zone-pmr-fill;
        stroke: $seat-map-zone-pmr-stroke;
        stroke-width: 0.45;
      }
    }

    .svg__zone--pmr {
      pointer-events: none;
    }

    .svg__pmrIcon {
      color: $seat-map-pmr-icon;
    }

    .svg__zoneTitle {
      text-anchor: start;
      dominant-baseline: hanging;
      font-size: 6.5px;
      font-weight: 700;
      fill: $seat-map-zone-title;
      letter-spacing: 0.02em;
      pointer-events: none;
    }

    .svg__zoneSubtitle {
      text-anchor: start;
      dominant-baseline: hanging;
      font-size: 4.25px;
      font-weight: 600;
      fill: $seat-map-zone-subtitle;
      pointer-events: none;
    }

    .svg__pannableBg {
      cursor: grab;
    }
  }
}
</style>
