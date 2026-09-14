import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = async (path) => JSON.parse(await readFile(resolve(projectRoot, path), 'utf8'))

const [locations, venues, artists, exhibitions, junction, statements] = await Promise.all([
  readJson('app/data/locations.json'),
  readJson('app/data/venues.json'),
  readJson('app/data/artists.json'),
  readJson('app/data/exhibitions.json'),
  readJson('app/data/exhibitions_artists.json'),
  readJson('app/data/exhibition_statements.json')
])

const ids = (records) => new Set(records.map((record) => record.id))
const locationIds = ids(locations)
const venueIds = ids(venues)
const artistIds = ids(artists)
const exhibitionIds = ids(exhibitions)

const uniqueSlugs = (records) => new Set(records.map((record) => record.slug)).size === records.length
const everyHasEnglish = (records) => records.every((record) =>
  Array.isArray(record.translations) && record.translations.some((entry) => entry.languages_code === 'en'))
const validStatus = (records) => records.every((record) => ['draft', 'published'].includes(record.status))

const checks = [
  ['locations count is 17', locations.length === 17],
  ['venues count is 36', venues.length === 36],
  ['artists count is 73', artists.length === 73],
  ['exhibitions count is 13', exhibitions.length === 13],

  ['every location has coordinates', locations.every((location) =>
    typeof location.latitude === 'number' && typeof location.longitude === 'number')],
  ['coordinates are inside Austria', locations.every((location) =>
    location.latitude > 46 && location.latitude < 49 && location.longitude > 9 && location.longitude < 17)],

  ['venue.location_id all resolve', venues.every((venue) => locationIds.has(venue.location_id))],
  ['exhibition.primary_venue_id all resolve', exhibitions.every((exhibition) =>
    venueIds.has(exhibition.primary_venue_id))],
  ['junction exhibition_id all resolve', junction.every((row) => exhibitionIds.has(row.exhibition_id))],
  ['junction artist_id all resolve', junction.every((row) => artistIds.has(row.artist_id))],
  ['every exhibition has at least one artist', exhibitions.every((exhibition) =>
    junction.some((row) => row.exhibition_id === exhibition.id))],
  ['statement exhibition_id all resolve', statements.every((row) => exhibitionIds.has(row.exhibition_id))],
  ['statement artist_id all resolve', statements.every((row) => artistIds.has(row.artist_id))],
  ['every statement is by an artist linked to that exhibition', statements.every((row) =>
    junction.some((link) => link.exhibition_id === row.exhibition_id && link.artist_id === row.artist_id))],
  ['every statement has an en translation with a statement text', statements.every((row) =>
    Array.isArray(row.translations) && row.translations.some((entry) =>
      entry.languages_code === 'en' && typeof entry.statement === 'string'))],
  ['statements have a valid status', validStatus(statements)],
  ['statement ids unique', new Set(statements.map((row) => row.id)).size === statements.length],

  ['every venue has a type', venues.every((venue) => typeof venue.type === 'string' && venue.type.length > 0)],
  ['venue types are from the known set', venues.every((venue) =>
    ['gallery', 'museum', 'kunsthalle', 'art_cafe', 'open_air', 'forum'].includes(venue.type))],

  ['location slugs unique', uniqueSlugs(locations)],
  ['venue slugs unique', uniqueSlugs(venues)],
  ['artist slugs unique', uniqueSlugs(artists)],
  ['exhibition slugs unique', uniqueSlugs(exhibitions)],

  ['every location has an en translation', everyHasEnglish(locations)],
  ['every venue has an en translation', everyHasEnglish(venues)],
  ['every exhibition has an en translation', everyHasEnglish(exhibitions)],

  ['locations have a valid status', validStatus(locations)],
  ['venues have a valid status', validStatus(venues)],
  ['artists have a valid status', validStatus(artists)],
  ['exhibitions have a valid status', validStatus(exhibitions)],

  ['no artist keeps a stored record_count', artists.every((artist) => artist.record_count === undefined)],
  ['no exhibition keeps a manual featured flag', exhibitions.every((exhibition) => exhibition.featured === undefined)]
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Data integrity failed:')
  for (const [label] of failures) console.error(`  - ${label}`)
  process.exitCode = 1
} else {
  console.log(`Data integrity OK: ${checks.length} assertions across 6 collections.`)
}
