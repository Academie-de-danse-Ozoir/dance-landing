<template>
  <div class="seat-map__container">
    <svg viewBox="0 0 420 320" class="seat-map__svg" preserveAspectRatio="xMidYMid meet">
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
        :class="[
          'seat-map__seat',
          {
            'seat-map__seat--clickable': isSeatClickable(seat),
            'seat-map__seat--disabled': !isSeatClickable(seat),
            'seat-map__seat--dimmed': getSeatOpacity(seat) < 1
          }
        ]"
        :title="getSeatTitle(seat)"
        @click="handleSeatClick(seat)"
      />
      <text
        v-for="seat in seats"
        :key="seat.id + '-label'"
        :x="seat.x + SEAT_SIZE / 2"
        :y="seat.y + SEAT_SIZE / 2 + 6"
        class="seat-map__label"
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

const SEAT_SIZE = 40
const SEAT_RADIUS = 4

const SEAT_COLORS = {
  paid: '#e53935',
  hold: '#ffb300',
  selected: '#4caf50',
  free: '#ccc'
} as const

const props = defineProps<{
  seats: Seat[]
  selectedSeatIds: string[]
  activeOrder: ActiveOrder | null
}>()

const emit = defineEmits<{
  'seat-click': [seatId: string]
}>()

const selectedSet = computed(() => new Set(props.selectedSeatIds))

function getSeatFill(seat: Seat) {
  if (seat.status === 'paid') return SEAT_COLORS.paid
  if (seat.status === 'hold') return SEAT_COLORS.hold
  if (selectedSet.value.has(seat.id)) return SEAT_COLORS.selected
  return SEAT_COLORS.free
}

function isSeatClickable(seat: Seat) {
  return seat.status === 'free' && !props.activeOrder
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
  if (seat.status === 'free' && !props.activeOrder) {
    emit('seat-click', seat.id)
  }
}
</script>

<style lang="scss" scoped>
.seat-map {
  &__container {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

  &__svg {
    width: 100%;
    max-width: 420px;
    height: auto;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    background: #f8f9fa;
  }

  &__seat {
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

  &__label {
    text-anchor: middle;
    font-size: 12px;
    pointer-events: none;
  }
}
</style>

