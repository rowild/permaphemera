// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  devServer: {
    port: 4991
  },
  css: ['~/assets/css/main.css'],
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
