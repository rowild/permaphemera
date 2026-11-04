import { describe, expect, it } from 'vitest'
import { linkedRecords } from '~/utils/junction'

const rows = [
  { id: 1, news_id: 'n1', venues_id: 'v2', sort: 2 },
  { id: 2, news_id: 'n1', venues_id: 'v1', sort: 1 },
  { id: 3, news_id: 'n2', venues_id: 'v1', sort: 1 },
  { id: 4, news_id: 'n1', venues_id: 'draft', sort: 3 }
]
const venues = new Map([['v1', { id: 'v1', title: 'Eins' }], ['v2', { id: 'v2', title: 'Zwei' }]])

// The records one record reaches through a junction table (news → galleries, sponsor → persons …);
// two copies before (plans/2026-11-04__nuxt-optimisation-audit.md 3.3).
describe('linkedRecords', () => {
  it('gives the linked records of one owner in junction order', () => {
    expect(linkedRecords(rows, 'news_id', 'n1', 'venues_id', venues).map((venue) => venue.title)).toEqual(['Eins', 'Zwei'])
  })

  it('drops rows whose record is not published (not in the map)', () => {
    expect(linkedRecords(rows, 'news_id', 'n1', 'venues_id', venues)).toHaveLength(2)
  })
})
