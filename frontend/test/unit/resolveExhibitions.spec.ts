import { describe, expect, it } from 'vitest'
import { resolveExhibitions } from '~/utils/resolveExhibitions'

const locations = [{
  id: 'location-spittal', slug: 'spittal-an-der-drau', title: 'Spittal an der Drau',
  postal_code: '9800', state: 'Carinthia', country: 'Austria',
  latitude: 46.7967, longitude: 13.4989, description: null, status: 'published' as const,
  translations: [{ languages_code: 'en', description: '' }]
}]

const venues = [{
  id: 'venue-parkschloessl', slug: 'parkschloessl-spittal-drau', location: 'location-spittal',
  title: 'Parkschlössl', type: 'gallery' as const, address: '', website_url: null, latitude: null, longitude: null,
  image: '/v.webp', image_alt: '', hero_image: null, hero_image_alt: null,
  archive_number: '17', featured: true, description: null, lede: null, about: null, image_caption: null, coordinate_label: null,
  status: 'published' as const, translations: [{ languages_code: 'en', description: '' }]
}]

const persons = [
  { id: 'person-sylvia-campidell', slug: 'sylvia-campidell', first_name: 'Sylvia', last_name: 'Campidell',
    middle_initial: null, display_name: null, status: 'published' as const },
  { id: 'person-judith-maria-kulle', slug: 'judith-maria-kulle', first_name: 'Judith Maria', last_name: 'Kulle',
    middle_initial: null, display_name: null, status: 'published' as const },
  { id: 'person-curator', slug: 'cura-tor', first_name: 'Cura', last_name: 'Tor',
    middle_initial: null, display_name: null, status: 'published' as const }
]

const roles = [
  { id: 'role-artist', slug: 'artist', title: 'Artist', status: 'published' as const, sort: 1, translations: [{ languages_code: 'en', title: 'Artist' }] },
  { id: 'role-curator', slug: 'curator', title: 'Curator', status: 'published' as const, sort: 2, translations: [{ languages_code: 'en', title: 'Curator' }] }
]

const exhibitions = [{
  id: 'parkschloessl-campidell-kulle-2026', slug: 'farben-im-park',
  primary_venue: 'venue-parkschloessl', start_date: '2026-07-28', end_date: '2026-08-07',
  is_permanent: false, image: '/e.webp', image_alt: 'alt', title: 'Farben im Park', summary: 's', description: null,
  date_range: '28 July–7 August 2026', opening_hours: 'Mon-Fri', vernissage: 'Mon 27 July', medium: null,
  source_pdf: null, tour: null, tour_status: 'available' as const, tour_available_from: null,
  status: 'published' as const,
  translations: [{ languages_code: 'en', title: 'Farben im Park', summary: 's',
    description: '', date_range: '28 July–7 August 2026', opening_hours: '', vernissage: '',
    image_alt: '', medium: '' }]
}]

const participations = [
  { id: 'p-2', exhibition: 'parkschloessl-campidell-kulle-2026', person: 'person-judith-maria-kulle', role: 'role-artist', sort: 1, status: 'published' as const },
  { id: 'p-1', exhibition: 'parkschloessl-campidell-kulle-2026', person: 'person-sylvia-campidell', role: 'role-artist', sort: 0, status: 'published' as const },
  { id: 'p-3', exhibition: 'parkschloessl-campidell-kulle-2026', person: 'person-curator', role: 'role-curator', sort: 0, status: 'published' as const }
]

const resolve = () => resolveExhibitions(exhibitions, venues, locations, participations, persons, roles, 'en')

