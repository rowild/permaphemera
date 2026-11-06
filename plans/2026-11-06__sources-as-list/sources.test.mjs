// node --test plans/2026-11-06__sources-as-list/sources.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { markdownToHtml, plainToHtml, sourcesToList, splitSources } from './sources.mjs'

test('splitSources keeps commas inside brackets', () => {
  assert.deepEqual(splitSources('a.at (Paper, 26 August 2024), b.at.'), ['a.at (Paper, 26 August 2024)', 'b.at'])
})

test('sourcesToList moves only the last label into a list', () => {
  assert.equal(sourcesToList('<p>Fact (source: x.at). Text. Source: a.at, b.at.</p>', 'en').text, '<p>Fact (source: x.at). Text.</p><p>Sources</p><ul><li>a.at</li><li>b.at</li></ul>')
  assert.equal(sourcesToList(plainToHtml('Text & more. Quelle: a.at'), 'de').text, '<p>Text &amp; more.</p><p>Quelle</p><ul><li>a.at</li></ul>')
})

test('markdownToHtml makes what the news page showed', () => {
  assert.equal(markdownToHtml('One **bold** and *soft*.\nNext line.\n\n- a\n- b\n\n1. x\n2. y'), '<p>One <strong>bold</strong> and <em>soft</em>.<br>Next line.</p><ul><li>a</li><li>b</li></ul><ol><li>x</li><li>y</li></ol>')
  assert.equal(markdownToHtml('See [the tour](/exhibitions/a/), [PSV](https://photo-sphere-viewer.js.org/) and [bad](javascript:void).'), '<p>See <a href="/exhibitions/a/">the tour</a>, <a href="https://photo-sphere-viewer.js.org/">PSV</a> and bad.</p>')
  assert.equal(markdownToHtml('<script>x</script>'), '<p>&lt;script&gt;x&lt;/script&gt;</p>')
})
