import { describe, expect, it } from 'vitest'
import { resolvePersons, type PersonSources } from '~/utils/resolvePersons'

const person = (id: string, extra: Record<string, unknown> = {}) => ({
  id, slug: id, first_name: 'Ina', last_name: id, middle_initial: null, display_name: null,
  is_collective: false, status: 'published' as const, sort: 0, translations: [], ...extra
})
const roles = [
  { id: 'r-artist', slug: 'artist', title: 'Artist', status: 'published' as const, sort: 1, translations: [{ languages_code: 'en', title: 'Artist' }, { languages_code: 'de', title: 'Künstler:in' }] },
  { id: 'r-curator', slug: 'curator', title: 'Curator', status: 'published' as const, sort: 2, translations: [] }
]
const exhibition = (id: string, start: string) => ({
  id, slug: id, title: `Title ${id}`, start_date: start, image: `/img/${id}.jpg`, image_alt: `Alt ${id}`
}) as never

const base = (overrides: Partial<PersonSources> = {}): PersonSources => ({
  persons: [person('urach', {
    image: '/img/urach.jpg', image_alt: 'Portrait', image_caption: 'Inés Urach · Foto: Inés Urach',
    born: '1970, Klagenfurt', based_in: 'Klagenfurt', lede: 'Painter.', about_html: '<p>Bio.</p>',
    translations: [
      { languages_code: 'en', based_in: 'Klagenfurt', lede: 'Painter.', about_html: '<p>Bio.</p>', image_alt: 'Portrait', image_caption: 'Inés Urach · Foto: Inés Urach' },
      { languages_code: 'de', based_in: 'Klagenfurt', lede: 'Malerin.', about_html: '<p>Biografie.</p>', image_alt: 'Porträt', image_caption: 'Inés Urach · Foto: Inés Urach' }
    ]
  })],
  roles,
  personRoles: [{ id: 1, persons_id: 'urach', roles_id: 'r-artist', sort: 0 }],
  participations: [
    { id: 'p1', exhibition: 'e-old', person: 'urach', role: 'r-artist', sort: 0 },
    { id: 'p2', exhibition: 'e-new', person: 'urach', role: 'r-curator', sort: 0 },
    { id: 'p3', exhibition: 'e-draft', person: 'urach', role: 'r-artist', sort: 0 }
  ],
  exhibitions: [exhibition('e-old', '2025-01-01'), exhibition('e-new', '2026-10-03')],
  statements: [],
  memberships: [],
  organisations: [],
  venues: [],
  personsVenues: [],
  websites: [
    { id: 'w-ig', title: 'Instagram', url: 'https://www.instagram.com/urach/', kind: 'social', status: 'published' as const, sort: 0, translations: [] },
    { id: 'w-home', title: 'inesurach.at', url: 'https://www.inesurach.at/', kind: 'website', status: 'published' as const, sort: 0, translations: [] }
  ],
  personsWebsites: [
    { id: 1, persons_id: 'urach', websites_id: 'w-ig', sort: 1 },
    { id: 2, persons_id: 'urach', websites_id: 'w-home', sort: 2 }
  ],
  locale: 'en',
  ...overrides
})

