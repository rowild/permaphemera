// Writes the records of 2026-11-03 into production Directus. All new records are drafts.
// Run from directus/:  DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-03__spielberg-ideenreich-kroen/write-records.mjs
// Safe to run twice: a record whose slug exists is left alone. Deletes nothing.
import { readFileSync } from 'node:fs'
import { loadEnv, login } from '../../directus/scripts/lib.mjs'

const files = JSON.parse(readFileSync(new URL('./file-ids.json', import.meta.url), 'utf8'))
const { api } = await login(loadEnv())

const ARTIST = '37b28cb2-e0ba-4081-b51b-836149de0a06'
const CURATOR = '68b75859-8a9b-4bc8-aa98-8c6577c18fb3'
const KNITTELFELD = '984190ac-d542-4211-9f41-634a095b0a44'
const LEBENSHILFE_ORG = 'cc483b81-115f-4d30-a83a-bd6da361c764'
const LEBENSHILFE_VENUE = '2c8a3f97-0215-41b1-8b21-859facfc84cd'
const PORCIA = 'e5e146ff-9d26-48e6-a34c-0d057caf6813'

const q = (value) => encodeURIComponent(value)
const bySlug = async (collection, slug) => (await api('GET', `/items/${collection}?filter[slug][_eq]=${q(slug)}&fields=id&limit=1`))[0]?.id
const dms = (lat, lon) => {
  const part = (value) => { const a = Math.abs(value); const d = Math.floor(a); const m = Math.floor((a - d) * 60); const s = Math.round(((a - d) * 60 - m) * 60); return `${d}° ${m}′ ${s}″` }
  return `${part(lat)} N · ${part(lon)} E`
}
// English on the record and in `en`, German in `de` (pnpm check:data tests the mirror).
const bilingual = (en, de) => ({ ...en, translations: [{ languages_code: 'en', ...en }, { languages_code: 'de', ...de }] })

const links = new Map()
const link = async (url, title, kind, titleDe = title) => {
  if (links.has(url)) return links.get(url)
  const [found] = await api('GET', `/items/pp_websites?filter[url][_eq]=${q(url)}&fields=id&limit=1`)
  const id = found?.id ?? (await api('POST', '/items/pp_websites', {
    status: 'published', title, url, kind,
    translations: [{ languages_code: 'en', title }, { languages_code: 'de', title: titleDe }]
  })).id
  links.set(url, id)
  return id
}
const linkRows = async (list) => {
  const rows = []
  for (const [index, entry] of list.entries()) rows.push({ websites_id: await link(...entry), sort: index + 1 })
  return rows
}
const ensure = async (collection, slug, payload) => {
  const found = await bySlug(collection, slug)
  if (found) { console.log(`= ${collection}/${slug}`); return found }
  const { id } = await api('POST', `/items/${collection}`, { slug, status: 'draft', ...payload })
  console.log(`+ ${collection}/${slug} ${id}`)
  return id
}
const venueFields = (lat, lon, image) => ({ latitude: lat, longitude: lon, coordinate_label: dms(lat, lon), image, hero_image: image })
const relation = async (organisation, venue, kind) => {
  const found = await api('GET', `/items/pp_organisation_venue_relations?filter[organisation][_eq]=${organisation}&filter[venue][_eq]=${venue}&fields=id&limit=1`)
  if (!found.length) { await api('POST', '/items/pp_organisation_venue_relations', { organisation, venue, relation: kind }); console.log(`+ relation ${kind}`) }
}

// ─── Town ───────────────────────────────────────────────────────────────────
const SPIELBERG = await ensure('pp_locations', 'spielberg', {
  title: 'Spielberg', postal_code: '8724', state: 'Styria', country: 'Austria', latitude: 47.2123, longitude: 14.7857,
  ...bilingual({ description: 'Town in the Murtal district of Styria, home of the Red Bull Ring racing circuit.' },
    { description: 'Stadt im Bezirk Murtal in der Steiermark, Standort der Rennstrecke Red Bull Ring.' })
})

