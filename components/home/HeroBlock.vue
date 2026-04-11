<template>
  <section :id="HOME_TOP_SECTION_ID" class="heroBlock" aria-labelledby="heroBlockTitle">
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

      <div class="heroBlock__ctaWrapper" :class="{ 'heroBlock__ctaWrapper--reveal': isCtaVisible }">
        <button
          v-if="ctaScroll"
          type="button"
          class="heroBlock__cta"
          @pointerdown="handleTap"
          @click="scrollToNext"
        >
          {{ ctaScroll }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { HOME_TOP_SECTION_ID } from '../../constants'
import { useScrollToBooking } from '../../composables/useScrollToBooking'
import ParallaxMediaElt from '../elements/ParallaxMediaElt.vue'
import AnimatedTextElt from '../elements/AnimatedTextElt.vue'
import { useAppLoader } from '../../composables/useAppLoader'
import { cancelAndAnimate, heroCtaTapKeyframes, DEFAULT_BUTTON_TAP_MS } from '../../utils/tapPulse'

defineProps<{
  kicker: string
  title: string
  subtitle: string
  ctaScroll?: string
}>()

const { isRevealed } = useAppLoader()
const lenis = useLenis()

// On détecte si c'est une visite retour (déjà révélé au montage)
const isFastMode = ref(false)

// État local pour forcer la transition du bouton et de l'image même lors d'un retour
const isCtaVisible = ref(false)
const isBgRevealed = ref(false)

const kickerRef = ref<InstanceType<typeof AnimatedTextElt> | null>(null)
const titleRef = ref<InstanceType<typeof AnimatedTextElt> | null>(null)
const subtitleRef = ref<InstanceType<typeof AnimatedTextElt> | null>(null)

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
  // Si déjà révélé (ex: navigation inter-page), on active le mode rapide
  if (isRevealed.value) {
    isCtaVisible.value = false
    isBgRevealed.value = false // Reset pour redéclencher le dézoom
    triggerAllAnimations()
  }
})

function scrollToNext() {
  const l = lenis.value
  if (l) {
    l.scrollTo(window.innerHeight)
  } else {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
  }
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
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
  margin: 0 0 16px 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.heroBlock__title {
  margin: 0 0 24px 0;
  font-size: clamp(2.5rem, 6.5vw, 4rem); // Un peu plus grand
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 40px rgba(0, 0, 0, 0.35);
}

.heroBlock__subtitle {
  margin: 0 0 40px 0;
  font-size: clamp(1.1rem, 2.4vw, 1.3rem); // Un peu plus grand
  line-height: 1.6;
  max-width: 34rem;
  margin-left: auto;
  margin-right: auto;
  color: rgba(255, 255, 255, 0.88);
}

.heroBlock__ctaWrapper {
  opacity: 0;
  transform: translateY(50px);
  transition:
    opacity 1.2s ease 0.675s,
    transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.675s;

  &--reveal {
    opacity: 1;
    transform: translateY(0);
  }
}

.heroBlock__cta {
  $cta-fg: #1a1a2e;
  $cta-bg: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 40px;
  font-size: 16px;
  font-weight: 600;
  color: $cta-fg;
  background: $cta-bg;
  border: 2px solid $cta-bg;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition:
    transform 0.12s ease,
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
</style>
