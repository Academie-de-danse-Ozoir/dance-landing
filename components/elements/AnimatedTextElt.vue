<template>
  <component :is="tag" ref="animatedTextEltRef" class="animatedTextElt">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, onUpdated, ref } from 'vue'

let gsapModule: typeof import('gsap') | null = null
let SplitTextCtor: typeof import('gsap/SplitText').SplitText | null = null
let CustomEaseCtor: typeof import('gsap/CustomEase').CustomEase | null = null

export type AnimatedTextTag =
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'div'
  | 'span'
  | 'blockquote'
  | 'cite'

const props = withDefaults(
  defineProps<{
    tag?: AnimatedTextTag
    delay?: number
  }>(),
  {
    tag: 'div',
    delay: 0
  }
)

const animatedTextEltRef = ref<HTMLElement | null>(null)

let splitInstance: InstanceType<typeof import('gsap/SplitText').SplitText> | null = null
let revealTimeline: gsap.core.Timeline | null = null

let isVisible = false
let initDone = false
let prevTextContent = ''

/** Position absolue du bloc (coordonnées document). */
let rectTop = 0
let rectHeight = 0

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function contentSnapshot(el: HTMLElement) {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function setAbsoluteRect(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  rectTop = rect.top + window.scrollY
  rectHeight = rect.height
}

function computeVisibleTrigger(scrollY: number) {
  const ih = window.innerHeight
  const startValue = rectTop - ih
  const endValue = rectTop + rectHeight
  const raw = (scrollY - startValue) / (endValue - startValue)
  return Number(clamp01(raw).toFixed(5))
}

function splitByLines() {
  const el = animatedTextEltRef.value
  if (!el || !SplitTextCtor || !gsapModule) return
  if (splitInstance) destroy()

  splitInstance = SplitTextCtor.create(el, { type: 'lines' })
  gsapModule.default.set(splitInstance.lines, { yPercent: 100, opacity: 0 })
}

function playReveal() {
  if (!splitInstance?.lines?.length || !gsapModule) return

  revealTimeline?.kill()

  const gsap = gsapModule.default

  revealTimeline = gsap.timeline()
  revealTimeline.fromTo(
    splitInstance.lines,
    { yPercent: 100 },
    {
      yPercent: 0,
      duration: 0.8,
      ease: 'reveal',
      stagger: 0.06
    },
    props.delay
  )

  revealTimeline.fromTo(
    splitInstance.lines,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.inOut',
      stagger: 0.06
    },
    props.delay
  )
}

function handleScroll() {
  if (!splitInstance?.lines?.length) return

  const scrollY = window.scrollY
  const visibleTrigger = computeVisibleTrigger(scrollY)

  if (visibleTrigger > 0 && !isVisible) {
    playReveal()
    isVisible = true
  }
  if (visibleTrigger <= 0) {
    isVisible = false
  }
}

function destroy() {
  revealTimeline?.kill()
  revealTimeline = null
  if (splitInstance?.lines?.length && gsapModule) {
    gsapModule.default.killTweensOf(splitInstance.lines)
  }
  splitInstance?.revert()
  splitInstance = null
}

function handleResize() {
  if (!animatedTextEltRef.value) return

  const wasVisible = isVisible

  setAbsoluteRect(animatedTextEltRef.value)
  splitByLines()

  const visibleTrigger = computeVisibleTrigger(window.scrollY)
  isVisible = false

  if (wasVisible && visibleTrigger > 0) {
    playReveal()
    isVisible = true
  }

  if (animatedTextEltRef.value) prevTextContent = contentSnapshot(animatedTextEltRef.value)
}

function resetForNewContent() {
  const el = animatedTextEltRef.value
  if (!el) return

  revealTimeline?.kill()
  revealTimeline = null
  destroy()
  setAbsoluteRect(el)
  splitByLines()
  prevTextContent = contentSnapshot(el)
  isVisible = false
  handleScroll()
}

onMounted(async () => {
  if (import.meta.server) return

  /* Import dynamique côté client uniquement — évite les soucis SSR. */
  const [gsapMod, splitMod, customEaseMod] = await Promise.all([
    import('gsap'),
    import('gsap/SplitText'),
    import('gsap/CustomEase')
  ])

  gsapModule = gsapMod
  SplitTextCtor = splitMod.SplitText ?? (splitMod as any).default
  CustomEaseCtor = customEaseMod.CustomEase ?? (customEaseMod as any).default

  const gsap = gsapMod.default

  gsap.registerPlugin(CustomEaseCtor!)
  gsap.registerPlugin(SplitTextCtor!)

  CustomEaseCtor!.create('reveal', '.4,0,0,1')

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })

  nextTick(() => {
    requestAnimationFrame(() => {
      const el = animatedTextEltRef.value
      if (!el) return
      setAbsoluteRect(el)
      splitByLines()
      prevTextContent = contentSnapshot(el)
      handleScroll()
      initDone = true
    })
  })
})

onUpdated(() => {
  if (!initDone) return
  nextTick(() => {
    const el = animatedTextEltRef.value
    if (!el) return
    const nextSnap = contentSnapshot(el)
    if (nextSnap === prevTextContent) return
    resetForNewContent()
  })
})

onUnmounted(() => {
  destroy()
  if (import.meta.client) {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
  }
})
</script>
