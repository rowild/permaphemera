// Read-only: every saved version written in the create request of the person (same second) and
// every delete in the minute of the person's delete, all collections.
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'
const { api } = await login(loadEnv())
const show = async (from, to, label) => {
  const acts = await api('GET', `/activity?filter[timestamp][_between]=${from},${to}&fields=id,action,collection,item,timestamp,revisions.data&sort=id&limit=-1`)
  console.log(`\n== ${label}: ${acts.length} actions`)
  for (const a of acts) console.log(`${a.timestamp} ${a.action} ${a.collection} ${a.item} ${JSON.stringify(a.revisions?.[0]?.data ?? '').slice(0, 300)}`)
}
await show('2026-11-01T20:41:25Z', '2026-11-01T20:41:28Z', 'create of the person')
await show('2026-11-04T19:46:30Z', '2026-11-04T19:48:00Z', 'around the delete')
