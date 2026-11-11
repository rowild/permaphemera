// Read-only: writes everything needed to restore the deleted collective into restore-data.json:
// the person (last full version), its two translation rows and its role row (from the revisions).
import { writeFileSync } from 'node:fs'
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'
const { api } = await login(loadEnv())
const one = async (collection, item) => (await api('GET', `/revisions?filter[collection][_eq]=${collection}&filter[item][_eq]=${item}&fields=data,delta,activity.action&sort=-id&limit=1`))[0]
const person = await one('pp_persons', 'f7c02cfe-8aa2-4341-8c27-4852c219078a')
const tr = [await one('pp_translations__persons', '211'), await one('pp_translations__persons', '212')]
const role = await one('pp_mm__persons_roles', '182')
const out = { person: person.data, translations: tr.map((t) => t.data), role: role.data ?? role.delta }
writeFileSync(new URL('../restore-data.json', import.meta.url), JSON.stringify(out, null, 1))
console.log('role row:', JSON.stringify(out.role))
console.log('translations:', out.translations.map((t) => `${t?.languages_code}: ${(t?.about_html ?? '').length} chars, lede "${t?.lede}"`).join(' | '))
