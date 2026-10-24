// scripts/lib/seo-snapshot.mjs
// Pure renderers for the deploy's SEO snapshots (scripts/seo-snapshot.mjs): the SPA shell with
// one route's head tags, and the sitemap. The tags come from headFor() in shared/seo.mjs, the
// same function the running site uses, and carry data-seo-snapshot so the app can drop them.
import { headFor } from '../../shared/seo.mjs'

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const attributes = (pairs) => Object.entries(pairs)
  .filter(([, value]) => value !== undefined && value !== null)
  .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
  .join('')

/** The shell with this entry's title, description and SEO tags in place of the generic ones. */
export const renderSnapshot = (shellHtml, entry) => {
  const head = headFor(entry)
  const tags = [
    `<title data-seo-snapshot>${escapeHtml(head.title)}</title>`,
    ...head.meta.map((tag) => `<meta data-seo-snapshot${attributes({ name: tag.name, property: tag.property, content: tag.content })}>`),
    ...head.link.map((link) => `<link data-seo-snapshot${attributes({ rel: link.rel, hreflang: link.hreflang, href: link.href })}>`),
    // headFor() already writes "<" as <, so no "</script>" can occur inside.
    ...head.jsonLd.map((json) => `<script data-seo-snapshot type="application/ld+json">${json}</script>`)
  ].join('')
  return shellHtml
    .replace(/<html(\s[^>]*)?>/, (match, attrs = '') => `<html${attrs.replace(/\s+lang="[^"]*"/, '')} lang="${entry.locale}">`)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    // A function, not a string: editors' text may contain $' or $&, which a string replacement expands.
    .replace('</head>', () => `${tags}</head>`)
}

const count = (html, pattern) => (html.match(pattern) ?? []).length

/** Problems of one written snapshot: exactly one title and description, and its canonical. */
export const verifySnapshot = (html, entry) => {
  const where = `${entry.path} (${entry.locale})`
  const problems = []
  const titles = count(html, /<title[\s>]/g)
  const descriptions = count(html, /<meta[^>]*\sname="description"/g)
  if (titles !== 1) problems.push(`${where}: ${titles} titles`)
  if (descriptions !== 1) problems.push(`${where}: ${descriptions} descriptions`)
  if (!html.includes(`rel="canonical" href="${escapeHtml(entry.canonical)}"`)) problems.push(`${where}: no canonical`)
  return problems
}

/** Problems of the sitemap against the entries: missing or extra addresses, a route listed twice. */
export const sitemapProblems = (xml, entries) => {
  const unescape = (value) => value.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
  const listed = new Set([...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => unescape(match[1])))
  const expected = new Set(entries.filter((entry) => !entry.noIndex).map((entry) => entry.canonical))
  const seen = new Set()
  const twice = entries.filter((entry) => {
    const key = `${entry.locale} ${entry.path}`
    if (seen.has(key)) return true
    seen.add(key)
    return false
  })
  return [
    ...[...expected].filter((url) => !listed.has(url)).map((url) => `sitemap.xml lacks ${url}`),
    ...[...listed].filter((url) => !expected.has(url)).map((url) => `sitemap.xml has extra ${url}`),
    ...twice.map((entry) => `route listed twice: ${entry.locale} ${entry.path}`)
  ]
}

/** Every indexable address with its language alternates (sitemaps.org with xhtml:link). */
export const renderSitemap = (entries) => {
  const urls = entries
    .filter((entry) => !entry.noIndex)
    .map((entry) => [
      '<url>',
      `<loc>${escapeHtml(entry.canonical)}</loc>`,
      ...['de', 'en', 'x-default'].map((hreflang) => `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(entry.alternates[hreflang])}"/>`),
      entry.lastmod ? `<lastmod>${escapeHtml(entry.lastmod)}</lastmod>` : '',
      `<changefreq>${escapeHtml(entry.changeFrequency)}</changefreq>`,
      `<priority>${escapeHtml(entry.priority)}</priority>`,
      '</url>'
    ].join(''))
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
}
