<template>
  <section
    ref="bookingSectionRef"
    :id="SEAT_SELECTION_SECTION_ID"
    class="bookingBlock"
    :class="{ 'bookingBlock--adminOnly': props.isAdminFreeBooking }"
    aria-label="Réservation"
  >
    <button
      type="button"
      class="bookingBlock__edgeCue bookingBlock__edgeCue--top"
      :class="{ 'bookingBlock__edgeCue--visible': edgeCueVisible }"
      aria-label="Remonter à la section précédente"
      @click="scrollToMapPricingSection"
    >
      <span class="edgeCue__arrow edgeCue__arrow--up" aria-hidden="true">↑</span>
      <span class="edgeCue__text">{{ topEdgeCueText }}</span>
    </button>
    <button
      type="button"
      class="bookingBlock__edgeCue bookingBlock__edgeCue--bottom"
      :class="{ 'bookingBlock__edgeCue--visible': edgeCueVisible }"
      aria-label="Descendre à la section suivante"
      @click="scrollToAdjacentSection('next')"
    >
      <span class="edgeCue__text">{{ bottomEdgeCueText }}</span>
      <span class="edgeCue__arrow edgeCue__arrow--down" aria-hidden="true">↓</span>
    </button>

    <AppBrandLogoMark
      v-if="props.isAdminFreeBooking"
      floating
      to="/"
      variant="light"
      :aria-label="content.backoffice.logoHomeAria"
    />

    <div v-if="!seatsReady" class="bookingBlock__loader" role="status" aria-live="polite">
      <span class="bookingBlock__loaderSpinner" aria-hidden="true" />
      <span class="bookingBlock__visuallyHidden">{{ content.home.seats.map.mapLoading }}</span>
    </div>

    <Transition name="bookingBlockReveal" appear>
      <div v-if="seatsReady" class="bookingBlock__reveal">
        <div ref="bookingInnerRef" class="bookingBlock__inner">
          <h1 class="bookingBlock__title">{{ content.home.title }}</h1>

          <div
            ref="seatMapSizerRef"
            class="bookingBlock__seatMapSizer"
            @pointerdown.capture="focusEdgeCues"
            @focusin="focusEdgeCues"
          >
            <SeatMap
              fill-height
              :seats="seats"
              :selected-seat-ids="selectedSeatIds"
              :active-order="activeOrder"
              :booking-closed="publicBookingClosed"
              :force-active-order-lock="
                isAdminFreeBooking
                  ? isCreatingHold || keepModalChromeDuringLeave
                  : showModal || isCreatingHold || keepModalChromeDuringLeave
              "
              :max-seats-per-order="MAX_SEATS_PER_ORDER"
              class="bookingBlock__seatMap"
              @seat-click="toggleSeat"
              @booking-section-scroll-if-needed="onSeatMapBookingScrollIfNeeded"
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
                publicBookingClosed ||
                (blockNewReserve && !canReopenReservation) ||
                (!canReopenReservation && selectedSeatIds.length === 0)
              "
              @click="openModal"
            />
          </div>

          <Transition name="errorFade">
            <div
              v-if="error"
              key="booking-error"
              class="bookingBlock__alert bookingBlock__alert--danger"
            >
              {{ error }}
            </div>
          </Transition>
        </div>

        <FormReservation
          v-model:form="form"
          :show="showModal"
          :seat-count="
            formStep === 1
              ? selectedSeatIds.length
              : (activeOrder?.seatCount ?? selectedSeatIds.length)
          "
          :step="formStep"
          :seat-items="step2SeatItems"
          :errors="errors"
          :touched="touched"
          :is-submitting="isSubmitting"
          :is-saving-contact="isSavingContact"
          :is-creating-hold="isCreatingHold"
          :show-reservation-timer="
            !isAdminFreeBooking && !!activeOrder && (showModal || keepModalChromeDuringLeave)
          "
          :formatted-reservation-time="formattedTime"
          :is-admin-free-mode="props.isAdminFreeBooking"
          :final-submit-label="
            props.isAdminFreeBooking ? content.backoffice.confirmFreeOrder : undefined
          "
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
  SEAT_SELECTION_SECTION_ID,
  STORAGE_ORDER_KEY,
  CANCEL_REASON,
  EVENT_ID,
  MAX_SEATS_PER_ORDER,
  NARROW_VIEWPORT_MQ
} from '../../constants'
import { layoutYerresTheaterSeats } from '../../utils/yerresSeatLayout'
import content from '../../locales/fr.json'
import ActiveOrderAlert from '../alerts/ActiveOrderAlert.vue'
import AppBrandLogoMark from '../AppBrandLogoMark.vue'
import SeatMap from '../seats/SeatMap.vue'
import SelectionInfo from '../seats/SelectionInfo.vue'
import FormReservation from '../forms/FormReservation.vue'
import DefaultButton from '../buttons/DefaultButton.vue'
import {
  clearBookingSectionLayoutCache,
  measureBookingSectionLayout,
  useScrollToBooking
} from '../../composables/useScrollToBooking'
import { useLenis } from '../../composables/useLenis'
import { useBookingSession } from '../../composables/useBookingSession'
import { registerBookingSeatMapSnap } from '../../composables/useBookingSeatMapSnap'
import { registerBookingBannerActions } from '../../composables/useBookingBannerActions'

