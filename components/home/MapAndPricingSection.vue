<template>
  <section class="mapPricingSection" :aria-labelledby="titleId">
    <div class="mapPricingSection__inner">
      <header class="mapPricingSection__header">
        <p class="mapPricingSection__eyebrow">{{ content.home.mapAndPricing.eyebrow }}</p>
        <h2 :id="titleId" class="mapPricingSection__title">{{ content.home.mapAndPricing.title }}</h2>
        <p class="mapPricingSection__intro">
          <span v-for="(seg, i) in introSegments" :key="i">
            <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
            <template v-else>{{ seg.text }}</template>
          </span>
        </p>
      </header>

      <div class="mapPricingSection__grid">
        <article class="mapPricingSection__card">
          <h3 class="mapPricingSection__cardTitle">{{ content.home.mapAndPricing.pricing.title }}</h3>
          <p class="mapPricingSection__lead">
            <span v-for="(seg, i) in pricingLeadSegments" :key="i">
              <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
              <template v-else>{{ seg.text }}</template>
            </span>
          </p>
          <ul class="mapPricingSection__priceList">
            <li class="mapPricingSection__priceRow">
              <span class="mapPricingSection__priceLabel">{{
                content.home.mapAndPricing.pricing.adultLabel
              }}</span>
              <span class="mapPricingSection__priceValue">{{ priceAdultFormatted }}</span>
            </li>
            <li class="mapPricingSection__priceRow">
              <span class="mapPricingSection__priceLabel">{{
                content.home.mapAndPricing.pricing.childLabel
              }}</span>
              <span class="mapPricingSection__priceValue">{{ priceChildFormatted }}</span>
            </li>
          </ul>
          <p class="mapPricingSection__detail">
            <span v-for="(seg, i) in pricingDetailSegments" :key="i">
              <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
              <template v-else>{{ seg.text }}</template>
            </span>
          </p>
          <p class="mapPricingSection__footnote">
            <span v-for="(seg, i) in pricingFootnoteSegments" :key="i">
              <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
              <template v-else>{{ seg.text }}</template>
            </span>
          </p>
        </article>

        <article class="mapPricingSection__card">
          <h3 class="mapPricingSection__cardTitle">{{ content.home.mapAndPricing.saleInfo.title }}</h3>
          <ul class="mapPricingSection__saleInfoList" role="list">
            <li
              v-for="(line, i) in content.home.mapAndPricing.saleInfo.items"
              :key="i"
              class="mapPricingSection__saleInfoItem"
            >
              <span v-for="(seg, j) in parseBoldSegments(line)" :key="j">
                <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
                <template v-else>{{ seg.text }}</template>
              </span>
            </li>
          </ul>
        </article>

        <article class="mapPricingSection__card">
          <h3 class="mapPricingSection__cardTitle">{{ content.home.mapAndPricing.map.title }}</h3>
          <p class="mapPricingSection__lead">
            <span v-for="(seg, i) in mapLeadSegments" :key="i">
              <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
              <template v-else>{{ seg.text }}</template>
            </span>
          </p>
          <h4 class="mapPricingSection__subTitle">{{ content.home.mapAndPricing.map.legendTitle }}</h4>
          <ul class="mapPricingSection__legend" role="list">
            <li
              v-for="row in content.home.mapAndPricing.map.legend"
              :key="row.key"
              class="mapPricingSection__legendItem"
            >
              <span
                class="mapPricingSection__swatch"
                :class="`mapPricingSection__swatch--${row.key}`"
                aria-hidden="true"
              />
              <span class="mapPricingSection__legendBody">
                <span class="mapPricingSection__legendTerm">{{ row.term }}</span>
                <span class="mapPricingSection__legendDetail"> — {{ row.detail }}</span>
              </span>
            </li>
          </ul>
        </article>

        <article class="mapPricingSection__card">
          <h3 class="mapPricingSection__cardTitle">{{ content.home.mapAndPricing.controls.title }}</h3>
          <p class="mapPricingSection__controlsLead">
            <span v-for="(seg, i) in controlsLeadSegments" :key="i">
              <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
              <template v-else>{{ seg.text }}</template>
            </span>
          </p>
          <ul class="mapPricingSection__controlList">
            <li v-for="(item, i) in content.home.mapAndPricing.controls.items" :key="i" class="mapPricingSection__controlItem">
              <span class="mapPricingSection__controlLabel">{{ item.label }}</span>
              <span class="mapPricingSection__controlText">
                <span v-for="(seg, j) in parseBoldSegments(item.text)" :key="j">
                  <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
                  <template v-else>{{ seg.text }}</template>
                </span>
              </span>
            </li>
          </ul>
        </article>

        <article class="mapPricingSection__card">
          <h3 class="mapPricingSection__cardTitle">{{ content.home.mapAndPricing.limits.title }}</h3>
          <p class="mapPricingSection__limitHighlight">
            <span v-for="(seg, i) in limitsHighlightSegments" :key="i">
              <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
              <template v-else>{{ seg.text }}</template>
            </span>
          </p>
          <p class="mapPricingSection__limitDetail">
            <span v-for="(seg, i) in limitsDetailSegments" :key="i">
              <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
              <template v-else>{{ seg.text }}</template>
            </span>
          </p>
        </article>
      </div>

      <aside class="mapPricingSection__pmr" :aria-labelledby="pmrTitleId">
        <h3 :id="pmrTitleId" class="mapPricingSection__pmrTitle">
          {{ content.home.mapAndPricing.pmr.title }}
        </h3>
        <p class="mapPricingSection__pmrText">
          <span v-for="(seg, i) in pmrSegments" :key="i">
            <span v-if="seg.bold" class="mapPricingSection__hl">{{ seg.text }}</span>
            <template v-else>{{ seg.text }}</template>
          </span>
        </p>
        <div class="mapPricingSection__pmrContact">
          <p class="mapPricingSection__pmrLine">
            <span class="mapPricingSection__pmrLabel"
              >{{ content.home.mapAndPricing.pmr.phoneLabel }} : </span
            >
            <UnderlineLink class="mapPricingSection__pmrLink" :href="pmrTelHref">{{
              contactPhoneDisplay
            }}</UnderlineLink>
          </p>
          <p class="mapPricingSection__pmrLine">
            <span class="mapPricingSection__pmrLabel"
              >{{ content.home.mapAndPricing.pmr.mailLabel }} : </span
            >
            <UnderlineLink class="mapPricingSection__pmrLink" :href="`mailto:${content.brand.senderEmail}`">{{
              content.brand.senderEmail
            }}</UnderlineLink>
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import UnderlineLink from '~/components/buttons/UnderlineLink.vue'
import { computed } from 'vue'
import content from '../../locales/fr.json'
import { MAX_SEATS_PER_ORDER, PRICE_ADULT_CENTS, PRICE_CHILD_CENTS } from '../../constants'
import { parseBoldSegments } from '../../utils/richText'

