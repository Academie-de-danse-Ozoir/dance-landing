<template>
  <div class="selection-info">
    <p :class="['selection-info_text', { 'selection-info_text--empty': seatCount === 0 }]">
      <template v-if="seatCount > 0">
        <strong class="text__count">{{ seatCount }}</strong> {{ seatCount > 1 ? content.home.selection.multiple : content.home.selection.one }}
      </template>
      <template v-else>{{ content.home.selection.none }}</template>
    </p>
    <p v-if="maxSeats > 0 && seatCount >= maxSeats" class="selection-info_limit">
      {{ atLimitText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import content from '../../locales/fr.json'

const props = defineProps<{
  seatCount: number
  /** Même valeur que `MAX_SEATS_PER_ORDER` côté serveur. */
  maxSeats?: number
}>()

const maxSeats = computed(() => props.maxSeats ?? 0)

const atLimitText = computed(() =>
  content.home.selection.limitReached.replace('{max}', String(maxSeats.value))
)
</script>

<style lang="scss" scoped>
.selection-info {
  margin-bottom: 24px;
  text-align: center;

  .selection-info_text {
    margin: 0;
    font-size: 16px;
    color: #212529;

    &--empty {
      color: #6c757d;
    }

    .text__count {
      color: #0d6efd;
      font-weight: 600;
    }
  }

  .selection-info_limit {
    max-width: 40rem;
    margin: 6px auto 0;
    font-size: 14px;
    font-weight: 600;
    color: #856404;
    text-align: center;
  }
}
</style>
