<template>
  <div class="legalPage">
    <div class="legalPage__inner">
      <slot />
    </div>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import SiteFooter from '~/components/layout/SiteFooter.vue'
</script>

<style lang="scss" scoped>
/* Colonne flex + min-height : le footer (margin-top: auto) reste en bas et pleine largeur. */
.legalPage {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
}

.legalPage__inner {
  padding-top: clamp(100px, 14vh, 160px); // Évite le chevauchement avec le logo fixe
  padding-left: clamp(20px, 4vw, 36px);
  padding-right: clamp(20px, 4vw, 36px);
  flex: 1 0 auto;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: 48px;
  box-sizing: border-box;
}
</style>
