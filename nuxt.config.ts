import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/styles/reset.scss'],
  runtimeConfig: {
    public: {
      /** Clé site Cloudflare Turnstile (optionnelle ; si vide, pas de widget côté client) */
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY || ''
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
  modules: ['@nuxtjs/supabase'],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    // url: process.env.SUPABASE_URL ?? process.env.NUXT_PUBLIC_SUPABASE_URL,
    // key: process.env.SUPABASE_ANON_KEY ?? process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    redirect: false,
  },
})
