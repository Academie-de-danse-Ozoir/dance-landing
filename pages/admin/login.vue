<template>
  <div class="backofficeLogin">
    <h1 class="backofficeLogin__title">{{ t.loginTitle }}</h1>
    <form class="backofficeLogin__form" @submit.prevent="onSubmit">
      <label class="backofficeLogin__label">
        <span>{{ t.password }}</span>
        <input
          v-model="password"
          class="backofficeLogin__input"
          type="password"
          name="password"
          autocomplete="current-password"
          required
        />
      </label>
      <p v-if="error" class="backofficeLogin__err">{{ error }}</p>
      <DefaultButton type="submit" variant="primary" :label="t.submit" :disabled="pending" />
    </form>
  </div>
</template>

<script setup lang="ts">
import fr from '../../locales/fr.json'
import DefaultButton from '../../components/buttons/DefaultButton.vue'

const t = fr.backoffice

definePageMeta({
  ssr: false,
  layout: 'admin',
  pageTransition: { name: 'page-opacity', mode: 'out-in' },
  head: { meta: [{ name: 'robots', content: 'noindex, nofollow' }] }
})

const route = useRoute()
const password = ref('')
const error = ref('')
const pending = ref(false)

onMounted(async () => {
  try {
    await $fetch('/api/admin/session', { credentials: 'include' })
    await navigateTo(typeof route.query.redirect === 'string' ? route.query.redirect : '/admin')
  } catch {
    // stay on login
  }
})

async function onSubmit() {
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { password: password.value },
      credentials: 'include'
    })
    const to =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/admin')
        ? route.query.redirect
        : '/admin'
    await navigateTo(to)
  } catch (e: unknown) {
    const st = (e as { data?: { statusMessage?: string } })?.data?.statusMessage
    error.value = st || 'Identifiants invalides.'
  } finally {
    pending.value = false
  }
}
</script>

<style scoped lang="scss">
.backofficeLogin {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  padding-top: max(24px, env(safe-area-inset-top));
  background: #1a1a2e;
  color: #e8e8ef;
  font-family: $font-family-text;
  box-sizing: border-box;
}

.backofficeLogin__title {
  margin: 0 0 24px 0;
  font-size: 1.3rem;
  font-weight: 400;
  letter-spacing: 0.07em;
}

.backofficeLogin__form {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  :deep(.defaultButton) {
    width: 100%;
    box-sizing: border-box;
  }

  :deep(.defaultButton--primary:not(.defaultButton--disabled)) {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 4px 14px rgba(13, 110, 253, 0.35);
  }
}

.backofficeLogin__label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
}

.backofficeLogin__input {
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid #3f3f5a;
  background: #12121f;
  color: #fff;
  font-size: 1rem;
}

.backofficeLogin__err {
  margin: 0;
  font-size: 0.85rem;
  color: #f87171;
}

.backofficeLogin :deep(.defaultButton.defaultButton--disabled) {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.45);
}
</style>
