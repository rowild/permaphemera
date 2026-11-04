import { describe, expect, it } from 'vitest'
import { createOrnamentTransform, placeOrnament } from '~/utils/seededLayout'

// The compass ornament of both gallery cards: placed by its seed, moved while the card is
// active (two copies before; plans/2026-11-04__nuxt-optimisation-audit.md 2.9).
describe('placeOrnament', () => {
  const ornament = createOrnamentTransform('venue-1', false)

  it('places the ornament and uses the rest transform', () => {
    expect(placeOrnament(ornament, false)).toEqual({ right: ornament.right, bottom: ornament.bottom, transform: ornament.rest })
  })

  it('uses the active transform while the card is hovered or focused', () => {
    expect(placeOrnament(ornament, true).transform).toBe(ornament.active)
  })
})
