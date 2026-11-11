// Read-only: every delete in pp_persons (and its translation/relation tables) in the activity log
// of the last 30 days, with the last saved version of each deleted record from the revisions.
//   cd directus && DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-11__deleted-person/scripts/find-deleted.mjs
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'

const { api } = await login(loadEnv())
const since = new Date(Date.now() - 30 * 86400000).toISOString()
const deletes = await api('GET', `/activity?filter[action][_eq]=delete&filter[timestamp][_gte]=${since}&filter[collection][_starts_with]=pp_&fields=id,timestamp,collection,item,user.email,user.first_name,origin&sort=timestamp&limit=-1`)
console.log(`deletes since ${since.slice(0, 10)}: ${deletes.length}`)
for (const d of deletes) console.log(`${d.timestamp}  ${d.collection}  ${d.item}  by ${d.user?.first_name ?? d.user?.email ?? '?'}`)
for (const d of deletes.filter((x) => x.collection === 'pp_persons')) {
  const revisions = await api('GET', `/revisions?filter[collection][_eq]=pp_persons&filter[item][_eq]=${d.item}&fields=id,data,activity.action,activity.timestamp&sort=-id&limit=-1`)
  console.log(`\n=== person ${d.item} deleted ${d.timestamp}: ${revisions.length} saved versions`)
  const last = revisions.find((r) => r.data)
  if (last) console.log(JSON.stringify(last.data, null, 1))
  const tr = await api('GET', `/revisions?filter[collection][_eq]=pp_translations__persons&fields=id,data,activity.timestamp&sort=-id&limit=-1&filter[data][_contains]=${d.item}`)
  console.log(`translation versions mentioning it: ${tr.length}`)
  for (const t of tr.slice(0, 4)) console.log(JSON.stringify(t.data))
}
