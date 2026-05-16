<template>
  <div class="spectaclePage" :class="{ 'spectaclePage--masked': maskHomeContentForBookingJump }">
    <HeroBlock
      :kicker="content.home.hero.kicker"
      :title="content.home.hero.title"
      :subtitle="content.home.hero.subtitle"
      :cta-scroll="content.home.hero.ctaScroll"
      :cta-booking-now="content.home.hero.ctaBookingNow"
    />

    <HomeOrganicGallery :ariaLabel="content.home.organicGallery.ariaLabel" />

    <StatementSection
      :eyebrow="content.home.statement.eyebrow"
      :title="content.home.statement.title"
      :lead="content.home.statement.lead"
    />
    <AlternatingFeatures
      :section-aria="content.home.highlights.sectionAria"
      :rows="homeHighlightRows"
    />

    <MapAndPricingSection />

    <BookingBlock />

    <EventLocationMap />

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import content from '../locales/fr.json'
import HeroBlock from '../components/home/HeroBlock.vue'
import HomeOrganicGallery from '../components/home/HomeOrganicGallery.vue'
import StatementSection from '../components/home/StatementSection.vue'
import AlternatingFeatures, {
  type AlternatingFeatureRow
} from '../components/home/AlternatingFeatures.vue'
import MapAndPricingSection from '../components/home/MapAndPricingSection.vue'
import BookingBlock from '../components/home/BookingBlock.vue'
import EventLocationMap from '../components/home/EventLocationMap.vue'
import SiteFooter from '../components/layout/SiteFooter.vue'
import {
  HOME_TOP_SECTION_ID,
  PENDING_SCROLL_TO_HOME_KEY,
  PENDING_SCROLL_TO_SEATS_KEY,
  SEAT_SELECTION_SECTION_ID
} from '../constants'
import { useLenis } from '../composables/useLenis'
import { useAppLoader } from '../composables/useAppLoader'
import { useParallaxLayoutSync } from '../composables/useParallaxLayoutSync'

const homeHighlightRows = content.home.highlights.rows as AlternatingFeatureRow[]
const lenis = useLenis()
const { isRevealed } = useAppLoader()
const { scheduleParallaxLayoutSync } = useParallaxLayoutSync()
const maskHomeContentForBookingJump = ref(false)

function jumpToBookingWithFade() {
  const bookingEl = document.getElementById(SEAT_SELECTION_SECTION_ID)
  if (!bookingEl) {
    maskHomeContentForBookingJump.value = false
    return
  }
  const appRoot = document.querySelector('.appContainer') as HTMLElement | null
  const FADE_OUT_MS = 380
  const FADE_IN_MS = 620

  if (appRoot) {
    appRoot.style.transition = `opacity ${FADE_OUT_MS}ms ease`
    appRoot.style.opacity = '0'
  }

  window.setTimeout(() => {
    const l = lenis.value
    if (l) {
      l.scrollTo(bookingEl, { offset: 0, immediate: true, force: true })
    } else {
      const top = bookingEl.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top, behavior: 'auto' })
    }

    requestAnimationFrame(() => {
      if (!appRoot) return
      maskHomeContentForBookingJump.value = false
      appRoot.style.transition = `opacity ${FADE_IN_MS}ms ease`
      appRoot.style.opacity = '1'
      window.setTimeout(() => {
        appRoot.style.transition = ''
        appRoot.style.opacity = ''
      }, FADE_IN_MS)
    })
  }, FADE_OUT_MS)
}

watch(isRevealed, (revealed) => {
  if (revealed) scheduleParallaxLayoutSync(120)
})

onMounted(() => {
  if (!import.meta.client) return
  scheduleParallaxLayoutSync(480)
  if (sessionStorage.getItem(PENDING_SCROLL_TO_SEATS_KEY)) {
    maskHomeContentForBookingJump.value = true
    sessionStorage.removeItem(PENDING_SCROLL_TO_SEATS_KEY)
    requestAnimationFrame(() => jumpToBookingWithFade())
    return
  }

  if (sessionStorage.getItem(PENDING_SCROLL_TO_HOME_KEY)) {
    sessionStorage.removeItem(PENDING_SCROLL_TO_HOME_KEY)
    const appRoot = document.querySelector('.appContainer') as HTMLElement | null
    const FADE_IN_MS = 620
    if (appRoot) {
      appRoot.style.opacity = '0'
    }

    requestAnimationFrame(() => {
      const homeTopEl = document.getElementById(HOME_TOP_SECTION_ID)
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
        if (!appRoot) return
        appRoot.style.transition = `opacity ${FADE_IN_MS}ms ease`
        appRoot.style.opacity = '1'
        window.setTimeout(() => {
          appRoot.style.transition = ''
          appRoot.style.opacity = ''
        }, FADE_IN_MS)
      })
    })
  }
})
</script>

<style lang="scss" scoped>
.spectaclePage--masked {
  opacity: 0;
}
</style>
