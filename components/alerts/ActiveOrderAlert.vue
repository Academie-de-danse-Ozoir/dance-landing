<template>
  <div v-if="activeOrder" class="alert alert--warning">
    <strong class="alert_title">{{ content.home.activeOrder.title }}</strong><br />
    <span class="alert_time">{{ content.home.activeOrder.timeRemaining }} {{ formattedTime }}</span>

    <div class="alert_actions">
      <DefaultButton
        variant="primary"
        :label="content.home.activeOrder.resumePayment"
        @click="$emit('resume-payment')"
      />

      <DefaultButton
        variant="secondary"
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
.alert {
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

  .alert_title {
    display: block;
  }

  .alert_time {
    display: block;
  }

  .alert_actions {
    margin-top: 12px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}
</style>
