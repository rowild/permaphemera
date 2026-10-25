import type { ArchiveSnapshot } from '~/types/content'
import type { ArchiveClient } from '~/utils/directusClient'
import { COLLECTIONS, fieldsQuery, withFileUrls } from '../../shared/archive-schema.mjs'

/** Further tries of a failed request before the archive counts as unavailable. */
const RETRIES = 2

/** The pause before further try number `attempt` (1, 2): 0.6 s, then 1.5 s. */
export const retryPauseMs = (attempt: number) => (attempt <= 1 ? 600 : 1500)

const wait = (attempt: number) => new Promise<void>((resolve) => setTimeout(resolve, retryPauseMs(attempt)))

export interface LoadArchiveOptions {
  /** Waits before further try number `attempt`; the tests pass one that does not wait. */
  pause?: (attempt: number) => Promise<void>
}

/**
 * Fetch every collection the site reads, in the JSON item shape, with file ids turned into asset URLs.
 * Each file field also gets `<field>_placeholder`: true when the file is a placeholder (`placeholder-…`),
 * so preview sections can leave records without a real image out, and `<field>_type`, its MIME type.
 *
 * A failed request is asked again up to twice, alone, after a short pause: one dropped
 * request on a phone connection must not show the "archive unavailable" page.
 */
export const loadArchive = async (client: ArchiveClient, { pause = wait }: LoadArchiveOptions = {}): Promise<ArchiveSnapshot> => {
  const fetchRows = async (collection: string) => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await client.items<Record<string, unknown>>(collection, { fields: fieldsQuery(collection), limit: '-1', sort: 'sort' })
      } catch (error) {
        if (attempt >= RETRIES) throw new Error(`${collection}: ${(error as Error).message.replace(new RegExp(`^${collection}: `), '')}`)
        await pause(attempt + 1)
      }
    }
  }
  const entries = await Promise.all(Object.entries(COLLECTIONS).map(async ([key, collection]) => {
    const rows = await fetchRows(collection)
    return [key, rows.map((row) => withFileUrls(client.baseUrl, collection, row))] as const
  }))
  return Object.fromEntries(entries) as unknown as ArchiveSnapshot
}
