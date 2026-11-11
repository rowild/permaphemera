import { describe, expect, it } from 'vitest'
import { newestOnlineTours, openTourExhibitions, resolveTourAccess, tourOnlineDate } from '~/utils/tourAccess'

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

  // Owner, 2026-11-11: "360° tours are published on the last day of an exhibition. Exceptions
  // apply." Without a date the tour opens on the last day; a date is an exception.
  it('opens on the last day of the exhibition when no release date is set', () => {
    const lastDay = record({ tour_available_from: null, end_date: '2026-12-31' })
    expect(resolveTourAccess(lastDay, '2026-12-30')).toEqual({ kind: 'scheduled', date: '2026-12-31' })
    expect(resolveTourAccess(lastDay, '2026-12-31')).toEqual({ kind: 'open', url: '/media/tours/example/' })
  })

  it('lets an exception date open the tour before the last day', () => {
    expect(resolveTourAccess(record({ tour_available_from: '2026-10-03', end_date: '2026-12-31' }), '2026-11-11'))
      .toEqual({ kind: 'open', url: '/media/tours/example/' })
  })

  it('opens at once when there is neither a date nor a last day (permanent)', () => {
    expect(resolveTourAccess(record({ tour_available_from: null, end_date: null }), '2020-01-01'))
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

// The day a tour comes online: its exception date, else the last day of the exhibition.
describe('tourOnlineDate', () => {
  it('is the release date when one is set, else the last day, else none', () => {
    expect(tourOnlineDate({ tour_available_from: '2026-10-03', end_date: '2026-12-31' })).toBe('2026-10-03')
    expect(tourOnlineDate({ tour_available_from: null, end_date: '2026-11-10' })).toBe('2026-11-10')
    expect(tourOnlineDate({ tour_available_from: null, end_date: null })).toBeNull()
  })
})

// The start page leads with the tours that came online last (owner, 2026-11-11).
describe('newestOnlineTours', () => {
  const show = (id: string, end_date: string, overrides: Record<string, unknown> = {}) => ({ ...record({ tour_available_from: null, end_date }), id, title: id, start_date: '2026-01-01', image: `/img/${id}.jpg`, ...overrides })

  it('lists open tours by the day they came online, newest first', () => {
    const list = [
      show('june', '2026-06-12'),
      show('early-exception', '2027-02-28', { tour_available_from: '2026-11-07' }),
      show('november', '2026-11-10'),
      show('not-yet', '2026-12-31'),
      show('no-file', '2026-10-01', { tour: null }),
      show('no-image', '2026-10-02', { image: '' }),
      show('restricted', '2026-10-03', { tour_status: 'restricted' })
    ]
    expect(newestOnlineTours(list, '2026-11-11').map((item) => item.id)).toEqual(['november', 'early-exception', 'june'])
  })
})
