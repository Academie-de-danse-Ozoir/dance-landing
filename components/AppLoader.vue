<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppLoader } from '~/composables/useAppLoader'
import AppLogo from './AppLogo.vue'

const { setRevealed } = useAppLoader()
const isVisible = ref(true)
const isMaskVisible = ref(true)

onMounted(() => {
  // 1. On attend la fin du chargement initial
  setTimeout(() => {
    // 2. Le loader sombre s'efface
    isVisible.value = false

    // 3. Un court instant après, le masque blanc s'efface aussi
    setTimeout(() => {
      isMaskVisible.value = false
      // On déclenche le signal pour les autres composants
      setRevealed(true)
    }, 400)
  }, 900)
})
</script>

<template>
  <div class="loaderSequence">
    <!-- Masque Blanc (en dessous du loader visuellement) -->
    <Transition name="maskFade">
      <div v-if="isMaskVisible" class="appLoader__mask" />
    </Transition>

    <!-- Loader Principal (au dessus) -->
    <Transition name="loaderFade">
      <div v-if="isVisible" class="appLoader">
        <div class="appLoader__content">
          <AppLogo size="xl" variant="light" icon-only />
          <div class="appLoader__progress">
            <div class="appLoader__progressBar" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.loaderSequence {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
}

.appLoader,
.appLoader__mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.appLoader {
  z-index: 2;
  background: #0f0c1c;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: auto;
}

.appLoader__mask {
  z-index: 1;
  background: #0f0c1c;
}

.appLoader__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  width: 100%;
  max-width: 500px;
  padding: 40px;
}

.appLoader__progress {
  width: 140px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.appLoader__progressBar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: #dbb366;
  transform: translateX(-100%);
  animation: progressAnim 1s ease forwards;
}

@keyframes progressAnim {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

// Transitions
.maskFade-leave-active {
  transition: opacity 0.75s ease;
}
.loaderFade-leave-active {
  transition: opacity 0.5s ease;
}

.loaderFade-leave-to,
.maskFade-leave-to {
  opacity: 0;
}
</style>
