// Writes the records of 2026-11-09 (Kmetija Moro, Trigeniale Brda 26, three artists) into
// production Directus. All new records are drafts.
// Run from directus/:  DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-09__trigeniale-brda-26-kmetija-moro/write-records.mjs
// Safe to run twice: a record whose slug exists is left alone. Deletes nothing, publishes nothing.
import { readFileSync } from 'node:fs'
import { loadEnv, login } from '../../directus/scripts/lib.mjs'

const files = JSON.parse(readFileSync(new URL('./file-ids.json', import.meta.url), 'utf8'))
const { api } = await login(loadEnv())

const ARTIST = '37b28cb2-e0ba-4081-b51b-836149de0a06'
const ORGANISER_ROLE = '095bd21b-4c58-4a42-a6c8-e5d41e91f16f'
const BEWEGUNG = '44330447-a71c-4ff1-bfd4-cd868a8cdcd9' // bewegung/movimento/gibanjeINkultur (exists, published)
const LEPICNIK = '5fa905a0-6a0c-4a8a-93e4-5834be99b2d9' // Gerhard Lepicnik (exists, role organiser)

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
  if (found) { console.log(`= ${collection}/${slug} ${found}`); return found }
  const { id } = await api('POST', `/items/${collection}`, { slug, status: 'draft', ...payload })
  console.log(`+ ${collection}/${slug} ${id}`)
  return id
}

// ─── Town ───────────────────────────────────────────────────────────────────
// The municipality (Občina Brda), coordinates of its seat Dobrovo (OpenStreetMap).
// Slovenia has no federal states: `state` holds the statistical region Goriška.
const BRDA = await ensure('pp_locations', 'brda', {
  title: 'Brda', postal_code: '5212', state: 'Goriška', country: 'Slovenia', latitude: 45.9974, longitude: 13.5274,
  ...bilingual(
    { description: 'Municipality in the hills of Goriška Brda in western Slovenia, on the Italian border, with its seat in Dobrovo.' },
    { description: 'Gemeinde im Hügelland Goriška Brda im Westen Sloweniens, an der Grenze zu Italien, mit Sitz in Dobrovo.' }
  )
})

