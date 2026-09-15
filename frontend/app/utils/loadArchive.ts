import type { ArchiveSnapshot } from '~/types/content'
import type { ArchiveClient } from '~/utils/directusClient'
import { COLLECTIONS, FILE_FIELDS, TRANSLATED, assetUrl } from '../../shared/archive-schema.mjs'

/** Fetch every collection the site reads, in the JSON item shape, with file ids turned into asset URLs. */
export const loadArchive = async (client: ArchiveClient): Promise<ArchiveSnapshot> => {
  const entries = await Promise.all(Object.entries(COLLECTIONS).map(async ([key, collection]) => {
    const fields = TRANSLATED.has(collection) ? '*,translations.*' : '*'
    let rows: Record<string, unknown>[]
    try {
      rows = await client.items<Record<string, unknown>>(collection, { fields, limit: '-1', sort: 'sort' })
    } catch (error) {
      throw new Error(`${collection}: ${(error as Error).message.replace(new RegExp(`^${collection}: `), '')}`)
    }
    const fileFields = FILE_FIELDS[collection] ?? []
    const converted = fileFields.length === 0
      ? rows
      : rows.map((row) => {
          const next = { ...row }
          for (const field of fileFields) next[field] = assetUrl(client.baseUrl, row[field])
          return next
        })
    return [key, converted] as const
  }))
  return Object.fromEntries(entries) as unknown as ArchiveSnapshot
}
