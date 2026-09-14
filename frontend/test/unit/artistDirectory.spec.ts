import { describe, expect, it } from 'vitest'
import { buildArtistDirectory } from '~/utils/artistDirectory'

const artist = (id: string, first: string, last: string) => ({
  id, slug: `${first}-${last}`.toLowerCase(), first_name: first, last_name: last,
  middle_initial: null, artist_name: null, birth_year: null, death_year: null,
  nationality: null, website_url: null, instagram_handle: null, profile_image: null,
  status: 'published' as const, translations: [{ languages_code: 'en', biography: '' }]
})

const artists = [artist('a-1', 'Sylvia', 'Campidell'), artist('a-2', 'Nobody', 'Unshown')]

const exhibitions = [
  { id: 'e-1', slug: 'farben-im-park', title: 'Farben im Park', venue: 'Parkschlössl',
    city: 'Spittal an der Drau', start_date: '2026-07-28' },
  { id: 'e-2', slug: 'zweite', title: 'Zweite', venue: 'Parkschlössl',
    city: 'Spittal an der Drau', start_date: '2025-01-01' }
] as never[]

const junction = [
  { id: 1, exhibition_id: 'e-1', artist_id: 'a-1', sort: 0 },
  { id: 2, exhibition_id: 'e-2', artist_id: 'a-1', sort: 0 }
]

describe('buildArtistDirectory', () => {
  it('counts records from the junction, not from a stored field', () => {
    const [campidell] = buildArtistDirectory(artists, exhibitions, junction)
      .filter((entry) => entry.id === 'a-1')
    expect(campidell.record_count).toBe(2)
  })

  it('aggregates years from the linked exhibitions in order', () => {
    const [campidell] = buildArtistDirectory(artists, exhibitions, junction)
      .filter((entry) => entry.id === 'a-1')
    expect(campidell.years).toBe('2025 · 2026')
  })

  it('keeps an artist with no exhibitions, so the alphabet rail stays populated', () => {
    const entry = buildArtistDirectory(artists, exhibitions, junction)
      .find((candidate) => candidate.id === 'a-2')
    expect(entry?.record_count).toBe(0)
  })

  it('never invents an artist that has no record in artists.json', () => {
    const ghost = [{ id: 9, exhibition_id: 'e-1', artist_id: 'a-missing', sort: 0 }]
    const built = buildArtistDirectory(artists, exhibitions, [...junction, ...ghost])
    expect(built.some((entry) => entry.id === 'a-missing')).toBe(false)
  })
})
