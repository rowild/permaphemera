// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxtjs/i18n'],
  devServer: {
    port: 4991
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
