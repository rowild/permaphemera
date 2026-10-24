import { localDateKey } from '~/utils/exhibitionSchedule'
import { tourAccess } from '../../shared/tour-access.mjs'

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
  /** ISO date (YYYY-MM-DD) from which the record may be shown, or null for "at once". Usually the last day of the analog exhibition (= `end_date`, since 2026-10-21; before, the day after). */
  tour_available_from: string | null
}

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
