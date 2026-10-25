// Static CSS check: every property, value keyword, function, selector and
// at-rule in the site's shipped CSS, looked up for Safari 18 / 26 / 27. It
// covers the generation no machine here can run (Safari 18).
//
//   node qa/safari/audit/css.mjs [file.css …]   (default: results/<run>/build/*.css; run fetch.mjs first)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import postcss from 'postcss'
import { RESULTS_DIR, TARGET } from '../config.mjs'
import { TARGETS, bcd, cell, firstVersion, getCompat, supportPair } from './bcd.mjs'
import { buildDir } from './fetch.mjs'

const runId = process.env.QA_RUN_ID || 'audit'
let files = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!files.length) files = readdirSync(buildDir(runId)).filter((f) => f.endsWith('.css')).map((f) => resolve(buildDir(runId), f))

/** feature id → { path, prefix, label, count, examples:Set } */
const found = new Map()
function note(path, label, where, prefix = '') {
  const compat = getCompat(path)
  if (!compat) return
  const id = `${path}|${prefix}`
  const f = found.get(id) || { path, prefix, label, count: 0, examples: new Set(), compat }
  f.count++
  if (f.examples.size < 3) f.examples.add(where.slice(0, 90))
  found.set(id, f)
}

const FUNCTIONS = {
  'color-mix': 'css.types.color.color-mix', 'light-dark': 'css.types.color.light-dark', clamp: 'css.types.clamp',
  min: 'css.types.min', max: 'css.types.max', env: 'css.types.env', oklch: 'css.types.color.oklch', oklab: 'css.types.color.oklab',
  lab: 'css.types.color.lab', lch: 'css.types.color.lch', 'conic-gradient': 'css.types.gradient.conic-gradient',
  'radial-gradient': 'css.types.gradient.radial-gradient', 'linear-gradient': 'css.types.gradient.linear-gradient',
  'repeating-linear-gradient': 'css.types.gradient.repeating-linear-gradient',
  round: 'css.types.round', mod: 'css.types.mod', rem: 'css.types.rem', sin: 'css.types.sin', cos: 'css.types.cos',
  'drop-shadow': 'css.types.filter-function.drop-shadow', blur: 'css.types.filter-function.blur',
  anchor: 'css.types.anchor', 'anchor-size': 'css.types.anchor-size', attr: 'css.types.attr',
}

/** Prefixed declarations in one rule, so an unsupported unprefixed property
 *  with a working -webkit- twin beside it is not reported as a problem. */
function prefixedSiblings(decl) {
  const set = new Set()
  decl.parent?.each?.((d) => {
    if (d.type === 'decl' && d.prop.startsWith('-webkit-')) set.add(d.prop.slice(8))
  })
  return set
}

