import { buildArtistDirectory } from '~/utils/artistDirectory'
import { isVisible } from '~/utils/contentStatus'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveOrganisations } from '~/utils/resolveOrganisations'
import { resolvePersons } from '~/utils/resolvePersons'
import { resolveSponsors } from '~/utils/resolveSponsors'
import { resolveVenues } from '~/utils/resolveVenues'

export function useArchiveData() {
  const archive = useArchive()
  const { locale } = useI18n()

  const venuesForLocale = computed(() =>
    resolveVenues(archive.locations, archive.venues, locale.value, archive.organisationVenueRelations, archive.organisations, archive.websites, archive.venuesWebsites))

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
    locale.value,
    archive.websites,
    archive.personsWebsites
  ))

  // Every published person with a page at /persons/<slug>/.
  const personsForLocale = computed(() => resolvePersons({
    persons: archive.persons,
    roles: archive.roles,
    personRoles: archive.personRoles,
    participations: archive.participations,
    exhibitions: exhibitionsForLocale.value,
    statements: archive.statements,
    memberships: archive.organisationMemberships,
    organisations: archive.organisations,
    venues: archive.venues,
    personsVenues: archive.personsVenues,
    websites: archive.websites,
    personsWebsites: archive.personsWebsites,
    locale: locale.value
  }))

  // Every published sponsor with a page at /sponsors/<slug>/. `sponsors` below stays the plain list for the footer.
  const sponsorPagesForLocale = computed(() => resolveSponsors({
    sponsors: archive.sponsors,
    exhibitions: exhibitionsForLocale.value,
    venues: archive.venues,
    persons: archive.persons,
    locations: archive.locations,
    exhibitionsSponsors: archive.exhibitionsSponsors,
    sponsorsVenues: archive.sponsorsVenues,
    personsSponsors: archive.personsSponsors,
    locationsSponsors: archive.locationsSponsors,
    locale: locale.value
  }))

  return {
    venues: venuesForLocale,
    venueExhibitions: exhibitionsForLocale,
    sponsors: computed(() => archive.sponsors.filter(isVisible)),
    organisations: organisationsForLocale,
    artistDirectory,
    persons: personsForLocale,
    sponsorPages: sponsorPagesForLocale
  }
}
