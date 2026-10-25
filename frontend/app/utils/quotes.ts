import type { QuoteRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'

/** A quote as the start page shows it, in one language (Directus `pp_quotes`). */
export interface ResolvedQuote {
  id: string
  line1: string
  line2: string
  /** The red end of line 2. */
  accent: string
  /** Who said it; empty for the archive's own quotes. */
  source: string
  weight: number
}

const DEFAULT_WEIGHT = 5

const textOf = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/**
 * The quotes that may show today (`YYYY-MM-DD`): published, inside their dates (both days
 * included), with a first line in the visitor's language or a fallback (`pickTranslation`).
 */
export const resolveQuotes = (quotes: QuoteRecord[], locale: string, today: string): ResolvedQuote[] => quotes
  .filter(isVisible)
  .filter((quote) => (!quote.visible_from || quote.visible_from <= today) && (!quote.visible_until || today <= quote.visible_until))
  .flatMap((quote) => {
    const text = pickTranslation(quote, locale)
    const line1 = textOf(text.line_1) || textOf(quote.line_1)
    if (!line1) return []
    return [{
      id: quote.id,
      line1,
      line2: textOf(text.line_2),
      accent: textOf(text.accent),
      source: textOf(text.source),
      weight: Math.min(10, Math.max(1, quote.weight ?? DEFAULT_WEIGHT))
    }]
  })

/**
 * One quote at random, weighted: a quote of weight 10 comes up twice as often as one of
 * weight 5. `random` returns a number in [0, 1).
 */
export const pickQuote = (quotes: ResolvedQuote[], random: () => number = Math.random): ResolvedQuote | undefined => {
  const total = quotes.reduce((sum, quote) => sum + quote.weight, 0)
  let point = random() * total
  for (const quote of quotes) {
    point -= quote.weight
    if (point < 0) return quote
  }
  return quotes.at(-1)
}