const titleId = 'map-pricing-section-title'
const pmrTitleId = 'map-pricing-pmr-title'

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
})

const priceAdultFormatted = computed(() => eur.format(PRICE_ADULT_CENTS / 100))
const priceChildFormatted = computed(() => eur.format(PRICE_CHILD_CENTS / 100))

const introSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.intro))
const pricingLeadSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.pricing.lead))
const pricingDetailSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.pricing.detail))
const pricingFootnoteSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.pricing.footnote))
const mapLeadSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.map.lead))
const controlsLeadSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.controls.lead))

const limitsHighlightSegments = computed(() =>
  parseBoldSegments(
    content.home.mapAndPricing.limits.highlight.replace(/\{max\}/g, String(MAX_SEATS_PER_ORDER))
  )
)
const limitsDetailSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.limits.detail))

const pmrSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.pmr.text))

const contactPhoneDisplay = computed(() => content.brand.contactPhone?.trim() ?? '')

const pmrTelHref = computed(() => {
  const digits = contactPhoneDisplay.value.replace(/\D/g, '')
  return digits ? `tel:${digits}` : '#'
})
</script>

<style lang="scss" scoped>
.mapPricingSection {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(
    180deg,
    $color-gray-50 0%,
    $color-surface-page 35%,
    $color-surface-page 100%
  );
  border-bottom: 1px solid $color-border-subtle;
  box-sizing: border-box;
  padding: clamp(48px, 8vw, 88px) clamp(20px, 4vw, 40px);
}

.mapPricingSection__inner {
  max-width: 1120px;
  margin: 0 auto;
}

.mapPricingSection__header {
  max-width: 44rem;
  margin-bottom: clamp(2rem, 4vw, 2.75rem);
}

.mapPricingSection__eyebrow {
  margin: 0 0 0.75rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: $color-text-muted;
}

.mapPricingSection__title {
  margin: 0 0 1rem 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: $color-text-primary;
}

.mapPricingSection__intro {
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: $color-text-secondary;
}

/** Accent discret (remplace le gras) : teinte bleu-gris liée à la charte. */
.mapPricingSection__hl {
  font-weight: 500;
  color: mix($color-primary, $color-text-secondary, 34%);
}

