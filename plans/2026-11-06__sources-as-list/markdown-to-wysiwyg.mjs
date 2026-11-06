// No Markdown fields (owner, 2026-11-06; plans/2026-11-06__no-markdown-fields.md). Switches the
// two Markdown fields and their translation fields to the WYSIWYG meta of schema.mjs and turns
// their texts into HTML:
//   exhibitions: plain text → paragraphs, the closing "Source: …" → label paragraph + list,
//   news:        Markdown → HTML (paragraphs, bold, italic, lists, links).
// Run only after the site that renders the HTML is live. Run from directus/:
//   DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-06__sources-as-list/markdown-to-wysiwyg.mjs [--dry-run]
// Writes backup-markdown-<time>.json (field meta and every text, before) first. Deletes nothing.
import { writeFileSync } from 'node:fs'
import { buildAll } from '../../directus/scripts/build.mjs'
import { loadEnv, login } from '../../directus/scripts/lib.mjs'
import { LABEL, markdownToHtml, plainToHtml, sourcesToList } from './sources.mjs'

const dryRun = process.argv.includes('--dry-run')
const { api } = await login(loadEnv())

const PARTS = [
  { collection: 'pp_exhibitions', translations: 'pp_translations__exhibitions', key: 'exhibitions_id',
    toHtml: (text, language) => { const html = plainToHtml(text); return LABEL[language] ? sourcesToList(html, language) : { status: 'none', text: html } } },
  { collection: 'pp_news', translations: 'pp_translations__news', key: 'news_id',
    toHtml: (text) => ({ status: 'none', text: markdownToHtml(text) }) }
]
const fieldNames = PARTS.flatMap((part) => [part.collection, part.translations])
const built = Object.fromEntries(buildAll().collections
  .filter((c) => fieldNames.includes(c.collection))
  .map((c) => [c.collection, c.fields.find((f) => f.field === 'description').meta]))

const metaBefore = {}
for (const name of fieldNames) metaBefore[name] = (await api('GET', `/fields/${name}/description`)).meta

const changes = []
const problems = []
for (const part of PARTS) {
  const records = await api('GET', `/items/${part.collection}?fields=id,slug,description&limit=-1`)
  const entries = await api('GET', `/items/${part.translations}?fields=id,${part.key},languages_code,description&limit=-1`)
  const slugOf = Object.fromEntries(records.map((record) => [record.id, record.slug]))
  const jobs = [
    ...records.map((record) => ({ where: `${part.collection}/${record.slug}`, path: `/items/${part.collection}/${record.id}`, language: 'en', text: record.description })),
    ...entries.map((entry) => ({ where: `${part.translations}/${entry.id} (${slugOf[entry[part.key]]}, ${entry.languages_code})`, path: `/items/${part.translations}/${entry.id}`, language: entry.languages_code, text: entry.description }))
  ]
  for (const job of jobs) {
    if (typeof job.text !== 'string' || !job.text.trim()) continue
    if (/<\/?(?:p|ul|ol|li|strong|em|br|a)\b[^>]*>/i.test(job.text)) { problems.push(`already HTML, left alone: ${job.where}`); continue }
    const result = part.toHtml(job.text, job.language)
    if (result.status === 'not-at-end') problems.push(`source not at the end (paragraphs only): ${job.where}`)
    changes.push({ ...job, after: result.text })
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupFile = new URL(`./backup-markdown-${stamp}.json`, import.meta.url)
writeFileSync(backupFile, `${JSON.stringify({ metaBefore, texts: changes.map(({ where, path, text }) => ({ where, path, field: 'description', before: text })) }, null, 2)}\n`)

for (const name of fieldNames) {
  const { interface: iface, options, note, translations } = built[name]
  if (dryRun) { console.log(`~ field ${name}.description: ${metaBefore[name].interface} → ${iface} ${JSON.stringify(options.toolbar)}`); continue }
  await api('PATCH', `/fields/${name}/description`, { meta: { interface: iface, options, note, translations } })
  console.log(`~ field ${name}.description → ${iface}`)
}
for (const change of changes) {
  if (dryRun) { console.log(`~ ${change.where}\n  ${change.after.slice(0, 160)} … ${change.after.slice(-160)}`); continue }
  await api('PATCH', change.path, { description: change.after })
  console.log(`~ ${change.where}`)
}
for (const problem of problems) console.log(`! ${problem}`)
console.log(`${changes.length} texts ${dryRun ? 'would change' : 'changed'}. Backup: ${decodeURIComponent(backupFile.pathname)}`)
