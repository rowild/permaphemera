import { buildArtistDirectory } from '~/utils/artistDirectory'
import { isVisible } from '~/utils/contentStatus'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveOrganisations } from '~/utils/resolveOrganisations'
import { resolvePersons } from '~/utils/resolvePersons'
import { resolveSponsors } from '~/utils/resolveSponsors'
import { resolveVenues } from '~/utils/resolveVenues'

export function useArchiveData() {
  const archive = useArchiveSnapshot()
  const { locale } = useI18n()

  const venuesForLocale = computed(() =>
    resolveVenues(archive.value.locations, archive.value.venues, locale.value, archive.value.organisationVenueRelations, archive.value.organisations, archive.value.websites, archive.value.venuesWebsites))

  const exhibitionsForLocale = computed(() => resolveExhibitions(
    archive.value.exhibitions,
    archive.value.venues,
    archive.value.locations,
    archive.value.participations,
    archive.value.persons,
    archive.value.roles,
    locale.value,
    archive.value.statements,
    archive.value.websites,
    archive.value.exhibitionsWebsites,
    archive.value.personsWebsites,
    archive.value.exhibitionOrganisers,
    archive.value.organisations
  ))

  const organisationsForLocale = computed(() => resolveOrganisations(
    archive.value.organisations,
    archive.value.locations,
    archive.value.venues,
    archive.value.persons,
    archive.value.organisationMemberships,
    archive.value.organisationVenueRelations,
    archive.value.exhibitionOrganisers,
    exhibitionsForLocale.value,
    archive.value.websites,
    archive.value.organisationsWebsites,
    locale.value
  ))

  const artistDirectory = computed(() => buildArtistDirectory(
    archive.value.persons.filter(isVisible),
    exhibitionsForLocale.value,
    archive.value.participations,
    archive.value.personRoles,
    archive.value.roles,
    archive.value.organisationMemberships,
    archive.value.organisations,
    locale.value,
    archive.value.websites,
    archive.value.personsWebsites
  ))

  // Every published person with a page at /persons/<slug>/.
  const personsForLocale = computed(() => resolvePersons({
    persons: archive.value.persons,
    roles: archive.value.roles,
    personRoles: archive.value.personRoles,
    participations: archive.value.participations,
    exhibitions: exhibitionsForLocale.value,
    statements: archive.value.statements,
    memberships: archive.value.organisationMemberships,
    organisations: archive.value.organisations,
    venues: archive.value.venues,
    personsVenues: archive.value.personsVenues,
    websites: archive.value.websites,
    personsWebsites: archive.value.personsWebsites,
    locale: locale.value
  }))

  // Every published sponsor with a page at /sponsors/<slug>/. `sponsors` below stays the plain list for the footer.
  const sponsorPagesForLocale = computed(() => resolveSponsors({
    sponsors: archive.value.sponsors,
    exhibitions: exhibitionsForLocale.value,
    venues: archive.value.venues,
    persons: archive.value.persons,
    locations: archive.value.locations,
    exhibitionsSponsors: archive.value.exhibitionsSponsors,
    sponsorsVenues: archive.value.sponsorsVenues,
    personsSponsors: archive.value.personsSponsors,
    locationsSponsors: archive.value.locationsSponsors,
    locale: locale.value
  }))

  return {
    venues: venuesForLocale,
    venueExhibitions: exhibitionsForLocale,
    sponsors: computed(() => archive.value.sponsors.filter(isVisible)),
    organisations: organisationsForLocale,
    artistDirectory,
    persons: personsForLocale,
    sponsorPages: sponsorPagesForLocale
  }
}
