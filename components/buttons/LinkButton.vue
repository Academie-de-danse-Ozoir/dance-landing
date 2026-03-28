<template>
  <NuxtLink
    :to="to"
    :class="[
      'linkButton',
      `linkButton--${variant}`,
      { 'linkButton--disabled': disabled }
    ]"
  >
    {{ label }}
  </NuxtLink>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  to: string
  label: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}>(), {
  variant: 'primary',
  disabled: false
})
</script>

<style lang="scss" scoped>
.linkButton {
  display: inline-block;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  color: white;
  transition: all 0.15s ease-in-out;

  &--primary {
    background-color: #0d6efd;
    border-color: #0d6efd;

    &:hover:not(.linkButton--disabled) {
      background-color: #0b5ed7;
      border-color: #0a58ca;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &--secondary {
    background-color: #6c757d;
    border-color: #6c757d;

    &:hover:not(.linkButton--disabled) {
      background-color: #5c636a;
      border-color: #565e64;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &--disabled {
    opacity: 0.65;
    cursor: not-allowed;
    pointer-events: none;
  }
}

@media (max-width: 575.98px) {
  .linkButton {
    width: 100%;
    padding: 14px 24px;
  }
}
</style>
