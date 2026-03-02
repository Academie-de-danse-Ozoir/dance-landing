<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'default-button',
      `default-button--${variant}`,
      { 'default-button--disabled': disabled }
    ]"
    @click="$emit('click', $event)"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  variant?: 'primary' | 'secondary'
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
</script>

<style lang="scss" scoped>
.default-button {
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
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &--primary {
    color: #fff;
    background-color: #0d6efd;
    border-color: #0d6efd;

    &:hover:not(:disabled) {
      color: #fff;
      background-color: #0b5ed7;
      border-color: #0a58ca;
    }
  }

  &--secondary {
    color: #fff;
    background-color: #6c757d;
    border-color: #6c757d;

    &:hover:not(:disabled) {
      color: #fff;
      background-color: #5c636a;
      border-color: #565e64;
    }
  }

  &--disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}
</style>
