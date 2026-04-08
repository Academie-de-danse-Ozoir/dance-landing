<template>
  <Transition name="formReservationOverlay" appear @after-leave="onOverlayAfterLeave">
    <div
      v-if="show"
      class="formReservationOverlay"
      data-lenis-prevent
      role="presentation"
      @click.self="$emit('close')"
    >
      <div
        class="formReservationOverlay__column"
        :class="{ 'formReservationOverlay__column--stepHidden': stepCardHidden }"
      >
        <Transition name="formReservationBanner">
          <div
            v-if="showReservationTimer"
            key="reservation-timer"
            class="formReservation__timer"
            role="status"
          >
            <p class="timer__title">{{ content.home.modal.reservationBannerTitle }}</p>
            <p class="timer__line">
              <span class="timer__label">{{ content.home.modal.reservationTimeLabel }}</span>
              <span class="timer__clock" aria-live="polite">{{ formattedReservationTime }}</span>
            </p>
            <div class="formReservation__timerActions bookingOrderActions bookingOrderActions--single">
              <DefaultButton
                type="button"
                variant="cancelReservation"
                class="timer__cancel"
                :label="content.home.activeOrder.cancelReservation"
                @click="$emit('cancel-reservation')"
              />
            </div>
          </div>
        </Transition>

        <div
          class="formReservation"
          :class="{ 'formReservation--stepHidden': stepCardHidden }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="dialogTitleId"
          :aria-hidden="stepCardHidden ? 'true' : undefined"
        >
          <div class="formReservation__header">
            <h2 :id="dialogTitleId" class="header__title">
              {{ displayedStep === 1 ? content.home.modal.title : content.home.modal.step2Title }}
            </h2>
            <button type="button" class="header__close" @click="$emit('close')" :aria-label="content.home.modal.close">
              <svg
                class="close__icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <div
            ref="scrollRegionRef"
            class="formReservation__scroll"
            :aria-label="content.home.modal.scrollRegionLabel"
          >
            <div
              class="formReservation__body"
              :class="{ 'formReservation__body--step2': displayedStep === 2 }"
            >
              <form
                v-if="displayedStep === 1"
                key="step-1"
                class="body__form"
                autocomplete="on"
                @submit.prevent="onNext"
              >
                <div class="form__row form__row--namePair">
                  <FormField
                    v-for="field in formFieldsNameRow"
                    :key="field.key"
                    :field-key="field.key"
                    :label="field.label"
                    :type="field.type"
                    :placeholder="field.placeholder"
                    :maxlength="field.maxlength"
                    :inputmode="field.inputmode"
                    :autocomplete="field.autocomplete"
                    :model-value="form[field.key]"
                    :error="errors[field.key]"
                    :touched="touched[field.key]"
                    @update:model-value="updateField(field.key as keyof FormData, $event)"
                    @blur="handleFieldBlur(field.key)"
                  />
                </div>
                <FormField
                  v-for="field in formFieldsAfterNames"
                  :key="field.key"
                  :field-key="field.key"
                  :label="field.label"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  :maxlength="field.maxlength"
                  :inputmode="field.inputmode"
                  :autocomplete="field.autocomplete"
                  :digits-only="field.key === 'phone'"
                  :model-value="form[field.key]"
                  :error="errors[field.key]"
                  :touched="touched[field.key]"
                  @update:model-value="updateField(field.key as keyof FormData, $event)"
                  @blur="handleFieldBlur(field.key)"
                />
                <div class="form__footer">
                  <DefaultButton
                    variant="secondary"
                    :label="content.home.modal.cancel"
                    type="button"
                    @click="emit('close')"
                  />
                  <DefaultButton
                    variant="primary"
                    type="button"
                    :label="content.home.modal.next"
                    :disabled="isSavingContact"
                    @click="onNext"
                  />
                </div>
              </form>
              <form
                v-else
                key="step-2"
                class="body__form body__form--step2"
                autocomplete="on"
                @submit.prevent="onSubmitStep2"
              >
                <div class="form__step2Main">
                  <p class="form__intro">{{ content.home.modal.step2Intro }}</p>
                  <div v-for="(ticket, idx) in ticketDetails" :key="ticket.seatId" class="ticketBlock">
                    <h3 class="ticketBlock__title">{{ content.home.modal.place }} {{ ticket.seatLabel }}</h3>
                    <div class="ticketBlock__namePair">
                      <FormField
                        :field-key="`ticket-${idx}-firstName`"
                        :label="content.home.modal.fields.firstName.label"
                        type="text"
                        :placeholder="content.home.modal.fields.firstName.placeholder"
                        :autocomplete="`section-place-${idx} given-name`"
                        :model-value="ticket.firstName"
                        :error="ticketErrors[idx]?.firstName"
                        @update:model-value="updateTicketDetail(idx, 'firstName', $event)"
                      />
                      <FormField
                        :field-key="`ticket-${idx}-lastName`"
                        :label="content.home.modal.fields.lastName.label"
                        type="text"
                        :placeholder="content.home.modal.fields.lastName.placeholder"
                        :autocomplete="`section-place-${idx} family-name`"
                        :model-value="ticket.lastName"
                        :error="ticketErrors[idx]?.lastName"
                        @update:model-value="updateTicketDetail(idx, 'lastName', $event)"
                      />
                    </div>
                    <div class="ticketBlock__type">
                      <label class="type__label">{{ content.home.modal.ticketType }}</label>
                      <select
                        :value="ticket.ticketType"
                        class="type__select"
                        @change="
                          updateTicketDetail(idx, 'ticketType', ($event.target as HTMLSelectElement).value as 'adult' | 'child')
                        "
                      >
                        <option value="adult">{{ content.home.modal.adult }}</option>
                        <option value="child">{{ content.home.modal.child }}</option>
                      </select>
                    </div>
                  </div>
                  <div class="priceSummary">
                    <p class="priceSummary__title">{{ content.home.modal.priceSummary }}</p>
                    <template v-if="priceSummary.adultCount > 0">
                      <p class="priceSummary__line">{{ priceSummary.adultsLine }}</p>
                    </template>
                    <template v-if="priceSummary.childCount > 0">
                      <p class="priceSummary__line">{{ priceSummary.childrenLine }}</p>
                    </template>
                    <p class="priceSummary__total">{{ content.home.modal.totalLabel }} : {{ priceSummary.totalAmount }}</p>
                  </div>
                </div>
                <ClientOnly>
                  <Transition name="formTurnstileFade" appear>
                    <div v-if="turnstileSiteKey" key="turnstile" class="form__turnstileShell">
                      <div class="form__turnstileInner">
                        <TurnstileField
                          :site-key="turnstileSiteKey"
                          :hint="content.home.modal.turnstileHint"
                          @update:token="onTurnstileToken"
                        />
                      </div>
                      <p
                        class="form__turnstileError"
                        :class="{ 'form__turnstileError--visible': !!turnstileError }"
                        role="status"
                        :aria-live="turnstileError ? 'polite' : 'off'"
                        :aria-hidden="turnstileError ? undefined : 'true'"
                      >
                        {{ turnstileError ?? '' }}
                      </p>
                    </div>
                  </Transition>
                </ClientOnly>
                <div class="form__footer">
                  <DefaultButton variant="secondary" :label="content.home.modal.back" type="button" @click="emit('back')" />
                  <DefaultButton
                    variant="primary"
                    type="submit"
                    :label="isSubmitting ? content.home.modal.submitting : content.home.modal.submit"
                    :disabled="isSubmitting"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, watch, ref, onBeforeUnmount, useId, nextTick } from 'vue'
