<template>
  <div class="form-field">
    <label :for="fieldKey" class="form-field_label">
      {{ label }} <span class="label__required">*</span>
    </label>
    <input
      :id="fieldKey"
      :value="modelValue"
      :type="type"
      class="form-field_input"
      :class="{
        'form-field_input--invalid': error,
        'form-field_input--valid': touched && !error
      }"
      :placeholder="placeholder"
      @blur="$emit('blur')"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <div class="form-field_feedback">
      <span v-if="error" class="feedback__error">{{ error }}</span>
      <span v-else class="feedback__placeholder">&nbsp;</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  fieldKey: string
  label: string
  type: string
  placeholder: string
  modelValue: string
  error?: string
  touched?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
}>()
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

    &::placeholder {
      color: #6c757d;
      opacity: 1;
    }

    &--invalid {
      border-color: #dc3545;
      padding-right: calc(1.5em + 0.75rem);
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6 .4.4.4-.4m0 4.8-.4-.4-.4.4'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right calc(0.375em + 0.1875rem) center;
      background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);

      &:focus {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
      }
    }

    &--valid {
      border-color: #198754;
      padding-right: calc(1.5em + 0.75rem);
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='m2.3 6.73.98-.98-.98-.98-.98.98.98.98zm1.4-3.46L2.3 4.77l-.7-.7L3.7 2.27l.7.7z'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right calc(0.375em + 0.1875rem) center;
      background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);

      &:focus {
        border-color: #198754;
        box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
      }
    }
  }

  .form-field_feedback {
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
