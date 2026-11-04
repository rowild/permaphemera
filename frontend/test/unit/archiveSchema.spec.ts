import { describe, expect, it } from 'vitest'
import { buildAll } from '../../../directus/scripts/build.mjs'
import { COLLECTIONS, FILE_FIELDS, TRANSLATED } from '../../shared/archive-schema.mjs'

// The site's loader keeps its own lists of what to ask Directus for. They must follow the schema
// (directus/scripts/schema.mjs): pp_events was missing from TRANSLATED on 2026-11-04, so its texts
// did not load.
const { collections } = buildAll()
const names = collections.map((collection) => collection.collection)

describe('archive-schema follows the Directus schema', () => {
  it('asks for translations exactly where a collection has them', () => {
    const translated = names.filter((name) => name.startsWith('pp_translations__')).map((name) => `pp_${name.slice('pp_translations__'.length)}`)
    expect([...TRANSLATED].sort()).toEqual(translated.sort())
  })

  it('loads every data collection of the schema', () => {
    const data = names.filter((name) => name.startsWith('pp_') && !name.startsWith('pp_translations__') && !['pp_meta', 'pp_archive'].includes(name))
    expect(Object.values(COLLECTIONS).sort()).toEqual(data.sort())
  })

  it('names only file fields that are files in the schema', () => {
    for (const [collection, fields] of Object.entries(FILE_FIELDS)) {
      const schemaFields = collections.find((entry) => entry.collection === collection)!.fields
      for (const field of fields) expect(schemaFields.find((entry: { field: string }) => entry.field === field)?.meta?.special, `${collection}.${field}`).toContain('file')
    }
  })
})
