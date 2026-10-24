import { describe, expect, it } from 'vitest'
import { renderSitemap, renderSnapshot } from '../../scripts/lib/seo-snapshot.mjs'
import type { SeoEntry } from '../../shared/seo.mjs'

const shell = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>PERMAPHEMERA</title><meta name="description" content="A curated archive."><meta name="theme-color" content="#efe5d2"></head><body><div id="__nuxt"></div></body></html>'

const base: SeoEntry = {
  path: '/exhibitions/trigeniale-26/', locale: 'de', title: 'Trigeniale 26 – Alpen-Adria-Ausstellung', description: 'DE Beschreibung',
  image: 'https://permaphemera.at/cms/assets/x?width=1200&height=630&fit=cover&format=jpg&quality=80', imageAlt: 'Einladung', ogType: 'article',
  noIndex: false, noFollow: false, canonical: 'https://permaphemera.at/exhibitions/trigeniale-26/',
  alternates: { de: 'https://permaphemera.at/exhibitions/trigeniale-26/', en: 'https://permaphemera.at/en/exhibitions/trigeniale-26/', 'x-default': 'https://permaphemera.at/exhibitions/trigeniale-26/' },
  jsonLd: [{ '@context': 'https://schema.org', '@type': 'ExhibitionEvent', name: 'Trigeniale 26' }],
  lastmod: '2026-10-24T10:00:00.000Z', changeFrequency: 'monthly', priority: '0.7'
}

describe('renderSnapshot', () => {
  it('replaces the shell title and description and marks every SEO tag', () => {
    const html = renderSnapshot(shell, base)
    expect(html).toContain('<html lang="de">')
    expect(html.match(/<title/g)).toHaveLength(1)
    expect(html.match(/name="description"/g)).toHaveLength(1)
    expect(html).toContain('<title data-seo-snapshot>Trigeniale 26 – Alpen-Adria-Ausstellung</title>')
    expect(html).toContain('<meta data-seo-snapshot name="description" content="DE Beschreibung">')
    expect(html).toContain('<link data-seo-snapshot rel="canonical" href="https://permaphemera.at/exhibitions/trigeniale-26/">')
    expect(html).toContain('<link data-seo-snapshot rel="alternate" hreflang="en" href="https://permaphemera.at/en/exhibitions/trigeniale-26/">')
    expect(html).toContain('<script data-seo-snapshot type="application/ld+json">{"@context":"https://schema.org","@type":"ExhibitionEvent","name":"Trigeniale 26"}</script>')
    expect(html).toContain('<meta name="theme-color" content="#efe5d2">')
    expect(html.indexOf('data-seo-snapshot')).toBeLessThan(html.indexOf('</head>'))
  })

  it('escapes quotes, ampersands and a closing script tag', () => {
    const html = renderSnapshot(shell, { ...base, locale: 'en', title: 'Tom & "Jerry" </script>', description: 'A <b> & "c"', jsonLd: [{ name: 'Tom </script>' }] })
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('<title data-seo-snapshot>Tom &amp; &quot;Jerry&quot; &lt;/script&gt;</title>')
    expect(html).toContain('content="A &lt;b&gt; &amp; &quot;c&quot;"')
    const ld = html.slice(html.indexOf('application/ld+json">'), html.indexOf('</head>'))
    expect(ld.match(/<\/script>/g)).toHaveLength(1)
  })

  it('writes robots only for a hidden page', () => {
    expect(renderSnapshot(shell, base)).not.toContain('name="robots"')
    expect(renderSnapshot(shell, { ...base, noIndex: true })).toContain('<meta data-seo-snapshot name="robots" content="noindex, follow">')
  })
})

describe('renderSitemap', () => {
  it('lists every indexable address once with its language alternates', () => {
    const english = { ...base, locale: 'en' as const, canonical: base.alternates.en }
    const hidden = { ...base, path: '/persons/hidden/', canonical: 'https://permaphemera.at/persons/hidden/', noIndex: true }
    const xml = renderSitemap([base, english, hidden])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    expect(xml.match(/<loc>/g)).toHaveLength(2)
    expect(xml).toContain('<loc>https://permaphemera.at/exhibitions/trigeniale-26/</loc>')
    expect(xml).toContain('<loc>https://permaphemera.at/en/exhibitions/trigeniale-26/</loc>')
    expect(xml.match(/hreflang="x-default"/g)).toHaveLength(2)
    expect(xml).toContain('<lastmod>2026-10-24T10:00:00.000Z</lastmod>')
    expect(xml).toContain('<changefreq>monthly</changefreq>')
    expect(xml).toContain('<priority>0.7</priority>')
    expect(xml).not.toContain('/persons/hidden/')
  })
})
