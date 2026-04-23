<template>
  <section class="altFeatures" :aria-label="sectionAria">
    <article
      v-for="(row, i) in rows"
      :key="i"
      class="altFeatures__row"
      :class="{ 'altFeatures__row--mediaLeft': row.imageSide === 'left' }"
    >
      <div class="altFeatures__copy">
        <AnimatedTextElt tag="h2" class="altFeatures__title" :delay="0">
          <template v-for="(part, j) in row.title.split('\n')" :key="`title-${i}-${j}`">
            <br v-if="j > 0" />
            {{ part }}
          </template>
        </AnimatedTextElt>
        <AnimatedTextElt tag="p" class="altFeatures__text" :delay="0.06">
          <template v-if="row.billingEmailLink && splitAtSurPlace(row.text).hasSplit">
            {{ splitAtSurPlace(row.text).before }}
            <br />
            <span class="altFeatures__practicalNotice">
              {{ practicalNoticePrefix }}
              <UnderlineLink
                class="altFeatures__emailLink"
                href="#practical-info"
                @click.prevent="scrollToPracticalInfo"
              >
                {{ practicalNoticeLink }}
              </UnderlineLink>
            </span>
            <template v-if="splitAtSurPlace(row.text).after">
              <br />
              <br />
              {{ splitAtSurPlace(row.text).after }}
            </template>
          </template>
          <template v-else>{{ row.text }}</template>
          <span
            v-if="!row.billingEmailLink && row.text.includes('17h')"
            class="altFeatures__practicalNotice"
          >
            <br />
            {{ practicalNoticePrefix }}
            <UnderlineLink
              class="altFeatures__emailLink"
              href="#practical-info"
              @click.prevent="scrollToPracticalInfo"
            >
              {{ practicalNoticeLink }}
            </UnderlineLink>
          </span>
          <template v-if="row.billingEmailLink">
            <UnderlineLink class="altFeatures__emailLink" :href="`mailto:${billingEmail}`">{{
              billingEmail
            }}</UnderlineLink>
            <span v-if="row.textAfterEmail" class="altFeatures__emailFollow">{{
              row.textAfterEmail
            }}</span>
          </template>
        </AnimatedTextElt>
      </div>
      <figure class="altFeatures__figure">
        <ParallaxMediaElt
          class="altFeatures__visual"
          :class="`altFeatures__visual--v${(i % 3) + 1}`"
          :src="ROW_IMAGES[i % 3]"
          :has-parallax-position="isDesktop"
          :parallax-position-amount="i % 2 === 0 ? -20 : 20"
        />
      </figure>
    </article>
  </section>
</template>

<script setup lang="ts">
import UnderlineLink from '../buttons/UnderlineLink.vue'
import AnimatedTextElt from '../elements/AnimatedTextElt.vue'
import ParallaxMediaElt from '../elements/ParallaxMediaElt.vue'
import content from '../../locales/fr.json'
import { ref, onMounted, onUnmounted } from 'vue'
import { useLenis } from '../../composables/useLenis'

const ROW_IMAGES = ['/images/3.jpg', '/images/10.jpg', '/images/6.jpg']

const isDesktop = ref(true)
const lenis = useLenis()

onMounted(() => {
  const mq = window.matchMedia('(min-width: 1100px)')
  isDesktop.value = mq.matches
  const handler = (e: MediaQueryListEvent) => {
    isDesktop.value = e.matches
  }
  mq.addEventListener('change', handler)
  onUnmounted(() => mq.removeEventListener('change', handler))
})

export type AlternatingFeatureRow = {
  title: string
  text: string
  imageSide: string
  billingEmailLink?: boolean
  textAfterEmail?: string
}

defineProps<{
  sectionAria: string
  rows: AlternatingFeatureRow[]
}>()

const billingEmail = content.brand.displayEmail
const practicalNoticePrefix = content.home.practicalNotice.prefix
const practicalNoticeLink = content.home.practicalNotice.link

