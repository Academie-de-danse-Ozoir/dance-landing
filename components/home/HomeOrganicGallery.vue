<template>
  <section class="organicGallery" :aria-label="ariaLabel">
    <div class="organicGallery__scale">
      <div class="organicGallery__grid">
        <ParallaxMediaElt
          :class="[
            'organicGallery__cell',
            'organicGallery__cell--1',
            { 'organicGallery__cell--smMask': isSmDown }
          ]"
          src="/images/9.jpg"
          :has-parallax-mask="true"
          :scale-offset-amount="1.25"
          :has-parallax-position="!isSmDown"
          :parallax-position-amount="12"
        />
        <ParallaxMediaElt
          :class="[
            'organicGallery__cell',
            'organicGallery__cell--2',
            { 'organicGallery__cell--smMask': isSmDown }
          ]"
          src="/images/1.jpg"
          :has-parallax-mask="true"
          :scale-offset-amount="1.25"
          :has-parallax-position="!isSmDown"
          :parallax-position-amount="-12"
        />
        <ParallaxMediaElt
          :class="[
            'organicGallery__cell',
            'organicGallery__cell--3',
            { 'organicGallery__cell--smMask': isSmDown }
          ]"
          src="/images/5.jpg"
          :has-parallax-mask="true"
          :scale-offset-amount="1.25"
          :has-parallax-position="!isSmDown"
          :parallax-position-amount="12"
        />
        <ParallaxMediaElt
          :class="[
            'organicGallery__cell',
            'organicGallery__cell--4',
            { 'organicGallery__cell--smMask': isSmDown }
          ]"
          src="/images/8.jpg"
          :has-parallax-mask="true"
          :scale-offset-amount="1.25"
          :has-parallax-position="!isSmDown"
          :parallax-position-amount="-12"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import ParallaxMediaElt from '../elements/ParallaxMediaElt.vue'

/** Aligné sur `@include media-down(sm)` → max-width: 640px (`_breakpoints.scss`). */
const SM_DOWN_MQ = '(max-width: 640px)'

defineProps<{
  ariaLabel: string
}>()

/** ≤ sm : masque parallax actif, pas de parallax position (scroll). */
const isSmDown = ref(false)

onMounted(() => {
  if (!import.meta.client) return
  const mq = window.matchMedia(SM_DOWN_MQ)
  const sync = () => {
    isSmDown.value = mq.matches
  }
  sync()
  mq.addEventListener('change', sync)
  onUnmounted(() => mq.removeEventListener('change', sync))
})
</script>

<style lang="scss" scoped>
/* Maquette de référence : tout en px pour que le zoom global reste cohérent (pas de vw dans la grille). */
$organic-design-width: 1280px;

.organicGallery {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: $color-surface-page;
  box-sizing: border-box;
  overflow-x: clip;
  display: flex;
  justify-content: center;
}

.organicGallery__scale {
  width: 100%;
  display: flex;
  justify-content: center;

  @include media-down(sm) {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    overflow-x: visible;
  }
}

/** Même composition sur tous les écrans ; réduction homothétique quand la fenêtre est plus étroite que la maquette. */
.organicGallery__grid {
  display: grid;
  box-sizing: border-box;
  width: $organic-design-width;
  flex-shrink: 0;
  max-width: none;
  padding: 64px 40px;
  overflow: visible;
  isolation: isolate;

  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 32px;
  row-gap: 0;
  min-height: 880px;
  align-items: start;

  /* Réduit toute la scène comme une seule unité (même layout, plus petit). */
  zoom: min(1, calc((100vw - 32px) / #{$organic-design-width}));

  @include media-down(sm) {
    zoom: 1;
    width: 100%;
    min-width: 0;
    padding: clamp(28px, 6vw, 48px) 0;
    min-height: auto;
    column-gap: 0;
    /* Espace net entre les rangées — pas de chevauchement sur mobile / tablette. */
    row-gap: clamp(20px, 5vw, 36px);
  }
}

.organicGallery__cell {
  position: relative;
  box-sizing: border-box;

  /** Largeurs calées sur une fenêtre de référence 1280px (équivalent des anciens clamp + vw). */
  &--1 {
    grid-row: 1;
    grid-column: 4 / span 2;
    justify-self: center;
    width: 350px;
    margin-top: 20px;
    z-index: 3;

    @include media-down(sm) {
      grid-column: 1 / -1;
      justify-self: start;
      width: min(38vw, 168px);
      margin-top: 0;
      margin-bottom: 0;
      margin-left: 20px;
      margin-right: auto;
    }
  }

  &--2 {
    grid-row: 2;
    grid-column: 8 / span 5;
    justify-self: end;
    width: 468px;
    margin-top: -40px;
    margin-bottom: 0;
    margin-right: 0;
    z-index: 1;

    @include media-down(sm) {
      grid-column: 1 / -1;
      justify-self: end;
      width: min(54vw, 240px);
      margin-top: 0;
      margin-bottom: 0;
      margin-left: auto;
      margin-right: 40px;
    }
  }

  &--3 {
    grid-row: 3;
    grid-column: 1 / span 5;
    justify-self: start;
    width: 450px;
    margin-top: 120px;
    margin-left: 12px;
    z-index: 2;
    aspect-ratio: 450 / 380;
    overflow: hidden;

    @include media-down(sm) {
      grid-column: 1 / -1;
      justify-self: start;
      width: min(56vw, 180px);
      margin-top: 0;
      margin-bottom: 0;
      margin-left: 40px;
      margin-right: auto;
    }
  }

  &--4 {
    grid-row: 4;
    grid-column: 8 / span 3;
    justify-self: end;
    align-self: start;
    width: 350px;
    margin-top: -90px;
    z-index: 3;

    @include media-down(sm) {
      grid-column: 1 / -1;
      justify-self: end;
      width: min(38vw, 168px);
      margin-top: 0;
      margin-bottom: 0;
      margin-left: auto;
      margin-right: 20px;
    }
  }
}
</style>
