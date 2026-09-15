// scripts/lib/archive-source.mjs
// The check scripts' view of the archive: fetched from Directus, same shape as the site's loader.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..', '..')

export const readEnv = () => {
  const env = { ...process.env }
  const file = resolve(projectRoot, '.env')
  if (existsSync(file)) for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in env)) env[m[1]] = m[2]
  }
  return env
}

const env = readEnv()
export const directusUrl = (env.DIRECTUS_URL || env.NUXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8077').replace(/\/$/, '')
export const directusToken = env.DIRECTUS_TOKEN || ''

const TRANSLATED = new Set(['pp_locations', 'pp_venues', 'pp_roles', 'pp_exhibitions', 'pp_exhibition_statements', 'pp_sponsors', 'pp_navigation_items'])
const FILE_FIELDS = { pp_venues: ['image', 'hero_image'], pp_exhibitions: ['image', 'source_pdf'], pp_sponsors: ['logo'] }
export const COLLECTIONS = {
  locations: 'pp_locations', venues: 'pp_venues', persons: 'pp_persons', roles: 'pp_roles', personRoles: 'pp_mm__persons_roles',
  exhibitions: 'pp_exhibitions', participations: 'pp_exhibition_participations', statements: 'pp_exhibition_statements',
  sponsors: 'pp_sponsors', navigations: 'pp_navigations', navigationItems: 'pp_navigation_items',
  exhibitionsVenues: 'pp_mm__exhibitions_venues', exhibitionsSponsors: 'pp_mm__exhibitions_sponsors', personsVenues: 'pp_mm__persons_venues',
  personsSponsors: 'pp_mm__persons_sponsors', locationsSponsors: 'pp_mm__locations_sponsors', sponsorsVenues: 'pp_mm__sponsors_venues'
}

export async function directusGet(path, { token = '' } = {}) {
  let response
  try {
    response = await fetch(`${directusUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch (error) {
    throw new Error(`Directus not reachable at ${directusUrl}: ${error.message}`)
  }
  if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`)
  return (await response.json()).data
}

export async function directusPatch(path, body, token) {
  if (!token) throw new Error('DIRECTUS_TOKEN is not set in frontend/.env; the tour link needs write access')
  const response = await fetch(`${directusUrl}${path}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`)
  return (await response.json()).data
}

export async function loadArchiveFromDirectus() {
  const snapshot = {}
  for (const [key, collection] of Object.entries(COLLECTIONS)) {
    const fields = TRANSLATED.has(collection) ? '*,translations.*' : '*'
    const rows = await directusGet(`/items/${collection}?fields=${encodeURIComponent(fields)}&limit=-1&sort=sort`)
    for (const field of FILE_FIELDS[collection] ?? []) for (const row of rows) row[field] = row[field] ? `${directusUrl}/assets/${row[field]}` : null
    snapshot[key] = rows
  }
  return snapshot
}
