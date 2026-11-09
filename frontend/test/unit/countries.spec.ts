import { describe, expect, it } from 'vitest'
import { HOME_COUNTRY, inHomeCountry } from '../../shared/countries.mjs'
import { venueCountryGroups } from '~/utils/venueCountries'

// Owner, 2026-11-09 (docs/text-rules.md §5a): the archive also records galleries abroad that are
// tied to Austria. The overview pages list only the home country for now; /venues/ lists all and
// counts each country on its own.
describe('inHomeCountry', () => {
  it('is Austria, in either stored spelling', () => {
    expect(HOME_COUNTRY).toBe('Austria')
    expect(inHomeCountry('Austria')).toBe(true)
    expect(inHomeCountry('Österreich')).toBe(true)
  })

  it('treats a town without a country as Austrian (older records)', () => {
    expect(inHomeCountry('')).toBe(true)
    expect(inHomeCountry(null)).toBe(true)
    expect(inHomeCountry(undefined)).toBe(true)
  })

  it('is false for every other country', () => {
    expect(inHomeCountry('Slovenia')).toBe(false)
    expect(inHomeCountry('Italy')).toBe(false)
  })
})

describe('venueCountryGroups', () => {
  const venue = (country: string, state: string) => ({ country, state })

  it('counts galleries and regions per country, Austria first, then the others by name', () => {
    const groups = venueCountryGroups([
      venue('Slovenia', 'Goriška'),
      venue('Austria', 'Carinthia'),
      venue('Italy', 'Friuli Venezia Giulia'),
      venue('Austria', 'Styria'),
      venue('Austria', 'Carinthia')
    ])
    expect(groups).toEqual([
      { country: 'Austria', home: true, count: 3, states: [{ state: 'Carinthia', count: 2 }, { state: 'Styria', count: 1 }] },
      { country: 'Italy', home: false, count: 1, states: [{ state: 'Friuli Venezia Giulia', count: 1 }] },
      { country: 'Slovenia', home: false, count: 1, states: [{ state: 'Goriška', count: 1 }] }
    ])
  })

  it('files a gallery without a country under Austria', () => {
    expect(venueCountryGroups([venue('', 'Carinthia')])).toEqual([
      { country: 'Austria', home: true, count: 1, states: [{ state: 'Carinthia', count: 1 }] }
    ])
  })

  it('is empty without galleries', () => {
    expect(venueCountryGroups([])).toEqual([])
  })
})
