import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveVenues } from '~/utils/resolveVenues'
import { DEFAULT_SHARE_IMAGE, SITE_NAME, SITE_URL, fitDescription, fitTitle, headFor, localizedPath, pageSeoEntry, readSeo, recordSeoEntries, removeSnapshotTags, staleTourWording, staticSeoEntries } from '../../shared/seo.mjs'

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

describe('messages as a translate function (the running site precompiles its locale files)', () => {
  it('reads every text through the function and passes the count', () => {
    const calls: [string, string, Record<string, unknown> | undefined][] = []
    const translate = (locale: string, key: string, params?: Record<string, unknown>) => {
      calls.push([locale, key, params])
      return key === 'galleries.seoDescription' ? `${params?.count} galleries` : key === 'galleries.seoTitle' ? 'Galleries · PERMAPHEMERA' : undefined
    }
    const venues = staticSeoEntries(translate, { venues: 13 }).find((item) => item.path === '/venues/' && item.locale === 'en')!
    expect(venues.title).toBe('Galleries · PERMAPHEMERA')
    expect(venues.description).toBe('13 galleries')
    expect(calls.some(([locale, key, params]) => locale === 'en' && key === 'galleries.seoDescription' && params?.count === 13)).toBe(true)
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

describe('pages: the SEO module and the site agree', () => {
  // The site decides in its resolvers which exhibitions and galleries have a page; the SEO module
  // repeats that rule for the snapshots. A snapshot for a page the site 404s would be a soft 404.
  it('gives an entry to exactly the exhibitions and galleries the site resolves', () => {
    const venues = [venue, { ...venue, id: 'v-draft', slug: 'draft-gallery', status: 'draft' }, { ...venue, id: 'v-no-town', slug: 'no-town', location: 'gone' }]
    const exhibitions = [
      exhibition,
      { ...exhibition, id: 'e-placeholder', slug: 'placeholder', image_placeholder: true },
      { ...exhibition, id: 'e-no-image', slug: 'no-image', image: null },
      { ...exhibition, id: 'e-draft', slug: 'draft-exhibition', status: 'draft' },
      { ...exhibition, id: 'e-draft-venue', slug: 'at-draft-gallery', primary_venue: 'v-draft' },
      { ...exhibition, id: 'e-no-town', slug: 'at-gallery-without-town', primary_venue: 'v-no-town' }
    ]
    const english = entries({ venues, exhibitions }).filter((item) => item.locale === 'en')
    const seoPaths = (prefix: string) => english.filter((item) => item.path.startsWith(prefix)).map((item) => item.path).sort()
    const siteExhibitions = resolveExhibitions(exhibitions as never, venues as never, [location] as never, [], [], [role] as never, 'en').map((item) => `/exhibitions/${item.slug}/`).sort()
    const siteVenues = resolveVenues([location] as never, venues as never, 'en').map((item) => `/venues/${item.slug}/`).sort()
    expect(seoPaths('/exhibitions/')).toEqual(siteExhibitions)
    expect(seoPaths('/venues/')).toEqual(siteVenues)
    expect(siteExhibitions).toEqual(['/exhibitions/trigeniale-26/'])
  })
})

describe('one page at a time', () => {
  it('builds only the entries of the requested path, without touching the other records', () => {
    let reads = 0
    const counted = { ...minin, get lede () { reads += 1; return 'Painter.' } }
    const only = recordSeoEntries(archive({ persons: [counted, nackler] }), { assetBase, messages, path: '/persons/karl-nackler/' })
    expect(only.map((item) => `${item.locale} ${item.path}`)).toEqual(['de /persons/karl-nackler/', 'en /persons/karl-nackler/'])
    expect(reads).toBe(0)
  })
})

// A record as a new editor entry leaves it: no SEO text and none of the given text fields.
const bare = <T extends { translations: object[] }>(record: T, fields: string[]) => {
  const keep = (item: object) => Object.fromEntries(Object.entries(item).filter(([key]) => !fields.includes(key) && key !== 'seo'))
  return { ...keep(record), seo: null, translations: record.translations.map(keep) } as unknown as T
}

describe('descriptions are never empty', () => {
  it('builds an exhibition description from title, artists, dates, gallery and town', () => {
    const list = entries({ exhibitions: [bare(exhibition, ['summary', 'description'])] })
    const german = entry(list, '/exhibitions/trigeniale-26/', 'de').description
    expect(german).toContain('Ausstellung „Trigeniale 26“ mit Alessandra Minin & Karl Nackler, ')
    expect(german).toContain('Oktober 2026, Studiogalerie im Stadthaus Klagenfurt, Klagenfurt am Wörthersee.')
    const english = entry(list, '/exhibitions/trigeniale-26/', 'en').description
    expect(english).toContain('Exhibition “Trigeniale 26” with Alessandra Minin & Karl Nackler, ')
    expect(english).toContain('October 2026, Studiogalerie im Stadthaus Klagenfurt, Klagenfurt am Wörthersee.')
  })

  it('takes the date range the editors wrote and leaves out the artists when there are none', () => {
    const written = { ...bare(exhibition, ['summary', 'description']), date_range: '15–29 Oct 2026' }
    written.translations = [{ languages_code: 'en', title: 'Trigeniale 26', date_range: '15–29 Oct 2026' }, { languages_code: 'de', title: 'Trigeniale 26', date_range: '15.–29.10.2026' }] as never
    const list = entries({ exhibitions: [written], participations: [] })
    expect(entry(list, '/exhibitions/trigeniale-26/', 'de').description).toBe('Ausstellung „Trigeniale 26“, 15.–29.10.2026, Studiogalerie im Stadthaus Klagenfurt, Klagenfurt am Wörthersee.')
    expect(entry(list, '/exhibitions/trigeniale-26/', 'en').description).toBe('Exhibition “Trigeniale 26”, 15–29 Oct 2026, Studiogalerie im Stadthaus Klagenfurt, Klagenfurt am Wörthersee.')
  })

  it('describes a gallery and an organisation without any text by name and town', () => {
    const list = entries({ venues: [bare(venue, ['lede'])], organisations: [bare(organisation, ['lede'])] })
    expect(entry(list, '/venues/studiogalerie-klagenfurt/', 'de').description).toContain('Studiogalerie im Stadthaus Klagenfurt, Klagenfurt am Wörthersee: Adresse')
    expect(entry(list, '/organisations/bewegung-in-kultur/', 'en').description).toContain('bewegung / movimento / gibanje IN kultur in the PERMAPHEMERA archive')
  })

  it('gives every page of an archive without texts a description without placeholders', () => {
    const list = entries({
      exhibitions: [bare(exhibition, ['summary', 'description'])], venues: [bare(venue, ['lede'])],
      persons: [bare(minin, ['lede']), bare(nackler, ['lede'])], organisations: [bare(organisation, ['lede'])]
    })
    expect(list.length).toBeGreaterThan(0)
    for (const item of list) {
      expect(item.description, `${item.locale} ${item.path}`).not.toBe('')
      expect(item.description, `${item.locale} ${item.path}`).not.toMatch(/[{}]/)
    }
  })
})

describe('share image text', () => {
  it('names the site when the page uses the default share image', () => {
    const english = entry(entries(), '/organisations/bewegung-in-kultur/', 'en')
    expect(english.image).toBe(DEFAULT_SHARE_IMAGE)
    expect(english.imageAlt).toBe(SITE_NAME)
    expect(entry(entries(), '/persons/karl-nackler/', 'de').imageAlt).toBe(SITE_NAME)
  })

  it('uses the page title for a chosen SEO share image, which the record image text does not describe', () => {
    expect(entry(entries(), '/exhibitions/trigeniale-26/', 'de').imageAlt).toBe('Trigeniale 26 – Alpen-Adria-Ausstellung')
  })

  it('keeps the image text of the record image', () => {
    const list = entries({ exhibitions: [{ ...exhibition, seo: { ...exhibitionSeo, og_image: null } }] })
    expect(entry(list, '/exhibitions/trigeniale-26/', 'en').imageAlt).toBe('Works')
  })
})

describe('share images that link previews can show', () => {
  it('never shares an SVG logo and falls back to the site image', () => {
    const svg = { ...organisation, logo: `${assetBase}/assets/logo-svg`, logo_type: 'image/svg+xml' }
    expect(entry(entries({ organisations: [svg] }), '/organisations/bewegung-in-kultur/', 'en').image).toBe(DEFAULT_SHARE_IMAGE)
  })

  it('shares a PNG logo', () => {
    const png = { ...organisation, logo: `${assetBase}/assets/logo-png`, logo_type: 'image/png' }
    expect(entry(entries({ organisations: [png] }), '/organisations/bewegung-in-kultur/', 'en').image).toBe(`${assetBase}/assets/logo-png${SHARE}`)
  })
})

describe('plain text keeps its characters', () => {
  it('keeps a gender star and an underscore in a generated title', () => {
    const star = { ...nackler, display_name: 'Kollektiv Künstler*innen_Kärnten' }
    expect(entry(entries({ persons: [minin, star] }), '/persons/karl-nackler/', 'de').title).toContain('Kollektiv Künstler*innen_Kärnten')
  })

  it('keeps a gender star, a hash and a lone angle bracket in a description but strips Markdown and HTML', () => {
    expect(fitDescription('Ein Treffen für **alle** Künstler*innen in Halle #3. <b>Eintritt</b> frei.')).toBe('Ein Treffen für alle Künstler*innen in Halle #3. Eintritt frei.')
    expect(fitDescription('# Titel\n> Zitat: a < b und c > d, _kursiv_ und [Link](https://x.test).')).toBe('Titel Zitat: a < b und c > d, kursiv und Link.')
  })
})

describe('pageSeoEntry (what usePageSeo puts into the head)', () => {
  const site = archive({ venues: [venue, { ...venue, id: 'v-draft', slug: 'draft', status: 'draft' }] })
  const page = (path: string, ready = true) => pageSeoEntry(site, { path, locale: 'en', messages, assetBase, ready })

  it('serves a fixed page from the locale files, counting published records, also before the archive is ready', () => {
    const expected = staticSeoEntries(messages, { venues: 1, organisations: 1 }).find((item) => item.path === '/venues/' && item.locale === 'en')
    expect(page('/venues/', false)).toEqual(expected)
  })

  it('serves a record page once the archive is ready', () => {
    expect(page('/exhibitions/trigeniale-26/')?.title).toBe('Trigeniale 26 – Alps-Adriatic exhibition')
    expect(page('/exhibitions/trigeniale-26/', false)).toBeUndefined()
  })

  it('returns nothing for a page without an entry', () => {
    expect(page('/exhibitions/gone/')).toBeUndefined()
  })
})

describe('removeSnapshotTags (the running app takes over the head)', () => {
  it('removes exactly the tags the deploy marked', () => {
    const removed: string[] = []
    const tag = (name: string) => ({ remove: () => removed.push(name) })
    const root = { querySelectorAll: (selector: string) => (selector === '[data-seo-snapshot]' ? [tag('title'), tag('description')] : [tag('charset')]) }
    removeSnapshotTags(root)
    expect(removed).toEqual(['title', 'description'])
  })
})

describe('staleTourWording (the SEO text still talks about a tour that is not in that state)', () => {
  const said = (meta: string, extra: Record<string, unknown> = {}) => ({
    ...exhibition, tour: null, tour_status: 'available', tour_available_from: '2026-10-29',
    seo: { ...exhibitionSeo, meta_description: meta }, translations: [{ languages_code: 'de', seo: { meta_description: meta } }], ...extra
  })

  it('accepts "tour from" before that day and "in preparation" while there is no tour', () => {
    expect(staleTourWording(said('360° tour from 29 October.'), '2026-10-24')).toBe(false)
    expect(staleTourWording(said('360°-Rundgang in Vorbereitung.', { tour_available_from: null }), '2026-10-24')).toBe(false)
    expect(staleTourWording(said('Five artists.'), '2026-10-30')).toBe(false)
  })

  it('reports "in preparation" once the tour is open', () => {
    expect(staleTourWording(said('360°-Rundgang in Vorbereitung.', { tour: '/media/tours/x/' }), '2026-10-30')).toBe(true)
  })

  it('reports "tour from" once that day has passed', () => {
    expect(staleTourWording(said('360° tour from 29 October.'), '2026-10-30')).toBe(true)
  })

  it('reports any promised tour when there will be none', () => {
    expect(staleTourWording(said('360° tour in preparation.', { tour_status: 'restricted' }), '2026-10-24')).toBe(true)
  })
})

describe('review fixes', () => {
  it('uses no lookbehind, which Safari before 16.4 cannot parse', () => {
    const source = readFileSync(new URL('../../shared/seo.mjs', import.meta.url), 'utf8')
    expect(source).not.toMatch(/\(\?<[!=]/)
  })

  it('drops HTML comments and keeps a # without a following space', () => {
    expect(fitDescription('<!-- note --><!--[if gte mso 9]><xml></xml><![endif]--><p>Text</p>')).toBe('Text')
    expect(fitDescription('#3 der Reihe')).toBe('#3 der Reihe')
    expect(fitDescription('<p>#kunst ist</p>')).toBe('#kunst ist')
    expect(fitDescription('## Titel\nText')).toBe('Titel Text')
  })

  it('describes the shared gallery photo with its own image text', () => {
    const hero = { ...venue, hero_image: `${assetBase}/assets/img-hero`, hero_image_placeholder: false, hero_image_alt: 'Hero view', image_alt: 'Street view' }
    const english = entry(entries({ venues: [hero] }), '/venues/studiogalerie-klagenfurt/', 'en')
    expect(english.image).toBe(`${assetBase}/assets/img-hero${SHARE}`)
    expect(english.imageAlt).toBe('Hero view')
    const plain = entry(entries({ venues: [{ ...venue, image_alt: 'Street view' }] }), '/venues/studiogalerie-klagenfurt/', 'en')
    expect(plain.imageAlt).toBe('Street view')
  })

  it('describes the shared gallery photo in the page language', () => {
    const german = { ...venue, image_alt: 'Street view', translations: [...venue.translations.map((item) => (item.languages_code === 'de' ? { ...item, image_alt: 'Straßenansicht' } : { ...item, image_alt: 'Street view' }))] }
    expect(entry(entries({ venues: [german] }), '/venues/studiogalerie-klagenfurt/', 'de').imageAlt).toBe('Straßenansicht')
    expect(entry(entries({ venues: [german] }), '/venues/studiogalerie-klagenfurt/', 'en').imageAlt).toBe('Street view')
  })

  it('describes a shared organisation logo with the logo text', () => {
    const logo = { ...organisation, logo: `${assetBase}/assets/logo-png`, logo_type: 'image/png', logo_alt: 'Logo text', image_alt: 'Photo text' }
    expect(entry(entries({ organisations: [logo] }), '/organisations/bewegung-in-kultur/', 'en').imageAlt).toBe('Logo text')
  })

  it('calls an event an event', () => {
    const event = { ...bare(exhibition, ['summary', 'description']), kind: 'event' }
    const list = entries({ exhibitions: [event] })
    expect(entry(list, '/exhibitions/trigeniale-26/', 'de').description).toContain('Veranstaltung „Trigeniale 26“ mit ')
    expect(entry(list, '/exhibitions/trigeniale-26/', 'en').description).toContain('Event “Trigeniale 26” with ')
    expect((entry(list, '/exhibitions/trigeniale-26/', 'en').jsonLd[0] as { '@type': string })['@type']).toBe('Event')
  })

  it('reads only the tour wording, not other uses of "Rundgang ab" or "in Vorbereitung"', () => {
    const said = (meta: string) => ({ ...exhibition, tour: null, tour_status: 'restricted', tour_available_from: null, seo: { meta_description: meta }, translations: [] })
    expect(staleTourWording(said('Galerienrundgang ab 18 Uhr, Katalog in Vorbereitung.'), '2026-10-24')).toBe(false)
    expect(staleTourWording(said('360°-Rundgang ab 19. Dezember.'), '2026-10-24')).toBe(true)
    expect(staleTourWording(said('360° tour in preparation.'), '2026-10-24')).toBe(true)
  })
})
