<template>
  <section :id="HOME_TOP_SECTION_ID" class="heroBlock" aria-labelledby="heroBlockTitle">
    <div class="heroBlock__bg" aria-hidden="true" />
    <div class="heroBlock__overlay" aria-hidden="true" />
    <div class="heroBlock__inner">
      <p class="heroBlock__kicker">{{ kicker }}</p>
      <h1 id="heroBlockTitle" class="heroBlock__title">{{ title }}</h1>
      <p class="heroBlock__subtitle">{{ subtitle }}</p>
      <button
        v-if="ctaScroll"
        type="button"
        class="heroBlock__cta"
        @click="scrollToBooking"
      >
        {{ ctaScroll }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { HOME_TOP_SECTION_ID } from '../../constants'
import { useScrollToBooking } from '../../composables/useScrollToBooking'

defineProps<{
  kicker: string
  title: string
  subtitle: string
  ctaScroll?: string
}>()

const { scrollToBookingSection } = useScrollToBooking()

function scrollToBooking() {
  void scrollToBookingSection()
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

.heroBlock__bg {
  position: absolute;
  inset: 0;
  background-color: #2d1f4e;
  background-image: linear-gradient(120deg, rgba(45, 31, 78, 0.35) 0%, rgba(102, 126, 234, 0.3) 100%),
    url('https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=1920&q=80');
  background-size: cover;
  background-position: center 30%;
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
  max-width: 720px;
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
  font-size: clamp(2rem, 5.5vw, 3.25rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 40px rgba(0, 0, 0, 0.35);
}

.heroBlock__subtitle {
  margin: 0 0 40px 0;
  font-size: clamp(1rem, 2.2vw, 1.2rem);
  line-height: 1.65;
  max-width: 30rem;
  margin-left: auto;
  margin-right: auto;
  color: rgba(255, 255, 255, 0.88);
}

.heroBlock__cta {
  $cta-fg: #1a1a2e;
  $cta-bg: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
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
