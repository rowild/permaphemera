// scripts/seo-snapshot.mjs — run by deploy-hetzner.sh after the build (pnpm seo:snapshot).
// Writes one static HTML file per route and locale into .output/public: the SPA shell
// (200.html) with that route's SEO head, so crawlers and link previews that do not run
// JavaScript see the right title, description, share image, canonical, hreflang and JSON-LD.
// nginx serves `<route>/index.html` before falling back to /200.html. Also writes sitemap.xml,
// removes the snapshots of records taken offline, and warns about SEO texts whose tour wording
// is out of date. Entries come from shared/seo.mjs, the module the running site uses (usePageSeo).
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { directusUrl, loadArchiveFromDirectus, runCheck } from './lib/archive-source.mjs'
import { renderSitemap, sitemapProblems, writeSnapshots } from './lib/seo-snapshot.mjs'
import { recordSeoEntries, seoCounts, staleTourWording, staticSeoEntries } from '../shared/seo.mjs'

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
  const entries = [...staticSeoEntries(messages, seoCounts(archive)), ...recordSeoEntries(archive, { assetBase: directusUrl, messages })]

  // The spec's check: every route gets a snapshot with one title, one description and its
  // canonical, and the sitemap lists exactly the indexable routes. Any problem stops the deploy.
  const { problems, removed } = await writeSnapshots(output, shell, entries)
  for (const file of removed) console.log(`[seo] removed ${file}: the record is no longer published`)
  const sitemap = renderSitemap(entries)
  problems.push(...sitemapProblems(sitemap, entries))
  if (problems.length) {
    console.error(`[seo] ${problems.length} problems:\n  ${problems.join('\n  ')}`)
    process.exit(1)
  }
  await writeFile(resolve(output, 'sitemap.xml'), sitemap)

  const indexed = entries.filter((entry) => !entry.noIndex).length
  console.log(`[seo] ${entries.length} snapshots written, ${indexed} addresses in sitemap.xml (assets from ${directusUrl})`)

  // A reminder, not a stop: the text still promises a tour that is open now, or will not come.
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vienna' })
  const stale = archive.exhibitions.filter((exhibition) => exhibition.status === 'published' && staleTourWording(exhibition, today))
  if (stale.length) {
    console.warn(`[seo] WARNING: the SEO text of ${stale.length} exhibitions talks about the 360° tour as it no longer is. Update it in Directus (SEO section, de and en):`)
    for (const exhibition of stale) console.warn(`[seo]   ${exhibition.slug}`)
  }
})
