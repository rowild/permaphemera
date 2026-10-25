import { describe, expect, it } from 'vitest'
import type { QuoteRecord } from '~/types/content'
import { pickQuote, resolveQuotes } from '~/utils/quotes'

const quote = (id: string, extra: Partial<QuoteRecord> = {}): QuoteRecord => ({
  id,
  status: 'published',
  sort: 1,
  line_1: `${id} one`,
  line_2: `${id} two`,
  accent: `${id} red`,
  source: null,
  weight: 5,
  visible_from: null,
  visible_until: null,
  translations: [
    { languages_code: 'en', line_1: `${id} one`, line_2: `${id} two`, accent: `${id} red`, source: '' },
    { languages_code: 'de', line_1: `${id} eins`, line_2: `${id} zwei`, accent: `${id} rot`, source: '' }
  ],
  ...extra
})

describe('resolveQuotes', () => {
  it('shows published quotes only, in the visitor\'s language', () => {
    const resolved = resolveQuotes([quote('a'), quote('b', { status: 'draft' }), quote('c', { status: 'archived' })], 'de', '2026-10-25')
    expect(resolved).toEqual([{ id: 'a', line1: 'a eins', line2: 'a zwei', accent: 'a rot', source: '', weight: 5 }])
  })

  it('keeps a quote to its dates, both days included', () => {
    const quotes = [
      quote('before', { visible_from: '2026-10-26' }),
      quote('from', { visible_from: '2026-10-25' }),
      quote('until', { visible_until: '2026-10-25' }),
      quote('after', { visible_until: '2026-10-24' }),
      quote('inside', { visible_from: '2026-10-01', visible_until: '2026-10-31' })
    ]
    expect(resolveQuotes(quotes, 'en', '2026-10-25').map((entry) => entry.id)).toEqual(['from', 'until', 'inside'])
  })

  it('falls back to English, and leaves out a quote without a first line', () => {
    const englishOnly = quote('en-only', { translations: [{ languages_code: 'en', line_1: 'Only English', line_2: '', accent: '', source: 'An artist' }] })
    const empty = quote('empty', { line_1: '', translations: [] })
    expect(resolveQuotes([englishOnly, empty], 'de', '2026-10-25')).toEqual([
      { id: 'en-only', line1: 'Only English', line2: '', accent: '', source: 'An artist', weight: 5 }
    ])
  })

  it('keeps the weight between 1 and 10, 5 when missing', () => {
    const weights = resolveQuotes([
      quote('low', { weight: 0 }), quote('high', { weight: 40 }), quote('none', { weight: null })
    ], 'en', '2026-10-25').map((entry) => entry.weight)
    expect(weights).toEqual([1, 10, 5])
  })
})

describe('pickQuote', () => {
  const resolved = resolveQuotes([quote('a', { weight: 5 }), quote('b', { weight: 10 }), quote('c', { weight: 5 })], 'en', '2026-10-25')

  it('picks by weight: b holds half of the range, because its weight is twice the others', () => {
    // Total weight 20: a takes [0, 5), b [5, 15), c [15, 20).
    expect(pickQuote(resolved, () => 0)?.id).toBe('a')
    expect(pickQuote(resolved, () => 0.24)?.id).toBe('a')
    expect(pickQuote(resolved, () => 0.25)?.id).toBe('b')
    expect(pickQuote(resolved, () => 0.74)?.id).toBe('b')
    expect(pickQuote(resolved, () => 0.75)?.id).toBe('c')
    expect(pickQuote(resolved, () => 0.9999)?.id).toBe('c')
  })

  it('returns nothing when there is no quote', () => {
    expect(pickQuote([], () => 0.5)).toBeUndefined()
  })
})
