// Gives the WYSIWYG text fields that end with a sources list the link button and the new note
// in production Directus (existing fields: create-schema.mjs only adds missing ones).
//   node plans/2026-11-09__linked-sources/field-link-button.mjs [--apply]
import { readFileSync } from 'node:fs'
const env = Object.fromEntries(readFileSync(new URL('../../frontend/.env', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const base = env.NUXT_PUBLIC_DIRECTUS_URL
const headers = { Authorization: `Bearer ${env.DIRECTUS_TOKEN}`, 'Content-Type': 'application/json' }
const NOTE = 'Paragraphs, bold, italic, lists; sources at the end as their own list, each source linked to the exact page it came from (docs/how-to-gallery-and-exhibition.md §7a). Links only in that list; other addresses go under Links.'
const TARGETS = { venues: 'about_html', persons: 'about_html', exhibitions: 'description', organisations: 'about_html', events: 'about_html' }
const fields = (await (await fetch(`${base}/fields`, { headers })).json()).data
const hits = fields.filter((f) => f.meta?.interface === 'input-rich-text-html' && Object.entries(TARGETS).some(([name, field]) => f.field === field && new RegExp(`^pp_(translations__)?${name}$`).test(f.collection)))
for (const f of hits) {
  const toolbar = f.meta.options?.toolbar ?? []
  const next = toolbar.includes('link') ? toolbar : [...toolbar.filter((t) => !['removeformat', 'undo', 'redo'].includes(t)), 'link', 'removeformat', 'undo', 'redo']
  console.log(f.collection, f.field, '| toolbar:', next.join(','))
  if (process.argv.includes('--apply')) {
    const res = await fetch(`${base}/fields/${f.collection}/${f.field}`, { method: 'PATCH', headers, body: JSON.stringify({ meta: { options: { ...f.meta.options, toolbar: next }, note: NOTE } }) })
    console.log('  ->', res.status)
  }
}
