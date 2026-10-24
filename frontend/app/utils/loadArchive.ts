import type { ArchiveSnapshot } from '~/types/content'
import type { ArchiveClient } from '~/utils/directusClient'
import { COLLECTIONS, fieldsQuery, withFileUrls } from '../../shared/archive-schema.mjs'

/**
 * Fetch every collection the site reads, in the JSON item shape, with file ids turned into asset URLs.
 * Each file field also gets `<field>_placeholder`: true when the file is a placeholder (`placeholder-…`),
 * so preview sections can leave records without a real image out, and `<field>_type`, its MIME type.
 */
export const loadArchive = async (client: ArchiveClient): Promise<ArchiveSnapshot> => {
  const entries = await Promise.all(Object.entries(COLLECTIONS).map(async ([key, collection]) => {
    let rows: Record<string, unknown>[]
    try {
      rows = await client.items<Record<string, unknown>>(collection, { fields: fieldsQuery(collection), limit: '-1', sort: 'sort' })
    } catch (error) {
      throw new Error(`${collection}: ${(error as Error).message.replace(new RegExp(`^${collection}: `), '')}`)
    }
    return [key, rows.map((row) => withFileUrls(client.baseUrl, collection, row))] as const
  }))
  return Object.fromEntries(entries) as unknown as ArchiveSnapshot
}
