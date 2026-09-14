import { describe, expect, it } from 'vitest'
import { resolveExhibitions } from '~/utils/resolveExhibitions'

const locations = [{
  id: 'location-spittal', slug: 'spittal-an-der-drau', city_name: 'Spittal an der Drau',
  postal_code: '9800', state: 'Carinthia', country: 'Austria',
  latitude: 46.7967, longitude: 13.4989, status: 'published' as const,
  translations: [{ languages_code: 'en', description: '' }]
}]

const venues = [{
  id: 'venue-parkschloessl', slug: 'parkschloessl-spittal-drau', location_id: 'location-spittal',
  name: 'Parkschlössl', type: 'gallery' as const, address: '', image: '/v.webp', image_alt: '',
  archive_number: '17', featured: true, status: 'published' as const,
  translations: [{ languages_code: 'en', description: '' }]
}]

const artists = [
  { id: 'artist-sylvia-campidell', slug: 'sylvia-campidell', first_name: 'Sylvia',
    last_name: 'Campidell', middle_initial: null, artist_name: null, birth_year: null,
    death_year: null, nationality: null, website_url: null, instagram_handle: null,
    profile_image: null, status: 'published' as const, translations: [{ languages_code: 'en', biography: '' }] },
  { id: 'artist-judith-maria-kulle', slug: 'judith-maria-kulle', first_name: 'Judith Maria',
    last_name: 'Kulle', middle_initial: null, artist_name: null, birth_year: null,
    death_year: null, nationality: null, website_url: null, instagram_handle: null,
    profile_image: null, status: 'published' as const, translations: [{ languages_code: 'en', biography: '' }] }
]

const exhibitions = [{
  id: 'parkschloessl-campidell-kulle-2026', slug: 'farben-im-park',
  primary_venue_id: 'venue-parkschloessl', start_date: '2026-07-28', end_date: '2026-08-07',
  is_permanent: false, image: '/e.webp', image_alt: 'alt', opening_hours: 'Mon-Fri',
  vernissage: 'Mon 27 July', medium: null, source_pdf: null, tour: null, tour_status: 'available', tour_available_from: null,
  status: 'published' as const,
  translations: [{ languages_code: 'en', title: 'Farben im Park', summary: 's',
    description: '', date_range: '28 July–7 August 2026', opening_hours: '', vernissage: '',
    image_alt: '', medium: '' }]
}]

const junction = [
  { id: 2, exhibition_id: 'parkschloessl-campidell-kulle-2026', artist_id: 'artist-judith-maria-kulle', sort: 1 },
  { id: 1, exhibition_id: 'parkschloessl-campidell-kulle-2026', artist_id: 'artist-sylvia-campidell', sort: 0 }
]

const resolve = () => resolveExhibitions(exhibitions, venues, locations, junction, artists, 'en')

describe('resolveExhibitions', () => {
  it('joins multiple artists in sort order regardless of junction row order', () => {
    expect(resolve()[0].artist).toBe('Sylvia Campidell & Judith Maria Kulle')
  })

  it('exposes the artist ids for downstream linking', () => {
    expect(resolve()[0].artist_ids).toEqual(['artist-sylvia-campidell', 'artist-judith-maria-kulle'])
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
    expect(resolveExhibitions(withTour, venues, locations, junction, artists, 'en')[0].tour)
      .toBe('/media/tours/2026-07-30-farben-im-park/')
  })

  it('throws when primary_venue_id does not resolve', () => {
    const orphan = [{ ...exhibitions[0], primary_venue_id: 'venue-nowhere' }]
    expect(() => resolveExhibitions(orphan, venues, locations, junction, artists, 'en'))
      .toThrow(/references unknown venue venue-nowhere/)
  })

  it('throws when a junction row points at a missing artist', () => {
    const broken = [{ id: 3, exhibition_id: 'parkschloessl-campidell-kulle-2026', artist_id: 'artist-ghost', sort: 0 }]
    expect(() => resolveExhibitions(exhibitions, venues, locations, broken, artists, 'en'))
      .toThrow(/unknown artist artist-ghost/)
  })

  it('exposes each linked artist with an optional website and the venue website', () => {
    const linkedArtists = artists.map((artist) => ({ ...artist, website_url: 'https://example.org/' }))
    const linkedVenues = venues.map((venue) => ({ ...venue, website_url: 'https://venue.example/' }))
    const [record] = resolveExhibitions(exhibitions, linkedVenues, locations, junction, linkedArtists, 'en')
    expect(record.artists).toEqual([
      { id: 'artist-sylvia-campidell', name: 'Sylvia Campidell', website_url: 'https://example.org/' },
      { id: 'artist-judith-maria-kulle', name: 'Judith Maria Kulle', website_url: 'https://example.org/' }
    ])
    expect(record.venue_website).toBe('https://venue.example/')
    expect(resolve()[0].artists[0].website_url).toBeUndefined()
    expect(resolve()[0].venue_website).toBeUndefined()
  })

  it('attaches statements in sort order, localized, and drops empty ones', () => {
    const statement = (id: string, sort: number, status: 'draft' | 'published', text = 'Words about the room') => ({
      id, exhibition_id: exhibitions[0].id, artist_id: artists[0].id, sort, status: status as 'draft' | 'published',
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
    const en = resolveExhibitions(exhibitions, venues, locations, junction, artists, 'en', statements)[0]
    expect(en.statements.map(({ id }) => id)).toEqual(['first', 'second'])
    expect(en.statements[0]).toMatchObject({ artist: 'Sylvia Campidell', prompt: 'How did you approach the room?', text: 'Words about the room' })
    const de = resolveExhibitions(exhibitions, venues, locations, junction, artists, 'de', statements)[0]
    expect(de.statements[0].text).toBe('DE Words about the room')
    expect(resolve()[0].statements).toEqual([])
  })
})
