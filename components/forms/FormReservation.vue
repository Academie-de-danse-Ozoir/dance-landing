<template>
  <div v-if="show" class="form-reservation_overlay" @click.self="$emit('close')">
    <div class="form-reservation">
      <div class="form-reservation_header">
        <h2 class="header__title">{{ content.home.modal.title }}</h2>
        <button type="button" class="header__close" @click="$emit('close')" :aria-label="content.home.modal.close">
          <span class="close__icon">&times;</span>
        </button>
      </div>

      <div class="form-reservation_body">
        <form class="body__form" @submit.prevent="$emit('submit')">
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

          <div class="form__seats">
            <FormFieldSelect
              v-if="seatCount > 0"
              field-key="adultCount"
              :label="content.home.modal.fields.adultCount.label"
              :model-value="form.adultCount"
              :options="seatCountOptions"
              :error="errors.adultCount"
              :touched="touched.adultCount"
              @update:model-value="updateAdultCount"
              @blur="handleFieldBlur('adultCount')"
            />
            <FormFieldSelect
              v-if="seatCount > 0"
              field-key="childCount"
              :label="content.home.modal.fields.childCount.label"
              :model-value="form.childCount"
              :options="seatCountOptions"
              :error="errors.childCount"
              :touched="touched.childCount"
              @update:model-value="updateChildCount"
              @blur="handleFieldBlur('childCount')"
            />
          </div>

          <div class="form__footer">
            <DefaultButton
              variant="secondary"
              :label="content.home.modal.cancel"
              @click="$emit('close')"
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
import { computed } from 'vue'
import content from '../../locales/fr.json'
import FormField from './FormField.vue'
import FormFieldSelect from './FormFieldSelect.vue'
import DefaultButton from '../buttons/DefaultButton.vue'

export type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  adultCount: number
  childCount: number
}

const props = defineProps<{
  show: boolean
  form: FormData
  seatCount: number
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  'close': []
  'submit': []
  'update:form': [form: FormData]
  'field-blur': [key: string]
}>()

const seatCountOptions = computed(() =>
  Array.from({ length: props.seatCount + 1 }, (_, i) => ({ value: i, label: String(i) }))
)

const formFields = [
  { key: 'firstName' as const, label: content.home.modal.fields.firstName.label, type: 'text' as const, placeholder: content.home.modal.fields.firstName.placeholder },
  { key: 'lastName' as const, label: content.home.modal.fields.lastName.label, type: 'text' as const, placeholder: content.home.modal.fields.lastName.placeholder },
  { key: 'email' as const, label: content.home.modal.fields.email.label, type: 'email' as const, placeholder: content.home.modal.fields.email.placeholder },
  { key: 'phone' as const, label: content.home.modal.fields.phone.label, type: 'tel' as const, placeholder: content.home.modal.fields.phone.placeholder }
]

function updateField(key: keyof FormData, value: string) {
  emit('update:form', { ...props.form, [key]: value })
}

function updateAdultCount(value: number) {
  emit('update:form', {
    ...props.form,
    adultCount: value,
    childCount: props.seatCount - value
  })
}

function updateChildCount(value: number) {
  emit('update:form', {
    ...props.form,
    childCount: value,
    adultCount: props.seatCount - value
  })
}

function handleFieldBlur(key: string) {
  emit('field-blur', key)
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
