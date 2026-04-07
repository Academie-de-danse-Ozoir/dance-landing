<template>
  <div class="formField">
    <label :for="fieldKey" class="formField__label">
      {{ label }} <span class="label__required">*</span>
    </label>
    <input
      :id="fieldKey"
      :value="modelValue"
      :type="type"
      :maxlength="maxlength"
      :inputmode="inputmode"
      class="formField__input"
      :class="{
        'formField__input--invalid': error,
        'formField__input--valid': touched && !error
      }"
      :placeholder="placeholder"
      @blur="$emit('blur')"
      @keydown="onKeydown"
      @input="onInput"
    />
    <div class="formField__feedback">
      <Transition name="errorFade" mode="out-in">
        <span v-if="error" key="err" class="feedback__error">{{ error }}</span>
        <span v-else key="ph" class="feedback__placeholder">&nbsp;</span>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isAllowedPhoneKeyEvent, normalizePhoneKeyboardInput } from '../../utils/phoneInput'

const props = defineProps<{
  fieldKey: string
  label: string
  type: string
  placeholder: string
  modelValue: string
  error?: string
  touched?: boolean
  /** Longueur max du texte affiché (ex. téléphone formaté). */
  maxlength?: number
  /** Saisie optimisée (ex. `numeric` pour le téléphone). */
  inputmode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'search' | 'decimal' | 'none'
  /** Chiffres uniquement (saisie + collage) ; max 10 chiffres avant formatage parent. */
  digitsOnly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
}>()

function onKeydown(e: KeyboardEvent) {
  if (!props.digitsOnly) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const nav = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End'
  ]
  if (nav.includes(e.key)) return
  if (isAllowedPhoneKeyEvent(e)) return
  if (e.key.length === 1) {
    e.preventDefault()
  }
}

function onInput(e: Event) {
  const t = e.target as HTMLInputElement
  let v = t.value
  if (props.digitsOnly) {
    v = normalizePhoneKeyboardInput(v)
  }
  emit('update:modelValue', v)
}
</script>

<style lang="scss" scoped>
.formField {
  margin-bottom: 20px;

  .formField__label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #212529;

    .label__required {
      color: #dc3545;
    }
  }

  .formField__input {
    display: block;
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    color: #212529;
    background-color: #fff;
    border: 1px solid #ced4da;
    border-radius: 6px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    box-sizing: border-box;

    &:hover:not(:focus):not(.formField__input--invalid):not(.formField__input--valid) {
      border-color: #adb5bd;
    }

    &:focus {
      outline: 0;
      border-color: #86b7fe;
      box-shadow: 0 0 0 1px rgba(13, 110, 253, 0.22);
    }

    &::placeholder {
      color: #6c757d;
      opacity: 0.5;
    }

    &--invalid {
      border-color: #dc3545;

      &:focus {
        border-color: #dc3545;
        box-shadow: 0 0 0 1px rgba(220, 53, 69, 0.22);
      }
    }

    &--valid {
      border-color: #198754;

      &:focus {
        border-color: #198754;
        box-shadow: 0 0 0 1px rgba(25, 135, 84, 0.22);
      }
    }
  }

  .formField__feedback {
    display: block;
    width: 100%;
    margin-top: 6px;
    min-height: 20px;
    line-height: 1.4;

    .feedback__error {
      font-size: 13px;
      color: #dc3545;
    }

    .feedback__placeholder {
      visibility: hidden;
    }
  }
}
</style>
