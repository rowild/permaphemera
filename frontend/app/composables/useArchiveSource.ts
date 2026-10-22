import type { ArchiveSnapshot } from '~/types/content'
import { createArchiveClient } from '~/utils/directusClient'
import { loadArchive } from '~/utils/loadArchive'

/**
 * Loads the whole archive from Directus once per page load and shares it through
 * useState('archive'), the single store useArchiveSnapshot() reads. Called in
 * app.vue without waiting: the start page (page meta `archiveOptional`) renders
 * at once and fills in when the data arrives; every other page waits for it.
 */
export function useArchiveSource() {
  const config = useRuntimeConfig()
  const archive = useState<ArchiveSnapshot | null>('archive', () => null)
  const client = createArchiveClient(config.public.directusUrl)

  const { error } = useAsyncData('archive', async () => {
    archive.value = await loadArchive(client)
    return true
  })

  return { archive, error, directusUrl: client.baseUrl }
}

const EMPTY_ARCHIVE: ArchiveSnapshot = {
  locations: [],
  venues: [],
  persons: [],
  roles: [],
  personRoles: [],
  exhibitions: [],
  participations: [],
  statements: [],
  sponsors: [],
  navigations: [],
  navigationItems: [],
  websites: [],
  exhibitionsVenues: [],
  exhibitionsSponsors: [],
  personsVenues: [],
  personsSponsors: [],
  locationsSponsors: [],
  sponsorsVenues: [],
  exhibitionsWebsites: [],
  personsWebsites: [],
  organisations: [],
  organisationMemberships: [],
  organisationVenueRelations: [],
  exhibitionOrganisers: [],
  organisationsWebsites: [],
  venuesWebsites: []
}

/** The archive, empty until it has arrived. Read it inside `computed` so it fills in. */
export const useArchiveSnapshot = () => {
  const archive = useState<ArchiveSnapshot | null>('archive', () => null)
  return computed(() => archive.value ?? EMPTY_ARCHIVE)
}

/** True once the archive has arrived. */
export const useArchiveReady = () => {
  const archive = useState<ArchiveSnapshot | null>('archive', () => null)
  return computed(() => archive.value !== null)
}
