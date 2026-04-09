<script setup lang="ts">
import content from '../locales/fr.json'

const { title, hint } = content.home.orientation
</script>

<template>
  <div class="orientationGuard" role="alert" aria-live="assertive">
    <div class="orientationGuard__content">
      <div class="orientationGuard__icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      </div>
      <h2 class="orientationGuard__title">{{ title }}</h2>
      <p class="orientationGuard__hint">{{ hint }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/global/breakpoints' as *;

.orientationGuard {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #0f0c1c;
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  color: white;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;

  // Affichage si paysage ET (écran petit OU hauteur réduite typique du paysage mobile)
  @media (orientation: landscape) and (max-width: 1025px),
    (orientation: landscape) and (max-height: 520px) {
    display: flex;
  }

  // Animation d'apparition
  animation: orientationFadeIn 0.4s ease forwards;
}

@keyframes orientationFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.orientationGuard__content {
  max-width: 320px;
}

.orientationGuard__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  color: #dbb366; // Doré assorti à la brand
  animation: phoneRotate 2.5s ease-in-out infinite;

  svg {
    width: 100%;
    height: 100%;
  }
}

@keyframes phoneRotate {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-90deg);
  }
  75% {
    transform: rotate(-90deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

.orientationGuard__title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  letter-spacing: 0.01em;
}

.orientationGuard__hint {
  font-size: 0.93rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
  white-space: pre-line;
}
</style>
