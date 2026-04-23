<template>
  <div class="paymentResultLayout">
    <div class="paymentResultPage">
      <div class="paymentResultPage__card" v-if="isLoaded">
        <!-- SUCCESS -->
        <template v-if="isValid">
          <div class="card__statusIcon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="statusIcon__svg"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="20" height="20" rx="2" fill="#198754" />
              <path
                d="M7 12l3 3 6-6"
                fill="none"
                stroke="#fff"
                stroke-width="1.5"
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
          <div class="card__errorState" key="payment-error">
            <div class="card__statusIcon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="statusIcon__svg"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="20" height="20" rx="2" fill="#dc3545" />
                <path
                  d="M9 9l6 6M15 9l-6 6"
                  fill="none"
                  stroke="#fff"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>

            <h1 class="card__title">{{ content.success.errorTitle }}</h1>

            <p class="card__errorMessage" v-html="formattedErrorMessage"></p>

            <p class="card__text">
              {{ content.success.errorInfo }}
            </p>
          </div>
        </template>

        <LinkButton
          to="/"
          variant="primary"
          class="card__backButton"
          :label="content.success.backToSeats"
        />
      </div>

      <!-- LOADING -->
      <div v-else-if="showInitialLoader" class="paymentResultPage__card">
        {{ content.success.loading }}
      </div>
    </div>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { STORAGE_ORDER_KEY, ORDER_STATUS } from '../constants'
import content from '../locales/fr.json'
import LinkButton from '../components/buttons/LinkButton.vue'
import SiteFooter from '../components/layout/SiteFooter.vue'

const route = useRoute()
const router = useRouter()

const isValid = ref(false)
const isLoaded = ref(false)
const showInitialLoader = ref(false)
const hasSeenPaymentResultPage = useState<boolean>('hasSeenPaymentResultPage', () => false)

const formattedMessage = computed(() => {
  return content.success.message.replace(/\n/g, '<br />')
})
const formattedErrorMessage = computed(() => {
  return content.success.errorMessage.replace(/\n/g, '<br />')
})

const LOG = '[billetterie:success]'

onMounted(async () => {
  const orderId = route.query.order_id as string
  const t0 = performance.now()

  console.info(`${LOG} Page chargée`, { orderId: orderId || '(absent)', query: { ...route.query } })

  showInitialLoader.value = !hasSeenPaymentResultPage.value
  hasSeenPaymentResultPage.value = true
  if (!showInitialLoader.value) {
    isLoaded.value = true
  }

  if (!orderId) {
    console.warn(`${LOG} Pas de order_id dans l’URL → redirection home`)
    await router.replace('/')
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
      console.info(`${LOG} OK → PAID, localStorage nettoyé`, {
        totalMs: Math.round(performance.now() - t0)
      })
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

  console.info(`${LOG} Fin vérification`, {
    isValid: isValid.value,
    totalMs: Math.round(performance.now() - t0)
  })
  isLoaded.value = true
})
</script>

<style lang="scss" scoped>
.paymentResultLayout {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  user-select: none;
}

.paymentResultPage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-family-text;
  padding: 20px;

  .paymentResultPage__card {
    background: white;
    padding: 48px 32px;
    border-radius: 4px;
    max-width: 500px;
    width: 100%;
    text-align: center;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);

    .card__statusIcon {
      margin-bottom: 14px;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;

      .statusIcon__svg {
        width: 50px;
        height: 50px;
        display: block;
        flex-shrink: 0;
      }
    }

    .card__title {
      margin: 0 0 16px 0;
      @include apply-font(title-s-2);
      color: #212529;
    }

    .card__message {
      margin: 0 auto 16px auto;
      text-align: left;
      @include apply-font(success-message);
      max-width: 350px;
      color: #198754;
    }

    .card__text {
      margin: 0 auto 32px auto;
      @include apply-font(text-s);
      line-height: 1.6;
      white-space: pre-line;
      text-align: left;
      max-width: 350px;
      color: #6c757d;
    }

    .card__errorMessage {
      margin: 0 auto 16px auto;
      @include apply-font(text-l);
      text-align: center;
      max-width: 350px;
      color: #212529;
    }

    .card__errorState .card__text {
      text-align: center;
    }

    :deep(.card__backButton) {
      @include apply-font(button-m);
      padding: 16px 40px;
      border-radius: 4px;
    }

    :deep(.card__backButton.linkButton--primary) {
      @media (hover: hover) {
        &:hover:not(.linkButton--disabled) {
          color: #0d6efd;
          background-color: #fff;
          border-color: #0d6efd;
          transform: none;
          box-shadow: none;
        }
      }
    }
  }
}

@include media-down(lg) {
  .paymentResultPage {
    /* Laisse plus d'air sous le header/logo sur mobile + tablette. */
    padding-top: 104px;
  }
}

@media (max-width: 575.98px) {
  .paymentResultPage {
    padding: 104px 15px 15px;

    .paymentResultPage__card {
      padding: 32px 20px;
      max-width: 100%;

      .card__message {
        @include apply-font(text-l);
        font-weight: 500;
        max-width: 310px;
      }

      .card__text {
        @include apply-font(meta-13);
        line-height: 1.6;
        max-width: 310px;
      }

      .card__statusIcon .statusIcon__svg {
        width: 50px;
        height: 50px;
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
