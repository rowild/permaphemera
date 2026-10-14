// directus/scripts/public-rules.mjs
// The public (no token) read filter of every pp_ table. Only published content leaves Directus:
//   - a record with a status is public when it is published (a child with a status also needs
//     its host published);
//   - a relation row (a child without status, an mm__ junction) is public when every record it
//     connects is published;
//   - a translation is public when its host is.
// Shared by permissions.mjs (writes the rules) and check-conventions.mjs (asserts them).
import { entities, junctions } from './schema.mjs'
import { col, fk, mmTable, translationsTable } from './naming.mjs'

const PUBLISHED = { status: { _eq: 'published' } }

const hasStatus = (key) => Boolean(entities[key]) && !entities[key].statusless

// One path per status that decides visibility; a path is the list of relation fields to walk.
const pathsOf = (key) => {
  const e = entities[key]
  if (!e.statusless) return e.kind === 'child' ? [[], [e.hostField]] : [[]]
  return [
    [e.hostField],
    ...e.fields.filter((f) => f.relation && hasStatus(f.relation.related)).map((f) => [f.field]),
  ]
}

const nest = (path) => path.reduceRight((inner, field) => ({ [field]: inner }), PUBLISHED)
const toFilter = (paths) => (paths.length === 1 ? nest(paths[0]) : { _and: paths.map(nest) })

const rules = new Map()
for (const key of Object.keys(entities)) {
  rules.set(col(key), toFilter(pathsOf(key)))
  rules.set(translationsTable(key), toFilter(pathsOf(key).map((path) => [fk(key), ...path])))
}
for (const j of junctions) {
  rules.set(mmTable(j.a, j.b, j.role), toFilter([[fk(j.a)], [fk(j.b)]]))
}

/** The `permissions` filter of the public read rule for one collection ({} = open). */
export const publicReadRule = (collection) => rules.get(collection) ?? {}
