// Read-only: every saved version of one person and of the rows that pointed to it.
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'
const id = process.argv[2]
const { api } = await login(loadEnv())
const revs = await api('GET', `/revisions?filter[collection][_eq]=pp_persons&filter[item][_eq]=${id}&fields=id,data,delta,activity.action,activity.timestamp,activity.user.first_name&sort=id&limit=-1`)
console.log(`versions: ${revs.length}`)
for (const r of revs) console.log(`\n--- ${r.activity?.timestamp} ${r.activity?.action}\ndelta: ${JSON.stringify(r.delta)}`)
const last = [...revs].reverse().find((r) => r.data)
console.log('\nLAST FULL VERSION:\n' + JSON.stringify(last?.data, null, 1))
for (const c of ['pp_translations__persons', 'pp_exhibition_participations', 'pp_mm__persons_roles', 'pp_mm__persons_venues', 'pp_organisation_memberships', 'pp_mm__persons_websites']) {
  const rows = await api('GET', `/revisions?filter[collection][_eq]=${c}&fields=id,item,data,activity.action,activity.timestamp&sort=id&limit=-1`).catch(() => [])
  const hits = rows.filter((r) => JSON.stringify(r.data ?? {}).includes(id))
  if (hits.length) { console.log(`\n${c}: ${hits.length} versions`); for (const h of hits) console.log(`  ${h.activity?.timestamp} ${h.activity?.action} item ${h.item}: ${JSON.stringify(h.data)}`) }
}
