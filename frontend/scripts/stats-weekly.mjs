#!/usr/bin/env node
// Weekly Umami sums, kept for good in Directus (owner, 2026-11-11;
// plans/2026-11-11__umami-weekly-sums.md). Runs every Monday on the Hetzner host through
// scripts/server/stats-weekly.sh, which exports Umami's lines for this script.
//
//   node scripts/stats-weekly.mjs --next-week          prints where the export starts (the last stored week)
//   node scripts/stats-weekly.mjs --input <file.jsonl> [--dry-run]
//
// Needs DIRECTUS_URL and DIRECTUS_TOKEN (the "Statistics job" user: create + read on
// pp_stats_weekly, read on the record collections). Writes only rows whose key is missing, so a
// second run adds nothing and an interrupted run is finished by the next one. Never deletes.
import { readFileSync } from 'node:fs'
import { buildIndex, exportStart, sumWeeks } from './lib/stats-weekly.mjs'

const BASE = (process.env.DIRECTUS_URL || '').replace(/\/$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN || ''
if (!BASE || !TOKEN) throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN are needed')

const api = async (method, path, body) => {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${(await response.text()).slice(0, 300)}`)
  return response.status === 204 ? null : (await response.json()).data
}

const args = process.argv.slice(2)

if (args.includes('--next-week')) {
  const [last] = await api('GET', '/items/pp_stats_weekly?fields=week&sort=-week&limit=1')
  console.log(exportStart(last?.week ?? null))
  process.exit(0)
}

const inputAt = args.indexOf('--input')
if (inputAt < 0 || !args[inputAt + 1]) throw new Error('usage: --next-week | --input <file.jsonl> [--dry-run]')
const dryRun = args.includes('--dry-run')

const lines = readFileSync(args[inputAt + 1], 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line))
const get = (collection, fields) => api('GET', `/items/${collection}?fields=${fields}&limit=-1`)
const index = buildIndex({
  locations: await get('pp_locations', 'id,title'),
  venues: await get('pp_venues', 'id,slug,title,location'),
  exhibitions: await get('pp_exhibitions', 'id,slug,title,tour,primary_venue.id,primary_venue.location'),
  persons: await get('pp_persons', 'id,slug,first_name,last_name,display_name'),
  organisations: await get('pp_organisations', 'id,slug,title,location'),
  events: await get('pp_events', 'id,slug,title,location'),
  news: await get('pp_news', 'id,slug,title'),
  sponsors: await get('pp_sponsors', 'id,slug,title')
})
const rows = sumWeeks(lines, index)
const weeks = [...new Set(rows.map((r) => r.week))].sort()
if (!rows.length) {
  console.log('no visits in the exported weeks: nothing to write')
  process.exit(0)
}

const stored = new Set((await api('GET', `/items/pp_stats_weekly?fields=key&limit=-1&filter[week][_gte]=${weeks[0]}`)).map((r) => r.key))
const missing = rows.filter((r) => !stored.has(r.key))
for (const week of weeks) {
  const site = rows.find((r) => r.week === week && r.kind === 'site')
  const count = missing.filter((r) => r.week === week).length
  console.log(`${week}: ${site?.views ?? 0} views, ${site?.visitors ?? 0} visitors, ${site?.tour_opens ?? 0} tour openings; ${count} new rows`)
}
if (dryRun) {
  console.log(`dry run: ${missing.length} rows would be written`)
  process.exit(0)
}
for (let i = 0; i < missing.length; i += 100) await api('POST', '/items/pp_stats_weekly', missing.slice(i, i + 100))
console.log(`written: ${missing.length} rows`)
