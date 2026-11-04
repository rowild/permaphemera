import { describe, expect, it } from 'vitest'
import { toRomanNumeral } from '~/utils/romanNumerals'

// The wheel's loading dial counts its slices in Roman numerals.
describe('toRomanNumeral', () => {
  it('converts the units and the dial range', () => {
    expect([1, 4, 5, 9, 7, 10, 12].map(toRomanNumeral)).toEqual(['I', 'IV', 'V', 'IX', 'VII', 'X', 'XII'])
  })

  it('gives nothing for zero, negatives and fractions', () => {
    expect([0, -3, 1.5, Number.NaN].map(toRomanNumeral)).toEqual(['', '', '', ''])
  })
})
