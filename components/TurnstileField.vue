<template>
  <div v-if="siteKey" class="turnstileField">
    <div ref="containerRef" class="turnstileField__widget" />
    <p v-if="hint" class="turnstileField__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'

const props = defineProps<{
  siteKey: string
  hint?: string
}>()

const emit = defineEmits<{
  'update:token': [token: string | null]
}>()

const containerRef = ref<HTMLElement | null>(null)
let widgetId: string | undefined

type TurnstileApi = {
  render: (container: HTMLElement | string, parameters: Record<string, unknown>) => string
  remove: (widgetId: string) => void
}

function getTurnstile(): TurnstileApi | undefined {
  return (globalThis as unknown as { turnstile?: TurnstileApi }).turnstile
}

function loadScript(): Promise<void> {
  if (document.querySelector('script[src*="turnstile/v0/api"]')) {
    return waitForTurnstile()
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.defer = true
    s.onload = () => waitForTurnstile().then(resolve)
    s.onerror = () => reject(new Error('Turnstile script load failed'))
    document.head.appendChild(s)
  })
}

function waitForTurnstile(): Promise<void> {
  return new Promise((resolve) => {
    const tick = () => {
      if (getTurnstile()) resolve()
      else requestAnimationFrame(tick)
    }
    tick()
  })
}

async function mountWidget() {
  if (!props.siteKey) return
  await nextTick()
  const el = containerRef.value
  const ts = getTurnstile()
  if (!el || !ts) return

  widgetId = ts.render(el, {
    sitekey: props.siteKey,
    callback: (token: string) => emit('update:token', token),
    'expired-callback': () => emit('update:token', null),
    'error-callback': () => emit('update:token', null)
  })
}

function destroyWidget() {
  const ts = getTurnstile()
  if (widgetId && ts) {
    try {
      ts.remove(widgetId)
    } catch {
      /* ignore */
    }
    widgetId = undefined
  }
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
}

onMounted(async () => {
  if (!props.siteKey) return
  try {
    await loadScript()
    await mountWidget()
  } catch (e) {
    console.error('[TurnstileField]', e)
  }
})

watch(
  () => props.siteKey,
  async (key) => {
    destroyWidget()
    emit('update:token', null)
    if (!key) return
    try {
      await loadScript()
      await mountWidget()
    } catch (e) {
      console.error('[TurnstileField]', e)
    }
  }
)

onBeforeUnmount(() => {
  destroyWidget()
  emit('update:token', null)
})
</script>

<style scoped lang="scss">
.turnstileField {
  margin-top: 0;
}

.turnstileField__widget {
  min-height: 65px;
}

.turnstileField__hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: #6c757d;
}
</style>