for (const file of files) {
  const root = postcss.parse(readFileSync(file, 'utf8'), { from: file })
  root.walkDecls((d) => {
    const prop = d.prop.toLowerCase()
    if (prop.startsWith('--')) return
    const where = `${d.parent?.selector || d.parent?.name || ''} { ${prop}: ${d.value} }`
    const m = prop.match(/^-(webkit|moz|ms|o)-(.+)$/)
    const name = m ? m[2] : prop
    const prefix = m ? `-${m[1]}-` : ''
    if (d.parent?.type === 'atrule' && d.parent.name === 'font-face') {
      note(`css.at-rules.font-face.${name}`, `@font-face ${name}`, where)
      return
    }
    if (prefix === '-moz-' || prefix === '-ms-' || prefix === '-o-') return
    if (bcd.css.properties[prop] && prefix) {
      note(`css.properties.${prop}`, prop, where)
    } else if (bcd.css.properties[name]) {
      const covered = !prefix && prefixedSiblings(d).has(name)
      note(`css.properties.${name}`, prefix ? prop : covered ? `${name} (has -webkit- twin)` : name, where, covered ? '-webkit-' : prefix)
      for (const word of d.value.toLowerCase().match(/[a-z][a-z-]*/g) || []) {
        const sub = bcd.css.properties[name][word]
        if (sub?.__compat && word !== name) note(`css.properties.${name}.${word}`, `${name}: ${word}`, where)
      }
    }
    for (const fn of d.value.toLowerCase().matchAll(/([a-z-]+)\(/g)) if (FUNCTIONS[fn[1]]) note(FUNCTIONS[fn[1]], `${fn[1]}()`, where)
    if (/\b\d*\.?\d+(dvh|svh|lvh|dvw|svw|lvw)\b/.test(d.value)) note('css.types.length.viewport_percentage_units_dynamic', 'dvh/svh/lvh units', where)
    if (/\b\d*\.?\d+(cqw|cqh|cqi|cqb|cqmin|cqmax)\b/.test(d.value)) note('css.types.length.container_query_length_units', 'container query units', where)
  })
  root.walkRules((r) => {
    if (r.parent?.type === 'atrule' && /keyframes/.test(r.parent.name)) return
    for (const m of r.selector.matchAll(/(::?)(-?[a-z][a-z-]*)/g)) if (bcd.css.selectors[m[2]]) note(`css.selectors.${m[2]}`, `${m[1]}${m[2]}`, r.selector)
    if (r.parent?.type === 'rule') note('css.selectors.nesting', 'CSS nesting', r.selector)
  })
  root.walkAtRules((a) => {
    const name = a.name.toLowerCase()
    if (bcd.css['at-rules'][name]) note(`css.at-rules.${name}`, `@${name}`, `@${name} ${a.params}`)
    if (name === 'supports' && /selector\(/.test(a.params)) note('css.at-rules.supports.selector', '@supports selector()', `@supports ${a.params}`)
    if (name === 'media') {
      for (const feat of a.params.matchAll(/\(\s*([a-z-]+)\s*[:)]/g)) if (bcd.css['at-rules'].media[feat[1]]) note(`css.at-rules.media.${feat[1]}`, `@media (${feat[1]})`, `@media ${a.params}`)
    }
  })
}

// iOS has no mouse cursor and no styled scrollbars: "unsupported" means nothing there.
const IOS_NA = (label) => /^cursor\b/.test(label) || /^::-webkit-scrollbar/.test(label)
const rows = [...found.values()].map((f) => {
  const res = TARGETS.map((t) => {
    const pair = supportPair(f.compat, t.version, f.prefix)
    if (IOS_NA(f.label)) pair.safari_ios = 'na'
    return pair
  })
  return { ...f, res, first: firstVersion(f.compat, f.prefix) }
})
const bad = (x) => !['yes', 'unknown', 'na'].includes(x)
const problems = rows.filter((r) => r.res.some((p) => bad(p.safari) || bad(p.safari_ios))).sort((a, b) => a.label.localeCompare(b.label))

const head = `| Feature | Uses | ${TARGETS.map((t) => t.label).join(' | ')} | First Safari (mac / iOS) | Example |\n|---|---|${TARGETS.map(() => '---').join('|')}|---|---|`
const line = (r) => `| \`${r.label}\` | ${r.count} | ${r.res.map(cell).join(' | ')} | ${r.first.safari} / ${r.first.safari_ios} | \`${[...r.examples][0].replace(/\|/g, '\\|')}\` |`

const md = [
  '# CSS check — Safari 18 / 26 / 27',
  '',
  `Site: ${TARGET}. Files: ${files.map((f) => `\`${basename(f)}\``).join(', ')}`,
  `Source: @mdn/browser-compat-data ${bcd.__meta?.version || ''}. A cell names Mac and iOS apart when they differ; n/a = iOS has no such thing (cursor, styled scrollbars).`,
  '',
  `${rows.length} distinct features found. ${problems.length} are not fully supported in at least one generation:`,
  '',
  problems.length ? head : '_None._',
  ...problems.map(line),
  '',
  '<details><summary>All features found</summary>',
  '',
  head,
  ...rows.sort((a, b) => a.label.localeCompare(b.label)).map(line),
  '',
  '</details>',
].join('\n')

mkdirSync(resolve(RESULTS_DIR, runId), { recursive: true })
const out = resolve(RESULTS_DIR, runId, 'audit-css.md')
writeFileSync(out, md)
console.log(md.split('\n<details>')[0])
console.log(`\n→ ${out}`)