// ─── Venue ──────────────────────────────────────────────────────────────────
// Building outline OSM way 1286663695 (Vipolže 62); the camera GPS of 8 Nov 2026 lies inside it.
const LAT = 45.97359; const LON = 13.53031
const MORO = await ensure('pp_venues', 'kmetija-moro-brda', {
  title: 'Kmetija Moro', type: 'forum', location: BRDA, archive_number: '45', address: 'Vipolže 62, 5212 Dobrovo v Brdih, Slovenia',
  website_url: 'https://www.moro-wines.com/', latitude: LAT, longitude: LON, coordinate_label: dms(LAT, LON),
  image: files.v_moro, hero_image: files.v_moro,
  websites: await linkRows([
    ['https://www.instagram.com/moro_wines/', 'Instagram', 'social'],
    ['https://www.facebook.com/MoroWines', 'Facebook', 'social']
  ]),
  ...bilingual({
    image_alt: 'The hall of Kmetija Moro: landscape paintings and smaller works along a pink wall, a long wooden table with red chairs, and a photo mural of the Brda hills at the far end',
    hero_image_alt: 'The tasting hall of the Kmetija Moro winery in Vipolže, Goriška Brda, during an exhibition',
    image_caption: 'The hall of Kmetija Moro during Trigeniale Brda 26 · Foto: Robert Wildling / PERMAPHEMERA',
    coordinate_label: dms(LAT, LON),
    lede: 'Family farm and winery in Vipolže, Goriška Brda, Slovenia, where artists from Carinthia, Friuli and Slovenia have exhibited since 2018.',
    description: 'Family farm and winery in Goriška Brda, Slovenia, with the exhibition series “Kunst in den Hügeln” since 2018.',
    about_html: '<p>Kmetija Moro is a family farm at Vipolže 62 in Goriška Brda, Slovenia, near the Italian border. It sells its wines as Moro Wines. According to the family, the farm goes back to the great-grandmother Margerita; the name comes from a grandfather nicknamed Moro because of his black hair. The family cultivates 7 hectares of vineyards and 5 hectares of orchards. The Jakončič family runs it: Boris and Dragica Jakončič and Damjan Jakončič, the junior head.</p>' +
      '<p>Since 2018 the Kulturinitiative bewegungINkultur from Klagenfurt has organised the exhibition series “Kunst in den Hügeln – Umetnost v Brdih – Arte nel Collio” in the farm’s hall, with artists from Carinthia, Friuli and Slovenia. The organisers call the place the “Kunstbotschaft Kärntens in Slowenien” (Slovenian “Ambasada umetnosti Koroške v Sloveniji”, Italian “Ambasciata d’arte della Carinzia in Slovenia”). In 2026 the exhibitions changed in spring and autumn. Visits are by telephone appointment.</p>' +
      '<p>Sources</p><ul><li>moro-wines.com</li><li>meinbezirk.at</li><li>poster of Trigeniale Brda 26</li></ul>'
  }, {
    image_alt: 'Der Saal der Kmetija Moro: Landschaftsbilder und kleinere Arbeiten an einer rosa Wand, ein langer Holztisch mit roten Stühlen und am Ende eine Fototapete mit den Hügeln der Brda',
    hero_image_alt: 'Der Verkostungssaal des Weinguts Kmetija Moro in Vipolže, Goriška Brda, während einer Ausstellung',
    image_caption: 'Der Saal der Kmetija Moro während der Trigeniale Brda 26 · Foto: Robert Wildling / PERMAPHEMERA',
    coordinate_label: dms(LAT, LON),
    lede: 'Familienbetrieb und Weingut in Vipolže, Goriška Brda, Slowenien, in dem seit 2018 Kunstschaffende aus Kärnten, Friaul und Slowenien ausstellen.',
    description: 'Familienbetrieb und Weingut in Goriška Brda, Slowenien, seit 2018 mit der Ausstellungsreihe „Kunst in den Hügeln“.',
    about_html: '<p>Die Kmetija Moro ist ein Familienbetrieb in Vipolže 62 in Goriška Brda, Slowenien, nahe der italienischen Grenze. Ihre Weine verkauft sie als Moro Wines. Laut der Familie geht der Hof auf die Urgroßmutter Margerita zurück; der Name stammt von einem Großvater, der wegen seiner schwarzen Haare Moro genannt wurde. Die Familie bewirtschaftet 7 Hektar Weingärten und 5 Hektar Obstgärten. Geführt wird der Betrieb von der Familie Jakončič: Boris und Dragica Jakončič und Damjan Jakončič, dem Juniorchef.</p>' +
      '<p>Seit 2018 veranstaltet die Kulturinitiative bewegungINkultur aus Klagenfurt im Saal des Hofes die Ausstellungsreihe „Kunst in den Hügeln – Umetnost v Brdih – Arte nel Collio“ mit Kunstschaffenden aus Kärnten, Friaul und Slowenien. Die Veranstalter nennen den Ort „Kunstbotschaft Kärntens in Slowenien“ (slowenisch „Ambasada umetnosti Koroške v Sloveniji“, italienisch „Ambasciata d’arte della Carinzia in Slovenia“). 2026 wechselten die Ausstellungen im Frühling und im Herbst. Besuche sind nach telefonischer Anmeldung möglich.</p>' +
      '<p>Quellen</p><ul><li>moro-wines.com</li><li>meinbezirk.at</li><li>Plakat der Trigeniale Brda 26</li></ul>'
  })
})

// bewegungINkultur shows its exhibition series at the farm.
{
  const found = await api('GET', `/items/pp_organisation_venue_relations?filter[organisation][_eq]=${BEWEGUNG}&filter[venue][_eq]=${MORO}&fields=id&limit=1`)
  if (!found.length) { await api('POST', '/items/pp_organisation_venue_relations', { organisation: BEWEGUNG, venue: MORO, relation: 'exhibits_at' }); console.log('+ pp_organisation_venue_relations bewegungINkultur exhibits_at Kmetija Moro') }
}

