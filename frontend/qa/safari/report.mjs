// Turns one run's reports and screenshots into summary.md (facts and numbers)
// and gallery.html (the same spot from every runner, one above the other).
//
//   node qa/safari/report.mjs [runId]        (default: the newest run)
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { RESULTS_DIR, ROUTES } from './config.mjs'

const isDir = (p) => statSync(p).isDirectory()
const runs = readdirSync(RESULTS_DIR).filter((d) => isDir(resolve(RESULTS_DIR, d)))
const runId = process.argv[2] || runs.sort((a, b) => statSync(resolve(RESULTS_DIR, b)).mtimeMs - statSync(resolve(RESULTS_DIR, a)).mtimeMs)[0]
const runDir = resolve(RESULTS_DIR, runId)

// Real Safari first (Simulator, then Mac), then Playwright's WebKit, then the Chromium control.
const rank = (r) => (r.startsWith('ios-sim') ? 0 : r.startsWith('mac-safari') ? 1 : r.startsWith('device') ? 2 : r.startsWith('webkit') ? 3 : 4)
const runners = readdirSync(runDir)
  .filter((d) => isDir(resolve(runDir, d)) && !d.startsWith('audit'))
  .sort((a, b) => rank(a) - rank(b) || b.localeCompare(a, undefined, { numeric: true }))
const isControl = (r) => r.startsWith('chromium')
const isPhone = (r) => /iphone|ios-sim|device/.test(r)

