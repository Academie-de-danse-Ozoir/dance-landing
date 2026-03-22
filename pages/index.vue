<template>
  <div class="page_container">
    <div class="page_wrapper">
      <h1 class="wrapper__title">{{ content.home.title }}</h1>

      <ActiveOrderAlert
        v-if="activeOrder && !showModal"
        :active-order="activeOrder"
        :formatted-time="formattedTime"
        @resume-payment="pay"
        @cancel="() => cancelActiveOrder(CANCEL_REASON.USER)"
      />

      <SeatMap
        :seats="seats"
        :selected-seat-ids="selectedSeatIds"
        :active-order="activeOrder"
        :max-seats-per-order="MAX_SEATS_PER_ORDER"
        @seat-click="toggleSeat"
        class="wrapper__seat-map"  
      />

      <SelectionInfo :seat-count="displayedSeatCount" :max-seats="MAX_SEATS_PER_ORDER" />

      <div
        v-if="selectionLimitMessage"
        class="wrapper__alert wrapper__alert--warning"
        role="status"
      >
        {{ selectionLimitMessage }}
      </div>

      <div class="wrapper__actions">
        <DefaultButton
          variant="primary"
          :label="content.home.actions.reserve"
          @click="openModal"
          :disabled="selectedSeatIds.length === 0"
        />
      </div>

      <div v-if="error" class="wrapper__alert wrapper__alert--danger">{{ error }}</div>
    </div>

    <FormReservation
      v-model:form="form"
      :show="showModal"
      :seat-count="formStep === 1 ? selectedSeatIds.length : (activeOrder?.seatCount ?? selectedSeatIds.length)"
      :step="formStep"
      :seat-items="step2SeatItems"
      :errors="errors"
      :touched="touched"
      :is-submitting="isSubmitting"
      @close="closeModal"
      @next="onFormNext"
      @back="formStep = 1"
      @submit="submitStep2"
      @field-blur="handleFieldBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Seat, SeatStatus, ActiveOrder, TicketDetail } from '../types'
import { STORAGE_ORDER_KEY, CANCEL_REASON, EVENT_ID, MAX_SEATS_PER_ORDER } from '../constants'
import { layoutYerresTheaterSeats } from '../utils/yerresSeatLayout'
import content from '../locales/fr.json'
import ActiveOrderAlert from '../components/alerts/ActiveOrderAlert.vue'
import SeatMap from '../components/seats/SeatMap.vue'
import SelectionInfo from '../components/seats/SelectionInfo.vue'
import FormReservation from '../components/forms/FormReservation.vue'
import DefaultButton from '../components/buttons/DefaultButton.vue'

/* =====================
   SUPABASE
===================== */

const supabase = useSupabaseClient()
let realtimeChannel: any = null

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

/* =====================
   STATE
===================== */

const seats = ref<Seat[]>([])
const selectedSeatIds = ref<string[]>([])
const selectionLimitMessage = ref<string | null>(null)
const error = ref<string | null>(null)
const activeOrder = ref<ActiveOrder | null>(null)

const showModal = ref(false)
const formStep = ref<1 | 2>(1)
const isSubmitting = ref(false)

const step2SeatItems = computed(() => {
  const ids = activeOrder.value?.seatIds ?? selectedSeatIds.value
  if (!ids?.length || !seats.value.length) return []

  return ids.map((id) => {
    const s = seats.value.find((se) => se.id === id)
    return { id, label: s?.label ?? id }
  })
})

/* =====================
   FORM
===================== */

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  adultCount: 0,
  childCount: 0
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

function getErrorMessage(err: unknown): string {
  const e = err as { data?: { statusMessage?: string; message?: string } }
  return e?.data?.statusMessage ?? e?.data?.message ?? content.home.errors.generic
}

const displayedSeatCount = computed(() => {
  return activeOrder.value?.seatCount ?? selectedSeatIds.value.length
})

function startTimerFromExpiresAt(expiresAt: string) {
  const t = new Date(expiresAt).getTime()
  timerHasExpired = false
  if (Number.isNaN(t)) {
    console.error('[timer] expiresAt invalide:', expiresAt)
    timerExpiresAt = null
    remainingSeconds.value = 0
    return
  }
  timerExpiresAt = t
  remainingSeconds.value = Math.max(0, (t - Date.now()) / 1000)
}

/* =====================
   LOAD SEATS (INITIAL DB LOAD)
===================== */

async function loadSeats() {
  const data = await $fetch<SeatApiResponse[]>('/api/seats')

  seats.value = layoutYerresTheaterSeats(data)
}

/* =====================
   REALTIME SEATS
===================== */

