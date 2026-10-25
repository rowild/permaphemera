// Static JS check: newer browser APIs in the site's shipped chunks, looked up
// for Safari 18 / 26 / 27. Vite lowers SYNTAX to its target but adds no
// polyfills, so an API newer than the oldest Safari under review is a crash
// waiting to happen, unless the code checks for it first. A hit is a lead to
// read, not a verdict: the "guard nearby?" column shows the text around it.
// (The tour viewer's own bundle has its own check in that project.)
//
//   node qa/safari/audit/js.mjs   (reads results/<run>/build/*.js; run fetch.mjs first)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { RESULTS_DIR, TARGET } from '../config.mjs'
import { TARGETS, cell, firstVersion, getCompat, supportPair } from './bcd.mjs'
import { buildDir } from './fetch.mjs'

const runId = process.env.QA_RUN_ID || 'audit'
const dir = buildDir(runId)
const files = readdirSync(dir).filter((f) => f.endsWith('.js'))

/** [label, regex, BCD paths to try] — APIs that came late to Safari or never. */
const APIS = [
  ['structuredClone', /\bstructuredClone\(/g, ['api.structuredClone', 'api.Window.structuredClone']],
  ['Promise.withResolvers', /\bPromise\.withResolvers\b/g, ['javascript.builtins.Promise.withResolvers']],
  ['Promise.try', /\bPromise\.try\b/g, ['javascript.builtins.Promise.try']],
  ['Object.groupBy', /\bObject\.groupBy\b/g, ['javascript.builtins.Object.groupBy']],
  ['Map.groupBy', /\bMap\.groupBy\b/g, ['javascript.builtins.Map.groupBy']],
  ['Array.fromAsync', /\bArray\.fromAsync\b/g, ['javascript.builtins.Array.fromAsync']],
  ['Array#toSorted', /\.toSorted\(/g, ['javascript.builtins.Array.toSorted']],
  ['Array#toReversed', /\.toReversed\(/g, ['javascript.builtins.Array.toReversed']],
  ['Array#toSpliced', /\.toSpliced\(/g, ['javascript.builtins.Array.toSpliced']],
  ['Array#findLast', /\.findLast(Index)?\(/g, ['javascript.builtins.Array.findLast']],
  ['Object.hasOwn', /\bObject\.hasOwn\(/g, ['javascript.builtins.Object.hasOwn']],
  ['String#replaceAll', /\.replaceAll\(/g, ['javascript.builtins.String.replaceAll']],
  ['Set#union etc.', /\.(union|intersection|symmetricDifference|isSubsetOf|isDisjointFrom)\(/g, ['javascript.builtins.Set.union']],
  ['Iterator helpers', /\bIterator\.from\b|\.(values|keys|entries)\(\)\.(map|filter|take|drop|flatMap|toArray)\(/g, ['javascript.builtins.Iterator.map']],
  ['Intl.Segmenter', /\bIntl\.Segmenter\b/g, ['javascript.builtins.Intl.Segmenter']],
  ['Intl.DateTimeFormat#formatRange', /\.formatRange(ToParts)?\(/g, ['javascript.builtins.Intl.DateTimeFormat.formatRange']],
  ['Intl.ListFormat', /\bIntl\.ListFormat\b/g, ['javascript.builtins.Intl.ListFormat']],
  ['Intl.DurationFormat', /\bIntl\.DurationFormat\b/g, ['javascript.builtins.Intl.DurationFormat']],
  ['WeakRef', /\bnew WeakRef\(/g, ['javascript.builtins.WeakRef']],
  ['requestIdleCallback', /\brequestIdleCallback\b/g, ['api.Window.requestIdleCallback']],
  ['scheduler.yield / postTask', /\bscheduler\.(yield|postTask)\b/g, ['api.Scheduler.yield', 'api.Scheduler.postTask']],
  ['OffscreenCanvas', /\bOffscreenCanvas\b/g, ['api.OffscreenCanvas']],
  ['createImageBitmap', /\bcreateImageBitmap\(/g, ['api.createImageBitmap', 'api.Window.createImageBitmap']],
  ['AbortSignal.timeout', /\bAbortSignal\.timeout\b/g, ['api.AbortSignal.timeout_static']],
  ['AbortSignal.any', /\bAbortSignal\.any\b/g, ['api.AbortSignal.any_static']],
  ['URL.canParse', /\bURL\.canParse\b/g, ['api.URL.canParse_static']],
  ['URL.parse', /\bURL\.parse\(/g, ['api.URL.parse_static']],
  ['document.startViewTransition', /\bstartViewTransition\b/g, ['api.Document.startViewTransition']],
  ['Element#checkVisibility', /\.checkVisibility\(/g, ['api.Element.checkVisibility']],
  ['popover API', /\.(showPopover|hidePopover|togglePopover)\(/g, ['api.HTMLElement.showPopover']],
  ['HTMLDialogElement', /\.showModal\(/g, ['api.HTMLDialogElement.showModal']],
  ['Element#requestFullscreen', /\.requestFullscreen\b/g, ['api.Element.requestFullscreen']],
  ['visualViewport', /\bvisualViewport\b/g, ['api.Window.visualViewport']],
  ['ResizeObserver', /\bnew ResizeObserver\(/g, ['api.ResizeObserver']],
  ['Element#inert', /\.inert\s*=/g, ['api.HTMLElement.inert']],
  ['navigator.userActivation', /\buserActivation\b/g, ['api.Navigator.userActivation']],
  ['canvas 2D ctx.filter', /\.filter\s*=\s*[`'"]?blur/g, ['api.CanvasRenderingContext2D.filter']],
  ['scrollend event', /["']scrollend["']/g, ['api.Element.scrollend_event']],
]

const rows = []
for (const [label, re, paths] of APIS) {
  const hits = []
  for (const f of files) {
    const src = readFileSync(resolve(dir, f), 'utf8')
    for (const m of src.matchAll(re)) hits.push({ f, ctx: src.slice(Math.max(0, m.index - 60), m.index + 50).replace(/\s+/g, ' ') })
  }
  if (!hits.length) continue
  const path = paths.find((p) => getCompat(p))
  const compat = path ? getCompat(path) : null
  const guarded = /typeof|in window|in navigator|\?\.|\|\||&&|try\s*\{|catch/.test(hits[0].ctx)
  rows.push({
    label, count: hits.length, inFiles: [...new Set(hits.map((h) => h.f))], ctx: hits[0].ctx, guarded,
    res: compat ? TARGETS.map((t) => supportPair(compat, t.version)) : null,
    first: compat ? firstVersion(compat) : null,
  })
}

const bad = (r) => r.res && r.res.some((p) => p.safari !== 'yes' || p.safari_ios !== 'yes')
const head = `| API | Hits | ${TARGETS.map((t) => t.label).join(' | ')} | First Safari (mac / iOS) | Guard nearby? | In | First hit |\n|---|---|${TARGETS.map(() => '---').join('|')}|---|---|---|---|`
const line = (r) => `| \`${r.label}\` | ${r.count} | ${r.res ? r.res.map(cell).join(' | ') : TARGETS.map(() => '?').join(' | ')} | ${r.first ? `${r.first.safari} / ${r.first.safari_ios}` : '?'} | ${r.guarded ? 'looks guarded' : '—'} | ${r.inFiles.slice(0, 3).join(', ')}${r.inFiles.length > 3 ? ' …' : ''} | \`${r.ctx.replace(/\|/g, '\\|').replace(/`/g, "'")}\` |`
const md = [
  '# JS check — Safari 18 / 26 / 27',
  '',
  `Site: ${TARGET}. ${files.length} chunks from /_nuxt/ (Nuxt, Vue, three.js, GSAP). The tour viewer is checked in its own project.`,
  '',
  '## Not available in every generation',
  '',
  rows.some(bad) ? head : '_None._',
  ...rows.filter(bad).map(line),
  '',
  '## Available in all three',
  '',
  head,
  ...rows.filter((r) => !bad(r)).map(line),
].join('\n')

mkdirSync(resolve(RESULTS_DIR, runId), { recursive: true })
const out = resolve(RESULTS_DIR, runId, 'audit-js.md')
writeFileSync(out, md)
console.log(md)
console.log(`\n→ ${out}`)