const props = withDefaults(
  defineProps<{
    /** Billeterie orga : confirmation sans Stripe, envoi des billets comme un achat. */
    isAdminFreeBooking?: boolean
  }>(),
  { isAdminFreeBooking: false }
)

const { scrollToBookingSection, scrollToBookingSectionIfMisaligned } = useScrollToBooking()
const lenis = useLenis()
const bookingSectionRef = ref<HTMLElement | null>(null)

const {
  activeOrder,
  seatsReady,
  showModal,
  suppressPageOrderAlert,
  orderBannerAnimating,
  bookingTimerDisplay
} = useBookingSession()

let unregisterBookingSnap: (() => void) | undefined
let unregisterBookingBanner: (() => void) | undefined

function onSeatMapBookingScrollIfNeeded() {
  void scrollToBookingSectionIfMisaligned()
}

function scrollToAdjacentSection(direction: 'prev' | 'next') {
  if (!import.meta.client) return
  const current = bookingSectionRef.value
  if (!current) return

  const sectionCandidates = Array.from(document.querySelectorAll('section[id]')) as HTMLElement[]
  const sections = sectionCandidates.filter((el, idx) => sectionCandidates.indexOf(el) === idx)
  const currentIndex = sections.findIndex((el) => el === current)
  if (currentIndex < 0) return

  const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
  const target = sections[targetIndex]
  if (!target) return

  const l = lenis.value as {
    scrollTo?: (t: HTMLElement, opts?: { duration?: number }) => void
  } | null
  if (l?.scrollTo) {
    l.scrollTo(target, { duration: 1.05 })
    return
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToMapPricingSection() {
  if (!import.meta.client) return
  const target = document.querySelector('.mapPricingSection') as HTMLElement | null
  if (!target) {
    scrollToAdjacentSection('prev')
    return
  }
  const l = lenis.value as {
    scrollTo?: (t: HTMLElement, opts?: { duration?: number }) => void
  } | null
  if (l?.scrollTo) {
    l.scrollTo(target, { duration: 1.05 })
    return
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const supabase = useSupabaseClient()
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null
/** Évite les courses reload/HMR : `removeChannel` est async ; un 2e souscription au même topic peut provoquer « mismatch between server and client bindings ». */
let realtimeRetryTimer: ReturnType<typeof setTimeout> | null = null
let realtimeResubscribeAttempts = 0
const REALTIME_MAX_RESUBSCRIBE_ATTEMPTS = 5

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

type SeatsApiPayload = {
  seats: SeatApiResponse[]
  event: {
    startsAt: string | null
    bookingClosed: boolean
  }
}

const seats = ref<Seat[]>([])
const bookingClosed = ref(false)
const selectedSeatIds = ref<string[]>([])
const selectionLimitMessage = ref<string | null>(null)
const error = ref<string | null>(null)

const bookingInnerRef = ref<HTMLElement | null>(null)
const seatMapSizerRef = ref<HTMLElement | null>(null)
const isMapFocused = ref(false)
const isBookingInView = ref(false)
const edgeCueVisible = computed(
  () => isMapFocused.value && isBookingInView.value && !showModal.value
)
const topEdgeCueText = computed(() =>
  String(content.home.mapAndPricing.title || '')
    .replace(/\n+/g, ' ')
    .trim()
)
const bottomEdgeCueText = computed(() => String(content.home.location.title || '').trim())
let bookingDocTop = 0
let bookingDocBottom = 0

/** Hauteur logique du plan (px) — le DOM est mis à jour en synchrone via `setSeatMapSizerHeight` (pas de :style Vue) pour animer en même temps que le bandeau. */
const seatMapAreaHeightPx = ref(480)

function setSeatMapSizerHeight(px: number) {
  seatMapAreaHeightPx.value = px
  if (!import.meta.client) return
  seatMapSizerRef.value?.style.setProperty('height', `${px}px`)
}

function measureBookingBounds() {
  if (!import.meta.client) return
  const el = bookingSectionRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const scrollY = window.scrollY
  bookingDocTop = rect.top + scrollY
  bookingDocBottom = rect.bottom + scrollY
}

function updateBookingInView() {
  if (!import.meta.client) return
  if (!bookingDocBottom || !bookingDocTop) {
    isBookingInView.value = false
    return
  }
  const viewportTop = window.scrollY
  const viewportBottom = viewportTop + window.innerHeight
  // Very strict alignment with tiny subpixel tolerance to avoid false negatives.
  const EPSILON_PX = 2
  isBookingInView.value =
    Math.abs(bookingDocTop - viewportTop) <= EPSILON_PX &&
    Math.abs(bookingDocBottom - viewportBottom) <= EPSILON_PX
}

function focusEdgeCues() {
  updateBookingInView()
  isMapFocused.value = true
}

function blurEdgeCuesOnOutsidePointer(event: PointerEvent) {
  if (!import.meta.client) return
  const root = bookingSectionRef.value
  const target = event.target as Node | null
  if (!root || !target) return
  if (root.contains(target)) return
  isMapFocused.value = false
}

/**
 * Espace vertical pour le plan : clientHeight du bloc − padding − autres enfants − gap flex.
 * Ne pas utiliser next.top − prev.bottom : ça inclut la hauteur actuelle du plan → valeur figée.
 * Le bandeau « réservation en cours » est téléporté dans le layout (`BookingOrderBanner`) : hors flux de cette colonne.
 */
/** Marge symétrique (haut + bas) laissée dans `.bookingBlock__inner` pour centrer la pile titre / plan / bouton. */
function bookingStackVerticalInsetPx(): number {
  if (!import.meta.client) return 32
  return window.matchMedia(NARROW_VIEWPORT_MQ).matches ? 24 : 40
}

function seatMapCssMaxHeightPx(): number | null {
  if (!import.meta.client) return null
  /* Aligné sur `.bookingBlock__seatMapSizer` @include media-up(lg) { max-height: 70dvh } */
  if (window.matchMedia(NARROW_VIEWPORT_MQ).matches) return null
  return Math.round(window.innerHeight * 0.7)
}

function getSeatMapAreaHeightPx(): number | null {
  if (!import.meta.client) return null
  const inner = bookingInnerRef.value
  const wrap = seatMapSizerRef.value
  if (!inner || !wrap) return null

  /*
   * Libérer la hauteur inline du sizer le temps du calcul : sinon après un shrink,
   * `inner.clientHeight` peut rester « coincé » et le plan ne repasse pas grand au resize up.
   */
  wrap.style.removeProperty('height')
  void inner.offsetHeight

  const cs = getComputedStyle(inner)
  const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
  const innerH = inner.clientHeight

  const layoutRoot = inner
  const rootCs = getComputedStyle(layoutRoot)
  const rowGap = parseFloat(rootCs.rowGap) || parseFloat(rootCs.gap) || 0

  const flexItems = [...layoutRoot.children] as HTMLElement[]

  let used = padY
  for (const child of flexItems) {
    if (child === wrap) continue
    const m = getComputedStyle(child)
    used += child.offsetHeight + (parseFloat(m.marginTop) || 0) + (parseFloat(m.marginBottom) || 0)
  }
  const gapLines = flexItems.length - 1
  if (gapLines > 0 && rowGap > 0) {
    used += rowGap * gapLines
  }

  const wm = getComputedStyle(wrap)
  const wrapMy = (parseFloat(wm.marginTop) || 0) + (parseFloat(wm.marginBottom) || 0)

  const symmetricInset = bookingStackVerticalInsetPx() * 2
  let raw = innerH - used - wrapMy - symmetricInset
  raw = Math.round(Math.max(240, raw))
  const cap = seatMapCssMaxHeightPx()
  if (cap != null) raw = Math.min(raw, cap)
  return raw
}

function computeSeatMapAreaHeight() {
  const px = getSeatMapAreaHeightPx()
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

let seatMapLayoutScheduled = false
function scheduleSeatMapHeightMeasure() {
  if (!import.meta.client) return
  if (orderBannerAnimating.value) return
  if (seatMapLayoutScheduled) return
  seatMapLayoutScheduled = true
  nextTick(() => {
    seatMapLayoutScheduled = false
    if (orderBannerAnimating.value) return
    computeSeatMapAreaHeight()
  })
}

const formStep = ref<1 | 2>(1)
const isSubmitting = ref(false)
const isSavingContact = ref(false)
const isCreatingHold = ref(false)
/** Incrémenté à l’annulation pendant un hold en cours : invalide la réponse tardive et déclenche l’annulation serveur. */
let holdCreationGeneration = 0

/** Garde bandeau timer + props stables le temps du fade-out de la modale (évite saut de hauteur). */
const keepModalChromeDuringLeave = ref(false)
/** Durée max alignée sur `.formReservationOverlay-leave-active` (backdrop 0.38s). */
const MODAL_OVERLAY_LEAVE_MS = 420
let modalCloseResetTimer: ReturnType<typeof setTimeout> | null = null

function cancelModalCloseReset() {
  if (modalCloseResetTimer) {
    clearTimeout(modalCloseResetTimer)
    modalCloseResetTimer = null
  }
}

function scheduleModalCloseReset() {
  cancelModalCloseReset()
  modalCloseResetTimer = setTimeout(() => {
    modalCloseResetTimer = null
    keepModalChromeDuringLeave.value = false
    formStep.value = 1
    errors.value = {}
    touched.value = {}
  }, MODAL_OVERLAY_LEAVE_MS)
}

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

watch(
  formattedTime,
  (v) => {
    bookingTimerDisplay.value = v
  },
  { immediate: true }
)

function getErrorMessage(err: unknown): string {
  const e = err as { data?: { statusMessage?: string; message?: string } }
  return e?.data?.statusMessage ?? e?.data?.message ?? content.home.errors.generic
}

/** Libère un hold créé côté serveur alors que l’utilisateur a déjà annulé (réponse API tardive). */
async function releasePendingHold(orderId: string, orderToken: string) {
  try {
    await $fetch('/api/cancel-order', {
      method: 'POST',
      body: { orderId, orderToken, reason: CANCEL_REASON.USER }
    })
  } catch {
    // Meilleur effort : éviter un siège bloqué sans commande active côté client.
  }
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

/** Fermeture billetterie publique (date spectacle dépassée) — pas le back-office admin. */
const publicBookingClosed = computed(
  () => bookingClosed.value && !props.isAdminFreeBooking
)

function startTimerFromExpiresAt(expiresAt: string) {
  const t = new Date(expiresAt).getTime()
  timerHasExpired = false
  if (Number.isNaN(t)) {
    timerExpiresAt = null
    remainingSeconds.value = 0
    return
  }
  timerExpiresAt = t
  remainingSeconds.value = Math.max(0, (t - Date.now()) / 1000)
}

async function loadSeats() {
  try {
    const data = await $fetch<SeatsApiPayload>('/api/seats')
    bookingClosed.value = data.event.bookingClosed
    seats.value = layoutYerresTheaterSeats(data.seats)
    if (props.isAdminFreeBooking && selectedSeatIds.value.length > 0) {
      const freeIdSet = new Set(seats.value.filter((s) => s.status === 'free').map((s) => s.id))
      const before = [...selectedSeatIds.value]
      const pruned = before.filter((id) => freeIdSet.has(id))
      if (pruned.length !== before.length) {
        selectedSeatIds.value = pruned
        selectionLimitMessage.value = null
        if (showModal.value) {
          adminDismissReservationModalForStaleSelection()
        }
      }
    }
  } finally {
    seatsReady.value = true
  }
}

function clearRealtimeRetryTimer() {
  if (realtimeRetryTimer) {
    clearTimeout(realtimeRetryTimer)
    realtimeRetryTimer = null
  }
}

async function stopSeatsRealtime() {
  clearRealtimeRetryTimer()
  const ch = realtimeChannel
  realtimeChannel = null
  if (ch) {
    await supabase.removeChannel(ch)
  }
}

async function startSeatsRealtime() {
  await stopSeatsRealtime()

  const opts: { event: string; schema: string; table: string; filter?: string } = {
    event: '*',
    schema: 'public',
    table: 'seat_reservation',
    filter: `event_id=eq.${EVENT_ID}`
  }

  const channelTopic = `seat_reservation:${EVENT_ID}:${crypto.randomUUID()}`
  realtimeChannel = supabase
    .channel(channelTopic)
    .on('postgres_changes', opts, (payload) => {
      void payload
      loadSeats()
    })
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        realtimeResubscribeAttempts = 0
        return
      }
      if (status === 'CHANNEL_ERROR' && err) {
        if (realtimeResubscribeAttempts >= REALTIME_MAX_RESUBSCRIBE_ATTEMPTS) {
          return
        }
        realtimeResubscribeAttempts++
        const delay = Math.min(2500, 250 * realtimeResubscribeAttempts)
        realtimeRetryTimer = setTimeout(() => {
          realtimeRetryTimer = null
          void startSeatsRealtime()
        }, delay)
      }
    })
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
  if (props.isAdminFreeBooking) return

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
      query: { orderId, orderToken: storedData.orderToken }
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

function onVisibilityRefreshAdminSeats() {
  if (!props.isAdminFreeBooking) return
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
  if (!showModal.value) return
  void loadSeats()
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null
function handleWindowResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    measureBookingBounds()
    snapSeatMapHeightToLayout()
    if (import.meta.client) {
      measureBookingSectionLayout(bookingSectionRef.value)
    }
    updateBookingInView()
    resizeTimer = null
  }, 100)
}

onMounted(async () => {
  try {
    await loadSeats()
    try {
      await startSeatsRealtime()
    } catch {
      // ignore realtime startup failures
    }
  } catch {
    // ignore initial setup failure logs
  }

  startMainAnimationLoop()

  if (!import.meta.client) return

  await restoreOrderFromStorage()

  await nextTick()
  measureBookingBounds()
  updateBookingInView()
  window.addEventListener('scroll', updateBookingInView, { passive: true })
  window.addEventListener('pointerdown', blurEdgeCuesOnOutsidePointer, { passive: true })
  window.addEventListener('resize', handleWindowResize)
  scheduleSeatMapHeightMeasure()
  measureBookingSectionLayout(bookingSectionRef.value)

  window.addEventListener('pageshow', onPageShow)
  window.addEventListener('visibilitychange', onVisibilityRefreshAdminSeats)

  unregisterBookingSnap = registerBookingSeatMapSnap(snapSeatMapHeightToLayout)
  unregisterBookingBanner = registerBookingBannerActions({
    resume: resumePaymentOrOpenModal,
    cancel: onCancelOrderBannerUser
  })
})

onUnmounted(() => {
  holdCreationGeneration++
  if (resizeTimer) clearTimeout(resizeTimer)
  cancelModalCloseReset()
  unregisterBookingSnap?.()
  unregisterBookingBanner?.()
  if (import.meta.client) {
    window.removeEventListener('scroll', updateBookingInView)
    window.removeEventListener('pointerdown', blurEdgeCuesOnOutsidePointer)
    window.removeEventListener('pageshow', onPageShow)
    window.removeEventListener('visibilitychange', onVisibilityRefreshAdminSeats)
    window.removeEventListener('resize', handleWindowResize)
    clearBookingSectionLayoutCache()
  }
  stopMainAnimationLoop()
  void stopSeatsRealtime()
})

function toggleSeat(id: string) {
  if (publicBookingClosed.value) return
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
  if (isSubmitting.value) return
  cancelModalCloseReset()
  keepModalChromeDuringLeave.value = false

  if (publicBookingClosed.value) {
    error.value = content.home.errors.bookingClosed
    return
  }

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

  if (props.isAdminFreeBooking) {
    suppressPageOrderAlert.value = true
    formStep.value = 1
    showModal.value = true
    return
  }

  if (!activeOrder.value) {
    const creationGen = holdCreationGeneration
    suppressPageOrderAlert.value = true
    // Show the reservation popup immediately; keep hold creation in background.
    showModal.value = true
    isCreatingHold.value = true
    isSubmitting.value = true
    try {
      const seatIds = [...selectedSeatIds.value]
      const res = await $fetch<HoldSeatsResponse>('/api/hold-seats', {
        method: 'POST',
        body: { quick: true, seatIds }
      })

      if (creationGen !== holdCreationGeneration) {
        await releasePendingHold(res.orderId, res.orderToken)
        await loadSeats()
        return
      }

      const pendingOrder: ActiveOrder = {
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

      if (creationGen !== holdCreationGeneration) {
        await releasePendingHold(res.orderId, res.orderToken)
        await loadSeats()
        return
      }

      activeOrder.value = pendingOrder
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(pendingOrder))
      startTimerFromExpiresAt(res.expiresAt)
      await loadSeats()
    } catch (err) {
      error.value = getErrorMessage(err)
      showModal.value = false
      suppressPageOrderAlert.value = false
      return
    } finally {
      isCreatingHold.value = false
      isSubmitting.value = false
    }
  }

  showModal.value = true
  suppressPageOrderAlert.value = false
}

function resumePaymentOrOpenModal() {
  cancelModalCloseReset()
  keepModalChromeDuringLeave.value = false

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
  holdCreationGeneration++
  isCreatingHold.value = false
  showModal.value = false
  suppressPageOrderAlert.value = false
  keepModalChromeDuringLeave.value = false

  if (props.isAdminFreeBooking && !activeOrder.value) {
    return
  }

  if (activeOrder.value) {
    await cancelActiveOrder(CANCEL_REASON.USER)
  }
}

function closeModal() {
  keepModalChromeDuringLeave.value = true
  showModal.value = false
  suppressPageOrderAlert.value = false
  isSavingContact.value = false
  scheduleModalCloseReset()
}

/** Org : une place sélectionnée n’est plus libre (réservation ailleurs) — fermeture immédiate + message. */
function adminDismissReservationModalForStaleSelection() {
  error.value = content.home.errors.seatsNotFreeAnymore
  cancelModalCloseReset()
  keepModalChromeDuringLeave.value = false
  showModal.value = false
  suppressPageOrderAlert.value = false
  formStep.value = 1
  isSavingContact.value = false
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

  if (props.isAdminFreeBooking) {
    error.value = null
    try {
      await loadSeats()
    } catch {
      error.value = content.api.errors.loadSeatsFailed
      return
    }
    if (!showModal.value) return
    if (selectedSeatIds.value.length === 0) {
      error.value = content.home.errors.seatsNotFreeAnymore
      return
    }
    formStep.value = 2
    return
  }

  const order = activeOrder.value
  if (!order) {
    error.value = content.home.errors.generic
    return
  }

  isSavingContact.value = true
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
    isSavingContact.value = false
  }
}

type ReservationStep2Payload = {
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
}

/**
 * Billeterie orga : aucun hold ni timer tant que l’utilisateur n’a pas cliqué sur « Confirmer ».
 * À la confirmation : hold → contact → détails billets → clôture gratuite.
 */
async function submitAdminFreeOnConfirm(payload: ReservationStep2Payload) {
  const adultCount = payload.ticketDetails.filter((t) => t.ticketType === 'adult').length
  const childCount = payload.ticketDetails.filter((t) => t.ticketType === 'child').length
  const seatIdsFromTickets = payload.ticketDetails.map((t) => t.seatId)
  const uniqueFromTickets = [...new Set(seatIdsFromTickets)]
  if (uniqueFromTickets.length !== seatIdsFromTickets.length || seatIdsFromTickets.length === 0) {
    error.value = content.home.errors.generic
    return
  }

  await loadSeats()
  const freeIdSet = new Set(seats.value.filter((s) => s.status === 'free').map((s) => s.id))
  const allStillFree = seatIdsFromTickets.every((id) => freeIdSet.has(id))
  if (!allStillFree) {
    error.value = content.home.errors.seatsNotFreeAnymore
    selectedSeatIds.value = seatIdsFromTickets.filter((id) => freeIdSet.has(id))
    return
  }

  const seatIds = seatIdsFromTickets

  isSubmitting.value = true
  isCreatingHold.value = true
  error.value = null
  let orderIdCancel: string | undefined
  let orderTokenCancel: string | undefined
  try {
    const res = await $fetch<HoldSeatsResponse>('/api/hold-seats', {
      method: 'POST',
      body: { quick: true, seatIds }
    })
    orderIdCancel = res.orderId
    orderTokenCancel = res.orderToken

    await $fetch('/api/update-order-contact', {
      method: 'POST',
      body: {
        orderId: res.orderId,
        orderToken: res.orderToken,
        firstName: payload.form.firstName.trim(),
        lastName: payload.form.lastName.trim(),
        email: payload.form.email.trim(),
        phone: payload.form.phone.replace(/\D/g, '')
      }
    })

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

    await $fetch('/api/admin/complete-free-order', {
      method: 'POST',
      body: {
        orderId: res.orderId,
        orderToken: res.orderToken,
        adultCount,
        childCount
      },
      credentials: 'include'
    })

    const rid = res.orderId
    const rtoken = res.orderToken
    closeModal()
    selectedSeatIds.value = []
    clearOrderClientState()
    await loadSeats()
    await navigateTo({
      path: '/success',
      query: { order_id: rid, order_token: rtoken }
    })
  } catch (err) {
    if (orderIdCancel && orderTokenCancel) {
      try {
        await $fetch('/api/cancel-order', {
          method: 'POST',
          body: {
            orderId: orderIdCancel,
            orderToken: orderTokenCancel,
            reason: CANCEL_REASON.USER
          }
        })
      } catch {
        // ignore
      }
      await loadSeats()
    }
    error.value = getErrorMessage(err)
  } finally {
    isCreatingHold.value = false
    isSubmitting.value = false
  }
}

async function submitStep2(payload: ReservationStep2Payload) {
  if (props.isAdminFreeBooking) {
    await submitAdminFreeOnConfirm(payload)
    return
  }

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

function clearOrderClientState() {
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
}

async function cancelActiveOrder(
  reason: (typeof CANCEL_REASON)[keyof typeof CANCEL_REASON] = CANCEL_REASON.USER
) {
  if (!activeOrder.value) return

  try {
    await $fetch('/api/cancel-order', {
      method: 'POST',
      body: {
        orderId: activeOrder.value.orderId,
        orderToken: activeOrder.value.orderToken,
        reason
      }
    })

    clearOrderClientState()

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

  if (publicBookingClosed.value) {
    error.value = content.home.errors.bookingClosed
    return
  }

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

    window.location.href = res.url
  } catch (err) {
    error.value = getErrorMessage(err)
    throw err
  }
}
</script>

<style lang="scss" scoped>
.bookingBlock {
  position: relative;
  margin: 0;
  padding: 10px 0 24px 0;
  height: 100dvh;
  scroll-margin-top: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Remplit le conteneur admin (100dvh, overflow hidden) sans dépasser la fenêtre. */
.bookingBlock.bookingBlock--adminOnly {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  box-sizing: border-box;
  background: #1a1a2e;
  color: #e8e8ef;

  .bookingBlock__inner {
    position: relative;
    background: transparent;
    /* Évite 100dvh + padding > parent (overflow hidden) qui rognait le logo en haut. */
    height: 100%;
    max-height: 100%;
    min-height: 0;
  }

  .bookingBlock__title {
    color: #fff;
  }

  .bookingBlock__loader {
    background: #1a1a2e;
  }

  .bookingBlock__loaderSpinner {
    border-color: rgba(255, 255, 255, 0.18);
    border-top-color: #6ea8ff;
  }

  .bookingBlock__seatMapSizer {
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  }

  .bookingBlock__alert.bookingBlock__alert--danger {
    color: #fecaca;
    background: rgba(248, 113, 113, 0.14);
    border-color: rgba(248, 113, 113, 0.4);
  }

  .bookingBlock__alert.bookingBlock__alert--warning {
    color: #fde68a;
    background: rgba(251, 191, 36, 0.12);
    border-color: rgba(251, 191, 36, 0.35);
  }

  :deep(.selectionInfo .selectionInfo__text) {
    color: #e8e8ef;

    &.selectionInfo__text--empty {
      color: rgba(232, 232, 239, 0.55);
    }

    .text__count {
      color: #7db3ff;
    }
  }

  :deep(.selectionInfo .selectionInfo__limit) {
    color: #fcd34d;
  }

  .bookingBlock__actions :deep(.defaultButton--primary) {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.12),
      0 4px 14px rgba(13, 110, 253, 0.35);
  }

  .bookingBlock__actions :deep(.defaultButton.defaultButton--primary.defaultButton--disabled) {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.16);
    color: rgba(255, 255, 255, 0.45);
    box-shadow: none;
  }

  /* Modale réservation : le shell admin impose une couleur claire — on repasse en texte foncé sur la carte blanche. */
  :deep(.formReservation.formReservation--adminFree) {
    color: #212529;
  }

  :deep(.formReservation.formReservation--adminFree .priceSummary.priceSummary--orga) {
    margin-bottom: 20px;
  }

  :deep(.formReservation.formReservation--adminFree .ticketBlock__type .type__select) {
    color: #212529;
    background-color: #fff;
    -webkit-text-fill-color: #212529;
  }

  :deep(.formReservation.formReservation--adminFree .ticketBlock__type .type__select option) {
    color: #212529;
    background-color: #fff;
  }
}

.bookingBlock__edgeCue {
  display: none;
}

@include media-down(lg) {
  .bookingBlock__edgeCue {
    position: absolute;
    z-index: 20;
    width: auto;
    height: auto;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 6px;
    pointer-events: auto;
    opacity: 0;
    border: none;
    background: transparent;
    padding: 10px;
    margin: -10px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.26s ease;
  }

  .bookingBlock__edgeCue--visible {
    opacity: 0.72;
    transition-duration: 0.4s;
  }

  .bookingBlock__edgeCue--top {
    top: max(14px, env(safe-area-inset-top));
    left: 14px;
  }

  .bookingBlock__edgeCue--bottom {
    bottom: max(14px, env(safe-area-inset-bottom));
    right: 14px;
  }

  .edgeCue__arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    line-height: 1;
    color: rgba(33, 37, 41, 0.62);
    flex-shrink: 0;
  }

  .edgeCue__arrow--up {
    transform: none;
  }

  .edgeCue__arrow--down {
    transform: none;
  }

  .edgeCue__text {
    @include apply-font(caption-11);
    color: rgba(33, 37, 41, 0.68);
    white-space: nowrap;
    letter-spacing: 0.01em;
    transform: translateY(1.5px);
  }

  .bookingBlock--adminOnly {
    .edgeCue__arrow {
      color: rgba(232, 232, 239, 0.55);
    }

    .edgeCue__text {
      color: rgba(232, 232, 239, 0.72);
    }
  }
}

