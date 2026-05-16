<template>
  <NuxtLayout name="default">
    <Transition name="page-opacity" mode="out-in" appear>
      <main v-if="visible" key="error" class="errorPage">
        <div class="errorPage__inner">
          <h1 class="errorPage__title">{{ copy.title }}</h1>
          <p class="errorPage__description">{{ copy.description }}</p>
          <DefaultButton
            type="button"
            variant="primary"
            :label="copy.ctaHome"
            class="errorPage__cta"
            @click="goHome"
          />
        </div>
      </main>
    </Transition>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { clearError, useHead } from '#app'
import fr from './locales/fr.json'
import DefaultButton from './components/buttons/DefaultButton.vue'

const PAGE_TRANSITION_MS = 600

defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
  }
}>()

const visible = ref(true)
const copy = fr.errors.generic

useHead({
  title: () => `${copy.title} — ${fr.brand.spectacleName}`
})

async function goHome() {
  visible.value = false
  await new Promise((resolve) => setTimeout(resolve, PAGE_TRANSITION_MS))
  await clearError({ redirect: '/' })
}
</script>

<style lang="scss" scoped>
.errorPage {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(100px, 14vh, 140px) clamp(20px, 4vw, 36px) 48px;
  box-sizing: border-box;
  background: #f4f5f8;
}

.errorPage__inner {
  width: 100%;
  max-width: 480px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.errorPage__title {
  margin: 0 0 12px;
  font-family: $font-family-display;
  font-size: clamp(1.75rem, 5vw, 2.25rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: #1a1a2e;
  line-height: 1.15;
}

.errorPage__description {
  margin: 0 0 32px;
  max-width: 36ch;
  font-family: $font-family-text;
  font-size: 1rem;
  line-height: 1.55;
  color: #57534e;
}

.errorPage__cta {
  min-width: min(100%, 260px);
}
</style>
