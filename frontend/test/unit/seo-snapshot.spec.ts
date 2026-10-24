import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'
import { renderSitemap, renderSnapshot, sitemapProblems, snapshotFile, staleSnapshots, verifySnapshot, writeSnapshots } from '../../scripts/lib/seo-snapshot.mjs'
import { staticSeoEntries, type SeoEntry } from '../../shared/seo.mjs'

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

  it('keeps dollar signs literal instead of reading them as replacement patterns', () => {
    const html = renderSnapshot(shell, { ...base, title: "Price $' and $& and $$" })
    expect(html).toContain("<title data-seo-snapshot>Price $' and $&amp; and $$</title>")
    expect(html.match(/<div id="__nuxt">/g)).toHaveLength(1)
    expect(html.match(/<\/head>/g)).toHaveLength(1)
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

describe('verifySnapshot', () => {
  it('accepts a rendered snapshot', () => {
    expect(verifySnapshot(renderSnapshot(shell, base), base)).toEqual([])
  })

  it('reports a shell the renderer could not fill', () => {
    expect(verifySnapshot(renderSnapshot('<html><body></body></html>', base), base)).toEqual([
      '/exhibitions/trigeniale-26/ (de): 0 titles',
      '/exhibitions/trigeniale-26/ (de): 0 descriptions',
      '/exhibitions/trigeniale-26/ (de): no canonical'
    ])
  })
})

describe('sitemapProblems', () => {
  const english = { ...base, locale: 'en' as const, canonical: base.alternates.en }

  it('accepts a sitemap with exactly the indexable addresses', () => {
    expect(sitemapProblems(renderSitemap([base, english]), [base, english])).toEqual([])
  })

  it('reports missing and extra addresses and a route listed twice', () => {
    const xml = renderSitemap([base])
    expect(sitemapProblems(xml, [base, english, base])).toEqual([
      'sitemap.xml lacks https://permaphemera.at/en/exhibitions/trigeniale-26/',
      'route listed twice: de /exhibitions/trigeniale-26/'
    ])
    expect(sitemapProblems(renderSitemap([base, english]), [base])).toEqual(['sitemap.xml has extra https://permaphemera.at/en/exhibitions/trigeniale-26/'])
  })
})

describe('sitemapProblems with the fixed pages', () => {
  it('reports a record whose slug takes the address of a fixed page', () => {
    const statics = staticSeoEntries({ de, en })
    const clash = { ...base, path: '/exhibitions/current/', canonical: 'https://permaphemera.at/exhibitions/current/' }
    expect(sitemapProblems(renderSitemap(statics), [...statics, clash])).toContain('route listed twice: de /exhibitions/current/')
  })
})

describe('snapshotFile', () => {
  it('maps a route to its index.html, English under en/', () => {
    expect(snapshotFile(base)).toBe('exhibitions/trigeniale-26/index.html')
    expect(snapshotFile({ ...base, locale: 'en' })).toBe('en/exhibitions/trigeniale-26/index.html')
    expect(snapshotFile({ ...base, path: '/' })).toBe('index.html')
  })

  it('refuses a path that would leave the output folder', () => {
    expect(snapshotFile({ ...base, path: '/persons/../../etc/' })).toBeUndefined()
  })
})

describe('staleSnapshots', () => {
  it('lists the record pages no entry writes any more, never fixed pages or other files', () => {
    const files = [
      'exhibitions/trigeniale-26/index.html', 'exhibitions/gone/index.html', 'en/persons/gone/index.html', 'exhibitions/current/index.html',
      'exhibitions/index.html', 'about/index.html', '_nuxt/x/index.html', 'venues/a/b/index.html'
    ]
    const current = { ...base, path: '/exhibitions/current/' }
    expect(staleSnapshots(files, [base, current])).toEqual(['exhibitions/gone/index.html', 'en/persons/gone/index.html'])
  })
})

describe('writeSnapshots', () => {
  let output = ''
  const put = async (file: string) => {
    await mkdir(dirname(join(output, file)), { recursive: true })
    await writeFile(join(output, file), 'old')
  }
  afterEach(async () => { if (output) await rm(output, { recursive: true, force: true }) })

  it('writes every entry, a hidden page too, and removes the snapshots of records that are gone', async () => {
    output = await mkdtemp(join(tmpdir(), 'seo-snapshot-'))
    for (const file of ['exhibitions/gone/index.html', 'en/persons/gone/index.html', 'en/persons/gone/.DS_Store', '_nuxt/entry.js']) await put(file)
    const hidden = { ...base, locale: 'en' as const, canonical: base.alternates.en, noIndex: true }
    const result = await writeSnapshots(output, shell, [base, hidden])
    expect(result.problems).toEqual([])
    expect(await readFile(join(output, 'exhibitions/trigeniale-26/index.html'), 'utf8')).toContain('<title data-seo-snapshot>')
    expect(await readFile(join(output, 'en/exhibitions/trigeniale-26/index.html'), 'utf8')).toContain('content="noindex, follow"')
    expect([...result.removed].sort()).toEqual(['en/persons/gone/index.html', 'exhibitions/gone/index.html'])
    // A folder left without index.html would make nginx answer 403 instead of serving the app.
    expect(existsSync(join(output, 'exhibitions/gone'))).toBe(false)
    expect(existsSync(join(output, 'en/persons/gone'))).toBe(false)
    expect(existsSync(join(output, '_nuxt/entry.js'))).toBe(true)
  })

  it('stops on an old record folder that holds other files, which would answer 403', async () => {
    output = await mkdtemp(join(tmpdir(), 'seo-snapshot-'))
    for (const file of ['venues/kept/index.html', 'venues/kept/photo.jpg']) await put(file)
    const result = await writeSnapshots(output, shell, [base])
    expect(result.problems).toEqual(['venues/kept/: holds files besides its old snapshot (photo.jpg); without index.html nginx would answer 403'])
    expect(existsSync(join(output, 'venues/kept/photo.jpg'))).toBe(true)
  })

  it('keeps the new snapshot when only the case of a slug changed (macOS ignores case)', async () => {
    output = await mkdtemp(join(tmpdir(), 'seo-snapshot-'))
    await put('exhibitions/Trigeniale-26/index.html')
    await writeSnapshots(output, shell, [base])
    expect(await readFile(join(output, 'exhibitions/trigeniale-26/index.html'), 'utf8')).toContain('<title data-seo-snapshot>')
  })

  it('reports an entry whose path leaves the output folder and writes nothing for it', async () => {
    output = await mkdtemp(join(tmpdir(), 'seo-snapshot-'))
    const result = await writeSnapshots(output, shell, [{ ...base, path: '/persons/../../etc/' }])
    expect(result.problems).toEqual(['/persons/../../etc/ (de): leaves the output folder'])
    expect(existsSync(join(output, 'etc'))).toBe(false)
  })
})
