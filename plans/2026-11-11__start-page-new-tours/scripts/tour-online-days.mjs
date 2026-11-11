// Reads from the Directus history the day each tour was linked (the `tour` field set), for the
// exhibitions whose tour is online before their last day: the exceptions to the rule "360° tours
// are published on the last day of an exhibition". With --write it sets tour_available_from.
//   cd directus && DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-11__start-page-new-tours/scripts/tour-online-days.mjs [--write]
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'

const write = process.argv.includes('--write')
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(new Date())
const { api } = await login(loadEnv())
const records = await api('GET', '/items/pp_exhibitions?filter[tour][_nnull]=true&filter[tour_available_from][_null]=true&fields=id,slug,end_date,tour&limit=-1')
for (const record of records.filter((r) => r.end_date && r.end_date > today)) {
  const revisions = await api('GET', `/revisions?filter[collection][_eq]=pp_exhibitions&filter[item][_eq]=${record.id}&fields=id,delta,activity.timestamp&sort=id&limit=-1`)
  const linked = revisions.find((revision) => revision.delta && revision.delta.tour)
  const day = linked ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(new Date(linked.activity.timestamp)) : null
  console.log(`${record.slug}: ends ${record.end_date}, tour linked ${day ?? 'unknown (no history)'}`)
  if (write && day) await api('PATCH', `/items/pp_exhibitions/${record.id}`, { tour_available_from: day })
}
