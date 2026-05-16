<template>
  <section class="mapPricingSection" :aria-labelledby="titleId">
    <div class="mapPricingSection__inner">
      <header class="mapPricingSection__header">
        <AnimatedTextElt tag="p" class="mapPricingSection__kicker" :delay="0">{{
          content.home.mapAndPricing.eyebrow
        }}</AnimatedTextElt>
        <AnimatedTextElt tag="h2" :id="titleId" class="mapPricingSection__title" :delay="0.06">
          <template v-for="(part, i) in content.home.mapAndPricing.title.split('\n')" :key="i">
            <br v-if="i > 0" />
            {{ part }}
          </template>
        </AnimatedTextElt>
        <AnimatedTextElt tag="p" class="mapPricingSection__intro" :delay="0.12">
          <template v-for="(seg, i) in introSegments" :key="i">
            <template v-for="(part, j) in seg.text.split('\n')" :key="`${i}-${j}`">
              <br v-if="j > 0" />
              <span v-if="seg.bold" class="mapPricingSection__hl">{{ part }}</span>
              <template v-else>{{ part }}</template>
            </template>
          </template>
        </AnimatedTextElt>
      </header>

      <div class="mapPricingSection__grid">
        <article class="mapPricingSection__card">
          <h3 class="mapPricingSection__cardTitle">
            {{ content.home.mapAndPricing.pricing.title }}
          </h3>
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
          <h3 class="mapPricingSection__cardTitle">
            {{ content.home.mapAndPricing.saleInfo.title }}
          </h3>
          <ul class="mapPricingSection__saleInfoList" role="list">
            <li
              v-for="(line, i) in content.home.mapAndPricing.saleInfo.items"
              :key="i"
              class="mapPricingSection__saleInfoItem"
            >
              <template v-for="(seg, j) in parseBoldSegments(line)" :key="j">
                <template v-for="(part, k) in seg.text.split('\n')" :key="`${j}-${k}`">
                  <br v-if="k > 0" />
                  <span v-if="seg.bold" class="mapPricingSection__hl">{{ part }}</span>
                  <template v-else>{{ part }}</template>
                </template>
              </template>
            </li>
            <li class="mapPricingSection__saleInfoItem">
              {{ content.home.mapAndPricing.saleInfo.practicalNotice.prefix }}
              <button
                type="button"
                class="mapPricingSection__practicalLinkButton"
                @click="scrollToPracticalInfo"
              >
                {{ content.home.mapAndPricing.saleInfo.practicalNotice.link }}
              </button>
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
          <h4 class="mapPricingSection__subTitle">
            {{ content.home.mapAndPricing.map.legendTitle }}
          </h4>
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
          <h3 class="mapPricingSection__cardTitle">
            {{ content.home.mapAndPricing.limits.title }}
          </h3>
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
              >{{ content.home.mapAndPricing.pmr.phoneLabel }} :
            </span>
            <UnderlineLink class="mapPricingSection__pmrLink" :href="pmrTelHref">{{
              contactPhoneDisplay
            }}</UnderlineLink>
          </p>
          <p class="mapPricingSection__pmrLine">
            <span class="mapPricingSection__pmrLabel">
              <span class="mapPricingSection__pmrMailLabelDesktop">
                {{ content.home.mapAndPricing.pmr.mailLabel }}
              </span>
              <span class="mapPricingSection__pmrMailLabelMobile">Mail</span> :
            </span>
            <UnderlineLink
              class="mapPricingSection__pmrLink"
              :href="`mailto:${content.brand.displayEmail}`"
              >{{ content.brand.displayEmail }}</UnderlineLink
            >
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import UnderlineLink from '~/components/buttons/UnderlineLink.vue'
import AnimatedTextElt from '../elements/AnimatedTextElt.vue'
import { computed } from 'vue'
import content from '../../locales/fr.json'
import { MAX_SEATS_PER_ORDER, PRICE_ADULT_CENTS, PRICE_CHILD_CENTS } from '../../constants'
import { useLenis } from '../../composables/useLenis'
import { parseBoldSegments } from '../../utils/richText'

