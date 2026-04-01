<template>
  <section :id="SEAT_SELECTION_SECTION_ID" class="bookingBlock" aria-label="Réservation">
    <div
      v-if="!seatsReady"
      class="bookingBlock__loader"
      role="status"
      aria-live="polite"
    >
      <span class="bookingBlock__loaderSpinner" aria-hidden="true" />
      <span class="bookingBlock__visuallyHidden">{{ content.home.seats.map.mapLoading }}</span>
    </div>

    <Transition name="bookingBlockReveal" appear>
      <div v-if="seatsReady">
        <div ref="bookingInnerRef" class="bookingBlock__inner">
      <h1 class="bookingBlock__title">{{ content.home.title }}</h1>

      <Transition
        :css="false"
        appear
        @before-enter="onOrderBannerBeforeEnter"
        @enter="onOrderBannerEnter"
        @after-enter="onOrderBannerAfterEnter"
        @before-leave="onOrderBannerBeforeLeave"
        @leave="onOrderBannerLeave"
        @after-leave="onOrderBannerAfterLeave"
      >
        <div
          v-if="activeOrder && !showModal && !suppressPageOrderAlert"
          ref="orderBannerSlotRef"
          class="bookingBlock__orderBannerSlot"
        >
          <ActiveOrderAlert
            :active-order="activeOrder"
            :formatted-time="formattedTime"
            @resume-payment="resumePaymentOrOpenModal"
            @cancel="onCancelOrderBannerUser"
          />
        </div>
      </Transition>

      <div ref="seatMapSizerRef" class="bookingBlock__seatMapSizer">
        <SeatMap
          fill-height
          :seats="seats"
          :selected-seat-ids="selectedSeatIds"
          :active-order="activeOrder"
          :max-seats-per-order="MAX_SEATS_PER_ORDER"
          class="bookingBlock__seatMap"
          @seat-click="toggleSeat"
        />
      </div>

      <SelectionInfo :seat-count="displayedSeatCount" :max-seats="MAX_SEATS_PER_ORDER" />

      <Transition name="errorFade">
        <div
          v-if="selectionLimitMessage"
          key="selection-limit"
          class="bookingBlock__alert bookingBlock__alert--warning"
          role="status"
        >
          {{ selectionLimitMessage }}
        </div>
      </Transition>

      <div class="bookingBlock__actions">
        <DefaultButton
          variant="primary"
          :label="content.home.actions.reserve"
          :disabled="
            isSubmitting ||
              (blockNewReserve && !canReopenReservation) ||
              (!canReopenReservation && selectedSeatIds.length === 0)
          "
          @click="openModal"
        />
      </div>

      <Transition name="errorFade">
        <div v-if="error" key="booking-error" class="bookingBlock__alert bookingBlock__alert--danger">{{ error }}</div>
      </Transition>
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
          :show-reservation-timer="showModal && !!activeOrder"
          :formatted-reservation-time="formattedTime"
          @close="closeModal"
          @next="onFormNext"
          @back="formStep = 1"
          @submit="submitStep2"
          @field-blur="handleFieldBlur"
          @cancel-reservation="onCancelReservationFromModal"
        />
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Seat, SeatStatus, ActiveOrder, TicketDetail } from '../../types'
import {
  PENDING_SCROLL_TO_SEATS_KEY,
  SCROLL_TO_SEATS_AFTER_NAV_MS,
  SEAT_SELECTION_SECTION_ID,
  STORAGE_ORDER_KEY,
  CANCEL_REASON,
  EVENT_ID,
  MAX_SEATS_PER_ORDER
} from '../../constants'
import { layoutYerresTheaterSeats } from '../../utils/yerresSeatLayout'
import content from '../../locales/fr.json'
import ActiveOrderAlert from '../alerts/ActiveOrderAlert.vue'
import SeatMap from '../seats/SeatMap.vue'
import SelectionInfo from '../seats/SelectionInfo.vue'
import FormReservation from '../forms/FormReservation.vue'
import DefaultButton from '../buttons/DefaultButton.vue'
import { useScrollToBooking } from '../../composables/useScrollToBooking'
const { scrollToBookingSection } = useScrollToBooking()

const supabase = useSupabaseClient()
let realtimeChannel: any = null

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

const seats = ref<Seat[]>([])
/** Plan : loader jusqu’au premier chargement `/api/seats`, puis fade-in du SeatMap. */
const seatsReady = ref(false)
const selectedSeatIds = ref<string[]>([])
const selectionLimitMessage = ref<string | null>(null)
const error = ref<string | null>(null)
const activeOrder = ref<ActiveOrder | null>(null)

