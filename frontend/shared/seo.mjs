// frontend/shared/seo.mjs
// One place that turns the archive into the <head> of every route: title, description, share
// image, canonical, language alternates, robots and JSON-LD. The pages apply it through
// usePageSeo(); the deploy writes the same tags into static snapshots (scripts/seo-snapshot.mjs),
// so what crawlers read without JavaScript and what the running site shows never differ.
//
// Plain JS (like archive-schema.mjs) so the Node scripts import it without a build step;
// declarations in seo.d.mts. Design: docs/superpowers/specs/2026-10-24-seo-design.md.
//
// Input: the raw archive snapshot (keys of COLLECTIONS; file fields already asset URLs, plus
// `<field>_placeholder` and `<field>_type`) and the locale messages ({ de, en } from i18n/locales).

export const SITE_URL = 'https://permaphemera.at'
export const SITE_NAME = 'PERMAPHEMERA'
export const DEFAULT_SHARE_IMAGE = `${SITE_URL}/media/images/share/permaphemera-share.jpg`
/** Marks the head tags of a deploy snapshot, so the running app can remove them (removeSnapshotTags). */
export const SNAPSHOT_ATTRIBUTE = 'data-seo-snapshot'

const LOCALES = ['de', 'en']
const OG_LOCALE = { de: 'de_AT', en: 'en_GB' }
const SHARE_TRANSFORM = 'width=1200&height=630&fit=cover&format=jpg&quality=80'
const TITLE_MAX = 60
const DESCRIPTION_MAX = 160
const SUFFIX = ` · ${SITE_NAME}`

// The locale files have no venue type labels; the site shows the type nowhere as text.
const VENUE_TYPES = {
  gallery: { de: 'Galerie', en: 'Gallery' },
  museum: { de: 'Museum', en: 'Museum' },
  kunsthalle: { de: 'Kunsthalle', en: 'Kunsthalle' },
  art_cafe: { de: 'Kunstcafé', en: 'Art café' },
  open_air: { de: 'Ausstellungsort im Freien', en: 'Open-air venue' },
  forum: { de: 'Forum', en: 'Forum' }
}
const SCHEMA_PLACE = { gallery: 'ArtGallery', museum: 'Museum' }
const COUNTRY_CODES = { Austria: 'AT', 'Österreich': 'AT', Germany: 'DE', Italy: 'IT', Slovenia: 'SI' }
const MORE_ARTISTS = { de: 'u. a.', en: 'and others' }
const DATE_LOCALES = { de: 'de-AT', en: 'en-GB' }
/**
 * File types Directus scales and converts to the JPEG a link preview needs; an SVG logo or a file
 * stored as application/octet-stream would go out as it is. check:data uses the same list.
 */
export const SHAREABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/avif'])

export const localizedPath = (path, locale) => (locale === 'en' ? `/en${path}` : path)
const absolute = (path, locale) => `${SITE_URL}${localizedPath(path, locale)}`

const present = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)
const published = (record) => record?.status === 'published'
const entryOf = (record, code) => (record.translations ?? []).find((entry) => entry.languages_code === code)
/** A translated field: the locale, else English, else the record (the fallback pickTranslation uses). */
const textOf = (record, locale, field) => present(entryOf(record, locale)?.[field]) ?? present(entryOf(record, 'en')?.[field]) ?? present(record[field])
const personName = (person) => present(person.display_name) ?? `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim()

const squish = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

/**
 * Plain text from WYSIWYG HTML or Markdown. Only markup goes: a gender star or an underscore inside
 * a word (Künstler*innen), a # without a space after it (#3), a > within a line and a lone < stay
 * as the editors wrote them. No lookbehind: Safari before 16.4 cannot parse it.
 */
export const stripMarkup = (value) => squish(String(value ?? '')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<\/?[a-z][^>]*>/gi, ' ')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/^[ \t]*(?:#{1,6}[ \t]+|>[ \t]?)/gm, '')
  .replace(/(^|[^\p{L}\p{N}])[*_]+/gu, '$1')
  .replace(/[*_]+(?![\p{L}\p{N}])/gu, '')
  .replace(/`/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'))

