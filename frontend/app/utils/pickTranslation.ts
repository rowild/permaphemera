import type { TranslationEntry } from '~/types/content'

/**
 * Selects the translation for `locale`, falling back locale → en → first available.
 *
 * Languages are equal in the frontend: nothing privileges `en` beyond its place
 * as a fallback rung. English-first is a backend authoring convention.
 *
 * Empty-string fields fall through to the next rung so a half-filled German
 * record does not blank out text that English has.
 */
export const pickTranslation = <T extends { translations: TranslationEntry[] }>(
  record: T,
  locale: string
): Record<string, string | string[]> => {
  const byCode = (code: string) => record.translations.find((entry) => entry.languages_code === code)
  const chain = [byCode(locale), byCode('en'), record.translations[0]].filter(Boolean) as TranslationEntry[]

  const merged: Record<string, string | string[]> = {}
  for (const entry of chain) {
    for (const [field, value] of Object.entries(entry)) {
      if (field === 'languages_code') continue
      const missing = merged[field] === undefined || merged[field] === ''
      if (missing && value !== '' && value !== null && value !== undefined) merged[field] = value
    }
  }
  return merged
}
