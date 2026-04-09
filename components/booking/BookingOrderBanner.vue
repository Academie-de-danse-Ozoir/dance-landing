<template>
  <div
    v-if="seatsReady && orderBannerMounted"
    ref="orderBannerSlotRef"
    class="bookingOrderBanner"
    :class="{ 'bookingOrderBanner--visible': orderBannerFadeVisible }"
  >
    <ActiveOrderAlert
      v-if="orderBannerAlertOrder"
      :active-order="orderBannerAlertOrder"
      :formatted-time="bookingTimerDisplay"
      @resume-payment="bookingBannerResume"
      @cancel="bookingBannerCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onUnmounted } from 'vue'
import type { ActiveOrder } from '../../types'
import ActiveOrderAlert from '../alerts/ActiveOrderAlert.vue'
import { useBookingSession } from '../../composables/useBookingSession'
import { snapBookingSeatMapHeight } from '../../composables/useBookingSeatMapSnap'
import { bookingBannerResume, bookingBannerCancel } from '../../composables/useBookingBannerActions'

const route = useRoute()
const {
  activeOrder,
  showModal,
  suppressPageOrderAlert,
  seatsReady,
  orderBannerAnimating,
  bookingTimerDisplay
} = useBookingSession()

const ORDER_BANNER_FADE_MS = 200

const orderBannerMounted = ref(false)
const orderBannerFadeVisible = ref(false)
const orderBannerAlertOrder = ref<ActiveOrder | null>(null)
let orderBannerUnmountTimer: number | null = null

const orderBannerSlotRef = ref<HTMLElement | null>(null)

function orderBannerFadeDurationMs(): number {
  if (!import.meta.client) return ORDER_BANNER_FADE_MS
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ORDER_BANNER_FADE_MS
}

function orderBannerUnmountDelayMs(): number {
  const d = orderBannerFadeDurationMs()
  return Math.max(d, ORDER_BANNER_FADE_MS)
}

async function runOrderBannerFadeIn() {
  if (orderBannerUnmountTimer) {
    clearTimeout(orderBannerUnmountTimer)
    orderBannerUnmountTimer = null
  }
  orderBannerAnimating.value = true
  orderBannerFadeVisible.value = false
  orderBannerAlertOrder.value = activeOrder.value
  orderBannerMounted.value = true
  await nextTick()
  let node = orderBannerSlotRef.value
  if (!node) await nextTick()
  node = orderBannerSlotRef.value
  if (node) void node.offsetHeight

  orderBannerFadeVisible.value = true
  const d = orderBannerFadeDurationMs()
  window.setTimeout(() => {
    orderBannerAnimating.value = false
    snapBookingSeatMapHeight()
  }, d)
}

function runOrderBannerFadeOut() {
  if (!orderBannerMounted.value) return
  orderBannerAnimating.value = true
  orderBannerFadeVisible.value = false
  if (orderBannerUnmountTimer) {
    clearTimeout(orderBannerUnmountTimer)
    orderBannerUnmountTimer = null
  }

  const el = orderBannerSlotRef.value
  const delay = orderBannerUnmountDelayMs()
  let finished = false

  const finish = () => {
    if (finished) return
    finished = true
    if (orderBannerUnmountTimer !== null) {
      clearTimeout(orderBannerUnmountTimer)
      orderBannerUnmountTimer = null
    }
    el?.removeEventListener('transitionend', onTransitionEnd)
    orderBannerMounted.value = false
    orderBannerAlertOrder.value = null
    orderBannerAnimating.value = false
    snapBookingSeatMapHeight()
  }

  const onTransitionEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'opacity' || e.target !== el) return
    finish()
  }

  if (el) {
    el.addEventListener('transitionend', onTransitionEnd)
  }

  orderBannerUnmountTimer = window.setTimeout(finish, delay + 80)
}

const shouldShowOrderBanner = computed(
  () =>
    !!activeOrder.value &&
    route.path === '/' &&
    !showModal.value &&
    !suppressPageOrderAlert.value &&
    seatsReady.value
)

watch(
  shouldShowOrderBanner,
  async (want) => {
    if (want) {
      if (orderBannerMounted.value && orderBannerFadeVisible.value) return
      await runOrderBannerFadeIn()
    } else {
      runOrderBannerFadeOut()
    }
  },
  { flush: 'post', immediate: true }
)

onUnmounted(() => {
  if (orderBannerUnmountTimer) {
    clearTimeout(orderBannerUnmountTimer)
    orderBannerUnmountTimer = null
  }
})
</script>

<style lang="scss" scoped>
.bookingOrderBanner {
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flow-root;
  flex-shrink: 0;
  margin: 0 0 16px 0;
  pointer-events: auto;

  &--visible {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    transition-duration: 0.01ms;
  }

  :deep(.activeOrderAlert) {
    margin-bottom: 0;
  }

  @include media-up(lg) {
    position: fixed;
    top: max(16px, env(safe-area-inset-top));
    left: max(20px, env(safe-area-inset-left));
    right: auto;
    z-index: 110;
    width: fit-content;
    max-width: min(32rem, calc(100vw - 40px));
    margin: 0;
    box-sizing: border-box;
    pointer-events: auto;

    :deep(.activeOrderAlert) {
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
    }
  }

  @include media-down(lg) {
    position: fixed;
    top: max(10px, env(safe-area-inset-top));
    left: 12px;
    right: 12px;
    z-index: 110;
    width: auto;
    max-width: none;
    margin: 0;
    box-sizing: border-box;
    pointer-events: auto;

    :deep(.activeOrderAlert) {
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
    }
  }
}
</style>
