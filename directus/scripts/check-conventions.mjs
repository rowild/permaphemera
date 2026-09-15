// directus/scripts/check-conventions.mjs
// Reads the LIVE schema and asserts the house rules from
// _Plans/directus-schema-conventions.md. Exit 1 on the first group of failures.
//   node scripts/check-conventions.mjs
import { loadEnv, login } from './lib.mjs'
import { isValidName, translationsTable } from './naming.mjs'

const TRANSLATIONS_PREFIX = translationsTable('')
const FILES_PUBLIC_FIELDS = ['id', 'type', 'title', 'filename_download', 'width', 'height', 'filesize', 'modified_on', 'folder']
const sameJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sameSet = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && b.every((x) => a.includes(x))

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
const fieldByKey = new Map(fields.map((f) => [`${f.collection}.${f.field}`, f]))

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
      check(c.meta.sort_field === null, `sort_field must be null on main: ${n}`)
    } else {
      check(top.at(-1) === 'ui_group_system', `child layout must end with ui_group_system: ${n}`)
      check(c.meta.sort_field === 'sort', `sort_field must be sort on child: ${n}`)
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
  const f = fieldByKey.get(`${r.collection}.${r.field}`)
  check(f?.schema?.is_indexed === true, `FK not indexed: ${r.collection}.${r.field}`)
  check(f?.schema?.is_unique !== true, `unique index on FK: ${r.collection}.${r.field}`)
}

// Public read rule on every pp_ table except the folder and pp_meta, with the right filter shape,
// plus the languages and directus_files rules every public build also needs.
const publicPolicy = (await api('GET', '/policies?filter[name][_eq]=$t:public_label&fields=id'))[0]?.id
if (!publicPolicy) throw new Error('no public policy ($t:public_label) found')
const publicRules = await api('GET', `/permissions?filter[policy][_eq]=${publicPolicy}&filter[action][_eq]=read&limit=-1&fields=collection,permissions,fields`)
const ruleByCollection = new Map(publicRules.map((p) => [p.collection, p]))

for (const c of collections) {
  if (isFolder(c) || c.collection === 'pp_meta') continue
  const n = c.collection
  const rule = ruleByCollection.get(n)
  check(Boolean(rule), `no public read rule: ${n}`)
  if (!rule) continue
  if (isStructural(n)) {
    if (n.startsWith(TRANSLATIONS_PREFIX)) {
      const host = n.slice(TRANSLATIONS_PREFIX.length)
      check(sameJSON(rule.permissions, { [`${host}_id`]: { status: { _neq: 'archived' } } }), `translations public rule wrong filter: ${n}`)
    } else {
      check(sameJSON(rule.permissions, {}), `structural public rule not open: ${n}`)
    }
  } else {
    check(sameJSON(rule.permissions, { status: { _neq: 'archived' } }), `entity public rule wrong filter: ${n}`)
  }
}

check(ruleByCollection.has('languages'), 'no public read rule: languages')
const filesRule = ruleByCollection.get('directus_files')
check(Boolean(filesRule), 'no public read rule: directus_files')
if (filesRule) check(sameSet(filesRule.fields, FILES_PUBLIC_FIELDS), `directus_files public rule fields wrong: ${JSON.stringify(filesRule.fields)}`)

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