import content from '../../locales/fr.json'
import { PRICE_ADULT_CENTS, PRICE_CHILD_CENTS } from '../../constants'
import { formatFrenchPhoneInput } from '../../utils/phoneInput'
import FormField from './FormField.vue'
import DefaultButton from '../buttons/DefaultButton.vue'
import TurnstileField from '../TurnstileField.vue'

function formatEuros(cents: number): string {
  const value = (cents / 100).toFixed(2).replace('.', ',')
  return `${value} €`
}

export type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  adultCount: number
  childCount: number
}

import type { TicketDetail } from '../../types'

const props = withDefaults(
  defineProps<{
    show: boolean
    form: FormData
    seatCount: number
    step: 1 | 2
    /** Pour l’étape 2 : liste des sièges (id + label) dans l’ordre de la réservation */
    seatItems?: { id: string; label: string }[]
    errors: Record<string, string>
    touched: Record<string, boolean>
    /** Finalisation commande (étape 2). */
    isSubmitting: boolean
    /** Enregistrement coordonnées vers l’API (étape 1) — sans changer le libellé « Suivant ». */
    isSavingContact?: boolean
    /** Bandeau décompte + annulation (hold créé au clic « Réserver »). */
    showReservationTimer: boolean
    formattedReservationTime: string
  }>(),
  { isSavingContact: false }
)

