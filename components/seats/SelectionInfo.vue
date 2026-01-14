<template>
  <div class="selection-info">
    <p :class="['selection-info__text', { 'selection-info__text--empty': seatCount === 0 }]">
      <template v-if="seatCount > 0">
        <strong class="selection-info__count">{{ seatCount }}</strong> {{ seatCount > 1 ? content.home.selection.multiple : content.home.selection.one }}
      </template>
      <template v-else>{{ content.home.selection.none }}</template>
    </p>
  </div>
</template>

<script setup lang="ts">
import content from '../../locales/fr.json'

defineProps<{
  seatCount: number
}>()
</script>

<style lang="scss" scoped>
.selection-info {
  margin-bottom: 24px;
  text-align: center;

  &__text {
    margin: 0;
    font-size: 16px;
    color: #212529;

    &--empty {
      color: #6c757d;
    }
  }

  &__count {
    color: #0d6efd;
    font-weight: 600;
  }
}
</style>

