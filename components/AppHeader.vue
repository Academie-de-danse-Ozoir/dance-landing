<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, navigateTo } from '#app'
import AppLogo from './AppLogo.vue'

const route = useRoute()
const { isRevealed } = useAppLoader()
const isScrolled = ref(false)
const isVisible = ref(true)
let lastScrollY = 0

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
  if (route.path === '/') return
  void navigateTo('/')
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
      'appHeader--hidden': !isVisible,
      'appHeader--legal': isLegalPage
    }"
  >
    <div class="appHeader__inner">
      <button
        class="appHeader__logo"
        :class="{ 'appHeader__logo--static': route.path === '/' }"
        @click="goHome"
        aria-label="Retour à l'accueil"
      >
        <AppLogo class="appHeader__brandLogo" size="md" :variant="currentLogoVariant" icon-only />
        <svg
          class="appHeader__mobileIcon"
          :class="{
            'appHeader__mobileIcon--light': currentLogoVariant === 'light',
            'appHeader__mobileIcon--dark': currentLogoVariant === 'dark'
          }"
          viewBox="0 0 867 1552"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <g
            transform="translate(0.000000,1552.000000) scale(0.100000,-0.100000)"
            fill="currentColor"
            stroke="none"
          >
            <path
              d="M6930 15296 c-116 -35 -211 -97 -309 -202 -184 -197 -321 -476 -440 -897 -46 -160 -73 -276 -211 -882 -130 -569 -255 -913 -429 -1177 -149 -225 -352 -395 -565 -474 -87 -32 -33 -26 95 11 724 208 1493 796 1968 1505 119 178 198 316 272 480 248 548 286 1016 112 1364 -89 180 -213 274 -371 282 -47 2 -95 -2 -122 -10z"
            />
            <path
              d="M4795 12819 c-144 -19 -306 -78 -412 -150 -282 -194 -405 -559 -287 -854 92 -230 326 -264 430 -62 47 90 56 138 65 358 10 253 27 335 92 448 51 90 160 210 215 236 25 13 36 23 29 27 -14 9 -39 8 -132 -3z"
            />
            <path
              d="M1875 11740 c-410 -28 -777 -96 -1009 -187 -247 -97 -446 -234 -575 -397 -142 -178 -224 -430 -224 -686 0 -182 34 -322 116 -485 227 -453 800 -812 1460 -917 155 -24 442 -29 577 -9 391 57 607 220 687 521 24 91 24 292 0 380 -92 337 -423 612 -983 818 -60 22 -192 66 -294 97 -302 93 -414 156 -465 260 -23 46 -27 64 -22 106 12 103 114 237 230 301 246 138 646 196 1272 186 154 -3 242 -2 195 2 -140 13 -825 19 -965 10z"
            />
            <path d="M2978 11713 c6 -2 18 -2 25 0 6 3 1 5 -13 5 -14 0 -19 -2 -12 -5z" />
            <path
              d="M7196 8620 c-340 -43 -652 -183 -911 -408 -141 -122 -218 -221 -363 -467 -135 -229 -190 -304 -298 -411 -201 -197 -429 -315 -781 -404 -240 -60 -477 -90 -709 -90 l-132 0 -12 88 c-18 130 -29 169 -22 77 4 -44 7 -98 7 -119 l0 -40 -55 3 c-103 4 -332 42 -464 76 -441 113 -829 332 -991 560 -117 164 -115 310 7 459 l43 51 -41 -35 c-61 -52 -120 -145 -146 -230 -31 -101 -33 -316 -4 -430 91 -361 408 -709 892 -979 208 -116 405 -196 640 -261 l139 -38 -2 -223 c-2 -314 -25 -659 -98 -1504 -84 -961 -89 -1064 -90 -1600 0 -464 9 -665 41 -970 77 -725 288 -1257 577 -1454 251 -171 522 -24 618 334 19 68 22 109 23 270 1 273 -18 393 -155 965 -101 420 -202 815 -323 1268 -236 879 -393 1696 -451 2352 -20 234 -39 530 -33 535 2 3 63 -6 134 -20 691 -132 1509 -168 2156 -95 819 93 1421 339 1793 732 419 441 521 953 284 1418 -188 370 -567 582 -1059 595 -80 2 -176 0 -214 -5z"
            />
          </g>
        </svg>
      </button>

      <!-- Bouton Croix (Fermer) à droite — Uniquement pages légales -->
      <Transition name="closeBtn">
        <button
          v-if="isLegalPage"
          class="appHeader__close"
          :class="{ 'appHeader__close--hidden': !isVisible }"
          @click="goHome"
          aria-label="Fermer"
        >
          <span class="appHeader__closeIcon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
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

  @include media-down(lg) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    /* On mobile/tablette, le header vit dans la page : pas de hide/show lié au scroll. */
    transform: none !important;
  }
}

.appHeader__inner {
  // Padding identique en haut et à gauche pour l'équilibre
  padding: clamp(20px, 4vw, 36px);
  display: flex;
  align-items: center;
  justify-content: space-between; // Pour séparer Logo et Croix
}

.appHeader__logo,
.appHeader__close {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  pointer-events: auto;
  transition:
    transform 0.3s ease,
    opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.appHeader__close {
  @include media-down(lg) {
    position: fixed;
    top: max(20px, env(safe-area-inset-top));
    right: 16px;
    z-index: 130;
    transition:
      transform 0.4s ease,
      opacity 0.2s ease;
  }
}

.appHeader__close--hidden {
  @include media-down(lg) {
    transform: translateY(-150%);
  }
}

.appHeader__mobileIcon {
  display: none;
  width: 24px;
  height: auto;
  color: $color-text-secondary;
  transition: color 0.4s ease;
}

.appHeader__mobileIcon--light {
  color: #ffffff;
}

.appHeader__mobileIcon--dark {
  color: $color-text-primary;
}

@include media-down(md) {
  .appHeader__brandLogo {
    display: none;
  }

  .appHeader__mobileIcon {
    display: block;
  }
}

.appHeader__close:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.appHeader__logo--static {
  cursor: default;
  pointer-events: none;
  transition: none;

  &:active {
    transform: none;
    opacity: 1;
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
