import type { ArchiveSnapshot } from '~/types/content'
import { createArchiveClient } from '~/utils/directusClient'
import { loadArchive } from '~/utils/loadArchive'

/**
 * Loads the whole archive from Directus once per page load and shares it through
 * useState('archive'), the single store both this composable and useArchive() read.
 * Called (awaited) in app.vue before any page renders, so every page and composable
 * can read the data synchronously, as it did with JSON.
 */
export async function useArchiveSource() {
  const config = useRuntimeConfig()
  const archive = useState<ArchiveSnapshot | null>('archive', () => null)
  const client = createArchiveClient(config.public.directusUrl)

  const { error } = await useAsyncData('archive', async () => {
    archive.value = await loadArchive(client)
    return true
  })

  return { archive, error, directusUrl: client.baseUrl }
}

export const useArchive = (): ArchiveSnapshot => {
  const archive = useState<ArchiveSnapshot | null>('archive')
  if (!archive.value) throw new Error('archive not loaded: call useArchiveSource() in app.vue first')
  return archive.value
}
