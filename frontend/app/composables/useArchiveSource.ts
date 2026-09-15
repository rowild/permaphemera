import type { ArchiveSnapshot } from '~/types/content'
import { createArchiveClient } from '~/utils/directusClient'
import { loadArchive } from '~/utils/loadArchive'

/**
 * Loads the whole archive from Directus once per page load and shares it through
 * useState('archive'). Called (awaited) in app.vue before any page renders, so
 * every page and composable can read the data synchronously, as it did with JSON.
 */
export async function useArchiveSource() {
  const config = useRuntimeConfig()
  const archive = useState<ArchiveSnapshot | null>('archive', () => null)
  const client = createArchiveClient(config.public.directusUrl)

  const { error, refresh } = await useAsyncData('archive', async () => {
    const snapshot = await loadArchive(client)
    archive.value = snapshot
    return snapshot
  })

  return { archive, error, refresh, directusUrl: client.baseUrl }
}

export const useArchive = (): ArchiveSnapshot => {
  const archive = useState<ArchiveSnapshot | null>('archive')
  if (!archive.value) throw new Error('archive not loaded: call useArchiveSource() in app.vue first')
  return archive.value
}
