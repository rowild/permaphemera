import { describe, expect, it } from 'vitest'
import { resolveNews, type NewsSources } from '~/utils/resolveNews'

const article = (id: string, overrides: Record<string, unknown> = {}) => ({
  id, slug: id, status: 'published', sort: null, title: `Title ${id}`, published_on: '2026-11-03', topic: 'welcome',
  image: null, image_alt: null, summary: 'Summary.', description: 'Text.',
  translations: [{ languages_code: 'en', title: `Title ${id}` }, { languages_code: 'de', title: `Titel ${id}`, summary: 'Kurz.' }],
  ...overrides
})
const base = (overrides: Partial<NewsSources> = {}): NewsSources => ({
  news: [article('n1')] as never,
  exhibitions: [{ id: 'e1', slug: 'e1', title: 'E1', image: '/e1.jpg', image_alt: 'E1 alt' }] as never,
  venues: [{ id: 'v1', slug: 'v1', name: 'V1', image: '/v1.jpg', image_alt: 'V1 alt', has_image: true }] as never,
  persons: [{ id: 'p1', slug: 'p1', name: 'Ina Rainer' }] as never,
  organisations: [{ id: 'o1', slug: 'o1', title: 'O1' }] as never,
  sponsors: [{ id: 's1', slug: 's1', title: 'S1' }] as never,
  events: [{ id: 'ev1', slug: 'ev1', title: 'Ev1' }] as never,
  exhibitionsNews: [{ id: 1, exhibitions_id: 'e1', news_id: 'n1', sort: 0 }, { id: 2, exhibitions_id: 'e-draft', news_id: 'n1', sort: 1 }],
  newsVenues: [{ id: 1, news_id: 'n1', venues_id: 'v1', sort: 0 }],
  newsPersons: [{ id: 1, news_id: 'n1', persons_id: 'p1', sort: 0 }],
  newsOrganisations: [{ id: 1, news_id: 'n1', organisations_id: 'o1', sort: 0 }],
  newsSponsors: [{ id: 1, news_id: 'n1', sponsors_id: 's1', sort: 0 }],
  eventsNews: [{ id: 1, events_id: 'ev1', news_id: 'n1', sort: 0 }, { id: 2, events_id: 'ev-draft', news_id: 'n1', sort: 1 }],
  locale: 'en',
  ...overrides
})

describe('resolveNews', () => {
  it('links the published records and drops links to records that are not there', () => {
    const [n] = resolveNews(base())
    expect(n!.exhibitions.map((e) => e.id)).toEqual(['e1'])
    expect(n!.venues.map((v) => v.id)).toEqual(['v1'])
    expect(n!.persons.map((p) => p.id)).toEqual(['p1'])
    expect(n!.organisations.map((o) => o.id)).toEqual(['o1'])
    expect(n!.sponsors.map((s) => s.id)).toEqual(['s1'])
    expect(n!.events.map((e) => e.id)).toEqual(['ev1'])
  })

  it('takes the German texts and falls back to English', () => {
    const [n] = resolveNews(base({ locale: 'de' }))
    expect(n).toMatchObject({ title: 'Titel n1', summary: 'Kurz.', description: 'Text.' })
  })

  it('drops drafts and sorts newest first, then by title', () => {
    const news = [article('a', { published_on: '2026-10-01' }), article('c', { published_on: '2026-11-01' }), article('b', { published_on: '2026-11-01' }), article('d', { status: 'draft' })]
    expect(resolveNews(base({ news: news as never })).map((n) => n.slug)).toEqual(['b', 'c', 'a'])
  })

  it('uses its own image, else the first exhibition, else the first gallery with a photo', () => {
    expect(resolveNews(base({ news: [article('n1', { image: '/own.jpg', image_alt: 'Own' })] as never }))[0]).toMatchObject({ image: '/own.jpg', image_alt: 'Own' })
    expect(resolveNews(base())[0]).toMatchObject({ image: '/e1.jpg', image_alt: 'E1 alt' })
    expect(resolveNews(base({ exhibitionsNews: [] }))[0]).toMatchObject({ image: '/v1.jpg', image_alt: 'V1 alt' })
    expect(resolveNews(base({ exhibitionsNews: [], newsVenues: [] }))[0]!.image).toBeUndefined()
  })
})
