import { toRichHtml } from '~/utils/richText'
import type { JunctionRow, LocationRecord, OrganisationRecord, OrganisationVenueRelation, OrganisationVenueRelationRecord, VenueRecord, WebsiteRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { hostnameOf, linksThrough } from '~/utils/externalLinks'
import { pickTranslation } from '~/utils/pickTranslation'
import type { ResolvedLink } from '~/utils/resolveExhibitions'

/** A venue page shows its own website plus further links (social profiles), three at most. */
const MAX_VENUE_LINKS = 3

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
  /** External links: the own website first (if any), then the venue's further links; at most three. */
  links: ResolvedLink[]
  image: string
  image_alt: string
  /** A real photo: an image that is not a placeholder file. Preview sections show only these venues. */
  has_image: boolean
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
  /** The about text as sanitised HTML from the WYSIWYG field. */
  aboutHtml?: string
  image_caption?: string
  coordinate_label?: string
}

export const resolveVenues = (
  locations: LocationRecord[],
  venues: VenueRecord[],
  locale: string,
  venueRelations: OrganisationVenueRelationRecord[] = [],
  organisations: OrganisationRecord[] = [],
  websites: WebsiteRecord[] = [],
  venuesWebsites: JunctionRow[] = []
): ResolvedVenue[] => {
  const locationById = new Map(locations.filter(isVisible).map((location) => [location.id, location]))
  const websiteById = new Map(websites.filter(isVisible).map((site) => [site.id, site]))
  const organisationById = new Map(organisations.filter(isVisible).map((organisation) => [organisation.id, organisation]))
  const organisationsByVenue = new Map<string, VenueOrganisationLink[]>()
  // Relation rows carry no status: a row counts when the organisation is published too.
  for (const row of [...venueRelations].sort((a, b) => a.sort - b.sort)) {
    const organisation = organisationById.get(row.organisation)
    if (!organisation) continue
    const rows = organisationsByVenue.get(row.venue) ?? []
    rows.push({ slug: organisation.slug, title: organisation.title, relation: row.relation })
    organisationsByVenue.set(row.venue, rows)
  }
  // A venue needs a published town; without one it cannot be placed and drops out quietly.
  const visible = venues.filter((venue) => isVisible(venue) && locationById.has(venue.location))
  const refById = new Map(visible.map((venue) => [venue.id, { slug: venue.slug, name: venue.title }]))

  return visible.map((venue) => {
    const location = locationById.get(venue.location)!
    const text = pickTranslation(venue, locale)
    const ownWebsite: ResolvedLink[] = venue.website_url
      ? [{ id: `${venue.id}-website`, title: hostnameOf(venue.website_url), url: venue.website_url, kind: 'website' }]
      : []
    const links = [...ownWebsite, ...linksThrough(websiteById, venuesWebsites, 'venues_id', venue.id, locale)]
      .filter((link, index, all) => all.findIndex((other) => other.url === link.url) === index)
      .slice(0, MAX_VENUE_LINKS)

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
      links,
      image: venue.image,
      image_alt: (text.image_alt as string) || venue.image_alt,
      hero_image: venue.hero_image ?? undefined,
      hero_image_alt: (text.hero_image_alt as string) || venue.hero_image_alt || undefined,
      has_image: Boolean(venue.image) && !venue.image_placeholder,
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
      aboutHtml: toRichHtml((text.about_html as string) || venue.about_html),
      image_caption: (text.image_caption as string) || undefined,
      coordinate_label: (text.coordinate_label as string) || undefined
    }
  })
}
