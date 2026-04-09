<template>
  <section class="eventLocation" aria-labelledby="location-title">
    <div class="eventLocation__inner">
      <header class="eventLocation__header">
        <h2 id="location-title" class="eventLocation__title">{{ content.home.location.title }}</h2>
        <p class="eventLocation__address">
          {{ content.home.location.addressLine1 }}<br />
          {{ content.home.location.addressLine2 }}
        </p>
      </header>
      <a
        href="https://maps.google.com/maps?q=Théâtre%20de%20Yerres"
        target="_blank"
        rel="noopener noreferrer"
        ref="mapContainerRef"
        class="eventLocation__mapContainer"
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
import content from '../../locales/fr.json'
</script>

<style lang="scss" scoped>
@use 'sass:color';

.eventLocation {
  background: white;
  padding: clamp(40px, 6vw, 60px) clamp(20px, 4vw, 40px);
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
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  @media (hover: hover) {
    &:hover {
      transform: scale(0.995);
      box-shadow: 0 6px 18px rgba(33, 37, 41, 0.12);
    }
  }

  &:active {
    transform: scale(0.985);
  }
}
</style>
