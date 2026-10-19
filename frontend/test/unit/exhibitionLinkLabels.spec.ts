import { describe, expect, it } from 'vitest'
import { exhibitionLinkLabels } from '~/utils/exhibitionLinkLabels'

const today = '2026-10-19'
const record = (overrides: Record<string, unknown> = {}) => ({
  kind: 'exhibition' as const,
  tour: '/media/tours/example/' as string | null,
  tour_status: 'available' as const,
  tour_available_from: null as string | null,
  ...overrides
})

describe('exhibitionLinkLabels', () => {
  it('says "Visit" only while the 360° tour is open', () => {
    expect(exhibitionLinkLabels(record(), today)).toEqual({
      open: 'cards.openExhibition', enter: 'cards.enterExhibition', short: 'cards.enter', openFor: 'cards.openExhibitionFor'
    })
  })

  it('says "About" for a tour that is scheduled, in preparation, restricted or missing', () => {
    const about = { open: 'cards.aboutExhibition', enter: 'cards.aboutExhibition', short: 'cards.aboutShort', openFor: 'cards.aboutExhibitionFor' }
    expect(exhibitionLinkLabels(record({ tour_available_from: '2026-10-25' }), today)).toEqual(about)
    expect(exhibitionLinkLabels(record({ tour: null }), today)).toEqual(about)
    expect(exhibitionLinkLabels(record({ tour_status: 'restricted' }), today)).toEqual(about)
    expect(exhibitionLinkLabels(record({ tour_status: 'unavailable' }), today)).toEqual(about)
  })

  it('switches to "Visit" on the day the tour opens', () => {
    expect(exhibitionLinkLabels(record({ tour_available_from: '2026-10-25' }), '2026-10-25').open).toBe('cards.openExhibition')
  })

  it('words events as events', () => {
    expect(exhibitionLinkLabels(record({ kind: 'event' }), today).open).toBe('cards.openEvent')
    expect(exhibitionLinkLabels(record({ kind: 'event', tour: null }), today).open).toBe('cards.aboutEvent')
  })

  it('says "About" when the record carries no tour fields at all', () => {
    expect(exhibitionLinkLabels({}, today).open).toBe('cards.aboutExhibition')
  })
})
