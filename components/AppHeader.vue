<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter, navigateTo } from '#app'
import AppBrandLogoMark from './AppBrandLogoMark.vue'
import { useStatementLogoZone } from '~/composables/useStatementLogoZone'
import { isLegalPagePath, NARROW_VIEWPORT_MQ } from '~/constants'

/** Aligné sur `page-transitions.scss` et `router.options.ts`. */
const PAGE_TRANSITION_MS = 600

const route = useRoute()
const router = useRouter()
const statementInView = useStatementLogoZone()
const isNarrow = ref(false)
const isScrolled = ref(false)
const isVisible = ref(true)
const mobileLogoVisible = ref(true)
const currentLogoVariant = ref<'light' | 'dark'>('light')
let lastScrollY = 0
let mobileFadeInTimer: ReturnType<typeof setTimeout> | null = null

const isLegalPage = computed(() => isLegalPagePath(route.path))

/** Mobile : toujours clair. Desktop : selon scroll / statement / légal. */
const logoVariant = computed<'light' | 'dark'>(() =>
  isNarrow.value ? 'light' : currentLogoVariant.value
)

const mobileLogoHidden = computed(
  () => isNarrow.value && (!mobileLogoVisible.value || isLegalPage.value)
)

function syncLogoVariant(immediate = false) {
  if (isNarrow.value) {
    currentLogoVariant.value = 'light'
    return
  }

  let nextVariant: 'light' | 'dark' = 'light'
  if (isLegalPage.value) {
    nextVariant = 'dark'
  } else if (statementInView.value) {
    nextVariant = 'light'
  } else if (isScrolled.value) {
    nextVariant = 'dark'
  }

  if (immediate) {
    currentLogoVariant.value = nextVariant
  } else {
    setTimeout(() => {
      currentLogoVariant.value = nextVariant
    }, 300)
  }
}

function applyMobileLogoAfterNav() {
  mobileLogoVisible.value = !isLegalPage.value
}

function handleScroll() {
  const currentScrollY = window.scrollY
  const isLargeScreen = typeof window !== 'undefined' && window.innerWidth >= 1025

  const oldScrolled = isScrolled.value
  isScrolled.value = currentScrollY > window.innerHeight * 0.94

  if (!isNarrow.value && oldScrolled !== isScrolled.value) {
    syncLogoVariant(true)
  }

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

watch(
  () => route.path,
  () => {
    if (isNarrow.value) return
    syncLogoVariant(isLegalPage.value)
  }
)

watch(statementInView, () => {
  if (isNarrow.value) return
  syncLogoVariant(true)
})

let removeBeforeEach: (() => void) | undefined
let removeAfterEach: (() => void) | undefined
let removeMqListener: (() => void) | undefined

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })

  const mq = window.matchMedia(NARROW_VIEWPORT_MQ)
  const syncNarrow = () => {
    isNarrow.value = mq.matches
    if (mq.matches) {
      currentLogoVariant.value = 'light'
      applyMobileLogoAfterNav()
    } else {
      syncLogoVariant(true)
    }
  }
  syncNarrow()
  mq.addEventListener('change', syncNarrow)
  removeMqListener = () => mq.removeEventListener('change', syncNarrow)

  removeBeforeEach = router.beforeEach((to, from) => {
    if (to.path === from.path) return
    if (!mq.matches) return
    if (mobileFadeInTimer) {
      clearTimeout(mobileFadeInTimer)
      mobileFadeInTimer = null
    }
    mobileLogoVisible.value = false
  })

  removeAfterEach = router.afterEach(() => {
    if (!mq.matches) {
      syncLogoVariant(true)
      return
    }
    isVisible.value = true
    lastScrollY = 0
    isScrolled.value = false
    currentLogoVariant.value = 'light'

    if (mobileFadeInTimer) clearTimeout(mobileFadeInTimer)
    mobileFadeInTimer = setTimeout(() => {
      applyMobileLogoAfterNav()
      mobileFadeInTimer = null
    }, PAGE_TRANSITION_MS)
  })

  syncLogoVariant(true)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  removeBeforeEach?.()
  removeAfterEach?.()
  removeMqListener?.()
  if (mobileFadeInTimer) clearTimeout(mobileFadeInTimer)
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
      <AppBrandLogoMark
        :variant="logoVariant"
        :is-static="route.path === '/'"
        :extra-hit-class="[
          'appHeader__logo',
          {
            'appHeader__logo--static': route.path === '/',
            'appHeader__logo--mobileHidden': mobileLogoHidden
          }
        ]"
        aria-label="Retour à l'accueil"
        @activate="goHome"
      />

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
    transform: none !important;
  }
}

.appHeader__inner {
  padding: clamp(20px, 4vw, 36px);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.appHeader__logo),
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

  @include media-down(lg) {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
      transform: none;
    }
  }
}

:deep(.appHeader__logo--mobileHidden) {
  @include media-down(lg) {
    opacity: 0;
    pointer-events: none;
  }
}

:deep(.appHeader__logo--static) {
  cursor: default;
  pointer-events: none;

  @include media-up(lg) {
    transition: none;
  }

  &:active {
    transform: none;
    opacity: 1;
  }
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

.appHeader__close:active {
  transform: scale(0.95);
  opacity: 0.8;
}

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
  border-radius: 4px;
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
