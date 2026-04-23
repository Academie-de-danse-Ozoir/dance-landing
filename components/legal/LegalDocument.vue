<template>
  <article class="legalDocument">
    <header class="legalDocument__header">
      <h1 class="legalDocument__title">{{ title }}</h1>
      <p v-if="updatedAt" class="legalDocument__updated">{{ updatedAt }}</p>
      <p v-if="intro" class="legalDocument__intro">{{ intro }}</p>
    </header>

    <section v-for="(section, i) in sections" :key="i" class="legalDocument__section">
      <h2 class="section__title">{{ section.title }}</h2>
      <template v-for="(p, j) in section.paragraphs || []" :key="'p-' + j">
        <p class="section__p" :class="{ 'section__p--noWrap': p.includes('Email') }">{{ p }}</p>
      </template>
      <ul v-if="section.bullets?.length" class="section__ul">
        <li v-for="(b, k) in section.bullets" :key="'b-' + k" class="section__li">
          {{ b }}
        </li>
      </ul>
    </section>
  </article>
</template>

<script setup lang="ts">
export type LegalSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

defineProps<{
  title: string
  intro?: string
  updatedAt?: string
  sections: LegalSection[]
}>()
</script>

<style lang="scss" scoped>
.legalDocument {
  color: #212529;
  user-select: none;
  @include apply-font(body-md);
}

.legalDocument__header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #dee2e6;
}

.legalDocument__title {
  margin: 0 0 12px 0;
  color: #1a1a2e;
  @include apply-font(title-l);
  white-space: pre-line;
}

.legalDocument__updated {
  margin: 0 0 24px 0;
  color: #6c757d;
  @include apply-font(meta-13);
}

.legalDocument__intro {
  margin: 0;
  color: #495057;
  @include apply-font(text-s);
}

.legalDocument__section {
  margin-bottom: 28px;
  @include apply-font(text-s);
}

.section__title {
  margin: 0 0 12px 0;
  color: #343a40;
  @include apply-font(title-s);
}

.section__p {
  margin: 0 0 12px 0;

  &:last-child {
    margin-bottom: 0;
  }
}

.section__p--noWrap {
  white-space: nowrap;
}

.section__ul {
  margin: 0 0 12px 0;
  padding-left: 1.25rem;
}

.section__li {
  margin-bottom: 6px;
}
</style>