// ─── Persons ────────────────────────────────────────────────────────────────
const person = (slug, first_name, last_name, { born = null, en, de }) =>
  ensure('pp_persons', slug, { first_name, last_name, born, roles: [{ roles_id: ARTIST }], ...bilingual(en, de) })

const CERNETIG = await person('giulia-cernetig', 'Giulia', 'Cernetig', {
  en: {
    based_in: 'Udine, Italy',
    lede: 'Painter from Udine, member of the Gruppo artistico culturale Albrecht Dürer in Tavagnacco.',
    about_html: '<p>Giulia Cernetig is a painter from Udine in Friuli and a member of the Gruppo artistico culturale Albrecht Dürer in Tavagnacco, which works with the Kulturinitiative bewegungINkultur in Klagenfurt. From 6 to 27 June 2026 the municipality of San Pietro al Natisone showed her solo exhibition “The Breath of Color” in its council chamber. In autumn 2026 she exhibited with Aleksandra Rusjan and Margrit Pernull in Trigeniale Brda 26 at the Kmetija Moro in Goriška Brda.</p><p>Sources</p><ul><li>meinbezirk.at</li><li>benecija.eu</li></ul>'
  },
  de: {
    based_in: 'Udine, Italien',
    lede: 'Malerin aus Udine, Mitglied des Gruppo artistico culturale Albrecht Dürer in Tavagnacco.',
    about_html: '<p>Giulia Cernetig ist Malerin aus Udine in Friaul und Mitglied des Gruppo artistico culturale Albrecht Dürer in Tavagnacco, der mit der Kulturinitiative bewegungINkultur in Klagenfurt zusammenarbeitet. Vom 6. bis 27. Juni 2026 zeigte die Gemeinde San Pietro al Natisone ihre Einzelausstellung „The Breath of Color“ im Sitzungssaal des Gemeindeamts. Im Herbst 2026 stellte sie mit Aleksandra Rusjan und Margrit Pernull in der Trigeniale Brda 26 in der Kmetija Moro in Goriška Brda aus.</p><p>Quellen</p><ul><li>meinbezirk.at</li><li>benecija.eu</li></ul>'
  }
})

const RUSJAN = await person('aleksandra-rusjan', 'Aleksandra', 'Rusjan', {
  en: {
    based_in: 'Goriška Brda, Slovenia',
    lede: 'Painter from Goriška Brda, member of the artists’ association DABLO.',
    about_html: '<p>Aleksandra Rusjan is a painter from Goriška Brda in Slovenia and a member of the artists’ association DABLO (Društvo briških likovnih ustvarjalcev) in Brda. In autumn 2026 she exhibited with Giulia Cernetig and Margrit Pernull in Trigeniale Brda 26 at the Kmetija Moro in Vipolže. Her works there included “Kanjon” (canyon), “Češnja” (cherry), which she called her favourite work, and a painting of Dobrovo Castle.</p><p>Source</p><ul><li>meinbezirk.at</li></ul>'
  },
  de: {
    based_in: 'Goriška Brda, Slowenien',
    lede: 'Malerin aus Goriška Brda, Mitglied des Künstlervereins DABLO.',
    about_html: '<p>Aleksandra Rusjan ist Malerin aus Goriška Brda in Slowenien und Mitglied des Künstlervereins DABLO (Društvo briških likovnih ustvarjalcev) in Brda. Im Herbst 2026 stellte sie mit Giulia Cernetig und Margrit Pernull in der Trigeniale Brda 26 in der Kmetija Moro in Vipolže aus. Zu ihren Arbeiten dort gehörten „Kanjon“ (Schlucht), „Češnja“ (Kirsche), die sie ihr Lieblingswerk nannte, und ein Bild von Schloss Dobrovo.</p><p>Quelle</p><ul><li>meinbezirk.at</li></ul>'
  }
})

