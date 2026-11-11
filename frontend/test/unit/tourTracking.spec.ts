import { describe, expect, it, vi } from 'vitest'
import { tourIdFromUrl, trackTourOpen } from '~/utils/tourTracking'

// Owner, 2026-11-11: every opening of a 360° tour is counted (Umami event "tour-open"), so the
// weekly sums can say how often each exhibition's tour was opened.
describe('tour tracking', () => {
  it('reads the tour id from the tour folder', () => {
    expect(tourIdFromUrl('/media/tours/2026-04-13-wagner-reloaded/')).toBe('2026-04-13-wagner-reloaded')
    expect(tourIdFromUrl('https://permaphemera.at/media/tours/abc_1/tour.json')).toBe('abc_1')
    expect(tourIdFromUrl('/somewhere/else/')).toBeNull()
  })

  it('sends one "tour-open" event with the tour id', () => {
    const track = vi.fn()
    trackTourOpen('/media/tours/2026-04-13-wagner-reloaded/', { umami: { track } })
    expect(track).toHaveBeenCalledExactlyOnceWith('tour-open', { tour: '2026-04-13-wagner-reloaded' })
  })

  it('does nothing without Umami (blocked script, localhost) and never throws', () => {
    expect(() => trackTourOpen('/media/tours/x/', {})).not.toThrow()
    expect(() => trackTourOpen('/media/tours/x/', { umami: { track: () => { throw new Error('offline') } } })).not.toThrow()
  })

  it('sends nothing for an address that is not a tour', () => {
    const track = vi.fn()
    trackTourOpen('/elsewhere/', { umami: { track } })
    expect(track).not.toHaveBeenCalled()
  })
})
