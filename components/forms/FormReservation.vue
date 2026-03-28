<template>
  <div v-if="show" class="formReservationOverlay" @click.self="$emit('close')">
    <div class="formReservation">
      <div class="formReservation__header">
        <h2 class="header__title">{{ step === 1 ? content.home.modal.title : content.home.modal.step2Title }}</h2>
        <button type="button" class="header__close" @click="$emit('close')" :aria-label="content.home.modal.close">
          <span class="close__icon">&times;</span>
        </button>
      </div>

      <div v-if="showReservationTimer" class="formReservation__timer" role="status">
        <p class="timer__title">{{ content.home.modal.reservationBannerTitle }}</p>
        <p class="timer__line">
          <span class="timer__label">{{ content.home.modal.reservationTimeLabel }}</span>
          <span class="timer__clock" aria-live="polite">{{ formattedReservationTime }}</span>
        </p>
        <button type="button" class="timer__cancel" @click="$emit('cancel-reservation')">
          {{ content.home.activeOrder.cancelReservation }}
        </button>
      </div>

      <div class="formReservation__body">
        <!-- Étape 1 : coordonnées ; hold + timer déjà créés au clic « Réserver » -->
        <form v-if="step === 1" class="body__form" @submit.prevent="onNext">
          <FormField
            v-for="field in formFields"
            :key="field.key"
            :field-key="field.key"
            :label="field.label"
            :type="field.type"
            :placeholder="field.placeholder"
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
              @click="$emit('close')"
            />
            <DefaultButton
              variant="primary"
              type="button"
              :label="isSubmitting ? content.home.modal.submitting : content.home.modal.next"
              :disabled="isSubmitting"
              @click="onNext"
            />
          </div>
        </form>

        <!-- Étape 2 : détails par billet (nom, prénom, adulte/enfant, place) -->
        <form v-else class="body__form body__form--step2" @submit.prevent="onSubmitStep2">
          <p class="form__intro">{{ content.home.modal.step2Intro }}</p>
          <div v-for="(ticket, idx) in ticketDetails" :key="ticket.seatId" class="ticketBlock">
            <h3 class="ticketBlock__title">{{ content.home.modal.place }} {{ ticket.seatLabel }}</h3>
            <FormField
              :field-key="`ticket-${idx}-firstName`"
              :label="content.home.modal.fields.firstName.label"
              type="text"
              :placeholder="content.home.modal.fields.firstName.placeholder"
              :model-value="ticket.firstName"
              :error="ticketErrors[idx]?.firstName"
              @update:model-value="updateTicketDetail(idx, 'firstName', $event)"
            />
            <FormField
              :field-key="`ticket-${idx}-lastName`"
              :label="content.home.modal.fields.lastName.label"
              type="text"
              :placeholder="content.home.modal.fields.lastName.placeholder"
              :model-value="ticket.lastName"
              :error="ticketErrors[idx]?.lastName"
              @update:model-value="updateTicketDetail(idx, 'lastName', $event)"
            />
            <div class="ticketBlock__type">
              <label class="type__label">{{ content.home.modal.ticketType }}</label>
              <select
                :value="ticket.ticketType"
                class="type__select"
                @change="updateTicketDetail(idx, 'ticketType', ($event.target as HTMLSelectElement).value as 'adult' | 'child')"
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

          <ClientOnly>
            <div v-if="turnstileSiteKey" class="form__turnstile">
              <TurnstileField
                :site-key="turnstileSiteKey"
                :hint="content.home.modal.turnstileHint"
                @update:token="onTurnstileToken"
              />
              <p v-if="turnstileError" class="form__turnstileError">{{ turnstileError }}</p>
            </div>
          </ClientOnly>

          <div class="form__footer">
            <DefaultButton
              variant="secondary"
              :label="content.home.modal.back"
              type="button"
              @click="$emit('back')"
            />
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
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import content from '../../locales/fr.json'
import { PRICE_ADULT_CENTS, PRICE_CHILD_CENTS } from '../../constants'
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

const props = defineProps<{
  show: boolean
  form: FormData
  seatCount: number
  step: 1 | 2
  /** Pour l’étape 2 : liste des sièges (id + label) dans l’ordre de la réservation */
  seatItems?: { id: string; label: string }[]
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  /** Bandeau décompte + annulation (hold créé au clic « Réserver »). */
  showReservationTimer: boolean
  formattedReservationTime: string
}>()

const config = useRuntimeConfig()
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

watch(
  () => props.step,
  (s) => {
    if (s === 1) {
      turnstileToken.value = null
      turnstileError.value = null
    }
  }
)

watch(
  () => [props.step, props.seatItems] as const,
  ([newStep, items]) => {
    if (newStep === 2 && items && items.length > 0 && ticketDetails.value.length !== items.length) {
      ticketDetails.value = items.map((s) => ({
        seatId: s.id,
        seatLabel: s.label,
        firstName: '',
        lastName: '',
        ticketType: 'adult' as const
      }))
      ticketErrors.value = {}
    }
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

const formFields = [
  { key: 'firstName' as const, label: content.home.modal.fields.firstName.label, type: 'text' as const, placeholder: content.home.modal.fields.firstName.placeholder },
  { key: 'lastName' as const, label: content.home.modal.fields.lastName.label, type: 'text' as const, placeholder: content.home.modal.fields.lastName.placeholder },
  { key: 'email' as const, label: content.home.modal.fields.email.label, type: 'email' as const, placeholder: content.home.modal.fields.email.placeholder },
  { key: 'phone' as const, label: content.home.modal.fields.phone.label, type: 'tel' as const, placeholder: content.home.modal.fields.phone.placeholder }
]

function updateField(key: keyof FormData, value: string) {
  emit('update:form', { ...props.form, [key]: value })
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
.formReservationOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn 0.15s ease-out;
}

.formReservation {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.3s ease-out;
  margin: auto;

  .formReservation__timer {
    flex-shrink: 0;
    padding: 14px 20px 16px;
    background: linear-gradient(180deg, #e7f1ff 0%, #dbeafe 100%);
    border-bottom: 1px solid #b6d4fe;
    text-align: center;
  }

  .timer__title {
    margin: 0 0 8px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #1e40af;
  }

  .timer__line {
    margin: 0 0 14px;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
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
  }

  .timer__cancel {
    display: inline-block;
    margin: 0 auto;
    padding: 8px 16px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #991b1b;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid #fecaca;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: #fff;
    }
  }

  .formReservation__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #dee2e6;

    .header__title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #212529;
    }

    .header__close {
      background: none;
      border: none;
      font-size: 28px;
      line-height: 1;
      color: #6c757d;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background-color: #f8f9fa;
        color: #212529;
      }

      .close__icon {
        display: block;
      }
    }
  }

  .formReservation__body {
    padding: 24px;
    overflow-y: auto;

    .body__form {
      display: flex;
      flex-direction: column;

      &--step2 {
        .form__intro {
          margin: 0 0 20px 0;
          font-size: 14px;
          color: #6c757d;
        }
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

        .ticketBlock__type {
          margin-top: 12px;

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
          }
        }
      }

      .form__turnstile {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .form__turnstileError {
        margin: 8px 0 0;
        font-size: 14px;
        color: #dc3545;
        text-align: center;
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
          padding-top: 10px;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 575.98px) {
  .formReservation {
    width: 95%;
    max-width: none;
    margin: 10px;

    .formReservation__header {
      padding: 16px 20px;
    }

    .formReservation__body {
      padding: 20px;

      .body__form .form__footer {
        padding: 12px 20px;
        flex-direction: column;
        gap: 8px;
      }
    }
  }
}
</style>
