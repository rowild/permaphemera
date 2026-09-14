import { describe, expect, it } from 'vitest'
import {
  localDateKey,
  selectExhibitionSchedule,
  selectFeaturedExhibition
} from '~/utils/exhibitionSchedule'

const exhibition = (
  id: string,
  start_date: string,
  end_date: string,
  is_permanent = false
) => ({ id, start_date, end_date, is_permanent })

describe('selectExhibitionSchedule', () => {
  const records = [
    exhibition('past', '2026-07-01', '2026-07-31'),
    exhibition('current-late', '2026-08-01', '2026-08-22'),
    exhibition('current-soon', '2026-08-11', '2026-08-15'),
    exhibition('upcoming-later', '2026-09-08', '2026-09-18'),
    exhibition('upcoming-next', '2026-08-25', '2026-09-04')
  ]

  it('includes start and end dates in the current interval', () => {
    expect(selectExhibitionSchedule(records, '2026-08-11').current.map(({ id }) => id))
      .toEqual(['current-soon', 'current-late'])
    expect(selectExhibitionSchedule(records, '2026-08-22').current.map(({ id }) => id))
      .toEqual(['current-late'])
  })

  it('orders current exhibitions by closing date and upcoming exhibitions by opening date', () => {
    const result = selectExhibitionSchedule(records, '2026-08-13')
    expect(result.current.map(({ id }) => id)).toEqual(['current-soon', 'current-late'])
    expect(result.upcoming.map(({ id }) => id)).toEqual(['upcoming-next', 'upcoming-later'])
  })

  it('limits each group independently to three records', () => {
    const many = Array.from({ length: 5 }, (_, index) => exhibition(
      `future-${index}`,
      `2026-09-${String(index + 1).padStart(2, '0')}`,
      '2026-10-01'
    ))
    expect(selectExhibitionSchedule(many, '2026-08-13').upcoming).toHaveLength(3)
  })

  it('keeps permanent exhibitions current after their start date', () => {
    const permanent = exhibition('permanent', '2020-01-01', '2020-01-02', true)
    expect(selectExhibitionSchedule([permanent], '2026-08-13').current[0]?.id).toBe('permanent')
  })
})

describe('selectFeaturedExhibition', () => {
  const orderedRecords = [
    exhibition('newest-future', '2026-09-08', '2026-09-18'),
    exhibition('next', '2026-08-25', '2026-09-04'),
    exhibition('current-late', '2026-08-01', '2026-08-22'),
    exhibition('current-soon', '2026-08-11', '2026-08-15'),
    exhibition('past', '2026-07-01', '2026-07-31')
  ]

  it('selects a current exhibition before newer upcoming records', () => {
    expect(selectFeaturedExhibition(orderedRecords, '2026-08-13')?.id).toBe('current-soon')
  })

  it('selects the immediately upcoming exhibition when none is current', () => {
    expect(selectFeaturedExhibition(orderedRecords, '2026-08-23')?.id).toBe('next')
  })

  it('falls back to the first supplied record when none is current or upcoming', () => {
    expect(selectFeaturedExhibition(orderedRecords, '2027-01-01')?.id).toBe('newest-future')
  })

  it('returns undefined for an empty collection', () => {
    expect(selectFeaturedExhibition([], '2026-08-13')).toBeUndefined()
  })
})

describe('localDateKey', () => {
  it('formats a local calendar day as an ISO date key', () => {
    expect(localDateKey(new Date(2026, 7, 3, 23, 45))).toBe('2026-08-03')
  })
})
