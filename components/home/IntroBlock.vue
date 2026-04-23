<template>
  <section class="introBlock" aria-labelledby="introBlockTitle">
    <div class="introBlock__inner">
      <div class="introBlock__copy">
        <h2 id="introBlockTitle" class="introBlock__title">{{ title }}</h2>
        <p class="introBlock__lead">{{ lead }}</p>
        <div v-for="(block, i) in blocks" :key="i" class="introBlock__block">
          <h3 class="block__heading">{{ block.title }}</h3>
          <p class="block__text">{{ block.text }}</p>
        </div>
      </div>
      <div class="introBlock__media">
        <figure class="introBlock__figure">
          <ParallaxMediaElt
            class="figure__media figure__media--a"
            src="https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=70"
            :alt="visualAlt1"
            :has-parallax-mask="false"
            loading="lazy"
          />
          <figcaption class="figure__caption">{{ visualAlt1 }}</figcaption>
        </figure>
        <figure class="introBlock__figure">
          <ParallaxMediaElt
            class="figure__media figure__media--b"
            src="https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=70"
            :alt="visualAlt2"
            :has-parallax-mask="false"
            loading="lazy"
          />
          <figcaption class="figure__caption">{{ visualAlt2 }}</figcaption>
        </figure>
        <p class="introBlock__note">{{ noteUnderVisuals }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IntroTextBlock } from '../../types'
import ParallaxMediaElt from '../elements/ParallaxMediaElt.vue'

defineProps<{
  title: string
  lead: string
  blocks: IntroTextBlock[]
  visualAlt1: string
  visualAlt2: string
  noteUnderVisuals: string
}>()
</script>

<style lang="scss" scoped>
.introBlock {
  background: #f4f5f8;
  font-family: $font-family-text;
}

.introBlock__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(40px, 8vw, 72px) 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px 48px;
  align-items: start;
}

.introBlock__title {
  margin: 0 0 12px 0;
  @include apply-font(intro-title);
  color: #212529;
}

.introBlock__lead {
  margin: 0 0 24px 0;
  @include apply-font(body-md);
  color: #495057;
}

.introBlock__block + .introBlock__block {
  margin-top: 20px;
}

.block__heading {
  margin: 0 0 6px 0;
  @include apply-font(text-l);
  font-weight: 600;
  color: #343a40;
}

.block__text {
  margin: 0;
  @include apply-font(text-s);
  line-height: 1.55;
  color: #495057;
}

.introBlock__media {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.introBlock__figure {
  margin: 0;
}

.figure__media {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(33, 37, 41, 0.12);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
  }

  &--a::after {
    background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-blend-mode: overlay;
  }

  &--b::after {
    background-image: linear-gradient(
      135deg,
      rgba(118, 75, 162, 0.85) 0%,
      rgba(102, 126, 234, 0.75) 100%
    );
    background-blend-mode: multiply;
  }
}

.figure__caption {
  margin-top: 8px;
  @include apply-font(caption-12);
  color: #6c757d;
}

.introBlock__note {
  margin: 4px 0 0 0;
  @include apply-font(caption-11);
  color: #868e96;
}

@media (max-width: 840px) {
  .introBlock__inner {
    grid-template-columns: 1fr;
  }

  .introBlock__media {
    order: -1;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .introBlock__figure {
    flex: 1 1 calc(50% - 8px);
    min-width: 140px;
  }

  .introBlock__note {
    flex-basis: 100%;
  }
}
</style>
