import { defineNuxtConfig } from 'nuxt/config'
import fr from './locales/fr.json'

const siteUrl = (
  process.env.NUXT_PUBLIC_SITE_URL ||
  process.env.PUBLIC_SITE_URL ||
  'http://localhost:3000'
).replace(/\/$/, '')

function absolutePublicUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl}${normalized}`
}

const shareTitle = "Billetterie officielle - Spectacle de l'Academie de Danse d'Ozoir"
const shareDescription = fr.home.statement.lead
const shareImage = absolutePublicUrl('/images/affiche.jpg')
const shareImageAlt = fr.home.statement.title

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: [
    '~/assets/styles/global/_loadFonts.scss',
    '~/assets/styles/reset.scss',
    '~/assets/styles/page-transitions.scss',
    '~/assets/styles/error-fade.scss',
    '~/assets/styles/global/booking-order-actions.scss'
  ],
  vite: {
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/global/index.scss" as *;\n'
        }
      }
    }
  },
  /* Transitions page + layout (même fade — ex. /admin → accueil). */
  app: {
    pageTransition: { name: 'page-opacity', mode: 'out-in' },
    layoutTransition: { name: 'page-opacity', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'fr'
      },
      title: "Billetterie officielle - Spectacle de l'Academie de Danse d'Ozoir",
      meta: [
        {
          name: 'description',
          content: shareDescription
        },
        {
          name: 'theme-color',
          content: '#ffffff'
        },
        {
          name: 'format-detection',
          content: 'telephone=no'
        },
        {
          property: 'og:type',
          content: 'website'
        },
        {
          property: 'og:locale',
          content: 'fr_FR'
        },
        {
          property: 'og:site_name',
          content: "Academie de Danse d'Ozoir"
        },
        {
          property: 'og:url',
          content: siteUrl
        },
        {
          property: 'og:title',
          content: shareTitle
        },
        {
          property: 'og:description',
          content: shareDescription
        },
        {
          property: 'og:image',
          content: shareImage
        },
        {
          property: 'og:image:secure_url',
          content: shareImage
        },
        {
          property: 'og:image:type',
          content: 'image/jpeg'
        },
        {
          property: 'og:image:alt',
          content: shareImageAlt
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          name: 'twitter:title',
          content: shareTitle
        },
        {
          name: 'twitter:description',
          content: shareDescription
        },
        {
          name: 'twitter:image',
          content: shareImage
        },
        {
          name: 'twitter:image:alt',
          content: shareImageAlt
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          sizes: 'any',
          href: '/favicon.svg?v=5',
          media: '(prefers-color-scheme: light)'
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          sizes: 'any',
          href: '/favicon-light.svg?v=5',
          media: '(prefers-color-scheme: dark)'
        },
        {
          rel: 'shortcut icon',
          href: '/favicon.svg?v=5'
        },
        {
          rel: 'apple-touch-icon',
          href: '/favicon.svg?v=5'
        },
        {
          rel: 'manifest',
          href: '/site.webmanifest'
        }
      ]
    }
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
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy':
          "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://www.google.com https://maps.google.com; form-action 'self' https://checkout.stripe.com; upgrade-insecure-requests"
      }
    }
  },
  modules: ['@nuxtjs/supabase'],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    redirect: false,
    /**
     * Par défaut le module cherche `~/types/database.types.ts` et affiche un WARN si absent.
     * Mets `types: '~/types/database.types.ts'` après génération :
     * `npx supabase gen types typescript --project-id <ref> > types/database.types.ts`
     */
    types: false
  }
})
