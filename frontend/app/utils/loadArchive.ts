import type { ArchiveSnapshot } from '~/types/content'
import type { ArchiveClient } from '~/utils/directusClient'
import { COLLECTIONS, FILE_FIELDS, TRANSLATED, assetUrl, isPlaceholderFile } from '../../shared/archive-schema.mjs'

/**
 * Fetch every collection the site reads, in the JSON item shape, with file ids turned into asset URLs.
 * Each file field also gets `<field>_placeholder`: true when the file is a placeholder (`placeholder-…`),
 * so preview sections can leave records without a real image out.
 */
export const loadArchive = async (client: ArchiveClient): Promise<ArchiveSnapshot> => {
  const entries = await Promise.all(Object.entries(COLLECTIONS).map(async ([key, collection]) => {
    const fileFields = FILE_FIELDS[collection] ?? []
    const fields = [TRANSLATED.has(collection) ? '*,translations.*' : '*', ...fileFields.map((field) => `${field}.id,${field}.filename_download`)].join(',')
    let rows: Record<string, unknown>[]
    try {
      rows = await client.items<Record<string, unknown>>(collection, { fields, limit: '-1', sort: 'sort' })
    } catch (error) {
      throw new Error(`${collection}: ${(error as Error).message.replace(new RegExp(`^${collection}: `), '')}`)
    }
    const converted = fileFields.length === 0
      ? rows
      : rows.map((row) => {
          const next = { ...row }
          for (const field of fileFields) {
            next[field] = assetUrl(client.baseUrl, row[field])
            next[`${field}_placeholder`] = isPlaceholderFile(row[field])
          }
          return next
        })
    return [key, converted] as const
  }))
  return Object.fromEntries(entries) as unknown as ArchiveSnapshot
}
