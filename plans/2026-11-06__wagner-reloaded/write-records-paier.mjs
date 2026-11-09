// Writes Burgis Paier and her permanent exhibition "Das große Welttheater" (Theatergalerie,
// since 2022) into production Directus. All new records are drafts. Run from directus/:
//   DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-06__wagner-reloaded/write-records-paier.mjs
// Safe to run twice: a record whose slug exists is left alone. Deletes nothing.
import { readFileSync } from 'node:fs'
import { loadEnv, login } from '../../directus/scripts/lib.mjs'

const files = JSON.parse(readFileSync(new URL('./file-ids-paier.json', import.meta.url), 'utf8'))
const { api } = await login(loadEnv())

const ARTIST = '37b28cb2-e0ba-4081-b51b-836149de0a06'
const THEATERGALERIE = '6a07ffe2-65ad-49f7-a810-9a50f06680ac'

const q = (value) => encodeURIComponent(value)
const bySlug = async (collection, slug) => (await api('GET', `/items/${collection}?filter[slug][_eq]=${q(slug)}&fields=id&limit=1`))[0]?.id
const bilingual = (en, de) => ({ ...en, translations: [{ languages_code: 'en', ...en }, { languages_code: 'de', ...de }] })
const ensure = async (collection, slug, payload) => {
  const found = await bySlug(collection, slug)
  if (found) { console.log(`= ${collection}/${slug}`); return found }
  const { id } = await api('POST', `/items/${collection}`, { slug, status: 'draft', ...payload })
  console.log(`+ ${collection}/${slug} ${id}`)
  return id
}

const PAIER = await ensure('pp_persons', 'burgis-paier', {
  first_name: 'Burgis', last_name: 'Paier', born: '1949, Klagenfurt',
  roles: [{ roles_id: ARTIST }],
  ...bilingual({
    based_in: 'Klagenfurt',
    lede: 'Costume and stage designer and visual artist from Klagenfurt (1949–2022).',
    about_html: '<p>Burgis Paier was born in Klagenfurt in 1949 and died there in 2022. She worked as a costume and stage designer and as a visual artist: figures, objects, automata, collages, reliquaries, rooms, puppets and embroidery. From 1977 she showed her work in solo exhibitions in Udine, Milan, Bologna, Klagenfurt, Vienna, Graz, Linz and Salzburg, among other places, several of them together with Günter Brus, such as “Kaspar Hauser” (2008) and the two “Phantasus” exhibitions (2010, 2011). In 2017 she was artist in residence at the Red Gate Residency in Beijing. Her last cycle, Das große Welttheater, was shown in 2020 in the Alpen-Adria-Galerie in Klagenfurt and has been the permanent exhibition of the Theatergalerie since December 2022.</p><p>Source</p><ul><li>stadtgalerie.net (biography of Burgis Paier)</li></ul>'
  }, {
    based_in: 'Klagenfurt',
    lede: 'Kostüm- und Bühnenbildnerin und bildende Künstlerin aus Klagenfurt (1949–2022).',
    about_html: '<p>Burgis Paier wurde 1949 in Klagenfurt geboren und starb dort 2022. Sie arbeitete als Kostüm- und Bühnenbildnerin und als bildende Künstlerin: Figuren, Objekte, Automaten, Collagen, Reliquiare, Räume, Puppen und Stickereien. Ab 1977 zeigte sie ihre Arbeiten in Einzelausstellungen unter anderem in Udine, Mailand, Bologna, Klagenfurt, Wien, Graz, Linz und Salzburg, mehrfach gemeinsam mit Günter Brus, etwa „Kaspar Hauser“ (2008) und die beiden „Phantasus“-Ausstellungen (2010, 2011). 2017 war sie Artist in Residence der Red Gate Residency in Peking. Ihr letzter Zyklus, „Das große Welttheater“, war 2020 in der Alpen-Adria-Galerie in Klagenfurt zu sehen und ist seit Dezember 2022 die Dauerausstellung der Theatergalerie.</p><p>Quelle</p><ul><li>stadtgalerie.net (Biografie von Burgis Paier)</li></ul>'
  })
})

