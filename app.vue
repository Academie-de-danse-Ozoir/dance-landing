<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { NARROW_VIEWPORT_MQ } from './constants'
import AppLoader from '~/components/AppLoader.vue'
import AppHeader from '~/components/AppHeader.vue'
import OrientationGuard from '~/components/OrientationGuard.vue'
import Lenis from 'lenis'
import { useLenis } from '~/composables/useLenis'

/** État du viewport pour désactiver Lenis sur mobile. */
const narrowViewport = ref(
  import.meta.client && typeof window !== 'undefined'
    ? window.matchMedia(NARROW_VIEWPORT_MQ).matches
    : false
)

const lenisInstance = useLenis()
let rafId: number | null = null

function updateLenis(time: number) {
  lenisInstance.value?.raf(time)
  rafId = requestAnimationFrame(updateLenis)
}

function initLenis() {
  if (import.meta.server) return
  if (narrowViewport.value) {
    destroyLenis()
    return
  }

  if (!lenisInstance.value) {
    lenisInstance.value = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true
    })
    rafId = requestAnimationFrame(updateLenis)
  }
}

function destroyLenis() {
  if (lenisInstance.value) {
    lenisInstance.value.destroy()
    lenisInstance.value = null
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

onMounted(() => {
  if (import.meta.client && typeof window !== 'undefined') {
    window.history.scrollRestoration = 'manual'
  }

  const mq = window.matchMedia(NARROW_VIEWPORT_MQ)
  const sync = () => {
    narrowViewport.value = mq.matches
  }
  sync()
  mq.addEventListener('change', sync)

  initLenis()

  onUnmounted(() => {
    mq.removeEventListener('change', sync)
    destroyLenis()
  })
})

// On recréé ou détruit Lenis si le breakpoint est franchi
watch(narrowViewport, (isNarrow) => {
  if (isNarrow) {
    destroyLenis()
  } else {
    initLenis()
  }
})
</script>

<template>
  <div class="appContainer">
    <AppLoader />
    <ClientOnly>
      <AppHeader />
      <OrientationGuard />

      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>

      <template #fallback>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </template>
    </ClientOnly>
  </div>
</template>

<style lang="scss">
@import 'lenis/dist/lenis.css';

.appContainer {
  position: relative;
  min-height: 100vh;
}
</style>
