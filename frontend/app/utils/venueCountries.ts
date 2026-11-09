import { HOME_COUNTRY, inHomeCountry } from '../../shared/countries.mjs'

export interface CountryGroup {
  country: string
  home: boolean
  count: number
  states: Array<{ state: string, count: number }>
}

/**
 * Galleries per country for /venues/ (owner, 2026-11-09): Austria first, then the other countries
 * by name; in each, the regions by name with their gallery counts.
 */
export function venueCountryGroups(venues: Array<{ country: string, state: string }>): CountryGroup[] {
  const byCountry = new Map<string, Map<string, number>>()
  for (const venue of venues) {
    const country = inHomeCountry(venue.country) ? HOME_COUNTRY : venue.country
    const states = byCountry.get(country) ?? new Map<string, number>()
    states.set(venue.state, (states.get(venue.state) ?? 0) + 1)
    byCountry.set(country, states)
  }
  const byName = (left: string, right: string) => left.localeCompare(right)
  return [...byCountry.entries()]
    .map(([country, states]) => ({
      country,
      home: country === HOME_COUNTRY,
      count: [...states.values()].reduce((sum, count) => sum + count, 0),
      states: [...states.entries()].map(([state, count]) => ({ state, count })).sort((left, right) => byName(left.state, right.state))
    }))
    .sort((left, right) => (left.home !== right.home ? (left.home ? -1 : 1) : byName(left.country, right.country)))
}
