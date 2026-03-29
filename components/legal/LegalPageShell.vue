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
  padding: 28px 16px 0;
  flex: 1 0 auto;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: 48px;
  box-sizing: border-box;
}
</style>
