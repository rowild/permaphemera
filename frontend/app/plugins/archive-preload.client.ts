// Starts the archive request before the other plugins (i18n waits for its language file);
// useArchiveSource() in app.vue takes the running request over (about 350 ms earlier on desktop,
// plans/2026-11-04__nuxt-optimisation-audit.md 1.3).
import { startArchiveLoad } from '~/utils/archivePreload'

export default defineNuxtPlugin({
  name: 'archive-preload',
  order: -30,
  setup() {
    startArchiveLoad(useRuntimeConfig().public.directusUrl)
  }
})
