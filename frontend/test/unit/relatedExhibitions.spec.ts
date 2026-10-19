import { describe, expect, it } from 'vitest'
import { selectRelatedExhibitions } from '~/utils/relatedExhibitions'

const today = '2026-10-14'

const record = (slug: string, venue: string, start: string, end: string, tour?: string) => ({
  slug, venue_slug: venue, start_date: start, end_date: end, is_permanent: false,
  tour, tour_status: tour ? 'available' as const : 'unavailable' as const, tour_available_from: null
})

const all = [
  record('current', 'europahaus', '2026-10-03', '2026-10-30', '/media/tours/current/'),
  record('past-no-tour', 'parkschloessl', '2026-06-01', '2026-06-12'),
  record('old-tour', 'parkschloessl', '2026-06-01', '2026-06-12', '/media/tours/old/'),
  record('new-tour', 'parkschloessl', '2026-08-11', '2026-08-21', '/media/tours/new/'),
  record('same-venue-tour', 'europahaus', '2026-05-01', '2026-05-10', '/media/tours/same/'),
  record('future-tour', 'parkschloessl', '2026-11-01', '2026-11-20', '/media/tours/future/'),
  { ...record('scheduled', 'parkschloessl', '2026-09-01', '2026-09-20', '/media/tours/s/'), tour_available_from: '2026-12-01' }
]

describe('selectRelatedExhibitions', () => {
  it('offers only past exhibitions whose 360° tour is open: same venue first, then newest first', () => {
    const picked = selectRelatedExhibitions(all, all[0]!, today)
    expect(picked.map((item) => item.slug)).toEqual(['same-venue-tour', 'new-tour', 'old-tour'])
  })

  it('never offers the exhibition itself, one without tour, a current or future one, or a scheduled tour', () => {
    const slugs = selectRelatedExhibitions(all, all[2]!, today, 10).map((item) => item.slug)
    expect(slugs).not.toContain('old-tour')
    expect(slugs).not.toContain('past-no-tour')
    expect(slugs).not.toContain('current')
    expect(slugs).not.toContain('future-tour')
    expect(slugs).not.toContain('scheduled')
  })

  it('returns fewer cards, or none, when not enough exhibitions qualify', () => {
    expect(selectRelatedExhibitions([all[0]!, all[1]!], all[0]!, today)).toEqual([])
  })
})
