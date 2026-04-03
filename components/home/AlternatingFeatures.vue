<template>
  <section class="altFeatures" :aria-label="sectionAria">
    <article
      v-for="(row, i) in rows"
      :key="i"
      class="altFeatures__row"
      :class="{ 'altFeatures__row--mediaLeft': row.imageSide === 'left' }"
    >
      <div class="altFeatures__copy">
        <h2 class="altFeatures__title">{{ row.title }}</h2>
        <p class="altFeatures__text">{{ row.text }}</p>
      </div>
      <figure class="altFeatures__figure">
        <div
          class="altFeatures__visual"
          :class="`altFeatures__visual--v${(i % 3) + 1}`"
          role="img"
          :aria-label="row.caption"
        />
        <figcaption class="altFeatures__caption">{{ row.caption }}</figcaption>
      </figure>
    </article>
  </section>
</template>

<script setup lang="ts">
export type AlternatingFeatureRow = {
  title: string
  text: string
  /** `"left"` | `"right"` dans `fr.json` — typé en string pour l’inférence JSON. */
  imageSide: string
}

defineProps<{
  sectionAria: string
  rows: AlternatingFeatureRow[]
}>()
</script>

<style lang="scss" scoped>
.altFeatures {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
  border-bottom: 1px solid $color-border-subtle;

  &:last-child {
    border-bottom: none;
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
}

.altFeatures__text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: $color-text-secondary;
}

.altFeatures__figure {
  margin: 0;
}

.altFeatures__visual {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 16px 48px rgba(33, 37, 41, 0.1);

  &--v1 {
    background-image: linear-gradient(135deg, rgba(45, 31, 78, 0.45) 0%, rgba(102, 126, 234, 0.35) 100%),
      url('https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=1000&q=80');
    background-blend-mode: overlay;
  }

  &--v2 {
    background-image: linear-gradient(135deg, rgba(118, 75, 162, 0.5) 0%, rgba(13, 110, 253, 0.25) 100%),
      url('https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1000&q=80');
    background-blend-mode: multiply;
  }

  &--v3 {
    background-image: linear-gradient(120deg, rgba(26, 26, 46, 0.4) 0%, rgba(45, 31, 78, 0.5) 100%),
      url('https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=1000&q=80');
    background-blend-mode: overlay;
  }
}

.altFeatures__caption {
  margin-top: 0.65rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: $color-text-muted;
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

  .altFeatures__figure {
    order: -1;
  }

  .altFeatures__row--mediaLeft .altFeatures__figure {
    order: -1;
  }
}
</style>
