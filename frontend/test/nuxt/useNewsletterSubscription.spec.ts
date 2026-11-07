import { afterEach, describe, expect, it, vi } from 'vitest'

const body = { email: 'maria@example.at', name: '', language: 'de', towns: [], topics: ['nearby'], consent: true, consentVersion: 'v', source: 'page' as const, pageUrl: '', website: '', startedAt: 1 }

const answer = (json: unknown) => vi.fn(async () => ({ ok: true, json: async () => json }))

// The POST to the Directus endpoint and its four states. The endpoint always answers 200 with
// { ok, state | error }; a network failure counts as "failed".
describe('useNewsletterSubscription', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('posts JSON to the newsletter endpoint under the Directus address and ends pending', async () => {
    const fetch = answer({ ok: true, state: 'pending' })
    vi.stubGlobal('fetch', fetch)
    const subscription = useNewsletterSubscription()
    expect(subscription.status.value).toBe('idle')
    const sent = subscription.submit(body)
    expect(subscription.status.value).toBe('sending')
    await sent
    expect(subscription.status.value).toBe('pending')
    expect(subscription.error.value).toBeNull()
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/newsletter\/subscribe$/)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['content-type']).toBe('application/json')
    expect(JSON.parse(String(init.body))).toEqual(body)
  })

  it.each(['invalid_email', 'missing_consent', 'missing_topic', 'rate_limited', 'unavailable'])('keeps the code %s of a refusal', async (code) => {
    vi.stubGlobal('fetch', answer({ ok: false, error: code }))
    const subscription = useNewsletterSubscription()
    await subscription.submit(body)
    expect(subscription.status.value).toBe('error')
    expect(subscription.error.value).toBe(code)
  })

  it.each([
    ['an unknown code', answer({ ok: false, error: 'upstream_error' })],
    ['a broken answer', vi.fn(async () => ({ ok: true, json: async () => { throw new Error('x') } }))],
    ['an HTTP error', vi.fn(async () => ({ ok: false, status: 502, json: async () => ({}) }))],
    ['no network', vi.fn(async () => { throw new TypeError('Failed to fetch') })]
  ])('turns %s into "failed"', async (_, fetch) => {
    vi.stubGlobal('fetch', fetch)
    const subscription = useNewsletterSubscription()
    await subscription.submit(body)
    expect(subscription.status.value).toBe('error')
    expect(subscription.error.value).toBe('failed')
  })

  it('sends nothing while a request is on its way', async () => {
    const fetch = answer({ ok: true, state: 'pending' })
    vi.stubGlobal('fetch', fetch)
    const subscription = useNewsletterSubscription()
    const first = subscription.submit(body)
    await subscription.submit(body)
    await first
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
