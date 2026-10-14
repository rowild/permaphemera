import { describe, expect, it } from 'vitest'
import { resolveSponsors, type SponsorSources } from '~/utils/resolveSponsors'

const sponsor = (status: 'draft' | 'published' = 'published') => ({
  id: 's1', slug: 'kaernten-kultur', title: 'Land Kärnten Kultur', website_url: 'https://www.kulturchannel.at/', logo: '/img/logo.svg',
  description: 'Cultural department.', status, sort: 0, translations: [{ languages_code: 'en', description: 'Cultural department.' }, { languages_code: 'de', description: 'Kulturabteilung.' }]
})
const base = (overrides: Partial<SponsorSources> = {}): SponsorSources => ({
  sponsors: [sponsor()],
  exhibitions: [{ id: 'e1', slug: 'e1', title: 'E1', start_date: '2026-01-01' }] as never,
  venues: [{ id: 'v1', slug: 'v1', title: 'Venue 1', status: 'published' }, { id: 'v2', slug: 'v2', title: 'Draft venue', status: 'draft' }] as never,
  persons: [{ id: 'p1', slug: 'p1', first_name: 'Ina', last_name: 'Rainer', middle_initial: null, display_name: null, is_collective: false, status: 'published', sort: 0 }] as never,
  locations: [{ id: 'l1', title: 'Klagenfurt am Wörthersee', status: 'published' }] as never,
  exhibitionsSponsors: [{ id: 1, exhibitions_id: 'e1', sponsors_id: 's1', sort: 0 }, { id: 2, exhibitions_id: 'e-gone', sponsors_id: 's1', sort: 1 }],
  sponsorsVenues: [{ id: 1, sponsors_id: 's1', venues_id: 'v1', sort: 0 }, { id: 2, sponsors_id: 's1', venues_id: 'v2', sort: 1 }],
  personsSponsors: [{ id: 1, persons_id: 'p1', sponsors_id: 's1', sort: 0 }],
  locationsSponsors: [{ id: 1, locations_id: 'l1', sponsors_id: 's1', sort: 0 }],
  locale: 'en',
  ...overrides
})

describe('resolveSponsors', () => {
  it('lists what a sponsor supports, dropping missing or unpublished records', () => {
    const [s] = resolveSponsors(base())
    expect(s).toMatchObject({ slug: 'kaernten-kultur', title: 'Land Kärnten Kultur', description: 'Cultural department.' })
    expect(s!.exhibitions.map((e) => e.id)).toEqual(['e1'])
    expect(s!.venues).toEqual([{ slug: 'v1', name: 'Venue 1' }])
    expect(s!.persons).toEqual([{ slug: 'p1', name: 'Ina Rainer' }])
    expect(s!.towns).toEqual(['Klagenfurt am Wörthersee'])
  })

  it('uses the German description', () => {
    expect(resolveSponsors(base({ locale: 'de' }))[0]!.description).toBe('Kulturabteilung.')
  })

  it('drops unpublished sponsors', () => {
    expect(resolveSponsors(base({ sponsors: [sponsor('draft')] }))).toEqual([])
  })
})
