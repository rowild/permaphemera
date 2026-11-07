import { describe, expect, it } from 'vitest'
import {
  INVITE_COOLDOWN_MS,
  NEWSLETTER_CONSENT_VERSION,
  NEWSLETTER_TOPICS,
  buildSubscribeBody,
  groupTownsByState,
  inviteAllowed,
  inviteSuppressedOn,
  newsletterEndpoint,
  parseInviteRecord
} from '~/utils/newsletter'

const town = (slug: string, title: string, state: string, status = 'published') => ({ slug, title, state, status })
const stateName = (state: string) => ({ Carinthia: 'Kärnten', Vienna: 'Wien', Styria: 'Steiermark' } as Record<string, string>)[state] ?? state

describe('newsletter topics and consent', () => {
  it('offers the four topics of the plan, in this order', () => {
    expect(NEWSLETTER_TOPICS).toEqual(['new_records', 'nearby', 'closing_soon', 'project_news'])
  })

  it('names the consent wording with a version the endpoint accepts', () => {
    expect(NEWSLETTER_CONSENT_VERSION).toMatch(/^[a-z0-9-]{1,40}$/)
  })
})

describe('groupTownsByState', () => {
  it('groups published towns by state, states and towns in alphabetical order of their shown names', () => {
    const groups = groupTownsByState([
      town('wien', 'Wien', 'Vienna'),
      town('villach', 'Villach', 'Carinthia'),
      town('graz', 'Graz', 'Styria'),
      town('bad-eisenkappel', 'Bad Eisenkappel', 'Carinthia'),
      town('geheim', 'Geheim', 'Styria', 'draft')
    ], stateName)
    expect(groups).toEqual([
      { state: 'Carinthia', label: 'Kärnten', towns: [{ slug: 'bad-eisenkappel', title: 'Bad Eisenkappel' }, { slug: 'villach', title: 'Villach' }] },
      { state: 'Styria', label: 'Steiermark', towns: [{ slug: 'graz', title: 'Graz' }] },
      { state: 'Vienna', label: 'Wien', towns: [{ slug: 'wien', title: 'Wien' }] }
    ])
  })

  it('puts a town without a state into a last group without a name', () => {
    const groups = groupTownsByState([town('x', 'Xdorf', ''), town('graz', 'Graz', 'Styria')], stateName)
    expect(groups.map((g) => g.state)).toEqual(['Styria', ''])
  })
})

describe('buildSubscribeBody', () => {
  it('sends what the endpoint reads, with the address trimmed', () => {
    const body = buildSubscribeBody(
      { email: ' maria@example.at ', name: ' Maria ', towns: ['graz'], topics: ['nearby'], consent: true, website: '' },
      { language: 'en', source: 'invite', pageUrl: 'https://permaphemera.at/en/', startedAt: 1000 }
    )
    expect(body).toEqual({
      email: 'maria@example.at',
      name: 'Maria',
      language: 'en',
      towns: ['graz'],
      topics: ['nearby'],
      consent: true,
      consentVersion: NEWSLETTER_CONSENT_VERSION,
      source: 'invite',
      pageUrl: 'https://permaphemera.at/en/',
      website: '',
      startedAt: 1000
    })
  })
})

describe('newsletterEndpoint', () => {
  it('lies under the Directus address', () => {
    expect(newsletterEndpoint('https://permaphemera.at/cms')).toBe('https://permaphemera.at/cms/newsletter/subscribe')
    expect(newsletterEndpoint('http://localhost:8077/')).toBe('http://localhost:8077/newsletter/subscribe')
  })
})

describe('the invite', () => {
  const NOW = 1_800_000_000_000

  it('reads only a complete record of version 1', () => {
    expect(parseInviteRecord(JSON.stringify({ state: 'dismissed', savedAt: 5, version: 1 }))).toEqual({ state: 'dismissed', savedAt: 5, version: 1 })
    expect(parseInviteRecord(null)).toBeNull()
    expect(parseInviteRecord('{broken')).toBeNull()
    expect(parseInviteRecord(JSON.stringify({ state: 'dismissed', savedAt: 5, version: 2 }))).toBeNull()
    expect(parseInviteRecord(JSON.stringify({ state: 'maybe', savedAt: 5, version: 1 }))).toBeNull()
  })

  it.each([
    '/privacy/', '/en/privacy/', '/imprint/', '/terms/', '/accessibility/', '/en/accessibility/',
    '/newsletter/', '/newsletter/confirmed/', '/en/newsletter/unsubscribed/'
  ])('stays away from %s', (path) => {
    expect(inviteSuppressedOn(path)).toBe(true)
  })

  it.each(['/', '/en/', '/exhibitions/', '/venues/galerie-x/', '/news/privacy-in-art/'])('may show on %s', (path) => {
    expect(inviteSuppressedOn(path)).toBe(false)
  })

  it('shows for a new visitor once the cookie notice is answered', () => {
    expect(inviteAllowed({ record: null, now: NOW, path: '/', cookieNoticeOpen: false })).toBe(true)
    expect(inviteAllowed({ record: null, now: NOW, path: '/', cookieNoticeOpen: true })).toBe(false)
  })

  it('keeps quiet for 30 days after a "no", and for ever after a sign-up', () => {
    const dismissed = (ago: number) => ({ state: 'dismissed' as const, savedAt: NOW - ago, version: 1 as const })
    expect(inviteAllowed({ record: dismissed(INVITE_COOLDOWN_MS - 1), now: NOW, path: '/', cookieNoticeOpen: false })).toBe(false)
    expect(inviteAllowed({ record: dismissed(INVITE_COOLDOWN_MS + 1), now: NOW, path: '/', cookieNoticeOpen: false })).toBe(true)
    expect(inviteAllowed({ record: { state: 'subscribed', savedAt: 0, version: 1 }, now: NOW, path: '/', cookieNoticeOpen: false })).toBe(false)
    expect(INVITE_COOLDOWN_MS).toBe(30 * 24 * 60 * 60 * 1000)
  })

  it('never shows on a suppressed page', () => {
    expect(inviteAllowed({ record: null, now: NOW, path: '/privacy/', cookieNoticeOpen: false })).toBe(false)
  })
})
