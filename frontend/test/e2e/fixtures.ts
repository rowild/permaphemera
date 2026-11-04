import { test as base, expect, type APIRequestContext } from '@playwright/test'

// The live Directus allows only its own site and the dev ports as origins (CORS), and answers
// 429 (too many requests) above 50 requests per second from one address (RATE_LIMITER_POINTS).
// The built site here runs on another port, and three test browsers share this computer's address.
// So every Directus request (data and pictures) goes through one helper per worker: it asks for
// each address once, starts at most one request every 70 ms (three workers: about 43 per second),
// waits and tries again on a 429, a dropped line or a stalled one (6 s per try: the line to the
// server sometimes hangs for 15 s), and answers with the test origin allowed.
type Answer = { status: number, headers: Record<string, string>, body: Buffer }
type Directus = (url: string) => Promise<Answer>

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const directusClient = (request: APIRequestContext): Directus => {
  const answers = new Map<string, Promise<Answer>>()
  const queue: (() => void)[] = []
  let open = 0
  let nextStart = 0
  const slot = async () => {
    if (open >= 8) await new Promise<void>((resolve) => queue.push(resolve))
    open++
    const wait = nextStart - Date.now()
    nextStart = Math.max(nextStart, Date.now()) + 70
    if (wait > 0) await pause(wait)
  }
  const release = () => { open--; queue.shift()?.() }

  const load = async (url: string): Promise<Answer> => {
    for (let attempt = 1; ; attempt++) {
      await slot()
      try {
        const response = await request.get(url, { headers: { origin: 'https://permaphemera.at' }, timeout: 6_000 })
        if (response.status() !== 429 && response.status() < 500) return { status: response.status(), headers: response.headers(), body: await response.body() }
        if (attempt === 5) throw new Error(`${url} answered ${response.status()} five times`)
      } catch (error) {
        if (attempt === 5) throw error
      } finally {
        release()
      }
      await pause(1000 * attempt)
    }
  }

  return (url) => {
    if (!answers.has(url)) {
      const answer = load(url)
      answer.catch(() => answers.delete(url))
      answers.set(url, answer)
    }
    return answers.get(url)!
  }
}

export const test = base.extend<object, { directus: Directus }>({
  directus: [async ({ playwright }, use) => {
    const request = await playwright.request.newContext()
    await use(directusClient(request))
    await request.dispose()
  }, { scope: 'worker' }],

  // Every test also starts with the cookie choice made, so the notice never covers the page.
  page: async ({ page, baseURL, directus }, use) => {
    await page.addInitScript(() => localStorage.setItem('permaphemera-cookie-consent', JSON.stringify({ version: 2, googleMaps: 'denied', youtube: 'denied', savedAt: Date.now() })))
    const origin = new URL(baseURL!).origin
    await page.route((url) => url.pathname.startsWith('/cms/') && url.origin !== origin, async (route) => {
      const { status, headers, body } = await directus(route.request().url())
      await route.fulfill({ status, body, headers: { ...headers, 'access-control-allow-origin': origin } }).catch(() => {})
    })
    await use(page)
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  }
})

export { expect }

/** The project (viewport) a test runs in: desktop 1440, tablet 1024, phone 390. */
export const width = (page: import('@playwright/test').Page) => page.viewportSize()!.width
