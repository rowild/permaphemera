import { describe, expect, it } from 'vitest'
import { hasRichText, sanitizeRichText } from '~/utils/richText'

describe('sanitizeRichText', () => {
  it('keeps paragraphs, line breaks, bold, italic and lists, without attributes', () => {
    expect(sanitizeRichText('<p class="x" style="color:red">One <strong data-a="1">two</strong> <em>three</em><br/>four</p><ul><li>a</li></ul><ol><li>b</li></ol>'))
      .toBe('<p>One <strong>two</strong> <em>three</em><br>four</p><ul><li>a</li></ul><ol><li>b</li></ol>')
  })

  it('keeps the text of a link but not the link (links are link records)', () => {
    expect(sanitizeRichText('<p>See <a href="https://example.org" target="_blank">the site</a>.</p>')).toBe('<p>See the site.</p>')
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
