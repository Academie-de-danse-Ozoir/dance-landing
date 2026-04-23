<template>
  <section
    ref="heroBlockRef"
    :id="HOME_TOP_SECTION_ID"
    class="heroBlock"
    aria-labelledby="heroBlockTitle"
  >
    <ParallaxMediaElt
      class="heroBlock__bg"
      :class="{ 'heroBlock__bg--reveal': isBgRevealed }"
      src="/images/4.jpg"
      :parallax-mask-amount="25"
      loading="eager"
      aria-hidden="true"
    />
    <div class="heroBlock__overlay" aria-hidden="true" />
    <div class="heroBlock__inner">
      <AnimatedTextElt
        ref="kickerRef"
        tag="p"
        class="heroBlock__kicker"
        manual
        :delay="0"
        :duration="1"
      >
        {{ kicker }}
      </AnimatedTextElt>

      <AnimatedTextElt
        id="heroBlockTitle"
        ref="titleRef"
        tag="h1"
        class="heroBlock__title"
        manual
        :delay="0.06"
        :duration="1"
      >
        {{ title }}
      </AnimatedTextElt>

      <AnimatedTextElt
        ref="subtitleRef"
        tag="p"
        class="heroBlock__subtitle"
        manual
        :delay="0.18"
        :duration="1"
      >
        {{ subtitle }}
      </AnimatedTextElt>
      <div class="heroBlock__ctaWrapper">
        <div class="heroBlock__ctaReveal" :class="{ 'heroBlock__ctaReveal--reveal': isCtaVisible }">
          <button
            v-if="ctaBookingNow"
            type="button"
            class="heroBlock__cta"
            @pointerdown="handleTap"
            @click="scrollToBookingSlow"
          >
            {{ ctaBookingNow }}
          </button>
        </div>
        <div
          class="heroBlock__ctaReveal heroBlock__ctaReveal--late"
          :class="{ 'heroBlock__ctaReveal--reveal': isCtaVisible }"
        >
          <button
            v-if="ctaScroll"
            type="button"
            class="heroBlock__cta heroBlock__cta--withArrow"
            @pointerdown="handleTap"
            @click="scrollToNext"
          >
            <span>{{ ctaScroll }}</span>
            <span class="heroBlock__ctaArrow" aria-hidden="true">↓</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { HOME_TOP_SECTION_ID, SEAT_SELECTION_SECTION_ID } from '../../constants'
import { useLenis } from '../../composables/useLenis'
import ParallaxMediaElt from '../elements/ParallaxMediaElt.vue'
import AnimatedTextElt from '../elements/AnimatedTextElt.vue'
import { useAppLoader } from '../../composables/useAppLoader'
import { cancelAndAnimate, heroCtaTapKeyframes, DEFAULT_BUTTON_TAP_MS } from '../../utils/tapPulse'

defineProps<{
  kicker: string
  title: string
  subtitle: string
  ctaScroll?: string
  ctaBookingNow?: string
}>()

const { isRevealed } = useAppLoader()
const lenis = useLenis()
const isBookingJumpInProgress = ref(false)

// On détecte si c'est une visite retour (déjà révélé au montage)
const isFastMode = ref(false)

// État local pour forcer la transition du bouton et de l'image même lors d'un retour
const isCtaVisible = ref(false)
const isBgRevealed = ref(false)

const kickerRef = ref<InstanceType<typeof AnimatedTextElt> | null>(null)
const titleRef = ref<InstanceType<typeof AnimatedTextElt> | null>(null)
const subtitleRef = ref<InstanceType<typeof AnimatedTextElt> | null>(null)
const heroBlockRef = ref<HTMLElement | null>(null)
let heroTop = 0
let heroHeight = 0

function measureHeroBounds() {
  const heroEl = heroBlockRef.value
  if (!heroEl) return
  const rect = heroEl.getBoundingClientRect()
  heroTop = rect.top + window.scrollY
  heroHeight = rect.height
}

function triggerAllAnimations() {
  if (!isRevealed.value) return

  // On attend un micro-délai pour que le masque blanc soit totalement invisible
  setTimeout(() => {
    kickerRef.value?.playReveal()
    titleRef.value?.playReveal()
    subtitleRef.value?.playReveal()

    // On rend le wrapper et le bg "visible/stables" dès maintenant
    isCtaVisible.value = true
    isBgRevealed.value = true
  }, 50)
}

watch(isRevealed, (val) => {
  if (val) triggerAllAnimations()
})

