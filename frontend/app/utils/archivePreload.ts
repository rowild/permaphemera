import type { ArchiveSnapshot } from '~/types/content'
import { createArchiveClient } from '~/utils/directusClient'
import { loadArchive } from '~/utils/loadArchive'

// The archive request starts as early as the app starts (plugins/archive-preload.client.ts),
// before the language file has loaded; useArchiveSource() takes the running load over.
let early: Promise<ArchiveSnapshot> | undefined

export const startArchiveLoad = (directusUrl: string) => {
  early ??= loadArchive(createArchiveClient(directusUrl))
  // Marked as handled here; the taker still receives the rejection.
  early.catch(() => {})
}

/** The load started early, once; afterwards undefined. */
export const takeArchiveLoad = () => {
  const load = early
  early = undefined
  return load
}
