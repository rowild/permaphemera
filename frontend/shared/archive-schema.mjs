// frontend/shared/archive-schema.mjs
// The one place that spells out the pp_ collection map, which collections carry
// translations, and which fields hold Directus file ids. The frontend's runtime
// loader (app/utils/loadArchive.ts), its check scripts (scripts/lib/archive-source.mjs)
// and the Directus admin scripts (directus/scripts/export.mjs, import.mjs) all import
// this instead of repeating the same literals.
//
// Plain JS (no TypeScript syntax) so directus/scripts/*.mjs — which run under plain
// Node with no build step — can import it directly. Type declarations live alongside
// in archive-schema.d.ts for the frontend's TypeScript code.

/** Collections with a translations table get `translations.*`; the rest only `*`. */
export const TRANSLATED = new Set(['pp_locations', 'pp_venues', 'pp_roles', 'pp_exhibitions', 'pp_exhibition_statements', 'pp_sponsors', 'pp_navigation_items', 'pp_websites', 'pp_organisations', 'pp_organisation_memberships', 'pp_persons'])

/** File fields per collection: Directus returns file ids; the site needs URLs. */
export const FILE_FIELDS = {
  pp_venues: ['image', 'hero_image'],
  pp_exhibitions: ['image', 'source_pdf'],
  pp_sponsors: ['logo'],
  pp_organisations: ['logo', 'image'],
  pp_persons: ['image']
}

/** ArchiveSnapshot key -> Directus collection name, one entry per collection the site reads. */
export const COLLECTIONS = {
  locations: 'pp_locations',
  venues: 'pp_venues',
  persons: 'pp_persons',
  roles: 'pp_roles',
  personRoles: 'pp_mm__persons_roles',
  exhibitions: 'pp_exhibitions',
  participations: 'pp_exhibition_participations',
  statements: 'pp_exhibition_statements',
  sponsors: 'pp_sponsors',
  websites: 'pp_websites',
  navigations: 'pp_navigations',
  navigationItems: 'pp_navigation_items',
  exhibitionsVenues: 'pp_mm__exhibitions_venues',
  exhibitionsSponsors: 'pp_mm__exhibitions_sponsors',
  personsVenues: 'pp_mm__persons_venues',
  personsSponsors: 'pp_mm__persons_sponsors',
  locationsSponsors: 'pp_mm__locations_sponsors',
  sponsorsVenues: 'pp_mm__sponsors_venues',
  exhibitionsWebsites: 'pp_mm__exhibitions_websites',
  personsWebsites: 'pp_mm__persons_websites',
  organisations: 'pp_organisations',
  organisationMemberships: 'pp_organisation_memberships',
  organisationVenueRelations: 'pp_organisation_venue_relations',
  exhibitionOrganisers: 'pp_exhibition_organisers',
  organisationsWebsites: 'pp_mm__organisations_websites',
  venuesWebsites: 'pp_mm__venues_websites'
}

/** A file field holds an id, or `{ id, filename_download }` when the query expands it. */
const fileId = (value) => (value && typeof value === 'object' ? value.id : value)

/** Directus returns a file id; the site and the admin scripts both need a fetchable URL. */
export const assetUrl = (baseUrl, value) => {
  const id = fileId(value)
  return typeof id === 'string' && id ? `${baseUrl}/assets/${id}` : null
}

/** Placeholder files are named `placeholder-…` in Directus (e.g. placeholder-venue.svg). */
export const isPlaceholderFile = (value) =>
  Boolean(value && typeof value === 'object' && String(value.filename_download ?? '').startsWith('placeholder-'))

/** The MIME type of an expanded file object, or null when the query did not ask for it. */
export const fileType = (value) => (value && typeof value === 'object' && typeof value.type === 'string' ? value.type : null)

/** The `fields` query of a collection: all fields, translations where they exist, and per file field id, name and type. */
export const fieldsQuery = (collection) => [
  TRANSLATED.has(collection) ? '*,translations.*' : '*',
  ...(FILE_FIELDS[collection] ?? []).map((field) => `${field}.id,${field}.filename_download,${field}.type`)
].join(',')

/**
 * A row with each file field as an asset URL, plus `<field>_placeholder` (the file is a placeholder,
 * `placeholder-…`) and `<field>_type` (its MIME type, e.g. to keep SVG logos out of link previews).
 */
export const withFileUrls = (baseUrl, collection, row) => {
  const next = { ...row }
  for (const field of FILE_FIELDS[collection] ?? []) {
    next[field] = assetUrl(baseUrl, row[field])
    next[`${field}_placeholder`] = isPlaceholderFile(row[field])
    next[`${field}_type`] = fileType(row[field])
  }
  return next
}
