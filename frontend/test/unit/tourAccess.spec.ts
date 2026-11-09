import { describe, expect, it } from 'vitest'
import { openTourExhibitions, resolveTourAccess } from '~/utils/tourAccess'

const record = (overrides: Partial<Parameters<typeof resolveTourAccess>[0]> = {}) => ({
  tour: '/media/tours/example/',
  tour_status: 'available' as const,
  tour_available_from: '2026-06-13',
  ...overrides
})

describe('resolveTourAccess', () => {
  it('opens the tour once the release date has been reached', () => {
    expect(resolveTourAccess(record(), '2026-06-13')).toEqual({ kind: 'open', url: '/media/tours/example/' })
    expect(resolveTourAccess(record(), '2026-09-14')).toEqual({ kind: 'open', url: '/media/tours/example/' })
  })

  it('holds the tour back before the release date, even when the file exists', () => {
    expect(resolveTourAccess(record(), '2026-06-12')).toEqual({ kind: 'scheduled', date: '2026-06-13' })
  })

  it('opens immediately when no release date is set', () => {
    expect(resolveTourAccess(record({ tour_available_from: null }), '2020-01-01'))
      .toEqual({ kind: 'open', url: '/media/tours/example/' })
  })

  it('reports preparation when the date has passed but no file is published yet', () => {
    expect(resolveTourAccess(record({ tour: null }), '2026-09-14')).toEqual({ kind: 'preparing' })
    expect(resolveTourAccess(record({ tour: null, tour_available_from: null }), '2026-09-14')).toEqual({ kind: 'preparing' })
  })

  it('keeps the schedule message before the date even without a file', () => {
    expect(resolveTourAccess(record({ tour: null }), '2026-01-01')).toEqual({ kind: 'scheduled', date: '2026-06-13' })
  })

  it('never opens a restricted or unavailable tour, regardless of file or date', () => {
    expect(resolveTourAccess(record({ tour_status: 'restricted' }), '2026-09-14')).toEqual({ kind: 'restricted' })
    expect(resolveTourAccess(record({ tour_status: 'unavailable' }), '2026-09-14')).toEqual({ kind: 'unavailable' })
  })
})

// The hero fan and the newsletter modal both show exhibitions whose tour is open, newest first.
describe('openTourExhibitions', () => {
  const show = (id: string, start_date: string, overrides: Record<string, unknown> = {}) => ({ ...record(), id, start_date, image: `/img/${id}.jpg`, ...overrides })

  it('keeps open tours with an image, newest start date first', () => {
    const list = [
      show('old', '2025-01-01'),
      show('new', '2026-05-01'),
      show('later', '2026-08-01', { tour_available_from: '2026-12-01' }),
      show('closed', '2026-07-01', { tour_status: 'restricted' }),
      show('blank', '2026-07-02', { image: '' })
    ]
    expect(openTourExhibitions(list, '2026-09-14').map((item) => item.id)).toEqual(['new', 'old'])
  })

  it('gives an empty list when no tour is open', () => {
    expect(openTourExhibitions([show('later', '2026-08-01', { tour_available_from: '2026-12-01' })], '2026-09-14')).toEqual([])
  })
})
