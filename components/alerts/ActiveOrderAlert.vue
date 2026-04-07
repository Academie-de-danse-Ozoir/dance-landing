<template>
  <div v-if="activeOrder" class="activeOrderAlert activeOrderAlert--warning">
    <strong class="activeOrderAlert__title">{{ content.home.activeOrder.title }}</strong><br />
    <span class="activeOrderAlert__time">{{ content.home.activeOrder.timeRemaining }} {{ formattedTime }}</span>

    <div class="activeOrderAlert__actions bookingOrderActions">
      <DefaultButton
        variant="primary"
        :label="content.home.activeOrder.resumePayment"
        @click="$emit('resume-payment')"
      />

      <DefaultButton
        variant="cancelReservation"
        :label="content.home.activeOrder.cancelReservation"
        @click="$emit('cancel')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import content from '../../locales/fr.json'
import DefaultButton from '../buttons/DefaultButton.vue'

import type { ActiveOrder } from '../../types'

defineProps<{
  activeOrder: ActiveOrder | null
  formattedTime: string
}>()

defineEmits<{
  'resume-payment': []
  'cancel': []
}>()
</script>

<style lang="scss" scoped>
.activeOrderAlert {
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;

  &--warning {
    color: #084298;
    background-color: #cfe2ff;
    border-color: #b6d4fe;
  }

  .activeOrderAlert__title {
    display: block;
  }

  .activeOrderAlert__time {
    display: block;
  }

  .activeOrderAlert__actions {
    margin-top: 12px;

    @include media-down(lg) {
      margin-top: 8px;
    }
  }

  @include media-down(lg) {
    padding: 10px 12px;
    font-size: 13px;
    line-height: 1.35;

    .activeOrderAlert__title {
      margin: 0 0 4px;
      font-size: inherit;
    }

    .activeOrderAlert__time {
      font-size: 12px;
      line-height: 1.3;
    }
  }
}
</style>