const config = useRuntimeConfig()
const rootLenis = useLenis()

function lockDocumentScroll(lock: boolean) {
  if (import.meta.server) return
  document.documentElement.style.overflow = lock ? 'hidden' : ''
}

/** Après la fin du fade-out : évite de rendre la scrollbar pendant que l’overlay est encore visible (saut de layout). */
function onOverlayAfterLeave() {
  lockDocumentScroll(false)
  rootLenis.value?.resize()
}

/** Affichage réel après fondu complet de la carte (toute la popup, pas seulement le body). */
const displayedStep = ref<1 | 2>(props.step)
const stepCardHidden = ref(false)
const STEP_CARD_FADE_MS = 260
/** Après swap d’étape : laisser le layout se stabiliser avant le fade-in (évite le saut). */
const STEP_REVEAL_DELAY_MS = 100
let stepChangeGeneration = 0

/** Aligné sur `.formReservationBanner-*` (opacité + transform ~280ms). */
const BANNER_TRANSITION_MS = 300

watch(
  () => props.show,
  (open) => {
    if (open) {
      lockDocumentScroll(true)
      displayedStep.value = props.step
      rootLenis.value?.resize()
    } else {
      stepCardHidden.value = false
      /* Scroll : déverrouillage dans onOverlayAfterLeave uniquement.
       * displayedStep inchangé pendant le leave (cf. watch step). */
    }
  }
)

watch(
  () => [props.show, props.showReservationTimer] as const,
  () => {
    if (!props.show) return
    void nextTick().then(() => {
      window.setTimeout(() => rootLenis.value?.resize(), BANNER_TRANSITION_MS)
    })
  },
  { flush: 'post', immediate: true }
)

watch(
  () => props.step,
  async (next, prev) => {
    if (next === prev) return
    if (!props.show) {
      return
    }
    const gen = ++stepChangeGeneration
    stepCardHidden.value = true
    await new Promise((r) => setTimeout(r, STEP_CARD_FADE_MS))
    if (gen !== stepChangeGeneration || !props.show) {
      stepCardHidden.value = false
      if (props.show) {
        displayedStep.value = props.step
      }
      return
    }
    displayedStep.value = next
    await nextTick()
    resetPopupScrollToTop()
    await new Promise((r) => setTimeout(r, STEP_REVEAL_DELAY_MS))
    rootLenis.value?.resize()
    stepCardHidden.value = false
    await nextTick()
    resetPopupScrollToTop()
  }
)

onBeforeUnmount(() => {
  lockDocumentScroll(false)
  rootLenis.value?.resize()
})

const turnstileSiteKey = computed(() => (config.public.turnstileSiteKey as string) || '')
const turnstileToken = ref<string | null>(null)
const turnstileError = ref<string | null>(null)

function onTurnstileToken(t: string | null) {
  turnstileToken.value = t
  turnstileError.value = null
}

const emit = defineEmits<{
  'close': []
  'next': []
  'back': []
  'submit': [payload: { form: FormData; ticketDetails: TicketDetail[]; turnstileToken?: string }]
  'update:form': [form: FormData]
  'field-blur': [key: string]
  'cancel-reservation': []
}>()

const ticketDetails = ref<TicketDetail[]>([])
const ticketErrors = ref<Record<number, { firstName?: string; lastName?: string }>>({})

let prevFormStep: 1 | 2 | undefined

watch(
  () => [props.step, props.seatItems] as const,
  ([step, items]) => {
    if (step === 1) {
      turnstileToken.value = null
      turnstileError.value = null
    }

    if (step === 2 && items && items.length > 0) {
      const fn = props.form.firstName?.trim() ?? ''
      const ln = props.form.lastName?.trim() ?? ''
      const needsBuild = ticketDetails.value.length !== items.length
      const enteredFromStep1 = prevFormStep === 1
      if (needsBuild || enteredFromStep1) {
        const prevTickets = [...ticketDetails.value]
        ticketDetails.value = items.map((s, i) => ({
          seatId: s.id,
          seatLabel: s.label,
          firstName: fn,
          lastName: ln,
          ticketType: prevTickets[i]?.ticketType ?? 'adult'
        }))
        ticketErrors.value = {}
      }
    }

    prevFormStep = step
  },
  { immediate: true }
)

