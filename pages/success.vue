<template>
  <div class="paymentResultPage">
    <div class="paymentResultPage__card" v-if="isLoaded">

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
        <div class="card__errorIcon">
          ❌
        </div>

        <h1 class="card__title">Paiement invalide</h1>

        <p class="card__errorMessage">
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
    <div v-else class="paymentResultPage__card">
      Vérification du paiement...
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { STORAGE_ORDER_KEY, ORDER_STATUS } from '../constants'
import content from '../locales/fr.json'
import LinkButton from '../components/buttons/LinkButton.vue'

const route = useRoute()

const isValid = ref(false)
const isLoaded = ref(false)

const formattedMessage = computed(() => {
  return content.success.message.replace(/\n/g, '<br />')
})

const LOG = '[billetterie:success]'

onMounted(async () => {
  const orderId = route.query.order_id as string
  const t0 = performance.now()

  console.info(`${LOG} Page chargée`, { orderId: orderId || '(absent)', query: { ...route.query } })

  if (!orderId) {
    console.warn(`${LOG} Pas de order_id dans l’URL → écran invalide`)
    isLoaded.value = true
    return
  }

  try {
    const sessionId =
      typeof route.query.session_id === 'string' ? route.query.session_id : undefined

    const data = await $fetch<{ status: string }>('/api/order-status', {
      query: { orderId }
    })
    console.info(`${LOG} order-status`, {
      orderId,
      sessionId: sessionId ?? '(absent)',
      status: data?.status,
      ms: Math.round(performance.now() - t0)
    })

    if (data?.status === ORDER_STATUS.PAID) {
      isValid.value = true
      localStorage.removeItem(STORAGE_ORDER_KEY)
      console.info(`${LOG} OK → PAID, localStorage nettoyé`, { totalMs: Math.round(performance.now() - t0) })
      console.info(
        `${LOG} Les logs [billetterie:mail] sont dans le terminal du serveur (npm run dev), pas dans la console du navigateur.`
      )
    } else {
      console.warn(`${LOG} Pas de PAID`, {
        status: data?.status,
        totalMs: Math.round(performance.now() - t0),
        hadSessionId: !!sessionId
      })
    }
  } catch (err) {
    console.error(`${LOG} Erreur`, err)
  }

  console.info(`${LOG} Fin vérification`, { isValid: isValid.value, totalMs: Math.round(performance.now() - t0) })
  isLoaded.value = true
})
</script>

<style lang="scss" scoped>
.paymentResultPage {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  padding: 20px;

  .paymentResultPage__card {
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

    .card__errorIcon {
      margin-bottom: 24px;
      font-size: 48px;
      line-height: 1;
    }

    .card__errorMessage {
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
  .paymentResultPage {
    padding: 15px;

    .paymentResultPage__card {
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
  .paymentResultPage .paymentResultPage__card {
    padding: 40px 28px;
  }
}

@media (min-width: 768px) {
  .paymentResultPage .paymentResultPage__card {
    padding: 48px 32px;
  }
}
</style>
