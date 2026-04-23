<template>
  <div class="footerLinkColumn">
    <p class="footerLinkColumn__title">{{ title }}</p>
    <ul class="footerLinkColumn__list">
      <li v-for="(link, i) in links" :key="i" class="list__item">
        <UnderlineLink
          v-if="!link.external"
          :to="link.to"
          :class="['list__link', { 'list__link--noWrap': isEmailLink(link) }]"
          :show-underline-on-touch="isContactLink(link)"
          @click.capture="(e) => onBookingScrollLinkClick(e, link)"
        >
          {{ link.label }}
        </UnderlineLink>
        <UnderlineLink
          v-else
          :href="link.to"
          :class="['list__link', { 'list__link--noWrap': isEmailLink(link) }]"
          :show-underline-on-touch="isContactLink(link)"
          rel="noopener noreferrer"
        >
          {{ link.label }}
        </UnderlineLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import UnderlineLink from '~/components/buttons/UnderlineLink.vue'
import { useRoute, useRouter } from 'vue-router'
import { useLenis } from '../../composables/useLenis'
import { useScrollToBooking } from '../../composables/useScrollToBooking'
import {
  HOME_TOP_SECTION_ID,
  PENDING_SCROLL_TO_HOME_KEY,
  PENDING_SCROLL_TO_SEATS_KEY
} from '../../constants'

export type FooterColumnLink = {
  to: string
  label: string
  external?: boolean
  /** Sur la home : scroll vers le bloc réservation (`useScrollToBooking`). */
  sameAsBookingScroll?: boolean
  /** Sur la home : scroll vers le hero / haut de page. */
  sameAsHomeScroll?: boolean
}

defineProps<{
  title: string
  links: FooterColumnLink[]
}>()

const route = useRoute()
const router = useRouter()
const { scrollToBookingSection } = useScrollToBooking()
const lenis = useLenis()

function scrollToHomeTopWithFade() {
  const homeTopEl = document.getElementById(HOME_TOP_SECTION_ID)
  const appRoot = document.querySelector('.appContainer') as HTMLElement | null
  const FADE_OUT_MS = 380
  const FADE_IN_MS = 620
  if (appRoot) {
    appRoot.style.transition = `opacity ${FADE_OUT_MS}ms ease`
    appRoot.style.opacity = '0'
  }

  window.setTimeout(() => {
    const l = lenis.value
    if (homeTopEl) {
      if (l) {
        l.scrollTo(homeTopEl, { offset: 0, immediate: true, force: true })
      } else {
        const top = homeTopEl.getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top, behavior: 'auto' })
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    requestAnimationFrame(() => {
      if (appRoot) {
        appRoot.style.transition = `opacity ${FADE_IN_MS}ms ease`
        appRoot.style.opacity = '1'
      }
      window.setTimeout(() => {
        if (appRoot) {
          appRoot.style.transition = ''
          appRoot.style.opacity = ''
        }
      }, FADE_IN_MS)
    })
  }, FADE_OUT_MS)
}

function fadeOutBeforeHomeNavigation() {
  const appRoot = document.querySelector('.appContainer') as HTMLElement | null
  const FADE_OUT_MS = 380
  if (appRoot) {
    appRoot.style.transition = `opacity ${FADE_OUT_MS}ms ease`
    appRoot.style.opacity = '0'
  }
  window.setTimeout(() => {
    void router.push('/')
  }, FADE_OUT_MS)
}

/** Ligne tactile par défaut uniquement pour tel / mail (pas les autres liens du footer). */
function isContactLink(link: FooterColumnLink) {
  if (!link.external) return false
  const t = link.to.toLowerCase()
  return t.startsWith('tel:') || t.startsWith('mailto:')
}

function isEmailLink(link: FooterColumnLink) {
  if (!link.external) return false
  return link.to.toLowerCase().startsWith('mailto:')
}

/**
 * Phase capture : avant le onClick interne de RouterLink, sinon `preventDefault`
 * arrive trop tard et la navigation / « reload » part quand même (souvent sur mobile).
 */
function onBookingScrollLinkClick(e: MouseEvent, link: FooterColumnLink) {
  if (link.sameAsHomeScroll) {
    e.preventDefault()
    const path = route.path
    if (path === '/' || path === '') {
      scrollToHomeTopWithFade()
      return
    }
    try {
      sessionStorage.setItem(PENDING_SCROLL_TO_HOME_KEY, '1')
    } catch {
      /* quota / private */
    }
    fadeOutBeforeHomeNavigation()
    return
  }
  if (!link.sameAsBookingScroll) return
  e.preventDefault()
  const path = route.path
  if (path === '/' || path === '') {
    void scrollToBookingSection()
    return
  }
  try {
    sessionStorage.setItem(PENDING_SCROLL_TO_SEATS_KEY, '1')
  } catch {
    /* quota / private */
  }
  void router.push('/')
}
</script>

<style lang="scss" scoped>
.footerLinkColumn__title {
  margin: 0 0 12px 0;
  @include apply-font(label-micro);
  color: rgba(255, 255, 255, 0.45);
}

.footerLinkColumn__list {
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
}

.list__item + .list__item {
  margin-top: 8px;
}

.list__link {
  display: inline-block;
  color: rgba(255, 255, 255, 0.88);
  text-decoration: none;
  word-break: break-word;
  overflow-wrap: anywhere;
  /* Augmente la zone cliquable sans déplacer la mise en page visuelle. */
  padding: 6px 8px;
  margin: -6px -8px;
  border-radius: 4px;
  transition: color 0.28s ease;

  @media (hover: hover) {
    &:hover {
      color: #fff;
    }
  }
}

/* Recale la ligne animée à sa position d'origine malgré l'extension de hit area. */
.list__link::after {
  left: 8px;
  width: calc(100% - 16px);
  bottom: 6px;
}

.list__link--noWrap {
  max-width: 100%;
  white-space: nowrap;
  word-break: normal;
  overflow-wrap: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
