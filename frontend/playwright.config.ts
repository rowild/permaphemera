import { defineConfig, devices } from '@playwright/test'

// Browser tests of the real site (test/e2e). By default against the built site in .output/public
// (pnpm deploy:hetzner runs them after the build); against the dev server with
// E2E_BASE_URL=http://localhost:4991 pnpm test:e2e.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:4993'

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  // 15 s: a worker's first page waits for its paced Directus requests (test/e2e/fixtures.ts).
  expect: { timeout: 15_000 },
  retries: 1,
  workers: 3,
  reporter: [['list']],
  use: { baseURL, locale: 'de-AT', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 900 } } },
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true } }
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'pnpm exec serve --single --no-clipboard -l 4993 .output/public',
    url: 'http://localhost:4993',
    reuseExistingServer: true
  }
})
