import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ArchiveCookieNotice from '~/components/ArchiveCookieNotice.vue'

const KEY = 'permaphemera-cookie-consent'
const stored = () => JSON.parse(localStorage.getItem(KEY) ?? 'null')
const STATE_KEYS = ['cookie-notice-visible', 'cookie-consent-initialized', 'google-maps-consent', 'youtube-consent']

// The consent record is legally relevant: separate decisions for Google Maps and YouTube,
// remembered for a year, a broken or outdated record asks again (was text matching in
// check-i18n-privacy).
describe('cookie consent', () => {
  beforeEach(() => {
    // Node's own (empty) localStorage hides the test browser's; a plain one stands in.
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, String(value)) }, removeItem: (key: string) => { items.delete(key) }, clear: () => items.clear() })
    STATE_KEYS.forEach((key) => clearNuxtState(key))
  })

  it('asks when nothing is stored', () => {
    const notice = useCookieNotice()
    notice.initialize()
    expect(notice.isVisible.value).toBe(true)
    expect([notice.googleMapsConsent.value, notice.youtubeConsent.value]).toEqual([null, null])
  })

  it('keeps a current choice and does not ask again', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, googleMaps: 'granted', youtube: 'denied', savedAt: Date.now() }))
    const notice = useCookieNotice()
    notice.initialize()
    expect(notice.isVisible.value).toBe(false)
    expect([notice.googleMapsConsent.value, notice.youtubeConsent.value]).toEqual(['granted', 'denied'])
  })

  it.each([
    ['an old version', JSON.stringify({ version: 1, googleMaps: 'granted', youtube: 'granted', savedAt: Date.now() })],
    ['a choice older than a year', JSON.stringify({ version: 2, googleMaps: 'granted', youtube: 'granted', savedAt: Date.now() - 366 * 864e5 })],
    ['a broken record', '{not json']
  ])('asks again for %s', (_, value) => {
    localStorage.setItem(KEY, value)
    const notice = useCookieNotice()
    notice.initialize()
    expect(notice.isVisible.value).toBe(true)
  })

  it('stores the two decisions separately', () => {
    const notice = useCookieNotice()
    notice.savePreferences({ googleMaps: true, youtube: false })
    expect(stored()).toMatchObject({ version: 2, googleMaps: 'granted', youtube: 'denied' })
    expect(notice.isVisible.value).toBe(false)
  })

  it('shows necessary (fixed), Google Maps and YouTube, and saves the selection or accepts all', async () => {
    useCookieNotice().show()
    const notice = await mountSuspended(ArchiveCookieNotice)
    const boxes = notice.findAll('input[type="checkbox"]')
    expect(boxes).toHaveLength(3)
    expect(boxes[0]!.attributes()).toHaveProperty('disabled')
    expect((boxes[0]!.element as HTMLInputElement).checked).toBe(true)
    await boxes[2]!.setValue(true)
    await notice.get('form').trigger('submit')
    expect(stored()).toMatchObject({ googleMaps: 'denied', youtube: 'granted' })
    useCookieNotice().show()
    await nextTick()
    await notice.findAll('button[type="button"]').at(-1)!.trigger('click')
    expect(stored()).toMatchObject({ googleMaps: 'granted', youtube: 'granted' })
  })
})
