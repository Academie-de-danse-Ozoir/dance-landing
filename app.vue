<script setup lang="ts">
import { NARROW_VIEWPORT_MQ } from './constants'

/** Lenis n’a pas de mode « off » : sous `NARROW_VIEWPORT_MQ` on ne monte pas VueLenis (doc : destroy / pas d’instance). */
const narrowViewport = ref(
  import.meta.client && typeof window !== 'undefined'
    ? window.matchMedia(NARROW_VIEWPORT_MQ).matches
    : false
)

onMounted(() => {
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
  <ClientOnly>
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
</template>
