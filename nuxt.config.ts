import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/styles/reset.scss', '~/assets/styles/page-transitions.scss', '~/assets/styles/error-fade.scss'],
  /* Transition sur NuxtPage (évite le flash : le <slot> du layout ne duplique pas l’ancienne page). */
  app: {
    pageTransition: { name: 'page-opacity', mode: 'out-in' }
  },
  runtimeConfig: {
    public: {
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY
    }
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  },
  modules: ['@nuxtjs/supabase', 'lenis/nuxt'],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    redirect: false,
  },
})