onMounted(() => {
  measureHeroBounds()
  window.addEventListener('resize', measureHeroBounds, { passive: true })

  // Si déjà révélé (ex: navigation inter-page), on active le mode rapide
  if (isRevealed.value) {
    isCtaVisible.value = false
    isBgRevealed.value = false // Reset pour redéclencher le dézoom
    triggerAllAnimations()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', measureHeroBounds)
})

function scrollToNext() {
  if (!heroHeight) measureHeroBounds()
  const heroBottom = heroTop + heroHeight

  const l = lenis.value
  if (l) {
    l.scrollTo(heroBottom)
  } else {
    window.scrollTo({ top: heroBottom, behavior: 'smooth' })
  }
}

function scrollToBookingSlow() {
  if (isBookingJumpInProgress.value) return
  const bookingEl = document.getElementById(SEAT_SELECTION_SECTION_ID)
  if (!bookingEl) return
  isBookingJumpInProgress.value = true
  const FADE_OUT_MS = 380
  const FADE_IN_MS = 620
  const appRoot = document.querySelector('.appContainer') as HTMLElement | null

  if (appRoot) {
    appRoot.style.transition = `opacity ${FADE_OUT_MS}ms ease`
    appRoot.style.opacity = '0'
  }

  window.setTimeout(() => {
    const l = lenis.value
    if (l) {
      l.scrollTo(bookingEl, { offset: 0, immediate: true, force: true })
    } else {
      const top = bookingEl.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top, behavior: 'auto' })
    }

    requestAnimationFrame(() => {
      if (appRoot) {
        appRoot.style.transition = `opacity ${FADE_IN_MS}ms ease`
        appRoot.style.opacity = '1'
      }
      window.setTimeout(() => {
        if (appRoot) {
          appRoot.style.transition = ''
          appRoot.style.opacity = ''
        }
        isBookingJumpInProgress.value = false
      }, FADE_IN_MS)
    })
  }, FADE_OUT_MS)
}

function handleTap(e: PointerEvent) {
  if (e.pointerType !== 'touch') return
  const el = e.currentTarget as HTMLElement
  if (!el) return
  cancelAndAnimate(el, heroCtaTapKeyframes(), DEFAULT_BUTTON_TAP_MS)
}
</script>

<style lang="scss" scoped>
.heroBlock {
  position: relative;
  min-height: 100dvh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  overflow: hidden;
  font-family: $font-family-text;
  user-select: none;
}

.heroBlock__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-color: #2d1f4e;
  transform: scale(1.5); // Départ zoomé
  transition: transform 2.25s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;

  &--reveal {
    transform: scale(1); // Dézoom au reveal
  }
}

.heroBlock__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    165deg,
    rgba(10, 8, 22, 0.55) 0%,
    rgba(15, 12, 28, 0.75) 40%,
    rgba(15, 12, 28, 0.88) 100%
  );
}

.heroBlock__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 840px;
  margin: 0 auto;
  padding: clamp(48px, 12vh, 120px) clamp(24px, 5vw, 48px);
  text-align: center;
}

.heroBlock__kicker {
  margin: 0 0 24px 0;
  @include apply-font(label-s);
  color: rgba(255, 255, 255, 0.72);
}

.heroBlock__title {
  margin: 0 0 24px 0;
  text-shadow: 0 4px 40px rgba(0, 0, 0, 0.35);
  @include apply-font(title-xl);
}

.heroBlock__subtitle {
  margin: 0 0 40px 0;
  max-width: 34rem;
  margin-left: auto;
  margin-right: auto;
  color: rgba(255, 255, 255, 0.88);
  @include apply-font(text-l);
}

.heroBlock__ctaWrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.heroBlock__ctaReveal {
  opacity: 0;
  transform: translateY(50px);
  transition:
    opacity 1.2s ease 0.675s,
    transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.675s;
}

.heroBlock__ctaReveal--late {
  transition-delay: 0.8s;
}

.heroBlock__ctaReveal--reveal {
  opacity: 1;
  transform: translateY(0);
}

.heroBlock__cta {
  $cta-fg: #1a1a2e;
  $cta-bg: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: min(100%, 360px);
  padding: 16px 40px;
  color: $cta-fg;
  background: $cta-bg;
  border: 2px solid $cta-bg;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  @include apply-font(button-m);
  transition:
    transform 0.12s ease,
    opacity 0.48s ease,
    color 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;

  &:active {
    transform: scale(0.94);
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.12),
      0 8px 32px rgba(0, 0, 0, 0.28);
  }

  @media (hover: hover) {
    &:hover {
      color: $cta-bg;
      background: $cta-fg;
      border-color: $cta-fg;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.32);
    }

    &:hover:active {
      transform: scale(0.94);
      box-shadow:
        inset 0 1px 2px rgba(0, 0, 0, 0.18),
        0 12px 40px rgba(0, 0, 0, 0.32);
    }
  }

  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 4px;
  }
}

.heroBlock__ctaArrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82em;
  line-height: 1;
  transform: translateY(1px);
}
</style>
