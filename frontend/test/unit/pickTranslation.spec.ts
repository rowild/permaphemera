import { describe, expect, it } from 'vitest'
import { pickTranslation } from '~/utils/pickTranslation'

const record = {
  translations: [
    { languages_code: 'en', title: 'Walking & Seeing', summary: 'English summary', medium: 'Watercolour' },
    { languages_code: 'de', title: 'Gehen & Sehen', summary: '', medium: 'Aquarelle' }
  ]
}

describe('pickTranslation', () => {
  it('returns the requested locale when it exists', () => {
    expect(pickTranslation(record, 'de').title).toBe('Gehen & Sehen')
  })

  it('falls back to English for an unknown locale', () => {
    expect(pickTranslation(record, 'fr').title).toBe('Walking & Seeing')
  })

  it('falls through empty strings to the next rung', () => {
    // German summary is empty, so English must fill it rather than blanking the field.
    expect(pickTranslation(record, 'de').summary).toBe('English summary')
  })

  it('keeps a non-empty value from the requested locale', () => {
    expect(pickTranslation(record, 'de').medium).toBe('Aquarelle')
  })

  it('never returns the languages_code marker as a content field', () => {
    expect(pickTranslation(record, 'de').languages_code).toBeUndefined()
  })

  it('uses the first available translation when neither locale nor en exist', () => {
    const only = { translations: [{ languages_code: 'it', title: 'Solo italiano' }] }
    expect(pickTranslation(only, 'de').title).toBe('Solo italiano')
  })
})
