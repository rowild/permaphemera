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
export const TRANSLATED = new Set(['pp_locations', 'pp_venues', 'pp_roles', 'pp_exhibitions', 'pp_exhibition_statements', 'pp_sponsors', 'pp_navigation_items'])

/** File fields per collection: Directus returns file ids; the site needs URLs. */
export const FILE_FIELDS = {
  pp_venues: ['image', 'hero_image'],
  pp_exhibitions: ['image', 'source_pdf'],
  pp_sponsors: ['logo']
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
  navigations: 'pp_navigations',
  navigationItems: 'pp_navigation_items',
  exhibitionsVenues: 'pp_mm__exhibitions_venues',
  exhibitionsSponsors: 'pp_mm__exhibitions_sponsors',
  personsVenues: 'pp_mm__persons_venues',
  personsSponsors: 'pp_mm__persons_sponsors',
  locationsSponsors: 'pp_mm__locations_sponsors',
  sponsorsVenues: 'pp_mm__sponsors_venues'
}

/** Directus returns a file id; the site and the admin scripts both need a fetchable URL. */
export const assetUrl = (baseUrl, id) => (typeof id === 'string' && id ? `${baseUrl}/assets/${id}` : null)