// ─── Venues ─────────────────────────────────────────────────────────────────
{
  const lat = 47.20103; const lon = 14.78580
  await ensure('pp_venues', 'art-hotel-spielberg', {
    title: 'Art Hotel Spielberg', type: 'forum', location: SPIELBERG, archive_number: '42', address: 'Lilienweg 7, 8724 Spielberg, Austria',
    website_url: 'https://www.arthotel-spielberg.at/', ...venueFields(lat, lon, files.v_hotel),
    ...bilingual({
      image_alt: 'The Stadtplatz of Spielberg on a sunny day: a wide road, parked cars, low commercial buildings and trees under a blue sky with white clouds',
      hero_image_alt: 'The main road through the centre of Spielberg in the Mur valley',
      image_caption: 'The Stadtplatz of Spielberg, the town of the hotel · Foto: Robert Kropf (CC BY-SA 4.0)',
      coordinate_label: dms(lat, lon),
      lede: 'Hotel with 46 rooms in Spielberg in the Mur valley, Styria.',
      description: 'Hotel in Spielberg, Styria, run by MFST GmbH of Knittelfeld.',
      about_html: '<p>The Art Hotel Spielberg is at Lilienweg 7 in Spielberg, in the Murtal district of Styria. It has 46 rooms with 96 beds and a seminar room, and it is open all year. MFST GmbH of Knittelfeld runs it.</p>'
    }, {
      image_alt: 'Der Stadtplatz von Spielberg an einem sonnigen Tag: eine breite Straße, parkende Autos, niedrige Geschäftsgebäude und Bäume unter blauem Himmel mit weißen Wolken',
      hero_image_alt: 'Die Hauptstraße durch das Zentrum von Spielberg im Murtal',
      image_caption: 'Der Stadtplatz von Spielberg, dem Ort des Hotels · Foto: Robert Kropf (CC BY-SA 4.0)',
      coordinate_label: dms(lat, lon),
      lede: 'Hotel mit 46 Zimmern in Spielberg im Murtal, Steiermark.',
      description: 'Hotel in Spielberg in der Steiermark, betrieben von der MFST GmbH aus Knittelfeld.',
      about_html: '<p>Das Art Hotel Spielberg liegt im Lilienweg 7 in Spielberg im Bezirk Murtal in der Steiermark. Es hat 46 Zimmer mit 96 Betten und einen Seminarraum und ist das ganze Jahr geöffnet. Betrieben wird es von der MFST GmbH aus Knittelfeld.</p>'
    })
  })
}
{
  const lat = 47.21523; const lon = 14.82994
  const IDEEN = await ensure('pp_venues', 'ideenreich-knittelfeld', {
    title: 'Ideenreich', type: 'forum', location: KNITTELFELD, part_of: LEBENSHILFE_VENUE, archive_number: '43', address: 'Hauptplatz 17, 8720 Knittelfeld, Austria',
    website_url: 'https://ideenreich-knittelfeld.at/', ...venueFields(lat, lon, files.v_ideen),
    ...bilingual({
      image_alt: 'The Hauptplatz of Knittelfeld: a Marian column with statues between two trees, coloured town houses behind, parked cars at the side',
      hero_image_alt: 'The main square of Knittelfeld with its column and town houses',
      image_caption: 'The Hauptplatz of Knittelfeld, where the shop is · Foto: Ewaldm (CC BY-SA 3.0)',
      coordinate_label: dms(lat, lon),
      lede: 'Inclusive shop and workshop of the Lebenshilfe Region Knittelfeld on the main square of Knittelfeld.',
      description: 'Shop with an integrated workshop of the Lebenshilfe Region Knittelfeld, also a place for art and culture events.',
      about_html: '<p>“Ideenreich” at Hauptplatz 17 is the inclusive shop of the Lebenshilfe Region Knittelfeld, with an integrated workshop where people with and without disabilities make products of wood and clay. The Lebenshilfe wants it to be a meeting place for craft, art, information and culture events. In 2026 the artist Helmuth “PLO” Ploschnitznigg held a painting workshop there with clients of the Lebenshilfe.</p><p>It is open Monday to Thursday from 8.30 am to 12 noon and from 1 pm to 4 pm, and Friday from 8.30 am to 12 noon.</p>'
    }, {
      image_alt: 'Der Hauptplatz von Knittelfeld: eine Mariensäule mit Figuren zwischen zwei Bäumen, dahinter bunte Bürgerhäuser, seitlich parkende Autos',
      hero_image_alt: 'Der Hauptplatz von Knittelfeld mit Säule und Bürgerhäusern',
      image_caption: 'Der Hauptplatz von Knittelfeld, an dem das Geschäft liegt · Foto: Ewaldm (CC BY-SA 3.0)',
      coordinate_label: dms(lat, lon),
      lede: 'Inklusives Verkaufslokal mit Werkstatt der Lebenshilfe Region Knittelfeld am Knittelfelder Hauptplatz.',
      description: 'Verkaufslokal mit integrierter Werkstatt der Lebenshilfe Region Knittelfeld, auch Ort für Kunst- und Kulturveranstaltungen.',
      about_html: '<p>Das „Ideenreich“ am Hauptplatz 17 ist das inklusive Verkaufslokal der Lebenshilfe Region Knittelfeld, mit einer integrierten Werkstatt, in der Menschen mit und ohne Behinderung Produkte aus Holz und Ton herstellen. Die Lebenshilfe will es zu einem Treffpunkt für Handwerk, Kunst-, Info- und Kulturveranstaltungen machen. 2026 hielt der Künstler Helmuth „PLO“ Ploschnitznigg dort einen Malworkshop mit Klientinnen der Lebenshilfe.</p><p>Geöffnet ist es Montag bis Donnerstag von 8.30 bis 12 und von 13 bis 16 Uhr, Freitag von 8.30 bis 12 Uhr.</p>'
    })
  })
  await relation(LEBENSHILFE_ORG, IDEEN, 'runs')
}

