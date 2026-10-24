// scripts/seo-snapshot.mjs — run by deploy-hetzner.sh after the build (pnpm seo:snapshot).
// Writes one static HTML file per route and locale into .output/public: the SPA shell
// (200.html) with that route's SEO head, so crawlers and link previews that do not run
// JavaScript see the right title, description, share image, canonical, hreflang and JSON-LD.
// nginx serves `<route>/index.html` before falling back to /200.html. Also writes sitemap.xml and
// removes the snapshots of records taken offline. Entries come from shared/seo.mjs, the module the
// running site uses (usePageSeo).
//
// The server runs it again every night (scripts/server/seo-refresh.sh) with SEO_OUTPUT_DIR set to
// the live folder, so an exhibition's tour sentence changes on its day without a deploy.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { directusUrl, loadArchiveFromDirectus, runCheck } from './lib/archive-source.mjs'
import { renderSitemap, sitemapProblems, writeIfChanged, writeSnapshots } from './lib/seo-snapshot.mjs'
import { recordSeoEntries, seoCounts, staticSeoEntries, viennaToday } from '../shared/seo.mjs'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, process.env.SEO_OUTPUT_DIR || '.output/public')
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'))

await runCheck(async () => {
  const [archive, de, en, shell] = await Promise.all([
    loadArchiveFromDirectus(),
    readJson('i18n/locales/de.json'),
    readJson('i18n/locales/en.json'),
    readFile(resolve(output, '200.html'), 'utf8')
  ])
  const messages = { de, en }
  const entries = [...staticSeoEntries(messages, seoCounts(archive)), ...recordSeoEntries(archive, { assetBase: directusUrl, messages, today: viennaToday() })]

  // The spec's check: every route gets a snapshot with one title, one description and its
  // canonical, and the sitemap lists exactly the indexable routes. Any problem stops the deploy.
  const { problems, removed, written } = await writeSnapshots(output, shell, entries)
  for (const file of removed) console.log(`[seo] removed ${file}: the record is no longer published`)
  const sitemap = renderSitemap(entries)
  problems.push(...sitemapProblems(sitemap, entries))
  if (problems.length) {
    console.error(`[seo] ${problems.length} problems:\n  ${problems.join('\n  ')}`)
    process.exit(1)
  }
  const sitemapChanged = await writeIfChanged(resolve(output, 'sitemap.xml'), sitemap)

  const indexed = entries.filter((entry) => !entry.noIndex).length
  console.log(`[seo] ${entries.length} snapshots (${written.length} changed), ${indexed} addresses in sitemap.xml${sitemapChanged ? ' (changed)' : ''} (assets from ${directusUrl})`)
})
