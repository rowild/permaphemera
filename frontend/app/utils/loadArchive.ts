import type { ArchiveSnapshot } from '~/types/content'
import type { ArchiveClient } from '~/utils/directusClient'

/** Collections with a translations table get `translations.*`; the rest only `*`. */
const TRANSLATED = new Set(['pp_locations', 'pp_venues', 'pp_roles', 'pp_exhibitions', 'pp_exhibition_statements', 'pp_sponsors', 'pp_navigation_items'])

/** File fields per collection: Directus returns file ids; the site needs URLs. */
const FILE_FIELDS: Record<string, string[]> = {
  pp_venues: ['image', 'hero_image'],
  pp_exhibitions: ['image', 'source_pdf'],
  pp_sponsors: ['logo']
}

const COLLECTIONS: Record<keyof ArchiveSnapshot, string> = {
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

const assetUrl = (baseUrl: string, id: unknown) => (typeof id === 'string' && id ? `${baseUrl}/assets/${id}` : null)

/** Fetch every collection the site reads, in the JSON item shape, with file ids turned into asset URLs. */
export const loadArchive = async (client: ArchiveClient): Promise<ArchiveSnapshot> => {
  const entries = await Promise.all(Object.entries(COLLECTIONS).map(async ([key, collection]) => {
    const fields = TRANSLATED.has(collection) ? '*,translations.*' : '*'
    let rows: Record<string, unknown>[]
    try {
      rows = await client.items<Record<string, unknown>>(collection, { fields, limit: '-1', sort: 'sort' })
    } catch (error) {
      throw new Error(`${collection}: ${(error as Error).message.replace(new RegExp(`^${collection}: `), '')}`)
    }
    const fileFields = FILE_FIELDS[collection] ?? []
    const converted = fileFields.length === 0
      ? rows
      : rows.map((row) => {
          const next = { ...row }
          for (const field of fileFields) next[field] = assetUrl(client.baseUrl, row[field])
          return next
        })
    return [key, converted] as const
  }))
  return Object.fromEntries(entries) as unknown as ArchiveSnapshot
}
