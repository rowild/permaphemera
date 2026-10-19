export interface Page<T> {
  items: T[]
  /** The page shown, moved into the real range (1 … pageCount). */
  page: number
  /** Never below 1: an empty list still has one (empty) page. */
  pageCount: number
  total: number
}

export function paginate<T>(items: readonly T[], page: number, perPage: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / perPage))
  const shown = Math.min(Math.max(1, page), pageCount)
  const start = (shown - 1) * perPage

  return { items: items.slice(start, start + perPage), page: shown, pageCount, total: items.length }
}

/** `?page=` as a positive whole number; anything else is page 1. */
export function pageFromQuery(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return 1

  return Math.max(1, Number(raw))
}

/**
 * The page numbers a pager shows: all of them up to seven pages, else always seven
 * slots — first, last, the pages around the current one, and `null` for each gap.
 */
export function pagerSlots(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const start = Math.max(2, Math.min(page - 1, pageCount - 4))
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5))
  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  return [1, ...(start > 2 ? [null] : []), ...middle, ...(end < pageCount - 1 ? [null] : []), pageCount]
}
