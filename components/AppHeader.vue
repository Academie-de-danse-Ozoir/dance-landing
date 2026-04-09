<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, navigateTo } from '#app'
import AppLogo from './AppLogo.vue'

const route = useRoute()
const { isRevealed } = useAppLoader()
const isScrolled = ref(false)
const isVisible = ref(true)
let lastScrollY = 0

const lenis = useLenis()

// État de la variante du logo synchronisé avec la transition
const currentLogoVariant = ref<'light' | 'dark'>('light')

// On détecte si on est sur une page légale
const isLegalPage = computed(() => {
  const legalPaths = ['/cgv', '/mentions-legales', '/politique-confidentialite']
  return legalPaths.includes(route.path)
})

/** Met à jour la variante du logo (immédiat pour scroll, différé pour route) */
function syncLogoVariant(immediate = false) {
  const nextVariant = isScrolled.value || isLegalPage.value ? 'dark' : 'light'

  if (immediate) {
    currentLogoVariant.value = nextVariant
  } else {
    // On attend le "point mort" de la transition de page (0.6s / 2)
    setTimeout(() => {
      currentLogoVariant.value = nextVariant
    }, 300)
  }
}

function handleScroll() {
  const currentScrollY = window.scrollY
  const isLargeScreen = typeof window !== 'undefined' && window.innerWidth >= 1025

  // 1. Logique de variante (Lumière / Sombre)
  const oldScrolled = isScrolled.value
  isScrolled.value = currentScrollY > window.innerHeight * 0.94

  if (oldScrolled !== isScrolled.value) {
    syncLogoVariant(true)
  }

  // 2. Logique de Visibilité (Apparition / Disparition)
  if (isLargeScreen || currentScrollY < 100) {
    isVisible.value = true
  } else {
    isVisible.value = currentScrollY < lastScrollY
  }

  lastScrollY = currentScrollY
}

function goHome() {
  if (route.path === '/') {
    const l = lenis.value
    if (l) {
      l.scrollTo(0)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } else {
    void navigateTo('/')
  }
}

// Suivi de la route pour le logo et la croix
watch(
  () => route.path,
  () => {
    syncLogoVariant(false)
  }
)

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })
  syncLogoVariant(true) // Initial
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <header
    class="appHeader"
    :class="{
      'appHeader--scrolled': isScrolled,
      'appHeader--hidden': !isVisible
    }"
  >
    <div class="appHeader__inner">
      <button class="appHeader__logo" @click="goHome" aria-label="Retour à l'accueil">
        <AppLogo size="md" :variant="currentLogoVariant" icon-only />
      </button>

      <!-- Bouton Croix (Fermer) à droite — Uniquement pages légales -->
      <Transition name="closeBtn">
        <button v-if="isLegalPage" class="appHeader__close" @click="goHome" aria-label="Fermer">
          <span class="appHeader__closeIcon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        </button>
      </Transition>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.appHeader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  pointer-events: none;
  transition: transform 0.4s ease;

  &--hidden {
    transform: translateY(-100%);
  }
}

.appHeader__inner {
  // Padding identique en haut et à gauche pour l'équilibre
  padding: clamp(20px, 4vw, 36px);
  display: flex;
  align-items: center;
  justify-content: space-between; // Pour séparer Logo et Croix
  pointer-events: auto;
}

.appHeader__logo,
.appHeader__close {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition:
    transform 0.3s ease,
    opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

// Transition du bouton fermer
.closeBtn-enter-active {
  transition:
    opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 1.2s;
}

.closeBtn-leave-active {
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.closeBtn-enter-from,
.closeBtn-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.appHeader__closeIcon {
  width: 44px;
  height: 44px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px; // Maximum 4px comme les autres boutons
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.25s ease,
    border-color 0.25s ease;

  &:hover {
    background: #f8f8f8;
    border-color: rgba(0, 0, 0, 0.15);
  }

  svg {
    width: 20px;
    height: 20px;
  }
}
</style>
