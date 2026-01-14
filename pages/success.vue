<template>
  <div class="page">
    <div class="card">
      <div class="success-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="success-icon__svg"
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

      <h1>{{ content.success.title }}</h1>

      <p class="success-message" v-html="formattedMessage">
      </p>

      <p class="info-text">
        {{ content.success.info }}
      </p>

      <LinkButton
        to="/"
        variant="primary"
        :label="content.success.backToSeats"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import content from '../locales/fr.json'
import LinkButton from '../components/buttons/LinkButton.vue'

const formattedMessage = computed(() => {
  return content.success.message.replace(/\n/g, '<br />')
})

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
  align-items: center;
  width: 100%;
}

.success-icon__svg {
  width: 64px;
  height: 64px;
  display: block;
  animation: scaleIn 0.5s ease-out 0.2s both;
  flex-shrink: 0;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
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


  .success-icon__svg {
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