const PERNULL = await person('margrit-pernull', 'Margrit', 'Pernull', {
  born: '1958, Gmünd',
  en: {
    based_in: 'Hermagor, Carinthia',
    lede: 'Painter in Hermagor, Carinthia, of landscapes, fruit and flowers.',
    about_html: '<p>Margrit Pernull was born in 1958 in Gmünd in Carinthia and has lived in Hermagor since 1980. She worked as an occupational therapist. After retiring she studied at the Freie Akademie der bildenden Künste in Klagenfurt from 2018 and received her diploma in 2023. Since 2021 she has been a member of the painting group of the academic painter Milan Baltić in Klagenfurt. In 2022 she had a solo exhibition at the Pressegger See; in 2023 and 2024 she took part in group exhibitions at the BV Galerie and the Gewölbegalerie in Klagenfurt and at the Bildungshaus Sodalitas in Tainach. In Trigeniale Brda 26 at the Kmetija Moro in Goriška Brda she showed landscapes of the Nockberge and the Weissensee, fruit and flowers.</p><p>Sources</p><ul><li>artist sheet in the exhibition Trigeniale Brda 26 (bewegungINkultur)</li><li>meinbezirk.at</li></ul>'
  },
  de: {
    based_in: 'Hermagor, Kärnten',
    lede: 'Malerin in Hermagor, Kärnten, von Landschaften, Früchten und Blumen.',
    about_html: '<p>Margrit Pernull wurde 1958 in Gmünd in Kärnten geboren und lebt seit 1980 in Hermagor. Sie arbeitete als Ergotherapeutin. Nach ihrer Pensionierung studierte sie ab 2018 an der Freien Akademie der bildenden Künste in Klagenfurt und schloss 2023 mit Diplom ab. Seit 2021 ist sie Mitglied der Malgruppe des akademischen Malers Milan Baltić in Klagenfurt. 2022 hatte sie eine Einzelausstellung am Presseggersee; 2023 und 2024 nahm sie an Gruppenausstellungen in der BV-Galerie und der Gewölbegalerie in Klagenfurt und im Bildungshaus Sodalitas in Tainach teil. In der Trigeniale Brda 26 in der Kmetija Moro in Goriška Brda zeigte sie Landschaften der Nockberge und des Weißensees, Früchte und Blumen.</p><p>Quellen</p><ul><li>Künstlerinnenblatt in der Ausstellung Trigeniale Brda 26 (bewegungINkultur)</li><li>meinbezirk.at</li></ul>'
  }
})

