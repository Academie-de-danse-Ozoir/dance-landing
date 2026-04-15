<template>
  <div ref="parallaxMediaRef" class="parallaxMediaElt">
    <img
      ref="mediaRef"
      class="image"
      :src="props.url || props.src"
      :alt="props.alt"
      :loading="props.loading"
      draggable="false"
      @dragstart.prevent
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  url: { type: String, default: null },
  src: { type: String, default: null },

  // Média interne (masque)
  hasParallaxMask: { type: Boolean, default: true },
  parallaxMaskAmount: { type: Number, default: 9 },
  parallaxMaskRemapMin: { type: Number, default: -1 },
  parallaxMaskRemapMax: { type: Number, default: 1 },
  scaleOffsetAmount: { type: Number, default: 1.1 },

  // Wrapper externe (position)
  hasParallaxPosition: { type: Boolean, default: false },
  parallaxPositionAmount: { type: Number, default: -10 },
  parallaxPositionRemapMin: { type: Number, default: -1 },
  parallaxPositionRemapMax: { type: Number, default: 1 },

  alt: { type: String, default: '' },
  loading: { type: String, default: 'lazy' }
})

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function remap(value, low1, high1, low2, high2) {
  return low2 + ((value - low1) * (high2 - low2)) / (high1 - low1)
}

const parallaxMediaRef = ref()
const mediaRef = ref()

let rectTop = 0
let rectHeight = 0

function measureRect() {
  const el = parallaxMediaRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  rectTop = rect.top + window.scrollY
  rectHeight = rect.height
}

let lastWrapperTransform = ''
let lastMediaTransform = ''

function applyTransforms() {
  if (!parallaxMediaRef.value || !mediaRef.value) return

  const scrollY = window.scrollY
  const startValue = rectTop - window.innerHeight
  const endValue = rectTop + rectHeight

  // --- Wrapper ---
  let wStr = ''
  if (props.hasParallaxPosition) {
    const parallaxPositionProgress =
      remap(
        scrollY,
        startValue,
        endValue,
        props.parallaxPositionRemapMin,
        props.parallaxPositionRemapMax
      ) * props.parallaxPositionAmount

    wStr = `translateY(${parallaxPositionProgress}%)`
  }

  if (wStr !== lastWrapperTransform) {
    parallaxMediaRef.value.style.transform = wStr
    lastWrapperTransform = wStr
  }

  // --- Média ---
  let mStr = ''
  if (props.hasParallaxMask) {
    const parallaxMaskProgress =
      remap(scrollY, startValue, endValue, props.parallaxMaskRemapMin, props.parallaxMaskRemapMax) *
      props.parallaxMaskAmount

    mStr = `translateY(${parallaxMaskProgress}%) scale(${props.scaleOffsetAmount})`
  } else if (props.scaleOffsetAmount !== 1) {
    mStr = `scale(${props.scaleOffsetAmount})`
  }

  if (mStr !== lastMediaTransform) {
    mediaRef.value.style.transform = mStr
    lastMediaTransform = mStr
  }
}

function handleScroll() {
  applyTransforms()
}

function handleResize() {
  measureRect()
  applyTransforms()
}

onMounted(() => {
  if (import.meta.server) return
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })

  measureRect()
  applyTransforms()
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
  }
})

defineExpose({
  mediaRef
})
</script>

<style lang="scss" scoped>
.parallaxMediaElt {
  overflow: hidden;
  position: relative;
  will-change: transform;

  .image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    will-change: transform;
    -webkit-user-drag: none;
    user-select: none;
  }
}
</style>
