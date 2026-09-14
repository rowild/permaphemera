// directus/scripts/check-conventions.mjs
// Reads the LIVE schema and asserts the house rules from
// _Plans/directus-schema-conventions.md. Exit 1 on the first group of failures.
//   node scripts/check-conventions.mjs
import { loadEnv, login } from './lib.mjs'
import { isValidName } from './naming.mjs'

const { api } = await login(loadEnv())
const collections = (await api('GET', '/collections')).filter((c) => c.collection.startsWith('pp_'))
const fields = (await api('GET', '/fields')).filter((f) => f.collection.startsWith('pp_'))
const relations = (await api('GET', '/relations')).filter((r) => r.collection.startsWith('pp_'))

const failures = []
const check = (ok, msg) => { if (!ok) failures.push(msg) }

const isStructural = (n) => /^pp_(mm__|m2a__|translations__)/.test(n)
const isFolder = (c) => c.schema === null
const fieldsOf = (n) => fields.filter((f) => f.collection === n)
const has = (n, f) => fieldsOf(n).some((x) => x.field === f)
const SIX = ['status', 'sort', 'user_created', 'date_created', 'user_updated', 'date_updated']

for (const c of collections) {
  const n = c.collection
  check(isValidName(n), `name violates §1: ${n}`)
  check(c.meta?.color === '#a6523c', `missing colour: ${n}`)
  check(Boolean(c.meta?.translations?.[0]?.translation), `missing label: ${n}`)
  if (isFolder(c) || n === 'pp_meta') continue

  if (isStructural(n)) {
    for (const f of SIX.filter((x) => x !== 'sort')) check(!has(n, f), `structural table carries ${f}: ${n}`)
    check(!fieldsOf(n).some((f) => f.field.startsWith('ui_')), `structural table has layout fields: ${n}`)
    check(c.meta.hidden === true, `structural table not hidden: ${n}`)
    check(Boolean(c.meta.group), `structural table loose at root: ${n}`)
  } else {
    for (const f of SIX) check(has(n, f), `entity misses ${f}: ${n}`)
    check(c.meta.archive_field === 'status', `archive not on status: ${n}`)
    const top = fieldsOf(n).filter((f) => f.meta?.group == null).sort((a, b) => a.meta.sort - b.meta.sort).map((f) => f.field)
    if (c.meta.group === 'pp_archive') {
      const expected = has(n, 'translations') ? ['ui_accordion_main', 'ui_accordion_translations', 'ui_group_system'] : ['ui_accordion_main', 'ui_group_system']
      check(JSON.stringify(top) === JSON.stringify(expected), `main layout skeleton wrong: ${n} -> ${top.join(', ')}`)
    } else {
      check(top.at(-1) === 'ui_group_system', `child layout must end with ui_group_system: ${n}`)
    }
    const status = fieldsOf(n).find((f) => f.field === 'status')
    const values = status?.meta?.options?.choices?.map((x) => x.value).sort()
    check(JSON.stringify(values) === JSON.stringify(['archived', 'draft', 'published']), `status choices wrong: ${n}`)
  }
}

for (const r of relations) {
  check(r.schema?.on_delete !== 'NO ACTION', `NO ACTION on ${r.collection}.${r.field}`)
  if (isStructural(r.collection)) check(r.schema?.on_delete === 'CASCADE', `structural FK not CASCADE: ${r.collection}.${r.field}`)
  if (['directus_users', 'directus_files'].includes(r.related_collection)) check(r.schema?.on_delete === 'SET NULL', `system FK not SET NULL: ${r.collection}.${r.field}`)
}

// Sidebar sort contiguous per parent.
const byGroup = new Map()
for (const c of collections) byGroup.set(c.meta?.group ?? '(root)', [...(byGroup.get(c.meta?.group ?? '(root)') ?? []), c])
for (const [g, list] of byGroup) {
  if (g === '(root)') continue
  const sorts = list.map((c) => c.meta.sort).sort((a, b) => a - b)
  check(sorts.every((s, i) => s === i + 1), `sidebar sort not contiguous under ${g}: ${sorts.join(',')}`)
}

if (failures.length) {
  console.error(`Conventions check failed (${failures.length}):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`Conventions OK: ${collections.length} collections, ${fields.length} fields, ${relations.length} relations.`)
