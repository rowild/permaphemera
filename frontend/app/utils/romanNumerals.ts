const ROMAN_UNITS: ReadonlyArray<readonly [number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
]

/**
 * Converts a positive integer to its roman numeral. Returns an empty string for
 * anything else, so callers can render a placeholder without guarding first.
 */
export function toRomanNumeral(value: number): string {
  if (!Number.isInteger(value) || value < 1) return ''

  let remaining = value
  let numeral = ''

  for (const [amount, symbol] of ROMAN_UNITS) {
    while (remaining >= amount) {
      numeral += symbol
      remaining -= amount
    }
  }

  return numeral
}
