<template>
  <section class="statementSection" aria-labelledby="statementSectionTitle">
    <ParallaxMediaElt
      :key="posterSrc"
      class="statementSection__bg"
      :src="posterSrc"
      :parallax-mask-amount="18"
      loading="lazy"
      alt=""
      aria-hidden="true"
    />
    <div class="statementSection__frame">
      <AnimatedTextElt tag="p" class="statementSection__kicker" :delay="0">{{
        eyebrow
      }}</AnimatedTextElt>
      <AnimatedTextElt
        tag="h2"
        id="statementSectionTitle"
        class="statementSection__title"
        :delay="0.06"
        >{{ title }}</AnimatedTextElt
      >
      <AnimatedTextElt tag="p" class="statementSection__lead" :delay="0.12">{{
        lead
      }}</AnimatedTextElt>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AnimatedTextElt from '../elements/AnimatedTextElt.vue'
import ParallaxMediaElt from '../elements/ParallaxMediaElt.vue'

const POSTER_LANDSCAPE = '/images/affiche.jpg'
const POSTER_PORTRAIT = '/images/affiche_vertical.jpg'

defineProps<{
  eyebrow: string
  title: string
  lead: string
}>()

const posterSrc = ref(POSTER_LANDSCAPE)

function updatePosterSrc() {
  if (import.meta.server) return
  const portrait =
    window.matchMedia('(orientation: portrait)').matches ||
    window.matchMedia('(max-aspect-ratio: 1/1)').matches
  posterSrc.value = portrait ? POSTER_PORTRAIT : POSTER_LANDSCAPE
}

onMounted(() => {
  updatePosterSrc()
  const mqPortrait = window.matchMedia('(orientation: portrait)')
  const mqAspect = window.matchMedia('(max-aspect-ratio: 1/1)')
  const onChange = () => updatePosterSrc()
  mqPortrait.addEventListener('change', onChange)
  mqAspect.addEventListener('change', onChange)
  onUnmounted(() => {
    mqPortrait.removeEventListener('change', onChange)
    mqAspect.removeEventListener('change', onChange)
  })
})
</script>

<style lang="scss" scoped>
.statementSection {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  font-family: $font-family-text;
  min-height: 100dvh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: clamp(48px, 10vh, 120px) clamp(20px, 5vw, 56px);
  user-select: none;
  color: #fff;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(165deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.5) 100%);

    @include media-down(lg) {
      background: linear-gradient(165deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.8) 100%);
    }
  }
}

.statementSection__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-color: #1a1428;
}

.statementSection__frame {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;

  @include media-down(lg) {
    max-width: 20.5rem;
  }
}

.statementSection__kicker {
  margin: 0 0 24px 0;
  color: rgba(255, 255, 255, 0.72);
  @include apply-font(label-s);
}

.statementSection__title {
  margin: 0 auto 24px;
  max-width: 12.5ch;
  color: #fff;
  text-shadow: 0 4px 32px rgba(0, 0, 0, 0.35);
  @include apply-font(title-xl);
  overflow-wrap: normal;
  word-break: normal;

  @include media-down(lg) {
    max-width: 8ch;
  }
}

.statementSection__lead {
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  @include apply-font(text-l);
}
</style>
