import { describe, expect, it } from 'vitest'
import {
  INVITE_COOLDOWN_MS,
  NEWSLETTER_CONSENT_VERSION,
  NEWSLETTER_TOPICS,
  buildSubscribeBody,
  groupTownsByState,
  firstLoadedImage,
  inviteAllowed,
  invitePictures,
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

  it('offers only towns in Austria, like the overview pages (owner, 2026-11-09)', () => {
    const groups = groupTownsByState([town('graz', 'Graz', 'Styria'), { ...town('dobrovo', 'Dobrovo', 'Goriška'), country: 'Slovenia' }], stateName)
    expect(groups.map((g) => g.state)).toEqual(['Styria'])
  })
})

describe('buildSubscribeBody', () => {
  it('sends what the endpoint reads, with the address trimmed', () => {
    const body = buildSubscribeBody(
      { email: ' maria@example.at ', firstName: ' Maria ', lastName: ' Beispiel ', towns: ['graz'], topics: ['nearby'], consent: true, website: '' },
      { language: 'en', source: 'invite', pageUrl: 'https://permaphemera.at/en/', startedAt: 1000 }
    )
    expect(body).toEqual({
      email: 'maria@example.at',
      firstName: 'Maria',
      lastName: 'Beispiel',
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
    '/newsletter/', '/newsletter/confirmed/', '/en/newsletter/confirmed/'
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

  it('reads the states "shown" and "never" too', () => {
    expect(parseInviteRecord(JSON.stringify({ state: 'shown', savedAt: 5, version: 1 }))).toEqual({ state: 'shown', savedAt: 5, version: 1 })
    expect(parseInviteRecord(JSON.stringify({ state: 'never', savedAt: 5, version: 1 }))).toEqual({ state: 'never', savedAt: 5, version: 1 })
  })

  it('counts the 30 days from the moment it showed', () => {
    const shown = (ago: number) => ({ state: 'shown' as const, savedAt: NOW - ago, version: 1 as const })
    expect(inviteAllowed({ record: shown(INVITE_COOLDOWN_MS - 1), now: NOW, path: '/', cookieNoticeOpen: false })).toBe(false)
    expect(inviteAllowed({ record: shown(INVITE_COOLDOWN_MS + 1), now: NOW, path: '/', cookieNoticeOpen: false })).toBe(true)
  })

  it('"never show again" keeps it away for good, like a sign-up', () => {
    expect(inviteAllowed({ record: { state: 'never', savedAt: 0, version: 1 }, now: NOW, path: '/', cookieNoticeOpen: false })).toBe(false)
  })

  it('never shows on a suppressed page', () => {
    expect(inviteAllowed({ record: null, now: NOW, path: '/privacy/', cookieNoticeOpen: false })).toBe(false)
  })
})

describe('invitePictures', () => {
  const show = (slug: string, start_date: string, overrides: Record<string, unknown> = {}) => ({
    slug, start_date, title: slug.toUpperCase(), venue: 'Galerie', city: 'Stadt', image: `/img/${slug}.jpg`,
    tour: `/media/tours/${slug}/`, tour_status: 'available' as const, tour_available_from: null, ...overrides
  })

  it('offers the room pictures of the three newest open tours, newest first', () => {
    const list = [show('a', '2026-01-01'), show('b', '2026-03-01'), show('c', '2026-02-01'), show('d', '2025-01-01'), show('e', '2026-04-01', { tour: null })]
    expect(invitePictures(list, '2026-09-01').map((item) => [item.src, item.exhibition.slug])).toEqual([
      ['/media/tours/b/start-view.jpg', 'b'],
      ['/media/tours/c/start-view.jpg', 'c'],
      ['/media/tours/a/start-view.jpg', 'a']
    ])
  })
})

describe('firstLoadedImage', () => {
  it('gives the first address that loads, and null when none does', async () => {
    const ok = new Set(['/b.jpg', '/c.jpg'])
    const load = (src: string) => ok.has(src) ? Promise.resolve() : Promise.reject(new Error('404'))
    await expect(firstLoadedImage(['/a.jpg', '/b.jpg', '/c.jpg'], load)).resolves.toBe('/b.jpg')
    await expect(firstLoadedImage(['/a.jpg'], load)).resolves.toBeNull()
  })
})
