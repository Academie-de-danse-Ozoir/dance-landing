<template>
  <section class="statementSection" aria-labelledby="statementSectionTitle">
    <div class="statementSection__frame">
      <p class="statementSection__eyebrow">{{ eyebrow }}</p>
      <h2 id="statementSectionTitle" class="statementSection__title">{{ title }}</h2>
      <p class="statementSection__lead">{{ lead }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  lead: string
}>()
</script>

<style lang="scss" scoped>
.statementSection {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100dvh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: clamp(48px, 10vh, 120px) clamp(20px, 5vw, 56px);
  background: linear-gradient(
    165deg,
    $color-gray-50 0%,
    $color-surface-page 38%,
    $color-gray-100 100%
  );
  border-bottom: 1px solid $color-border-subtle;
}

.statementSection__frame {
  width: 100%;
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;
}

.statementSection__eyebrow {
  margin: 0 0 1rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: $color-text-muted;
}

.statementSection__title {
  margin: 0 0 clamp(1.25rem, 3vw, 2rem) 0;
  font-size: clamp(1.75rem, 4.5vw, 2.75rem);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: $color-text-primary;
}

.statementSection__lead {
  margin: 0;
  font-size: clamp(1.0625rem, 2.1vw, 1.3125rem);
  line-height: 1.75;
  color: $color-text-secondary;
  font-weight: 400;
}
</style>
