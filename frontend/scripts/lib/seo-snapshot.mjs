// scripts/lib/seo-snapshot.mjs
// The deploy's SEO snapshots (scripts/seo-snapshot.mjs): the SPA shell with one route's head tags,
// the files they go to, and the sitemap. The tags come from headFor() in shared/seo.mjs, the same
// function the running site uses, and carry data-seo-snapshot so the app can drop them.
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { SNAPSHOT_ATTRIBUTE, headFor, localizedPath } from '../../shared/seo.mjs'

// The sections whose pages are records (`/<section>/<slug>/`); a record taken offline leaves its snapshot here.
const RECORD_SECTIONS = ['exhibitions', 'venues', 'persons', 'organisations', 'sponsors']

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
    `<title ${SNAPSHOT_ATTRIBUTE}>${escapeHtml(head.title)}</title>`,
    ...head.meta.map((tag) => `<meta ${SNAPSHOT_ATTRIBUTE}${attributes({ name: tag.name, property: tag.property, content: tag.content })}>`),
    ...head.link.map((link) => `<link ${SNAPSHOT_ATTRIBUTE}${attributes({ rel: link.rel, hreflang: link.hreflang, href: link.href })}>`),
    // headFor() already writes "<" as \u003c, so no "</script>" can occur inside.
    ...head.jsonLd.map((json) => `<script ${SNAPSHOT_ATTRIBUTE} type="application/ld+json">${json}</script>`)
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

/** The snapshot file of an entry, relative to the output folder (English under en/); undefined for a path that would leave it. */
export const snapshotFile = (entry) => {
  const segments = localizedPath(entry.path, entry.locale).split('/').filter(Boolean)
  if (segments.some((segment) => segment === '.' || segment === '..' || segment.includes('\\'))) return undefined
  return [...segments, 'index.html'].join('/')
}

/** The record snapshots (`<section>/<slug>/index.html`, also under en/) among `files` that no entry writes any more. */
export const staleSnapshots = (files, entries) => {
  const written = new Set(entries.map(snapshotFile))
  const recordPage = new RegExp(`^(en/)?(${RECORD_SECTIONS.join('|')})/[^/]+/index\\.html$`)
  return files.filter((file) => recordPage.test(file) && !written.has(file))
}

/**
 * Writes the snapshot of every entry into `output` and removes the snapshots of records that have
 * no entry any more (taken offline since the build that --skip-build reuses). Other files stay.
 */
export const writeSnapshots = async (output, shell, entries) => {
  const problems = []
  // Old snapshots go first: on a disk that ignores case (macOS), a slug whose case changed shares
  // its folder with the new snapshot, which removing afterwards would delete.
  const found = []
  for (const prefix of ['', 'en/']) for (const section of RECORD_SECTIONS) {
    for (const slug of await readdir(join(output, prefix, section)).catch(() => [])) {
      const file = `${prefix}${section}/${slug}/index.html`
      if (await stat(join(output, file)).then((info) => info.isFile(), () => false)) found.push(file)
    }
  }
  const removed = []
  for (const file of staleSnapshots(found, entries)) {
    // The whole folder goes: left without index.html, nginx would answer 403 instead of serving
    // the app. Only hidden files (.DS_Store) may go with it; anything else stops the deploy.
    const folder = dirname(join(output, file))
    const others = (await readdir(folder)).filter((name) => name !== 'index.html' && !name.startsWith('.'))
    if (others.length) {
      problems.push(`${dirname(file)}/: holds files besides its old snapshot (${others.join(', ')}); without index.html nginx would answer 403`)
      continue
    }
    await rm(folder, { recursive: true })
    removed.push(file)
  }
  for (const entry of entries) {
    const file = snapshotFile(entry)
    if (!file) {
      problems.push(`${entry.path} (${entry.locale}): leaves the output folder`)
      continue
    }
    const html = renderSnapshot(shell, entry)
    problems.push(...verifySnapshot(html, entry))
    await mkdir(dirname(join(output, file)), { recursive: true })
    await writeFile(join(output, file), html)
  }
  return { problems, removed }
}
