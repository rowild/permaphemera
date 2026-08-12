import artists from '~/data/artists.json'
import exhibitions from '~/data/exhibitions.json'
import exhibitionsArtists from '~/data/exhibitions_artists.json'
import locations from '~/data/locations.json'
import sponsors from '~/data/sponsors.json'
import venues from '~/data/venues.json'
import type {
  ArtistRecord, CityLocation, ExhibitionArtistLink, ExhibitionRecord, Sponsor, VenueRecord
} from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveVenues } from '~/utils/resolveVenues'

export function useArchiveData() {
  const { locale } = useI18n()

  const visibleLocations = computed(() => (locations as CityLocation[]).filter(isVisible))

  const venuesForLocale = computed(() =>
    resolveVenues(locations as CityLocation[], venues as VenueRecord[], locale.value))

  const exhibitionsForLocale = computed(() => resolveExhibitions(
    exhibitions as ExhibitionRecord[],
    venues as VenueRecord[],
    locations as CityLocation[],
    exhibitionsArtists as ExhibitionArtistLink[],
    artists as ArtistRecord[],
    locale.value
  ))

  return {
    artists: computed(() => (artists as ArtistRecord[]).filter(isVisible)),
    locations: venuesForLocale,
    venues: venuesForLocale,
    locationExhibitions: exhibitionsForLocale,
    sponsors: computed(() => sponsors as Sponsor[])
  }
}
