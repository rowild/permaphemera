// Daborer is a co-founder ("(Mit-)Begründer", daborer.at/zur-person) of kultur.im.puls, not its sole founder.
// Fixes his biography (en/de) and adds the fact to the organisation text (en/de) with its source.
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'
const dry = process.argv.includes('--dry-run')
const { api } = await login(loadEnv())
const SRC = { en: '<li><a href="https://daborer.at/zur-person/">“Wolfgang Daborer (Biographie)”, daborer.at</a></li>', de: '<li><a href="https://daborer.at/zur-person/">„Wolfgang Daborer (Biographie)“, daborer.at</a></li>' }
const swap = (text, from, to) => { if (!text?.includes(from)) throw new Error(`not found: ${from}`); return text.replace(from, to) }

const [p] = await api('GET', '/items/pp_persons?filter[slug][_eq]=wolfgang-daborer&fields=id,about_html,translations.id,translations.languages_code,translations.about_html')
const pt = (l) => p.translations.find((t) => t.languages_code === l)
console.log('DE person:', pt('de').about_html.match(/[^.]*kultur\.im\.puls[^.]*\./)?.[0])
const personPatch = {
  about_html: swap(p.about_html, 'In 2009 he founded the art association kultur.im.puls', 'In 2009 he co-founded the art association kultur.im.puls'),
  translations: { create: [], delete: [], update: [
    { id: pt('en').id, about_html: swap(pt('en').about_html, 'In 2009 he founded the art association kultur.im.puls', 'In 2009 he co-founded the art association kultur.im.puls') }
  ] }
}
const deText = pt('de').about_html
const deFixed = deText.replace('2009 begründete er den Kultur- und Kunstverein kultur.im.puls', '2009 war er Mitbegründer des Kultur- und Kunstvereins kultur.im.puls')
if (deFixed !== deText) personPatch.translations.update.push({ id: pt('de').id, about_html: deFixed })
else console.log('! DE sentence differs, check by hand')

const [o] = await api('GET', '/items/pp_organisations?filter[slug][_eq]=kultur-im-puls&fields=id,about_html,translations.id,translations.languages_code,translations.about_html')
const ot = (l) => o.translations.find((t) => t.languages_code === l)
const orgEn = (t) => swap(swap(t, 'was founded in 2009 and runs', 'was founded in 2009, among others by Wolfgang Daborer, and runs'), '</ul>', SRC.en + '</ul>')
const orgDe = (t) => swap(swap(t, 'besteht seit 2009 und betreibt', 'besteht seit 2009, mitbegründet von Wolfgang Daborer, und betreibt'), '</ul>', SRC.de + '</ul>')
const orgPatch = { about_html: orgEn(o.about_html), translations: { create: [], delete: [], update: [
  { id: ot('en').id, about_html: orgEn(ot('en').about_html) }, { id: ot('de').id, about_html: orgDe(ot('de').about_html) } ] } }
if (dry) { console.log(JSON.stringify({ personPatch, orgPatch }, null, 1).slice(0, 2500)); process.exit(0) }
await api('PATCH', `/items/pp_persons/${p.id}`, personPatch)
await api('PATCH', `/items/pp_organisations/${o.id}`, orgPatch)
console.log('person and organisation updated')
