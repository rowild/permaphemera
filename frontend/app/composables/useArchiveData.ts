import exhibitionStatements from '~/data/pp_exhibition_statements.json'
import exhibitions from '~/data/pp_exhibitions.json'
import locations from '~/data/pp_locations.json'
import participations from '~/data/pp_exhibition_participations.json'
import personRoles from '~/data/pp_mm__persons_roles.json'
import persons from '~/data/pp_persons.json'
import roles from '~/data/pp_roles.json'
import sponsors from '~/data/pp_sponsors.json'
import venues from '~/data/pp_venues.json'
import type {
  ExhibitionRecord, ExhibitionStatement, LocationRecord, ParticipationRecord, PersonRecord, PersonRoleLink, RoleRecord, SponsorRecord, VenueRecord
} from '~/types/content'
import { buildArtistDirectory } from '~/utils/artistDirectory'
import { isVisible } from '~/utils/contentStatus'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveVenues } from '~/utils/resolveVenues'

export function useArchiveData() {
  const { locale } = useI18n()

  const venuesForLocale = computed(() =>
    resolveVenues(locations as LocationRecord[], venues as VenueRecord[], locale.value))

  const exhibitionsForLocale = computed(() => resolveExhibitions(
    exhibitions as ExhibitionRecord[],
    venues as VenueRecord[],
    locations as LocationRecord[],
    participations as ParticipationRecord[],
    persons as PersonRecord[],
    roles as RoleRecord[],
    locale.value,
    exhibitionStatements as ExhibitionStatement[]
  ))

  const artistDirectory = computed(() => buildArtistDirectory(
    (persons as PersonRecord[]).filter(isVisible),
    exhibitionsForLocale.value,
    participations as ParticipationRecord[],
    personRoles as PersonRoleLink[],
    roles as RoleRecord[]
  ))

  return {
    venues: venuesForLocale,
    venueExhibitions: exhibitionsForLocale,
    sponsors: computed(() => (sponsors as SponsorRecord[]).filter(isVisible)),
    artistDirectory
  }
}