// A permanent exhibition: is_permanent decides how the site shows and sorts it; end_date is a
// required field, so it carries a far date the site never shows (date_range says "since").
await ensure('pp_exhibitions', 'das-grosse-welttheater', {
  kind: 'exhibition', primary_venue: THEATERGALERIE,
  start_date: '2022-12-14', end_date: '2099-12-31', is_permanent: true,
  image: files.e_paier_image, source_pdf: files.e_paier_pdf,
  tour_status: 'available', tour_available_from: null,
  participations: [{ person: PAIER, role: ARTIST, sort: 0 }],
  ...bilingual({
    title: 'Burgis Paier – Das große Welttheater',
    date_range: 'Permanent exhibition since 14 December 2022',
    opening_hours: 'Thursday and Friday, 9:00–12:00, also on public holidays; groups by appointment',
    vernissage: 'Tuesday, 13 December 2022, 19:00',
    medium: 'Figures between sculpture and puppet',
    image_alt: 'Figures by Burgis Paier from Das große Welttheater, among them a woman with a fur collar and a pearl necklace (© Gerhard Maurer)',
    summary: 'Burgis Paier’s 350 figures of people from art and cultural history, the permanent heart of the Theatergalerie.',
    description: '<p>In 2018, when a serious illness first confronted her with her own mortality, the Klagenfurt costume designer and artist Burgis Paier began to stage her great world theatre: 350 figures of people from art and cultural history who had shaped her life and work – artists, writers, composers, philosophers, singers, fashion designers, actors, freedom fighters, explorers, scientists and even fairy-tale characters. They are neither puppets nor classical sculptures but hybrids of the two, and every figure has the artist’s hands. First shown in 2020 in the Alpen-Adria-Galerie, the cycle has been the permanent exhibition of the Theatergalerie since it opened in December 2022. Presentations on the theme of theatre change every half year and enter into dialogue with it.</p><p>Sources</p><ul><li>stadtgalerie.net</li><li>Invitation of the Stadtgalerie Klagenfurt (2022)</li></ul>'
  }, {
    title: 'Burgis Paier – Das große Welttheater',
    date_range: 'Dauerausstellung seit 14. Dezember 2022',
    opening_hours: 'Donnerstag und Freitag, 9:00–12:00 Uhr, auch an Feiertagen; Gruppen nach Vereinbarung',
    vernissage: 'Dienstag, 13. Dezember 2022, 19:00 Uhr',
    medium: 'Figuren zwischen Skulptur und Puppe',
    image_alt: 'Figuren von Burgis Paier aus dem „Großen Welttheater“, darunter eine Frau mit Pelzkragen und Perlenkette (© Gerhard Maurer)',
    summary: 'Burgis Paiers 350 Figuren von Persönlichkeiten der Kunst- und Kulturgeschichte, das dauerhafte Herzstück der Theatergalerie.',
    description: '<p>2018, als eine schwere Krankheit sie zum ersten Mal mit ihrer eigenen Sterblichkeit konfrontierte, begann die Klagenfurter Kostümbildnerin und Künstlerin Burgis Paier, ihr großes Welttheater zu inszenieren: 350 Figuren von Persönlichkeiten der Kunst- und Kulturgeschichte, die für ihr Leben und ihre Kunst prägend waren – Künstler:innen, Schriftsteller:innen, Komponist:innen, Philosoph:innen, Sänger:innen, Modeschöpfer:innen, Schauspieler:innen, Freiheitskämpfer:innen, Entdecker:innen, Naturwissenschafter:innen und sogar Märchenfiguren. Sie sind weder Puppen noch klassische Skulpturen, sondern Hybride aus beidem, und jede Figur trägt die Hände der Künstlerin. 2020 erstmals in der Alpen-Adria-Galerie zu sehen, ist der Zyklus seit der Eröffnung der Theatergalerie im Dezember 2022 ihre Dauerausstellung. Halbjährlich wechselnde Präsentationen zum Thema Theater treten mit ihm in Dialog.</p><p>Quellen</p><ul><li>stadtgalerie.net</li><li>Einladung der Stadtgalerie Klagenfurt (2022)</li></ul>'
  })
})