const priceSummary = computed(() => {
  const adultCount = ticketDetails.value.filter((t) => t.ticketType === 'adult').length
  const childCount = ticketDetails.value.filter((t) => t.ticketType === 'child').length
  const adultsCents = adultCount * PRICE_ADULT_CENTS
  const childrenCents = childCount * PRICE_CHILD_CENTS
  const totalCents = adultsCents + childrenCents
  const adultsAmount = formatEuros(adultsCents)
  const childrenAmount = formatEuros(childrenCents)
  const totalAmount = formatEuros(totalCents)
  const adultsLine = `${adultCount} adulte(s) — ${adultsAmount}`
  const childrenLine = `${childCount} enfant(s) — ${childrenAmount}`
  return {
    adultCount,
    childCount,
    adultsLine,
    childrenLine,
    totalAmount
  }
})

/** 10 chiffres + 4 espaces (groupes de 2). */
const PHONE_INPUT_MAX_LEN = 14

const formFields = [
  {
    key: 'firstName' as const,
    label: content.home.modal.fields.firstName.label,
    type: 'text' as const,
    placeholder: content.home.modal.fields.firstName.placeholder,
    autocomplete: 'given-name'
  },
  {
    key: 'lastName' as const,
    label: content.home.modal.fields.lastName.label,
    type: 'text' as const,
    placeholder: content.home.modal.fields.lastName.placeholder,
    autocomplete: 'family-name'
  },
  {
    key: 'email' as const,
    label: content.home.modal.fields.email.label,
    type: 'email' as const,
    placeholder: content.home.modal.fields.email.placeholder,
    autocomplete: 'email'
  },
  {
    key: 'phone' as const,
    label: content.home.modal.fields.phone.label,
    type: 'tel' as const,
    placeholder: content.home.modal.fields.phone.placeholder,
    maxlength: PHONE_INPUT_MAX_LEN,
    inputmode: 'numeric' as const,
    autocomplete: 'tel'
  }
]

const dialogTitleId = useId()
const scrollRegionRef = ref<HTMLElement | null>(null)

function resetPopupScrollToTop() {
  const el = scrollRegionRef.value
  if (!el) return
  el.scrollTop = 0
}
const formFieldsNameRow = formFields.filter((f) => f.key === 'firstName' || f.key === 'lastName')
const formFieldsAfterNames = formFields.filter((f) => f.key !== 'firstName' && f.key !== 'lastName')

function updateField(key: keyof FormData, value: string) {
  const next =
    key === 'phone' ? formatFrenchPhoneInput(value) : value
  emit('update:form', { ...props.form, [key]: next })
}

function updateTicketDetail(index: number, field: keyof TicketDetail, value: string | 'adult' | 'child') {
  const next = [...ticketDetails.value]
  next[index] = { ...next[index], [field]: value }
  ticketDetails.value = next
  const errs = { ...ticketErrors.value }
  if (errs[index]) delete errs[index][field as 'firstName' | 'lastName']
  ticketErrors.value = errs
}

function handleFieldBlur(key: string) {
  emit('field-blur', key)
}

function validateStep2(): boolean {
  const errs: Record<number, { firstName?: string; lastName?: string }> = {}
  let valid = true
  ticketDetails.value.forEach((t, i) => {
    const f = t.firstName?.trim()
    const l = t.lastName?.trim()
    if (!f || !l) {
      errs[i] = {}
      if (!f) errs[i].firstName = content.home.modal.validation.required
      if (!l) errs[i].lastName = content.home.modal.validation.required
      valid = false
    }
  })
  ticketErrors.value = errs
  return valid
}

function onNext() {
  emit('next')
}

function onSubmitStep2() {
  if (!validateStep2()) return
  if (turnstileSiteKey.value && !turnstileToken.value) {
    turnstileError.value = content.home.modal.validation.turnstileRequired
    return
  }
  emit('submit', {
    form: props.form,
    ticketDetails: ticketDetails.value,
    ...(turnstileToken.value ? { turnstileToken: turnstileToken.value } : {})
  })
}
</script>