describe('resolvePersons', () => {
  it('builds the page model: roles, facts, home link, records newest first with their role', () => {
    const [p] = resolvePersons(base())
    expect(p).toMatchObject({ slug: 'urach', isArtist: true, born: '1970, Klagenfurt', basedIn: 'Klagenfurt', lede: 'Painter.', aboutHtml: '<p>Bio.</p>' })
    expect(p!.roles).toEqual([{ slug: 'artist', title: 'Artist' }])
    expect(p!.home).toEqual({ url: 'https://www.inesurach.at/', label: 'inesurach.at' })
    expect(p!.records.map((r) => [r.exhibition.id, r.role])).toEqual([['e-new', 'curator'], ['e-old', 'artist']])
    expect(p!.image).toEqual({ src: '/img/urach.jpg', alt: 'Portrait', caption: 'Inés Urach · Foto: Inés Urach' })
  })

  it('uses the German texts and role titles in German', () => {
    const [p] = resolvePersons(base({ locale: 'de' }))
    expect(p).toMatchObject({ lede: 'Malerin.', aboutHtml: '<p>Biografie.</p>' })
    expect(p!.roles).toEqual([{ slug: 'artist', title: 'Künstler:in' }])
  })

  it('falls back to the image of the newest exhibition when there is no photo', () => {
    const [p] = resolvePersons(base({ persons: [person('urach')] }))
    expect(p!.image).toEqual({ src: '/img/e-new.jpg', alt: 'Alt e-new', fromExhibition: 'Title e-new' })
  })

  it('renders an empty person: no role, record, bio, photo or link', () => {
    const [p] = resolvePersons(base({ persons: [person('nobody')], personRoles: [], participations: [], personsWebsites: [] }))
    expect(p).toMatchObject({ slug: 'nobody', isArtist: false, roles: [], records: [], links: [], statements: [] })
    expect(p!.image).toBeUndefined()
    expect(p!.home).toBeUndefined()
    expect(p!.aboutHtml).toBeUndefined()
  })

  it('has no records and no fallback image when the only exhibition is unpublished', () => {
    const [p] = resolvePersons(base({ persons: [person('urach')], exhibitions: [] }))
    expect(p!.records).toEqual([])
    expect(p!.image).toBeUndefined()
  })

  it('shows a collective by its display name exactly as written', () => {
    const [p] = resolvePersons(base({ persons: [person('raqs', { first_name: '', last_name: '', display_name: 'Raqs Media Collective', is_collective: true })] }))
    expect(p!.name).toBe('Raqs Media Collective')
  })

  it('uses the plain fields when a person has no translation rows', () => {
    const [p] = resolvePersons(base({ persons: [person('urach', { lede: 'Painter.', based_in: 'Vienna' })] }))
    expect(p).toMatchObject({ lede: 'Painter.', basedIn: 'Vienna' })
  })

  it('lists memberships and galleries only when the organisation or venue is published, with the localized function', () => {
    const [p] = resolvePersons(base({
      locale: 'de',
      organisations: [
        { id: 'o1', slug: 'bv-kaernten', title: 'BV Kärnten', status: 'published' },
        { id: 'o2', slug: 'draft-org', title: 'Draft', status: 'draft' }
      ] as never,
      memberships: [
        { id: 'm1', organisation: 'o1', person: 'urach', function: 'Secretary', sort: 0, translations: [{ languages_code: 'en', function: 'Secretary' }, { languages_code: 'de', function: 'Schriftführerin' }] },
        { id: 'm2', organisation: 'o2', person: 'urach', function: null, sort: 1, translations: [] }
      ],
      venues: [{ id: 'v1', slug: 'europahaus', title: 'Europahaus', status: 'published' }, { id: 'v2', slug: 'hidden', title: 'Hidden', status: 'draft' }] as never,
      personsVenues: [{ id: 1, persons_id: 'urach', venues_id: 'v1', sort: 0 }, { id: 2, persons_id: 'urach', venues_id: 'v2', sort: 1 }]
    }))
    expect(p!.memberships).toEqual([{ slug: 'bv-kaernten', title: 'BV Kärnten', function: 'Schriftführerin' }])
    expect(p!.venues).toEqual([{ slug: 'europahaus', name: 'Europahaus' }])
  })

  it('keeps only published, non-empty statements on a published exhibition', () => {
    const statement = (id: string, exhibition: string, status: 'draft' | 'published', text: string | null) => ({
      id, exhibition, person: 'urach', sort: 0, prompt: null, statement: text, status, translations: text ? [{ languages_code: 'en', statement: text }] : []
    })
    const [p] = resolvePersons(base({ statements: [
      statement('s1', 'e-old', 'published', 'Words'),
      statement('s2', 'e-old', 'draft', 'Hidden words'),
      statement('s3', 'e-draft', 'published', 'On a draft exhibition'),
      statement('s4', 'e-new', 'published', null)
    ] }))
    expect(p!.statements).toEqual([{ id: 's1', prompt: undefined, text: 'Words', exhibitionSlug: 'e-old', exhibitionTitle: 'Title e-old' }])
  })

  it('drops an unpublished link from the links and from the home link', () => {
    const [p] = resolvePersons(base({ websites: [
      { id: 'w-ig', title: 'Instagram', url: 'https://www.instagram.com/urach/', kind: 'social', status: 'published' as const, sort: 0, translations: [] },
      { id: 'w-home', title: 'inesurach.at', url: 'https://www.inesurach.at/', kind: 'website', status: 'draft' as const, sort: 0, translations: [] }
    ] }))
    expect(p!.links.map((link) => link.id)).toEqual(['w-ig'])
    expect(p!.home).toEqual({ url: 'https://www.instagram.com/urach/', label: 'Instagram' })
  })

  it('marks a curator without the artist role as not an artist', () => {
    const [p] = resolvePersons(base({ personRoles: [{ id: 1, persons_id: 'urach', roles_id: 'r-curator', sort: 0 }] }))
    expect(p).toMatchObject({ isArtist: false, roles: [{ slug: 'curator', title: 'Curator' }] })
  })

  it('drops unpublished persons', () => {
    expect(resolvePersons(base({ persons: [person('urach', { status: 'draft' })] }))).toEqual([])
  })
})
