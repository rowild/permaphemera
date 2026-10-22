export interface ScheduleReadyExhibition {
  start_date: string
  end_date: string
  is_permanent: boolean
}

export interface ExhibitionSchedule<T> {
  current: T[]
  upcoming: T[]
}

export const MAX_SCHEDULE_EXHIBITIONS_PER_GROUP = 3
/** The landing page's mobile slider shows more of each group than the desktop columns. */
export const MAX_SCHEDULE_SLIDES_PER_GROUP = 5

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export interface ExhibitionTimeGroups<T> extends ExhibitionSchedule<T> {
  past: T[]
}

export type ExhibitionTimeGroupId = keyof ExhibitionTimeGroups<unknown>

/**
 * Every record in exactly one group, with no limit. Current: closing soonest first
 * (permanent last). Upcoming: opening soonest first. Past: most recently closed first.
 */
export function groupExhibitionsByTime<T extends ScheduleReadyExhibition>(
  exhibitions: readonly T[],
  today = localDateKey()
): ExhibitionTimeGroups<T> {
  const closing = (exhibition: T) => exhibition.is_permanent ? '9999-12-31' : exhibition.end_date
  const current: T[] = []
  const upcoming: T[] = []
  const past: T[] = []

  for (const exhibition of exhibitions) {
    if (exhibition.start_date > today) upcoming.push(exhibition)
    else if (closing(exhibition) >= today) current.push(exhibition)
    else past.push(exhibition)
  }

  current.sort((left, right) => closing(left).localeCompare(closing(right)) || left.start_date.localeCompare(right.start_date))
  upcoming.sort((left, right) => left.start_date.localeCompare(right.start_date))
  past.sort((left, right) => right.end_date.localeCompare(left.end_date) || right.start_date.localeCompare(left.start_date))

  return { current, upcoming, past }
}

export function selectExhibitionSchedule<T extends ScheduleReadyExhibition>(
  exhibitions: readonly T[],
  today = localDateKey(),
  maximumPerGroup = MAX_SCHEDULE_EXHIBITIONS_PER_GROUP
): ExhibitionSchedule<T> {
  const limit = Math.max(0, Math.floor(maximumPerGroup))
  const { current, upcoming } = groupExhibitionsByTime(exhibitions, today)

  return { current: current.slice(0, limit), upcoming: upcoming.slice(0, limit) }
}

export function selectFeaturedExhibition<T extends ScheduleReadyExhibition>(
  exhibitions: readonly T[],
  today = localDateKey()
): T | undefined {
  const schedule = selectExhibitionSchedule(exhibitions, today, 1)

  return schedule.current[0] ?? schedule.upcoming[0] ?? exhibitions[0]
}
