<template>
  <section class="altFeatures" :aria-label="sectionAria">
    <article
      v-for="(row, i) in rows"
      :key="i"
      class="altFeatures__row"
      :class="{ 'altFeatures__row--mediaLeft': row.imageSide === 'left' }"
    >
      <div class="altFeatures__copy">
        <AnimatedTextElt tag="h2" class="altFeatures__title" :delay="0">{{
          row.title
        }}</AnimatedTextElt>
        <AnimatedTextElt tag="p" class="altFeatures__text" :delay="0.06">
          {{ row.text }}
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
          :alt="row.caption"
          :has-parallax-position="isDesktop"
          :parallax-position-amount="i % 2 === 0 ? -20 : 20"
        />
        <figcaption class="altFeatures__caption">{{ row.caption }}</figcaption>
      </figure>
    </article>
  </section>
</template>

<script setup lang="ts">
import UnderlineLink from '~/components/buttons/UnderlineLink.vue'
import AnimatedTextElt from '../elements/AnimatedTextElt.vue'
import ParallaxMediaElt from '../elements/ParallaxMediaElt.vue'
import content from '../../locales/fr.json'

const ROW_IMAGES = [
  'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=1000&q=80'
]

const isDesktop = ref(true)

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
  /** `"left"` | `"right"` dans `fr.json` — typé en string pour l’inférence JSON. */
  imageSide: string
  /** Si vrai, insère un lien `mailto` vers l’email billetterie entre `text` et `textAfterEmail`. */
  billingEmailLink?: boolean
  textAfterEmail?: string
}

defineProps<{
  sectionAria: string
  rows: AlternatingFeatureRow[]
}>()

const billingEmail = content.brand.senderEmail
</script>

<style lang="scss" scoped>
@use 'sass:color';

/** Colonne image identique sur toutes les rangées + même écart texte ↔ image (le 2ᵉ bloc était plus resserré avec l’ancien --mediaLeft). */
$alt-features-visual-col: minmax(0, clamp(280px, 38vw, 440px));
$alt-features-column-gap-lg: clamp(120px, 18vw, 380px);

.altFeatures {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: $color-surface-page;
}

.altFeatures__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(28px, 5vw, 64px);
  align-items: center;
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(56px, 9vw, 96px) clamp(20px, 4vw, 40px);

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
  margin: 0 0 1rem 0;
  font-size: clamp(1.25rem, 2.2vw, 1.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: $color-text-primary;
  line-height: 1.2;

  @include media-up(lg) {
    font-size: clamp(1.45rem, 2.4vw, 1.85rem);
    margin-bottom: 1.15rem;
  }
}

.altFeatures__text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  max-width: min(32rem, 100%);
  color: $color-text-secondary;
  width: unset;

  @include media-up(lg) {
    /* Taille fixe + largeur max : plus de variation au gré du viewport. */
    font-size: 1.0625rem;
    line-height: 1.72;
    width: min(30rem, 100%);
  }
}

.altFeatures__emailLink {
  color: color.mix($color-primary, $color-text-secondary, 40%);
  font-weight: 500;
  transition: color 0.28s ease;
  overflow-wrap: anywhere;

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

.altFeatures__figure {
  margin: 0;
  min-width: 0;
  width: 100%;
}

.altFeatures__visual {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 0;
  background-size: cover;
  background-position: center;
  box-shadow: 0 16px 48px rgba(33, 37, 41, 0.1);

  &--v1 {
    background-image:
      linear-gradient(135deg, rgba(45, 31, 78, 0.45) 0%, rgba(102, 126, 234, 0.35) 100%),
      url('https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=1000&q=80');
    background-blend-mode: overlay;
  }

  &--v2 {
    background-image:
      linear-gradient(135deg, rgba(118, 75, 162, 0.5) 0%, rgba(13, 110, 253, 0.25) 100%),
      url('https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1000&q=80');
    background-blend-mode: multiply;
  }

  &--v3 {
    background-image:
      linear-gradient(120deg, rgba(26, 26, 46, 0.4) 0%, rgba(45, 31, 78, 0.5) 100%),
      url('https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=1000&q=80');
    background-blend-mode: overlay;
  }
}

.altFeatures__caption {
  margin-top: 0.65rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: $color-text-muted;
  display: none;

  @include media-up(lg) {
    font-size: 0.875rem;
    margin-top: 0.75rem;
  }
}

@media (max-width: 880px) {
  .altFeatures__row {
    grid-template-columns: 1fr;
    padding-top: clamp(40px, 8vw, 64px);
    padding-bottom: clamp(40px, 8vw, 64px);
  }

  .altFeatures__row--mediaLeft .altFeatures__copy,
  .altFeatures__row--mediaLeft .altFeatures__figure {
    order: unset;
  }

  .altFeatures__copy {
    max-width: min(32rem, 100%);
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
