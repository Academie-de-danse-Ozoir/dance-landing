<template>
  <button
    ref="buttonRef"
    :type="type"
    :disabled="disabled"
    :class="[
      'defaultButton',
      `defaultButton--${variant}`,
      { 'defaultButton--disabled': disabled }
    ]"
    @click="$emit('click', $event)"
    @pointerdown="onPointerDown"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  cancelAndAnimate,
  DEFAULT_BUTTON_TAP_MS,
  defaultButtonCancelReservationTapKeyframes,
  defaultButtonPrimaryTapKeyframes,
  defaultButtonSecondaryTapKeyframes
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

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonRef = ref<HTMLButtonElement | null>(null)

function useCoarseTapAnimation(): boolean {
  if (import.meta.server) return false
  return window.matchMedia('(hover: none)').matches
}

function onPointerDown(e: PointerEvent) {
  if (!useCoarseTapAnimation()) return
  if (e.pointerType === 'mouse' && e.button !== 0) return

  const el = buttonRef.value
  if (!el || el.disabled) return

  const keyframes =
    props.variant === 'secondary'
      ? defaultButtonSecondaryTapKeyframes()
      : props.variant === 'cancelReservation'
        ? defaultButtonCancelReservationTapKeyframes()
        : defaultButtonPrimaryTapKeyframes()
  cancelAndAnimate(el, keyframes, DEFAULT_BUTTON_TAP_MS)
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
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease,
    box-shadow 0.25s ease, opacity 0.25s ease;

  &--primary {
    color: #fff;
    background-color: #0d6efd;
    border-color: #0d6efd;

    @media (hover: hover) {
      &:hover:not(:disabled),
      &:active:not(:disabled) {
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
      &:hover:not(:disabled),
      &:active:not(:disabled) {
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
      &:hover:not(:disabled),
      &:active:not(:disabled) {
        color: $color-cancel-reservation-hover-fg;
        background-color: $color-cancel-reservation-hover-bg;
        border-color: $color-cancel-reservation-hover-border;
      }
    }

    &.defaultButton--tapPulse {
      animation: defaultButtonCancelReservationTap 0.28s ease;
    }
  }

  &--disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}
</style>