const titleId = 'map-pricing-section-title'
const pmrTitleId = 'map-pricing-pmr-title'
const lenis = useLenis()

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
})

const priceAdultFormatted = computed(() => eur.format(PRICE_ADULT_CENTS / 100))
const priceChildFormatted = computed(() => eur.format(PRICE_CHILD_CENTS / 100))

const introSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.intro))
const pricingLeadSegments = computed(() =>
  parseBoldSegments(content.home.mapAndPricing.pricing.lead)
)
const pricingDetailSegments = computed(() =>
  parseBoldSegments(content.home.mapAndPricing.pricing.detail)
)
const pricingFootnoteSegments = computed(() =>
  parseBoldSegments(content.home.mapAndPricing.pricing.footnote)
)
const mapLeadSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.map.lead))

const limitsHighlightSegments = computed(() =>
  parseBoldSegments(
    content.home.mapAndPricing.limits.highlight.replace(/\{max\}/g, String(MAX_SEATS_PER_ORDER))
  )
)
const limitsDetailSegments = computed(() =>
  parseBoldSegments(content.home.mapAndPricing.limits.detail)
)

const pmrSegments = computed(() => parseBoldSegments(content.home.mapAndPricing.pmr.text))

const contactPhoneDisplay = computed(() => content.brand.contactPhone?.trim() ?? '')

const pmrTelHref = computed(() => {
  const digits = contactPhoneDisplay.value.replace(/\D/g, '')
  return digits ? `tel:${digits}` : '#'
})

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

.mapPricingSection {
  font-family: $font-family-text;
  background: linear-gradient(
    180deg,
    $color-gray-50 0%,
    $color-surface-page 35%,
    $color-surface-page 100%
  );
  box-sizing: border-box;
  padding: clamp(48px, 8vw, 88px) clamp(20px, 4vw, 40px);
  user-select: none;
}

.mapPricingSection__inner {
  max-width: 56rem;
  margin: 0 auto;

  @include media-down(md) {
    max-width: 32rem;
  }
}

.mapPricingSection__header {
  max-width: 25.8rem;
  margin-bottom: clamp(4rem, 6.5vw, 6rem);

  @include media-up(lg) {
    transform: translateX(-3rem);
  }
  @include media-up(xl) {
    transform: translateX(-4.5rem);
  }
}

.mapPricingSection__kicker {
  margin: 0 0 24px 0;
  color: $color-text-muted;
  @include apply-font(label-s);
}

.mapPricingSection__title {
  margin: 0 0 16px 0;
  color: $color-text-primary;
  @include apply-font(title-l);
}

.mapPricingSection__intro {
  margin: 0;
  color: $color-text-secondary;
  @include apply-font(text-l);
  display: none;

  @include media-down(md) {
    grid-template-columns: 1fr;
    max-width: 310px;
  }
}

/** Accent discret (remplace le gras) : teinte bleu-gris liée à la charte. */
.mapPricingSection__hl {
  font-weight: 500;
  color: color.mix($color-primary, $color-text-secondary, 34%);
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
  border-radius: 4px;
  padding: clamp(20px, 3vw, 28px);
  min-width: 0;
  max-width: 400px;
}

.mapPricingSection__cardTitle {
  margin: 0 0 16px 0;
  color: $color-text-primary;
  @include apply-font(card-title);
}

.mapPricingSection__lead {
  margin: 0 0 1.25rem 0;
  color: $color-text-secondary;
  display: none;
  @include apply-font(text-sm-body);
}

.mapPricingSection__detail {
  margin: 0 0 1rem 0;
  display: none;
  color: $color-text-secondary;
  @include apply-font(text-sm-body);
}

.mapPricingSection__subTitle {
  margin: 0 0 0.75rem 0;
  color: $color-text-muted;
  @include apply-font(label-subsection);
}

