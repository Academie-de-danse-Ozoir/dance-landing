<template>
  <section class="organicGallery" :aria-label="ariaLabel">
    <div class="organicGallery__grid">
      <div class="organicGallery__cell organicGallery__cell--1">
        <img
          class="organicGallery__img"
          src="https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=900&q=80"
          alt=""
          width="900"
          height="1125"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="organicGallery__cell organicGallery__cell--2">
        <img
          class="organicGallery__img"
          src="https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=80"
          alt=""
          width="1200"
          height="675"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="organicGallery__cell organicGallery__cell--3">
        <img
          class="organicGallery__img"
          src="https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=900&q=80"
          alt=""
          width="900"
          height="1125"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="organicGallery__cell organicGallery__cell--4">
        <img
          class="organicGallery__img"
          src="https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=80"
          alt=""
          width="1200"
          height="675"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  ariaLabel: string
}>()
</script>

<style lang="scss" scoped>
.organicGallery {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: $color-surface-page;
  border-bottom: 1px solid $color-border-subtle;
  box-sizing: border-box;
  overflow-x: clip;
}

/** Grille 12 cols : placements et tailles fixes (style « organique » par chevauchements), sans rotation. */
.organicGallery__grid {
  display: grid;
  box-sizing: border-box;
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(32px, 5vw, 64px) clamp(16px, 4vw, 40px);
  overflow: visible;
  isolation: isolate;

  @include media-up(lg) {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: clamp(20px, 2.4vw, 32px);
    /* Pas de row-gap global : les rangées 1–2 restent resserrées ; l’écart 2↔3 vient du margin-top du bloc 3. */
    row-gap: 0;
    min-height: clamp(600px, 74dvh, 880px);
    align-items: start;
  }

  @include media-down(lg) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    /* Écart 1↔2 : min plus haut + vw large pour ne pas se tasser vers le mobile. */
    column-gap: clamp(32px, 9vw, 64px);
    /* Espace net entre la zone 1–2 et la rangée 3–4 (évite que 3 colle à 2). */
    row-gap: clamp(44px, 8vw, 88px);
    padding-bottom: clamp(28px, 6vw, 48px);

    @include media-down(md) {
      column-gap: clamp(40px, 11vw, 72px);
    }
  }

  @include media-down(sm) {
    grid-template-columns: 1fr;
  }
}

.organicGallery__cell {
  position: relative;
  overflow: hidden;
  border-radius: clamp(2px, 0.2vw, 4px);
  box-shadow: 0 14px 40px rgba(33, 37, 41, 0.1);

  @include media-up(lg) {
    &--1 {
      grid-row: 1;
      grid-column: 4 / span 2;
      justify-self: center;
      width: clamp(200px, 17vw, 236px);
      height: clamp(268px, 23vw, 312px);
      margin-top: clamp(8px, 1.2vw, 20px);
      z-index: 3;
    }

    &--2 {
      grid-row: 2;
      grid-column: 7 / span 5;
      justify-self: end;
      width: clamp(360px, 38vw, 468px);
      height: clamp(420px, 44vw, 520px);
      margin-top: clamp(-40px, -3.5vw, -20px);
      margin-bottom: 0;
      margin-right: clamp(-4px, -0.5vw, 0px);
      z-index: 1;
    }

    /** Sous le bloc 2 : grand écart volontaire (desktop + tablette via règles séparées). */
    &--3 {
      grid-row: 3;
      grid-column: 1 / span 5;
      justify-self: start;
      width: clamp(400px, 44vw, 540px);
      height: clamp(280px, 30vw, 380px);
      margin-top: clamp(56px, 7vw, 120px);
      margin-left: clamp(0px, 1vw, 12px);
      z-index: 2;
    }

    &--4 {
      grid-row: 4;
      grid-column: 9 / span 3;
      justify-self: end;
      align-self: start;
      width: clamp(196px, 17vw, 228px);
      height: clamp(264px, 23vw, 304px);
      margin-top: clamp(-16px, -1.5vw, 0px);
      z-index: 3;
    }
  }

  @include media-down(lg) {
    &--1 {
      grid-column: 1 / span 2;
      grid-row: 1;
      width: clamp(140px, 42vw, 200px);
      height: clamp(180px, 52vw, 260px);
      justify-self: start;
      margin-right: clamp(12px, 4vw, 28px);

      @include media-down(md) {
        margin-right: clamp(16px, 5vw, 36px);
      }
    }

    &--2 {
      grid-column: 3 / span 4;
      grid-row: 1 / span 2;
      width: 100%;
      max-width: 100%;
      height: clamp(260px, 58vw, 380px);
      justify-self: end;
      margin-top: clamp(20px, 5vw, 40px);
      margin-bottom: 0;
      z-index: 1;
    }

    &--3 {
      grid-column: 1 / span 4;
      grid-row: 3;
      width: 100%;
      max-width: min(100%, 420px);
      height: clamp(200px, 48vw, 280px);
      margin-top: 0;
      z-index: 2;
    }

    &--4 {
      grid-column: 5 / span 2;
      grid-row: 3;
      width: clamp(120px, 32vw, 168px);
      height: clamp(160px, 42vw, 220px);
      justify-self: end;
      align-self: end;
      margin-top: 0;
      z-index: 3;
    }
  }

  @include media-down(sm) {
    grid-column: 1 / -1 !important;
    grid-row: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: clamp(200px, 52vw, 280px);
    aspect-ratio: 4 / 3;
    justify-self: stretch !important;
    margin: 0 !important;
  }
}

.organicGallery__img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}
</style>
