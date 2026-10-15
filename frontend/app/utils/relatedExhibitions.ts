import { resolveTourAccess, type TourReadyExhibition } from '~/utils/tourAccess'

interface RelatedCandidate extends TourReadyExhibition {
  slug: string
  venue_slug: string
  start_date: string
  end_date: string
  is_permanent: boolean
  has_image: boolean
}

/**
 * "Also in the archive" on an exhibition page: only exhibitions that are over, whose 360°
 * tour is open and that have a real image (no placeholder), so every card leads to an
 * experience. Same venue first, then newest first.
 */
export const selectRelatedExhibitions = <T extends RelatedCandidate>(
  exhibitions: readonly T[],
  current: Pick<RelatedCandidate, 'slug' | 'venue_slug'>,
  today: string,
  count = 3
): T[] => exhibitions
  .filter((item) => item.slug !== current.slug
    && !item.is_permanent
    && item.has_image
    && item.end_date < today
    && resolveTourAccess(item, today).kind === 'open')
  .sort((left, right) =>
    Number(right.venue_slug === current.venue_slug) - Number(left.venue_slug === current.venue_slug)
    || right.start_date.localeCompare(left.start_date))
  .slice(0, count)
