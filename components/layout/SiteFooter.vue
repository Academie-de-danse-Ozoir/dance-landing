<template>
  <footer class="siteFooter" role="contentinfo">
    <div class="siteFooter__inner">
      <div class="siteFooter__brand">
        <p class="brand__name">{{ content.brand.spectacleName }}</p>
        <p class="brand__tagline">{{ content.footer.tagline }}</p>
      </div>

      <nav class="siteFooter__nav" :aria-label="content.footer.navAria">
        <FooterLinkColumn
          :title="content.footer.columns.bookingTitle"
          :links="bookingLinks"
        />
        <FooterLinkColumn
          :title="content.footer.columns.legalTitle"
          :links="legalLinks"
        />
        <FooterLinkColumn
          :title="content.footer.columns.contactTitle"
          :links="contactLinks"
        />
      </nav>

      <div class="siteFooter__bottom">
        <p class="bottom__copy">{{ copyrightLine }}</p>
        <p class="bottom__venue">{{ content.brand.eventVenue }} · {{ content.brand.eventDate }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import content from '~/locales/fr.json'
import FooterLinkColumn from '~/components/layout/FooterLinkColumn.vue'

const bookingLinks = [
  { to: '/', label: content.footer.links.home, sameAsHomeScroll: true },
  { to: '/', label: content.footer.links.booking, sameAsBookingScroll: true }
]

const legalLinks = [
  { to: '/cgv', label: content.footer.links.cgv },
  { to: '/mentions-legales', label: content.footer.links.legalNotice },
  { to: '/politique-confidentialite', label: content.footer.links.privacy }
]

const contactLinks = [
  {
    to: `mailto:${content.brand.senderEmail}`,
    label: content.brand.senderEmail,
    external: true
  }
]

const copyrightLine = computed(() =>
  content.footer.copyright.replace('{year}', String(new Date().getFullYear()))
)
</script>

<style lang="scss" scoped>
.siteFooter {
  width: 100%;
  background: #1a1a2e;
  color: #e8e8ef;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  font-size: 14px;
  line-height: 1.5;
  margin-top: auto;
}

.siteFooter__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px 28px;
}

.siteFooter__brand {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);

  .brand__name {
    margin: 0 0 6px 0;
    font-size: 17px;
    font-weight: 600;
    color: #fff;
  }

  .brand__tagline {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.65);
    max-width: 36rem;
  }
}

.siteFooter__nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px 32px;
  margin-bottom: 32px;
}

.siteFooter__bottom {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);

  .bottom__copy {
    margin: 0 0 6px 0;
  }

  .bottom__venue {
    margin: 0;
  }
}

@media (max-width: 640px) {
  .siteFooter__nav {
    grid-template-columns: 1fr;
  }
}
</style>
