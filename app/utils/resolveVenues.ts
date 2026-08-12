import type { CityLocation, VenueRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'

export interface ResolvedVenue {
  id: string
  slug: string
  name: string
  type: string
  address: string
  website_url?: string
  image: string
  image_alt: string
  hero_image?: string
  hero_image_alt?: string
  archive_number: string
  featured: boolean
  city: string
  postal_code: string
  state: string
  country: string
  latitude?: number
  longitude?: number
  city_latitude: number
  city_longitude: number
  description?: string
  lede?: string
  about?: string[]
  image_caption?: string
  coordinate_label?: string
}

export const resolveVenues = (
  locations: CityLocation[],
  venues: VenueRecord[],
  locale: string
): ResolvedVenue[] => {
  const locationById = new Map(locations.map((location) => [location.id, location]))

  return venues.filter(isVisible).map((venue) => {
    const location = locationById.get(venue.location_id)
    if (!location) throw new Error(`venues.json: ${venue.id} references unknown location ${venue.location_id}`)
    const text = pickTranslation(venue, locale)

    return {
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      type: venue.type,
      address: venue.address,
      website_url: venue.website_url,
      image: venue.image,
      image_alt: venue.image_alt,
      hero_image: venue.hero_image,
      hero_image_alt: venue.hero_image_alt,
      archive_number: venue.archive_number,
      featured: venue.featured,
      city: location.city_name,
      postal_code: location.postal_code,
      state: location.state,
      country: location.country,
      latitude: venue.latitude,
      longitude: venue.longitude,
      city_latitude: location.latitude,
      city_longitude: location.longitude,
      description: text.description as string | undefined,
      lede: text.lede as string | undefined,
      about: text.about as string[] | undefined,
      image_caption: text.image_caption as string | undefined,
      coordinate_label: text.coordinate_label as string | undefined
    }
  })
}
