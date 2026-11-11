// Restores the collective deleted on 2026-11-04 (owner's OK, 2026-11-11): same id, draft, the last
// saved fields and texts (restore-data.json), the source line turned into the linked list
// (how-to §7a), the role artist, and the exhibition's empty participation pointed back to it.
//   cd directus && DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-11__deleted-person/scripts/restore.mjs
import { readFileSync } from 'node:fs'
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'

const ID = 'f7c02cfe-8aa2-4341-8c27-4852c219078a'
const PARTICIPATION = '394ee646-27aa-4b5b-95d8-c2dfb19a7d54'
const ARTIST = '37b28cb2-e0ba-4081-b51b-836149de0a06'
const data = JSON.parse(readFileSync(new URL('../restore-data.json', import.meta.url)))
const { api } = await login(loadEnv())

const exists = await api('GET', `/items/pp_persons?filter[id][_eq]=${ID}&fields=id`)
if (exists.length) { console.log('already there, nothing done'); process.exit(0) }

const sources = {
  en: '<p>Sources</p><ul><li><a href="https://www.lebenshilfe-knittelfeld.at/kuenstlerischer-vormittag/">“Künstlerischer Vormittag”, lebenshilfe-knittelfeld.at, 25 March 2026</a></li><li><a href="https://www.meinbezirk.at/murtal/c-leute/kunst-die-von-herzen-kommt_a8984211">“Kunstkalender Musik Begegnungen: Kunst, die von Herzen kommt”, meinbezirk.at, 30 October 2026</a></li></ul>',
  de: '<p>Quellen</p><ul><li><a href="https://www.lebenshilfe-knittelfeld.at/kuenstlerischer-vormittag/">„Künstlerischer Vormittag“, lebenshilfe-knittelfeld.at, 25. 3. 2026</a></li><li><a href="https://www.meinbezirk.at/murtal/c-leute/kunst-die-von-herzen-kommt_a8984211">„Kunstkalender Musik Begegnungen: Kunst, die von Herzen kommt“, meinbezirk.at, 30. 10. 2026</a></li></ul>'
}
const withList = (html, lang) => {
  const cut = lang === 'en' ? ' Source: lebenshilfe-knittelfeld.at, meinbezirk.at.</p>' : ' Quelle: lebenshilfe-knittelfeld.at, meinbezirk.at.</p>'
  if (!html.includes(cut)) throw new Error(`old source line not found (${lang})`)
  return html.replace(cut, '</p>') + sources[lang]
}
const [en, de] = data.translations
const p = data.person
const record = {
  id: ID, status: 'draft', first_name: p.first_name, last_name: p.last_name, middle_initial: p.middle_initial,
  display_name: p.display_name, slug: p.slug, is_collective: p.is_collective, born: p.born, based_in: p.based_in,
  lede: p.lede, about_html: withList(p.about_html, 'en'), seo: p.seo,
  roles: [{ roles_id: ARTIST }],
  translations: [
    { languages_code: 'en', lede: en.lede, based_in: en.based_in, about_html: withList(en.about_html, 'en') },
    { languages_code: 'de', lede: de.lede, based_in: de.based_in, about_html: withList(de.about_html, 'de') }
  ]
}
await api('POST', '/items/pp_persons', record)
await api('PATCH', `/items/pp_exhibition_participations/${PARTICIPATION}`, { person: ID })
console.log('restored', ID, 'and linked to the exhibition again')