const cutAtWord = (text, max) => {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:·–-]+$/, '')}…`
}

/** A generated title: with " · PERMAPHEMERA" when that stays within 60 characters. */
export const fitTitle = (base, max = TITLE_MAX) => {
  const text = squish(base)
  if (text.length + SUFFIX.length <= max) return `${text}${SUFFIX}`
  return cutAtWord(text, max)
}

export const fitDescription = (text, max = DESCRIPTION_MAX) => cutAtWord(stripMarkup(text), max)

/** The first candidate that fits with the site name, else the first that fits, else the last cut. */
const generatedTitle = (candidates) => {
  const list = candidates.filter(Boolean).map(squish)
  return list.find((text) => text.length + SUFFIX.length <= TITLE_MAX)?.concat(SUFFIX)
    ?? list.find((text) => text.length <= TITLE_MAX)
    ?? cutAtWord(list.at(-1), TITLE_MAX)
}

/**
 * The SEO data of a record for one locale: title and description from that language's entry
 * (English also from the record), share image, robots and sitemap from the record for both.
 */
export const readSeo = (record, locale) => {
  const own = record.seo ?? {}
  const localized = entryOf(record, locale)?.seo ?? null
  const fallback = locale === 'en' ? own : null
  return {
    title: present(localized?.title) ?? present(fallback?.title),
    description: present(localized?.meta_description) ?? present(fallback?.meta_description),
    image: present(own.og_image),
    noIndex: own.no_index === true,
    noFollow: own.no_follow === true,
    changeFrequency: present(own.sitemap?.change_frequency),
    priority: present(own.sitemap?.priority)
  }
}

// `messages` is { de, en } as in the locale files (Node scripts, tests), or a translate function
// (locale, key, params) => text | undefined (the running site, whose messages are precompiled).
const message = (messages, locale, key, params = {}) => {
  if (typeof messages === 'function') return messages(locale, key, params)
  let value = key.split('.').reduce((node, part) => node?.[part], messages[locale])
  if (typeof value !== 'string') return undefined
  if (value.includes(' | ')) {
    const forms = value.split(' | ')
    value = params.count === 1 ? forms[0] : forms.at(-1)
  }
  return value.replace(/\{(\w+)\}/g, (match, name) => (params[name] === undefined ? match : String(params[name])))
}

const shareImage = (value, assetBase) => {
  if (!value) return DEFAULT_SHARE_IMAGE
  const url = /^https?:\/\//.test(value) ? value : `${assetBase}/assets/${value}`
  return `${url}${url.includes('?') ? '&' : '?'}${SHARE_TRANSFORM}`
}
const realImage = (record, field) => (record[field] && !record[`${field}_placeholder`] ? record[field] : undefined)
/** A real image a link preview can show. `<field>_type` comes from the loaders; unknown counts as fine. */
const shareable = (record, field) => {
  const type = record[`${field}_type`]
  return type == null || SHAREABLE_TYPES.has(type) ? realImage(record, field) : undefined
}

/** "15.–29. Oktober 2026" / "15 – 29 October 2026"; nothing for a permanent exhibition. */
const dateRange = (record, locale) => {
  if (record.is_permanent || !record.start_date) return undefined
  const format = new Intl.DateTimeFormat(DATE_LOCALES[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  const start = new Date(record.start_date)
  return record.end_date && record.end_date !== record.start_date ? format.formatRange(start, new Date(record.end_date)) : format.format(start)
}

const breadcrumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url }))
})

const postalAddress = (venue, location) => {
  const street = present(venue?.address?.split(',')[0])
  return {
    '@type': 'PostalAddress',
    ...(street && !/^\d{4}\s/.test(street) ? { streetAddress: street } : {}),
    ...(location.postal_code ? { postalCode: location.postal_code } : {}),
    addressLocality: location.title,
    ...(location.state ? { addressRegion: location.state } : {}),
    addressCountry: COUNTRY_CODES[location.country] ?? location.country ?? 'AT'
  }
}

const place = (venue, location, locale) => {
  const latitude = venue.latitude ?? location.latitude
  const longitude = venue.longitude ?? location.longitude
  return {
    '@type': SCHEMA_PLACE[venue.type] ?? 'Place',
    name: venue.title,
    url: absolute(`/venues/${venue.slug}/`, locale),
    address: postalAddress(venue, location),
    ...(typeof latitude === 'number' && typeof longitude === 'number' ? { geo: { '@type': 'GeoCoordinates', latitude, longitude } } : {})
  }
}

const linksOf = (archive, junction, ownerColumn, ownerId) => {
  const websites = new Map((archive.websites ?? []).filter(published).map((site) => [site.id, site.url]))
  return (archive[junction] ?? [])
    .filter((row) => row[ownerColumn] === ownerId)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((row) => websites.get(String(row.websites_id)))
    .filter(Boolean)
}

const entry = ({ path, locale, record, generated, description, image, imageAlt, ogType, jsonLd, changeFrequency, priority }, assetBase) => {
  const seo = record ? readSeo(record, locale) : { noIndex: false, noFollow: false }
  const canonical = absolute(path, locale)
  const title = seo.title ?? generated
  const shared = seo.image ?? image
  // The record's image text describes the record image only. A share image chosen in the SEO
  // section gets the page title, the site's default image the site name.
  const ownImage = !seo.image || Boolean(image?.endsWith(`/assets/${seo.image}`))
  return {
    path,
    locale,
    title,
    description: seo.description ?? fitDescription(description ?? ''),
    image: shareImage(shared, assetBase),
    imageAlt: !shared ? SITE_NAME : (ownImage ? imageAlt : undefined) ?? title,
    ogType,
    noIndex: seo.noIndex,
    noFollow: seo.noFollow,
    canonical,
    alternates: { de: absolute(path, 'de'), en: absolute(path, 'en'), 'x-default': absolute(path, 'de') },
    jsonLd: jsonLd(canonical),
    lastmod: record ? (record.date_updated ?? record.date_created ?? undefined) : undefined,
    changeFrequency: seo.changeFrequency ?? changeFrequency,
    priority: seo.priority ?? priority
  }
}

/** One entry per published exhibition, gallery, person, organisation and sponsor page, in both languages. */
/** With `path`, only that page's entries are built (a page needs one; the deploy needs all). */
export const recordSeoEntries = (archive, { assetBase, messages, path: only }) => {
  const skip = (path) => only !== undefined && path !== only
  const locations = new Map((archive.locations ?? []).filter(published).map((location) => [location.id, location]))
  const venues = new Map((archive.venues ?? []).filter((venue) => published(venue) && locations.has(venue.location)).map((venue) => [venue.id, venue]))
  const persons = new Map((archive.persons ?? []).filter(published).map((person) => [person.id, person]))
  const roles = new Map((archive.roles ?? []).filter(published).map((role) => [role.id, role]))
  const organisations = new Map((archive.organisations ?? []).filter(published).map((organisation) => [organisation.id, organisation]))
  const home = (locale) => ({ name: message(messages, locale, 'navigation.archive') ?? SITE_NAME, url: absolute('/', locale) })
  const list = []

  for (const exhibition of (archive.exhibitions ?? []).filter(published)) {
    const path = `/exhibitions/${exhibition.slug}/`
    if (skip(path)) continue
    const venue = venues.get(exhibition.primary_venue)
    if (!venue || !realImage(exhibition, 'image')) continue
    const location = locations.get(venue.location)
    const artists = (archive.participations ?? [])
      .filter((row) => row.exhibition === exhibition.id && roles.get(row.role)?.slug === 'artist' && persons.has(row.person))
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((row) => persons.get(row.person))
    const organisers = (archive.exhibitionOrganisers ?? [])
      .filter((row) => row.exhibition === exhibition.id && organisations.has(row.organisation))
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((row) => organisations.get(row.organisation))
    const isEvent = exhibition.kind === 'event'
    for (const locale of LOCALES) {
      const title = textOf(exhibition, locale, 'title') ?? exhibition.title
      const names = artists.map(personName)
      const credit = names.length > 2 ? `${names[0]} ${MORE_ARTISTS[locale]}` : names.join(' & ')
      const details = [textOf(exhibition, locale, 'date_range') ?? dateRange(exhibition, locale), venue.title, location.title].filter(Boolean).join(', ')
      const description = textOf(exhibition, locale, 'summary') ?? textOf(exhibition, locale, 'description')
        ?? message(messages, locale, `exhibition.seoDescription${isEvent ? 'Event' : ''}${credit ? 'Artists' : ''}`, { title, artists: credit, details })
      list.push(entry({
        path, locale, record: exhibition,
        generated: generatedTitle([
          credit && `${title} – ${credit} · ${venue.title}, ${location.title}`,
          credit && `${title} – ${credit} · ${venue.title}`,
          `${title} · ${venue.title}, ${location.title}`,
          credit && `${title} – ${credit}`,
          `${title} · ${venue.title}`,
          title
        ]),
        description, image: shareable(exhibition, 'image'), imageAlt: textOf(exhibition, locale, 'image_alt'), ogType: 'article',
        changeFrequency: 'monthly', priority: '0.7',
        jsonLd: (url) => [
          {
            '@context': 'https://schema.org',
            '@type': isEvent ? 'Event' : 'ExhibitionEvent',
            name: title,
            url,
            description: fitDescription(description ?? '', 300),
            image: [exhibition.image],
            startDate: exhibition.start_date,
            endDate: exhibition.end_date,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            isAccessibleForFree: !textOf(exhibition, locale, 'admission'),
            location: place(venue, location, locale),
            ...(organisers.length ? { organizer: organisers.map((organisation) => ({ '@type': 'Organization', name: organisation.title, url: absolute(`/organisations/${organisation.slug}/`, locale) })) } : {}),
            ...(artists.length ? { performer: artists.map((person) => ({ '@type': 'Person', name: personName(person), url: absolute(`/persons/${person.slug}/`, locale) })) } : {})
          },
          breadcrumbs([home(locale), { name: message(messages, locale, 'exhibitionsDirectory.breadcrumb'), url: absolute('/exhibitions/', locale) }, { name: title, url }])
        ]
      }, assetBase))
    }
  }

  for (const venue of venues.values()) {
    const path = `/venues/${venue.slug}/`
    if (skip(path)) continue
    const location = locations.get(venue.location)
    const image = realImage(venue, 'hero_image') ?? realImage(venue, 'image')
    const hero = shareable(venue, 'hero_image')
    const share = hero ?? shareable(venue, 'image')
    const sameAs = [present(venue.website_url), ...linksOf(archive, 'venuesWebsites', 'venues_id', venue.id)].filter(Boolean)
    for (const locale of LOCALES) {
      const type = VENUE_TYPES[venue.type]?.[locale]
      const imageAlt = textOf(venue, locale, 'image_alt')
      // The image text of the photo that is shared; image_alt fits the hero only when both are one file.
      const shareAlt = hero ? textOf(venue, locale, 'hero_image_alt') ?? (venue.hero_image === venue.image ? imageAlt : undefined) : imageAlt
      const description = textOf(venue, locale, 'lede') ?? textOf(venue, locale, 'description') ?? textOf(venue, locale, 'about_html')
        ?? message(messages, locale, 'venue.seoDescription', { name: venue.title, city: location.title })
      list.push(entry({
        path, locale, record: venue,
        generated: generatedTitle([type && `${venue.title}, ${location.title} · ${type}`, `${venue.title}, ${location.title}`, type && `${venue.title} · ${type}`, venue.title]),
        description, image: share, imageAlt: shareAlt, ogType: 'website', changeFrequency: 'monthly', priority: '0.6',
        jsonLd: (url) => [
          { '@context': 'https://schema.org', ...place(venue, location, locale), url, ...(image ? { image } : {}), description: fitDescription(description ?? '', 300), ...(sameAs.length ? { sameAs } : {}) },
          breadcrumbs([home(locale), { name: message(messages, locale, 'galleries.breadcrumb'), url: absolute('/venues/', locale) }, { name: venue.title, url }])
        ]
      }, assetBase))
    }
  }

  for (const person of persons.values()) {
    const path = `/persons/${person.slug}/`
    if (skip(path)) continue
    const name = personName(person)
    const personRoles = (archive.personRoles ?? []).filter((row) => row.persons_id === person.id).map((row) => roles.get(row.roles_id)).filter(Boolean)
    const isArtist = personRoles.some((role) => role.slug === 'artist')
    const sameAs = linksOf(archive, 'personsWebsites', 'persons_id', person.id)
    const image = realImage(person, 'image')
    const share = shareable(person, 'image')
    for (const locale of LOCALES) {
      const roleLine = personRoles.map((role) => textOf(role, locale, 'title') ?? role.title).join(', ')
      const description = textOf(person, locale, 'lede') ?? textOf(person, locale, 'about_html') ?? message(messages, locale, 'persons.seoDescription', { name })
      const basedIn = textOf(person, locale, 'based_in')
      list.push(entry({
        path, locale, record: person,
        generated: generatedTitle([roleLine && `${name} · ${roleLine}`, name]),
        description, image: share, imageAlt: textOf(person, locale, 'image_alt') ?? name, ogType: 'profile', changeFrequency: 'monthly', priority: '0.5',
        jsonLd: (url) => [
          {
            '@context': 'https://schema.org', '@type': 'Person', name, url,
            ...(image ? { image } : {}),
            description: fitDescription(description ?? '', 300),
            ...(roleLine ? { jobTitle: roleLine } : {}),
            ...(basedIn ? { homeLocation: { '@type': 'Place', name: basedIn } } : {}),
            ...(sameAs.length ? { sameAs } : {})
          },
          breadcrumbs([home(locale), ...(isArtist ? [{ name: message(messages, locale, 'artists.breadcrumb'), url: absolute('/artists/', locale) }] : []), { name, url }])
        ]
      }, assetBase))
    }
  }

  for (const organisation of organisations.values()) {
    const path = `/organisations/${organisation.slug}/`
    if (skip(path)) continue
    const town = locations.get(organisation.location)?.title
    const sameAs = linksOf(archive, 'organisationsWebsites', 'organisations_id', organisation.id)
    const image = realImage(organisation, 'image') ?? realImage(organisation, 'logo')
    const photo = shareable(organisation, 'image')
    const share = photo ?? shareable(organisation, 'logo')
    for (const locale of LOCALES) {
      const kind = message(messages, locale, `organisations.kinds.${organisation.kind}`)
      const description = textOf(organisation, locale, 'lede') ?? textOf(organisation, locale, 'description') ?? textOf(organisation, locale, 'about_html')
        ?? message(messages, locale, 'organisations.recordSeoDescription', { name: organisation.title })
      list.push(entry({
        path, locale, record: organisation,
        generated: generatedTitle([kind && town && `${organisation.title} · ${kind}, ${town}`, kind && `${organisation.title} · ${kind}`, organisation.title]),
        description, image: share, imageAlt: textOf(organisation, locale, photo ? 'image_alt' : 'logo_alt') ?? organisation.title, ogType: 'website', changeFrequency: 'monthly', priority: '0.5',
        jsonLd: (url) => [
          {
            '@context': 'https://schema.org', '@type': 'Organization', name: organisation.title, url,
            ...(image ? { image } : {}),
            ...(realImage(organisation, 'logo') ? { logo: organisation.logo } : {}),
            description: fitDescription(description ?? '', 300),
            ...(town ? { address: { '@type': 'PostalAddress', addressLocality: town } } : {}),
            ...(sameAs.length ? { sameAs } : {})
          },
          breadcrumbs([home(locale), { name: message(messages, locale, 'organisations.breadcrumb'), url: absolute('/organisations/', locale) }, { name: organisation.title, url }])
        ]
      }, assetBase))
    }
  }

  for (const sponsor of (archive.sponsors ?? []).filter(published)) {
    const path = `/sponsors/${sponsor.slug}/`
    if (skip(path)) continue
    const image = realImage(sponsor, 'logo')
    const share = shareable(sponsor, 'logo')
    for (const locale of LOCALES) {
      const description = textOf(sponsor, locale, 'description') ?? message(messages, locale, 'sponsorPages.seoDescription', { name: sponsor.title })
      list.push(entry({
        path, locale, record: sponsor,
        generated: generatedTitle([`${sponsor.title} · ${message(messages, locale, 'sponsorPages.eyebrow') ?? 'Sponsor'}`, sponsor.title]),
        description, image: share, imageAlt: sponsor.title, ogType: 'website', changeFrequency: 'yearly', priority: '0.3',
        jsonLd: (url) => [
          { '@context': 'https://schema.org', '@type': 'Organization', name: sponsor.title, url, ...(image ? { logo: image } : {}), ...(present(sponsor.website_url) ? { sameAs: [sponsor.website_url] } : {}) },
          breadcrumbs([home(locale), { name: sponsor.title, url }])
        ]
      }, assetBase))
    }
  }

  return list
}

const STATIC_PAGES = [
  { path: '/', title: 'site.seoTitle', description: 'site.seoDescription', changeFrequency: 'weekly', priority: '1.0', website: true },
  { path: '/exhibitions/', title: 'exhibitionsDirectory.seoTitle', description: 'exhibitionsDirectory.seoDescription', changeFrequency: 'weekly', priority: '0.8' },
  ...['current', 'upcoming', 'past'].map((group) => ({
    path: `/exhibitions/${group}/`, group, description: `exhibitionsDirectory.groups.${group}.seoDescription`, changeFrequency: 'weekly', priority: '0.7'
  })),
  { path: '/artists/', title: 'artists.seoTitle', description: 'artists.seoDescription', changeFrequency: 'weekly', priority: '0.8' },
  { path: '/venues/', title: 'galleries.seoTitle', description: 'galleries.seoDescription', count: 'venues', changeFrequency: 'weekly', priority: '0.8' },
  { path: '/organisations/', title: 'organisations.seoTitle', description: 'organisations.seoDescription', count: 'organisations', changeFrequency: 'weekly', priority: '0.6' },
  { path: '/about/', title: 'about.seoTitle', description: 'about.seoDescription', changeFrequency: 'monthly', priority: '0.6' },
  { path: '/how-it-works/', title: 'howItWorksPage.seoTitle', description: 'howItWorksPage.seoDescription', changeFrequency: 'monthly', priority: '0.5' },
  { path: '/contact/', title: 'contactPage.seoTitle', description: 'contactPage.seoDescription', changeFrequency: 'yearly', priority: '0.4' },
  ...['imprint', 'privacy', 'terms', 'accessibility'].map((page) => ({
    path: `/${page}/`, title: `legal.${page}.seoTitle`, description: `legal.${page}.seoDescription`, changeFrequency: 'yearly', priority: '0.2'
  }))
]

/** One entry per fixed page in both languages; texts from the locale files, written as full titles. */
export const staticSeoEntries = (messages, counts = {}) => STATIC_PAGES.flatMap((page) => LOCALES.map((locale) => {
  const params = page.count ? { count: counts[page.count] ?? 0 } : {}
  const title = page.group
    ? message(messages, locale, 'exhibitionsDirectory.groupSeoTitle', { title: message(messages, locale, `exhibitionsDirectory.groups.${page.group}.title`) })
    : message(messages, locale, page.title, params)
  const description = message(messages, locale, page.description, params) ?? ''
  return entry({
    path: page.path, locale, record: null,
    generated: title ?? SITE_NAME,
    description, image: null, imageAlt: SITE_NAME, ogType: 'website', changeFrequency: page.changeFrequency, priority: page.priority,
    jsonLd: (url) => (page.website
      ? [{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url, inLanguage: locale, description }]
      : [])
  }, SITE_URL)
}))

/** The numbers in the fixed pages' texts ("13 galleries…"): published records only. */
export const seoCounts = (archive) => ({
  venues: (archive.venues ?? []).filter(published).length,
  organisations: (archive.organisations ?? []).filter(published).length
})

/** The entry of one page for the running site: a fixed page at once, a record page once the archive is loaded. */
export const pageSeoEntry = (archive, { path, locale, messages, assetBase, ready }) => {
  const fixed = staticSeoEntries(messages, seoCounts(archive)).find((item) => item.path === path && item.locale === locale)
  if (fixed) return fixed
  if (!ready) return undefined
  return recordSeoEntries(archive, { assetBase, messages, path }).find((item) => item.locale === locale)
}

/** Removes the head tags of a deploy snapshot from `root` (the document); the running app sets its own. */
export const removeSnapshotTags = (root) => {
  for (const element of root.querySelectorAll(`[${SNAPSHOT_ATTRIBUTE}]`)) element.remove()
}

// "360° tour in preparation", "360°-Rundgang ab 19. Dezember": only the tour sentence, not a
// "Galerienrundgang ab 18 Uhr" or a "Katalog in Vorbereitung".
const TOUR = String.raw`360°[\s-]*(?:tour|Rundgang)`
const TOUR_PREPARING = new RegExp(`${TOUR}\\s+(?:in preparation|in Vorbereitung)`, 'i')
const TOUR_FROM = new RegExp(`${TOUR}\\s+(?:from|ab)\\s`, 'i')

/**
 * True when an exhibition's SEO text (either language) announces its tour in a way the tour fields
 * no longer support: "in preparation" once the tour is open, "tour from <day>" from that day on
 * (the site opens the tour on it), any announcement when there will be no tour. `today` is YYYY-MM-DD.
 */
export const staleTourWording = (exhibition, today) => {
  const text = [exhibition.seo, ...(exhibition.translations ?? []).map((item) => item.seo)]
    .flatMap((seo) => [seo?.title, seo?.meta_description]).filter(Boolean).join('\n')
  const preparing = TOUR_PREPARING.test(text)
  const dated = TOUR_FROM.test(text)
  if (!preparing && !dated) return false
  if (exhibition.tour_status !== 'available') return true
  const reached = !exhibition.tour_available_from || exhibition.tour_available_from <= today
  return reached && (dated || Boolean(exhibition.tour))
}

/** The tags of one entry, for useHead() and for the static snapshot. */
export const headFor = (item) => {
  const other = item.locale === 'de' ? 'en' : 'de'
  const meta = [
    { name: 'description', content: item.description },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:type', content: item.ogType },
    { property: 'og:title', content: item.title },
    { property: 'og:description', content: item.description },
    { property: 'og:url', content: item.canonical },
    { property: 'og:image', content: item.image },
    { property: 'og:image:alt', content: item.imageAlt },
    { property: 'og:locale', content: OG_LOCALE[item.locale] },
    { property: 'og:locale:alternate', content: OG_LOCALE[other] },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: item.title },
    { name: 'twitter:description', content: item.description },
    { name: 'twitter:image', content: item.image }
  ]
  if (item.noIndex || item.noFollow) meta.push({ name: 'robots', content: `${item.noIndex ? 'noindex' : 'index'}, ${item.noFollow ? 'nofollow' : 'follow'}` })
  return {
    title: item.title,
    meta,
    link: [
      { rel: 'canonical', href: item.canonical },
      ...['de', 'en', 'x-default'].map((hreflang) => ({ rel: 'alternate', hreflang, href: item.alternates[hreflang] }))
    ],
    // `<` as \u003c keeps a "</script>" in a title from closing the script element.
    jsonLd: item.jsonLd.map((data) => JSON.stringify(data).replace(/</g, '\\u003c'))
  }
}
