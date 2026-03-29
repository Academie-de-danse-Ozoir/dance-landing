<template>
  <div class="siteShell">
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

.siteShell__main {
  flex: 1 0 auto;
  min-height: 100vh;
}
</style>
