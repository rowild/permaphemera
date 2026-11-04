import { describe, expect, it } from 'vitest'
import { matchesSearch, normalizeSearch } from '~/utils/search'

describe('search', () => {
  it('normalizes case and outer spaces', () => {
    expect(normalizeSearch('  Klagenfurt ')).toBe('klagenfurt')
  })

  it('matches when any value contains the query; an empty query matches everything', () => {
    expect(matchesSearch('furt', ['Galerie', 'Klagenfurt am Wörthersee'])).toBe(true)
    expect(matchesSearch('Spittal', ['Galerie', null, undefined, 'Klagenfurt'])).toBe(false)
    expect(matchesSearch('  ', ['x'])).toBe(true)
  })
})
