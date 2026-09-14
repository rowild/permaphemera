import { localDateKey } from '~/utils/exhibitionSchedule'

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
  /** ISO date (YYYY-MM-DD) from which the record may be shown, or null for "at once". Usually the day after the analog exhibition closes, so the digital record never competes with the real visit. */
  tour_available_from: string | null
}

export type TourAccess =
  | { kind: 'open', url: string }
  | { kind: 'scheduled', date: string }
  | { kind: 'preparing' }
  | { kind: 'restricted' }
  | { kind: 'unavailable' }

export function resolveTourAccess(exhibition: TourReadyExhibition, today = localDateKey()): TourAccess {
  if (exhibition.tour_status === 'restricted') return { kind: 'restricted' }
  if (exhibition.tour_status === 'unavailable') return { kind: 'unavailable' }

  const releaseDate = exhibition.tour_available_from
  if (releaseDate && releaseDate > today) return { kind: 'scheduled', date: releaseDate }
  if (exhibition.tour) return { kind: 'open', url: exhibition.tour }
  return { kind: 'preparing' }
}