// ─── Exhibition ─────────────────────────────────────────────────────────────
const HOURS = ['By telephone appointment with Kmetija Moro, +386 51 604 649', 'Nach telefonischer Anmeldung bei der Kmetija Moro, +386 51 604 649']
const people = [[CERNETIG, ARTIST], [RUSJAN, ARTIST], [PERNULL, ARTIST], [LEPICNIK, ORGANISER_ROLE]]
const TRIG = await ensure('pp_exhibitions', 'trigeniale-brda-26', {
  kind: 'exhibition', primary_venue: MORO, start_date: '2026-09-25', end_date: '2026-12-31',
  image: files.e_trig, tour_status: 'available', tour_available_from: '2026-12-31',
  participations: people.map(([person, role], index) => ({ person, role, sort: index + 1 })),
  websites: await linkRows([
    ['https://www.meinbezirk.at/klagenfurt/c-regionauten-community/neue-dreilaenderausstellung-trigeniale-brda-26-in-gorika-brda_a8905011', 'Announcement at meinbezirk.at (September 2026)', 'press', 'Ankündigung auf meinbezirk.at (September 2026)'],
    ['https://www.meinbezirk.at/klagenfurt/c-regionauten-community/trigeniale-brda-im-herbst_a8921886', 'Opening report at meinbezirk.at (September 2026)', 'press', 'Bericht zur Eröffnung auf meinbezirk.at (September 2026)']
  ]),
  ...bilingual({
    title: 'Trigeniale Brda 26', date_range: '25 September–31 December 2026', opening_hours: HOURS[0],
    vernissage: 'Friday, 25 September 2026, 16:00; opened by Franc Mužič, mayor of Brda', medium: 'Painting',
    image_alt: 'Long pink wall in the hall of Kmetija Moro with a row of paintings above wooden tables and red chairs: fruit and flowers, an octopus, abstract works and landscapes (photo © Robert Wildling / PERMAPHEMERA, works © Giulia Cernetig, Aleksandra Rusjan and Margrit Pernull)',
    summary: 'Paintings by Giulia Cernetig, Aleksandra Rusjan and Margrit Pernull from Friuli, Slovenia and Carinthia at the Kmetija Moro winery in Goriška Brda.',
    description: '<p>The 18th exhibition of the series “Kunst in den Hügeln – Umetnost v Brdih – Arte nel Collio” shows paintings by three women artists from Friuli, Slovenia and Carinthia in the hall of the Kmetija Moro winery in Vipolže, Goriška Brda. Giulia Cernetig (Udine) belongs to the Gruppo artistico culturale Albrecht Dürer in Tavagnacco. Aleksandra Rusjan (Brda), a member of the artists’ association DABLO, shows among other works “Kanjon”, “Češnja” and Dobrovo Castle. Margrit Pernull (Hermagor) shows landscapes of the Nockberge and the Weissensee, fruit and flowers. The Kulturinitiative bewegungINkultur organises the exhibition with both associations, under the patronage of the Alpe-Adria Center for Cross-border Cooperation (AACC). Franc Mužič, mayor of Brda, opened it; it was his last opening in the series, as he leaves office in November 2026.</p><p>Sources</p><ul><li>poster of the exhibition</li><li>meinbezirk.at</li></ul>'
  }, {
    title: 'Trigeniale Brda 26', date_range: '25. September–31. Dezember 2026', opening_hours: HOURS[1],
    vernissage: 'Freitag, 25. September 2026, 16:00 Uhr; Eröffnung durch Franc Mužič, Bürgermeister von Brda', medium: 'Malerei',
    image_alt: 'Lange rosa Wand im Saal der Kmetija Moro mit einer Reihe von Bildern über Holztischen und roten Stühlen: Früchte und Blumen, ein Oktopus, abstrakte Arbeiten und Landschaften (Foto © Robert Wildling / PERMAPHEMERA, Werke © Giulia Cernetig, Aleksandra Rusjan und Margrit Pernull)',
    summary: 'Malerei von Giulia Cernetig, Aleksandra Rusjan und Margrit Pernull aus Friaul, Slowenien und Kärnten im Weingut Kmetija Moro in Goriška Brda.',
    description: '<p>Die 18. Ausstellung der Reihe „Kunst in den Hügeln – Umetnost v Brdih – Arte nel Collio“ zeigt Malerei von drei Künstlerinnen aus Friaul, Slowenien und Kärnten im Saal des Weinguts Kmetija Moro in Vipolže, Goriška Brda. Giulia Cernetig (Udine) gehört dem Gruppo artistico culturale Albrecht Dürer in Tavagnacco an. Aleksandra Rusjan (Brda), Mitglied des Künstlervereins DABLO, zeigt unter anderem „Kanjon“, „Češnja“ und Schloss Dobrovo. Margrit Pernull (Hermagor) zeigt Landschaften der Nockberge und des Weißensees, Früchte und Blumen. Die Kulturinitiative bewegungINkultur veranstaltet die Ausstellung mit beiden Vereinen, unter der Patronanz des Alpe-Adria Zentrums für grenzüberschreitende Kooperation (AACC). Eröffnet hat sie Franc Mužič, Bürgermeister von Brda; es war seine letzte Eröffnung der Reihe, da er im November 2026 aus dem Amt scheidet.</p><p>Quellen</p><ul><li>Plakat der Ausstellung</li><li>meinbezirk.at</li></ul>'
  })
})

{
  const found = await api('GET', `/items/pp_exhibition_organisers?filter[exhibition][_eq]=${TRIG}&filter[organisation][_eq]=${BEWEGUNG}&fields=id&limit=1`)
  if (!found.length) { await api('POST', '/items/pp_exhibition_organisers', { exhibition: TRIG, organisation: BEWEGUNG, role: 'organiser', sort: 1 }); console.log('+ pp_exhibition_organisers bewegungINkultur organiser') }
}

console.log(JSON.stringify({ BRDA, MORO, CERNETIG, RUSJAN, PERNULL, TRIG }, null, 1))
