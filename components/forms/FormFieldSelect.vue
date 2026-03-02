<template>
  <div class="form-field">
    <label :for="fieldKey" class="form-field_label">
      {{ label }} <span class="label__required">*</span>
    </label>
    <div class="form-field_select-wrap">
      <select
        :id="fieldKey"
        :value="modelValue"
        class="form-field_input form-field_select"
        :class="{
          'form-field_input--invalid': error,
          'form-field_input--valid': touched && !error
        }"
        @blur="$emit('blur')"
        @change="onChange"
      >
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <span class="select-wrap__arrow" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="3" y1="5" x2="6" y2="8"/>
          <line x1="6" y1="8" x2="9" y2="5"/>
        </svg>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  fieldKey: string
  label: string
  modelValue: number
  options: { value: number; label: string }[]
  error?: string
  touched?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'blur': []
}>()

function onChange(e: Event) {
  const value = Number((e.target as HTMLSelectElement).value)
  emit('update:modelValue', value)
}
</script>

<style lang="scss" scoped>
.form-field {
  margin-bottom: 20px;

  .form-field_label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #212529;

    .label__required {
      color: #dc3545;
    }
  }

  .form-field_select-wrap {
    position: relative;
    display: block;

    .form-field_input.form-field_select {
      cursor: pointer;
      appearance: none;
      padding-right: 2.25rem;
      display: block;
      width: 100%;
    }

    .select-wrap__arrow {
      position: absolute;
      top: 50%;
      right: 12px;
      transform: translateY(-50%);
      pointer-events: none;
      color: #212529;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }

    &:focus-within .select-wrap__arrow {
      transform: translateY(-50%) rotate(180deg);
    }
  }

  .form-field_input {
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
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    box-sizing: border-box;

    &:focus {
      outline: 0;
      border-color: #86b7fe;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    }

    &--invalid {
      border-color: #dc3545;

      &:focus {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
      }
    }

    &--valid {
      border-color: #198754;

      &:focus {
        border-color: #198754;
        box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
      }
    }
  }
}
</style>
