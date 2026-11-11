// Read-only: the saved SEO texts of the collective's two old translation rows (211 en, 212 de).
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'
const { api } = await login(loadEnv())
for (const item of ['211', '212']) {
  const revs = await api('GET', `/revisions?filter[collection][_eq]=pp_translations__persons&filter[item][_eq]=${item}&fields=data,delta,activity.timestamp&sort=id&limit=-1`)
  for (const r of revs) console.log(item, r.activity?.timestamp, JSON.stringify(r.delta?.seo ?? r.data?.seo ?? null))
}
