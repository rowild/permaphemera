// Moves the closing "Source: a, b." / "Quelle: a, b." of every text into its own block:
// a label paragraph and a list (owner, 2026-11-06; plans/2026-11-06__sources-as-list.md).
// Run from directus/:
//   DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-06__sources-as-list/migrate-sources.mjs <persons|organisations> [--dry-run]
// Writes backup-<part>-<time>.json (every touched field, before) next to this file first. Deletes nothing.
// A text whose source line is not at its very end is reported and left alone.
import { writeFileSync } from 'node:fs'
import { loadEnv, login } from '../../directus/scripts/lib.mjs'
import { LABEL, sourcesToList, splitSources } from './sources.mjs'

const PARTS = {
  persons: { collection: 'pp_persons', translations: 'pp_translations__persons', key: 'persons_id', field: 'about_html', kind: 'html' },
  organisations: { collection: 'pp_organisations', translations: 'pp_translations__organisations', key: 'organisations_id', field: 'about_html', kind: 'html' }
}
const part = PARTS[process.argv[2]]
const dryRun = process.argv.includes('--dry-run')
if (!part) throw new Error(`usage: migrate-sources.mjs <${Object.keys(PARTS).join('|')}> [--dry-run]`)

// The HTML rule lives in sources.mjs (shared with exhibitions-to-wysiwyg.mjs). The Markdown branch
// was for the exhibition descriptions before their field became WYSIWYG; it is no longer used.
const MD_TAIL = /\s*(?:Sources?|Quellen?)\s*:\s*((?:(?!(?:Sources?|Quellen?)\s*:)[^\n])+?)\s*$/i
const convert = (text, language, kind) => {
  if (kind === 'html') return sourcesToList(text, language)
  if (typeof text !== 'string') return { status: 'empty' }
  const match = text.match(MD_TAIL)
  if (!match) return { status: /(?:Sources?|Quellen?)\s*:/i.test(text) ? 'not-at-end' : 'none' }
  const items = splitSources(match[1])
  const label = LABEL[language][items.length > 1 ? 1 : 0]
  return { status: 'changed', text: `${text.slice(0, match.index).trimEnd()}\n\n${label}\n\n${items.map((item) => `- ${item}`).join('\n')}` }
}

const { api } = await login(loadEnv())
const records = await api('GET', `/items/${part.collection}?fields=id,slug,${part.field}&limit=-1`)
const entries = await api('GET', `/items/${part.translations}?fields=id,${part.key},languages_code,${part.field}&limit=-1`)
const slugOf = Object.fromEntries(records.map((record) => [record.id, record.slug]))

const jobs = [
  ...records.map((record) => ({ where: `${part.collection}/${record.slug}`, path: `/items/${part.collection}/${record.id}`, language: 'en', text: record[part.field] })),
  ...entries.map((entry) => ({ where: `${part.translations}/${entry.id} (${slugOf[entry[part.key]]}, ${entry.languages_code})`, path: `/items/${part.translations}/${entry.id}`, language: entry.languages_code, text: entry[part.field] }))
].filter((job) => LABEL[job.language])

const changes = []
const skipped = []
for (const job of jobs) {
  const result = convert(job.text, job.language, part.kind)
  if (result.status === 'changed') changes.push({ ...job, after: result.text })
  if (result.status === 'not-at-end') skipped.push(job.where)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupFile = new URL(`./backup-${process.argv[2]}-${stamp}.json`, import.meta.url)
writeFileSync(backupFile, `${JSON.stringify(changes.map(({ where, path, text }) => ({ where, path, field: part.field, before: text })), null, 2)}\n`)

for (const change of changes) {
  if (dryRun) { console.log(`~ ${change.where}\n  ${change.after.slice(-260).replace(/\n/g, '⏎')}`); continue }
  await api('PATCH', change.path, { [part.field]: change.after })
  console.log(`~ ${change.where}`)
}
for (const where of skipped) console.log(`! not at the end, left alone: ${where}`)
console.log(`${changes.length} texts ${dryRun ? 'would change' : 'changed'}, ${skipped.length} left alone. Backup: ${decodeURIComponent(backupFile.pathname)}`)
