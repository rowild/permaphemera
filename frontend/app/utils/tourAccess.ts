import { localDateKey } from '~/utils/exhibitionSchedule'
import { tourAccess, tourOnlineDate as sharedTourOnlineDate } from '../../shared/tour-access.mjs'

/**
 * Editorial decision about the 360° record of one exhibition. Mirrors the
 * Directus dropdown that will replace the JSON field:
 * - `available`: a record is (or will be) provided; `tour_available_from` gates when.
 * - `restricted`: rights holders do not permit a spatial record.
 * - `unavailable`: no record exists for this exhibition.
 */
export type TourStatus = 'available' | 'restricted' | 'unavailable'

export interface TourReadyExhibition {
  /** Root-relative tour folder, or null while none is exported. */
  tour?: string | null
  tour_status: TourStatus
  /** ISO date (YYYY-MM-DD): an exception to the rule. Null = the last day of the exhibition (`end_date`), owner 2026-11-11: "360° tours are published on the last day of an exhibition. Exceptions apply." */
  tour_available_from: string | null
  /** The exhibition's last day: the tour's day when no exception date is set. Null for permanent ones. */
  end_date?: string | null
}

/** The day a tour comes online: the exception date, else the last day, else null (shared/tour-access.mjs). */
export const tourOnlineDate = (exhibition: Pick<TourReadyExhibition, 'tour_available_from' | 'end_date'>): string | null => sharedTourOnlineDate(exhibition)

export type TourAccess =
  | { kind: 'open', url: string }
  | { kind: 'scheduled', date: string }
  | { kind: 'preparing' }
  | { kind: 'restricted' }
  | { kind: 'unavailable' }

/** The rules live in shared/tour-access.mjs, which the SEO module uses too. */
export function resolveTourAccess(exhibition: TourReadyExhibition, today = localDateKey()): TourAccess {
  return tourAccess(exhibition, today)
}

/**
 * Exhibitions whose 360° tour is open today and that have an image, newest start date first.
 * The hero fan shows them in this order; the newsletter modal takes the first one's image.
 */
export const openTourExhibitions = <T extends TourReadyExhibition & { start_date: string, image: string }>(
  exhibitions: readonly T[],
  today: string
): T[] => exhibitions
  .filter((exhibition) => exhibition.image && resolveTourAccess(exhibition, today).kind === 'open')
  .sort((left, right) => right.start_date.localeCompare(left.start_date))

/**
 * Exhibitions whose 360° tour is open today and that have an image, by the day the tour came
 * online (tourOnlineDate), newest first; the title breaks ties. The start page leads with these
 * (owner, 2026-11-11: the site is about tours that come online on a certain day).
 */
export const newestOnlineTours = <T extends TourReadyExhibition & { title: string, image: string }>(
  exhibitions: readonly T[],
  today: string
): T[] => exhibitions
  .filter((exhibition) => exhibition.image && resolveTourAccess(exhibition, today).kind === 'open')
  .sort((left, right) => (tourOnlineDate(right) ?? '').localeCompare(tourOnlineDate(left) ?? '')
    || left.title.localeCompare(right.title))
