<template>
  <main class="notFoundPage">
    <div class="notFoundPage__inner">
      <p class="notFoundPage__code" aria-hidden="true">{{ copy.code }}</p>
      <h1 class="notFoundPage__title">{{ copy.title }}</h1>
      <p class="notFoundPage__description" v-html="copy.description" />
      <DefaultButton
        type="button"
        variant="primary"
        :label="copy.ctaHome"
        class="notFoundPage__cta"
        @click="goHome"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { navigateTo, useHead } from '#app'
import fr from '~/locales/fr.json'
import DefaultButton from '~/components/buttons/DefaultButton.vue'

const copy = fr.errors.notFound

useHead({
  title: `${copy.title} — ${fr.brand.spectacleName}`
})

function goHome() {
  void navigateTo('/')
}
</script>

<style lang="scss" scoped>
.notFoundPage {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(100px, 14vh, 140px) clamp(20px, 4vw, 36px) 48px;
  box-sizing: border-box;
  background: #f4f5f8;
}

.notFoundPage__inner {
  width: 100%;
  max-width: 480px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.notFoundPage__code {
  margin: 0 0 8px;
  font-family: $font-family-display;
  font-size: clamp(4.5rem, 18vw, 7rem);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.04em;
  color: rgba(26, 26, 46, 0.12);
  user-select: none;
}

.notFoundPage__title {
  margin: 0 0 12px;
  font-family: $font-family-display;
  font-size: clamp(1.75rem, 5vw, 2.25rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: #1a1a2e;
  line-height: 1.15;
}

.notFoundPage__description {
  margin: 0 0 32px;
  max-width: 36ch;
  font-family: $font-family-text;
  font-size: 1rem;
  line-height: 1.55;
  color: #57534e;
}

.notFoundPage__cta {
  min-width: min(100%, 260px);
}
</style>