const load = (runner, job) => {
  const f = resolve(runDir, runner, `${job}.json`)
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null
}
const checkpointsOf = (runner) => {
  const f = resolve(runDir, runner, 'checkpoints.jsonl')
  return existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []
}
const cell = (s) => String(s ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ')
const yes = (b) => (b === true ? 'yes' : b === false ? '**no**' : '—')
const safariVersion = (ua) => (ua?.match(/Version\/([\d.]+)/) || ua?.match(/(Chrome|HeadlessChrome)\/([\d]+)/)?.slice(1) || [])[1] || '—'

const md = [`# Safari review of the website — run \`${runId}\``, '']
md.push('Runners: `ios-sim-*` = real Mobile Safari in the iOS Simulator · `mac-safari-*` = real Safari on this Mac · `device` = a phone or tablet by hand · `webkit-*` = Playwright\'s WebKit build (the engine, not Safari) · `chromium-*` = the control (a difference that shows there too is not a Safari problem).', '')

// ---- runners and browser facts -----------------------------------------------
md.push('## Runners and browser facts', '')
md.push('| Runner | Safari / engine | Viewport × DPR | Hover media | WebGL max texture | Container queries | `:has()` | `-webkit-backdrop-filter` | `formatRange` | Element fullscreen |')
md.push('|---|---|---|---|---|---|---|---|---|---|')
for (const r of runners) {
  const rep = ROUTES.map((route) => load(r, route.key)).find((x) => x?.env)
  if (!rep) continue
  const e = rep.env
  // Playwright's iPhone profile sends an iPhone Safari UA from Chromium too.
  const engine = isControl(r) ? `Chromium${/Chrome\//.test(e.userAgent) ? ` ${safariVersion(e.userAgent)}` : ' (iPhone UA)'}` : safariVersion(e.userAgent)
  md.push(`| ${r} | ${engine} | ${e.viewport.join('×')} × ${e.dpr} | ${yes(e.media.hover)} | ${e.webgl?.maxTextureSize ?? '—'} | ${yes(e.css['container-type'])} | ${yes(e.css[':has()'])} | ${yes(e.css['-webkit-backdrop-filter'])} | ${yes(e.js['Intl.DateTimeFormat#formatRange'])} | ${yes(e.js.requestFullscreen)} |`)
}
md.push('')

// ---- page errors -------------------------------------------------------------------
md.push('## Page errors', '')
const errorRows = []
for (const r of runners) {
  for (const route of ROUTES) {
    const rep = load(r, route.key)
    if (!rep) continue
    if (rep.probeError) errorRows.push(`| ${r} | ${route.key} | probe | 1 | ${cell(rep.probeError.slice(0, 160))} |`)
    const counts = new Map()
    for (const e of rep.errors || []) {
      const key = `${e.type} | ${e.message.slice(0, 160)}`
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    for (const [key, n] of counts) {
      const [type, message] = key.split(' | ')
      errorRows.push(`| ${r} | ${route.key} | ${type} | ${n}${n >= 60 ? '+' : ''} | ${cell(message)} |`)
    }
  }
}
md.push(errorRows.length ? '| Runner | Page | Type | Times | Message |\n|---|---|---|---|---|' : '_None in any runner._', ...errorRows, '')

const missing = []
for (const r of runners) for (const route of ROUTES) if (existsSync(resolve(runDir, r, 'shots', route.key)) && !load(r, route.key)) missing.push(`${r} / ${route.key}`)
if (missing.length) md.push(`**No report (crash, hang or timeout):** ${missing.join(', ')}`, '')

// ---- fonts -------------------------------------------------------------------------
md.push('## Fonts', '')
md.push('Cormorant Garamond ships as 300, 400 and 500, upright only. "Draws as Cormorant" compares the width of a test line with the fallback serif. "Faked" lists weight/style combinations the page uses that have no real face: the browser then fakes them, and Safari fakes them differently from Chrome.', '')
md.push('| Runner | Faces loaded | Draws as Cormorant (300/400/500) | Faked on any page | Fonts done after | `-webkit-text-size-adjust` |')
md.push('|---|---|---|---|---|---|')
for (const r of runners) {
  const reps = ROUTES.map((route) => load(r, route.key)).filter((x) => x?.fonts)
  if (!reps.length) continue
  const loaded = new Set()
  const faked = new Set()
  let lastFont = 0
  let draws = ''
  for (const rep of reps) {
    for (const f of rep.fonts.cormorantFaces) if (f.status === 'loaded') loaded.add(`${f.weight}${f.style === 'normal' ? '' : ' ' + f.style}`)
    for (const u of rep.fonts.used) if (u.faked) faked.add(`${u.weight} ${u.style} (${u.faked}, ${rep.job}: "${u.sample.slice(0, 24)}")`)
    for (const f of rep.fonts.files) lastFont = Math.max(lastFont, f.endMs)
    draws = ['300', '400', '500'].map((w) => (rep.fonts.renders[w]?.differsFromFallback ? 'yes' : '**no**')).join(' / ')
  }
  md.push(`| ${r} | ${[...loaded].sort().join(', ') || '**none**'} | ${draws} | ${cell([...faked].join('; ') || 'none')} | ${lastFont ? `${lastFont} ms` : '—'} | ${reps[0].fonts.root.webkitTextSizeAdjust ?? '—'} |`)
}
md.push('')

// ---- gradients ------------------------------------------------------------------------
md.push('## Gradients with text', '')
md.push('Pictures: gallery.html, sections "gradient-…". What each region is made of (from the first runner that found it):', '')
md.push('| Page | Region | Found by | Made of |', '|---|---|---|---|')
for (const route of ROUTES) {
  const seen = new Map()
  for (const r of runners) {
    for (const g of load(r, route.key)?.gradients || []) {
      if (!seen.has(g.key)) seen.set(g.key, { g, by: [] })
      seen.get(g.key).by.push(r)
    }
  }
  for (const { g, by } of seen.values()) {
    const s = g.style
    const made = [s.backgroundImage && `background: ${s.backgroundImage.slice(0, 90)}`, s.filter && `filter: ${s.filter.slice(0, 60)}`, s.mixBlendMode && `blend: ${s.mixBlendMode}`, s.clipPath && 'clip-path', Object.keys(g.pseudo || {}).length && `pseudo ${Object.keys(g.pseudo).join(' ')}`].filter(Boolean).join(' · ')
    md.push(`| ${route.key} | ${g.key} | ${by.length}/${runners.length} | ${cell(made || g.note)} |`)
  }
}
md.push('')

// ---- cards ----------------------------------------------------------------------------
md.push('## Card shadows on hover', '')
md.push('Two checks. **Clipped by**: an ancestor with `overflow` other than visible (or a clip-path) that cuts the visible part of the card\'s drop-shadow, the usual cause of a shadow that ends in a straight line. **Edge below**: the biggest brightness step (0–255) between two neighbouring pixel rows in the shadow zone below the card (middle 70 % of its width). A soft shadow stays under ~3; a cut-off shadow jumps. Compare each Safari row with its Chromium control. **Mode**: real = a real mouse pointer (Pointer = whether it reached the card); forced = the `:hover` rules copied onto a class (phones have no hover).', '')
md.push('| Page | Card | Runner | Mode | Pointer | Clipped by (rest / hover) | Edge below: rest | during hover | hovered | after |')
md.push('|---|---|---|---|---|---|---|---|---|---|')
const worst = (e) => (e?.bottom ? `${e.bottom.jump}` : null)
for (const route of ROUTES) {
  for (const r of runners) {
    const rep = load(r, route.key)
    if (!rep?.cards) continue
    const cps = checkpointsOf(r).filter((c) => c.job === route.key)
    for (const c of rep.cards) {
      if (!c.key || c.key.startsWith('_')) continue
      const edges = {}
      for (const cp of cps.filter((x) => x.name.startsWith(`card-${c.key}`))) Object.assign(edges, cp.meta?.edges || {})
      const pick = (re) => Object.entries(edges).filter(([k]) => re.test(k)).map(([k, v]) => `${worst(v)}${/ms--/.test(k) ? ` @${k.match(/(\d+)ms--/)[1]}` : ''}`).join(', ') || '—'
      const clip = (list) => (list?.length ? list.map((x) => `${x.element} (${x.overflow}; ${x.cuts})`).join('; ') : 'none')
      const reached = c.mode === 'real' ? yes(c.pointerReached) : '—'
      md.push(`| ${route.key} | ${c.key} | ${r} | ${c.mode} | ${reached} | ${cell(`${clip(c.clippedBy)} / ${clip(c.hoverClippedBy)}`)} | ${pick(/-rest--/)} | ${pick(/-(hover-(80|260)ms|hover-early)--/)} | ${pick(/-(hover-900ms|hover)--/)} | ${pick(/-out-\d+ms--/)} |`)
    }
  }
}
md.push('')

// ---- tour --------------------------------------------------------------------------------
md.push('## 360° tour from the exhibition page (smoke check)', '')
md.push('Opened by a script click: no user activation, so no fullscreen request is granted — the modal covers the page by CSS, as on every iPhone. Travel between panoramas and large images are the tour viewer\'s own review.', '')
md.push('| Runner | Opened | First canvas after | Fullscreen | Error card | Closed again |', '|---|---|---|---|---|---|')
for (const r of runners) {
  for (const route of ROUTES) {
    const t = load(r, route.key)?.tour
    if (t) md.push(`| ${r} | ${yes(t.opened)} | ${t.msToCanvas ?? '—'} ms | ${yes(t.fullscreen)} | ${t.errorCard ? '**yes**' : 'no'} | ${yes(t.closed)} |`)
  }
}
md.push('')

// ---- audits ------------------------------------------------------------------------------
for (const f of ['audit-css.md', 'audit-js.md']) if (existsSync(resolve(runDir, f))) md.push(`Static check for Safari 18 / 26 / 27: [${f}](${f})`)
md.push('', 'Pictures side by side: [gallery.html](gallery.html)')
writeFileSync(resolve(runDir, 'summary.md'), md.join('\n'))

// ---- gallery ------------------------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const groupOf = (name) => (name.startsWith('card-') ? name.replace(/-(rest|hover-early|hover|hover-\d+ms|out-\d+ms)$/, '') : name)
let html = `<!doctype html><meta charset="utf-8"><title>Safari review ${esc(runId)}</title>
<style>
body{font:14px/1.4 -apple-system,system-ui,sans-serif;margin:0;padding:16px 24px;background:#f4f1ea;color:#222}
h1{font-size:20px}h2{font-size:18px;margin:40px 0 8px;border-top:2px solid #999;padding-top:12px}h3{font-size:15px;margin:22px 0 6px}
.row{display:flex;gap:10px;align-items:flex-start;margin:6px 0 12px;overflow-x:auto}
.runner{flex:none;width:150px;font-weight:600;padding-top:4px}.runner small{display:block;font-weight:400;color:#666}
figure{margin:0;flex:none}figcaption{font-size:11px;color:#555}
img{display:block;max-height:340px;max-width:560px;background:#fff;outline:1px solid #ccc}
.full img{max-height:260px}
nav a{margin-right:10px}
</style><h1>Safari review — ${esc(runId)}</h1><p>Each block shows one spot; each line is one browser. Real Safari first, Chromium (the control) last. Click a picture to open it at full size.</p><nav>${ROUTES.map((r) => `<a href="#${r.key}">${r.key}</a>`).join('')}</nav>`
for (const route of ROUTES) {
  html += `<h2 id="${route.key}">${esc(route.key)} <small>${esc(route.path)}</small></h2>`
  const groups = new Map()
  for (const r of runners) {
    for (const cp of checkpointsOf(r).filter((c) => c.job === route.key && c.kind !== 'calibrate')) {
      const g = groupOf(cp.name)
      if (!groups.has(g)) groups.set(g, new Map())
      const list = groups.get(g).get(r) || []
      const crops = (cp.files || []).filter((f) => f.includes('--'))
      for (const f of crops.length ? crops : cp.files || []) list.push({ f, label: f.split('/').pop().replace(/\.png$/, '').replace(`${g}-`, '').replace(/--\w+$/, ''), full: !crops.length })
      groups.get(g).set(r, list)
    }
  }
  for (const [g, byRunner] of groups) {
    html += `<h3>${esc(g)}</h3>`
    for (const r of runners) {
      const list = byRunner.get(r)
      if (!list) continue
      html += `<div class="row"><div class="runner">${esc(r)}${isControl(r) ? '<small>control</small>' : ''}${isPhone(r) ? '<small>phone</small>' : ''}</div>`
      for (const it of list) {
        const rel = relative(runDir, it.f)
        html += `<figure class="${it.full ? 'full' : ''}"><a href="${esc(rel)}"><img loading="lazy" src="${esc(rel)}"></a><figcaption>${esc(it.label)}</figcaption></figure>`
      }
      html += '</div>'
    }
  }
}
writeFileSync(resolve(runDir, 'gallery.html'), html)
console.log(`→ ${resolve(runDir, 'summary.md')}\n→ ${resolve(runDir, 'gallery.html')}`)
