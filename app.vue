<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute } from '#app'
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

const route = useRoute()
const lenisInstance = useLenis()
let rafId: number | null = null

/** Tout le préfixe `/admin` : scroll verrouillé, pas de Lenis. */
const isAdminBackofficeRoute = computed(() => {
  const p = route.path.replace(/\/$/, '') || '/'
  return p === '/admin' || p.startsWith('/admin/')
})

/** Billetterie orga seule : pas de header (logo géré dans BookingBlock). */
const hideAppHeader = computed(() => {
  const p = route.path.replace(/\/$/, '') || '/'
  return p === '/admin'
})

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

watch(
  isAdminBackofficeRoute,
  (fullscreen) => {
    if (!import.meta.client) return
    if (fullscreen) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      destroyLenis()
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      if (!narrowViewport.value) {
        initLenis()
      }
    }
  },
  { flush: 'post', immediate: true }
)

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

  const p = route.path.replace(/\/$/, '') || '/'
  if (!(p === '/admin' || p.startsWith('/admin/'))) {
    initLenis()
  }

  onUnmounted(() => {
    mq.removeEventListener('change', sync)
    destroyLenis()
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
  })
})

// On recréé ou détruit Lenis si le breakpoint est franchi
watch(narrowViewport, (isNarrow) => {
  if (isNarrow) {
    destroyLenis()
  } else if (!isAdminBackofficeRoute.value) {
    initLenis()
  }
})
</script>

<template>
  <div class="appContainer">
    <AppLoader />
    <ClientOnly>
      <AppHeader v-if="!hideAppHeader" />
      <OrientationGuard />
    </ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style lang="scss">
@import 'lenis/dist/lenis.css';

.appContainer {
  position: relative;
  min-height: 100vh;
}
</style>
