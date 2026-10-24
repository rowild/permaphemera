import { describe, expect, it } from 'vitest'
import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'
import { SITE_URL, fitDescription, fitTitle, headFor, localizedPath, readSeo, recordSeoEntries, staticSeoEntries } from '../../shared/seo.mjs'

const messages = { de, en }
const assetBase = 'https://cms.test'
const SHARE = '?width=1200&height=630&fit=cover&format=jpg&quality=80'

const location = { id: 'loc', slug: 'klagenfurt', title: 'Klagenfurt am Wörthersee', postal_code: '9020', state: 'Carinthia', country: 'Austria', latitude: 46.6, longitude: 14.3, status: 'published', translations: [] }
const venue = {
  id: 'ven', slug: 'studiogalerie-klagenfurt', title: 'Studiogalerie im Stadthaus Klagenfurt', type: 'gallery', location: 'loc',
  address: 'Theaterplatz 3, 9020 Klagenfurt am Wörthersee, Austria', latitude: 46.627, longitude: 14.30408,
  image: `${assetBase}/assets/img-ven`, image_placeholder: false, hero_image: null, lede: 'Exhibition room.', seo: null, status: 'published',
  translations: [{ languages_code: 'en', lede: 'Exhibition room.' }, { languages_code: 'de', lede: 'Ausstellungsraum.' }]
}
const role = { id: 'r-artist', slug: 'artist', title: 'Artist', status: 'published', translations: [{ languages_code: 'en', title: 'Artist' }, { languages_code: 'de', title: 'Künstler:in' }] }
const minin = { id: 'p1', slug: 'alessandra-minin', first_name: 'Alessandra', last_name: 'Minin', display_name: null, image: null, lede: 'Painter.', seo: null, status: 'published', translations: [{ languages_code: 'en', lede: 'Painter.' }, { languages_code: 'de', lede: 'Malerin.' }] }
const nackler = { id: 'p2', slug: 'karl-nackler', first_name: 'Karl', last_name: 'Nackler', display_name: null, image: null, lede: 'Draughtsman.', seo: null, status: 'published', translations: [{ languages_code: 'en', lede: 'Draughtsman.' }] }
const exhibitionSeo = { title: 'Trigeniale 26 – Alps-Adriatic exhibition', meta_description: 'EN description', og_image: 'og-file', no_index: false }
const exhibition = {
  id: 'ex', slug: 'trigeniale-26', title: 'Trigeniale 26', primary_venue: 'ven', start_date: '2026-10-15', end_date: '2026-10-29',
  image: `${assetBase}/assets/img-ex`, image_placeholder: false, image_alt: 'Works', summary: 'Five artists.', admission: null,
  date_updated: '2026-10-24T10:00:00.000Z', seo: exhibitionSeo, status: 'published',
  translations: [
    { languages_code: 'en', title: 'Trigeniale 26', summary: 'Five artists.', seo: { title: exhibitionSeo.title, meta_description: exhibitionSeo.meta_description } },
    { languages_code: 'de', title: 'Trigeniale 26', summary: 'Fünf Kunstschaffende.', seo: { title: 'Trigeniale 26 – Alpen-Adria-Ausstellung', meta_description: 'DE Beschreibung' } }
  ]
}
const organisation = { id: 'org', slug: 'bewegung-in-kultur', title: 'bewegung / movimento / gibanje IN kultur', kind: 'initiative', location: 'loc', image: null, logo: null, lede: 'Cultural initiative.', seo: null, status: 'published', translations: [{ languages_code: 'en', lede: 'Cultural initiative.' }, { languages_code: 'de', lede: 'Kulturinitiative.' }] }

const archive = (overrides: Record<string, unknown[]> = {}) => ({
  locations: [location], venues: [venue], persons: [minin, nackler], roles: [role],
  personRoles: [{ persons_id: 'p1', roles_id: 'r-artist' }, { persons_id: 'p2', roles_id: 'r-artist' }],
  exhibitions: [exhibition],
  participations: [{ exhibition: 'ex', person: 'p1', role: 'r-artist', sort: 1 }, { exhibition: 'ex', person: 'p2', role: 'r-artist', sort: 2 }],
  organisations: [organisation], exhibitionOrganisers: [{ exhibition: 'ex', organisation: 'org', role: 'organiser', sort: 1 }],
  sponsors: [], websites: [], personsWebsites: [], organisationsWebsites: [], venuesWebsites: [],
  ...overrides
})
const entries = (overrides: Record<string, unknown[]> = {}) => recordSeoEntries(archive(overrides), { assetBase, messages })
const entry = (list: ReturnType<typeof entries>, path: string, locale: 'de' | 'en') => list.find((item) => item.path === path && item.locale === locale)!

