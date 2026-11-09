import { describe, expect, it } from 'vitest'
import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'

const leafKeys = (value: unknown, prefix = ''): string[] => value && typeof value === 'object'
  ? Object.entries(value).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key))
  : [prefix]

// Every text exists in both languages (was the first assertion of check-i18n-privacy).
describe('locale files', () => {
  it('have the same keys in German and English', () => {
    expect(leafKeys(de).sort()).toEqual(leafKeys(en).sort())
  })

  it('have no empty texts', () => {
    const empty = (messages: unknown) => leafKeys(messages).filter((key) => key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages) === '')
    expect(empty(de)).toEqual([])
    expect(empty(en)).toEqual([])
  })
})

// Wording the owner asked for; changing it is a decision, not a refactor.
describe('requested wording', () => {
  it('names the exhibition actions as asked', () => {
    expect([en.cards.openExhibition, de.cards.openExhibition]).toEqual(['Visit Exhibition', 'Ausstellung besuchen'])
    expect([en.cards.enterExhibition, de.cards.enterExhibition]).toEqual(['Visit Exhibition', 'Ausstellung besuchen'])
    expect([en.cards.aboutExhibition, de.cards.aboutExhibition]).toEqual(['About the Exhibition', 'Zur Ausstellung'])
  })

  it('names the federal states in German on the German site (stored in English)', () => {
    expect((de as { states: Record<string, string> }).states.Styria).toBe('Steiermark')
    expect((de as { states: Record<string, string> }).states.Carinthia).toBe('Kärnten')
  })

  it('names the countries of the galleries, also with "in" (stored in English; owner, 2026-11-09)', () => {
    const names = (file: unknown) => (file as { countries: Record<string, string>, inCountry: Record<string, string> })
    expect([names(de).countries.Slovenia, names(en).countries.Slovenia]).toEqual(['Slowenien', 'Slovenia'])
    expect([names(de).inCountry.Austria, names(en).inCountry.Austria]).toEqual(['in Österreich', 'in Austria'])
    expect(names(de).inCountry.Switzerland).toBe('in der Schweiz')
    expect(Object.keys(names(de).countries)).toEqual(Object.keys(names(en).countries))
    expect(Object.keys(names(de).inCountry)).toEqual(Object.keys(names(de).countries))
  })
})
