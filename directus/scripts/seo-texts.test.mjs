// directus/scripts/seo-texts.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeSeo, validateSeoTexts } from './seo-texts.mjs'

const description = 'x'.repeat(140)
const item = (overrides = {}) => ({
  collection: 'exhibitions', slug: 'trigeniale-26',
  en: { title: 'Trigeniale 26 – Alps-Adriatic exhibition, Klagenfurt', meta_description: description },
  de: { title: 'Trigeniale 26 – Alpen-Adria-Ausstellung, Klagenfurt', meta_description: description },
  ...overrides
})

test('a complete item within the limits passes', () => {
  assert.deepEqual(validateSeoTexts([item()]), [])
})

test('titles over 60 and descriptions outside 130–160 characters are reported', () => {
  const errors = validateSeoTexts([item({ en: { title: 'T'.repeat(61), meta_description: 'short' }, de: { title: 'Titel', meta_description: 'y'.repeat(161) } })])
  assert.deepEqual(errors, [
    'exhibitions/trigeniale-26 en: title has 61 characters (max 60)',
    'exhibitions/trigeniale-26 en: description has 5 characters (130–160)',
    'exhibitions/trigeniale-26 de: description has 161 characters (130–160)'
  ])
})

test('a missing language, an unknown collection and a repeated slug are reported', () => {
  const errors = validateSeoTexts([item({ de: undefined }), item({ collection: 'towns' }), item()])
  assert.deepEqual(errors, [
    'exhibitions/trigeniale-26 de: missing',
    'towns/trigeniale-26: unknown collection',
    'exhibitions/trigeniale-26: listed twice'
  ])
})

test('merging keeps the settings and replaces only title and description', () => {
  const merged = mergeSeo({ title: 'old', meta_description: 'old', og_image: 'img', no_index: true, sitemap: { priority: '0.9' } }, { title: 'new', meta_description: 'new text' })
  assert.deepEqual(merged, { title: 'new', meta_description: 'new text', og_image: 'img', no_index: true, sitemap: { priority: '0.9' } })
  assert.deepEqual(mergeSeo(null, { title: 'a', meta_description: 'b' }), { title: 'a', meta_description: 'b' })
})
