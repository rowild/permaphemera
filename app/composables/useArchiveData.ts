import artists from '~/data/artists.json'
import exhibitions from '~/data/exhibitions.json'
import locations from '~/data/locations.json'
import locationExhibitions from '~/data/location-exhibitions.json'
import sponsors from '~/data/sponsors.json'
import venues from '~/data/venues.json'
import type { Artist, Exhibition, Location, LocationExhibition, Sponsor, Venue } from '~/types/content'

export function useArchiveData() {
  return {
    artists: artists as Artist[],
    exhibitions: exhibitions as Exhibition[],
    locations: locations as Location[],
    locationExhibitions: locationExhibitions as LocationExhibition[],
    sponsors: sponsors as Sponsor[],
    venues: venues as Venue[]
  }
}
