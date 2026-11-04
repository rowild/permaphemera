import { describe, expect, it } from 'vitest'
import { eventByExhibition, resolveEvents } from '~/utils/resolveEvents'

// Events (plans/2026-11-04__events-collection.md): an event with its own page, one edition per
// year, the exhibitions of each edition, the organisations that put it on.
const town = { id: 'loc-spittal', slug: 'spittal-an-der-drau', title: 'Spittal an der Drau', status: 'published', translations: [] }
const festival = {
  id: 'ev-comic', slug: 'spittaler-comicfestival', title: 'Spittaler Comicfestival', kind: 'festival', location: 'loc-spittal',
  website_url: null, image: null, lede: 'The comic festival of Spittal.', about_html: '<p>Every year.</p>', description: 'Annual comic festival.',
  status: 'published', sort: 1,
  translations: [
    { languages_code: 'en', lede: 'The comic festival of Spittal.', about_html: '<p>Every year.</p>' },
    { languages_code: 'de', lede: 'Das Comicfestival von Spittal.', about_html: '<p>Jedes Jahr.</p>' }
  ]
}
const night = { ...festival, id: 'ev-night', slug: 'lange-nacht-der-museen', title: 'ORF Lange Nacht der Museen', kind: 'long_night', location: null, website_url: 'https://langenacht.orf.at/', translations: [] }
const draft = { ...festival, id: 'ev-draft', slug: 'draft-event', title: 'Draft', status: 'draft' }
const editions = [
  { id: 'ed-comic-2025', event: 'ev-comic', year: 2025, edition_number: 6, start_date: null, end_date: null, sort: 1 },
  { id: 'ed-comic-2026', event: 'ev-comic', year: 2026, edition_number: 7, start_date: null, end_date: null, sort: 2 },
  { id: 'ed-night-2026', event: 'ev-night', year: 2026, edition_number: null, start_date: '2026-10-03', end_date: '2026-10-03', sort: 1 }
]
const exhibition = (id: string, edition: string | null, status = 'published') => ({ id, event_edition: edition, status })
const exhibitions = [
  exhibition('ex-lines', 'ed-comic-2026'),
  exhibition('ex-old', 'ed-comic-2025'),
  exhibition('ex-night-a', 'ed-night-2026'),
  exhibition('ex-night-b', 'ed-night-2026'),
  exhibition('ex-draft', 'ed-night-2026', 'draft'),
  exhibition('ex-none', null)
]
const organisations = [
  { id: 'org-toon', slug: 'austriatoon', title: 'Austriatoon', status: 'published' },
  { id: 'org-draft', slug: 'draft-org', title: 'Draft org', status: 'draft' }
]
const organisers = [
  { id: 'o1', event: 'ev-comic', organisation: 'org-toon', role: 'organiser', sort: 1 },
  { id: 'o2', event: 'ev-comic', organisation: 'org-draft', role: 'supporter', sort: 2 }
]

const resolve = (locale = 'en') => resolveEvents({
  events: [festival, night, draft], editions, organisers, organisations, locations: [town], exhibitions, websites: [], eventsWebsites: [], locale
} as never)

describe('resolveEvents', () => {
  it('lists the published events with their town (none for an event across the country)', () => {
    const events = resolve()
    expect(events.map((event) => event.slug)).toEqual(['spittaler-comicfestival', 'lange-nacht-der-museen'])
    expect(events[0]!.city).toBe('Spittal an der Drau')
    expect(events[1]!.city).toBeUndefined()
  })

  it('takes the texts of the page language', () => {
    expect(resolve('de')[0]!.lede).toBe('Das Comicfestival von Spittal.')
    expect(resolve('de')[0]!.aboutHtml).toBe('<p>Jedes Jahr.</p>')
  })

  it('lists the editions newest first, each with its published exhibitions', () => {
    const [comic, longNight] = resolve()
    expect(comic!.editions.map((edition) => [edition.year, edition.edition_number, edition.exhibitionIds])).toEqual([[2026, 7, ['ex-lines']], [2025, 6, ['ex-old']]])
    expect(longNight!.editions[0]).toMatchObject({ year: 2026, start_date: '2026-10-03', exhibitionIds: ['ex-night-a', 'ex-night-b'] })
    expect(longNight!.exhibitionCount).toBe(2)
  })

  it('names the published organisations behind the event, in their order', () => {
    expect(resolve()[0]!.organisers).toEqual([{ slug: 'austriatoon', title: 'Austriatoon', role: 'organiser' }])
  })
})

describe('eventByExhibition', () => {
  it('tells for each exhibition which event and year it is part of', () => {
    const partOf = eventByExhibition(resolve())
    expect(partOf.get('ex-lines')).toEqual({ slug: 'spittaler-comicfestival', title: 'Spittaler Comicfestival', year: 2026, edition_number: 7 })
    expect(partOf.get('ex-night-b')).toMatchObject({ slug: 'lange-nacht-der-museen', year: 2026 })
    expect(partOf.has('ex-none')).toBe(false)
    expect(partOf.has('ex-draft')).toBe(false)
  })
})
