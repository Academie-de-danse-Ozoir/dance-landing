<template>
  <div v-if="show" class="form-reservation__overlay" @click.self="$emit('close')">
    <div class="form-reservation">
      <div class="form-reservation__header">
        <h2 class="form-reservation__title">{{ content.home.modal.title }}</h2>
        <button type="button" class="form-reservation__close" @click="$emit('close')" :aria-label="content.home.modal.close">
          <span class="form-reservation__close-icon">&times;</span>
        </button>
      </div>

      <div class="form-reservation__body">
        <form class="form-reservation__form" @submit.prevent="$emit('submit')">
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

          <div class="form-reservation__footer">
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
import content from '../../locales/fr.json'
import FormField from './FormField.vue'
import DefaultButton from '../buttons/DefaultButton.vue'

type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

const props = defineProps<{
  show: boolean
  form: FormData
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

const formFields = [
  { key: 'firstName' as const, label: content.home.modal.fields.firstName.label, type: 'text' as const, placeholder: content.home.modal.fields.firstName.placeholder },
  { key: 'lastName' as const, label: content.home.modal.fields.lastName.label, type: 'text' as const, placeholder: content.home.modal.fields.lastName.placeholder },
  { key: 'email' as const, label: content.home.modal.fields.email.label, type: 'email' as const, placeholder: content.home.modal.fields.email.placeholder },
  { key: 'phone' as const, label: content.home.modal.fields.phone.label, type: 'tel' as const, placeholder: content.home.modal.fields.phone.placeholder }
]

function updateField(key: keyof FormData, value: string) {
  emit('update:form', { ...props.form, [key]: value })
}

function handleFieldBlur(key: string) {
  emit('field-blur', key)
}
</script>

<style lang="scss" scoped>
.form-reservation {
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    animation: fadeIn 0.15s ease-out;
  }

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

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #dee2e6;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #212529;
  }

  &__close {
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
  }

  &__close-icon {
    display: block;
  }

  &__body {
    padding: 24px;
    overflow-y: auto;
  }

  &__form {
    display: flex;
    flex-direction: column;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #dee2e6;
    margin-top: auto;
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

    &__header {
      padding: 16px 20px;
    }

    &__body {
      padding: 20px;
    }

    &__footer {
      padding: 12px 20px;
      flex-direction: column;
      gap: 8px;
    }
  }
}
</style>

