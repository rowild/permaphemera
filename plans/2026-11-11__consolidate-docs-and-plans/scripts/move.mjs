// Moves the dated files from _Plans/, docs/ and frontend/docs/superpowers/ into plans/
// (git mv) and rewrites every old path in tracked text files.
// Run from the top folder: node plans/2026-11-11__consolidate-docs-and-plans/scripts/move.mjs [--dry]
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const dry = process.argv.includes('--dry')
const SP = 'docs/superpowers'
const FSP = 'frontend/docs/superpowers'

// old path (from the top folder) -> new path
const MOVES = [
  ['_Plans/exhibitions-plan.md', 'docs/exhibitions-plan.md'],
  ['_Plans/directus-schema-conventions.md', 'docs/directus-schema-conventions.md'],
  ['_Plans/original chat.md', 'plans/2026-06-22__original-chat.md'],
  ['_Plans/naming-ideas.md', 'plans/2026-06-22__naming-ideas.md'],
  ['_Plans/migrating-to-tailwind.md', 'plans/2026-07-12__migrating-to-tailwind.md'],
  ['_Plans/newsletter-subscription.md', 'plans/2026-11-07__newsletter/older-plan-subscription.md'],
  ['website-copy-review-and-ai-brief.md', 'plans/2026-10-25__website-copy-review.md'],
  ['docs/text-audit/start-page.md', 'plans/2026-10-25__text-audit-start-page.md'],
  ['docs/text-audit/header-footer.md', 'plans/2026-10-26__text-audit-header-footer.md'],
  ['docs/content/2026-10-person-organisation-sources.md', 'plans/2026-10-14__person-sponsor-organisation-pages/sources.md'],

  [`${SP}/plans/2026-09-14-directus-schema-by-convention.md`, 'plans/2026-09-14__directus-schema-by-convention.md'],
  [`${SP}/specs/2026-09-14-directus-conventions-schema-design.md`, 'plans/2026-09-14__directus-schema-by-convention/design.md'],
  [`${SP}/plans/2026-09-14-frontend-pp-rename-and-navigation.md`, 'plans/2026-09-14__frontend-pp-rename-and-navigation.md'],
  [`${SP}/plans/2026-09-15-directus-runtime-source.md`, 'plans/2026-09-15__directus-runtime-source.md'],
  [`${SP}/specs/2026-09-15-directus-runtime-source-design.md`, 'plans/2026-09-15__directus-runtime-source/design.md'],
  [`${SP}/specs/2026-09-23-organisations-design.md`, 'plans/2026-09-23__organisations-design.md'],
  [`${SP}/plans/2026-10-14-person-sponsor-organisation-pages.md`, 'plans/2026-10-14__person-sponsor-organisation-pages.md'],
  [`${SP}/specs/2026-10-14-person-sponsor-organisation-pages-design.md`, 'plans/2026-10-14__person-sponsor-organisation-pages/design.md'],
  [`${SP}/plans/2026-10-24-seo.md`, 'plans/2026-10-24__seo.md'],
  [`${SP}/specs/2026-10-24-seo-design.md`, 'plans/2026-10-24__seo/design.md'],

  [`${FSP}/plans/2026-08-11-hero-kaleidoscope-preloader.md`, 'plans/2026-08-11__hero-kaleidoscope-preloader.md'],
  [`${FSP}/specs/2026-08-11-hero-kaleidoscope-preloader-design.md`, 'plans/2026-08-11__hero-kaleidoscope-preloader/design.md'],
  [`${FSP}/plans/2026-08-12-directus-aligned-data-model.md`, 'plans/2026-08-12__directus-aligned-data-model.md'],
  [`${FSP}/specs/2026-08-12-directus-aligned-data-model-design.md`, 'plans/2026-08-12__directus-aligned-data-model/design.md'],
  [`${FSP}/specs/2026-08-13-about-page-design.md`, 'plans/2026-08-13__about-page-design.md'],
  [`${FSP}/specs/2026-08-13-contact-and-how-it-works-pages-design.md`, 'plans/2026-08-13__contact-and-how-it-works-pages-design.md'],
  [`${FSP}/specs/2026-08-13-landing-schedule-and-fan-links-design.md`, 'plans/2026-08-13__landing-schedule-and-fan-links-design.md'],
  [`${FSP}/specs/2026-08-13-legal-pages-design.md`, 'plans/2026-08-13__legal-pages-design.md'],
  [`${FSP}/specs/2026-09-23-unified-exhibition-card-design.md`, 'plans/2026-09-23__unified-exhibition-card-design.md'],
  [`${FSP}/specs/2026-10-19-exhibitions-directory-time-groups-design.md`, 'plans/2026-10-19__exhibitions-directory-time-groups-design.md'],
  [`${FSP}/specs/2026-10-21-exhibition-card-rules-design.md`, 'plans/2026-10-21__exhibition-card-rules-design.md'],
]

// Files whose old paths stay as written (history).
const KEEP = new Set(['frontend/changelog.md'])

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// A pattern that finds an old path however it was written: with ../ in front, or (for
// docs/superpowers and frontend/docs/superpowers files) just docs/superpowers/... from frontend/.
function patternFor(oldPath) {
  let body
  if (oldPath.startsWith(`${FSP}/`) || oldPath.startsWith(`${SP}/`)) {
    const rest = oldPath.replace(/^(frontend\/)?docs\/superpowers\//, '')
    body = `(?:frontend/)?docs/superpowers/${esc(rest)}`
  } else {
    body = esc(oldPath)
  }
  return new RegExp(`(?<![\\w/-])(?:\\.\\./)*(?:\\./)?${body}`, 'g')
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' })

// 1. Move.
for (const [from, to] of MOVES) {
  if (!existsSync(from)) { console.log(`MISSING ${from}`); continue }
  if (existsSync(to)) { console.log(`EXISTS  ${to} (skipped)`); continue }
  console.log(`mv ${from} -> ${to}`)
  if (!dry) { mkdirSync(dirname(to), { recursive: true }); git('mv', from, to) }
}

// 2. Rewrite links in tracked text files.
const files = git('ls-files', '-z').split('\0').filter((f) =>
  f && /\.(md|mjs|js|ts|vue|sh|json|yml|yaml|txt|html|css)$/.test(f) && !KEEP.has(f) && !f.startsWith('_BU/'))
const patterns = MOVES.map(([from, to]) => [patternFor(from), to])
let changed = 0
for (const f of files) {
  if (!existsSync(f)) continue
  const before = readFileSync(f, 'utf8')
  let after = before
  for (const [re, to] of patterns) after = after.replace(re, to)
  if (after !== before) {
    changed++
    console.log(`links ${f}`)
    if (!dry) writeFileSync(f, after)
  }
}
console.log(`${changed} files with rewritten links${dry ? ' (dry run)' : ''}`)
