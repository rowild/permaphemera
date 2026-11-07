import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { markRaw } from 'vue'
import ArchiveNewsletterForm from '~/components/ArchiveNewsletterForm.vue'
import ArchiveTownSelect from '~/components/ArchiveTownSelect.vue'
import ArchiveTextField from '~/components/ArchiveTextField.vue'
import { NEWSLETTER_CONSENT_VERSION, NEWSLETTER_INVITE_STORAGE_KEY, NEWSLETTER_TOPICS } from '~/utils/newsletter'

const location = (slug: string, title: string, state: string, status = 'published') => ({ id: slug, slug, title, state, status })
const groups = [
  { state: 'Carinthia', label: 'Kärnten', towns: [{ slug: 'spittal', title: 'Spittal' }, { slug: 'villach', title: 'Villach' }] },
  { state: 'Vienna', label: 'Wien', towns: [{ slug: 'wien', title: 'Wien' }] }
]

const seedArchive = () => {
  const state = useState<unknown>('archive')
  const empty = Object.fromEntries(Object.keys(useArchiveSnapshot().value).map((key) => [key, []]))
  state.value = markRaw({ ...empty, locations: [location('villach', 'Villach', 'Carinthia'), location('wien', 'Wien', 'Vienna'), location('geheim', 'Geheim', 'Tyrol', 'draft')] })
}

const memoryStorage = () => {
  const items = new Map<string, string>()
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, String(value)) }, removeItem: (key: string) => { items.delete(key) }, clear: () => items.clear() }
}

