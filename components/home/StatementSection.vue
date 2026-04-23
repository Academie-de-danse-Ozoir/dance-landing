<template>
  <section class="statementSection" aria-labelledby="statementSectionTitle">
    <div class="statementSection__frame">
      <AnimatedTextElt tag="p" class="statementSection__kicker" :delay="0">{{
        eyebrow
      }}</AnimatedTextElt>
      <AnimatedTextElt
        tag="h2"
        id="statementSectionTitle"
        class="statementSection__title"
        :delay="0.06"
        >{{ title }}</AnimatedTextElt
      >
      <AnimatedTextElt tag="p" class="statementSection__lead" :delay="0.12">{{
        lead
      }}</AnimatedTextElt>
    </div>
  </section>
</template>

<script setup lang="ts">
import AnimatedTextElt from '../elements/AnimatedTextElt.vue'

defineProps<{
  eyebrow: string
  title: string
  lead: string
}>()
</script>

<style lang="scss" scoped>
.statementSection {
  font-family: $font-family-text;
  min-height: 100dvh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: clamp(48px, 10vh, 120px) clamp(20px, 5vw, 56px);
  user-select: none;
  background: linear-gradient(
    165deg,
    $color-gray-50 0%,
    $color-surface-page 38%,
    $color-gray-100 100%
  );
}

.statementSection__frame {
  width: 100%;
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;

  @include media-down(lg) {
    max-width: 20.5rem;
  }
}

.statementSection__kicker {
  margin: 0 0 24px 0;
  color: $color-text-muted;
  @include apply-font(label-s);
}

.statementSection__title {
  margin: 0 auto 24px;
  max-width: 12.5ch;
  color: $color-text-primary;
  @include apply-font(title-xl);
  overflow-wrap: normal;
  word-break: normal;

  @include media-down(lg) {
    max-width: 8ch;
  }
}

.statementSection__lead {
  margin: 0;
  color: $color-text-secondary;
  @include apply-font(text-l);
}
</style>