// ─── Person ─────────────────────────────────────────────────────────────────
{
  const about = (text) => `<p>${text}</p>`
  await ensure('pp_persons', 'severin-kroen', {
    first_name: 'Séverin', last_name: 'Krön', born: '1964, Nanterre', image: files.p_kroen,
    roles: [{ roles_id: ARTIST }, { roles_id: CURATOR }],
    venues: [{ venues_id: PORCIA, sort: 1 }],
    websites: await linkRows([
      ['https://www.artmajeur.com/severin-kroen/de', 'artmajeur.com', 'website'],
      ['https://www.instagram.com/severin.kron/', 'Instagram', 'social'],
      ['https://www.youtube.com/channel/UC09uCVSCgehz7HnPjf_VjbA', 'YouTube', 'social'],
      ['https://www.linkedin.com/in/severin-kroen/', 'LinkedIn', 'social']
    ]),
    ...bilingual({
      based_in: 'Carinthia',
      image_alt: 'Séverin Krön, a man with grey curly hair in a long black coat, stands on the stairs of a vaulted stone gallery and spreads his arms',
      image_caption: 'Séverin Krön in the Galerie im Schloss Porcia, 2022 · Photo: Michael Thun',
      lede: 'Painter and draughtsman, head of the Galerie im Schloss Porcia in Spittal an der Drau since 2022.',
      about_html: about('Séverin Krön was born in 1964 in Nanterre near Paris and grew up bilingual. From 1985 to 1992 he studied painting and art education in Vienna and at the Mozarteum in Salzburg; his teachers included Arnulf Rainer and Anton Lehmden. Since 2007 he has made “Art permutable”: pictures of square panels that can be moved and turned. Myths are a frequent subject, as in a series on the Ring of the Nibelung from 2014. He has had solo exhibitions in Vienna, Paris, Linz, Salzburg, Corbeil and Bern, worked in the International Guest Studio Maltator in Gmünd in 2015 and showed his work at the KUNSTradln gallery in Millstatt in 2019. In January 2022 he followed Elisabeth Kleinwächter as head of the Galerie im Schloss Porcia in Spittal an der Drau, where he curates the exhibitions. Source: kuenstlerstadt-gmuend.at, meinbezirk.at, spittal-drau.at.')
    }, {
      based_in: 'Kärnten',
      image_alt: 'Séverin Krön, ein Mann mit grauem Lockenhaar in langem schwarzem Mantel, steht auf der Treppe einer gewölbten Steingalerie und breitet die Arme aus',
      image_caption: 'Séverin Krön in der Galerie im Schloss Porcia, 2022 · Foto: Michael Thun',
      lede: 'Maler und Zeichner, seit 2022 Leiter der Galerie im Schloss Porcia in Spittal an der Drau.',
      about_html: about('Séverin Krön wurde 1964 in Nanterre bei Paris geboren und wuchs zweisprachig auf. Von 1985 bis 1992 studierte er Malerei und Kunsterziehung in Wien und am Mozarteum in Salzburg, unter anderem bei Arnulf Rainer und Anton Lehmden. Seit 2007 macht er „Art permutable“: Bilder aus quadratischen Tafeln, die sich versetzen und drehen lassen. Mythen sind ein häufiges Thema, etwa in einer Serie zum Ring des Nibelungen von 2014. Er hatte Einzelausstellungen in Wien, Paris, Linz, Salzburg, Corbeil und Bern, arbeitete 2015 im Internationalen Gastatelier Maltator in Gmünd und zeigte 2019 Arbeiten in der KUNSTradln-Galerie in Millstatt. Im Jänner 2022 folgte er Elisabeth Kleinwächter als Leiter der Galerie im Schloss Porcia in Spittal an der Drau, wo er die Ausstellungen kuratiert. Quelle: kuenstlerstadt-gmuend.at, meinbezirk.at, spittal-drau.at.')
    })
  })
}
