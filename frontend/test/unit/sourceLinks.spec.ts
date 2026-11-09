import { describe, expect, it } from 'vitest'
import { unlinkedSources, unlinkedSourceLeaks } from '../../shared/source-links.mjs'

// Every source names the exact page it came from, as a link (owner, 2026-11-09): a source that
// is a web address without a link fails `pnpm check:data` on a published record.
describe('unlinkedSources', () => {
  it('lists the sources that name a web address but are no http(s) link to a page', () => {
    const html = '<p>Text.</p><p>Quellen</p><ul><li><a href="https://www.meinbezirk.at/x_a1">„Neu“, meinbezirk.at, 12. 1. 2022</a></li><li>meinbezirk.at</li><li><a href="http://a.at/b">a.at</a></li><li><a href="ftp://c.at/d">c.at</a></li><li>Plakat der Trigeniale Brda 26</li></ul>'
    expect(unlinkedSources(html)).toEqual(['meinbezirk.at', 'c.at'])
  })

  it('accepts a start page: one-page sites hold the facts there (the research rule asks for the exact page)', () => {
    expect(unlinkedSources('<p>Sources</p><ul><li><a href="https://www.judithlava.com/">„Judith Lava“, judithlava.com</a></li></ul>')).toEqual([])
  })

  it('is empty for a text without a sources list', () => {
    expect(unlinkedSources('<p>Only text with example.org in it.</p>')).toEqual([])
    expect(unlinkedSources(null)).toEqual([])
  })
})

describe('unlinkedSourceLeaks', () => {
  it('names published records with unlinked sources, per language', () => {
    const records = [
      { slug: 'a', status: 'published', translations: [{ languages_code: 'de', about_html: '<p>Quelle</p><ul><li>a.at</li></ul>' }] },
      { slug: 'b', status: 'draft', translations: [{ languages_code: 'de', about_html: '<p>Quelle</p><ul><li>b.at</li></ul>' }] }
    ]
    expect(unlinkedSourceLeaks(records, 'about_html')).toEqual(['a (de): a.at'])
  })
})
