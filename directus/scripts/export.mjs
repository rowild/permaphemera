// directus/scripts/export.mjs
// Backup: every pp_ collection and every referenced file into one directory.
//   node scripts/export.mjs [--to <dir>]
import { mkdirSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { loadEnv, login } from './lib.mjs'
import { col, translationsTable } from './naming.mjs'
import { FILE_FIELDS } from '../../frontend/shared/archive-schema.mjs'

const TRANSLATIONS_PREFIX = translationsTable('')

const args = process.argv.slice(2)
const toIndex = args.indexOf('--to')
const target = resolve(toIndex >= 0 ? args[toIndex + 1] : join(import.meta.dirname, '..', '..', '_BU', 'directus-data'))
mkdirSync(join(target, 'files'), { recursive: true })

const { api, base, token } = await login(loadEnv())
const collections = (await api('GET', '/collections')).map((c) => c.collection)
  .filter((n) => n.startsWith('pp_') && n !== col('meta') && n !== col('archive') && !n.startsWith(TRANSLATIONS_PREFIX))

const fileIds = new Set()
const counts = {}
for (const c of collections) {
  const fields = await api('GET', `/fields/${c}`)
  const hasTranslations = fields.some((f) => f.field === 'translations')
  // Real columns only: reverse-relation alias fields (schema: null) — e.g. participations,
  // statements, further_venues, sponsors, venues, exhibitions, persons, roles, locations,
  // items, children — are not part of the item shape and must never be written or restored.
  const keep = new Set(fields.filter((f) => f.schema !== null).map((f) => f.field))
  if (hasTranslations) keep.add('translations')
  const rows = await api('GET', `/items/${c}?limit=-1&sort=sort&fields=*${hasTranslations ? ',translations.*' : ''}`)
  for (const row of rows) {
    if (hasTranslations) row.translations = row.translations.map(({ id, [`${c.replace(/^pp_/, '')}_id`]: _h, ...rest }) => rest)
    for (const k of ['user_created', 'user_updated', 'date_created', 'date_updated']) delete row[k]
    for (const f of FILE_FIELDS[c] ?? []) if (row[f]) fileIds.add(row[f])
    for (const k of Object.keys(row)) if (!keep.has(k)) delete row[k]
  }
  writeFileSync(join(target, `${c}.json`), JSON.stringify(rows, null, 2) + '\n')
  counts[c] = rows.length
}

const languageRows = await api('GET', '/items/languages?fields=*')
writeFileSync(join(target, 'languages.json'), JSON.stringify(languageRows, null, 2) + '\n')

// Branding files are exported for completeness. A restore never re-applies them on its own —
// apply-settings.mjs re-uploads branding itself — a file only comes back here when some other
// record (e.g. pp_sponsors.logo) still references it.
const brandingFolder = (await api('GET', '/folders?filter[name][_eq]=branding&limit=1&fields=id'))[0]?.id
if (brandingFolder) for (const f of await api('GET', `/files?filter[folder][_eq]=${brandingFolder}&limit=-1&fields=id`)) fileIds.add(f.id)

const folderPath = new Map()
const folders = await api('GET', '/folders?limit=-1&fields=id,name,parent')
const pathOf = (id) => { if (!id) return ''; if (folderPath.has(id)) return folderPath.get(id); const f = folders.find((x) => x.id === id); const p = f ? [pathOf(f.parent), f.name].filter(Boolean).join('/') : ''; folderPath.set(id, p); return p }

const index = []
for (const id of fileIds) {
  const meta = await api('GET', `/files/${id}?fields=id,title,filename_download,type,folder`)
  const res = await fetch(`${base}/assets/${id}?download`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`download ${id}: ${res.status}`)
  const ext = extname(meta.filename_download) || ''
  writeFileSync(join(target, 'files', `${id}${ext}`), Buffer.from(await res.arrayBuffer()))
  index.push({ id, folder: pathOf(meta.folder), title: meta.title, filename_download: meta.filename_download, type: meta.type })
}
writeFileSync(join(target, 'files.json'), JSON.stringify(index, null, 2) + '\n')
console.table(counts)
console.log(`${index.length} files → ${target}`)
