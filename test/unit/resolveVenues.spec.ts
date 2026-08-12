import { describe, expect, it } from 'vitest'
import { resolveVenues } from '~/utils/resolveVenues'

const locations = [{
  id: 'location-graz', slug: 'graz', city_name: 'Graz', postal_code: '8010',
  state: 'Styria', country: 'Austria', latitude: 47.0707, longitude: 15.4395,
  status: 'published' as const, translations: [{ languages_code: 'en', description: '' }]
}]

const venue = {
  id: 'venue-neue-galerie-graz', slug: 'neue-galerie-graz', location_id: 'location-graz',
  name: 'Neue Galerie Graz', type: 'museum' as const, address: 'Joanneumsviertel',
  image: '/i.webp', image_alt: 'alt', archive_number: '03', featured: false,
  status: 'draft' as const,
  translations: [{ languages_code: 'en', description: 'English text' }]
}

describe('resolveVenues', () => {
  it('inlines the city from the linked location', () => {
    expect(resolveVenues(locations, [venue], 'en')[0].city).toBe('Graz')
  })

  it('exposes the city centroid separately from the venue pin', () => {
    const resolved = resolveVenues(locations, [venue], 'en')[0]
    expect(resolved.city_latitude).toBe(47.0707)
    expect(resolved.latitude).toBeUndefined()
  })

  it('keeps draft venues, because they must still render', () => {
    expect(resolveVenues(locations, [venue], 'en')).toHaveLength(1)
  })

  it('throws with the offending id when location_id does not resolve', () => {
    const orphan = { ...venue, location_id: 'location-nowhere' }
    expect(() => resolveVenues(locations, [orphan], 'en'))
      .toThrow(/venue-neue-galerie-graz references unknown location location-nowhere/)
  })

  it('carries the dossier fields through resolution', () => {
    const dossierVenue = {
      ...venue,
      hero_image: '/images/landing/parkschloessl.jpg',
      hero_image_alt: 'Front façade of the striped ochre and rose Parkschlössl beneath mature trees',
      translations: [{
        languages_code: 'en',
        description: 'English text',
        lede: 'A small exhibition house in the park.',
        about: ['First paragraph.', 'Second paragraph.']
      }]
    }
    const resolved = resolveVenues(locations, [dossierVenue], 'en')[0]
    expect(resolved.hero_image).toBe('/images/landing/parkschloessl.jpg')
    expect(resolved.hero_image_alt).toBe('Front façade of the striped ochre and rose Parkschlössl beneath mature trees')
    expect(resolved.lede).toBe('A small exhibition house in the park.')
    expect(resolved.about).toEqual(['First paragraph.', 'Second paragraph.'])
  })
})
