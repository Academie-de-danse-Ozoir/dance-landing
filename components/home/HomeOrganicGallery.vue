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
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: $color-surface-page;
  box-sizing: border-box;
  overflow-x: clip;
  display: flex;
  justify-content: center;
}

/** Grille 12 cols : placements et tailles fixes (style « organique » par chevauchements), sans rotation. */
.organicGallery__grid {
  display: grid;
  box-sizing: border-box;
  width: 100%;
  min-width: 600px;
  max-width: 1280px;
  padding: clamp(32px, 5vw, 64px) clamp(24px, 4vw, 40px);
  overflow: visible;
  isolation: isolate;

  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: clamp(14px, 2.4vw, 32px);
  /* Pas de row-gap global : les rangées 1–2 restent resserrées ; l’écart 2↔3 vient du margin-top du bloc 3. */
  row-gap: 0;
  min-height: clamp(400px, 74dvh, 880px);
  align-items: start;
}

.organicGallery__cell {
  position: relative;
  overflow: hidden;
  box-shadow: 0 14px 40px rgba(33, 37, 41, 0.1);

  &--1 {
    grid-row: 1;
    grid-column: 4 / span 2;
    justify-self: center;
    width: clamp(100px, 17vw, 236px);
    height: clamp(140px, 23vw, 312px);
    margin-top: clamp(7px, 1.2vw, 20px);
    z-index: 3;
  }

  &--2 {
    grid-row: 2;
    grid-column: 7 / span 5;
    justify-self: end;
    width: clamp(230px, 38vw, 468px);
    height: clamp(265px, 44vw, 520px);
    margin-top: clamp(-40px, -3.5vw, -21px);
    margin-bottom: 0;
    margin-right: clamp(-4px, -0.5vw, 0px);
    z-index: 1;
  }

  /** Sous le bloc 2 : grand écart volontaire (desktop + tablette via règles séparées). */
  &--3 {
    grid-row: 3;
    grid-column: 1 / span 5;
    justify-self: start;
    width: clamp(265px, 44vw, 540px);
    height: clamp(180px, 30vw, 380px);
    margin-top: clamp(42px, 7vw, 120px);
    margin-left: clamp(0px, 1vw, 12px);
    z-index: 2;
  }

  &--4 {
    grid-row: 4;
    grid-column: 9 / span 3;
    justify-self: end;
    align-self: start;
    width: clamp(100px, 17vw, 228px);
    height: clamp(140px, 23vw, 304px);
    margin-top: clamp(-16px, -1.5vw, -9px);
    z-index: 3;
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
