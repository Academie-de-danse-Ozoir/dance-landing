<template>
  <NuxtLink
    v-if="!isHref"
    :to="to!"
    :class="['underlineLink', { 'underlineLink--hideTouchLine': !showUnderlineOnTouch }]"
  >
    <slot />
  </NuxtLink>
  <a
    v-else
    :href="href!"
    :class="['underlineLink', { 'underlineLink--hideTouchLine': !showUnderlineOnTouch }]"
    :rel="rel"
    :target="target"
  >
    <slot />
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    to?: RouteLocationRaw
    href?: string
    rel?: string
    target?: string
    /**
     * Si `hover: none` (tactile) : ligne visible par défaut.
     * Mettre `false` pour garder la ligne masquée sans survol (ex. liens footer hors tel/mail).
     */
    showUnderlineOnTouch?: boolean
  }>(),
  {
    showUnderlineOnTouch: true
  }
)

const isHref = computed(() => typeof props.href === 'string' && props.href.length > 0)
</script>

<style lang="scss" scoped>
.underlineLink {
  position: relative;
  display: inline-block;
  max-width: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  vertical-align: baseline;
  -webkit-tap-highlight-color: transparent;
}

.underlineLink::after {
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

/** Pas de survol (tactile, etc.) : ligne visible par défaut pour voir le lien sans hover. */
@media (hover: none) {
  .underlineLink:not(.underlineLink--hideTouchLine)::after {
    transform: scaleX(1);
    transform-origin: left center;
  }
}

@media (hover: hover) {
  .underlineLink:hover::after {
    transform: scaleX(1);
    transform-origin: left center;
  }
}

.underlineLink:focus-visible::after {
  transform: scaleX(1);
  transform-origin: left center;
}
</style>