describe('localizedPath', () => {
  it('keeps German unprefixed and puts English under /en', () => {
    expect(localizedPath('/exhibitions/trigeniale-26/', 'de')).toBe('/exhibitions/trigeniale-26/')
    expect(localizedPath('/exhibitions/trigeniale-26/', 'en')).toBe('/en/exhibitions/trigeniale-26/')
    expect(localizedPath('/', 'en')).toBe('/en/')
  })
})

describe('readSeo', () => {
  it('takes the text of the locale and the settings of the record', () => {
    const seo = readSeo({ ...exhibition, seo: { ...exhibitionSeo, no_index: true } }, 'de')
    expect(seo).toMatchObject({ title: 'Trigeniale 26 – Alpen-Adria-Ausstellung', description: 'DE Beschreibung', image: 'og-file', noIndex: true, noFollow: false })
  })
})

describe('fitTitle and fitDescription', () => {
  it('adds the site name only when it fits in 60 characters', () => {
    expect(fitTitle('Trigeniale 26')).toBe('Trigeniale 26 · PERMAPHEMERA')
    const long = 'Trigeniale 26 – Alessandra Minin & Karl Nackler · Studiogalerie'
    expect(fitTitle(long).length).toBeLessThanOrEqual(60)
    expect(fitTitle(long)).not.toContain('PERMAPHEMERA')
  })

  it('strips HTML and cuts at a word boundary within 160 characters', () => {
    const text = `<p>A <b>bold</b> start.</p>${' word'.repeat(60)}`
    const cut = fitDescription(text)
    expect(cut).not.toMatch(/[<>]/)
    expect(cut.length).toBeLessThanOrEqual(160)
    expect(cut.startsWith('A bold start. word')).toBe(true)
    expect(cut.endsWith('…')).toBe(true)
  })
})