describe('resolveExhibitions', () => {
  it('joins multiple artists in sort order regardless of junction row order', () => {
    expect(resolve()[0].artist).toBe('Sylvia Campidell & Judith Maria Kulle')
  })

  it('exposes the artist ids for downstream linking', () => {
    expect(resolve()[0].artist_ids).toEqual(['person-sylvia-campidell', 'person-judith-maria-kulle'])
  })

  it('inlines venue slug, venue name and city', () => {
    const [record] = resolve()
    expect(record.venue_slug).toBe('parkschloessl-spittal-drau')
    expect(record.venue).toBe('Parkschlössl')
    expect(record.city).toBe('Spittal an der Drau')
  })

  it('passes a published tour folder through and drops a null one', () => {
    expect(resolve()[0].tour).toBeUndefined()
    const withTour = [{ ...exhibitions[0], tour: '/media/tours/2026-07-30-farben-im-park/' }]
    expect(resolveExhibitions(withTour, venues, locations, participations, persons, roles, 'en')[0].tour)
      .toBe('/media/tours/2026-07-30-farben-im-park/')
  })

  it('throws when primary_venue does not resolve', () => {
    const orphan = [{ ...exhibitions[0], primary_venue: 'venue-nowhere' }]
    expect(() => resolveExhibitions(orphan, venues, locations, participations, persons, roles, 'en'))
      .toThrow(/references unknown venue venue-nowhere/)
  })

  it('throws when a participation names an unknown person', () => {
    const broken = [{ id: 'p-9', exhibition: 'parkschloessl-campidell-kulle-2026', person: 'person-ghost', role: 'role-artist', sort: 0, status: 'published' as const }]
    expect(() => resolveExhibitions(exhibitions, venues, locations, broken, persons, roles, 'en'))
      .toThrow(/unknown person person-ghost/)
  })

  it('exposes each linked artist with its links, the exhibition links and the venue website', () => {
    const websites = [
      { id: 'w-1', title: 'Website', url: 'https://example.org/', kind: 'website', status: 'published' as const, sort: 1, translations: [{ languages_code: 'en', title: 'Website' }] },
      { id: 'w-2', title: 'Exhibition page', url: 'https://venue.example/show', kind: 'exhibition_page', status: 'published' as const, sort: 2, translations: [{ languages_code: 'en', title: 'Exhibition page' }] },
      { id: 'w-3', title: 'Hidden', url: 'https://hidden.example/', kind: 'website', status: 'archived' as const, sort: 3, translations: [] }
    ]
    const personsWebsites = [
      { id: 1, sort: 0, persons_id: 'person-sylvia-campidell', websites_id: 'w-1' },
      { id: 2, sort: 0, persons_id: 'person-judith-maria-kulle', websites_id: 'w-3' }
    ]
    const exhibitionsWebsites = [{ id: 3, sort: 0, exhibitions_id: 'parkschloessl-campidell-kulle-2026', websites_id: 'w-2' }]
    const linkedVenues = venues.map((venue) => ({ ...venue, website_url: 'https://venue.example/' }))
    const [record] = resolveExhibitions(exhibitions, linkedVenues, locations, participations, persons, roles, 'en', [], websites, exhibitionsWebsites, personsWebsites)
    expect(record.artists).toEqual([
      { id: 'person-sylvia-campidell', name: 'Sylvia Campidell', website_url: 'https://example.org/', websites: [{ id: 'w-1', title: 'Website', url: 'https://example.org/', kind: 'website' }] },
      { id: 'person-judith-maria-kulle', name: 'Judith Maria Kulle', website_url: undefined, websites: [] }
    ])
    expect(record.websites).toEqual([{ id: 'w-2', title: 'Exhibition page', url: 'https://venue.example/show', kind: 'exhibition_page' }])
    expect(record.venue_website).toBe('https://venue.example/')
    expect(resolve()[0].artists[0].website_url).toBeUndefined()
    expect(resolve()[0].websites).toEqual([])
    expect(resolve()[0].venue_website).toBeUndefined()
  })

  it('attaches statements in sort order, localized, and drops empty ones', () => {
    const statement = (id: string, sort: number, status: 'draft' | 'published', text = 'Words about the room') => ({
      id, exhibition: exhibitions[0].id, person: persons[0].id, sort,
      prompt: 'How did you approach the room?', statement: text, status: status as 'draft' | 'published',
      translations: [
        { languages_code: 'en', prompt: 'How did you approach the room?', statement: text },
        { languages_code: 'de', prompt: 'Wie sind Sie an den Raum herangegangen?', statement: text ? `DE ${text}` : '' }
      ]
    })
    const statements = [
      statement('second', 1, 'published'),
      statement('first', 0, 'published'),
      statement('empty', 3, 'published', '')
    ]
    const en = resolveExhibitions(exhibitions, venues, locations, participations, persons, roles, 'en', statements)[0]
    expect(en.statements.map(({ id }) => id)).toEqual(['first', 'second'])
    expect(en.statements[0]).toMatchObject({ artist: 'Sylvia Campidell', prompt: 'How did you approach the room?', text: 'Words about the room' })
    const de = resolveExhibitions(exhibitions, venues, locations, participations, persons, roles, 'de', statements)[0]
    expect(de.statements[0].text).toBe('DE Words about the room')
    expect(resolve()[0].statements).toEqual([])
  })

  it('lists only artist-role participations as artists and curators separately', () => {
    const [record] = resolve()
    expect(record.artist).toBe('Sylvia Campidell & Judith Maria Kulle')
    expect(record.curators.map((c) => c.name)).toEqual(['Cura Tor'])
  })

  it('throws when a participation names an unknown role', () => {
    const broken = [{ ...participations[0], role: 'role-ghost' }]
    expect(() => resolveExhibitions(exhibitions, venues, locations, broken, persons, roles, 'en'))
      .toThrow(/unknown role role-ghost/)
  })

  it('credits a person by their display_name unchanged, e.g. VALIE EXPORT', () => {
    const valieExport = { ...persons[0], id: 'person-valie-export', slug: 'valie-export', display_name: 'VALIE EXPORT' }
    const rows = [{ id: 'p-valie', exhibition: exhibitions[0].id, person: 'person-valie-export', role: 'role-artist', sort: 0, status: 'published' as const }]
    const [record] = resolveExhibitions(exhibitions, venues, locations, rows, [valieExport], roles, 'en')
    expect(record.artist).toBe('VALIE EXPORT')
    expect(record.artists[0]).toMatchObject({ id: 'person-valie-export', name: 'VALIE EXPORT' })
  })
})