.mapPricingSection__saleInfoList {
  margin: 0;
  padding: 0 0 0 1.2rem;
  list-style: disc;
}

.mapPricingSection__saleInfoItem {
  margin: 0 0 0.65rem 0;
  color: $color-text-secondary;
  @include apply-font(text-sm-body);

  &:last-child {
    margin-bottom: 0;
  }
}

.mapPricingSection__practicalLink {
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

.mapPricingSection__practicalLinkButton {
  position: relative;
  border: 0;
  padding: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
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

.mapPricingSection__practicalLinkButton::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right center;
  transition: transform 0.28s ease;
}

@media (hover: hover) {
  .mapPricingSection__practicalLinkButton:hover::after {
    transform: scaleX(1);
    transform-origin: left center;
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
  color: $color-text-secondary;
  @include apply-font(text-sm-body);
}

.mapPricingSection__priceValue {
  font-variant-numeric: tabular-nums;
  color: $color-text-primary;
  @include apply-font(title-price);
}

.mapPricingSection__footnote {
  margin: 0;
  color: $color-text-muted;
  @include apply-font(caption-sm);
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
  line-height: 1.5;
  color: $color-text-secondary;
  @include apply-font(text-sm-body);

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
  margin-top: calc((1.5em - 14px) / 2 + 0.09375rem);
  border-radius: 4px;

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

.mapPricingSection__limitHighlight {
  margin: 0 0 0.85rem 0;
  color: $color-text-secondary;
  @include apply-font(limit-highlight);
}

.mapPricingSection__limitDetail {
  margin: 0;
  color: $color-text-secondary;
  @include apply-font(text-sm-body);
}

.mapPricingSection__pmr {
  margin-top: clamp(2.8rem, 4.8vw, 4.4rem);
  padding-top: clamp(1.25rem, 2.5vw, 1.75rem);
  max-width: 27rem;
}

.mapPricingSection__pmrTitle {
  margin: 0 0 16px 0;
  color: $color-text-primary;
  @include apply-font(card-title);
}

.mapPricingSection__pmrText {
  margin: 0 0 16px 0;
  color: $color-text-secondary;
  @include apply-font(text-sm-body);
}

.mapPricingSection__pmrContact {
  margin: 0;
  line-height: 1.55;
  color: $color-text-secondary;
  @include apply-font(text-sm-body);
}

.mapPricingSection__pmrLine {
  margin: 0 0 0.4rem 0;
  display: flex;
  align-items: baseline;
  flex-wrap: nowrap;
  gap: 0.25rem;
  white-space: nowrap;

  &:last-child {
    margin-bottom: 0;
  }
}

.mapPricingSection__pmrLabel {
  font-weight: 500;
  color: $color-text-primary;
}

.mapPricingSection__pmrMailLabelMobile {
  display: none;
}

@include media-down(md) {
  .mapPricingSection__title {
    max-width: 12ch;
  }

  .mapPricingSection__pmrTitle {
    max-width: 15ch;
  }

  .mapPricingSection__pmrMailLabelDesktop {
    display: none;
  }

  .mapPricingSection__pmrMailLabelMobile {
    display: inline;
  }

  .mapPricingSection__lead,
  .mapPricingSection__detail,
  .mapPricingSection__saleInfoItem,
  .mapPricingSection__priceLabel,
  .mapPricingSection__legendItem,
  .mapPricingSection__limitHighlight,
  .mapPricingSection__limitDetail,
  .mapPricingSection__pmrText,
  .mapPricingSection__pmrContact {
    @include apply-font(text-sm-body-mobile);
  }
}

.mapPricingSection__pmrLink {
  color: color.mix($color-primary, $color-text-secondary, 40%);
  font-weight: 500;
  transition: color 0.28s ease;

  @media (hover: hover) {
    &:hover {
      color: $color-primary;
    }
  }
}
</style>
