// Creates Markus Saueregger (draft) as curator of the stARTup gallery in production Directus.
// Run from directus/:  DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-06__markus-saueregger-curator/write-records.mjs
// Safe to run twice: an existing slug is left alone. Deletes nothing.
import { loadEnv, login } from '../../directus/scripts/lib.mjs'

const { api } = await login(loadEnv())

const CURATOR = '68b75859-8a9b-4bc8-aa98-8c6577c18fb3'
const VENUE_SLUG = 'startup-gallery-koetschach-mauthen'
const SLUG = 'markus-saueregger'

const q = (value) => encodeURIComponent(value)
const bySlug = async (collection, slug) => (await api('GET', `/items/${collection}?filter[slug][_eq]=${q(slug)}&fields=id&limit=1`))[0]?.id

const venue = await bySlug('pp_venues', VENUE_SLUG)
if (!venue) throw new Error(`no venue ${VENUE_SLUG}`)

const en = {
  based_in: 'Dellach im Gailtal',
  lede: 'Runs the stARTup gallery in Kötschach-Mauthen and curates its exhibitions.',
  about_html: '<p>Markus Saueregger comes from Afritz in the Gegendtal and has lived with his family in Dellach im Gailtal for about 20 years; by profession he works in nursing care. Before he opened the stARTup gallery, he showed two exhibitions at other places in Kötschach-Mauthen, the Biachakastl and the Café Zuckereck. In May 2023 he opened the gallery rooms at Kötschach 5. Since then he has shown artists from the Gail valley and Upper Carinthia there, among them Hannes Grimmer, Herta Hofer, Walther Preiml, Heidulf Gerngross, Claudia Unterluggauer and Brigitte Bock. In 2024 he led a one-day “Kunstmeile” in Kötschach: 17 artists showed works in shops and cafés of the village and in the Protestant church. The idea for the day came from local small businesses that the closure of the nearby Plöcken Pass hit hard.</p><p>Sources</p><ul><li>osttirolerbote.at (Volltreffer Oberkärnten, 26 August 2024)</li><li>claudiaim.net</li><li>gailtal-journal.at</li><li>meinbezirk.at</li></ul>'
}
const de = {
  based_in: 'Dellach im Gailtal',
  lede: 'Betreibt die stARTup gallery in Kötschach-Mauthen und kuratiert ihre Ausstellungen.',
  about_html: '<p>Markus Saueregger stammt aus Afritz im Gegendtal und lebt seit rund 20 Jahren mit seiner Familie in Dellach im Gailtal; beruflich ist er Fachkraft im Pflegedienst. Vor der Eröffnung der stARTup gallery zeigte er zwei Ausstellungen an anderen Orten in Kötschach-Mauthen, im Biachakastl und im Café Zuckereck. Im Mai 2023 eröffnete er die Galerieräume in Kötschach 5. Seither zeigt er dort Künstler:innen aus dem Gailtal und Oberkärnten, unter ihnen Hannes Grimmer, Herta Hofer, Walther Preiml, Heidulf Gerngross, Claudia Unterluggauer und Brigitte Bock. 2024 leitete er eine eintägige „Kunstmeile“ in Kötschach: 17 Künstler:innen zeigten Werke in Geschäften und Lokalen des Ortes und in der Evangelischen Kirche. Die Idee zu dem Tag kam von Kleinunternehmer:innen vor Ort, die die Sperrung des nahen Plöckenpasses stark traf.</p><p>Quellen</p><ul><li>osttirolerbote.at (Volltreffer Oberkärnten, 26. August 2024)</li><li>claudiaim.net</li><li>gailtal-journal.at</li><li>meinbezirk.at</li></ul>'
}

const found = await bySlug('pp_persons', SLUG)
if (found) {
  console.log(`= pp_persons/${SLUG} ${found}`)
} else {
  const { id } = await api('POST', '/items/pp_persons', {
    status: 'draft', slug: SLUG, first_name: 'Markus', last_name: 'Saueregger', born: '1974',
    ...en,
    roles: [{ roles_id: CURATOR }],
    venues: [{ venues_id: venue, relation: 'curator', sort: 1 }],
    translations: [{ languages_code: 'en', ...en }, { languages_code: 'de', ...de }]
  })
  console.log(`+ pp_persons/${SLUG} ${id}`)
}
