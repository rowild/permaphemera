import type { KaleidoscopeExhibitionItem } from '~/types/kaleidoscope'
import { resolveTourAccess, type TourReadyExhibition } from '~/utils/tourAccess'

/** The fan at the top of the landing page always has twelve blades. */
export const HERO_BLADE_COUNT = 12

interface DatedExhibition {
  start_date: string
}

interface HeroExhibition extends DatedExhibition, TourReadyExhibition {
  id: string
  slug: string
  title: string
  artist: string
  venue: string
  venue_slug: string
  city: string
  date_range: string
  image: string
}

interface HeroVenue {
  id: string
  slug: string
  name: string
  city_name: string
  image: string
  archive_number: string
}

interface HeroHrefs {
  exhibition: (slug: string) => string
  venue: (slug: string) => string
}

/** Exhibitions that have opened (current or past). Nothing that has not opened yet. */
export const selectOpenedExhibitions = <T extends DatedExhibition>(exhibitions: readonly T[], today: string): T[] =>
  exhibitions.filter((exhibition) => exhibition.start_date <= today)

/**
 * The fan offers only exhibitions whose 360° experience is open, newest first. Until there are
 * twelve of them, galleries fill the remaining blades: venues without a tour of their own first,
 * each group in archive order. The gallery fill is a stop-gap until enough tours exist.
 */
export const buildHeroItems = (
  exhibitions: readonly HeroExhibition[],
  venues: readonly HeroVenue[],
  today: string,
  href: HeroHrefs
): KaleidoscopeExhibitionItem[] => {
  const tours: KaleidoscopeExhibitionItem[] = exhibitions
    .filter((exhibition) => exhibition.image && resolveTourAccess(exhibition, today).kind === 'open')
    .sort((left, right) => right.start_date.localeCompare(left.start_date))
    .map((exhibition) => ({
      id: exhibition.id,
      kind: 'exhibition',
      image: exhibition.image,
      href: href.exhibition(exhibition.slug),
      label: exhibition.title,
      title: exhibition.title,
      artist: exhibition.artist,
      location: `${exhibition.venue}, ${exhibition.city}`,
      dateRange: exhibition.date_range
    }))
  if (tours.length >= HERO_BLADE_COUNT) return tours

  const tourVenues = new Set(exhibitions
    .filter((exhibition) => tours.some((item) => item.id === exhibition.id))
    .map((exhibition) => exhibition.venue_slug))
  const archiveOrder = (left: HeroVenue, right: HeroVenue) =>
    (left.archive_number || '').localeCompare(right.archive_number || '', undefined, { numeric: true }) || left.name.localeCompare(right.name)
  const candidates = venues.filter((venue) => venue.image).sort(archiveOrder)
  const galleries: KaleidoscopeExhibitionItem[] = [
    ...candidates.filter((venue) => !tourVenues.has(venue.slug)),
    ...candidates.filter((venue) => tourVenues.has(venue.slug))
  ]
    .slice(0, HERO_BLADE_COUNT - tours.length)
    .map((venue) => ({
      id: `venue-${venue.id}`,
      kind: 'venue',
      image: venue.image,
      href: href.venue(venue.slug),
      label: venue.name,
      title: venue.name,
      artist: '',
      location: venue.city_name,
      dateRange: ''
    }))

  return [...tours, ...galleries]
}
