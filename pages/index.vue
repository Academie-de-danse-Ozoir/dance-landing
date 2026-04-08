<template>
  <div class="spectaclePage">
    <HeroBlock
      :kicker="content.home.hero.kicker"
      :title="content.home.hero.title"
      :subtitle="content.home.hero.subtitle"
      :cta-scroll="content.home.hero.ctaScroll"
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

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import content from '../locales/fr.json'
import HeroBlock from '../components/home/HeroBlock.vue'
import HomeOrganicGallery from '../components/home/HomeOrganicGallery.vue'
import StatementSection from '../components/home/StatementSection.vue'
import AlternatingFeatures, {
  type AlternatingFeatureRow
} from '../components/home/AlternatingFeatures.vue'
import MapAndPricingSection from '../components/home/MapAndPricingSection.vue'
import BookingBlock from '../components/home/BookingBlock.vue'
import SiteFooter from '../components/layout/SiteFooter.vue'
import { useScrollToBooking } from '../composables/useScrollToBooking'
import { PENDING_SCROLL_TO_HOME_KEY, SCROLL_TO_SEATS_AFTER_NAV_MS } from '../constants'

const { scrollToHomeTop } = useScrollToBooking()

const homeHighlightRows = content.home.highlights.rows as AlternatingFeatureRow[]

onMounted(() => {
  if (!import.meta.client) return
  if (sessionStorage.getItem(PENDING_SCROLL_TO_HOME_KEY)) {
    sessionStorage.removeItem(PENDING_SCROLL_TO_HOME_KEY)
    setTimeout(() => void scrollToHomeTop(), SCROLL_TO_SEATS_AFTER_NAV_MS)
  }
})
</script>

<style lang="scss" scoped>
.spectaclePage {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  box-sizing: border-box;

  > * {
    flex-shrink: 0;
  }
}
</style>
