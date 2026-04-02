<template>
  <div class="spectaclePage">
    <HeroBlock
      :kicker="content.home.hero.kicker"
      :title="content.home.hero.title"
      :subtitle="content.home.hero.subtitle"
      :cta-scroll="content.home.hero.ctaScroll"
    />

    <IntroBlock
      :title="content.home.intro.title"
      :lead="content.home.intro.lead"
      :blocks="content.home.intro.blocks"
      :visual-alt1="content.home.intro.visualAlt1"
      :visual-alt2="content.home.intro.visualAlt2"
      :note-under-visuals="content.home.intro.noteUnderVisuals"
    />

    <BookingBlock />

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import content from '../locales/fr.json'
import HeroBlock from '../components/home/HeroBlock.vue'
import IntroBlock from '../components/home/IntroBlock.vue'
import BookingBlock from '../components/home/BookingBlock.vue'
import SiteFooter from '../components/layout/SiteFooter.vue'
import { useScrollToBooking } from '../composables/useScrollToBooking'
import { PENDING_SCROLL_TO_HOME_KEY, SCROLL_TO_SEATS_AFTER_NAV_MS } from '../constants'

const { scrollToHomeTop } = useScrollToBooking()

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
