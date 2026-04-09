<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NARROW_VIEWPORT_MQ } from './constants'
import AppLoader from '~/components/AppLoader.vue'
import AppHeader from '~/components/AppHeader.vue'
import OrientationGuard from '~/components/OrientationGuard.vue'

/** Lenis n’a pas de mode « off » : sous `NARROW_VIEWPORT_MQ` on ne monte pas VueLenis (doc : destroy / pas d’instance). */
const narrowViewport = ref(
  import.meta.client && typeof window !== 'undefined'
    ? window.matchMedia(NARROW_VIEWPORT_MQ).matches
    : false
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
  onUnmounted(() => mq.removeEventListener('change', sync))
})
</script>

<template>
  <div class="appContainer">
    <AppLoader />
    <ClientOnly>
      <AppHeader />
      <OrientationGuard />
      <VueLenis v-if="!narrowViewport" root :auto-raf="true">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </VueLenis>
      <NuxtLayout v-else>
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
.appContainer {
  position: relative;
  min-height: 100vh;
}
</style>

