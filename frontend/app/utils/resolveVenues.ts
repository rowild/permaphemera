import type { LocationRecord, OrganisationRecord, OrganisationVenueRelation, OrganisationVenueRelationRecord, VenueRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'

/** A venue named by slug and title, for "part of" and "spaces" links. */
export interface VenueRef {
  slug: string
  name: string
}

/** An organisation that runs the venue, sits there or exhibits there as a guest. */
export interface VenueOrganisationLink {
  slug: string
  title: string
  relation: OrganisationVenueRelation
}

export interface ResolvedVenue {
  id: string
  slug: string
  name: string
  /** The venue this one belongs to organisationally, when that venue is visible. */
  part_of?: VenueRef
  /** Visible venues that name this one as their parent. */
  spaces: VenueRef[]
  organisations: VenueOrganisationLink[]
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
  city_name: string
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
  locations: LocationRecord[],
  venues: VenueRecord[],
  locale: string,
  venueRelations: OrganisationVenueRelationRecord[] = [],
  organisations: OrganisationRecord[] = []
): ResolvedVenue[] => {
  const locationById = new Map(locations.map((location) => [location.id, location]))
  const organisationById = new Map(organisations.filter(isVisible).map((organisation) => [organisation.id, organisation]))
  const organisationsByVenue = new Map<string, VenueOrganisationLink[]>()
  for (const row of venueRelations.filter(isVisible).sort((a, b) => a.sort - b.sort)) {
    const organisation = organisationById.get(row.organisation)
    if (!organisation) continue
    const rows = organisationsByVenue.get(row.venue) ?? []
    rows.push({ slug: organisation.slug, title: organisation.title, relation: row.relation })
    organisationsByVenue.set(row.venue, rows)
  }
  const visible = venues.filter(isVisible)
  const refById = new Map(visible.map((venue) => [venue.id, { slug: venue.slug, name: venue.title }]))

  return visible.map((venue) => {
    const location = locationById.get(venue.location)
    if (!location) throw new Error(`pp_venues.json: ${venue.id} references unknown location ${venue.location}`)
    const text = pickTranslation(venue, locale)

    return {
      id: venue.id,
      slug: venue.slug,
      name: venue.title,
      part_of: venue.part_of ? refById.get(venue.part_of) : undefined,
      spaces: visible.filter((candidate) => candidate.part_of === venue.id).map((candidate) => refById.get(candidate.id)!),
      organisations: organisationsByVenue.get(venue.id) ?? [],
      type: venue.type,
      address: venue.address,
      website_url: venue.website_url ?? undefined,
      image: venue.image,
      image_alt: venue.image_alt,
      hero_image: venue.hero_image ?? undefined,
      hero_image_alt: venue.hero_image_alt ?? undefined,
      archive_number: venue.archive_number,
      featured: venue.featured,
      city: location.title,
      city_name: location.title,
      postal_code: location.postal_code,
      state: location.state,
      country: location.country,
      latitude: venue.latitude ?? undefined,
      longitude: venue.longitude ?? undefined,
      city_latitude: location.latitude,
      city_longitude: location.longitude,
      description: (text.description as string) || undefined,
      lede: (text.lede as string) || undefined,
      about: (text.about as string[]) || undefined,
      image_caption: (text.image_caption as string) || undefined,
      coordinate_label: (text.coordinate_label as string) || undefined
    }
  })
}
