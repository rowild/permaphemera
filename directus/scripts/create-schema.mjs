// directus/scripts/create-schema.mjs
// Creates every collection, field and relation from build.mjs. Idempotent:
// existing collections, fields and relations are left alone (they are not
// updated — change the schema by editing schema.mjs and re-running this script).
//
//   node scripts/create-schema.mjs
import { buildAll } from './build.mjs'
import { loadEnv, login } from './lib.mjs'
import { col } from './naming.mjs'
import { SCHEMA_VERSION } from './schema.mjs'

const { api } = await login(loadEnv())
const { collections, relations } = buildAll()

async function exists(path) {
  try { await api('GET', path); return true } catch (e) { if (e.status === 403 || e.status === 404) return false; throw e }
}

for (const c of collections) {
  if (await exists(`/collections/${c.collection}`)) {
    // Folder collections (schema: null) have no underlying table, so
    // /fields/<name> 403s on them — there is nothing to diff.
    if (c.schema === null) { console.log(`= ${c.collection}`); continue }
    // Add fields that are missing on an existing collection (e.g. after a schema edit).
    const live = await api('GET', `/fields/${c.collection}`)
    const liveNames = new Set(live.map((f) => f.field))
    let added = 0
    for (const f of c.fields) {
      if (liveNames.has(f.field)) continue
      await api('POST', `/fields/${c.collection}`, f)
      added += 1
    }
    console.log(`= ${c.collection}${added ? ` (+${added} fields)` : ''}`)
    continue
  }
  const payload = c.schema === null
    ? { collection: c.collection, meta: c.meta, schema: null }
    : { collection: c.collection, meta: c.meta, schema: c.schema, fields: c.fields }
  await api('POST', '/collections', payload)
  console.log(`+ ${c.collection}${c.schema === null ? ' (folder)' : ` (${c.fields.length} fields)`}`)
}

for (const r of relations) {
  if (await exists(`/relations/${r.collection}/${r.field}`)) { console.log(`= ${r.collection}.${r.field}`); continue }
  await api('POST', '/relations', r)
  console.log(`+ ${r.collection}.${r.field} -> ${r.related_collection}`)
}

await api('PATCH', `/items/${col('meta')}`, { schema_version: SCHEMA_VERSION, applied_at: new Date().toISOString() })
console.log(`${col('meta')}: schema_version ${SCHEMA_VERSION}`)
console.log('done')
