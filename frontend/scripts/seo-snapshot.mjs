// scripts/seo-snapshot.mjs — run by deploy-hetzner.sh after the build (pnpm seo:snapshot).
// Writes one static HTML file per route and locale into .output/public: the SPA shell
// (200.html) with that route's SEO head, so crawlers and link previews that do not run
// JavaScript see the right title, description, share image, canonical, hreflang and JSON-LD.
// nginx serves `<route>/index.html` before falling back to /200.html. Also writes sitemap.xml.
// Entries come from shared/seo.mjs, the module the running site uses (usePageSeo).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { directusUrl, loadArchiveFromDirectus, runCheck } from './lib/archive-source.mjs'
import { renderSitemap, renderSnapshot, sitemapProblems, verifySnapshot } from './lib/seo-snapshot.mjs'
import { localizedPath, recordSeoEntries, staticSeoEntries } from '../shared/seo.mjs'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, '.output/public')
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'))

await runCheck(async () => {
  const [archive, de, en, shell] = await Promise.all([
    loadArchiveFromDirectus(),
    readJson('i18n/locales/de.json'),
    readJson('i18n/locales/en.json'),
    readFile(resolve(output, '200.html'), 'utf8')
  ])
  const messages = { de, en }
  const counts = {
    venues: archive.venues.filter((venue) => venue.status === 'published').length,
    organisations: archive.organisations.filter((organisation) => organisation.status === 'published').length
  }
  const entries = [...staticSeoEntries(messages, counts), ...recordSeoEntries(archive, { assetBase: directusUrl, messages })]

  // The spec's check: every route gets a snapshot with one title, one description and its
  // canonical, and the sitemap lists exactly the indexable routes. Any problem stops the deploy.
  const problems = []
  for (const entry of entries) {
    const file = resolve(output, `.${localizedPath(entry.path, entry.locale)}index.html`)
    if (!file.startsWith(`${output}/`)) { problems.push(`${entry.path}: leaves .output/public`); continue }
    const html = renderSnapshot(shell, entry)
    problems.push(...verifySnapshot(html, entry))
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, html)
  }
  const sitemap = renderSitemap(entries)
  problems.push(...sitemapProblems(sitemap, entries))
  if (problems.length) {
    console.error(`[seo] ${problems.length} problems:\n  ${problems.join('\n  ')}`)
    process.exit(1)
  }
  await writeFile(resolve(output, 'sitemap.xml'), sitemap)

  const indexed = entries.filter((entry) => !entry.noIndex).length
  console.log(`[seo] ${entries.length} snapshots written, ${indexed} addresses in sitemap.xml (assets from ${directusUrl})`)
})
