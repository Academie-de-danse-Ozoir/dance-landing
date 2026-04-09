<template>
  <section class="eventLocation" aria-labelledby="location-title">
    <div class="eventLocation__inner">
      <header class="eventLocation__header">
        <AnimatedTextElt tag="h2" id="location-title" class="eventLocation__title" :delay="0">{{
          content.home.location.title
        }}</AnimatedTextElt>
        <AnimatedTextElt tag="p" class="eventLocation__address" :delay="0.06">
          {{ content.home.location.addressLine1 }}<br />
          {{ content.home.location.addressLine2 }}
        </AnimatedTextElt>
      </header>
      <a
        href="https://maps.google.com/maps?q=Théâtre%20de%20Yerres"
        target="_blank"
        rel="noopener noreferrer"
        ref="mapContainerRef"
        class="eventLocation__mapContainer"
        :class="{ 'eventLocation__mapContainer--revealed': mapRevealed }"
        title="Ouvrir sur Google Maps"
        aria-label="Ouvrir sur Google Maps"
      >
        <iframe
          src="https://maps.google.com/maps?q=Théâtre%20de%20Yerres&t=&z=14&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="100%"
          style="border: 0; pointer-events: none"
          allowfullscreen="false"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          tabindex="-1"
        ></iframe>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import content from '../../locales/fr.json'
import AnimatedTextElt from '../elements/AnimatedTextElt.vue'

const mapContainerRef = ref<HTMLElement | null>(null)
const mapRevealed = ref(false)

/** Position absolue du conteneur (coordonnées document, mis à jour au resize). */
let mapRectTop = 0
let mapRectHeight = 0

function measureMapRect() {
  const el = mapContainerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  mapRectTop = rect.top + window.scrollY
  mapRectHeight = rect.height
}

function checkMapVisibility() {
  const scrollY = window.scrollY
  const ih = window.innerHeight
  const top = mapRectTop - scrollY
  const bottom = top + mapRectHeight
  if (top < ih * 0.92 && bottom > 0) {
    if (!mapRevealed.value) mapRevealed.value = true
  } else {
    mapRevealed.value = false
  }
}

function handleResize() {
  measureMapRect()
  checkMapVisibility()
}

onMounted(() => {
  if (import.meta.server) return
  window.addEventListener('scroll', checkMapVisibility, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
  measureMapRect()
  checkMapVisibility()
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', checkMapVisibility)
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:color';

.eventLocation {
  background: white;
  padding-top: clamp(40px, 6vw, 60px);
  padding-bottom: clamp(100px, 14vh, 180px); // Plus d'espace avant le footer
  padding-left: clamp(20px, 4vw, 40px);
  padding-right: clamp(20px, 4vw, 40px);
  border-bottom: 1px solid $color-border-subtle;
}

.eventLocation__inner {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.eventLocation__header {
  text-align: center;
}

.eventLocation__title {
  margin: 0 0 12px 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: $color-text-primary;
}

.eventLocation__address {
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.6;
  color: $color-text-secondary;
}

.eventLocation__mapContainer {
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 380px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(33, 37, 41, 0.08);
  border: 1px solid $color-border-subtle;
  opacity: 0;
  transform: scale(0.94);
  transition:
    transform 0.7s cubic-bezier(0.4, 0, 0, 1),
    opacity 0.7s cubic-bezier(0.4, 0, 0, 1),
    box-shadow 0.25s ease;

  &--revealed {
    opacity: 1;
    transform: scale(1);
  }

  &:active {
    transform: scale(0.985);
  }
}
</style>
