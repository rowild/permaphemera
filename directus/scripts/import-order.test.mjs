// directus/scripts/import-order.test.mjs
// The restore (import.mjs) writes the collections in IMPORT_ORDER. A collection missing from the
// list is silently not restored (organisations, news and six junctions were missing until
// 2026-11-04), and a collection before the one it points to fails its foreign key.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildAll } from './build.mjs'
import { IMPORT_ORDER } from './import-order.mjs'

const { collections, relations } = buildAll()
const structural = (name) => name.startsWith('pp_translations__') || ['pp_meta', 'pp_archive', 'languages'].includes(name)
const dataCollections = collections.filter((c) => c.schema !== null && !structural(c.collection)).map((c) => c.collection)

test('every data collection is restored', () => {
  assert.deepEqual([...IMPORT_ORDER].sort(), [...dataCollections].sort())
})

test('a collection is restored after every collection it points to', () => {
  for (const r of relations) {
    if (!IMPORT_ORDER.includes(r.collection) || !IMPORT_ORDER.includes(r.related_collection)) continue
    if (r.collection === r.related_collection) continue // self reference (navigation item parent): import.mjs orders parents first
    assert.ok(IMPORT_ORDER.indexOf(r.related_collection) < IMPORT_ORDER.indexOf(r.collection), `${r.collection}.${r.field} -> ${r.related_collection}`)
  }
})
