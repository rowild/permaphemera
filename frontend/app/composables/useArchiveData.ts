import { buildArtistDirectory } from '~/utils/artistDirectory'
import { isVisible } from '~/utils/contentStatus'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveVenues } from '~/utils/resolveVenues'

export function useArchiveData() {
  const archive = useArchive()
  const { locale } = useI18n()

  const venuesForLocale = computed(() =>
    resolveVenues(archive.locations, archive.venues, locale.value))

  const exhibitionsForLocale = computed(() => resolveExhibitions(
    archive.exhibitions,
    archive.venues,
    archive.locations,
    archive.participations,
    archive.persons,
    archive.roles,
    locale.value,
    archive.statements,
    archive.websites,
    archive.exhibitionsWebsites,
    archive.personsWebsites
  ))

  const artistDirectory = computed(() => buildArtistDirectory(
    archive.persons.filter(isVisible),
    exhibitionsForLocale.value,
    archive.participations,
    archive.personRoles,
    archive.roles
  ))

  return {
    venues: venuesForLocale,
    venueExhibitions: exhibitionsForLocale,
    sponsors: computed(() => archive.sponsors.filter(isVisible)),
    artistDirectory
  }
}