describe('recordSeoEntries', () => {
  it('uses the stored German SEO text verbatim and the record share image', () => {
    const german = entry(entries(), '/exhibitions/trigeniale-26/', 'de')
    expect(german.title).toBe('Trigeniale 26 – Alpen-Adria-Ausstellung')
    expect(german.description).toBe('DE Beschreibung')
    expect(german.image).toBe(`${assetBase}/assets/og-file${SHARE}`)
    expect(german.noIndex).toBe(false)
  })

  it('applies the record noindex to both languages', () => {
    const list = entries({ exhibitions: [{ ...exhibition, seo: { ...exhibitionSeo, no_index: true } }] })
    expect(entry(list, '/exhibitions/trigeniale-26/', 'de').noIndex).toBe(true)
    expect(entry(list, '/exhibitions/trigeniale-26/', 'en').noIndex).toBe(true)
  })

  it('generates a title of at most 60 characters, but keeps a stored long one', () => {
    const generated = entry(entries({ exhibitions: [{ ...exhibition, seo: null, translations: exhibition.translations.map(({ seo, ...rest }) => rest) }] }), '/exhibitions/trigeniale-26/', 'en')
    expect(generated.title.startsWith('Trigeniale 26')).toBe(true)
    expect(generated.title.length).toBeLessThanOrEqual(60)
    const seventy = 'A'.repeat(70)
    const stored = entry(entries({ exhibitions: [{ ...exhibition, seo: { ...exhibitionSeo, title: seventy }, translations: [{ languages_code: 'en', title: 'Trigeniale 26', seo: { title: seventy } }] }] }), '/exhibitions/trigeniale-26/', 'en')
    expect(stored.title).toBe(seventy)
  })

  it('falls back to the record image as a share image', () => {
    const list = entries({ exhibitions: [{ ...exhibition, seo: { ...exhibitionSeo, og_image: null } }] })
    expect(entry(list, '/exhibitions/trigeniale-26/', 'en').image).toBe(`${assetBase}/assets/img-ex${SHARE}`)
  })

  it('leaves out an exhibition with a placeholder image or without a published venue', () => {
    const list = entries({ exhibitions: [{ ...exhibition, slug: 'placeholder', image_placeholder: true }, { ...exhibition, slug: 'no-venue', primary_venue: 'missing' }] })
    expect(list.some((item) => item.path.startsWith('/exhibitions/'))).toBe(false)
  })

  it('gives a person without a German translation a German entry with the English text', () => {
    expect(entry(entries(), '/persons/karl-nackler/', 'de').description).toBe('Draughtsman.')
  })

  it('links canonical and the language alternates', () => {
    const english = entry(entries(), '/venues/studiogalerie-klagenfurt/', 'en')
    expect(english.canonical).toBe(`${SITE_URL}/en/venues/studiogalerie-klagenfurt/`)
    expect(english.alternates).toEqual({
      de: `${SITE_URL}/venues/studiogalerie-klagenfurt/`,
      en: `${SITE_URL}/en/venues/studiogalerie-klagenfurt/`,
      'x-default': `${SITE_URL}/venues/studiogalerie-klagenfurt/`
    })
  })

  it('describes an exhibition as an ExhibitionEvent with gallery, organiser and breadcrumbs', () => {
    const [event, breadcrumbs] = entry(entries(), '/exhibitions/trigeniale-26/', 'de').jsonLd as Record<string, any>[]
    expect(event).toMatchObject({ '@type': 'ExhibitionEvent', name: 'Trigeniale 26', startDate: '2026-10-15', endDate: '2026-10-29' })
    expect(event.location).toMatchObject({ '@type': 'ArtGallery', name: 'Studiogalerie im Stadthaus Klagenfurt', address: { addressLocality: 'Klagenfurt am Wörthersee', postalCode: '9020' } })
    expect(event.organizer[0]).toMatchObject({ '@type': 'Organization', name: 'bewegung / movimento / gibanje IN kultur' })
    expect(event.performer.map((person: { name: string }) => person.name)).toEqual(['Alessandra Minin', 'Karl Nackler'])
    expect(breadcrumbs['@type']).toBe('BreadcrumbList')
  })
})

describe('headFor', () => {
  it('emits Open Graph, Twitter, canonical, alternates and robots only when set', () => {
    const german = entry(entries(), '/exhibitions/trigeniale-26/', 'de')
    const head = headFor(german)
    const meta = Object.fromEntries(head.meta.map((tag) => [tag.name ?? tag.property, tag.content]))
    expect(head.title).toBe('Trigeniale 26 – Alpen-Adria-Ausstellung')
    expect(meta).toMatchObject({ description: 'DE Beschreibung', 'og:title': head.title, 'og:locale': 'de_AT', 'og:type': 'article', 'twitter:card': 'summary_large_image', 'og:url': german.canonical })
    expect(meta.robots).toBeUndefined()
    expect(head.link.filter((link) => link.rel === 'alternate').map((link) => link.hreflang)).toEqual(['de', 'en', 'x-default'])
    expect(head.link.find((link) => link.rel === 'canonical')?.href).toBe(german.canonical)
    const hidden = headFor({ ...german, noIndex: true, noFollow: true })
    expect(hidden.meta.find((tag) => tag.name === 'robots')?.content).toBe('noindex, nofollow')
  })
})

describe('staticSeoEntries', () => {
  it('reads the page texts from the locale files and fills in counts', () => {
    const list = staticSeoEntries(messages, { venues: 13, organisations: 10 })
    const venues = list.find((item) => item.path === '/venues/' && item.locale === 'de')!
    expect(venues.description).toContain('13')
    expect(venues.description).not.toContain('{count}')
    expect(list.find((item) => item.path === '/exhibitions/current/' && item.locale === 'en')!.title).toContain('Current')
    expect(list.filter((item) => item.locale === 'de').map((item) => item.path)).toEqual([
      '/', '/exhibitions/', '/exhibitions/current/', '/exhibitions/upcoming/', '/exhibitions/past/', '/artists/', '/venues/', '/organisations/',
      '/about/', '/how-it-works/', '/contact/', '/imprint/', '/privacy/', '/terms/', '/accessibility/'
    ])
  })
})
