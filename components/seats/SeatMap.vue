<template>
  <div class="seat-map_container">
    <svg :viewBox="svgViewBox" class="container__svg" preserveAspectRatio="xMidYMid meet">
      <image
        v-if="SEAT_MAP_DEBUG_BACKGROUND"
        class="container__plan-bg"
        href="/yerres-plan-numerote-debug.jpg"
        :x="viewBoxParts.x"
        :y="viewBoxParts.y"
        :width="viewBoxParts.w"
        :height="viewBoxParts.h"
        preserveAspectRatio="xMidYMid meet"
        opacity="1"
      />
      <rect
        v-for="seat in seats"
        :key="seat.id"
        :x="seat.x"
        :y="seat.y"
        :width="SEAT_SIZE"
        :height="SEAT_SIZE"
        :rx="SEAT_RADIUS"
        :ry="SEAT_RADIUS"
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
import { SEAT_MAP_DEBUG_BACKGROUND } from '../../constants'
import { seatMapViewBoxString } from '../../utils/yerresSeatLayout'

const SEAT_SIZE = 10.5
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

const svgViewBox = computed(() => seatMapViewBoxString(props.seats, SEAT_SIZE, 18))

const viewBoxParts = computed(() => {
  const p = svgViewBox.value.split(/\s+/).map(Number)
  return {
    x: p[0] ?? 0,
    y: p[1] ?? 0,
    w: p[2] ?? 100,
    h: p[3] ?? 100
  }
})

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

  .container__svg {
    width: 100%;
    max-width: 100%;
    height: 600px;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    background: #e8eaed;
    user-select: none;

    .container__plan-bg {
      pointer-events: none;
      visibility: hidden;
    }

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
      fill: #1a1a1a;
      pointer-events: none;
    }
  }
}
</style>