const bookingInnerRef = ref<HTMLElement | null>(null)
const seatMapSizerRef = ref<HTMLElement | null>(null)
const orderBannerSlotRef = ref<HTMLElement | null>(null)
/** Évite que le watch recalcule la hauteur du plan pendant l’anim JS bandeau ↔ seat map. */
const orderBannerAnimating = ref(false)

/** Opacité d’abord, puis hauteur (même durée / easing que le seat map). */
const ORDER_BANNER_OPACITY_MS = 200
const BOOKING_LAYOUT_MS = 420
const BOOKING_LAYOUT_EASE_CSS = 'cubic-bezier(0.33, 1, 0.68, 1)'

/** Hauteur logique du plan (px) — le DOM est mis à jour en synchrone via `setSeatMapSizerHeight` (pas de :style Vue) pour animer en même temps que le bandeau. */
const seatMapAreaHeightPx = ref(480)

function setSeatMapSizerHeight(px: number) {
  seatMapAreaHeightPx.value = px
  if (!import.meta.client) return
  seatMapSizerRef.value?.style.setProperty('height', `${px}px`)
}

function orderBannerReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function sleepMs(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** Hauteur + marge du slot bandeau : WAAPI (robuste aux re-renders Vue qui cassent les transitions CSS sur height). */
function animateOrderBannerLayout(
  node: HTMLElement,
  keyframes: Keyframe[],
  options: { duration: number; easing: string }
): Promise<void> {
  if (typeof node.animate !== 'function') {
    const last = keyframes[keyframes.length - 1] as Record<string, string>
    if (last.height != null) node.style.height = last.height
    if (last.marginBottom != null) node.style.marginBottom = last.marginBottom
    return sleepMs(options.duration)
  }
  node.style.transition = 'none'
  const anim = node.animate(keyframes, {
    duration: options.duration,
    easing: options.easing,
    fill: 'forwards'
  })
  return anim.finished.then(() => {
    anim.cancel()
    const last = keyframes[keyframes.length - 1] as Record<string, string>
    if (last.height != null) node.style.height = last.height
    if (last.marginBottom != null) node.style.marginBottom = last.marginBottom
  })
}

function doubleRaf() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

function clearOrderBannerSlotInlineStyles(el: HTMLElement) {
  el.style.removeProperty('transition')
  el.style.removeProperty('height')
  el.style.removeProperty('opacity')
  el.style.removeProperty('overflow')
  el.style.removeProperty('margin-bottom')
}

/**
 * Espace vertical pour le plan : clientHeight du bloc − padding − autres enfants − gap flex.
 * Ne pas utiliser next.top − prev.bottom : ça inclut la hauteur actuelle du plan → valeur figée.
 * `skipOrderBannerSlot` : cible comme si le bandeau n’occupait plus la colonne (anim de sortie).
 * Pendant `<Transition leave>`, `orderBannerSlotRef` est souvent déjà `null` : passer `bannerSlotElement` (= `el` du hook).
 */
function getSeatMapAreaHeightPx(options?: {
  skipOrderBannerSlot?: boolean
  bannerSlotElement?: HTMLElement | null
}): number | null {
  if (!import.meta.client) return null
  const inner = bookingInnerRef.value
  const wrap = seatMapSizerRef.value
  if (!inner || !wrap) return null

  const cs = getComputedStyle(inner)
  const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
  const innerH = inner.clientHeight
  const rowGap = parseFloat(cs.rowGap) || parseFloat(cs.gap) || 0

  const kids = [...inner.children] as HTMLElement[]
  const bannerSlotEl =
    options?.skipOrderBannerSlot === true
      ? (options.bannerSlotElement ?? orderBannerSlotRef.value)
      : null
  const skipBanner = Boolean(options?.skipOrderBannerSlot && bannerSlotEl)
  const flexItems = skipBanner ? kids.filter((k) => k !== bannerSlotEl) : kids

  let used = padY
  for (const child of flexItems) {
    if (child === wrap) continue
    const m = getComputedStyle(child)
    used +=
      child.offsetHeight + (parseFloat(m.marginTop) || 0) + (parseFloat(m.marginBottom) || 0)
  }
  if (flexItems.length > 1 && rowGap > 0) {
    used += rowGap * (flexItems.length - 1)
  }

  const wm = getComputedStyle(wrap)
  const wrapMy = (parseFloat(wm.marginTop) || 0) + (parseFloat(wm.marginBottom) || 0)

  const raw = innerH - used - wrapMy
  return Math.round(Math.max(240, raw))
}

function computeSeatMapAreaHeight(options?: {
  skipOrderBannerSlot?: boolean
  bannerSlotElement?: HTMLElement | null
}) {
  const px = getSeatMapAreaHeightPx(options)
  if (px != null) setSeatMapSizerHeight(px)
}

/** Recalcul sans transition CSS (évite un 2e mouvement après anim bandeau ↔ plan). */
function snapSeatMapHeightToLayout() {
  if (!import.meta.client) return
  const wrap = seatMapSizerRef.value
  if (!wrap) {
    computeSeatMapAreaHeight()
    return
  }
  wrap.style.setProperty('transition', 'none')
  computeSeatMapAreaHeight()
  void wrap.offsetHeight
  wrap.style.removeProperty('transition')
}

let seatMapLayoutRaf = 0
function scheduleSeatMapHeightMeasure() {
  if (!import.meta.client) return
  if (orderBannerAnimating.value) return
  cancelAnimationFrame(seatMapLayoutRaf)
  seatMapLayoutRaf = requestAnimationFrame(() => {
    seatMapLayoutRaf = requestAnimationFrame(() => {
      if (orderBannerAnimating.value) return
      computeSeatMapAreaHeight()
    })
  })
}

function onOrderBannerBeforeEnter() {
  orderBannerAnimating.value = true
}

function onOrderBannerBeforeLeave() {
  orderBannerAnimating.value = true
}

function onOrderBannerAfterEnter() {
  orderBannerAnimating.value = false
  snapSeatMapHeightToLayout()
}

function onOrderBannerAfterLeave() {
  orderBannerAnimating.value = false
  snapSeatMapHeightToLayout()
}

/** Entrée : d’abord hauteur bandeau (et marge) + seat map qui rétrécit, puis opacité. */
async function onOrderBannerEnter(el: Element, done: () => void) {
  const node = el as HTMLElement
  if (orderBannerReducedMotion()) {
    clearOrderBannerSlotInlineStyles(node)
    done()
    return
  }

  node.style.opacity = '0'
  node.style.height = 'auto'
  node.style.overflow = 'visible'
  node.style.removeProperty('margin-bottom')
  await nextTick()

  const naturalH = node.offsetHeight
  const mbFinal = parseFloat(getComputedStyle(node).marginBottom) || 0
  const seatTargetWithBanner = getSeatMapAreaHeightPx()

  node.style.height = '0px'
  node.style.marginBottom = '0px'
  node.style.overflow = 'hidden'
  await doubleRaf()

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      const target = seatTargetWithBanner
      if (target != null) {
        setSeatMapSizerHeight(target)
      }
      void node.offsetHeight
      animateOrderBannerLayout(
        node,
        [
          { height: '0px', marginBottom: '0px' },
          { height: `${naturalH}px`, marginBottom: mbFinal > 0 ? `${mbFinal}px` : '0px' }
        ],
        { duration: BOOKING_LAYOUT_MS, easing: BOOKING_LAYOUT_EASE_CSS }
      ).then(resolve)
    })
  })

  node.style.transition = ''
  node.style.height = 'auto'
  node.style.overflow = 'visible'
  node.style.removeProperty('margin-bottom')
  await nextTick()

  node.style.transition = `opacity ${ORDER_BANNER_OPACITY_MS}ms ease`
  node.style.opacity = '1'
  await sleepMs(ORDER_BANNER_OPACITY_MS)

  clearOrderBannerSlotInlineStyles(node)
  done()
}

