import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '~/assets/styles/reset.scss',
    '~/assets/styles/page-transitions.scss',
    '~/assets/styles/error-fade.scss',
    '~/assets/styles/global/booking-order-actions.scss',
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/global/index.scss" as *;\n'
        }
      }
    }
  },
  /* Transition sur NuxtPage (évite le flash : le <slot> du layout ne duplique pas l’ancienne page). */
  app: {
    pageTransition: { name: 'page-opacity', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'fr'
      },
      title: "Billetterie officielle - Spectacle de l'Academie de Danse d'Ozoir",
      meta: [
        {
          name: 'description',
          content:
            "Billetterie officielle du Spectacle de l'Academie de Danse d'Ozoir au Theatre de Yerres, le dimanche 21 juin 2026."
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
          property: 'og:title',
          content: "Billetterie officielle - Spectacle de l'Academie de Danse d'Ozoir"
        },
        {
          property: 'og:description',
          content:
            "Reservez vos places pour le spectacle de l'Academie de Danse d'Ozoir au Theatre de Yerres."
        },
        {
          property: 'og:image',
          content: '/images/parking.jpg'
        },
        {
          property: 'og:image:alt',
          content: 'Carte des parkings autour du Theatre de Yerres'
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          name: 'twitter:title',
          content: "Billetterie officielle - Spectacle de l'Academie de Danse d'Ozoir"
        },
        {
          name: 'twitter:description',
          content:
            "Reservez vos places pour le spectacle de l'Academie de Danse d'Ozoir au Theatre de Yerres."
        },
        {
          name: 'twitter:image',
          content: '/images/parking.jpg'
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
        'Referrer-Policy': 'strict-origin-when-cross-origin'
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
    types: false,
  },
})
