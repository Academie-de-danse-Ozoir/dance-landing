<template>
  <div class="page">
    <div class="card">
      <div v-if="!loading" class="cancel-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" fill="#dc3545" />
          <path
            d="M8 8l8 8M8 16l8-8"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <div v-else class="loading-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#6c757d"
            stroke-width="2"
            fill="none"
            stroke-dasharray="31.416"
            stroke-dashoffset="31.416"
          >
            <animate
              attributeName="stroke-dasharray"
              dur="2s"
              values="0 31.416;15.708 15.708;0 31.416;0 31.416"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-dashoffset"
              dur="2s"
              values="0;-15.708;-31.416;-31.416"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      <h1 v-if="loading">Annulation en cours</h1>
      <h1 v-else-if="success">Réservation annulée</h1>
      <h1 v-else>Erreur</h1>

      <p v-if="loading" class="loading-message">
        Annulation de votre réservation en cours…
      </p>

      <p v-else-if="success" class="success-message">
        Le paiement a été annulé.<br />
        Les sièges ont été libérés.
      </p>

      <p v-else class="error-message">
        Une erreur est survenue lors de l'annulation.
      </p>

      <NuxtLink
        to="/"
        class="btn btn-primary"
        :class="{ 'btn-disabled': loading }"
      >
        Retour à la sélection des sièges
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

// @ts-expect-error - useRoute is auto-imported in Nuxt 3
const route = useRoute()

const loading = ref(true)
const success = ref(false)

onMounted(async () => {
  const orderId = route.query.order_id as string | undefined

  if (!orderId) {
    loading.value = false
    return
  }

  try {
    await $fetch('/api/cancel-order', {
      method: 'POST',
      body: { orderId }
    })

    success.value = true
  } catch (e) {
    console.error('Cancel order error:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  padding: 20px;
}

.card {
  background: white;
  padding: 48px 32px;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.cancel-icon,
.loading-icon {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  animation: scaleIn 0.5s ease-out 0.2s both;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

h1 {
  margin: 0 0 16px 0;
  font-size: 28px;
  font-weight: 600;
  color: #212529;
}

.loading-message {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 500;
  color: #6c757d;
  line-height: 1.5;
}

.success-message {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 500;
  color: #198754;
  line-height: 1.5;
}

.error-message {
  margin: 0 0 32px 0;
  font-size: 18px;
  font-weight: 500;
  color: #dc3545;
  line-height: 1.5;
}

.btn {
  display: inline-block;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  background-color: #0d6efd;
  border: 1px solid #0d6efd;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  color: white;
  transition: all 0.15s ease-in-out;
}

.btn:hover:not(.btn-disabled) {
  background-color: #0b5ed7;
  border-color: #0a58ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.btn:active:not(.btn-disabled) {
  transform: translateY(0);
}

.btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.btn-primary:hover:not(.btn-disabled) {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

a.btn {
  text-decoration: none;
  display: inline-block;
}

/* =====================
   RESPONSIVE - Bootstrap breakpoints
===================== */
/* Extra small devices (phones, less than 576px) */
@media (max-width: 575.98px) {
  .page {
    padding: 15px;
  }

  .card {
    padding: 32px 20px;
    max-width: 100%;
  }

  h1 {
    font-size: 24px;
  }

  .loading-message,
  .success-message,
  .error-message {
    font-size: 16px;
  }

  .btn {
    width: 100%;
    padding: 14px 24px;
  }

  .cancel-icon svg,
  .loading-icon svg {
    width: 56px;
    height: 56px;
  }
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) and (max-width: 767.98px) {
  .card {
    padding: 40px 28px;
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  .card {
    padding: 48px 32px;
  }
}
</style>