/** Sortie : d’abord opacité, puis hauteur + marge du bandeau→0 et seat map qui s’agrandit (même timing). */
async function onOrderBannerLeave(el: Element, done: () => void) {
  const node = el as HTMLElement
  if (orderBannerReducedMotion()) {
    computeSeatMapAreaHeight({ skipOrderBannerSlot: true, bannerSlotElement: node })
    clearOrderBannerSlotInlineStyles(node)
    node.style.opacity = '0'
    done()
    return
  }

  node.style.transition = `opacity ${ORDER_BANNER_OPACITY_MS}ms ease`
  node.style.opacity = '0'
  await sleepMs(ORDER_BANNER_OPACITY_MS)

  const contentH = node.offsetHeight
  const mb = parseFloat(getComputedStyle(node).marginBottom) || 0
  node.style.overflow = 'hidden'
  node.style.height = `${contentH}px`
  node.style.marginBottom = `${mb}px`
  node.style.transition = ''

  await doubleRaf()

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      const expanded = getSeatMapAreaHeightPx({
        skipOrderBannerSlot: true,
        bannerSlotElement: node
      })
      if (expanded != null) {
        setSeatMapSizerHeight(expanded)
      }
      void node.offsetHeight
      animateOrderBannerLayout(
        node,
        [
          { height: `${contentH}px`, marginBottom: `${mb}px` },
          { height: '0px', marginBottom: '0px' }
        ],
        { duration: BOOKING_LAYOUT_MS, easing: BOOKING_LAYOUT_EASE_CSS }
      ).then(resolve)
    })
  })

  clearOrderBannerSlotInlineStyles(node)
  done()
}

