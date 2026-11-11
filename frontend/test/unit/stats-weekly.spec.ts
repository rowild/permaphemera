import { describe, expect, it } from 'vitest'
import { buildIndex, exportStart, normalizePath, sumWeeks } from '../../scripts/lib/stats-weekly.mjs'

// Owner, 2026-11-11: Umami's visit details go after 36 months; weekly sums of every important
// collection stay for good in Directus (plans/2026-11-11__umami-weekly-sums.md).

const records = {
  locations: [{ id: 'town-spittal', title: 'Spittal an der Drau' }],
  venues: [{ id: 'venue-1', slug: 'schloss-porcia', title: 'Galerie im Schloss Porcia', location: 'town-spittal' }],
  exhibitions: [{ id: 'exh-1', slug: 'wagner-reloaded', title: 'Wagner reloaded', tour: '/media/tours/2026-04-13-wagner-reloaded/', primary_venue: { id: 'venue-1', location: 'town-spittal' } }],
  persons: [
    { id: 'person-1', slug: 'maria-muster', first_name: 'Maria', last_name: 'Muster', display_name: null },
    { id: 'person-2', slug: 'kollektiv', first_name: null, last_name: null, display_name: 'Das Kollektiv' }
  ],
  organisations: [{ id: 'org-1', slug: 'kultur-im-puls', title: 'kultur.im.puls', location: 'town-spittal' }],
  events: [],
  news: [],
  sponsors: []
}

const W = '2026-11-02'
const lines = [
  { t: 'v', w: W, p: '/en/exhibitions/wagner-reloaded/#exhibition-details', s: 'a', r: 'google.com', n: 2 },
  { t: 'v', w: W, p: '/exhibitions/wagner-reloaded/', s: 'b', r: '', n: 1 },
  { t: 'v', w: W, p: '/venues/schloss-porcia/', s: 'a', r: 'permaphemera.at', n: 1 },
  { t: 'v', w: W, p: '/persons/kollektiv', s: 'b', r: '', n: 1 },
  { t: 'v', w: W, p: '/en', s: 'c', r: 'instagram.com', n: 1 },
  { t: 'v', w: W, p: '/exhibitions/current/', s: 'c', r: '', n: 1 },
  { t: 'v', w: W, p: '/persons/gone-slug/', s: 'c', r: '', n: 1 },
  { t: 'o', w: W, tour: '2026-04-13-wagner-reloaded', s: 'a', n: 3 },
  { t: 's', s: 'a', c: 'AT', r: 'AT-9', ci: 'Vienna', d: 'desktop' },
  { t: 's', s: 'b', c: 'AT', r: 'AT-2', ci: 'Villach', d: 'mobile' },
  { t: 's', s: 'c', c: 'DE', r: null, ci: null, d: 'mobile' }
]

const rows = sumWeeks(lines, buildIndex(records))
const row = (key: string) => rows.find((r) => r.key === `${W}|${key}`)

describe('normalizePath', () => {
  it('merges both languages and drops the anchor and the query', () => {
    expect(normalizePath('/en/exhibitions/x/#details')).toBe('/exhibitions/x/')
    expect(normalizePath('/exhibitions/x?utm=1')).toBe('/exhibitions/x/')
    expect(normalizePath('/en')).toBe('/')
    expect(normalizePath('/#method')).toBe('/')
  })
})

describe('sumWeeks', () => {
  it('sums the whole site: views, distinct visitors, tour openings', () => {
    expect(row('site|site')).toMatchObject({ kind: 'site', views: 8, visitors: 3, tour_opens: 3 })
  })

  it('sums each record over both languages, with its tour openings', () => {
    expect(row('record|pp_exhibitions:exh-1')).toMatchObject({
      kind: 'record', collection: 'pp_exhibitions', item: 'exh-1', label: 'Wagner reloaded',
      path: '/exhibitions/wagner-reloaded/', views: 3, visitors: 2, tour_opens: 3
    })
    expect(row('record|pp_persons:person-2')).toMatchObject({ label: 'Das Kollektiv', views: 1, visitors: 1 })
  })

  it('sums a town from its galleries, exhibitions, organisations and events', () => {
    expect(row('town|pp_locations:town-spittal')).toMatchObject({
      kind: 'town', collection: 'pp_locations', item: 'town-spittal', label: 'Spittal an der Drau', views: 4, visitors: 2, tour_opens: 3
    })
  })

  it('keeps every other page, also a record address that no longer exists', () => {
    expect(row('page|/')).toMatchObject({ views: 1, visitors: 1 })
    expect(row('page|/exhibitions/current/')).toMatchObject({ views: 1 })
    expect(row('page|/persons/gone-slug/')).toMatchObject({ views: 1 })
  })

  it('sums where visitors came from, their devices and the sites that sent them', () => {
    expect(row('country|AT')).toMatchObject({ views: 5, visitors: 2, tour_opens: 3 })
    expect(row('city|AT|AT-9|Vienna')).toMatchObject({ label: 'AT · AT-9 · Vienna', views: 3, visitors: 1 })
    expect(row('device|mobile')).toMatchObject({ views: 5, visitors: 2 })
    expect(row('referrer|google.com')).toMatchObject({ views: 2, visitors: 1 })
    expect(row('referrer|permaphemera.at')).toBeUndefined()
  })
})

describe('exportStart', () => {
  it('starts with the week Umami began, then repeats the last stored week (missing rows only)', () => {
    expect(exportStart(null)).toBe('2026-10-19')
    expect(exportStart('2026-11-02')).toBe('2026-11-02')
  })
})
