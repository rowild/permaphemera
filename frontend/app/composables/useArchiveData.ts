import { buildArtistDirectory } from '~/utils/artistDirectory'
import { isVisible } from '~/utils/contentStatus'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveOrganisations } from '~/utils/resolveOrganisations'
import { resolveVenues } from '~/utils/resolveVenues'

export function useArchiveData() {
  const archive = useArchive()
  const { locale } = useI18n()

  const venuesForLocale = computed(() =>
    resolveVenues(archive.locations, archive.venues, locale.value, archive.organisationVenueRelations, archive.organisations))

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
    archive.personsWebsites,
    archive.exhibitionOrganisers,
    archive.organisations
  ))

  const organisationsForLocale = computed(() => resolveOrganisations(
    archive.organisations,
    archive.locations,
    archive.venues,
    archive.persons,
    archive.organisationMemberships,
    archive.organisationVenueRelations,
    archive.exhibitionOrganisers,
    exhibitionsForLocale.value,
    archive.websites,
    archive.organisationsWebsites,
    locale.value
  ))

  const artistDirectory = computed(() => buildArtistDirectory(
    archive.persons.filter(isVisible),
    exhibitionsForLocale.value,
    archive.participations,
    archive.personRoles,
    archive.roles,
    archive.organisationMemberships,
    archive.organisations,
    locale.value
  ))

  return {
    venues: venuesForLocale,
    venueExhibitions: exhibitionsForLocale,
    sponsors: computed(() => archive.sponsors.filter(isVisible)),
    organisations: organisationsForLocale,
    artistDirectory
  }
}