const showModal = ref(false)
const formStep = ref<1 | 2>(1)
const isSubmitting = ref(false)
const suppressPageOrderAlert = ref(false)

watch(
  () =>
    [
      showModal.value,
      suppressPageOrderAlert.value,
      selectionLimitMessage.value,
      error.value,
      seats.value.length
    ] as const,
  () => {
    nextTick(() => {
      if (orderBannerAnimating.value) return
      scheduleSeatMapHeightMeasure()
    })
  }
)

watch(activeOrder, () => {
  nextTick(() => {
    if (orderBannerAnimating.value) return
    scheduleSeatMapHeightMeasure()
  })
})

const step2SeatItems = computed(() => {
  const ids = activeOrder.value?.seatIds ?? selectedSeatIds.value
  if (!ids?.length || !seats.value.length) return []

  return ids.map((id) => {
    const s = seats.value.find((se) => se.id === id)
    return { id, label: s?.label ?? id }
  })
})

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

const blockNewReserve = computed(() => {
  const o = activeOrder.value
  return !!o && o.contactComplete === true && o.ticketDetailsComplete === true
})

const canReopenReservation = computed(() => {
  const o = activeOrder.value
  return !!o && (o.contactComplete !== true || o.ticketDetailsComplete !== true)
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

async function loadSeats() {
  try {
    const data = await $fetch<SeatApiResponse[]>('/api/seats')
    seats.value = layoutYerresTheaterSeats(data)
  } finally {
    seatsReady.value = true
  }
}

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
        console.info('[billetterie:booking] Timer expiré → cancel-order (timer)')
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

async function restoreOrderFromStorage() {
  if (!import.meta.client) return

  const stored = localStorage.getItem(STORAGE_ORDER_KEY)
  if (!stored) return

  let orderId: string
  let storedData: ActiveOrder | null = null

  try {
    const parsed = JSON.parse(stored) as unknown

    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed !== null &&
      'orderId' in parsed &&
      typeof (parsed as ActiveOrder).orderId === 'string'
    ) {
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
        seatIds: storedData.seatIds,
        contactComplete: storedData.contactComplete === true,
        ticketDetailsComplete: storedData.ticketDetailsComplete === true
      }

      startTimerFromExpiresAt(res.expiresAt)
    } else {
      if (res.status === 'expired' && token) {
        console.info('[billetterie:booking] restoreOrderFromStorage → cancel-order (timer)', { orderId })
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

  if (!import.meta.client) return

  await restoreOrderFromStorage()

  await nextTick()
  window.addEventListener('resize', scheduleSeatMapHeightMeasure)
  scheduleSeatMapHeightMeasure()

  window.addEventListener('pageshow', onPageShow)

  if (sessionStorage.getItem(PENDING_SCROLL_TO_SEATS_KEY)) {
    sessionStorage.removeItem(PENDING_SCROLL_TO_SEATS_KEY)
    setTimeout(() => void scrollToBookingSection(), SCROLL_TO_SEATS_AFTER_NAV_MS)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('pageshow', onPageShow)
    window.removeEventListener('resize', scheduleSeatMapHeightMeasure)
    cancelAnimationFrame(seatMapLayoutRaf)
  }
  stopMainAnimationLoop()
  stopSeatsRealtime()
})

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

async function openModal() {
  if (canReopenReservation.value && activeOrder.value) {
    const o = activeOrder.value
    error.value = null
    if (o.contactComplete !== true) {
      formStep.value = 1
    } else if (o.ticketDetailsComplete !== true) {
      formStep.value = 2
    } else {
      formStep.value = 2
    }
    showModal.value = true
    return
  }

  if (selectedSeatIds.value.length === 0) return

  error.value = null
  const n = selectedSeatIds.value.length
  /* Nouveau hold : ne pas réutiliser nom / email / téléphone d’une réservation précédente. */
  form.value = { firstName: '', lastName: '', email: '', phone: '', adultCount: n, childCount: 0 }

  if (!activeOrder.value) {
    suppressPageOrderAlert.value = true
    isSubmitting.value = true
    try {
      const seatIds = [...selectedSeatIds.value]
      const res = await $fetch<HoldSeatsResponse>('/api/hold-seats', {
        method: 'POST',
        body: { quick: true, seatIds }
      })
      activeOrder.value = {
        orderId: res.orderId,
        orderToken: res.orderToken,
        expiresAt: res.expiresAt,
        seatCount: n,
        adultCount: n,
        childCount: 0,
        seatIds,
        contactComplete: false,
        ticketDetailsComplete: false
      }
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(activeOrder.value))
      startTimerFromExpiresAt(res.expiresAt)
      await loadSeats()
    } catch (err) {
      error.value = getErrorMessage(err)
      suppressPageOrderAlert.value = false
      return
    } finally {
      isSubmitting.value = false
    }
  }

  showModal.value = true
  suppressPageOrderAlert.value = false
}

function resumePaymentOrOpenModal() {
  const o = activeOrder.value
  if (!o) return
  error.value = null
  if (o.contactComplete !== true) {
    formStep.value = 1
  } else if (o.ticketDetailsComplete !== true) {
    formStep.value = 2
  } else {
    formStep.value = 2
  }
  showModal.value = true
}

async function onCancelReservationFromModal() {
  await cancelActiveOrder(CANCEL_REASON.USER)
}

function closeModal() {
  showModal.value = false
  suppressPageOrderAlert.value = false
  formStep.value = 1
  errors.value = {}
  touched.value = {}
}

const formFieldKeys = ['firstName', 'lastName', 'email', 'phone'] as const

function validateField(field: (typeof formFieldKeys)[number]) {
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

  validateField(key as (typeof formFieldKeys)[number])
}

function validateForm() {
  formFieldKeys.forEach((k) => validateField(k))
  return Object.keys(errors.value).length === 0
}

async function onFormNext() {
  if (!validateForm()) return

  const order = activeOrder.value
  if (!order) {
    error.value = content.home.errors.generic
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    await $fetch('/api/update-order-contact', {
      method: 'POST',
      body: {
        orderId: order.orderId,
        orderToken: order.orderToken,
        firstName: form.value.firstName.trim(),
        lastName: form.value.lastName.trim(),
        email: form.value.email.trim(),
        phone: form.value.phone.replace(/\D/g, '')
      }
    })

    activeOrder.value = {
      ...order,
      contactComplete: true,
      ticketDetailsComplete: false
    }
    localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(activeOrder.value))
    formStep.value = 2
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    isSubmitting.value = false
  }
}

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
  const order = activeOrder.value
  if (!order) {
    error.value = content.home.errors.generic
    return
  }
  if (order.contactComplete !== true) {
    error.value = content.home.errors.completeContactBeforePay
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const adultCount = payload.ticketDetails.filter((t) => t.ticketType === 'adult').length
    const childCount = payload.ticketDetails.filter((t) => t.ticketType === 'child').length

    await $fetch('/api/order-ticket-details', {
      method: 'POST',
      body: {
        orderId: order.orderId,
        orderToken: order.orderToken,
        tickets: payload.ticketDetails.map((t) => ({
          seatId: t.seatId,
          firstName: t.firstName.trim(),
          lastName: t.lastName.trim(),
          ticketType: t.ticketType
        }))
      }
    })

    activeOrder.value = {
      ...order,
      adultCount,
      childCount,
      contactComplete: true,
      ticketDetailsComplete: true
    }
    localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(activeOrder.value))

    try {
      await pay(payload.turnstileToken)
      closeModal()
      selectedSeatIds.value = []
    } catch {
      /* error affichée dans pay() */
    }
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    isSubmitting.value = false
  }
}

