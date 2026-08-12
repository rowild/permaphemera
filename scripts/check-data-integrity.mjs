import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = async (path) => {
  try {
    return JSON.parse(await readFile(resolve(projectRoot, path), 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

const [locations, venues, artists, exhibitions, junction] = await Promise.all([
  readJson('app/data/v2/locations.json'),
  readJson('app/data/v2/venues.json'),
  readJson('app/data/v2/artists.json'),
  readJson('app/data/v2/exhibitions.json'),
  readJson('app/data/v2/exhibitions_artists.json')
])

const ids = (records) => records ? new Set(records.map((record) => record.id)) : new Set()
const locationIds = ids(locations)
const venueIds = ids(venues)
const artistIds = ids(artists)
const exhibitionIds = ids(exhibitions)

const uniqueSlugs = (records) => records ? new Set(records.map((record) => record.slug)).size === records.length : true
const everyHasEnglish = (records) => !records || records.every((record) =>
  Array.isArray(record.translations) && record.translations.some((entry) => entry.languages_code === 'en'))
const validStatus = (records) => !records || records.every((record) => ['draft', 'published'].includes(record.status))

const checks = [
  locations && ['locations count is 17', locations.length === 17],
  venues && ['venues count is 36', venues.length === 36],
  artists && ['artists count is 62', artists.length === 62],
  exhibitions && ['exhibitions count is 13', exhibitions.length === 13],

  locations && ['every location has coordinates', locations.every((location) =>
    typeof location.latitude === 'number' && typeof location.longitude === 'number')],
  locations && ['coordinates are inside Austria', locations.every((location) =>
    location.latitude > 46 && location.latitude < 49 && location.longitude > 9 && location.longitude < 17)],

  venues && ['venue.location_id all resolve', venues.every((venue) => locationIds.has(venue.location_id))],
  exhibitions && venues && ['exhibition.primary_venue_id all resolve', exhibitions.every((exhibition) =>
    venueIds.has(exhibition.primary_venue_id))],
  junction && exhibitions && ['junction exhibition_id all resolve', junction.every((row) => exhibitionIds.has(row.exhibition_id))],
  junction && artists && ['junction artist_id all resolve', junction.every((row) => artistIds.has(row.artist_id))],
  exhibitions && junction && ['every exhibition has at least one artist', exhibitions.every((exhibition) =>
    junction.some((row) => row.exhibition_id === exhibition.id))],

  venues && ['every venue has a type', venues.every((venue) => typeof venue.type === 'string' && venue.type.length > 0)],
  venues && ['venue types are from the known set', venues.every((venue) =>
    ['gallery', 'museum', 'kunsthalle', 'art_cafe', 'open_air', 'forum'].includes(venue.type))],

  locations && ['location slugs unique', uniqueSlugs(locations)],
  venues && ['venue slugs unique', uniqueSlugs(venues)],
  artists && ['artist slugs unique', uniqueSlugs(artists)],
  exhibitions && ['exhibition slugs unique', uniqueSlugs(exhibitions)],

  locations && ['every location has an en translation', everyHasEnglish(locations)],
  venues && ['every venue has an en translation', everyHasEnglish(venues)],
  exhibitions && ['every exhibition has an en translation', everyHasEnglish(exhibitions)],

  locations && ['locations have a valid status', validStatus(locations)],
  venues && ['venues have a valid status', validStatus(venues)],
  artists && ['artists have a valid status', validStatus(artists)],
  exhibitions && ['exhibitions have a valid status', validStatus(exhibitions)],

  artists && ['no artist keeps a stored record_count', artists.every((artist) => artist.record_count === undefined)]
].filter(Boolean)

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Data integrity failed:')
  for (const [label] of failures) console.error(`  - ${label}`)
  process.exitCode = 1
} else {
  console.log(`Data integrity OK: ${checks.length} assertions across 5 collections.`)
}
