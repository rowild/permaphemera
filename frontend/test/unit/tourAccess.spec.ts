import { describe, expect, it } from 'vitest'
import { resolveTourAccess } from '~/utils/tourAccess'

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
