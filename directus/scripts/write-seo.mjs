// directus/scripts/write-seo.mjs
// Writes hand-written SEO titles and descriptions into the `seo` fields: English into the record
// and its `en` translation, German into the `de` translation (created when a record has none).
// Share image, robots and sitemap settings already stored stay untouched.
//
//   DIRECTUS_ENV_FILE=.env.remote node scripts/write-seo.mjs ../directus/seo/<file>.json [--dry-run]
//
// The file: [{ collection: 'exhibitions'|'venues'|'persons'|'organisations'|'sponsors', slug,
//              en: { title, meta_description }, de: { title, meta_description } }]
import { readFileSync } from 'node:fs'
import { loadEnv, login } from './lib.mjs'
import { COLLECTION_OF, mergeSeo, validateSeoTexts } from './seo-texts.mjs'

const file = process.argv[2]
const dryRun = process.argv.includes('--dry-run')
if (!file) throw new Error('usage: node scripts/write-seo.mjs <file.json> [--dry-run]')

const items = JSON.parse(readFileSync(file, 'utf8'))
const errors = validateSeoTexts(items)
if (errors.length) {
  console.error(`${errors.length} problems in ${file}:\n  ${errors.join('\n  ')}`)
  process.exit(1)
}

const { api } = await login(loadEnv())
let written = 0
for (const item of items) {
  const collection = COLLECTION_OF[item.collection]
  const [record] = await api('GET', `/items/${collection}?filter[slug][_eq]=${encodeURIComponent(item.slug)}&fields=id,seo,translations.id,translations.languages_code,translations.seo&limit=1`)
  if (!record) { console.error(`! ${item.collection}/${item.slug}: no such record`); process.exitCode = 1; continue }
  const entry = (code) => record.translations.find((translation) => translation.languages_code === code)
  const update = []
  const create = []
  for (const code of ['en', 'de']) {
    const current = entry(code)
    if (current) update.push({ id: current.id, seo: mergeSeo(current.seo, item[code]) })
    else create.push({ languages_code: code, seo: mergeSeo(null, item[code]) })
  }
  const payload = { seo: mergeSeo(record.seo, item.en), translations: { create, update, delete: [] } }
  if (dryRun) { console.log(`~ ${item.collection}/${item.slug}${create.length ? ` (+${create.map((c) => c.languages_code).join(', ')} entry)` : ''}`); continue }
  await api('PATCH', `/items/${collection}/${record.id}`, payload)
  written += 1
}
console.log(dryRun ? `${items.length} records checked, nothing written (--dry-run)` : `${written} records written`)
