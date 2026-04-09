<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'defaultButton',
      `defaultButton--${variant}`,
      { 'defaultButton--disabled': disabled }
    ]"
    @pointerdown="handleTap"
    @click="$emit('click', $event)"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import {
  cancelAndAnimate,
  defaultButtonPrimaryTapKeyframes,
  defaultButtonSecondaryTapKeyframes,
  defaultButtonCancelReservationTapKeyframes,
  DEFAULT_BUTTON_TAP_MS
} from '../../utils/tapPulse'

const props = withDefaults(defineProps<{
  label: string
  variant?: 'primary' | 'secondary' | 'cancelReservation'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
  disabled: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function handleTap(e: PointerEvent) {
  if (props.disabled || e.pointerType !== 'touch') return
  const el = e.currentTarget as HTMLElement
  if (!el) return

  let kf: Keyframe[] = []
  if (props.variant === 'primary') kf = defaultButtonPrimaryTapKeyframes()
  else if (props.variant === 'secondary') kf = defaultButtonSecondaryTapKeyframes()
  else if (props.variant === 'cancelReservation') kf = defaultButtonCancelReservationTapKeyframes()

  if (kf.length) {
    cancelAndAnimate(el, kf, DEFAULT_BUTTON_TAP_MS)
  }
}
</script>

<style lang="scss" scoped>
.defaultButton {
  display: inline-block;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  padding: 10px 16px;
  font-size: 14px;
  border-radius: 4px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition:
    transform 0.12s ease,
    color 0.25s ease,
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    opacity 0.25s ease;

  &:active:not(:disabled) {
    transform: scale(0.94);
    box-shadow: inset 0 1px 2px rgba(33, 37, 41, 0.12);
  }

  &--primary {
    color: #fff;
    background-color: #0d6efd;
    border-color: #0d6efd;

    @media (hover: hover) {
      &:hover:not(:disabled) {
        color: #0d6efd;
        background-color: #fff;
        border-color: #0d6efd;
      }
    }
  }

  &--secondary {
    color: #fff;
    background-color: #6c757d;
    border-color: #6c757d;

    @media (hover: hover) {
      &:hover:not(:disabled) {
        color: #6c757d;
        background-color: #fff;
        border-color: #6c757d;
      }
    }
  }

  &--cancelReservation {
    color: $color-cancel-reservation-fill-fg;
    background-color: $color-cancel-reservation-fill-bg;
    border-color: $color-cancel-reservation-fill-border;
    font-weight: 400;

    @media (hover: hover) {
      &:hover:not(:disabled) {
        color: $color-cancel-reservation-hover-fg;
        background-color: $color-cancel-reservation-hover-bg;
        border-color: $color-cancel-reservation-hover-border;
      }
    }
  }

  &--disabled {
    background-color: #e2e8f0;
    border-color: #e2e8f0;
    color: #94a3b8;
    opacity: 1;
    cursor: not-allowed;
  }
}
</style>
