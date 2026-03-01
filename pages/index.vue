<template>
  <div class="page-container">
    <div class="page__wrapper">
      <h1 class="page__title">{{ content.home.title }}</h1>

      <ActiveOrderAlert
        :active-order="activeOrder"
        :formatted-time="formattedTime"
        @resume-payment="pay"
        @cancel="() => cancelActiveOrder(CANCEL_REASON.USER)"
      />

      <SeatMap
        :seats="seats"
        :selected-seat-ids="selectedSeatIds"
        :active-order="activeOrder"
        @seat-click="toggleSeat"
      />

      <SelectionInfo :seat-count="displayedSeatCount" />

      <div class="page__actions">
        <DefaultButton
          variant="primary"
          :label="content.home.actions.reserve"
          @click="openModal"
          :disabled="selectedSeatIds.length === 0"
        />
      </div>

      <div v-if="error" class="page__alert page__alert--danger">{{ error }}</div>
    </div>

    <FormReservation
      v-model:form="form"
      :show="showModal"
      :errors="errors"
      :touched="touched"
      :is-submitting="isSubmitting"
      @close="closeModal"
      @submit="submitReservation"
      @field-blur="handleFieldBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Seat, SeatStatus, ActiveOrder } from '../types'
import { STORAGE_ORDER_KEY, CANCEL_REASON } from '../constants'
import content from '../locales/fr.json'
import ActiveOrderAlert from '../components/alerts/ActiveOrderAlert.vue'
import SeatMap from '../components/seats/SeatMap.vue'
import SelectionInfo from '../components/seats/SelectionInfo.vue'
import FormReservation from '../components/forms/FormReservation.vue'
import DefaultButton from '../components/buttons/DefaultButton.vue'

/* =====================
   TYPES
===================== */
type OrderStatusResponse = {
  status: 'pending' | 'paid' | 'expired' | 'canceled' | 'refunded' | 'not_found'
  expiresAt?: string
  seatCount?: number
}

type HoldSeatsResponse = {
  orderId: string
  orderToken: string
  expiresAt: string
}

type SeatApiResponse = {
  id: string
  label: string
  status: SeatStatus
}

/* =====================
   CONSTANTS
===================== */
const SEAT_SPACING = 10
const SEAT_OFFSET = 20
const SEATS_PER_ROW = 38
const SEAT_REFRESH_INTERVAL = 500

/* =====================
   STATE
===================== */
const seats = ref<Seat[]>([])
const selectedSeatIds = ref<string[]>([])
const error = ref<string | null>(null)
const activeOrder = ref<ActiveOrder | null>(null)

const showModal = ref(false)
const isSubmitting = ref(false)

/* =====================
   FORM
===================== */
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

const errors = ref<Record<string, string>>({})
const touched = ref<Record<string, boolean>>({})

/* =====================
   TIMER (UX ONLY)
===================== */
const remainingSeconds = ref(0)
let timerExpiresAt: number | null = null
let timerHasExpired = false

const formattedTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = Math.floor(remainingSeconds.value % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
})

const displayedSeatCount = computed(() => {
  return activeOrder.value?.seatCount ?? selectedSeatIds.value.length
})


function startTimerFromExpiresAt(expiresAt: string) {
  timerExpiresAt = new Date(expiresAt).getTime()
  timerHasExpired = false
}

/* =====================
   LOAD SEATS (DB TRUTH)
===================== */
async function loadSeats() {
  const data = await $fetch<SeatApiResponse[]>('/api/seats')
  seats.value = data.map((seat, i) => ({
    ...seat,
    x: (i % SEATS_PER_ROW) * SEAT_SPACING + SEAT_OFFSET,
    y: Math.floor(i / SEATS_PER_ROW) * SEAT_SPACING + SEAT_OFFSET
  }))
}

/* =====================
   ANIMATION LOOP (UNIFIED)
===================== */
let mainAnimationFrame: number | undefined
let lastSeatRefresh: number = 0

function startMainAnimationLoop() {
  if (mainAnimationFrame) return
  
  lastSeatRefresh = Date.now()

  const update = async (timestamp: number) => {
    const now = Date.now()

    // 1. Mise à jour du timer à chaque frame (si actif)
    if (timerExpiresAt !== null && !timerHasExpired) {
      const diff = (timerExpiresAt - now) / 1000
      remainingSeconds.value = Math.max(0, diff)

      if (remainingSeconds.value <= 0) {
        timerHasExpired = true
        timerExpiresAt = null
        await cancelActiveOrder(CANCEL_REASON.TIMER)
      }
    }

    // 2. Rafraîchissement des sièges (non bloquant)
    if (now - lastSeatRefresh >= SEAT_REFRESH_INTERVAL) {
      lastSeatRefresh = now
      loadSeats()
    }

    mainAnimationFrame = requestAnimationFrame(update)
  }

  update(Date.now())
}

