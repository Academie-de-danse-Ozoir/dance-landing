<template>
  <div class="footerLinkColumn">
    <p class="footerLinkColumn__title">{{ title }}</p>
    <ul class="footerLinkColumn__list">
      <li v-for="(link, i) in links" :key="i" class="list__item">
        <UnderlineLink
          v-if="!link.external"
          :to="link.to"
          class="list__link"
          :show-underline-on-touch="isContactLink(link)"
          @click.capture="(e) => onBookingScrollLinkClick(e, link)"
        >
          {{ link.label }}
        </UnderlineLink>
        <UnderlineLink
          v-else
          :href="link.to"
          class="list__link"
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
import { useScrollToBooking } from '../../composables/useScrollToBooking'
import { PENDING_SCROLL_TO_HOME_KEY, PENDING_SCROLL_TO_SEATS_KEY } from '../../constants'

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
const { scrollToBookingSection, scrollToHomeTop } = useScrollToBooking()

/** Ligne tactile par défaut uniquement pour tel / mail (pas les autres liens du footer). */
function isContactLink(link: FooterColumnLink) {
  if (!link.external) return false
  const t = link.to.toLowerCase()
  return t.startsWith('tel:') || t.startsWith('mailto:')
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
      void scrollToHomeTop()
      return
    }
    try {
      sessionStorage.setItem(PENDING_SCROLL_TO_HOME_KEY, '1')
    } catch {
      /* quota / private */
    }
    void router.push('/')
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
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.footerLinkColumn__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.list__item + .list__item {
  margin-top: 8px;
}

.list__link {
  color: rgba(255, 255, 255, 0.88);
  text-decoration: none;
  word-break: break-word;
  transition: color 0.28s ease;

  @media (hover: hover) {
    &:hover {
      color: #fff;
    }
  }
}
</style>
