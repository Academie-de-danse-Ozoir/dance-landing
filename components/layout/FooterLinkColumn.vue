<template>
  <div class="footerLinkColumn">
    <p class="footerLinkColumn__title">{{ title }}</p>
    <ul class="footerLinkColumn__list">
      <li v-for="(link, i) in links" :key="i" class="list__item">
        <NuxtLink
          v-if="!link.external"
          :to="link.to"
          class="list__link"
          @click.capture="(e) => onBookingScrollLinkClick(e, link)"
        >
          {{ link.label }}
        </NuxtLink>
        <a
          v-else
          :href="link.to"
          class="list__link"
          rel="noopener noreferrer"
        >
          {{ link.label }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useScrollToBooking } from '../../composables/useScrollToBooking'
import { PENDING_SCROLL_TO_SEATS_KEY } from '../../constants'

export type FooterColumnLink = {
  to: string
  label: string
  external?: boolean
  /** Sur la home : même scroll que le CTA hero (`useScrollToBooking`). */
  sameAsBookingScroll?: boolean
}

defineProps<{
  title: string
  links: FooterColumnLink[]
}>()

const route = useRoute()
const router = useRouter()
const { scrollToBookingSection } = useScrollToBooking()

/**
 * Phase capture : avant le onClick interne de RouterLink, sinon `preventDefault`
 * arrive trop tard et la navigation / « reload » part quand même (souvent sur mobile).
 */
function onBookingScrollLinkClick(e: MouseEvent, link: FooterColumnLink) {
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

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
}
</style>
