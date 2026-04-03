<template>
  <div class="siteShell">
    <div class="siteShell__bannerHost">
      <BookingOrderBanner />
    </div>
    <main class="siteShell__main">
      <slot />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.siteShell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.siteShell__bannerHost {
  flex: 0 0 0;
  height: 0;
  overflow: visible;
  pointer-events: none;
}

.siteShell__main {
  flex: 1 0 auto;
  min-height: 100vh;
}
</style>
