import { describe, expect, it } from 'vitest'
import { buildArtistDirectory } from '~/utils/artistDirectory'

const person = (id: string, first: string, last: string) => ({
  id, slug: `${first}-${last}`.toLowerCase(), first_name: first, last_name: last,
  middle_initial: null, display_name: null, website_url: null, status: 'published' as const
})

const persons = [person('a-1', 'Sylvia', 'Campidell'), person('a-2', 'Nobody', 'Unshown'), person('c-1', 'Only', 'Curator')]
const roles = [
  { id: 'role-artist', slug: 'artist', title: 'Artist', status: 'published' as const, sort: 1, translations: [] },
  { id: 'role-curator', slug: 'curator', title: 'Curator', status: 'published' as const, sort: 2, translations: [] }
]
const personRoles = [
  { id: 1, persons_id: 'a-1', roles_id: 'role-artist', sort: 0 },
  { id: 2, persons_id: 'a-2', roles_id: 'role-artist', sort: 0 },
  { id: 3, persons_id: 'c-1', roles_id: 'role-curator', sort: 0 }
]

const exhibitions = [
  { id: 'e-1', slug: 'farben-im-park', title: 'Farben im Park', venue: 'Parkschlössl',
    city: 'Spittal an der Drau', start_date: '2026-07-28' },
  { id: 'e-2', slug: 'zweite', title: 'Zweite', venue: 'Parkschlössl',
    city: 'Spittal an der Drau', start_date: '2025-01-01' }
] as never[]

const participations = [
  { id: 'p-1', exhibition: 'e-1', person: 'a-1', role: 'role-artist', sort: 0, status: 'published' as const },
  { id: 'p-2', exhibition: 'e-2', person: 'a-1', role: 'role-artist', sort: 0, status: 'published' as const },
  { id: 'p-3', exhibition: 'e-1', person: 'c-1', role: 'role-curator', sort: 0, status: 'published' as const }
]

const build = (rows = participations) => buildArtistDirectory(persons, exhibitions, rows, personRoles, roles)

describe('buildArtistDirectory', () => {
  it('counts records from artist participations, not from a stored field', () => {
    expect(build().find((entry) => entry.id === 'a-1')?.record_count).toBe(2)
  })

  it('aggregates years from the linked exhibitions in order', () => {
    expect(build().find((entry) => entry.id === 'a-1')?.years).toBe('2025 · 2026')
  })

  it('keeps an artist with no exhibitions, so the alphabet rail stays populated', () => {
    expect(build().find((entry) => entry.id === 'a-2')?.record_count).toBe(0)
  })

  it('leaves out a person who holds no artist role, even when they participate', () => {
    expect(build().some((entry) => entry.id === 'c-1')).toBe(false)
  })

  it('never invents a person that has no record in pp_persons.json', () => {
    const ghost = [{ id: 'p-9', exhibition: 'e-1', person: 'a-missing', role: 'role-artist', sort: 0, status: 'published' as const }]
    expect(build([...participations, ...ghost]).some((entry) => entry.id === 'a-missing')).toBe(false)
  })
})
