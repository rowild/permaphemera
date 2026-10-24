// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

// This file's own typecheck pass (tsconfig.node.json) sets "types": [] and does not
// pull in @types/node, so the ambient `process` global needs a minimal local declaration
// rather than a new project dependency just for this one read.
declare const process: { env: Record<string, string | undefined> }

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      directusUrl: process.env.NUXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8077'
    }
  },
  modules: ['@nuxtjs/i18n'],
  devServer: {
    port: 4991
  },
  routeRules: {
    '/locations': { redirect: { to: '/venues', statusCode: 301 } },
    '/locations/**': { redirect: { to: '/venues/**', statusCode: 301 } }
  },
  css: ['~/assets/css/main.css'],
  i18n: {
    locales: [
      { code: 'en', language: 'en-GB', file: 'en.json', name: 'English' },
      { code: 'de', language: 'de-AT', file: 'de.json', name: 'Deutsch' }
    ],
    defaultLocale: 'de',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'permaphemera-locale',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'de'
    }
  },
  app: {
    head: {
      title: 'PERMAPHEMERA',
      meta: [
        {
          name: 'description',
          content: 'A curated Austrian archive of 360 degree exhibition documentation.'
        },
        {
          name: 'theme-color',
          content: '#efe5d2'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon-archive-temple.ico' },
        { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon-archive-temple.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ],
      script: [
        // Umami, self-hosted and cookieless, loads for every visitor without a consent switch
        // (owner's decision, 2026-10-24). It counts only on permaphemera.at, never on localhost.
        {
          src: 'https://umami.project-backends.info/p.js',
          defer: true,
          'data-website-id': 'd7a5053b-b94e-4fbc-9b6f-78e1b388742c',
          'data-domains': 'permaphemera.at'
        }
      ]
    }
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@lucide/vue',
        'gsap',
        'three'
      ]
    }
  }
})