function startSeatsRealtime() {
  const opts: { event: string; schema: string; table: string; filter?: string } = {
    event: '*',
    schema: 'public',
    table: 'seat_reservation',
    filter: `event_id=eq.${EVENT_ID}`
  }
  realtimeChannel = supabase
    .channel('seat_reservation-realtime')
    .on(
      'postgres_changes',
      opts,
      (payload) => {
        if (import.meta.dev) {
          console.log('[Realtime] seat_reservation changé → loadSeats()', payload.eventType, payload)
        }
        loadSeats()
      }
    )
    .subscribe((status, err) => {
      if (import.meta.dev) {
        console.log('[Realtime] seat_reservation status:', status, err ?? '')
      }
      if (status === 'CHANNEL_ERROR' && err) {
        console.error('[Realtime] seat_reservation error:', err)
      }
    })
}

function stopSeatsRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}

/* =====================
   TIMER LOOP
===================== */

let mainAnimationFrame: number | undefined

function startMainAnimationLoop() {
  if (mainAnimationFrame) return

  const update = async () => {
    const now = Date.now()

    if (timerExpiresAt !== null && !timerHasExpired) {
      const diff = (timerExpiresAt - now) / 1000
      remainingSeconds.value = Math.max(0, diff)

      if (remainingSeconds.value <= 0) {
        timerHasExpired = true
        timerExpiresAt = null
        console.info('[billetterie:index] Timer expiré → cancel-order (timer)')
        await cancelActiveOrder(CANCEL_REASON.TIMER)
      }
    }

    mainAnimationFrame = requestAnimationFrame(update)
  }

  update()
}

function stopMainAnimationLoop() {
  if (mainAnimationFrame) {
    cancelAnimationFrame(mainAnimationFrame)
    mainAnimationFrame = undefined
  }
}

/* =====================
   INIT — restauration commande / timer (localStorage)
===================== */

async function restoreOrderFromStorage() {
  if (!process.client) return

  const stored = localStorage.getItem(STORAGE_ORDER_KEY)
  if (!stored) return

  let orderId: string
  let storedData: ActiveOrder | null = null

  try {
    const parsed = JSON.parse(stored) as unknown

    if (parsed && typeof parsed === 'object' && parsed !== null && 'orderId' in parsed && typeof (parsed as ActiveOrder).orderId === 'string') {
      orderId = (parsed as ActiveOrder).orderId
      storedData = parsed as ActiveOrder
    } else {
      return
    }
  } catch {
    return
  }

  if (!storedData?.orderToken) {
    return
  }

  try {
    const res = await $fetch<OrderStatusResponse>('/api/order-status', {
      query: { orderId }
    })

    const token = storedData.orderToken

    if (res.status === 'pending' && res.expiresAt && token) {
      activeOrder.value = {
        orderId,
        orderToken: token,
        expiresAt: res.expiresAt,
        seatCount: res.seatCount,
        adultCount: storedData.adultCount ?? res.seatCount,
        childCount: storedData.childCount ?? 0,
        seatIds: storedData.seatIds
      }

      startTimerFromExpiresAt(res.expiresAt)
    } else {
      if (res.status === 'expired' && token) {
        console.info('[billetterie:index] restoreOrderFromStorage → cancel-order (timer)', { orderId })
        await $fetch('/api/cancel-order', {
          method: 'POST',
          body: { orderId, orderToken: token, reason: CANCEL_REASON.TIMER }
        })
        await loadSeats()
      }
      localStorage.removeItem(STORAGE_ORDER_KEY)
    }
  } catch {
    localStorage.removeItem(STORAGE_ORDER_KEY)
  }
}

function onPageShow(ev: PageTransitionEvent) {
  if (ev.persisted) {
    void restoreOrderFromStorage()
  }
}

onMounted(async () => {
  try {
    await loadSeats()
    startSeatsRealtime()
  } catch (err) {
    error.value = getErrorMessage(err)
  }

  startMainAnimationLoop()

  if (!process.client) return

  await restoreOrderFromStorage()

  window.addEventListener('pageshow', onPageShow)
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('pageshow', onPageShow)
  }
  stopMainAnimationLoop()
  stopSeatsRealtime()
})

/* =====================
   SEAT SELECTION
===================== */

function toggleSeat(id: string) {
  const seat = seats.value.find((s) => s.id === id)
  if (!seat || seat.status !== 'free') return

  const ids = selectedSeatIds.value

  if (ids.includes(id)) {
    selectedSeatIds.value = ids.filter((s) => s !== id)
    selectionLimitMessage.value = null
    return
  }

  if (ids.length >= MAX_SEATS_PER_ORDER) {
    selectionLimitMessage.value = content.home.selection.limitReached.replace(
      '{max}',
      String(MAX_SEATS_PER_ORDER)
    )
    return
  }

  selectionLimitMessage.value = null
  selectedSeatIds.value = [...ids, id]
}

/* =====================
   MODAL
===================== */

function openModal() {
  if (selectedSeatIds.value.length === 0) return

  error.value = null
  const n = selectedSeatIds.value.length

  form.value = { ...form.value, adultCount: n, childCount: 0 }

  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formStep.value = 1
  errors.value = {}
  touched.value = {}
}

/* =====================
   VALIDATION
===================== */

