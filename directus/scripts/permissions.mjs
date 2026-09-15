// directus/scripts/permissions.mjs
// Public (no token) read access for the site. Idempotent by (policy, collection, action).
//   node scripts/permissions.mjs [--reset]
import { loadEnv, login } from './lib.mjs'
import { col } from './naming.mjs'
import { entities } from './schema.mjs'

const { api } = await login(loadEnv())
const reset = process.argv.includes('--reset')

const policies = await api('GET', '/policies?filter[name][_eq]=$t:public_label&fields=id')
const publicPolicy = policies[0]?.id
if (!publicPolicy) throw new Error('no public policy ($t:public_label) found')

const collections = (await api('GET', '/collections')).map((c) => c.collection)
const targets = [
  ...collections.filter((n) => n.startsWith('pp_') && n !== col('meta') && n !== col('archive')),
  'languages',
  'directus_files',
]
// Every entity table carries `status`; structural tables (mm__, translations__) do not.
const statusOf = new Set(Object.keys(entities).map((k) => col(k)))

const existing = await api('GET', `/permissions?filter[policy][_eq]=${publicPolicy}&filter[action][_eq]=read&limit=-1&fields=id,collection`)
const byCollection = new Map(existing.map((p) => [p.collection, p.id]))

if (reset) {
  for (const t of targets) {
    if (byCollection.has(t)) { await api('DELETE', `/permissions/${byCollection.get(t)}`); console.log(`- ${t}`); byCollection.delete(t) }
  }
}

for (const t of targets) {
  if (byCollection.has(t)) { console.log(`= ${t}`); continue }
  const permissions = statusOf.has(t) ? { status: { _neq: 'archived' } } : {}
  await api('POST', '/permissions', { policy: publicPolicy, collection: t, action: 'read', fields: ['*'], permissions, validation: null, presets: null })
  console.log(`+ ${t}`)
}
console.log('done')
