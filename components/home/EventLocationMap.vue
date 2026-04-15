<template>
  <section class="eventLocation" aria-labelledby="location-title">
    <div class="eventLocation__inner">
      <div class="eventLocation__arrivalBlock">
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

      <article class="eventLocation__parkingRow">
        <div class="eventLocation__parkingCopy">
          <AnimatedTextElt
            tag="h3"
            class="eventLocation__parkingInfoTitle"
            :delay="0.08"
          >
            {{ content.home.location.parkingInfoTitle }}
          </AnimatedTextElt>
          <div class="eventLocation__parkingInfoList">
            <AnimatedTextElt
              v-for="(item, index) in content.home.location.parkingInfoItems"
              :key="index"
              tag="p"
              class="eventLocation__parkingInfoText"
              :delay="0.12 + index * 0.06"
            >
              {{ `• ${item}` }}
            </AnimatedTextElt>
          </div>
        </div>

        <figure class="eventLocation__parkingFigure">
          <img
            ref="parkingImageRef"
            src="/images/parking.jpg"
            :alt="content.home.location.parkingMapAlt"
            class="eventLocation__parkingImage"
            :class="{ 'eventLocation__parkingImage--revealed': parkingImageRevealed }"
            loading="lazy"
          />
        </figure>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import content from '../../locales/fr.json'
import AnimatedTextElt from '../elements/AnimatedTextElt.vue'

const mapContainerRef = ref<HTMLElement | null>(null)
const mapRevealed = ref(false)
const parkingImageRef = ref<HTMLElement | null>(null)
const parkingImageRevealed = ref(false)

/** Position absolue du conteneur (coordonnées document, mis à jour au resize). */
let mapRectTop = 0
let mapRectHeight = 0
let parkingRectTop = 0
let parkingRectHeight = 0
let mapPrevTop = Number.POSITIVE_INFINITY
let parkingPrevTop = Number.POSITIVE_INFINITY

function measureMapRect() {
  const el = mapContainerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  mapRectTop = rect.top + window.scrollY
  mapRectHeight = rect.height
}

function measureParkingRect() {
  const el = parkingImageRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  parkingRectTop = rect.top + window.scrollY
  parkingRectHeight = rect.height
}

function checkMapVisibility() {
  const scrollY = window.scrollY
  const ih = window.innerHeight
  const revealStart = ih * 0.92
  const top = mapRectTop - scrollY
  const bottom = top + mapRectHeight

  // Reset uniquement quand l'élément repasse complètement sous le viewport.
  if (top >= ih) {
    mapRevealed.value = false
  }
  // Reveal seulement quand on franchit le seuil en descendant (entrée par le bas).
  if (
    !mapRevealed.value &&
    mapPrevTop >= revealStart &&
    top < revealStart &&
    top < mapPrevTop &&
    bottom > 0
  ) {
    mapRevealed.value = true
  }
  mapPrevTop = top

  const parkingTop = parkingRectTop - scrollY
  const parkingBottom = parkingTop + parkingRectHeight
  if (parkingTop >= ih) {
    parkingImageRevealed.value = false
  }
  if (
    !parkingImageRevealed.value &&
    parkingPrevTop >= revealStart &&
    parkingTop < revealStart &&
    parkingTop < parkingPrevTop &&
    parkingBottom > 0
  ) {
    parkingImageRevealed.value = true
  }
  parkingPrevTop = parkingTop
}

function handleResize() {
  measureMapRect()
  measureParkingRect()
  mapPrevTop = Number.POSITIVE_INFINITY
  parkingPrevTop = Number.POSITIVE_INFINITY
  checkMapVisibility()
}

onMounted(() => {
  if (import.meta.server) return
  window.addEventListener('scroll', checkMapVisibility, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
  measureMapRect()
  measureParkingRect()
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
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.eventLocation__arrivalBlock {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.eventLocation__header {
  max-width: 800px;
  margin: 0 auto;
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
  max-width: 800px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  max-height: 380px;
  border-radius: 4px;
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

.eventLocation__parkingRow {
  margin-top: 56px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(28px, 5vw, 64px);
  align-items: center;
  max-width: 1120px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;

  @include media-up(lg) {
    grid-template-columns: minmax(0, 1fr) minmax(0, clamp(280px, 38vw, 440px));
    column-gap: clamp(120px, 18vw, 200px);
  }
}

.eventLocation__parkingCopy {
  min-width: 0;
}

.eventLocation__parkingInfoTitle {
  margin: 0 0 1rem 0;
  font-size: clamp(1.25rem, 2.2vw, 1.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: $color-text-primary;
}

.eventLocation__parkingInfoList {
  margin: 0;
  padding: 0;
}

.eventLocation__parkingInfoText {
  margin: 0 0 0.6rem 0;
  font-size: 1rem;
  line-height: 1.7;
  color: $color-text-secondary;

  &:last-child {
    margin-bottom: 0;
  }
}

.eventLocation__parkingFigure {
  margin: 0;
  min-width: 0;
  width: 100%;
}

.eventLocation__parkingImage {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid $color-border-subtle;
  box-shadow: 0 4px 12px rgba(33, 37, 41, 0.04);
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
}

@media (max-width: 880px) {
  .eventLocation__mapContainer {
    aspect-ratio: 4 / 3;
    max-height: 520px;
  }

  .eventLocation__parkingRow {
    grid-template-columns: 1fr;
  }

  .eventLocation__parkingCopy {
    width: 100%;
    max-width: min(32rem, 100%);
    margin: 0 auto;
  }

  .eventLocation__parkingInfoTitle,
  .eventLocation__parkingInfoList {
    width: 100%;
    max-width: none;
    box-sizing: border-box;
  }

  .eventLocation__parkingFigure {
    width: 100%;
    margin: 0 auto;
    max-width: min(32rem, 100%);
  }
}
</style>
