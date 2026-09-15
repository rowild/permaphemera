// directus/scripts/import.mjs
// Loads records and files into Directus from a directory of pp_*.json files.
// Idempotent: existing records (by id) and files (by folder + filename) are skipped.
//   node scripts/import.mjs [--from <dir>]
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { loadEnv, login } from './lib.mjs'
import { uploadFile } from './files.mjs'

const args = process.argv.slice(2)
const fromIndex = args.indexOf('--from')
const source = resolve(fromIndex >= 0 ? args[fromIndex + 1] : join(import.meta.dirname, '..', '..', 'frontend', 'app', 'data'))
const publicDir = existsSync(join(source, 'public')) ? join(source, 'public') : resolve(source, '..', '..', 'public')
const filesDir = join(source, 'files')

const session = await login(loadEnv())
const { api } = session
const read = (name) => JSON.parse(readFileSync(join(source, `${name}.json`), 'utf8'))
const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

// Every translations table FKs to languages_code, so the two languages must exist before any
// collection with translations can be restored onto an empty instance — seed.mjs normally
// creates them, but that runs after this script in the documented restore order. Ensure them
// here too, with the exact values seed.mjs uses, so seed.mjs reports "=" afterwards. Prefer
// a languages.json in the source dir if a future export carries one.
const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'de', name: 'Deutsch', direction: 'ltr' },
]
const languageRows = existsSync(join(source, 'languages.json')) ? read('languages') : DEFAULT_LANGUAGES
for (const lang of languageRows) {
  const existing = (await api('GET', `/items/languages?filter[code][_eq]=${lang.code}&limit=1&fields=code`))[0]
  if (existing) { console.log(`= language ${lang.code}`); continue }
  await api('POST', '/items/languages', lang)
  console.log(`+ language ${lang.code}`)
}

const FILE_FIELDS = { pp_venues: ['image', 'hero_image'], pp_exhibitions: ['image', 'source_pdf'], pp_sponsors: ['logo'] }

// Dependency order. Entities first, then junctions.
const ORDER = ['pp_locations', 'pp_venues', 'pp_persons', 'pp_roles', 'pp_mm__persons_roles', 'pp_exhibitions',
  'pp_exhibition_participations', 'pp_exhibition_statements', 'pp_sponsors', 'pp_navigations', 'pp_navigation_items',
  'pp_mm__exhibitions_venues', 'pp_mm__exhibitions_sponsors', 'pp_mm__persons_venues', 'pp_mm__persons_sponsors',
  'pp_mm__locations_sponsors', 'pp_mm__sponsors_venues']

const uploaded = new Map() // path or id → file id
async function fileIdFor(value) {
  if (!value) return null
  if (uploaded.has(value)) return uploaded.get(value)
  let result
  if (value.startsWith('/')) {
    const localPath = join(publicDir, decodeURI(value))
    if (!existsSync(localPath)) throw new Error(`missing file for ${value}: ${localPath}`)
    result = await uploadFile(session, { localPath, folderPath: dirname(value).replace(/^\//, ''), title: value.split('/').pop() })
  } else if (isUuid(value)) {
    const match = existsSync(filesDir) ? readdirSync(filesDir).find((f) => f.startsWith(value)) : null
    if (!match) throw new Error(`file ${value} not found under ${filesDir}`)
    const index = JSON.parse(readFileSync(join(source, 'files.json'), 'utf8'))
    const meta = index.find((f) => f.id === value) ?? {}
    result = await uploadFile(session, { localPath: join(filesDir, match), folderPath: meta.folder ?? 'imported', title: meta.title, id: value })
  } else {
    throw new Error(`unrecognised file reference ${value}`)
  }
  console.log(`${result.created ? '+' : '='} file ${value} → ${result.id}`)
  uploaded.set(value, result.id)
  return result.id
}

const keepFieldsCache = new Map()
async function keepFieldsFor(collection) {
  if (keepFieldsCache.has(collection)) return keepFieldsCache.get(collection)
  const fields = await api('GET', `/fields/${collection}`)
  // Real columns only, same guard as export.mjs: reverse-relation alias fields (schema: null)
  // must never be posted, whether the export that produced them was fixed or not.
  const keep = new Set(fields.filter((f) => f.schema !== null).map((f) => f.field))
  if (fields.some((f) => f.field === 'translations')) keep.add('translations')
  keepFieldsCache.set(collection, keep)
  return keep
}

// pp_navigation_items self-references via `parent`; on an empty instance a child row can
// precede its parent in the source array (sorted by `sort`, not by hierarchy), so the
// self-referencing FK insert fails. No-op for every other collection (no `parent` field).
function parentFirst(rows) {
  if (!rows.some((r) => 'parent' in r)) return rows
  const byId = new Map(rows.map((r) => [r.id, r]))
  const ordered = []
  const seen = new Set()
  const visit = (row) => {
    if (seen.has(row.id)) return
    seen.add(row.id)
    if (row.parent && byId.has(row.parent)) visit(byId.get(row.parent))
    ordered.push(row)
  }
  for (const row of rows) visit(row)
  return ordered
}

async function exists(collection, record) {
  if (typeof record.id === 'string') {
    try { await api('GET', `/items/${collection}/${record.id}?fields=id`); return true } catch (e) { if (e.status === 403 || e.status === 404) return false; throw e }
  }
  // Junction rows: match on the two FK columns.
  const fks = Object.keys(record).filter((k) => k.endsWith('_id'))
  const q = fks.map((k) => `filter[${k}][_eq]=${record[k]}`).join('&')
  return (await api('GET', `/items/${collection}?${q}&limit=1&fields=id`)).length > 0
}

const totals = {}
for (const collection of ORDER) {
  const path = join(source, `${collection}.json`)
  if (!existsSync(path)) { console.log(`- ${collection} (no file)`); continue }
  const rows = parentFirst(read(collection))
  let created = 0
  for (const row of rows) {
    if (await exists(collection, row)) { console.log(`= ${collection} ${row.id}`); continue }
    const payload = { ...row }
    for (const f of FILE_FIELDS[collection] ?? []) payload[f] = await fileIdFor(row[f])
    if (typeof payload.id === 'number') delete payload.id // junction ids are autoincrement
    const keep = await keepFieldsFor(collection)
    for (const k of Object.keys(payload)) if (!keep.has(k)) delete payload[k]
    await api('POST', `/items/${collection}`, payload)
    console.log(`+ ${collection} ${row.id}`)
    created += 1
  }
  totals[collection] = `${created} created / ${rows.length} in source`
}
console.table(totals)
console.log('done')
