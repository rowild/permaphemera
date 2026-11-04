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
  description: 'English text', lede: null, about_html: null, image_caption: null, coordinate_label: null,
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

  it('says whether a venue has a real image: not missing and not a placeholder file', () => {
    const [real, placeholder, none] = resolveVenues(locations, [
      venue,
      { ...venue, id: 'v-p', slug: 'p', image: '/assets/placeholder', image_placeholder: true },
      { ...venue, id: 'v-n', slug: 'n', image: null }
    ] as never, 'en')
    expect([real.has_image, placeholder.has_image, none.has_image]).toEqual([true, false, false])
  })

  it('takes the picture texts of the page language, else the English ones of the record', () => {
    const texts = {
      ...venue, image_alt: 'Street view', hero_image: '/h.webp', hero_image_alt: 'Hall view',
      translations: [{ languages_code: 'en', description: 'English text', image_alt: 'Street view', hero_image_alt: 'Hall view' }, { languages_code: 'de', image_alt: 'Straßenansicht', hero_image_alt: 'Blick in den Saal' }]
    }
    expect(resolveVenues(locations, [texts], 'de')[0]).toMatchObject({ image_alt: 'Straßenansicht', hero_image_alt: 'Blick in den Saal' })
    expect(resolveVenues(locations, [{ ...texts, translations: texts.translations.slice(0, 1) }], 'de')[0]).toMatchObject({ image_alt: 'Street view', hero_image_alt: 'Hall view' })
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
      about_html: '<p>First paragraph.</p><p>Second paragraph.</p>',
      translations: [{
        languages_code: 'en',
        description: 'English text',
        lede: 'A small exhibition house in the park.',
        about_html: '<p class="x">First paragraph.</p><p>Second paragraph.</p>'
      }]
    }
    const resolved = resolveVenues(locations, [dossierVenue], 'en')[0]
    expect(resolved.hero_image).toBe('/media/images/landing/parkschloessl.jpg')
    expect(resolved.hero_image_alt).toBe('Front façade of the striped ochre and rose Parkschlössl beneath mature trees')
    expect(resolved.lede).toBe('A small exhibition house in the park.')
    expect(resolved.aboutHtml).toBe('<p>First paragraph.</p><p>Second paragraph.</p>')
  })

  // Owner, 2026-11-04: the gallery page names its curator and its head, like "Betrieben von".
  describe('persons', () => {
    const person = (id: string, slug: string, first_name: string, last_name: string, status = 'published') =>
      ({ id, slug, first_name, last_name, middle_initial: null, status }) as never
    const persons = [
      person('p-kroen', 'severin-kroen', 'Séverin', 'Krön'),
      person('p-bauer', 'margaretha-bauer', 'Margaretha', 'Bauer'),
      person('p-asaad', 'eva-asaad', 'Eva', 'Asaad'),
      person('p-draft', 'draft-person', 'Draft', 'Person', 'draft')
    ]
    const rows = [
      { id: 1, persons_id: 'p-bauer', venues_id: 'venue-neue-galerie-graz', sort: 2, relation: 'head' },
      { id: 2, persons_id: 'p-kroen', venues_id: 'venue-neue-galerie-graz', sort: 1, relation: 'curator' },
      { id: 3, persons_id: 'p-asaad', venues_id: 'venue-neue-galerie-graz', sort: 3, relation: null },
      { id: 4, persons_id: 'p-draft', venues_id: 'venue-neue-galerie-graz', sort: 4, relation: 'curator' }
    ] as never[]
    const personsOf = () => resolveVenues(locations, [venue], 'en', [], [], [], [], persons, rows)[0].persons

    it('lists the curator and the head with their names and pages, in the link order', () => {
      expect(personsOf()).toEqual([
        { slug: 'severin-kroen', name: 'Séverin Krön', relation: 'curator' },
        { slug: 'margaretha-bauer', name: 'Margaretha Bauer', relation: 'head' }
      ])
    })

    it('leaves out a link without a relation (another tie) and a person who is not published', () => {
      expect(personsOf().map((entry) => entry.slug)).not.toContain('eva-asaad')
      expect(personsOf().map((entry) => entry.slug)).not.toContain('draft-person')
    })

    it('has no persons when nothing is given', () => {
      expect(resolveVenues(locations, [venue], 'en')[0].persons).toEqual([])
    })
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