.mapPricingSection__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(20px, 3vw, 28px);

  @include media-down(md) {
    grid-template-columns: 1fr;
  }
}

.mapPricingSection__card {
  background: $color-surface-page;
  border: 1px solid $color-border-subtle;
  border-radius: 10px;
  padding: clamp(20px, 3vw, 28px);
  box-shadow: 0 8px 28px rgba(33, 37, 41, 0.06);
  min-width: 0;
}

.mapPricingSection__cardTitle {
  margin: 0 0 0.65rem 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: $color-text-primary;
}

.mapPricingSection__lead {
  margin: 0 0 1.25rem 0;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: $color-text-secondary;
}

.mapPricingSection__detail {
  margin: 0 0 1rem 0;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: $color-text-secondary;
}

.mapPricingSection__subTitle {
  margin: 0 0 0.75rem 0;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $color-text-muted;
}

.mapPricingSection__saleInfoList {
  margin: 0;
  padding: 0 0 0 1.2rem;
  list-style: disc;
}

.mapPricingSection__saleInfoItem {
  margin: 0 0 0.65rem 0;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: $color-text-secondary;

  &:last-child {
    margin-bottom: 0;
  }
}

.mapPricingSection__priceList {
  margin: 0 0 1rem 0;
  padding: 0;
  list-style: none;
}

.mapPricingSection__priceRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid $color-border-subtle;

  &:last-of-type {
    border-bottom: none;
  }
}

.mapPricingSection__priceLabel {
  font-size: 0.9375rem;
  font-weight: 400;
  color: $color-text-secondary;
}

.mapPricingSection__priceValue {
  font-size: 1.25rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: $color-text-primary;
}

.mapPricingSection__footnote {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: $color-text-muted;
}

.mapPricingSection__legend {
  margin: 0;
  padding: 0;
  list-style: none;
}

.mapPricingSection__legendItem {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 0 0.65rem 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: $color-text-secondary;

  &:last-child {
    margin-bottom: 0;
  }
}

.mapPricingSection__legendBody {
  display: block;
}

.mapPricingSection__legendTerm {
  font-weight: 700;
  color: $color-text-primary;
}

.mapPricingSection__legendDetail {
  font-weight: 400;
}

.mapPricingSection__swatch {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-top: 3px;
  border-radius: 3px;

  &--free {
    background: $seat-map-seat-fill-free;
    box-shadow: inset 0 0 0 1px $seat-map-legend-swatch-border;
  }
  &--selected {
    background: $seat-map-seat-fill-selected;
  }
  &--hold {
    background: $seat-map-seat-fill-hold;
  }
  &--paid {
    background: $seat-map-seat-fill-paid;
  }
}

.mapPricingSection__controlsLead {
  margin: 0 0 1rem 0;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: $color-text-secondary;
}

.mapPricingSection__controlList {
  margin: 0;
  padding: 0;
  list-style: none;
}

.mapPricingSection__controlItem {
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.mapPricingSection__controlLabel {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: mix($color-text-primary, $color-text-secondary, 58%);
  letter-spacing: -0.01em;
}

.mapPricingSection__controlText {
  display: block;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: $color-text-secondary;
}

.mapPricingSection__limitHighlight {
  margin: 0 0 0.85rem 0;
  font-size: 1rem;
  line-height: 1.55;
  font-weight: 400;
  color: $color-text-secondary;
}

.mapPricingSection__limitDetail {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: $color-text-secondary;
}

.mapPricingSection__pmr {
  margin-top: clamp(1.75rem, 3vw, 2.25rem);
  padding-top: clamp(1.25rem, 2.5vw, 1.75rem);
  border-top: 1px solid $color-border-subtle;
  max-width: 44rem;
}

.mapPricingSection__pmrTitle {
  margin: 0 0 0.65rem 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: $color-text-primary;
}

.mapPricingSection__pmrText {
  margin: 0 0 0.85rem 0;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: $color-text-secondary;
}

.mapPricingSection__pmrContact {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: $color-text-secondary;
}

.mapPricingSection__pmrLine {
  margin: 0 0 0.4rem 0;

  &:last-child {
    margin-bottom: 0;
  }
}

.mapPricingSection__pmrLabel {
  font-weight: 500;
  color: $color-text-primary;
}

.mapPricingSection__pmrLink {
  color: mix($color-primary, $color-text-secondary, 40%);
  font-weight: 500;
  transition: color 0.28s ease;

  @media (hover: hover) {
    &:hover {
      color: $color-primary;
    }
  }
}
</style>
