import type { ArchiveSnapshot } from '~/types/content'
import { createArchiveClient } from '~/utils/directusClient'
import { takeArchiveLoad } from '~/utils/archivePreload'
import { loadArchive } from '~/utils/loadArchive'

/** The one store of the archive; null until it has arrived. */
const archiveState = () => useState<ArchiveSnapshot | null>('archive', () => null)

/**
 * Loads the whole archive from Directus once per page load and shares it through
 * useState('archive'), the single store useArchiveSnapshot() reads. Called in
 * app.vue without waiting: the start page (page meta `archiveOptional`) renders
 * at once and fills in when the data arrives; every other page waits for it.
 * loadArchive asks a failed request again twice before `error` is set.
 * The snapshot is markRaw: nothing changes it after loading, and deep reactivity made every
 * resolver pass about 8× slower; replacing the whole value still updates every reader.
 */
export function useArchiveSource() {
  const config = useRuntimeConfig()
  const archive = archiveState()
  const client = createArchiveClient(config.public.directusUrl)

  const { error } = useAsyncData('archive', async () => {
    archive.value = markRaw(await (takeArchiveLoad() ?? loadArchive(client)))
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
  venuesWebsites: [],
  quotes: [],
  news: [],
  exhibitionsNews: [],
  newsVenues: [],
  newsPersons: [],
  newsOrganisations: [],
  newsSponsors: [],
  events: [],
  eventEditions: [],
  eventOrganisers: [],
  eventsWebsites: [],
  eventsNews: []
}

/** The archive, empty until it has arrived. Read it inside `computed` so it fills in. */
export const useArchiveSnapshot = () => {
  const archive = archiveState()
  return computed(() => archive.value ?? EMPTY_ARCHIVE)
}

/** True once the archive has arrived. */
export const useArchiveReady = () => {
  const archive = archiveState()
  return computed(() => archive.value !== null)
}
