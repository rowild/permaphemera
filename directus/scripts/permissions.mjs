// directus/scripts/permissions.mjs
// Public (no token) read access for the site: only published content (see public-rules.mjs).
// Idempotent by (policy, collection, action); a rule whose filter differs is updated in place.
//   node scripts/permissions.mjs [--reset]
import { loadEnv, login } from './lib.mjs'
import { col } from './naming.mjs'
import { publicReadRule } from './public-rules.mjs'

// Fields Directus exposes for a file without a token: enough to render an <img>/link, never uploaded_by.
const FILES_PUBLIC_FIELDS = ['id', 'type', 'title', 'filename_download', 'width', 'height', 'filesize', 'modified_on', 'folder']

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
const existing = await api('GET', `/permissions?filter[policy][_eq]=${publicPolicy}&filter[action][_eq]=read&limit=-1&fields=id,collection,permissions`)
const byCollection = new Map(existing.map((p) => [p.collection, p.id]))
const filterOf = new Map(existing.map((p) => [p.collection, p.permissions ?? {}]))

if (reset) {
  for (const t of targets) {
    if (byCollection.has(t)) { await api('DELETE', `/permissions/${byCollection.get(t)}`); console.log(`- ${t}`); byCollection.delete(t) }
  }
}

for (const t of targets) {
  const permissions = publicReadRule(t)
  if (byCollection.has(t)) {
    if (JSON.stringify(filterOf.get(t)) === JSON.stringify(permissions)) { console.log(`= ${t}`); continue }
    await api('PATCH', `/permissions/${byCollection.get(t)}`, { permissions })
    console.log(`~ ${t}`)
    continue
  }
  const fields = t === 'directus_files' ? FILES_PUBLIC_FIELDS : ['*']
  await api('POST', '/permissions', { policy: publicPolicy, collection: t, action: 'read', fields, permissions, validation: null, presets: null })
  console.log(`+ ${t}`)
}
console.log('done')
