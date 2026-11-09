import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ArchiveNewsletterInvite from '~/components/ArchiveNewsletterInvite.vue'
import { INVITE_COOLDOWN_MS, INVITE_DELAY_MS, NEWSLETTER_INVITE_STORAGE_KEY } from '~/utils/newsletter'

const STATES = ['newsletter-invite-visible', 'newsletter-invite-held', 'cookie-notice-visible', 'cookie-consent-initialized']
const stored = () => JSON.parse(localStorage.getItem(NEWSLETTER_INVITE_STORAGE_KEY) ?? 'null')
const store = (state: string, savedAt: number) => localStorage.setItem(NEWSLETTER_INVITE_STORAGE_KEY, JSON.stringify({ state, savedAt, version: 1 }))

// The newsletter modal: 10 s after the page is ready, never over the cookie notice, never on
// the legal and newsletter pages; at most once in 30 days (counted from showing), never again
// after a sign-up or "never show again". No form: only a link to /newsletter/.
describe('ArchiveNewsletterInvite', () => {
  const mounted: { unmount: () => void }[] = []

  beforeEach(() => {
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, String(value)) }, removeItem: (key: string) => { items.delete(key) }, clear: () => items.clear() })
    STATES.forEach((key) => clearNuxtState(key))
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true })
  })
  afterEach(() => {
    useNewsletterInvite().hide()
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const mount = async (path = '/exhibitions/') => {
    const wrapper = await mountSuspended(ArchiveNewsletterInvite, { route: path, attachTo: document.body })
    mounted.push(wrapper)
    return wrapper
  }
  const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
  const part = (name: string) => document.body.querySelector<HTMLElement>(`[data-part="${name}"]`)
  const waitForInvite = async () => {
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS + 10)
    await nextTick()
  }

  it('appears after 10 seconds as a modal with an image and a link to the sign-up page, without a form', async () => {
    await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS - 100)
    expect(dialog()).toBeNull()
    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    expect(dialog()?.getAttribute('aria-modal')).toBe('true')
    expect(dialog()?.querySelector('form, input')).toBeNull()
    expect(part('to-page')?.getAttribute('href')).toBe('/newsletter/')
    expect(part('image')).not.toBeNull()
  })

  it('remembers that it showed, so the 30 days count from now', async () => {
    await mount()
    await waitForInvite()
    expect(stored()).toMatchObject({ state: 'shown', version: 1 })
  })

  it('× closes it and stores "dismissed"', async () => {
    await mount()
    await waitForInvite()
    part('close')!.click()
    await nextTick()
    expect(useNewsletterInvite().visible.value).toBe(false)
    expect(stored()).toMatchObject({ state: 'dismissed', version: 1 })
  })

  it('Escape closes it too', async () => {
    await mount()
    await waitForInvite()
    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(useNewsletterInvite().visible.value).toBe(false)
  })

  it('"never show again" closes it and stores "never"', async () => {
    await mount()
    await waitForInvite()
    part('never')!.click()
    await nextTick()
    expect(useNewsletterInvite().visible.value).toBe(false)
    expect(stored()).toMatchObject({ state: 'never', version: 1 })
  })

  it.each([
    ['shown 29 days ago', 'shown', Date.now() - INVITE_COOLDOWN_MS + 60_000],
    ['closed 29 days ago', 'dismissed', Date.now() - INVITE_COOLDOWN_MS + 60_000],
    ['signed up', 'subscribed', 0],
    ['"never show again"', 'never', 0]
  ])('stays away when %s', async (_label, state, savedAt) => {
    store(state, savedAt)
    await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS * 3)
    expect(dialog()).toBeNull()
  })

  it('comes again 30 days after it showed', async () => {
    store('shown', Date.now() - INVITE_COOLDOWN_MS - 60_000)
    await mount()
    await waitForInvite()
    expect(dialog()).not.toBeNull()
  })

  it('waits for the cookie notice to be answered', async () => {
    useState('cookie-consent-initialized').value = true
    useState('cookie-notice-visible').value = true
    await mount()
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS * 2)
    expect(dialog()).toBeNull()
    useState('cookie-notice-visible').value = false
    await nextTick()
    await waitForInvite()
    expect(dialog()).not.toBeNull()
  })

  it('waits while the start page plays its intro', async () => {
    const invite = useNewsletterInvite()
    invite.holdForIntro()
    await mount('/')
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS * 2)
    expect(dialog()).toBeNull()
    invite.releaseIntro()
    await nextTick()
    await waitForInvite()
    expect(dialog()).not.toBeNull()
  })

  it('steps aside on /newsletter/ without storing a "no"', async () => {
    await mount()
    await waitForInvite()
    expect(dialog()).not.toBeNull()
    await useRouter().push('/newsletter/')
    await nextTick()
    expect(useNewsletterInvite().visible.value).toBe(false)
    expect(stored()).toMatchObject({ state: 'shown' })
  })

  it('never shows on the privacy page', async () => {
    await mount('/privacy/')
    await vi.advanceTimersByTimeAsync(INVITE_DELAY_MS * 2)
    expect(dialog()).toBeNull()
  })
})