function splitAtSurPlace(text: string) {
  const marker = 'sur place.'
  const idx = text.indexOf(marker)
  if (idx < 0) return { hasSplit: false, before: text, after: '' }
  const cut = idx + marker.length
  return {
    hasSplit: true,
    before: text.slice(0, cut),
    after: text.slice(cut).trimStart()
  }
}

function scrollToPracticalInfo() {
  const practicalEl = document.getElementById('practical-info')
  if (!practicalEl) return
  const l = lenis.value
  if (l) {
    l.scrollTo(practicalEl, { offset: 0, immediate: false })
  } else {
    practicalEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';

/** Colonne image identique sur toutes les rangées + même écart texte ↔ image (le 2ᵉ bloc était plus resserré avec l’ancien --mediaLeft). */
$alt-features-visual-col: minmax(0, clamp(280px, 38vw, 440px));
$alt-features-column-gap-lg: clamp(120px, 18vw, 380px);

.altFeatures {
  background: $color-surface-page;
}

.altFeatures__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(56px, 9vw, 96px) clamp(20px, 4vw, 40px);
  user-select: none;

  @include media-up(lg) {
    min-height: 100dvh;
    min-height: 100vh;
    box-sizing: border-box;
    max-width: min(1320px, 100%);
    grid-template-columns: minmax(0, 1fr) #{$alt-features-visual-col};
    column-gap: #{$alt-features-column-gap-lg};
    row-gap: clamp(32px, 4vh, 48px);
    padding: clamp(32px, 5dvh, 64px) clamp(28px, 4vw, 56px);

    &--mediaLeft {
      grid-template-columns: #{$alt-features-visual-col} minmax(0, 1fr);
    }
  }
}

.altFeatures__row--mediaLeft .altFeatures__copy {
  order: 2;
}

.altFeatures__row--mediaLeft .altFeatures__figure {
  order: 1;
}

.altFeatures__title {
  margin: 0 0 16px 0;
  color: $color-text-primary;
  @include apply-font(title-l);
}

.altFeatures__text {
  margin: 0;
  max-width: min(32rem, 100%);
  color: $color-text-secondary;
  width: unset;
  @include apply-font(text-l);

  @include media-up(lg) {
    width: min(30rem, 100%);
  }
}

.altFeatures__emailLink {
  color: color.mix($color-primary, $color-text-secondary, 40%);
  font-weight: 500;
  transition: color 0.28s ease;
  white-space: nowrap;

  @media (hover: hover) {
    &:hover {
      color: $color-primary;
    }
  }
}

.altFeatures__emailFollow {
  display: block;
  margin-top: 0.65rem;
  white-space: nowrap;
}

.altFeatures__practicalNotice {
  display: inline;
  margin-top: 0;
  white-space: nowrap;
}

.altFeatures__figure {
  margin: 0;
  min-width: 0;
  width: 100%;
}

.altFeatures__visual {
  width: 100%;
  aspect-ratio: 4 / 5;
}

@media (max-width: 880px) {
  .altFeatures__row {
    grid-template-columns: 1fr;
    padding-top: clamp(40px, 8vw, 64px);
    padding-bottom: clamp(40px, 8vw, 64px);
    padding-top: 48px;
    padding-bottom: 48px;
  }

  .altFeatures__row--mediaLeft .altFeatures__copy,
  .altFeatures__row--mediaLeft .altFeatures__figure {
    order: unset;
  }

  .altFeatures__copy {
    width: 100%;
    max-width: min(32rem, 100%);
    margin: 0 auto;
  }

  .altFeatures__title,
  .altFeatures__text {
    width: 100%;
    max-width: none;
  }

  .altFeatures__figure {
    order: -1;
    width: 100%;
    margin: 0 auto;
    max-width: min(32rem, 100%);
  }

  .altFeatures__row--mediaLeft .altFeatures__figure {
    order: -1;
  }
}
</style>
