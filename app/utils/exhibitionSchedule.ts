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

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function selectExhibitionSchedule<T extends ScheduleReadyExhibition>(
  exhibitions: readonly T[],
  today = localDateKey(),
  maximumPerGroup = MAX_SCHEDULE_EXHIBITIONS_PER_GROUP
): ExhibitionSchedule<T> {
  const limit = Math.max(0, Math.floor(maximumPerGroup))
  const current = exhibitions
    .filter((exhibition) => exhibition.start_date <= today
      && (exhibition.is_permanent || exhibition.end_date >= today))
    .sort((left, right) => {
      const leftEnd = left.is_permanent ? '9999-12-31' : left.end_date
      const rightEnd = right.is_permanent ? '9999-12-31' : right.end_date

      return leftEnd.localeCompare(rightEnd) || left.start_date.localeCompare(right.start_date)
    })
    .slice(0, limit)

  const upcoming = exhibitions
    .filter((exhibition) => exhibition.start_date > today)
    .sort((left, right) => left.start_date.localeCompare(right.start_date))
    .slice(0, limit)

  return { current, upcoming }
}

export function selectFeaturedExhibition<T extends ScheduleReadyExhibition>(
  exhibitions: readonly T[],
  today = localDateKey()
): T | undefined {
  const schedule = selectExhibitionSchedule(exhibitions, today, 1)

  return schedule.current[0] ?? schedule.upcoming[0] ?? exhibitions[0]
}
