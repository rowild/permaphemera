import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const alias = { '~': fileURLToPath(new URL('./app', import.meta.url)) }

export default defineConfig({
  test: {
    projects: [
      { resolve: { alias }, test: { name: 'unit', include: ['test/unit/**/*.spec.ts'], environment: 'node' } },
      // Single Vue components, mounted outside Nuxt (test/components/setup.ts stands in for Nuxt).
      { plugins: [vue()], resolve: { alias }, test: { name: 'components', include: ['test/components/**/*.spec.ts'], environment: 'happy-dom', setupFiles: ['test/components/setup.ts'] } }
    ]
  }
})
