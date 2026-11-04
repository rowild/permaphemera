import { buildArtistDirectory } from '~/utils/artistDirectory'
import { isVisible } from '~/utils/contentStatus'
import { eventByExhibition, resolveEvents } from '~/utils/resolveEvents'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveNews } from '~/utils/resolveNews'
import { resolveOrganisations } from '~/utils/resolveOrganisations'
import { resolvePersons } from '~/utils/resolvePersons'
import { resolveSponsors } from '~/utils/resolveSponsors'
import { resolveVenues } from '~/utils/resolveVenues'

type ArchiveData = ReturnType<typeof buildArchiveData>

/**
 * The resolved archive for the pages: one instance per app, built once in its own scope, so the
 * 13 callers share the same computed joins instead of building and computing them again
 * (plans/2026-11-04__nuxt-optimisation-audit.md 3.1). The language is the app's global locale.
 */
export function useArchiveData(): ArchiveData {
  const nuxtApp = useNuxtApp() as ReturnType<typeof useNuxtApp> & { _archiveData?: ArchiveData }
  nuxtApp._archiveData ??= nuxtApp.runWithContext(() => effectScope(true).run(buildArchiveData)!) as ArchiveData
  return nuxtApp._archiveData
}

function buildArchiveData() {
  const archive = useArchiveSnapshot()
  const locale = useNuxtApp().$i18n.locale

  const venuesForLocale = computed(() =>
    resolveVenues(archive.value.locations, archive.value.venues, locale.value, archive.value.organisationVenueRelations, archive.value.organisations, archive.value.websites, archive.value.venuesWebsites, archive.value.persons, archive.value.personsVenues))

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

  // Festivals and museum nights with their editions and exhibitions (plans/2026-11-04__events-collection.md).
  const eventsForLocale = computed(() => resolveEvents({
    events: archive.value.events,
    editions: archive.value.eventEditions,
    organisers: archive.value.eventOrganisers,
    organisations: archive.value.organisations,
    locations: archive.value.locations,
    exhibitions: archive.value.exhibitions,
    websites: archive.value.websites,
    eventsWebsites: archive.value.eventsWebsites,
    locale: locale.value
  }))
  const eventOfExhibition = computed(() => eventByExhibition(eventsForLocale.value))

  // Published news articles, newest first, with their published linked records.
  const newsForLocale = computed(() => resolveNews({
    news: archive.value.news,
    exhibitions: exhibitionsForLocale.value,
    venues: venuesForLocale.value,
    persons: personsForLocale.value,
    organisations: organisationsForLocale.value,
    sponsors: sponsorPagesForLocale.value,
    exhibitionsNews: archive.value.exhibitionsNews,
    newsVenues: archive.value.newsVenues,
    newsPersons: archive.value.newsPersons,
    newsOrganisations: archive.value.newsOrganisations,
    newsSponsors: archive.value.newsSponsors,
    events: eventsForLocale.value,
    eventsNews: archive.value.eventsNews,
    locale: locale.value
  }))

  return {
    venues: venuesForLocale,
    venueExhibitions: exhibitionsForLocale,
    sponsors: computed(() => archive.value.sponsors.filter(isVisible)),
    organisations: organisationsForLocale,
    artistDirectory,
    persons: personsForLocale,
    sponsorPages: sponsorPagesForLocale,
    news: newsForLocale,
    events: eventsForLocale,
    eventOfExhibition
  }
}
