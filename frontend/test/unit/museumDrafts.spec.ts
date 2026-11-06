import { describe, expect, it } from 'vitest'
import { MUSEUMS_RELEASED, museumLeaks } from '../../shared/museum-drafts.mjs'

// Owner rule, 2026-11-06: a museum, its exhibitions and the persons who appear only there stay
// draft until the owner releases that museum by name.
const museum = { id: 'v-museum', slug: 'museum-der-stadt-villach', type: 'museum', status: 'draft' }
const gallery = { id: 'v-gallery', slug: 'galerie-x', type: 'gallery', status: 'published' }

const base = {
  venues: [museum, gallery],
  exhibitions: [
    { id: 'e-museum', slug: 'wie-kriege-enden', status: 'draft', primary_venue: 'v-museum' },
    { id: 'e-gallery', slug: 'bilder', status: 'published', primary_venue: 'v-gallery' }
  ],
  persons: [
    { id: 'p-head', slug: 'andreas-kuchler', status: 'draft' },
    { id: 'p-both', slug: 'artist-both', status: 'published' },
    { id: 'p-free', slug: 'no-links', status: 'published' }
  ],
  personsVenues: [{ persons_id: 'p-head', venues_id: 'v-museum' }],
  participations: [
    { exhibition: 'e-museum', person: 'p-both' },
    { exhibition: 'e-gallery', person: 'p-both' }
  ]
}

describe('museumLeaks', () => {
  it('starts with no museum released', () => {
    expect(MUSEUMS_RELEASED).toEqual([])
  })

  it('passes while every museum record is a draft', () => {
    expect(museumLeaks(base)).toEqual([])
  })

  it('names a published museum venue', () => {
    const venues = [{ ...museum, status: 'published' }, gallery]
    expect(museumLeaks({ ...base, venues })).toEqual(['venue museum-der-stadt-villach'])
  })

  it('names a published exhibition at a museum', () => {
    const exhibitions = base.exhibitions.map((e) => (e.id === 'e-museum' ? { ...e, status: 'published' } : e))
    expect(museumLeaks({ ...base, exhibitions })).toEqual(['exhibition wie-kriege-enden'])
  })

  it('names a published person linked only to a museum, not one also shown at a gallery', () => {
    const persons = base.persons.map((p) => ({ ...p, status: 'published' }))
    expect(museumLeaks({ ...base, persons })).toEqual(['person andreas-kuchler'])
  })

  it('lets a released museum and its records go live', () => {
    const venues = [{ ...museum, status: 'published' }, gallery]
    const exhibitions = base.exhibitions.map((e) => ({ ...e, status: 'published' }))
    const persons = base.persons.map((p) => ({ ...p, status: 'published' }))
    expect(museumLeaks({ ...base, venues, exhibitions, persons, released: ['museum-der-stadt-villach'] })).toEqual([])
  })
})