function stopMainAnimationLoop() {
  if (mainAnimationFrame) {
    cancelAnimationFrame(mainAnimationFrame)
    mainAnimationFrame = undefined
  }
}

onUnmounted(() => {
  stopMainAnimationLoop()
})

/* =====================
   INIT
===================== */
onMounted(async () => {
  await loadSeats()
  startMainAnimationLoop()

  if (!process.client) return

  const storedOrderId = localStorage.getItem(STORAGE_ORDER_KEY)
  if (!storedOrderId) return

  try {
    const res = await $fetch<OrderStatusResponse>('/api/order-status', {
      query: { orderId: storedOrderId }
    })

    if (res.status === 'pending' && res.expiresAt) {
      activeOrder.value = {
        orderId: storedOrderId,
        expiresAt: res.expiresAt,
        seatCount: res.seatCount
      }
      startTimerFromExpiresAt(res.expiresAt)
    } else {
      if (res.status === 'expired') {
        await $fetch('/api/cancel-order', {
          method: 'POST',
          body: { orderId: storedOrderId, reason: CANCEL_REASON.TIMER }
        })
        await loadSeats()
      }
      localStorage.removeItem(STORAGE_ORDER_KEY)
    }
  } catch {
    localStorage.removeItem(STORAGE_ORDER_KEY)
  }
})

/* =====================
   SEAT SELECTION
===================== */
function toggleSeat(id: string) {
  const seat = seats.value.find(s => s.id === id)
  if (!seat || seat.status !== 'free') return

  const ids = selectedSeatIds.value
  selectedSeatIds.value = ids.includes(id)
    ? ids.filter((s) => s !== id)
    : [...ids, id]
}

/* =====================
   MODAL
===================== */
function openModal() {
  if (selectedSeatIds.value.length === 0) return
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  errors.value = {}
  touched.value = {}
}

/* =====================
   VALIDATION
===================== */
function validateField(field: keyof typeof form.value) {
  touched.value[field] = true
  const v = form.value[field].trim()

  if (!v) {
    errors.value[field] = content.home.modal.validation.required
    return
  }

  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    errors.value.email = content.home.modal.validation.emailInvalid
    return
  }

  if (field === 'phone') {
    const n = v.replace(/\D/g, '')
    if (!/^(\+33|0)[1-9]\d{8}$/.test(n)) {
      errors.value.phone = content.home.modal.validation.phoneInvalid
      return
    }
  }

  delete errors.value[field]
}

function handleFieldBlur(key: string) {
  validateField(key as keyof typeof form.value)
}

function validateForm() {
  Object.keys(form.value).forEach(k =>
    validateField(k as keyof typeof form.value)
  )
  return Object.keys(errors.value).length === 0
}

/* =====================
   HOLD SEATS
===================== */
async function submitReservation() {
  if (!validateForm()) return

  isSubmitting.value = true
  error.value = null

  try {
    const res = await $fetch<HoldSeatsResponse>('/api/hold-seats', {
      method: 'POST',
      body: {
        seatIds: selectedSeatIds.value,
        ...form.value,
        phone: form.value.phone.replace(/\D/g, '')
      }
    })

    activeOrder.value = {
      orderId: res.orderId,
      expiresAt: res.expiresAt,
      seatCount: selectedSeatIds.value.length
    }
    localStorage.setItem(STORAGE_ORDER_KEY, res.orderId)

    selectedSeatIds.value = []
    startTimerFromExpiresAt(res.expiresAt)
    await pay()
  } finally {
    isSubmitting.value = false
  }
}

/* =====================
   CANCEL
===================== */
async function cancelActiveOrder(reason: 'timer' | 'cancel' = CANCEL_REASON.USER) {
  if (!activeOrder.value) return

  await $fetch('/api/cancel-order', {
    method: 'POST',
    body: { orderId: activeOrder.value.orderId, reason }
  })

  activeOrder.value = null
  remainingSeconds.value = 0
  timerExpiresAt = null
  timerHasExpired = false
  localStorage.removeItem(STORAGE_ORDER_KEY)
  await loadSeats()
}

/* =====================
   STRIPE
===================== */
async function pay() {
  const orderId = activeOrder.value?.orderId
  if (!orderId) return

  const res = await $fetch<{ url: string }>('/api/create-checkout-session', {
    method: 'POST',
    body: { orderId }
  })

  window.location.href = res.url
}
</script>


<style lang="scss" scoped>
.page {
  &-container {
    height: 100dvh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      sans-serif;
  }

  &__wrapper {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  &__title {
    margin: 0 0 32px 0;
    font-size: 32px;
    font-weight: 600;
    color: #212529;
    text-align: center;
  }

  &__actions {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

  &__alert {
    padding: 12px 16px;
    margin-bottom: 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 14px;

    &--danger {
      color: #842029;
      background-color: #f8d7da;
      border-color: #f5c2c7;
    }
  }
}
</style>