async function cancelActiveOrder(reason: (typeof CANCEL_REASON)[keyof typeof CANCEL_REASON] = CANCEL_REASON.USER) {
  if (!activeOrder.value) return

  console.info('[billetterie:booking] cancelActiveOrder', {
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

    showModal.value = false
    formStep.value = 1
    suppressPageOrderAlert.value = false

    localStorage.removeItem(STORAGE_ORDER_KEY)

    form.value = { firstName: '', lastName: '', email: '', phone: '', adultCount: 0, childCount: 0 }
    errors.value = {}
    touched.value = {}

    await loadSeats()
  } catch (err) {
    error.value = getErrorMessage(err)
  }
}

function onCancelOrderBannerUser() {
  void cancelActiveOrder(CANCEL_REASON.USER)
}

async function pay(turnstileToken?: string) {
  const order = activeOrder.value
  const orderId = order?.orderId

  if (!orderId || !order) return

  if (order.contactComplete !== true) {
    error.value = content.home.errors.completeContactBeforePay
    return
  }
  if (order.ticketDetailsComplete !== true) {
    error.value = content.home.errors.completeTicketDetailsBeforePay
    return
  }

  try {
    const seatCount = order.seatCount ?? 0
    const adultCount = order.adultCount ?? seatCount
    const childCount = order.childCount ?? 0

    console.info('[billetterie:booking] pay() → create-checkout-session', {
      orderId,
      adultCount,
      childCount
    })

    const res = await $fetch<{ url: string }>('/api/create-checkout-session', {
      method: 'POST',
      body: {
        orderId,
        orderToken: order.orderToken,
        adultCount,
        childCount,
        ...(turnstileToken ? { turnstileToken } : {})
      }
    })

    console.info('[billetterie:booking] Redirection Stripe Checkout', { hasUrl: !!res.url })
    window.location.href = res.url
  } catch (err) {
    error.value = getErrorMessage(err)
    throw err
  }
}
</script>

<style lang="scss" scoped>
.bookingBlock {
  margin: 0;
  padding: 10px 0 24px 0;
  min-height: 100vh;
  min-height: 100dvh;
  scroll-margin-top: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

.bookingBlock__inner {
  box-sizing: border-box;
  height: 935px;
  max-width: 100%;
  margin: 0 auto;
  background: white;
  padding: 20px 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.bookingBlock__title {
  margin: 0 0 30px 0;
  font-size: 32px;
  font-weight: 600;
  color: #212529;
  text-align: center;
}

.bookingBlock__actions {
  display: flex;
  justify-content: center;
}

/* Durée / easing partagés : hauteur du plan + transition du bandeau commande. */
$booking-layout-ease: cubic-bezier(0.33, 1, 0.68, 1);
$booking-layout-ms: 0.42s;

.bookingBlock__seatMapSizer {
  width: 100%;
  flex-shrink: 0;
  min-height: 220px;
  margin-bottom: 40px;
  transition: height $booking-layout-ms $booking-layout-ease;
}

.bookingBlock__loader {
  min-height: 935px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.bookingBlock__loaderSpinner {
  box-sizing: border-box;
  width: 44px;
  height: 44px;
  border: 3px solid #e9ecef;
  border-top-color: #0d6efd;
  border-radius: 50%;
  animation: bookingBlockSeatMapSpin 0.75s linear infinite;
}

@keyframes bookingBlockSeatMapSpin {
  to {
    transform: rotate(360deg);
  }
}

.bookingBlock__visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.bookingBlockReveal-enter-active {
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.bookingBlockReveal-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.bookingBlockReveal-enter-to {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .bookingBlock__seatMapSizer {
    transition: none;
  }

  .bookingBlock__loaderSpinner {
    animation: none;
    border-top-color: #dee2e6;
  }

  .bookingBlockReveal-enter-active {
    transition-duration: 0.01ms;
  }
}

.bookingBlock__orderBannerSlot {
  display: flow-root;
  flex-shrink: 0;
  margin: 0 0 16px 0;

  :deep(.activeOrderAlert) {
    margin-bottom: 0;
  }
}

.bookingBlock__seatMap {
  margin-bottom: 0;
}

.bookingBlock__alert {
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease, background-color 0.3s ease, color 0.3s ease;

  &.bookingBlock__alert--danger {
    color: #842029;
    background-color: #f8d7da;
    border-color: #f5c2c7;
  }

  &.bookingBlock__alert--warning {
    max-width: 26rem;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    color: #664d03;
    background-color: #fff3cd;
    border-color: #ffecb5;
  }
}

@media (max-width: 575.98px) {
  .bookingBlock__title {
    font-size: 24px;
  }
}
</style>