<style lang="scss" scoped>
/* Ouverture / fermeture : fond assombri + flou du contenu derrière (même couche que la modale). */
.formReservationOverlay-enter-active,
.formReservationOverlay-leave-active {
  transition:
    opacity 0.28s cubic-bezier(0.33, 1, 0.68, 1),
    backdrop-filter 0.38s ease,
    -webkit-backdrop-filter 0.38s ease;
}

.formReservationOverlay-enter-from,
.formReservationOverlay-leave-to {
  opacity: 0;
  backdrop-filter: blur(0);
  -webkit-backdrop-filter: blur(0);
}

/* Bandeau réservation : même rythme que l’overlay (opacité + léger slide). */
.formReservationBanner-enter-active,
.formReservationBanner-leave-active {
  transition:
    opacity 0.28s cubic-bezier(0.33, 1, 0.68, 1),
    transform 0.28s cubic-bezier(0.33, 1, 0.68, 1);
}

.formReservationBanner-enter-from,
.formReservationBanner-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.formReservationBanner-enter-to,
.formReservationBanner-leave-from {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .formReservationOverlay-enter-active,
  .formReservationOverlay-leave-active {
    transition-duration: 0.01ms !important;
  }

  .formReservationOverlay {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .formReservationOverlay-enter-from,
  .formReservationOverlay-leave-to {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .formReservationBanner-enter-active,
  .formReservationBanner-leave-active {
    transition-duration: 0.01ms;
  }
}

.formReservationOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(4px) saturate(0.92);
  -webkit-backdrop-filter: blur(4px) saturate(0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  cursor: pointer;

  @include media-down(lg) {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    min-height: 0;
    padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
  }
}

.formReservationOverlay__column {
  cursor: default;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 90%;
  max-width: 650px;
  max-height: 95vh;
  margin: auto;
  gap: 0;

  @include media-down(lg) {
    flex: 1;
    min-height: 0;
    width: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    gap: 8px;

    &:has(> .formReservation__timer) {
      gap: 0;
    }
  }

  @include media-up(lg) {
    &:has(> .formReservation__timer) .formReservation {
      border-radius: 0 0 8px 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    &:has(> .formReservation__timer) .formReservation__timer {
      border-radius: 8px 8px 0 0;
      box-shadow: none;
    }
  }
}

/** Pendant le fondu de changement d’étape : bandeau + carte au même timing (évite le saut du bandeau sur desktop). */
.formReservationOverlay__column--stepHidden .formReservation__timer {
  opacity: 0;
  pointer-events: none;
}

.formReservation__timer {
  flex-shrink: 0;
  padding: 14px 20px 16px;
  background: linear-gradient(180deg, #e7f1ff 0%, #dbeafe 100%);
  border: 1px solid #b6d4fe;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  text-align: center;
  transition: opacity 0.26s ease;

  @include media-down(lg) {
    padding: 12px 16px 14px;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }

  @include media-up(lg) {
    border-bottom: 1px solid #b6d4fe;
  }
}

.formReservation__timerActions {
  justify-content: center;
}

@include media-down(lg) {
  .formReservationOverlay__column:has(> .formReservation__timer) .formReservation__timer {
    border-radius: 8px 8px 0 0;
    border-bottom: none;
    box-shadow: none;
  }

  .formReservationOverlay__column:has(> .formReservation__timer) .formReservation {
    border-radius: 0 0 8px 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
  }
}

.timer__title {
  margin: 0 0 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1e40af;

  @include media-down(lg) {
    margin-bottom: 4px;
  }
}

.timer__line {
  margin: 0 0 14px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;

  @include media-down(lg) {
    margin-bottom: 8px;
  }
}

.timer__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e3a8a;
}

.timer__clock {
  font-variant-numeric: tabular-nums;
  font-size: 1.75rem;
  font-weight: 800;
  color: #1d4ed8;
  line-height: 1;

  @include media-down(lg) {
    font-size: 1.45rem;
  }
}

.formReservation {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: opacity 0.26s ease;

  @include media-down(lg) {
    flex: 1;
    min-height: 0;
    max-height: none;
  }

  &.formReservation--stepHidden {
    opacity: 0;
    pointer-events: none;
  }

  .formReservation__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    border-bottom: 1px solid #dee2e6;

    @include media-down(lg) {
      padding: 14px 16px;
    }

    .header__title {
      flex: 1;
      min-width: 0;
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      /* Même hauteur que le bouton fermer : le flex centre les deux sur le même axe. */
      color: #212529;
    }

    .header__close {
      flex-shrink: 0;
      box-sizing: border-box;
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateY(1px);
      border-radius: 4px;
      transition: background-color 0.3s ease, color 0.3s ease;

      &:hover {
        background-color: #f8f9fa;
        color: #212529;
      }

      .close__icon {
        width: 22px;
        height: 22px;
        display: block;
      }
    }
  }

  .formReservation__scroll {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .formReservation__body {
    padding: 24px;

    @include media-down(lg) {
      padding: 16px;
    }

    &--step2 {
      min-height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    .body__form {
      display: flex;
      flex-direction: column;

      .form__row--namePair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 12px;
        margin-bottom: 20px;

        :deep(.formField) {
          margin-bottom: 0;
        }
      }

      &--step2 {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;

        .form__intro {
          margin: 0 0 20px 0;
          font-size: 14px;
          color: #6c757d;
        }

        .form__footer {
          margin-top: 0;
        }
      }

      .form__step2Main {
        flex: 1 1 auto;
      }

      .ticketBlock {
        padding: 16px 0;
        border-bottom: 1px solid #eee;

        &:last-of-type {
          border-bottom: none;
        }

        .ticketBlock__title {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #212529;
        }

        .ticketBlock__namePair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 12px;
          margin-bottom: 8px;

          :deep(.formField) {
            margin-bottom: 12px;
          }
        }

        .ticketBlock__type {
          margin-top: 4px;

          .type__label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #212529;
            margin-bottom: 6px;
          }

          .type__select {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            background: white;
            cursor: pointer;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;

            &:hover {
              border-color: #adb5bd;
            }

            &:focus {
              outline: 0;
              border-color: #86b7fe;
              box-shadow: 0 0 0 1px rgba(13, 110, 253, 0.22);
            }
          }
        }
      }

      .form__turnstileShell {
        flex-shrink: 0;
        width: 100%;
        margin-top: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        margin-top: 15px;
      }

      /** Zone à hauteur fixe : widget + consigne, ancrés en bas pour éviter les sauts de layout. */
      .form__turnstileInner {
        width: 100%;
        // height: 160px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        flex-shrink: 0;
        box-sizing: border-box;
        

        :deep(.turnstileField) {
          margin-top: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        :deep(.turnstileField__widget) {
          // min-height: 65px;
          display: flex;
          justify-content: center;
        }

        :deep(.turnstileField__hint) {
          margin: 6px 0 10px;
          max-width: 13rem;
          text-align: center;
          font-size: 13px;
          color: #6c757d;
          line-height: 1.45;
        }
      }

      .form__turnstileError {
        margin: 0 0 10px;
        min-height: 1.45em;
        font-size: 14px;
        line-height: 1.45;
        color: #dc3545;
        text-align: center;
        max-width: 22rem;
        opacity: 0;
        transition: opacity 0.28s ease;
        pointer-events: none;
        user-select: none;

        &--visible {
          opacity: 1;
          pointer-events: auto;
          user-select: text;
        }
      }

      .priceSummary {
        margin-top: 20px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;

        .priceSummary__title {
          margin: 0 0 10px 0;
          font-size: 13px;
          font-weight: 600;
          color: #495057;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .priceSummary__line {
          margin: 4px 0;
          font-size: 14px;
          color: #212529;
        }

        .priceSummary__total {
          margin: 12px 0 0 0;
          padding-top: 12px;
          border-top: 1px solid #dee2e6;
          font-size: 16px;
          font-weight: 700;
          color: #212529;
        }
      }

      .form__footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid #dee2e6;
        margin-top: auto;
      }
    }
  }
}

.formTurnstileFade-enter-active,
.formTurnstileFade-leave-active {
  transition: opacity 0.4s ease;
}

.formTurnstileFade-enter-from,
.formTurnstileFade-leave-to {
  opacity: 0;
}

@media (max-width: 575.98px) {
  .formReservation {
    .formReservation__header {
      padding: 16px 20px;
    }

    .formReservation__body {
      padding: 20px;

      .body__form {
        .form__row--namePair,
        .ticketBlock__namePair {
          grid-template-columns: 1fr;
        }

        .form__footer {
          padding: 12px 20px;
          flex-direction: column;
          gap: 8px;
        }
      }
    }
  }
}
</style>
