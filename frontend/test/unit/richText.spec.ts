import { describe, expect, it } from 'vitest'
import { hasRichText, markSources, sanitizeRichText } from '~/utils/richText'

describe('sanitizeRichText', () => {
  it('keeps paragraphs, line breaks, bold, italic and lists, without attributes', () => {
    expect(sanitizeRichText('<p class="x" style="color:red">One <strong data-a="1">two</strong> <em>three</em><br/>four</p><ul><li>a</li></ul><ol><li>b</li></ol>'))
      .toBe('<p>One <strong>two</strong> <em>three</em><br>four</p><ul><li>a</li></ul><ol><li>b</li></ol>')
  })

  it('keeps the text of a link but not the link (links are link records)', () => {
    expect(sanitizeRichText('<p>See <a href="https://example.org" target="_blank">the site</a>.</p>')).toBe('<p>See the site.</p>')
  })

  it('keeps site and https links only when asked (news), dropping every other link and attribute', () => {
    const html = '<p><a href="/exhibitions/x/" onclick="evil()">site</a> <a href="https://example.org/a?b=1">web</a> <a href="javascript:alert(1)">js</a> <a href="//evil.org">proto</a> <a href="http://plain.org">http</a> <a href="/x" onmouseover="evil()">quote</a></p>'
    expect(sanitizeRichText(html, { links: true })).toBe('<p><a href="/exhibitions/x/">site</a> <a href="https://example.org/a?b=1" target="_blank" rel="noopener noreferrer">web</a> js proto http <a href="/x">quote</a></p>')
  })

  it('gives a kept site link the language prefix (news in English)', () => {
    expect(sanitizeRichText('<p><a href="/exhibitions/a/">tour</a> <a href="https://x.org/">web</a></p>', { links: true, localize: (path) => `/en${path}` }))
      .toBe('<p><a href="/en/exhibitions/a/">tour</a> <a href="https://x.org/" target="_blank" rel="noopener noreferrer">web</a></p>')
  })

  it('keeps the https links of the closing sources list, also where the text keeps no other link (owner, 2026-11-09)', () => {
    const html = '<p>Text <a href="https://a.at/x">here</a>.</p><p>Quellen</p><ul><li><a href="https://www.meinbezirk.at/spittal/c-lokales/neu_a1">„Neu“, meinbezirk.at, 12. 1. 2022</a></li><li><a href="javascript:alert(1)">bad</a></li><li>Plakat</li></ul>'
    expect(sanitizeRichText(html)).toBe('<p>Text here.</p><p>Quellen</p><ul><li><a href="https://www.meinbezirk.at/spittal/c-lokales/neu_a1" target="_blank" rel="noopener noreferrer">„Neu“, meinbezirk.at, 12. 1. 2022</a></li><li>bad</li><li>Plakat</li></ul>')
  })

  it('keeps an http link in the sources list (a few sources have no https, e.g. bv-kaernten.at), never in the text', () => {
    const html = '<p><a href="http://a.at/x">a</a></p><p>Quelle</p><ul><li><a href="http://www.bv-kaernten.at/flohmarkt">„Flohmarkt“, bv-kaernten.at</a></li></ul>'
    expect(sanitizeRichText(html)).toBe('<p>a</p><p>Quelle</p><ul><li><a href="http://www.bv-kaernten.at/flohmarkt" target="_blank" rel="noopener noreferrer">„Flohmarkt“, bv-kaernten.at</a></li></ul>')
  })

  it('keeps no link in a list that is not the closing sources list', () => {
    const html = '<p>Quellen</p><ul><li><a href="https://a.at/x">a</a></li></ul><p>More text.</p>'
    expect(sanitizeRichText(html)).toBe('<p>Quellen</p><ul><li>a</li></ul><p>More text.</p>')
  })

  it('drops scripts, styles and event handlers entirely', () => {
    expect(sanitizeRichText('<p onclick="alert(1)">Hi</p><script>alert(1)</script><style>p{}</style><img src=x onerror="alert(1)">'))
      .toBe('<p>Hi</p>')
  })

  it('escapes any other angle bracket, so no unknown tag can survive', () => {
    expect(sanitizeRichText('<p>a <scr<script>ipt>x</p><img src=x onerror=alert(1)//')).toBe('<p>a ipt&gt;x</p>&lt;img src=x onerror=alert(1)//')
  })

  it('removes the empty paragraphs the editor leaves behind', () => {
    expect(sanitizeRichText('<p>Text</p><p>&nbsp;</p><p> </p><p><br></p>')).toBe('<p>Text</p>')
  })
})

describe('hasRichText', () => {
  it('is true only when visible text remains', () => {
    expect(hasRichText('<p>Text</p>')).toBe(true)
    expect(hasRichText('<p>&nbsp;</p>')).toBe(false)
    expect(hasRichText('')).toBe(false)
    expect(hasRichText(null)).toBe(false)
  })
})

// Sources close a text as their own block: a label paragraph and a list (owner, 2026-11-06).
describe('markSources', () => {
  it('marks the closing label paragraph and its list, and drops the colon', () => {
    expect(markSources('<p>Text.</p><p>Quellen:</p><ul><li>a.at</li><li>b.at</li></ul>'))
      .toBe('<p>Text.</p><p class="archive-sources-label">Quellen</p><ul class="archive-sources"><li>a.at</li><li>b.at</li></ul>')
  })

  it('knows the singular and the English labels', () => {
    for (const label of ['Quelle', 'Source', 'Sources']) {
      expect(markSources(`<p>Text.</p><p>${label}</p><ul><li>a.at</li></ul>`)).toContain(`<p class="archive-sources-label">${label}</p><ul class="archive-sources">`)
    }
  })

  it('leaves a list alone that is not the last block or has no label before it', () => {
    const middle = '<p>Quellen</p><ul><li>a.at</li></ul><p>More text.</p>'
    const plain = '<p>Works shown:</p><ul><li>One</li></ul>'
    expect(markSources(middle)).toBe(middle)
    expect(markSources(plain)).toBe(plain)
  })
})
