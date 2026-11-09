// Reads every text with a sources list from production Directus (persons, exhibitions,
// organisations, venues) and writes one inventory file per research group.
//   node plans/2026-11-09__linked-sources/inventory.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const here = decodeURIComponent(new URL('.', import.meta.url).pathname)
const env = Object.fromEntries(readFileSync(new URL('../../frontend/.env', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const base = env.NUXT_PUBLIC_DIRECTUS_URL
const get = async (path) => (await (await fetch(base + path, { headers: { Authorization: `Bearer ${env.DIRECTUS_TOKEN}` } })).json()).data
const COLS = { pp_venues: ['about_html', 'name'], pp_persons: ['about_html', 'first_name,last_name,display_name'], pp_exhibitions: ['description', 'title'], pp_organisations: ['about_html', 'title'] }
const SOURCES = /<p>\s*(Quellen?|Sources?)\s*:?\s*<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*$/i
const records = []
for (const [collection, [field, nameFields]] of Object.entries(COLS)) {
  const rows = await get(`/items/${collection}?fields=*,translations.*&limit=-1`)
  for (const row of rows) {
    const tr = (code) => (row.translations || []).find((t) => t.languages_code === code) || {}
    const en = tr('en')[field] || ''
    const match = en.match(SOURCES)
    if (!match) continue
    const name = row.display_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || row.name || tr('en').title || row.title || row.slug
    records.push({
      collection, id: row.id, slug: row.slug, status: row.status, name,
      sources: [...match[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()),
      text_en: en.replace(SOURCES, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    })
  }
}
writeFileSync(`${here}inventory/all.json`, JSON.stringify(records, null, 1))
const GROUPS = 6
for (let g = 0; g < GROUPS; g++) writeFileSync(`${here}inventory/group-${g + 1}.json`, JSON.stringify(records.filter((_, i) => i % GROUPS === g), null, 1))
console.log(records.length, 'records,', records.reduce((n, r) => n + r.sources.length, 0), 'sources')
