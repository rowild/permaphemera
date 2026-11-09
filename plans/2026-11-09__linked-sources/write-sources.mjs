// Writes the researched source links into production Directus (plan: ../2026-11-09__linked-sources.md).
// Replaces only the closing sources list of each text, in the record field (English) and in the
// en/de translations; the text above it and the status stay as they are. A backup of every
// touched text goes to backup-<time>.json first.
//
//   node plans/2026-11-09__linked-sources/write-sources.mjs            dry run: prints the new lists
//   node plans/2026-11-09__linked-sources/write-sources.mjs --apply    writes them
//   … --only <slug>[,<slug>]                                            only these records
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const here = decodeURIComponent(new URL('.', import.meta.url).pathname)
const env = Object.fromEntries(readFileSync(`${here}../../frontend/.env`, 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const base = env.NUXT_PUBLIC_DIRECTUS_URL
const headers = { Authorization: `Bearer ${env.DIRECTUS_TOKEN}`, 'Content-Type': 'application/json' }
const apply = process.argv.includes('--apply')
const onlyArg = process.argv[process.argv.indexOf('--only') + 1]
const only = process.argv.includes('--only') ? new Set(onlyArg.split(',')) : null

const FIELD = { pp_persons: 'about_html', pp_exhibitions: 'description', pp_organisations: 'about_html', pp_venues: 'about_html', pp_events: 'about_html' }
const SOURCES = /(<p>\s*(?:Quellen?|Sources?)\s*:?\s*<\/p>\s*<ul>)([\s\S]*?)(<\/ul>\s*)$/i
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const formatDate = (iso, language) => {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, year, month, day] = match
  return language === 'de' ? `${Number(day)}. ${Number(month)}. ${year}` : `${Number(day)} ${MONTHS_EN[Number(month) - 1]} ${year}`
}
// A quote inside the headline becomes the inner (single) quote of the language.
const inner = (title, language) => title.replace(/[„“"]([^„“”"]+)[“”"]/g, language === 'de' ? '‚$1‘' : '‘$1’')
const quote = (title, language) => (language === 'de' ? `„${inner(title, language)}“` : `“${inner(title, language)}”`)

// A page title that only names the kind of page ("About", "Vita", "Home") is no headline: the line
// then reads "site – Biografie" (no quotes), in the language of the text.
const GENERIC = [
  [/^\.?\s*(about|über( mich)?|ueber( mich)?)$/i, { de: 'Über', en: 'About' }],
  [/^(vita|bio|biogra(f|ph)(ie|y)|cv|lebenslauf)$/i, { de: 'Biografie', en: 'Biography' }],
  [/^(home|start(seite)?|index)$/i, { de: 'Startseite', en: 'Home page' }]
]
const genericLabel = (title, language) => GENERIC.find(([pattern]) => pattern.test(title.trim()))?.[1][language === 'de' ? 'de' : 'en']

/** One list item: the whole line is the link (title, site, date); without a URL the old text stays. */
export function sourceItem (source, original, language) {
  if (!source?.url || !/^https?:\/\//.test(source.url)) return `<li>${original}</li>`
  const generic = source.title ? genericLabel(source.title, language) : null
  const parts = generic
    ? [`${source.site} – ${generic}`, formatDate(source.date, language)].filter(Boolean)
    : [source.title ? quote(source.title.trim(), language) : null, source.site, formatDate(source.date, language)].filter(Boolean)
  return `<li><a href="${escape(source.url)}">${escape(parts.join(', '))}</a></li>`
}

const research = readdirSync(`${here}research`).filter((file) => /^group-\d+\.json$/.test(file))
  .flatMap((file) => JSON.parse(readFileSync(`${here}research/${file}`, 'utf8')))
const open = []
const backup = []
const backupFile = `${here}backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
let changed = 0

for (const entry of research) {
  if (only && !only.has(entry.slug)) continue
  const field = FIELD[entry.collection]
  const record = (await (await fetch(`${base}/items/${entry.collection}/${entry.id}?fields=id,slug,status,${field},translations.id,translations.languages_code,translations.${field}`, { headers })).json()).data
  if (!record) { open.push(`${entry.slug}: record not found`); continue }

  const rewrite = (html, language) => {
    const match = html?.match(SOURCES)
    if (!match) return null
    const originals = [...match[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1])
    if (originals.length !== entry.sources.length) {
      open.push(`${entry.slug} (${language}): ${originals.length} sources in the text, ${entry.sources.length} researched — left as it is`)
      return null
    }
    const items = originals.map((original, index) => sourceItem(entry.sources[index], original, language)).join('')
    return html.replace(SOURCES, `$1${items}$3`)
  }

  const updates = []
  for (const translation of record.translations ?? []) {
    const next = rewrite(translation[field], translation.languages_code)
    if (next && next !== translation[field]) updates.push({ id: translation.id, [field]: next, language: translation.languages_code })
  }
  const english = updates.find((update) => update.language === 'en')?.[field]
  entry.sources.forEach((source) => { if (!source.url) open.push(`${entry.slug}: ${source.original}${source.note ? ` — ${source.note}` : ''}`) })
  if (!updates.length) continue

  changed++
  backup.push({ collection: entry.collection, id: record.id, slug: record.slug, [field]: record[field], translations: record.translations })
  if (apply) writeFileSync(backupFile, JSON.stringify(backup, null, 1)) // saved before the write
  const body = { translations: { update: updates.map(({ language, ...rest }) => rest) }, ...(english ? { [field]: english } : {}) }
  if (!apply) {
    console.log(`\n${entry.slug} (${record.status})`)
    for (const update of updates) console.log(`  ${update.language}: ${update[field].match(SOURCES)?.[2]}`)
    continue
  }
  const response = await fetch(`${base}/items/${entry.collection}/${record.id}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
  console.log(`${response.ok ? 'ok  ' : 'FAIL'} ${entry.collection} ${entry.slug}${response.ok ? '' : ` ${response.status} ${await response.text()}`}`)
}

if (apply && backup.length) console.log(`backup: ${backupFile}`)
writeFileSync(`${here}open-sources.md`, `# Sources without an exact page (${new Date().toISOString().slice(0, 10)})\n\n${open.map((line) => `- ${line}`).join('\n')}\n`)
console.log(`\n${changed} records ${apply ? 'written' : 'would change'}; ${open.length} open points in open-sources.md`)