describe('ArchiveTextField', () => {
  it('labels its input and follows v-model', async () => {
    const wrapper = await mountSuspended(ArchiveTextField, { props: { id: 'nl-email', label: 'E-Mail-Adresse', type: 'email' as const, required: true, modelValue: '', 'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }) } })
    expect(wrapper.get('label').attributes('for')).toBe('nl-email')
    const input = wrapper.get('input#nl-email')
    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('required')).toBeDefined()
    await input.setValue('a@b.at')
    expect(wrapper.props('modelValue')).toBe('a@b.at')
  })
})

describe('ArchiveTownSelect', () => {
  it('lists the towns by state and reports the chosen slugs', async () => {
    const wrapper = await mountSuspended(ArchiveTownSelect, { props: { groups, modelValue: [], 'onUpdate:modelValue': (value: string[]) => wrapper.setProps({ modelValue: value }) } })
    expect(wrapper.findAll('fieldset legend').map((legend) => legend.text())).toEqual(['Kärnten', 'Wien'])
    await wrapper.get('input[value="villach"]').setValue(true)
    expect(wrapper.props('modelValue')).toEqual(['villach'])
  })

  it('a state box chooses all its towns, then none; a partly chosen state shows the half state', async () => {
    const wrapper = await mountSuspended(ArchiveTownSelect, { props: { groups, modelValue: ['villach'], 'onUpdate:modelValue': (value: string[]) => wrapper.setProps({ modelValue: value }) } })
    const stateBox = wrapper.get('[data-state="Carinthia"] input')
    expect((stateBox.element as HTMLInputElement).indeterminate).toBe(true)
    await stateBox.setValue(true)
    expect([...(wrapper.props('modelValue') ?? [])].sort()).toEqual(['spittal', 'villach'])
    await wrapper.get('[data-state="Carinthia"] input').setValue(false)
    expect(wrapper.props('modelValue')).toEqual([])
  })

  it('says how many towns are chosen', async () => {
    const wrapper = await mountSuspended(ArchiveTownSelect, { props: { groups, modelValue: ['villach', 'wien'] } })
    expect(wrapper.get('summary').text()).toContain('2')
  })
})

describe('ArchiveNewsletterForm', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    seedArchive()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    clearNuxtState('archive')
  })

  const fill = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>) => {
    await wrapper.get('input[type="email"]').setValue('maria@example.at')
    await wrapper.get('[data-part="consent"] input').setValue(true)
  }

  it('the full form offers name, the four topics (checked) and the published towns', async () => {
    const wrapper = await mountSuspended(ArchiveNewsletterForm, { props: { variant: 'page' } })
    expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(true)
    const topics = wrapper.findAll('[data-part="topics"] input[type="checkbox"]')
    expect(topics).toHaveLength(NEWSLETTER_TOPICS.length)
    expect(topics.every((box) => (box.element as HTMLInputElement).checked)).toBe(true)
    expect(wrapper.find('input[value="villach"]').exists()).toBe(true)
    expect(wrapper.find('input[value="geheim"]').exists()).toBe(false)
    expect((wrapper.get('[data-part="consent"] input').element as HTMLInputElement).checked).toBe(false)
  })

  it('sends the sign-up and then shows the confirmation note, and the invite stays away for good', async () => {
    const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, state: 'pending' }) }))
    vi.stubGlobal('fetch', fetch)
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
    const wrapper = await mountSuspended(ArchiveNewsletterForm, { props: { variant: 'page' } })
    await fill(wrapper)
    await wrapper.get('input[value="wien"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await vi.waitUntil(() => wrapper.text().includes('maria@example.at'))
    vi.restoreAllMocks()

    const sent = JSON.parse(String((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body))
    expect(sent).toMatchObject({
      email: 'maria@example.at', language: 'de', towns: ['wien'], topics: [...NEWSLETTER_TOPICS],
      consent: true, consentVersion: NEWSLETTER_CONSENT_VERSION, source: 'page', website: ''
    })
    expect(wrapper.get('[role="status"]').text()).toContain('maria@example.at')
    expect(wrapper.find('input[type="email"]').exists()).toBe(false)
    expect(JSON.parse(localStorage.getItem(NEWSLETTER_INVITE_STORAGE_KEY) ?? 'null')).toMatchObject({ state: 'subscribed', version: 1 })
  })

  it('without a topic nothing is sent and the form says why', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const wrapper = await mountSuspended(ArchiveNewsletterForm, { props: { variant: 'page' } })
    await fill(wrapper)
    for (const box of wrapper.findAll('[data-part="topics"] input')) await box.setValue(false)
    await wrapper.get('form').trigger('submit')
    expect(fetch).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toBe('Mindestens ein Thema muss gewählt sein.')
  })

  it('shows the reason of a refusal', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: false, error: 'invalid_email' }) })))
    const wrapper = await mountSuspended(ArchiveNewsletterForm, { props: { variant: 'page' } })
    await fill(wrapper)
    await wrapper.get('form').trigger('submit')
    await vi.waitUntil(() => wrapper.find('[role="alert"]').exists())
    expect(wrapper.get('[role="alert"]').text()).toBe('Diese E-Mail-Adresse ist ungültig.')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('the compact form asks only for the address and consent, sends all topics and links to the full page', async () => {
    const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, state: 'pending' }) }))
    vi.stubGlobal('fetch', fetch)
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
    const wrapper = await mountSuspended(ArchiveNewsletterForm, { props: { variant: 'compact', source: 'invite' } })
    expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(false)
    expect(wrapper.find('[data-part="topics"]').exists()).toBe(false)
    expect(wrapper.find('details').exists()).toBe(false)
    expect(wrapper.get('a[href="/newsletter/"]').text()).toBe('Themen und Orte wählen')
    await fill(wrapper)
    await wrapper.get('form').trigger('submit')
    await vi.waitUntil(() => fetch.mock.calls.length > 0)
    vi.restoreAllMocks()
    expect(JSON.parse(String((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body))).toMatchObject({ topics: [...NEWSLETTER_TOPICS], towns: [], source: 'invite' })
  })

  it('keeps a hidden field for bots out of the way of people and screen readers', async () => {
    const wrapper = await mountSuspended(ArchiveNewsletterForm, { props: { variant: 'page' } })
    const trap = wrapper.get('[data-part="honeypot"]')
    expect(trap.attributes('aria-hidden')).toBe('true')
    expect(trap.get('input').attributes('tabindex')).toBe('-1')
    expect(trap.get('input').attributes('autocomplete')).toBe('off')
  })
})
