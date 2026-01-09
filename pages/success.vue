<template>
  <div class="page">
    <div class="card">
      <div class="success-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" fill="#198754" />
          <path
            d="M7 12l3 3 6-6"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <h1>Paiement confirmé</h1>

      <p class="success-message">
        Merci pour votre achat !<br />
        Vos billets ont été réservés avec succès.
      </p>

      <p class="info-text">
        Vous recevrez un email de confirmation avec tous les détails de votre réservation.
      </p>

      <NuxtLink to="/" class="btn btn-primary">
        Retour à la sélection des sièges
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  localStorage.removeItem('order_id')
})
</script>


<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.success-icon {
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

.success-message {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 500;
  color: #198754;
  line-height: 1.5;
}

.info-text {
  margin: 0 0 32px 0;
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
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

.btn:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
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

  .success-message {
    font-size: 16px;
  }

  .info-text {
    font-size: 13px;
  }

  .btn {
    width: 100%;
    padding: 14px 24px;
  }

  .success-icon svg {
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
