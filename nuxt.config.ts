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
        }
      ]
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
})