const formFieldKeys = ['firstName', 'lastName', 'email', 'phone'] as const

function validateField(field: typeof formFieldKeys[number]) {
  touched.value[field] = true

  const v = String(form.value[field]).trim()

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
  if (key === 'adultCount' || key === 'childCount') {
    touched.value[key] = true
    return
  }

  validateField(key as typeof formFieldKeys[number])
}

function validateForm() {
  formFieldKeys.forEach((k) => validateField(k))
  return Object.keys(errors.value).length === 0
}

/* =====================
   STEP 1
===================== */

function onFormNext() {
  if (!validateForm()) return
  formStep.value = 2
}

/* =====================
   STEP 2
===================== */

async function submitStep2(payload: {
  form: {
    firstName: string
    lastName: string
    email: string
    phone: string
    adultCount: number
    childCount: number
  }
  ticketDetails: TicketDetail[]
  turnstileToken?: string
}) {
  isSubmitting.value = true
  error.value = null

  try {
    const seatIds = [...selectedSeatIds.value]

    const res = await $fetch<HoldSeatsResponse>('/api/hold-seats', {
      method: 'POST',
      body: {
        seatIds,
        firstName: payload.form.firstName,
        lastName: payload.form.lastName,
        email: payload.form.email,
        phone: payload.form.phone.replace(/\D/g, ''),
        ...(payload.turnstileToken ? { turnstileToken: payload.turnstileToken } : {})
      }
    })

    const adultCount = payload.ticketDetails.filter(
      (t) => t.ticketType === 'adult'
    ).length

    const childCount = payload.ticketDetails.filter(
      (t) => t.ticketType === 'child'
    ).length

    activeOrder.value = {
      orderId: res.orderId,
      orderToken: res.orderToken,
      expiresAt: res.expiresAt,
      seatCount: seatIds.length,
      adultCount,
      childCount,
      seatIds
    }

    localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(activeOrder.value))

    closeModal()
    startTimerFromExpiresAt(res.expiresAt)

    await $fetch('/api/order-ticket-details', {
      method: 'POST',
      body: {
        orderId: res.orderId,
        orderToken: res.orderToken,
        tickets: payload.ticketDetails.map((t) => ({
          seatId: t.seatId,
          firstName: t.firstName.trim(),
          lastName: t.lastName.trim(),
          ticketType: t.ticketType
        }))
      }
    })

    selectedSeatIds.value = []

    await pay()
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    isSubmitting.value = false
  }
}

/* =====================
   CANCEL
===================== */

async function cancelActiveOrder(
  reason: 'timer' | 'cancel' = CANCEL_REASON.USER
) {
  if (!activeOrder.value) return

  console.info('[billetterie:index] cancelActiveOrder', {
    reason,
    orderId: activeOrder.value.orderId
  })

  try {
    await $fetch('/api/cancel-order', {
      method: 'POST',
      body: {
        orderId: activeOrder.value.orderId,
        orderToken: activeOrder.value.orderToken,
        reason
      }
    })

    activeOrder.value = null
    remainingSeconds.value = 0
    timerExpiresAt = null
    timerHasExpired = false

    localStorage.removeItem(STORAGE_ORDER_KEY)

    await loadSeats()
  } catch (err) {
    error.value = getErrorMessage(err)
  }
}

/* =====================
   STRIPE
===================== */

async function pay() {
  const order = activeOrder.value
  const orderId = order?.orderId

  if (!orderId || !order) return

  try {
    const seatCount = order.seatCount ?? 0
    const adultCount = order.adultCount ?? seatCount
    const childCount = order.childCount ?? 0

    console.info('[billetterie:index] pay() → create-checkout-session', {
      orderId,
      adultCount,
      childCount
    })

    const res = await $fetch<{ url: string }>('/api/create-checkout-session', {
      method: 'POST',
      body: { orderId, orderToken: order.orderToken, adultCount, childCount }
    })

    console.info('[billetterie:index] Redirection Stripe Checkout', { hasUrl: !!res.url })
    window.location.href = res.url
  } catch (err) {
    error.value = getErrorMessage(err)
  }
}
</script>


<style lang="scss" scoped>
.page_container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  // padding: 20px 20px;
  margin: 10px 0px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;

  .page_wrapper {
    height: calc(100dvh - 40px);
    margin: 0 auto;
    background: white;
    padding: 20px 20px;
    // border-radius: 16px;
    // box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    justify-content: center;

    .wrapper__title {
      margin: 0 0 20px 0;
      font-size: 32px;
      font-weight: 600;
      color: #212529;
      text-align: center;
    }

    .wrapper__actions {
      display: flex;
      justify-content: center;
    }

    .wrapper__seat-map {
      margin-bottom: 40px;
    }

    .wrapper__alert {
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

      &--warning {
        max-width: 26rem;
        margin-left: auto;
        margin-right: auto;
        text-align: center;
        color: #664d03;
        background-color: #fff3cd;
        border-color: #ffecb5;
      }
    }
  }
}
</style>
