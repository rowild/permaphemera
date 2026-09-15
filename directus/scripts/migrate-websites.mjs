// directus/scripts/migrate-websites.mjs
// One-off, idempotent. Moves every pp_persons.website_url into a pp_websites row
// linked through pp_mm__persons_websites, then drops the column. Run it once
// after create-schema.mjs has added the websites collection (2026-09-15).
//
//   node scripts/migrate-websites.mjs
import { loadEnv, login } from './lib.mjs'

const { api } = await login(loadEnv())

const fields = await api('GET', '/fields/pp_persons')
if (!fields.some((f) => f.field === 'website_url')) {
  console.log('pp_persons.website_url is already gone; nothing to do')
  process.exit(0)
}
if (!fields.some((f) => f.field === 'websites')) {
  console.error('pp_persons.websites is missing: run create-schema.mjs first')
  process.exit(1)
}

const hostnameOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url } }
const persons = await api('GET', '/items/pp_persons?limit=-1&fields=id,status,website_url,websites.id')

let moved = 0
for (const person of persons) {
  if (!person.website_url) continue
  if (person.websites?.length) { console.log(`= ${person.id} already has links`); continue }
  const title = hostnameOf(person.website_url)
  const site = await api('POST', '/items/pp_websites', {
    status: person.status, title, url: person.website_url, kind: 'website',
    translations: [{ languages_code: 'en', title }, { languages_code: 'de', title }],
  })
  await api('POST', '/items/pp_mm__persons_websites', { persons_id: person.id, websites_id: site.id, sort: 0 })
  moved += 1
}

await api('DELETE', '/fields/pp_persons/website_url')
console.log(`moved ${moved} person links into pp_websites; dropped pp_persons.website_url`)
