import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      // Pure logic in node: utils, resolvers, scripts.
      { resolve: { alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) } }, test: { name: 'unit', include: ['test/unit/**/*.spec.ts'], environment: 'node' } },
      // Components, composables and pages inside a real Nuxt app (auto-imports, i18n, router).
      await defineVitestProject({ test: { name: 'nuxt', include: ['test/nuxt/**/*.spec.ts'], environment: 'nuxt', environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } } } })
    ]
  }
})
