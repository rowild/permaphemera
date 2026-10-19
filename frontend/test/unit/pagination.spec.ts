import { describe, expect, it } from 'vitest'
import { pageFromQuery, paginate, pagerSlots } from '~/utils/pagination'

const items = Array.from({ length: 45 }, (_, index) => index + 1)

describe('paginate', () => {
  it('cuts one page of items and counts the pages', () => {
    expect(paginate(items, 1, 20)).toEqual({ items: items.slice(0, 20), page: 1, pageCount: 3, total: 45 })
    expect(paginate(items, 3, 20).items).toEqual([41, 42, 43, 44, 45])
  })

  it('moves a page number outside the range to the nearest real page', () => {
    expect(paginate(items, 9, 20).page).toBe(3)
    expect(paginate(items, 0, 20).page).toBe(1)
  })

  it('has one empty page when there are no items', () => {
    expect(paginate([], 1, 20)).toEqual({ items: [], page: 1, pageCount: 1, total: 0 })
  })
})

describe('pageFromQuery', () => {
  it('reads a positive whole number and falls back to page 1', () => {
    expect(pageFromQuery('3')).toBe(3)
    expect(pageFromQuery(undefined)).toBe(1)
    expect(pageFromQuery('abc')).toBe(1)
    expect(pageFromQuery('-2')).toBe(1)
    expect(pageFromQuery('2.5')).toBe(1)
    expect(pageFromQuery(['4', '5'])).toBe(4)
  })
})

describe('pagerSlots', () => {
  it('lists every page when there are seven or fewer', () => {
    expect(pagerSlots(2, 4)).toEqual([1, 2, 3, 4])
  })

  it('keeps first, last and the pages around the current one, with gaps between', () => {
    expect(pagerSlots(1, 100)).toEqual([1, 2, 3, 4, 5, null, 100])
    expect(pagerSlots(50, 100)).toEqual([1, null, 49, 50, 51, null, 100])
    expect(pagerSlots(100, 100)).toEqual([1, null, 96, 97, 98, 99, 100])
  })
})
