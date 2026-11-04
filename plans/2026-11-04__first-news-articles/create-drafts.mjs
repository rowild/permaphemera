// Creates the articles of articles.json in Directus as drafts (pp_news). Skips a slug that exists.
// Run from directus/: DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-04__first-news-articles/create-drafts.mjs
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envFile = resolve(process.cwd(), process.env.DIRECTUS_ENV_FILE || '.env')
const env = Object.fromEntries(readFileSync(envFile, 'utf8').split('\n').map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]))
const base = env.PUBLIC_URL.replace(/\/$/, '')
const headers = { Authorization: `Bearer ${env.ADMIN_TOKEN}`, 'Content-Type': 'application/json' }
const api = async (path, init = {}) => {
  const response = await fetch(base + path, { ...init, headers })
  const json = await response.json()
  if (!response.ok) throw new Error(`${path}: ${JSON.stringify(json.errors ?? json)}`)
  return json.data
}

const articles = JSON.parse(readFileSync(new URL('./articles.json', import.meta.url), 'utf8'))
for (const a of articles) {
  const [existing] = await api(`/items/pp_news?filter[slug][_eq]=${a.slug}&fields=id`)
  if (existing) { console.log('exists ', a.slug); continue }
  const junction = (ids, column) => ids.map((id, index) => ({ [column]: id, sort: index + 1 }))
  const created = await api('/items/pp_news', {
    method: 'POST',
    body: JSON.stringify({
      status: 'draft',
      slug: a.slug,
      published_on: a.published_on,
      topic: a.topic,
      image: a.image ?? null,
      title: a.en.title,
      summary: a.en.summary,
      description: a.en.description,
      image_alt: a.en.image_alt ?? null,
      translations: ['en', 'de'].map((code) => ({
        languages_code: code, title: a[code].title, summary: a[code].summary, description: a[code].description, image_alt: a[code].image_alt ?? null
      })),
      exhibitions: junction(a.exhibitions, 'exhibitions_id'),
      venues: junction(a.venues, 'venues_id'),
      persons: junction(a.persons, 'persons_id'),
      organisations: junction(a.organisations, 'organisations_id')
    })
  })
  console.log('created', a.slug, created.id)
}
