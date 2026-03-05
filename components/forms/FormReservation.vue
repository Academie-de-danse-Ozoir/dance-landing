<template>
  <div v-if="show" class="form-reservation_overlay" @click.self="$emit('close')">
    <div class="form-reservation">
      <div class="form-reservation_header">
        <h2 class="header__title">{{ step === 1 ? content.home.modal.title : content.home.modal.step2Title }}</h2>
        <button type="button" class="header__close" @click="$emit('close')" :aria-label="content.home.modal.close">
          <span class="close__icon">&times;</span>
        </button>
      </div>

      <div class="form-reservation_body">
        <!-- Étape 1 : contact + répartition adultes/enfants (Suivant n’envoie pas le formulaire, pas de paiement) -->
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
          <div v-for="(ticket, idx) in ticketDetails" :key="ticket.seatId" class="ticket-block">
            <h3 class="ticket-block__title">{{ content.home.modal.place }} {{ ticket.seatLabel }}</h3>
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
            <div class="ticket-block__type">
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

          <div class="form__price-summary">
            <p class="price-summary__title">{{ content.home.modal.priceSummary }}</p>
            <template v-if="priceSummary.adultCount > 0">
              <p class="price-summary__line">{{ priceSummary.adultsLine }}</p>
            </template>
            <template v-if="priceSummary.childCount > 0">
              <p class="price-summary__line">{{ priceSummary.childrenLine }}</p>
            </template>
            <p class="price-summary__total">{{ content.home.modal.totalLabel }} : {{ priceSummary.totalAmount }}</p>
          </div>

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
}>()

const emit = defineEmits<{
  'close': []
  'next': []
  'back': []
  'submit': [payload: { form: FormData; ticketDetails: TicketDetail[] }]
  'update:form': [form: FormData]
  'field-blur': [key: string]
}>()

const ticketDetails = ref<TicketDetail[]>([])
const ticketErrors = ref<Record<number, { firstName?: string; lastName?: string }>>({})

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
  emit('submit', { form: props.form, ticketDetails: ticketDetails.value })
}
</script>

<style lang="scss" scoped>
.form-reservation_overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn 0.15s ease-out;
}

.form-reservation {
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

  .form-reservation_header {
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

  .form-reservation_body {
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

      .ticket-block {
        padding: 16px 0;
        border-bottom: 1px solid #eee;

        &:last-of-type {
          border-bottom: none;
        }

        .ticket-block__title {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #212529;
        }

        .ticket-block__type {
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

      .form__price-summary {
        margin-top: 20px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;

        .price-summary__title {
          margin: 0 0 10px 0;
          font-size: 13px;
          font-weight: 600;
          color: #495057;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .price-summary__line {
          margin: 4px 0;
          font-size: 14px;
          color: #212529;
        }

        .price-summary__total {
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
  .form-reservation {
    width: 95%;
    max-width: none;
    margin: 10px;

    .form-reservation_header {
      padding: 16px 20px;
    }

    .form-reservation_body {
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
