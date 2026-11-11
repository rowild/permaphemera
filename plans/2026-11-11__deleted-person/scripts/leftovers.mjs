// Read-only: what is left of the deleted person's linked rows, and the exhibition's participations.
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'
const { api } = await login(loadEnv())
const id = 'f7c02cfe-8aa2-4341-8c27-4852c219078a'
const tryGet = (p) => api('GET', p).catch((e) => `ERROR ${e.message}`)
console.log('translations 211/212:', JSON.stringify(await tryGet('/items/pp_translations__persons?filter[id][_in]=211,212&fields=id,persons_id,languages_code,lede')))
console.log('role row 182:', JSON.stringify(await tryGet('/items/pp_mm__persons_roles?filter[id][_eq]=182&fields=*')))
const [ex] = await api('GET', '/items/pp_exhibitions?filter[slug][_eq]=kunstkalender-hoffnung-und-frieden&fields=id,status,participations.id,participations.person,participations.role,participations.sort')
console.log('exhibition:', JSON.stringify(ex))
const parts = await api('GET', `/revisions?filter[collection][_eq]=pp_exhibition_participations&fields=item,data,activity.action,activity.timestamp&sort=id&limit=-1`)
console.log('participation versions that named the person:', JSON.stringify(parts.filter((p) => JSON.stringify(p.data ?? {}).includes(id))))
const orphans = await tryGet('/items/pp_exhibition_participations?filter[person][_null]=true&fields=id,exhibition,role,sort')
console.log('participations without person now:', JSON.stringify(orphans))