/** Pleine largeur sur desktop : évite que le shrink-to-fit du flex parent change la largeur du plan quand le bandeau apparaît. */
.bookingBlock__reveal {
  @include media-up(lg) {
    align-self: stretch;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
}

.bookingBlock__inner {
  box-sizing: border-box;
  height: 100dvh;
  max-width: 100%;
  margin: 0 auto;
  background: $color-surface-page;
  padding: 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  @include media-up(lg) {
    align-self: stretch;
    width: 100%;
  }

  @include media-down(lg) {
    height: 85dvh;
  }
}

/* Après la règle générale : garde la billetterie orga dans le cadre parent sans rogner le logo. */
.bookingBlock.bookingBlock--adminOnly .bookingBlock__inner {
  height: 100%;
  max-height: 100%;
  min-height: 0;

  @include media-down(lg) {
    height: 100%;
    max-height: 100%;
  }
}

.bookingBlock__title {
  margin: 0 0 30px 0;
  color: $color-text-primary;
  text-align: center;
  user-select: none;
  @include apply-font(title-m);
}

.bookingBlock__actions {
  display: flex;
  justify-content: center;
}

/* Durée / easing partagés : hauteur du plan + transition du bandeau commande. */
$booking-layout-ease: cubic-bezier(0.33, 1, 0.68, 1);
$booking-layout-ms: 0.42s;

/** Desktop (≥ lg) : le plan ne remplit plus toute la hauteur disponible — ajuste ici (dvh ou px). */
$booking-seat-map-max-height-desktop: 70dvh;

.bookingBlock__seatMapSizer {
  width: 100%;
  flex-shrink: 0;
  min-height: 220px;
  margin-bottom: 40px;
  transition: height $booking-layout-ms $booking-layout-ease;

  @include media-down(lg) {
    /*
     * La hauteur inline (px) vient du JS : sur mobile elle peut rester basse (85dvh du parent, barres
     * du navigateur, etc.). min-height / max-height en dvh corrigent la zone utile du plan.
     */
    min-height: clamp(260px, 52dvh, 640px);
    max-height: min(78dvh, 680px);
  }

  @include media-up(lg) {
    max-height: $booking-seat-map-max-height-desktop;
  }
}

.bookingBlock__loader {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-surface-page;

  @include media-down(lg) {
    min-height: 85dvh;
  }
}

.bookingBlock__loaderSpinner {
  box-sizing: border-box;
  width: 44px;
  height: 44px;
  border: 3px solid $color-gray-200;
  border-top-color: $color-primary;
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
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
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
    border-top-color: $color-border-subtle;
  }

  .bookingBlock--adminOnly .bookingBlock__loaderSpinner {
    border-top-color: rgba(255, 255, 255, 0.45);
  }

  .bookingBlockReveal-enter-active {
    transition-duration: 0.01ms;
  }
}

.bookingBlock__seatMap {
  margin-bottom: 0;
}

.bookingBlock__alert {
  padding: 12px 16px;
  margin: 8px 0 16px 0;
  border: 1px solid transparent;
  border-radius: 6px;
  @include apply-font(text-s);
  transition:
    border-color 0.3s ease,
    background-color 0.3s ease,
    color 0.3s ease;

  &.bookingBlock__alert--danger {
    color: $color-danger-text;
    background-color: $color-danger-bg;
    border-color: $color-danger-border;
  }

  &.bookingBlock__alert--warning {
    max-width: 26rem;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    color: $color-warning-text;
    background-color: $color-warning-bg;
    border-color: $color-warning-border;
  }
}
</style>
