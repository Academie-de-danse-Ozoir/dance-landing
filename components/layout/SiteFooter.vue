<template>
  <footer class="siteFooter" role="contentinfo">
    <div class="siteFooter__inner">
      <div class="siteFooter__brand">
        <p class="brand__name">{{ mobileBrandName }}</p>
        <p class="brand__tagline">{{ content.footer.tagline }}</p>
      </div>

      <nav class="siteFooter__nav" :aria-label="content.footer.navAria">
        <FooterLinkColumn :title="content.footer.columns.bookingTitle" :links="bookingLinks" />
        <FooterLinkColumn :title="content.footer.columns.legalTitle" :links="legalLinks" />
        <FooterLinkColumn :title="content.footer.columns.contactTitle" :links="contactLinks" />
        <div class="siteFooter__mapCol">
          <p class="mapCol__title">{{ content.home.location.title || 'Théâtre de Yerres' }}</p>
          <ul class="mapCol__list">
            <li class="list__item">
              <span class="list__text">{{ content.home.location.addressLine1 }}</span>
            </li>
            <li class="list__item">
              <span class="list__text">{{ content.home.location.addressLine2 }}</span>
            </li>
          </ul>
        </div>
      </nav>

      <div class="siteFooter__bottom">
        <p class="bottom__venue">
          {{ content.brand.eventVenue }} · {{ content.brand.eventDate }}<br />
          {{ content.brand.eventTimes }}
        </p>
        <p class="bottom__copy">
          <span class="bottom__copyPrefix">{{ copyrightPrefix }}</span>
          <span class="bottom__copyRights">{{ copyrightRights }}</span>
        </p>
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

function footerTelHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits ? `tel:${digits}` : '#'
}

const contactLinks = computed(() => {
  const emailLink = {
    to: `mailto:${content.brand.displayEmail}`,
    label: content.brand.displayEmail,
    external: true
  }
  const phone = content.brand.contactPhone?.trim()
  if (!phone) return [emailLink]
  return [{ to: footerTelHref(phone), label: phone, external: true }, emailLink]
})

const mobileBrandName = computed(() =>
  content.brand.spectacleName.replace("l'Académie ", "l'Académie\n")
)

const copyrightLine = computed(() =>
  content.footer.copyright.replace('{year}', String(new Date().getFullYear()))
)
const copyrightPrefix = computed(() =>
  copyrightLine.value.replace(' Tous droits réservés.', '').trim()
)
const copyrightRights = computed(() => 'Tous droits réservés.')
</script>

<style lang="scss" scoped>
.siteFooter {
  width: 100%;
  background: #1a1a2e;
  color: #e8e8ef;
  @include apply-font(text-s);
  line-height: 1.5;
  margin-top: auto;
  user-select: none;
}

.siteFooter__inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px 20px 28px;
}

.siteFooter__brand {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);

  .brand__name {
    margin: 0 0 12px 0;
    color: #fff;
    @include apply-font(title-xs);
  }

  .brand__tagline {
    margin: 0;
    @include apply-font(footer-tagline);
    color: rgba(255, 255, 255, 0.65);
    max-width: 24rem;
  }
}

.siteFooter__nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px 32px;
  margin-bottom: 32px;
}

.siteFooter__mapCol {
  display: flex;
  flex-direction: column;
  justify-self: end;
}

.mapCol__title {
  margin: 0 0 12px 0;
  @include apply-font(label-micro);
  color: rgba(255, 255, 255, 0.45);
}

.mapCol__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.mapCol__list .list__item + .list__item {
  margin-top: 8px;
}

.mapCol__list .list__text {
  color: rgba(255, 255, 255, 0.88);
  @include apply-font(text-s);
  line-height: 1.5;
}

.siteFooter__bottom {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  @include apply-font(footer-tagline);
  color: rgba(255, 255, 255, 0.5);

  .bottom__copy {
    margin: 8px 0 0 0;
  }

  .bottom__venue {
    margin: 0;
    line-height: 1.5;
  }
}

@media (max-width: 1280px) {
  .siteFooter__nav {
    grid-template-columns: repeat(2, 1fr);
  }

  .siteFooter__mapCol {
    justify-self: stretch;
  }
}

@include media-down(sm) {
  .siteFooter {
    min-height: 100dvh;
  }

  .brand__name {
    white-space: pre-line;
  }

  .siteFooter__nav {
    grid-template-columns: 1fr;
  }
  .siteFooter__mapCol {
    grid-column: 1 / -1;
    justify-self: stretch;
  }

  .siteFooter__bottom .bottom__copy {
    .bottom__copyPrefix,
    .bottom__copyRights {
      display: block;
    }
  }
}
</style>
