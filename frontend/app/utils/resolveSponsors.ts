import { linkedRecords } from '~/utils/junction'
import type { JunctionRow, LocationRecord, PersonRecord, SponsorRecord, VenueRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { displayPersonName } from '~/utils/resolveExhibitions'

/** A sponsor as its page shows it: what it supports, published records only. */
export interface ResolvedSponsor {
  id: string
  slug: string
  title: string
  website_url?: string
  logo?: string
  description?: string
  exhibitions: ResolvedExhibition[]
  venues: { slug: string, name: string }[]
  persons: { slug: string, name: string }[]
  towns: string[]
}

export interface SponsorSources {
  sponsors: SponsorRecord[]
  exhibitions: ResolvedExhibition[]
  venues: VenueRecord[]
  persons: PersonRecord[]
  locations: LocationRecord[]
  exhibitionsSponsors: JunctionRow[]
  sponsorsVenues: JunctionRow[]
  personsSponsors: JunctionRow[]
  locationsSponsors: JunctionRow[]
  locale: string
}


export const resolveSponsors = (s: SponsorSources): ResolvedSponsor[] => {
  const exhibitionById = new Map(s.exhibitions.map((exhibition) => [exhibition.id, exhibition]))
  const venueById = new Map(s.venues.filter(isVisible).map((venue) => [venue.id, { slug: venue.slug, name: venue.title }]))
  const personById = new Map(s.persons.filter(isVisible).map((person) => [person.id, { slug: person.slug, name: displayPersonName(person) }]))
  const townById = new Map(s.locations.filter(isVisible).map((location) => [location.id, location.title]))

  return s.sponsors.filter(isVisible).map((sponsor) => {
    const text = pickTranslation(sponsor, s.locale)
    return {
      id: sponsor.id,
      slug: sponsor.slug,
      title: sponsor.title,
      website_url: sponsor.website_url || undefined,
      logo: sponsor.logo || undefined,
      description: (text.description as string) || sponsor.description || undefined,
      exhibitions: linkedRecords(s.exhibitionsSponsors, 'sponsors_id', sponsor.id, 'exhibitions_id', exhibitionById),
      venues: linkedRecords(s.sponsorsVenues, 'sponsors_id', sponsor.id, 'venues_id', venueById),
      persons: linkedRecords(s.personsSponsors, 'sponsors_id', sponsor.id, 'persons_id', personById),
      towns: linkedRecords(s.locationsSponsors, 'sponsors_id', sponsor.id, 'locations_id', townById)
    }
  })
}
