import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ArchiveNewsletterInvite from '~/components/ArchiveNewsletterInvite.vue'
import { INVITE_COOLDOWN_MS, INVITE_DELAY_MS, NEWSLETTER_INVITE_STORAGE_KEY } from '~/utils/newsletter'

const STATES = ['newsletter-invite-visible', 'newsletter-invite-held', 'cookie-notice-visible', 'cookie-consent-initialized']
const stored = () => JSON.parse(localStorage.getItem(NEWSLETTER_INVITE_STORAGE_KEY) ?? 'null')

// The small invite: 10 s after the page is ready, never over the cookie notice, never on the
// legal and newsletter pages, quiet for 30 days after "close", never again after a sign-up.
describe('ArchiveNewsletterInvite', () => {
  beforeEach(() => {
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, String(value)) }, removeItem: (key: string) => { items.delete(key) }, clear: () => items.clear() })
    STATES.forEach((key) => clearNuxtState(key))
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const mount = (path = '/exhibitions/') => mountSuspended(ArchiveNewsletterInvite, { route: path, attachTo: document.body })
  const shown = (wrapper: Awaited<ReturnType<typeof mount>>) => wrapper.find('[role="dialog"]').exists()

  it('appears after 10 seconds with the short form', async () => {
    const wrapper = await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS - 100)
    expect(shown(wrapper)).toBe(false)
    await vi.advanceTimersByTimeAsync(200)
    expect(shown(wrapper)).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('[data-part="topics"]').exists()).toBe(false)
    // Phones get a button to the full page instead of the form (CSS switches between the two).
    expect(wrapper.get('[data-part="to-page"]').attributes('href')).toBe('/newsletter/')
  })

  it('closing it hides it and stores "dismissed"', async () => {
    const wrapper = await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS + 10)
    await wrapper.get('button[data-part="close"]').trigger('click')
    expect(shown(wrapper)).toBe(false)
    expect(stored()).toMatchObject({ state: 'dismissed', version: 1 })
  })

  it('Escape closes it too', async () => {
    const wrapper = await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS + 10)
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(shown(wrapper)).toBe(false)
  })

  it('stays away within 30 days of a "close" and after a sign-up', async () => {
    localStorage.setItem(NEWSLETTER_INVITE_STORAGE_KEY, JSON.stringify({ state: 'dismissed', savedAt: Date.now() - INVITE_COOLDOWN_MS + 60_000, version: 1 }))
    const recent = await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS * 3)
    expect(shown(recent)).toBe(false)
    recent.unmount()

    localStorage.setItem(NEWSLETTER_INVITE_STORAGE_KEY, JSON.stringify({ state: 'subscribed', savedAt: 0, version: 1 }))
    const subscribed = await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS * 3)
    expect(shown(subscribed)).toBe(false)
  })

  it('waits for the cookie notice to be answered', async () => {
    useState('cookie-consent-initialized').value = true
    useState('cookie-notice-visible').value = true
    const wrapper = await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS * 2)
    expect(shown(wrapper)).toBe(false)
    useState('cookie-notice-visible').value = false
    await nextTick()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS + 10)
    expect(shown(wrapper)).toBe(true)
  })

  it('waits while the start page plays its intro', async () => {
    const invite = useNewsletterInvite()
    invite.holdForIntro()
    const wrapper = await mount('/')
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS * 2)
    expect(shown(wrapper)).toBe(false)
    invite.releaseIntro()
    await nextTick()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS + 10)
    expect(shown(wrapper)).toBe(true)
  })

  it('steps aside on /newsletter/ without storing a "no"', async () => {
    const wrapper = await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS + 10)
    expect(shown(wrapper)).toBe(true)
    await useRouter().push('/newsletter/')
    await nextTick()
    expect(shown(wrapper)).toBe(false)
    expect(stored()).toBeNull()
  })

  it('never shows on the privacy page', async () => {
    const wrapper = await mount('/privacy/')
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS * 2)
    expect(shown(wrapper)).toBe(false)
  })
})
