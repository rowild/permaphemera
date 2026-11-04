// scripts/news-report.mjs — the monthly news report (plans/2026-11-04__news-system.md §7).
//
//   pnpm news:report                      print the report; changes nothing
//   node scripts/news-report.mjs --mail <file>
//                                         write the mail to <file> and the next state to
//                                         <state>.pending; scripts/server/news-report.sh sends
//                                         the mail and only then makes the pending state the state
//
// NEWS_REPORT_STATE: the state file of the last report (default .news-report-state.json here,
// git-ignored). NEWS_REPORT_FROM / NEWS_REPORT_TO: the addresses (only for --mail).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadArchiveFromDirectus, runCheck } from './lib/archive-source.mjs'
import { buildReport, mailOf } from './lib/news-report.mjs'
import { viennaToday } from '../shared/seo.mjs'

const args = process.argv.slice(2)
const mailIndex = args.indexOf('--mail')
const mailFile = mailIndex >= 0 ? args[mailIndex + 1] : undefined
const statePath = resolve(process.env.NEWS_REPORT_STATE || resolve(import.meta.dirname, '..', '.news-report-state.json'))

await runCheck(async () => {
  const today = viennaToday()
  const previous = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : undefined
  const { text, next } = buildReport(await loadArchiveFromDirectus(), previous, today)

  if (!mailFile) {
    process.stdout.write(text)
    return
  }
  const from = process.env.NEWS_REPORT_FROM
  const to = process.env.NEWS_REPORT_TO
  if (!from || !to) throw new Error('NEWS_REPORT_FROM and NEWS_REPORT_TO must be set for --mail')
  writeFileSync(mailFile, mailOf({ from, to, today, text }))
  writeFileSync(`${statePath}.pending`, `${JSON.stringify(next, null, 2)}\n`)
  console.log(`[news-report] mail for ${to} written to ${mailFile}; state waits in ${statePath}.pending`)
})
