import { describe, expect, it } from 'vitest'
import { resolveVenues } from '~/utils/resolveVenues'

const locations = [{
  id: 'location-graz', slug: 'graz', title: 'Graz', postal_code: '8010',
  state: 'Styria', country: 'Austria', latitude: 47.0707, longitude: 15.4395,
  description: null, status: 'published' as const, translations: [{ languages_code: 'en', description: '' }]
}]

const venue = {
  id: 'venue-neue-galerie-graz', slug: 'neue-galerie-graz', location: 'location-graz', part_of: null,
  title: 'Neue Galerie Graz', type: 'museum' as const, address: 'Joanneumsviertel',
  website_url: null, latitude: null, longitude: null,
  image: '/i.webp', image_alt: 'alt', hero_image: null, hero_image_alt: null,
  archive_number: '03', featured: false,
  description: 'English text', lede: null, about: null, image_caption: null, coordinate_label: null,
  status: 'published' as const,
  translations: [{ languages_code: 'en', description: 'English text' }]
}

describe('resolveVenues', () => {
  it('inlines the city from the linked location', () => {
    expect(resolveVenues(locations, [venue], 'en')[0].city).toBe('Graz')
  })

  it('links a space to its parent venue and lists the spaces on the parent', () => {
    const space = { ...venue, id: 'venue-space', slug: 'space', title: 'Space', part_of: 'venue-neue-galerie-graz' }
    const [parent, child] = resolveVenues(locations, [venue, space], 'en')
    expect(child.part_of).toEqual({ slug: 'neue-galerie-graz', name: 'Neue Galerie Graz' })
    expect(parent.spaces).toEqual([{ slug: 'space', name: 'Space' }])
    expect(parent.part_of).toBeUndefined()
    expect(child.spaces).toEqual([])
  })

  it('exposes the city centroid separately from the venue pin', () => {
    const resolved = resolveVenues(locations, [venue], 'en')[0]
    expect(resolved.city_latitude).toBe(47.0707)
    expect(resolved.latitude).toBeUndefined()
  })

  it('keeps draft venues, because they must still render', () => {
    expect(resolveVenues(locations, [venue], 'en')).toHaveLength(1)
  })

  it('maps title to the component-facing name', () => {
    expect(resolveVenues(locations, [venue], 'en')[0].name).toBe('Neue Galerie Graz')
  })

  it('drops a venue whose town is missing or not published', () => {
    const orphan = { ...venue, location: 'location-nowhere' }
    expect(resolveVenues(locations, [orphan], 'en')).toEqual([])
    const draftTown = locations.map((location) => ({ ...location, status: 'draft' as const }))
    expect(resolveVenues(draftTown, [venue], 'en')).toEqual([])
  })

  it('carries the dossier fields through resolution', () => {
    const dossierVenue = {
      ...venue,
      hero_image: '/media/images/landing/parkschloessl.jpg',
      hero_image_alt: 'Front façade of the striped ochre and rose Parkschlössl beneath mature trees',
      lede: 'A small exhibition house in the park.',
      about: ['First paragraph.', 'Second paragraph.'],
      translations: [{
        languages_code: 'en',
        description: 'English text',
        lede: 'A small exhibition house in the park.',
        about: ['First paragraph.', 'Second paragraph.']
      }]
    }
    const resolved = resolveVenues(locations, [dossierVenue], 'en')[0]
    expect(resolved.hero_image).toBe('/media/images/landing/parkschloessl.jpg')
    expect(resolved.hero_image_alt).toBe('Front façade of the striped ochre and rose Parkschlössl beneath mature trees')
    expect(resolved.lede).toBe('A small exhibition house in the park.')
    expect(resolved.about).toEqual(['First paragraph.', 'Second paragraph.'])
  })

  describe('links', () => {
    const site = (id: string, url: string, kind: string, title: string, status = 'published' as const) =>
      ({ id, url, kind, title, status, sort: 0, translations: [] })
    const websites = [
      site('w-insta', 'https://www.instagram.com/gallery/', 'social', 'Instagram'),
      site('w-fb', 'https://www.facebook.com/gallery/', 'social', 'Facebook'),
      site('w-x', 'https://x.com/gallery', 'social', 'X'),
      site('w-draft', 'https://draft.example/', 'social', 'Draft', 'draft' as never)
    ]
    const rows = [
      { id: 1, venues_id: 'venue-neue-galerie-graz', websites_id: 'w-fb', sort: 2 },
      { id: 2, venues_id: 'venue-neue-galerie-graz', websites_id: 'w-insta', sort: 1 },
      { id: 3, venues_id: 'venue-neue-galerie-graz', websites_id: 'w-x', sort: 3 },
      { id: 4, venues_id: 'venue-neue-galerie-graz', websites_id: 'w-draft', sort: 0 }
    ]
    const linksOf = (record = venue) => resolveVenues(locations, [record], 'en', [], [], websites, rows)[0].links

    it('puts the own website first, then at most two further links in their order', () => {
      const links = linksOf({ ...venue, website_url: 'https://www.museum-joanneum.at/' } as never)
      expect(links.map((link) => link.url)).toEqual([
        'https://www.museum-joanneum.at/', 'https://www.instagram.com/gallery/', 'https://www.facebook.com/gallery/'
      ])
      expect(links[0].kind).toBe('website')
    })

    it('shows up to three social links when the venue has no website of its own', () => {
      expect(linksOf().map((link) => link.title)).toEqual(['Instagram', 'Facebook', 'X'])
    })

    it('drops unpublished links', () => {
      expect(linksOf().some((link) => link.title === 'Draft')).toBe(false)
    })

    it('has no links when nothing is given', () => {
      expect(resolveVenues(locations, [venue], 'en')[0].links).toEqual([])
    })
  })
})
