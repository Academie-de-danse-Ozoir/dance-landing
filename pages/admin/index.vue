<template>
  <div class="adminBilletterie">
    <div class="adminBilletterie__logout">
      <DefaultButton
        type="button"
        variant="primary"
        :label="fr.backoffice.logout"
        :disabled="logoutPending"
        @click="onLogout"
      />
    </div>
    <BookingBlock is-admin-free-booking />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import fr from '../../locales/fr.json'
import DefaultButton from '../../components/buttons/DefaultButton.vue'
import BookingBlock from '../../components/home/BookingBlock.vue'

const logoutPending = ref(false)

definePageMeta({
  ssr: false,
  layout: false,
  middleware: ['backoffice-auth'],
  head: { meta: [{ name: 'robots', content: 'noindex, nofollow' }] }
})

async function onLogout() {
  logoutPending.value = true
  try {
    await $fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
  } catch {
    // exit anyway
  } finally {
    logoutPending.value = false
    await navigateTo('/admin/login')
  }
}
</script>

<style lang="scss" scoped>
.adminBilletterie {
  position: relative;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  color: #e8e8ef;
  font-family: $font-family-text;
}

/* Même inset que `AppBrandLogoMark--floating` (padding header) : symétrique logo haut-gauche. */
.adminBilletterie__logout {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 60;
  box-sizing: border-box;
  padding-top: max(env(safe-area-inset-top), clamp(20px, 4vw, 36px));
  padding-right: max(env(safe-area-inset-right), clamp(20px, 4vw, 36px));
  padding-bottom: clamp(20px, 4vw, 36px);
  padding-left: clamp(20px, 4vw, 36px);
  line-height: 0;
  pointer-events: none;

  :deep(.defaultButton) {
    pointer-events: auto;
  }

  :deep(.defaultButton.defaultButton--disabled) {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.16);
    color: rgba(255, 255, 255, 0.45);
  }

  :deep(.defaultButton--primary:not(.defaultButton--disabled)) {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 4px 14px rgba(13, 110, 253, 0.35);
  }
}
</style>
