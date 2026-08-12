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
  vernissage: 'Mon 27 July', medium: null, source_pdf: null, featured: false,
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
})
