<template>
  <div class="page">
    <div class="page_card" v-if="isLoaded">

      <!-- SUCCESS -->
      <template v-if="isValid">
        <div class="card__icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="icon__svg"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" fill="#198754" />
            <path
              d="M7 12l3 3 6-6"
              fill="none"
              stroke="#fff"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <h1 class="card__title">{{ content.success.title }}</h1>

        <p class="card__message" v-html="formattedMessage"></p>

        <p class="card__text">
          {{ content.success.info }}
        </p>
      </template>

      <!-- ERROR / EXPIRED -->
      <template v-else>
        <div class="card__error-icon">
          ❌
        </div>

        <h1 class="card__title">Paiement invalide</h1>

        <p class="card__error-message">
          Le paiement a été refusé ou la commande a expiré.
        </p>

        <p class="card__text">
          Si le paiement a été effectué après expiration,
          il a été automatiquement remboursé.
        </p>
      </template>

      <LinkButton
        to="/"
        variant="primary"
        :label="content.success.backToSeats"
      />
    </div>

    <!-- LOADING -->
    <div v-else class="page_card">
      Vérification du paiement...
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { STORAGE_ORDER_KEY, CANCEL_REASON, ORDER_STATUS } from '../constants'
import content from '../locales/fr.json'
import LinkButton from '../components/buttons/LinkButton.vue'

const route = useRoute()

const isValid = ref(false)
const isLoaded = ref(false)

const formattedMessage = computed(() => {
  return content.success.message.replace(/\n/g, '<br />')
})

onMounted(async () => {
  const orderId = route.query.order_id as string

  if (!orderId) {
    isLoaded.value = true
    return
  }

  try {
    const data = await $fetch<{ status: string }>('/api/order-status', {
      query: { orderId }
    })

    if (data?.status === ORDER_STATUS.PAID) {
      isValid.value = true
      localStorage.removeItem(STORAGE_ORDER_KEY)
    } else if (data?.status === ORDER_STATUS.PENDING || data?.status === ORDER_STATUS.EXPIRED) {
      await $fetch('/api/cancel-order', {
        method: 'POST',
        body: { orderId, reason: CANCEL_REASON.USER }
      })
    }
  } catch (err) {
    console.error(err)
  }

  isLoaded.value = true
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  padding: 20px;

  .page_card {
    background: white;
    padding: 48px 32px;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.4s ease-out;

    .card__icon {
      margin-bottom: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;

      .icon__svg {
        width: 64px;
        height: 64px;
        display: block;
        animation: scaleIn 0.5s ease-out 0.2s both;
        flex-shrink: 0;
      }
    }

    .card__title {
      margin: 0 0 16px 0;
      font-size: 28px;
      font-weight: 600;
      color: #212529;
    }

    .card__message {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 500;
      color: #198754;
      line-height: 1.5;
    }

    .card__text {
      margin: 0 0 32px 0;
      font-size: 14px;
      color: #6c757d;
      line-height: 1.6;
    }

    .card__error-message {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #212529;
      line-height: 1.5;
    }
  }
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

@media (max-width: 575.98px) {
  .page {
    padding: 15px;

    .page_card {
      padding: 32px 20px;
      max-width: 100%;

      .card__title {
        font-size: 24px;
      }

      .card__message {
        font-size: 16px;
      }

      .card__text {
        font-size: 13px;
      }

      .card__icon .icon__svg {
        width: 56px;
        height: 56px;
      }
    }
  }
}

@media (min-width: 576px) and (max-width: 767.98px) {
  .page .page_card {
    padding: 40px 28px;
  }
}

@media (min-width: 768px) {
  .page .page_card {
    padding: 48px 32px;
  }
}
</style>
