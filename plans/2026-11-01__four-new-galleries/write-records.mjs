// Writes the records of 2026-11-01 into production Directus. All new records are drafts.
// Run from directus/:  DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-01__four-new-galleries/write-records.mjs
// Safe to run twice: a record whose slug exists is left alone. Deletes nothing.
import { readFileSync } from 'node:fs'
import { loadEnv, login } from '../../directus/scripts/lib.mjs'

const files = JSON.parse(readFileSync(new URL('./file-ids.json', import.meta.url), 'utf8'))
const { api } = await login(loadEnv())

const ARTIST = '37b28cb2-e0ba-4081-b51b-836149de0a06'
const CURATOR = '68b75859-8a9b-4bc8-aa98-8c6577c18fb3'
const VILLACH = '075119d3-fcac-4da8-a036-6c4f3b490450'

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

// ─── Towns ──────────────────────────────────────────────────────────────────
const LIND = await ensure('pp_locations', 'kleblach-lind', {
  title: 'Kleblach-Lind', postal_code: '9753', state: 'Carinthia', country: 'Austria', latitude: 46.7685, longitude: 13.3562,
  ...bilingual({ description: 'Municipality in the Upper Drava valley, seat of the Wallnerhaus.' }, { description: 'Gemeinde im Oberen Drautal, Sitz des Wallnerhauses.' })
})
const KNITTELFELD = await ensure('pp_locations', 'knittelfeld', {
  title: 'Knittelfeld', postal_code: '8720', state: 'Styria', country: 'Austria', latitude: 47.2152, longitude: 14.8299,
  ...bilingual({ description: 'Town in the Murtal district of Styria, seat of the Lebenshilfe Region Knittelfeld.' }, { description: 'Stadt im Bezirk Murtal in der Steiermark, Sitz der Lebenshilfe Region Knittelfeld.' })
})

// ─── Organisations ──────────────────────────────────────────────────────────
const postwerkLinks = await linkRows([['https://postwerk.at', 'postwerk.at', 'website'], ['https://www.facebook.com/postWERK', 'Facebook', 'social']])
const POSTWERK = await ensure('pp_organisations', 'kunstverein-postwerk', {
  title: 'Kunstverein postWERK', kind: 'association', location: VILLACH, address: 'Steinwenderstraße 2, 9500 Villach, Austria', founded: '2012',
  websites: postwerkLinks,
  ...bilingual({
    lede: 'Non-profit art association based in Villach, founded in 2012, with an annual exhibition on a yearly theme.',
    description: 'Non-profit art association in Villach with an annual exhibition on a yearly theme.',
    about_html: '<p>The Kunstverein postWERK is a non-profit art association based in Villach, founded in 2012 by Dorothee Unkel, its honorary president. Barbara Ambrusch-Rapp has chaired it since January 2020. Members and guest artists show an annual exhibition on a yearly theme, in 2026 “FRAGIL” at the Dinzlschloss in Villach. Source: postwerk.at.</p>'
  }, {
    lede: 'Gemeinnütziger Kunstverein mit Sitz in Villach, 2012 gegründet, mit einer Jahresausstellung zu einem Jahresthema.',
    description: 'Gemeinnütziger Kunstverein in Villach mit einer Jahresausstellung zu einem Jahresthema.',
    about_html: '<p>Der Kunstverein postWERK ist ein gemeinnütziger Kunstverein mit Sitz in Villach, 2012 von Dorothee Unkel gegründet, seiner Ehrenpräsidentin. Obfrau ist seit Jänner 2020 Barbara Ambrusch-Rapp. Mitglieder und Gastkünstler:innen zeigen jedes Jahr eine Ausstellung zu einem Jahresthema, 2026 „FRAGIL“ im Dinzlschloss in Villach. Quelle: postwerk.at.</p>'
  })
})
const lebenshilfeLinks = await linkRows([
  ['https://www.facebook.com/p/Lebenshilfe-Region-Knittelfeld-100068497488180/', 'Facebook', 'social'],
  ['https://ideenreich-knittelfeld.at/', 'ideenreich-knittelfeld.at', 'website']
])
const LEBENSHILFE = await ensure('pp_organisations', 'lebenshilfe-region-knittelfeld', {
  title: 'Lebenshilfe Region Knittelfeld', kind: 'institution', location: KNITTELFELD, address: 'Dr.-Hans-Klöpfer-Straße 38, 8720 Knittelfeld, Austria', founded: '1982',
  websites: await linkRows([['https://www.lebenshilfe-knittelfeld.at/', 'lebenshilfe-knittelfeld.at', 'website'], ['https://www.facebook.com/p/Lebenshilfe-Region-Knittelfeld-100068497488180/', 'Facebook', 'social'], ['https://ideenreich-knittelfeld.at/', 'ideenreich-knittelfeld.at', 'website']]),
  ...bilingual({
    lede: 'Organisation in Knittelfeld, Styria, for people with intellectual disabilities, founded in 1982, whose artists exhibit their work.',
    description: 'Organisation in Knittelfeld for people with intellectual disabilities, whose artists exhibit their work.',
    about_html: '<p>The Lebenshilfe Region Knittelfeld began on 3 February 1982 as a parents’ association and today is a non-profit company with its association behind it, chaired by Johann Hubmann. Nearly 100 people work in its workshops, homes and mobile services for people with intellectual disabilities. It is a member of the Lebenshilfe network in Austria. In the shop “Ideenreich” at Hauptplatz 17 it sells products made in its workshops. Source: lebenshilfe-knittelfeld.at, lebenshilfe.at, ideenreich-knittelfeld.at, meinbezirk.at.</p>'
  }, {
    lede: 'Einrichtung in Knittelfeld, Steiermark, für Menschen mit intellektuellen Behinderungen, 1982 gegründet, deren Künstler:innen ihre Arbeiten ausstellen.',
    description: 'Einrichtung in Knittelfeld für Menschen mit intellektuellen Behinderungen, deren Künstler:innen ihre Arbeiten ausstellen.',
    about_html: '<p>Die Lebenshilfe Region Knittelfeld entstand am 3. Februar 1982 als Elternverein und ist heute eine gemeinnützige GmbH mit dem Verein dahinter, Obmann ist Johann Hubmann. Beinahe 100 Menschen arbeiten in den Werkstätten, Wohnhäusern und mobilen Diensten für Menschen mit intellektuellen Behinderungen. Sie gehört zum Netz der Lebenshilfe in Österreich. Im Geschäft „Ideenreich“ am Hauptplatz 17 verkauft sie Produkte aus ihren Werkstätten. Quelle: lebenshilfe-knittelfeld.at, lebenshilfe.at, ideenreich-knittelfeld.at, meinbezirk.at.</p>'
  })
})
void lebenshilfeLinks

// ─── Venues ─────────────────────────────────────────────────────────────────
const venueFields = (lat, lon, image) => ({ latitude: lat, longitude: lon, coordinate_label: dms(lat, lon), image, hero_image: image })

const DINZL = await ensure('pp_venues', 'dinzlschloss-villach', {
  title: 'Dinzlschloss', type: 'forum', location: VILLACH, archive_number: '39', address: 'Schloßgasse 11, 9500 Villach, Austria',
  website_url: 'https://villach.at/stadt-erleben/kultur/dinzlschloss', ...venueFields(46.61615, 13.83136, files.v_dinzl),
  ...bilingual({
    image_alt: 'The Dinzlschloss from the east: a pale three-storey castle with two corner oriels, a balcony over the marble portal and bare trees',
    hero_image_alt: 'The Dinzlschloss in the Villach district of St. Martin under a blue sky with light clouds',
    image_caption: 'The Dinzlschloss from the east · Foto: Raul de Chissota (public domain)',
    coordinate_label: dms(46.61615, 13.83136),
    lede: 'Renaissance castle in the Villach district of St. Martin, seat of the city’s culture department and venue for exhibitions and readings.',
    description: 'Renaissance castle in Villach, seat of the city’s culture department, with four to six exhibitions a year.',
    about_html: '<p>The Dinzlschloss, originally called Martineck or Mörtenegg, stands at Schloßgasse 11 in St. Martin, a district of Villach. In 1550 Siegmund Khevenhüller had an estate of the Bishopric of Bamberg extended into a Renaissance castle. Else Eipek-Dinzl left it to the City of Villach, which has owned it since 1947. From 1953 it was a home for apprentices. After a renovation the culture department of the city moved in in 2007.</p><p>The castle has four to six exhibitions a year, as well as readings. The park holds sculptures by Johann Feilacher, Gerhard Leeb, Herbert Mehler, Heinz Ortner and Franz Schneeweiß. It is open Monday, Wednesday and Friday from 8 am to 12 noon, Tuesday and Thursday from 8 am to 12 noon and from 1 pm to 4 pm, and closed on Saturdays, Sundays and public holidays.</p>'
  }, {
    image_alt: 'Das Dinzlschloss von Osten: ein heller dreigeschoßiger Bau mit zwei Eckerkern, einem Balkon über dem Marmorportal und kahlen Bäumen',
    hero_image_alt: 'Das Dinzlschloss im Villacher Stadtteil St. Martin unter blauem Himmel mit leichten Wolken',
    image_caption: 'Das Dinzlschloss von Osten · Foto: Raul de Chissota (gemeinfrei)',
    coordinate_label: dms(46.61615, 13.83136),
    lede: 'Renaissanceschloss im Villacher Stadtteil St. Martin, Sitz der städtischen Kulturabteilung und Ort für Ausstellungen und Lesungen.',
    description: 'Renaissanceschloss in Villach, Sitz der städtischen Kulturabteilung, mit vier bis sechs Ausstellungen im Jahr.',
    about_html: '<p>Das Dinzlschloss, ursprünglich Martineck oder Mörtenegg genannt, steht in der Schloßgasse 11 in St. Martin, einem Stadtteil von Villach. 1550 ließ Siegmund Khevenhüller einen Gutshof des Bistums Bamberg zum Renaissanceschloss ausbauen. Else Eipek-Dinzl vermachte es der Stadt Villach, der es seit 1947 gehört. Ab 1953 war es Lehrlingsheim. Nach einer Sanierung zog 2007 die Kulturabteilung der Stadt ein.</p><p>Im Schloss finden vier bis sechs Ausstellungen im Jahr und Lesungen statt. Im Park stehen Skulpturen von Johann Feilacher, Gerhard Leeb, Herbert Mehler, Heinz Ortner und Franz Schneeweiß. Geöffnet ist Montag, Mittwoch und Freitag von 8 bis 12 Uhr, Dienstag und Donnerstag von 8 bis 12 und von 13 bis 16 Uhr, an Samstagen, Sonn- und Feiertagen geschlossen.</p>'
  })
})

const WALLNER = await ensure('pp_venues', 'wallnerhaus-kleblach-lind', {
  title: 'Wallnerhaus', type: 'forum', location: LIND, archive_number: '40', address: 'Lind im Drautal 25, 9753 Kleblach-Lind, Austria',
  website_url: 'https://www.kleblach-lind.at/', ...venueFields(46.76847, 13.35623, files.v_wall),
  ...bilingual({
    image_alt: 'The Wallnerhaus: a white two-storey late Gothic house under a dark hipped roof, with a round-arched door, against a deep blue sky',
    hero_image_alt: 'The Wallnerhaus in Lind im Drautal with the mountains of the Drava valley behind it',
    image_caption: 'The Wallnerhaus in Lind im Drautal · Foto: JJ55 (CC BY-SA 3.0)',
    coordinate_label: dms(46.76847, 13.35623),
    lede: 'Late Gothic house from around 1500 in Lind im Drautal, today the municipal office of Kleblach-Lind and a venue for exhibitions.',
    description: 'Late Gothic house in Lind im Drautal, municipal office of Kleblach-Lind and venue for exhibitions.',
    about_html: '<p>The Wallnerhaus at Lind im Drautal 25 is a listed two-storey house from around 1500, built for a mining entrepreneur (Gewerke), under a hipped roof. Its late Gothic rendered facade has survived, and the ground-floor hall and the first-floor room have net-rib vaults. In 1994 and 1995 it was converted into the municipal office of Kleblach-Lind.</p><p>Exhibitions hang in both vaulted rooms. The municipality has brought several of them to Lind with the association kultur.im.puls. They are open during office hours, Monday to Thursday from 8 am to 12 noon and from 2 pm to 4 pm, and Friday from 8 am to 1 pm.</p>'
  }, {
    image_alt: 'Das Wallnerhaus: ein weißes zweigeschoßiges spätgotisches Haus unter dunklem Walmdach, mit rundbogiger Tür, vor tiefblauem Himmel',
    hero_image_alt: 'Das Wallnerhaus in Lind im Drautal mit den Bergen des Drautals dahinter',
    image_caption: 'Das Wallnerhaus in Lind im Drautal · Foto: JJ55 (CC BY-SA 3.0)',
    coordinate_label: dms(46.76847, 13.35623),
    lede: 'Spätgotisches Haus von um 1500 in Lind im Drautal, heute Gemeindeamt von Kleblach-Lind und Ort für Ausstellungen.',
    description: 'Spätgotisches Haus in Lind im Drautal, Gemeindeamt von Kleblach-Lind und Ort für Ausstellungen.',
    about_html: '<p>Das Wallnerhaus in Lind im Drautal 25 ist ein denkmalgeschütztes zweigeschoßiges Gewerkenhaus von um 1500 unter einem Walmdach. Seine spätgotische Putzfassade ist erhalten, Erdgeschoßhalle und Raum im ersten Obergeschoß haben Netzrippengewölbe. 1994 und 1995 wurde es zum Gemeindeamt von Kleblach-Lind umgebaut.</p><p>Ausstellungen hängen in beiden gewölbten Räumen. Die Gemeinde hat mehrere davon gemeinsam mit dem Verein kultur.im.puls nach Lind gebracht. Zu sehen sind sie während der Amtsstunden, Montag bis Donnerstag von 8 bis 12 und von 14 bis 16 Uhr, Freitag von 8 bis 13 Uhr.</p>'
  })
})

const KNITTEL = await ensure('pp_venues', 'lebenshilfe-knittelfeld', {
  title: 'Lebenshilfe Knittelfeld', type: 'forum', location: KNITTELFELD, archive_number: '41', address: 'Dr.-Hans-Klöpfer-Straße 38, 8720 Knittelfeld, Austria',
  website_url: 'https://www.lebenshilfe-knittelfeld.at/', ...venueFields(47.20711, 14.82088, files.v_knit),
  websites: lebenshilfeLinks,
  ...bilingual({
    image_alt: 'View from a hill over Knittelfeld: red roofs, a church tower and green fields, with forested slopes behind',
    hero_image_alt: 'The town of Knittelfeld in the Mur valley, seen from above',
    image_caption: 'View over Knittelfeld, the seat of the Lebenshilfe · Foto: Guschi (CC BY-SA 3.0)',
    coordinate_label: dms(47.20711, 14.82088),
    lede: 'Organisation for people with intellectual disabilities in Knittelfeld, Styria, whose artists exhibit their work.',
    description: 'Organisation in Knittelfeld, Styria, for people with intellectual disabilities, whose artists exhibit their work.',
    about_html: '<p>The Lebenshilfe Region Knittelfeld has supported people with intellectual disabilities in living and working since 1982. Its workshops are at Dr.-Hans-Klöpfer-Straße 38; its shop “Ideenreich” at Hauptplatz 17 sells products made there.</p><p>In 2026 its artists worked with Helmuth “PLO” Ploschnitznigg and Adi Schmölzer on the project “Hoffnung und Frieden”. Their works hung in the Stadtgalerie Judenburg in April and in a pop-up gallery in Knittelfeld from the end of October, where the art calendar of the same name was presented.</p>'
  }, {
    image_alt: 'Blick von einem Hügel über Knittelfeld: rote Dächer, ein Kirchturm und grüne Felder, dahinter bewaldete Hänge',
    hero_image_alt: 'Die Stadt Knittelfeld im Murtal, von oben gesehen',
    image_caption: 'Blick über Knittelfeld, den Sitz der Lebenshilfe · Foto: Guschi (CC BY-SA 3.0)',
    coordinate_label: dms(47.20711, 14.82088),
    lede: 'Einrichtung für Menschen mit intellektuellen Behinderungen in Knittelfeld, Steiermark, deren Künstler:innen ihre Arbeiten ausstellen.',
    description: 'Einrichtung in Knittelfeld, Steiermark, für Menschen mit intellektuellen Behinderungen, deren Künstler:innen ihre Arbeiten ausstellen.',
    about_html: '<p>Die Lebenshilfe Region Knittelfeld begleitet seit 1982 Menschen mit intellektuellen Behinderungen beim Wohnen und Arbeiten. Ihre Werkstätten sind in der Dr.-Hans-Klöpfer-Straße 38; das Geschäft „Ideenreich“ am Hauptplatz 17 verkauft Produkte von dort.</p><p>2026 arbeiteten ihre Künstler:innen mit Helmuth „PLO“ Ploschnitznigg und Adi Schmölzer am Projekt „Hoffnung und Frieden“. Die Arbeiten hingen im April in der Stadtgalerie Judenburg und ab Ende Oktober in einer Pop-up-Galerie in Knittelfeld, wo der gleichnamige Kunstkalender vorgestellt wurde.</p>'
  })
})

// Galerie Freihausgasse exists as a draft (archive number 15): complete it. Stays a draft.
const FREIHAUS = await bySlug('pp_venues', 'galerie-freihausgasse-villach')
{
  const lat = 46.61328; const lon = 13.84761
  const en = {
    image_alt: 'The Freihausgasse in the centre of Villach: shops, parked bicycles and a one-way sign, with a church tower and mountains at the end of the street',
    hero_image_alt: 'The Freihausgasse in Villach with the tower of the parish church under a cloudy blue sky',
    image_caption: 'The Freihausgasse, Villach · Foto: Johann Jaritz (CC BY-SA 4.0)',
    coordinate_label: dms(lat, lon),
    lede: 'Gallery of the City of Villach in the Freihausgasse, with changing exhibitions of Austrian and international art since 1993.',
    description: 'Gallery of the City of Villach with changing exhibitions of Austrian and international art and a programme for children and adults.',
    about_html: '<p>The Galerie Freihausgasse is the gallery of the City of Villach in the town centre. It opened in 1993 and has changing exhibitions of contemporary Austrian and international art, six of them in 2025, with guided tours and workshops for children, young people and adults. Claudia Schauß directs it.</p><p>It is open Wednesday to Friday from 9 am to 1 pm and from 2 pm to 6 pm and Saturday from 9 am to 3 pm, and closed on Sundays and public holidays.</p>'
  }
  const de = {
    image_alt: 'Die Freihausgasse im Zentrum von Villach: Geschäfte, abgestellte Fahrräder und ein Einfahrt-verboten-Schild, am Ende der Straße ein Kirchturm und Berge',
    hero_image_alt: 'Die Freihausgasse in Villach mit dem Turm der Stadtpfarrkirche unter blauem Himmel mit Wolken',
    image_caption: 'Die Freihausgasse, Villach · Foto: Johann Jaritz (CC BY-SA 4.0)',
    coordinate_label: dms(lat, lon),
    lede: 'Galerie der Stadt Villach in der Freihausgasse, seit 1993 mit wechselnden Ausstellungen österreichischer und internationaler Kunst.',
    description: 'Galerie der Stadt Villach mit wechselnden Ausstellungen österreichischer und internationaler Kunst und einem Programm für Kinder und Erwachsene.',
    about_html: '<p>Die Galerie Freihausgasse ist die Galerie der Stadt Villach im Stadtzentrum. Sie wurde 1993 eröffnet und zeigt wechselnde Ausstellungen zeitgenössischer österreichischer und internationaler Kunst, 2025 waren es sechs, dazu Führungen und Workshops für Kinder, Jugendliche und Erwachsene. Die Leitung hat Claudia Schauß.</p><p>Geöffnet ist Mittwoch bis Freitag von 9 bis 13 und von 14 bis 18 Uhr und Samstag von 9 bis 15 Uhr, an Sonn- und Feiertagen geschlossen.</p>'
  }
  await api('PATCH', `/items/pp_venues/${FREIHAUS}`, {
    address: 'Freihausgasse, 9500 Villach, Austria', ...venueFields(lat, lon, files.v_frei), ...en,
    translations: { create: [], update: [{ id: 29, ...en }, { id: 30, ...de }], delete: [] }
  })
  console.log('~ pp_venues/galerie-freihausgasse-villach')
}

// Who runs or uses the venue.
const relation = async (organisation, venue, kind) => {
  const found = await api('GET', `/items/pp_organisation_venue_relations?filter[organisation][_eq]=${organisation}&filter[venue][_eq]=${venue}&fields=id&limit=1`)
  if (!found.length) await api('POST', '/items/pp_organisation_venue_relations', { organisation, venue, relation: kind })
}
await relation(LEBENSHILFE, KNITTEL, 'runs')
await relation(POSTWERK, DINZL, 'exhibits_at')
await relation('0a004d03-d556-4f92-bfca-e9a79ad5e2de', WALLNER, 'exhibits_at') // kultur.im.puls

// ─── Persons ────────────────────────────────────────────────────────────────
const person = async (slug, first_name, last_name, { born = null, en = {}, de = {}, roles = [ARTIST], site = [], image = null, ...rest }) => {
  const websites = await linkRows(site)
  return ensure('pp_persons', slug, {
    first_name, last_name, born, image, roles: roles.map((roles_id) => ({ roles_id })), websites, ...rest,
    ...bilingual(en, de)
  })
}
const web = (host) => [`https://${host}`, host.replace(/^www\./, ''), 'website']
const text = (based_inEn, based_inDe, ledeEn, ledeDe, aboutEn, aboutDe, extraEn = {}, extraDe = {}) => [
  { based_in: based_inEn, lede: ledeEn, about_html: aboutEn && `<p>${aboutEn}</p>`, ...extraEn },
  { based_in: based_inDe, lede: ledeDe, about_html: aboutDe && `<p>${aboutDe}</p>`, ...extraDe }
]

const P = {}
{
  let [en, de] = text('Roitham am Traunfall', 'Roitham am Traunfall', 'Visual artist in Roitham am Traunfall, Upper Austria.', 'Bildende Künstlerin in Roitham am Traunfall, Oberösterreich.',
    'Katharina Acht was born in 1982 in Gmunden and grew up in Ohlsdorf. She completed a graphic design school in 2001 and finished studying fine arts and experimental design at the University of Art and Design Linz in 2006. She led the Linz art association Die Kunstschaffenden from 2015 to 2021 and has looked after the nextcomic festival in Linz since 2018. She has lived and worked in Roitham am Traunfall since 2023. Source: postwerk.at, katharinaacht.at.',
    'Katharina Acht wurde 1982 in Gmunden geboren und wuchs in Ohlsdorf auf. Sie schloss 2001 die HTL für Grafikdesign ab und beendete 2006 das Studium der Bildenden Künste / Experimentellen Gestaltung an der Kunstuniversität Linz. Von 2015 bis 2021 leitete sie den Linzer Kunstverein Die Kunstschaffenden und betreut seit 2018 das nextcomic-Festival in Linz. Seit 2023 lebt und arbeitet sie in Roitham am Traunfall. Quelle: postwerk.at, katharinaacht.at.')
  P.acht = await person('katharina-acht', 'Katharina', 'Acht', { born: '1982, Gmunden', en, de, site: [web('www.katharinaacht.at')] })

  ;[en, de] = text('Velden am Wörthersee', 'Velden am Wörthersee', 'Multimedia artist and cultural worker in Velden am Wörthersee, chair of the art association postWERK.', 'Multimediakünstlerin und Kulturarbeiterin in Velden am Wörthersee, Obfrau des Kunstvereins postWERK.',
    'Barbara Ambrusch-Rapp was born in 1972 in Klagenfurt and works as a freelance multimedia artist, cultural worker and curator in Velden am Wörthersee. She takes part in exhibitions, performance, theatre, fashion art and projects in public space, and gives creative workshops. She chairs the art association postWERK and received the Kultur-Ehrenzeichen of the City of Villach in 2026. Source: postwerk.at, barbara-rapp.com.',
    'Barbara Ambrusch-Rapp wurde 1972 in Klagenfurt geboren und arbeitet als freischaffende Multimediakünstlerin, Kulturarbeiterin und Kuratorin in Velden am Wörthersee. Sie ist in Ausstellungen, Performance, Theater, Fashion-Art und im öffentlichen Raum präsent und leitet Kreativ-Workshops. Sie ist Obfrau des Kunstvereins postWERK und erhielt 2026 das Kultur-Ehrenzeichen der Stadt Villach. Quelle: postwerk.at, barbara-rapp.com.')
  P.ambrusch = await person('barbara-ambrusch-rapp', 'Barbara', 'Ambrusch-Rapp', { born: '1972, Klagenfurt', en, de, roles: [ARTIST, CURATOR], site: [web('www.barbara-rapp.com')] })

  ;[en, de] = text('Carinthia and Vienna', 'Kärnten und Wien', 'Visual artist in painting, sculpture, installation and photography, lives in Carinthia and Vienna.', 'Bildender Künstler in Malerei, Skulptur, Installation und Fotografie, lebt in Kärnten und Wien.',
    'Ernst Bachinger was born in Munich and lives and works in Carinthia and Vienna. He studied business administration and worked as an advertising consultant, copywriter and creative director before becoming a freelance artist. He works in painting, sculpture, installation and photography and has exhibited in Vienna, Villach, Venice, New York, Klagenfurt, Santa Monica and Ljubljana. He has been a member of postWERK since 2022. Source: postwerk.at, ernstbachinger.com.',
    'Ernst Bachinger wurde in München geboren und lebt und arbeitet in Kärnten und Wien. Er studierte Betriebswirtschaft und war als Werbeberater, Texter und Creative Director tätig, bevor er freischaffender Künstler wurde. Er arbeitet in Malerei, Skulptur, Installation und Fotografie und stellte in Wien, Villach, Venedig, New York, Klagenfurt, Santa Monica und Ljubljana aus. Seit 2022 ist er Mitglied bei postWERK. Quelle: postwerk.at, ernstbachinger.com.')
  P.bachinger = await person('ernst-bachinger', 'Ernst', 'Bachinger', { born: 'Munich', en, de, site: [web('ernstbachinger.com')] })

  ;[en, de] = text('Wuppertal, Germany', 'Wuppertal, Deutschland', 'Visual artist in Wuppertal, Germany, with his own art space.', 'Bildender Künstler in Wuppertal mit eigenem Kunstraum.',
    'Fabian Freese was born in 1982 in Wuppertal-Elberfeld. He studied fine art at the Freie Akademie der Bildenden Künste from 2006 and graduated in 2011. His work has been on view in Europe, North and South America, Asia and Australia, including solo exhibitions in New York and Sydney. He works with everyday objects and long-exposure light paintings and runs the Fabian Freese artspace in Wuppertal. Source: postwerk.at, ffartspace.com.',
    'Fabian Freese wurde 1982 in Wuppertal-Elberfeld geboren. Er studierte ab 2006 Freie Kunst an der Freien Akademie der Bildenden Künste und schloss 2011 ab. Seine Arbeiten wurden in Europa, Nord- und Südamerika, Asien und Australien gezeigt, darunter Einzelausstellungen in New York und Sydney. Er arbeitet mit Alltagsobjekten und Lightpaintings und betreibt den Fabian Freese artspace in Wuppertal. Quelle: postwerk.at, ffartspace.com.')
  P.freese = await person('fabian-freese', 'Fabian', 'Freese', { born: '1982, Wuppertal-Elberfeld', en, de, site: [web('www.ffartspace.com')] })

  ;[en, de] = text('Villach', 'Villach', 'Painter in Villach, Carinthia.', 'Maler in Villach, Kärnten.',
    'Arnold Kreuter was born in 1950 in Villach and lives and works there. He has painted since 1976 and attended art seminars with Franz Schneeweiß, August Svoboda and others. He worked first in pastel chalk and watercolour and now mainly in acrylic and mixed techniques. He received the Kultur-Ehrenzeichen of the City of Villach in 2018 and 2021. Source: postwerk.at.',
    'Arnold Kreuter wurde 1950 in Villach geboren und lebt und arbeitet dort. Er malt seit 1976 und besuchte Kunstseminare unter anderem bei Franz Schneeweiß und August Svoboda. Zuerst arbeitete er mit Pastellkreide und Aquarell, heute vorwiegend mit Acryl und Mischtechniken. 2018 und 2021 erhielt er das Kultur-Ehrenzeichen der Stadt Villach. Quelle: postwerk.at.')
  P.kreuter = await person('arnold-kreuter', 'Arnold', 'Kreuter', { born: '1950, Villach', en, de })

  ;[en, de] = text('Hermagor', 'Hermagor', 'Painter in Hermagor, Carinthia.', 'Malerin in Hermagor, Kärnten.',
    'Inge Lasser lives and works in Hermagor. She trained with Giselbert Hoke, Elvira Bach and Markus Lüpertz at the art academy in Bad Reichenhall. She joined postWERK in 2013 and is its secretary. She has exhibited in Austria, Germany, Italy and France, including the Galerie Offenes Atelier D.U.Design in Villach and the Kunstbahnhof Wörthersee in Velden. Source: postwerk.at.',
    'Inge Lasser lebt und arbeitet in Hermagor. Sie wurde bei Giselbert Hoke, Elvira Bach und Markus Lüpertz an der Kunstakademie Bad Reichenhall ausgebildet. 2013 wurde sie in den Kunstverein postWERK aufgenommen und ist dort Schriftführerin. Sie stellte in Österreich, Deutschland, Italien und Frankreich aus, darunter in der Galerie Offenes Atelier D.U.Design in Villach und im Kunstbahnhof Wörthersee in Velden. Quelle: postwerk.at.')
  P.lasser = await person('inge-lasser', 'Inge', 'Lasser', { en, de })

  ;[en, de] = text('Gödersdorf', 'Gödersdorf', 'Artist, author and performer in Gödersdorf, Carinthia.', 'Künstlerin, Autorin und Performerin in Gödersdorf, Kärnten.',
    'Anita Wiegele was born in 1964 in Villach and works as a freelance artist, author and performer in Gödersdorf. She graduated from the Freie Akademie der Bildenden Künste and Literatur-Kärnten and illustrates book projects. She published the books “Kopfverklebung – ein Prozess” (2016) and “Wolkenköpfe” (2017). She received the Kultur-Ehrenzeichen of the City of Villach in 2021. Source: postwerk.at, anitawiegele.at.',
    'Anita Wiegele wurde 1964 in Villach geboren und arbeitet als freischaffende Künstlerin, Autorin und Performerin in Gödersdorf. Sie schloss die Freie Akademie der Bildenden Künste und Literatur-Kärnten ab und illustriert Buchprojekte. Sie veröffentlichte die Bücher „Kopfverklebung – ein Prozess“ (2016) und „Wolkenköpfe“ (2017). 2021 erhielt sie das Kultur-Ehrenzeichen der Stadt Villach. Quelle: postwerk.at, anitawiegele.at.',
    { image_alt: 'Anita Wiegele at work', image_caption: 'Anita Wiegele · Photo: Marta Gillner' },
    { image_alt: 'Anita Wiegele bei der Arbeit', image_caption: 'Anita Wiegele · Foto: Marta Gillner' })
  P.anita = await person('anita-wiegele', 'Anita', 'Wiegele', { born: '1964, Villach', en, de, image: files.p_anita, site: [web('anitawiegele.at')] })

  ;[en, de] = text(null, null, 'Painter from Radendorf, Carinthia (1937–2020).', 'Malerin aus Radendorf, Kärnten (1937–2020).',
    'Christl Wiegele was born in 1937 in Töbring near Treffen and died in September 2020. She lived in Radendorf. Her father was the Villach painter LUWALL (Ludwig Wallner). From 1995 she took lessons with Sigi Braun, Heribert Mader, Inge Peischl, Bernhard Vogel and Wolfgang Wiesinger. She joined postWERK in 2014 and had solo exhibitions in Afritz, Albeck, Finkenstein, Arnoldstein and Villach. Source: postwerk.at.',
    'Christl Wiegele wurde 1937 in Töbring bei Treffen geboren und starb im September 2020. Sie lebte in Radendorf. Ihr Vater war der Villacher Maler LUWALL (Ludwig Wallner). Ab 1995 nahm sie Unterricht bei Sigi Braun, Heribert Mader, Inge Peischl, Bernhard Vogel und Wolfgang Wiesinger. 2014 wurde sie in postWERK aufgenommen und hatte Einzelausstellungen in Afritz, Albeck, Finkenstein, Arnoldstein und Villach. Quelle: postwerk.at.')
  P.christl = await person('christl-wiegele', 'Christl', 'Wiegele', { born: '1937, Töbring bei Treffen', en, de })

  ;[en, de] = text('Vienna', 'Wien', 'Textile artist, born in Ljubljana, active in Vienna.', 'Textilkünstlerin, geboren in Ljubljana, tätig in Wien.',
    'Marjeta Angerer-Guggenberger is a textile artist, born in 1963 in Ljubljana and active in Vienna. At the vernissage of the exhibition “FRAGIL” at the Dinzlschloss in 2026 she performed the reading “Häutungen” with Karin Prucha. Source: d-nb.info, postwerk.at.',
    'Marjeta Angerer-Guggenberger ist Textilkünstlerin, 1963 in Ljubljana geboren und in Wien tätig. Bei der Vernissage der Ausstellung „FRAGIL“ im Dinzlschloss 2026 trug sie gemeinsam mit Karin Prucha die Lesung „Häutungen“ vor. Quelle: d-nb.info, postwerk.at.')
  P.angerer = await person('marjeta-angerer-guggenberger', 'Marjeta', 'Angerer-Guggenberger', { born: '1963, Ljubljana', en, de })

  ;[en, de] = text(null, null, 'Austrian artist and Feldenkrais practitioner working in performance, installation and sound.', 'Österreichische Künstlerin und Feldenkrais-Praktikerin in Performance, Installation und Klang.',
    'Christina Clar is an Austrian artist who studied fine art in Paris and London. Her work ranges between performance, events, installations, urban interventions and computer-based applications, with sound and image. She took part in opera productions at the Salzburg Festival with Peter Sellars and in projects for Steirischer Herbst, Museum am Bach and the university culture centre Unikum. She also works as a Feldenkrais practitioner. Source: postwerk.at, christinaclar.net.',
    'Christina Clar ist eine österreichische Künstlerin und studierte bildende Kunst in Paris und London. Ihre Arbeit bewegt sich zwischen Performance, Events, Installationen, urbanen Interventionen und computergestützten Anwendungen, mit Klang und Bild. Sie wirkte an Opernproduktionen bei den Salzburger Festspielen mit Peter Sellars mit sowie an Arbeiten für den Steirischen Herbst, das Museum am Bach und das Universitätskulturzentrum Unikum. Sie arbeitet auch als Feldenkrais-Practitioner. Quelle: postwerk.at, christinaclar.net.',
    { image_alt: 'Portrait of Christina Clar', image_caption: 'Christina Clar · Photo: Karlheinz Fessl' },
    { image_alt: 'Porträt von Christina Clar', image_caption: 'Christina Clar · Foto: Karlheinz Fessl' })
  P.clar = await person('christina-clar', 'Christina', 'Clar', { born: 'Bruck an der Mur', en, de, image: files.p_clar, site: [web('christinaclar.net')] })

  ;[en, de] = text('Vienna', 'Wien', 'Trombonist, composer and arranger in Vienna, born in the USA.', 'In den USA geborener Posaunist, Komponist und Arrangeur in Wien.',
    'Phil Yaeger was born in Northern Maine and plays trombone. He received a bachelor’s degree in jazz performance from William Paterson University in 1999 and moved to Austria in 2004, where he took a master’s degree at the University of Music and Performing Arts Graz. He lives in Vienna and works as a trombonist, composer and arranger. He is trombonist and house composer of the Jazzorchester Vorarlberg and released the album “Hunter” on Jazzwerkstatt Records. Source: pyaeger.com, postwerk.at.',
    'Phil Yaeger wurde im Norden von Maine geboren und spielt Posaune. 1999 schloss er ein Bachelorstudium in Jazz-Performance an der William Paterson University ab und zog 2004 nach Österreich, wo er an der Kunstuniversität Graz den Master machte. Er lebt in Wien und arbeitet als Posaunist, Komponist und Arrangeur. Er ist Posaunist und Hauskomponist des Jazzorchesters Vorarlberg und veröffentlichte das Album „Hunter“ bei Jazzwerkstatt Records. Quelle: pyaeger.com, postwerk.at.',
    { image_alt: 'Portrait of Phil Yaeger', image_caption: 'Phil Yaeger · Photo: Severin Koller' },
    { image_alt: 'Porträt von Phil Yaeger', image_caption: 'Phil Yaeger · Foto: Severin Koller' })
  P.yaeger = await person('phil-yaeger', 'Phil', 'Yaeger', { born: 'Northern Maine, USA', en, de, image: files.p_yaeger, site: [web('www.pyaeger.com')] })

  ;[en, de] = text('Carinthia and Slovenia', 'Kärnten und Slowenien', 'Slovenian sculptor, lives and works in Carinthia and Slovenia.', 'Slowenischer Bildhauer, lebt und arbeitet in Kärnten und Slowenien.',
    'Jure Markota was born in 1985 in Slovenj Gradec, Slovenia. He studied sculpture at the Academy of Fine Arts and Design in Ljubljana from 2004. Besides sculpture he works in painting, graphic design, architecture and new media. He lives and works in Carinthia and Slovenia. In October 2024 the Kunstbahnhof Wörthersee in Velden had his exhibition “Impuls und Synergie”. Source: meinbezirk.at, postwerk.at.',
    'Jure Markota wurde 1985 in Slovenj Gradec in Slowenien geboren. Ab 2004 studierte er Bildhauerei an der Akademie der bildenden Künste und Design in Ljubljana. Neben der Bildhauerei arbeitet er in Malerei, Grafikdesign, Architektur und neuen Medien. Er lebt und arbeitet in Kärnten und Slowenien. Im Oktober 2024 zeigte der Kunstbahnhof Wörthersee in Velden seine Ausstellung „Impuls und Synergie“. Quelle: meinbezirk.at, postwerk.at.')
  P.markota = await person('jure-markota', 'Jure', 'Markota', { born: '1985, Slovenj Gradec', en, de })

  ;[en, de] = text(null, null, 'Guest artist of the exhibition “FRAGIL” at the Dinzlschloss, Villach, in 2026.', 'Gast der Ausstellung „FRAGIL“ im Dinzlschloss, Villach, 2026.', null, null)
  P.mira = await person('mana-mira', 'Mana', 'Mira', { en, de })

  ;[en, de] = text('Berlin and Villach', 'Berlin und Villach', 'Artist in woodcut, stained glass and embroidered cloths, with studios in Berlin and Villach.', 'Künstlerin für Holzschnitt, Kirchenfenster und bestickte Tücher, mit Ateliers in Berlin und Villach.',
    'Lisa Huber was born in Villach. She studied sculpture in Graz with Josef Pillhofer and painting at the University of Applied Arts Vienna, where she was a master student of Adolf Frohner. She held a DAAD scholarship in Berlin-Weißensee and was a guest student of Georg Baselitz in Berlin. Since 2007 she has worked on the Psalms in the Buber/Rosenzweig translation in woodcuts, paper cuts, church windows and embroidered cloths, including a Lenten veil for Admont Abbey. She received the Kulturpreis of the City of Villach in 2017. Source: villach.at, lisahuber.de.',
    'Lisa Huber wurde in Villach geboren. Sie studierte Bildhauerei in Graz bei Josef Pillhofer und Malerei an der Universität für angewandte Kunst Wien, wo sie Meisterschülerin von Adolf Frohner war. Sie hatte ein DAAD-Stipendium in Berlin-Weißensee und war Gastschülerin von Georg Baselitz in Berlin. Seit 2007 arbeitet sie zu den Psalmen in der Übersetzung von Buber/Rosenzweig in Holz- und Papierschnitten, Kirchenfenstern und bestickten Tüchern, darunter ein Fastentuch für das Stift Admont. 2017 erhielt sie den Kulturpreis der Stadt Villach. Quelle: villach.at, lisahuber.de.')
  P.huber = await person('lisa-huber', 'Lisa', 'Huber', { born: 'Villach', en, de, site: [web('lisahuber.de'), ['https://www.instagram.com/lisa_huber_art_/', 'Instagram', 'social']] })

  ;[en, de] = text('Berlin', 'Berlin', 'Photographer of museum collections in Berlin, working as a duo with Volker Weinhold.', 'Sammlungsfotograf in Berlin, arbeitet im Duo mit Volker Weinhold.',
    'Sebastian Köpcke lives and works in Berlin as a photographer, designer and exhibition maker together with Volker Weinhold. The two photograph museum collections in staged still lifes and have exhibited in museums in Germany, Austria, Switzerland, Russia and the Netherlands. They met Lisa Huber as exhibiting artists at the Benedictine Abbey of Admont. Source: sammlungsfotografen.de, villach.at.',
    'Sebastian Köpcke lebt und arbeitet in Berlin als Fotograf, Gestalter und Ausstellungsmacher gemeinsam mit Volker Weinhold. Die beiden fotografieren museale Sammlungen in inszenierten Stillleben und stellten in Museen in Deutschland, Österreich, der Schweiz, Russland und den Niederlanden aus. Lisa Huber trafen sie als ausstellende Künstler im Benediktinerstift Admont. Quelle: sammlungsfotografen.de, villach.at.')
  P.koepcke = await person('sebastian-koepcke', 'Sebastian', 'Köpcke', { en, de, site: [web('sammlungsfotografen.de')] })

  ;[en, de] = text('Berlin', 'Berlin', 'Photographer of museum collections in Berlin, working as a duo with Sebastian Köpcke.', 'Sammlungsfotograf in Berlin, arbeitet im Duo mit Sebastian Köpcke.',
    'Volker Weinhold lives and works in Berlin as a photographer, designer and exhibition maker together with Sebastian Köpcke. The two have worked for more than two decades on historical topics in museum collections, photographed as staged still lifes. Their exhibitions have been on view in museums in Germany, Austria, Switzerland, Russia and the Netherlands. Source: sammlungsfotografen.de, villach.at.',
    'Volker Weinhold lebt und arbeitet in Berlin als Fotograf, Gestalter und Ausstellungsmacher gemeinsam mit Sebastian Köpcke. Die beiden beschäftigen sich seit mehr als zwei Jahrzehnten mit historischen Themen in Museumssammlungen, die sie als inszenierte Stillleben fotografieren. Ihre Ausstellungen wurden in Museen in Deutschland, Österreich, der Schweiz, Russland und den Niederlanden gezeigt. Quelle: sammlungsfotografen.de, villach.at.')
  P.weinhold = await person('volker-weinhold', 'Volker', 'Weinhold', { en, de, site: [web('sammlungsfotografen.de')] })

  ;[en, de] = text('Judenburg', 'Judenburg', 'Artist and art teacher in Judenburg, Styria, known as PLO.', 'Künstler und Kunsterzieher in Judenburg, Steiermark, genannt PLO.',
    'Helmuth Ploschnitznigg, known as PLO, is an artist and art teacher in Judenburg, Styria. He founded the care facility Simultania for people with disabilities. In 2026 the Stadtgalerie Judenburg had the exhibition “Hoffnung & Frieden – Ein Signal der Hoffnung” on his idea, with 14 artists. For this project he worked on 24 March 2026 with Adi Schmölzer and artists of the Lebenshilfe Knittelfeld and the Spielberg middle school, and with them he made the art calendar “Hoffnung und Frieden”. Source: murtalinfo.at, lebenshilfe-knittelfeld.at, meinbezirk.at.',
    'Helmuth Ploschnitznigg, genannt PLO, ist Künstler und Kunsterzieher in Judenburg in der Steiermark. Er gründete die Betreuungseinrichtung Simultania für Menschen mit Behinderung. 2026 zeigte die Stadtgalerie Judenburg auf seine Idee die Ausstellung „Hoffnung & Frieden – Ein Signal der Hoffnung“ mit 14 Kunstschaffenden. Für dieses Projekt arbeitete er am 24. März 2026 mit Adi Schmölzer und Künstler:innen der Lebenshilfe Knittelfeld und der MS Spielberg, und mit ihnen entstand der Kunstkalender „Hoffnung und Frieden“. Quelle: murtalinfo.at, lebenshilfe-knittelfeld.at, meinbezirk.at.')
  P.plo = await person('helmuth-ploschnitznigg', 'Helmuth', 'Ploschnitznigg', { en, de })

  ;[en, de] = text('Knittelfeld', 'Knittelfeld', 'Artists with and without disabilities of the Lebenshilfe Region Knittelfeld.', 'Künstler:innen mit und ohne Behinderung der Lebenshilfe Region Knittelfeld.',
    'Artists of the Lebenshilfe Region Knittelfeld, with and without disabilities, worked on the project “Hoffnung und Frieden” in 2026. On 24 March 2026 they made a carpet and pictures in their workshop with pupils of the Spielberg middle school, Helmuth Ploschnitznigg and Adi Schmölzer. The sources do not name the artists one by one. Source: lebenshilfe-knittelfeld.at, meinbezirk.at.',
    'Künstler:innen der Lebenshilfe Region Knittelfeld, mit und ohne Behinderung, arbeiteten 2026 am Projekt „Hoffnung und Frieden“. Am 24. März 2026 gestalteten sie in ihrer Werkstatt mit der MS Spielberg, Helmuth Ploschnitznigg und Adi Schmölzer einen Teppich und Bilder. Die Quellen nennen die Künstler:innen nicht einzeln. Quelle: lebenshilfe-knittelfeld.at, meinbezirk.at.')
  P.collective = await person('kuenstlerinnen-und-kuenstler-der-lebenshilfe-knittelfeld', '', '', { en, de, is_collective: true, display_name: 'Künstlerinnen und Künstler der Lebenshilfe Region Knittelfeld' })
}
const RAPETTI = await bySlug('pp_persons', 'marlies-rapetti')
const FISCHER = await bySlug('pp_persons', 'gernot-fischer-kondratovitch')
const SCHMOELZER = await bySlug('pp_persons', 'adi-schmoelzer')

// Wolfgang Daborer exists and is published with empty fields: fill them from the 2026 flyer (goes live).
const DABORER = await bySlug('pp_persons', 'wolfgang-daborer')
{
  const current = await api('GET', `/items/pp_persons/${DABORER}?fields=lede,translations.id,translations.languages_code,websites`)
  if (!current.lede) {
    const en = { based_in: 'Spittal an der Drau', lede: 'Graphic designer, illustrator and visual artist, lives and works in Spittal an der Drau.', about_html: '<p>Wolfgang Daborer lives and works in Spittal an der Drau as a freelance graphic designer, illustrator and visual artist. He studied at the Graphische in Vienna, painting with Wilhelm Drach, and has taken part in exhibitions in Austria, Germany, Italy and Slovenia since 1988. In 2009 he founded the art association kultur.im.puls in Seeboden, and in 2021 he helped start the art lending library artothek-impuls. He is a member of the Kunstverein Kärnten. Source: Wallnerhaus flyer 2026, daborer.at.</p>' }
    const de = { based_in: 'Spittal an der Drau', lede: 'Grafik-Designer, Illustrator und bildender Künstler, lebt und arbeitet in Spittal an der Drau.', about_html: '<p>Wolfgang Daborer lebt und arbeitet in Spittal an der Drau als freischaffender Grafik-Designer, Illustrator und bildender Künstler. Er studierte an der Graphischen in Wien, Malerei bei Wilhelm Drach, und ist seit 1988 an Ausstellungen in Österreich, Deutschland, Italien und Slowenien beteiligt. 2009 begründete er den Kultur- und Kunstverein kultur.im.puls in Seeboden, 2021 war er Mitinitiator der Artothek Impuls. Er ist Mitglied im Kunstverein Kärnten. Quelle: Flyer Wallnerhaus 2026, daborer.at.</p>' }
    const find = (code) => current.translations.find((row) => row.languages_code === code)
    const update = []; const create = []
    for (const [code, body] of [['en', en], ['de', de]]) find(code) ? update.push({ id: find(code).id, ...body }) : create.push({ languages_code: code, ...body })
    await api('PATCH', `/items/pp_persons/${DABORER}`, { ...en, translations: { create, update, delete: [] }, websites: await linkRows([web('daborer.at')]) })
    console.log('~ pp_persons/wolfgang-daborer')
  }
}

// ─── Exhibitions ────────────────────────────────────────────────────────────
const rows = (list) => list.map(([person, role = ARTIST], index) => ({ person, role, sort: index }))
const organiser = async (exhibition, organisation, role) => {
  const found = await api('GET', `/items/pp_exhibition_organisers?filter[exhibition][_eq]=${exhibition}&filter[organisation][_eq]=${organisation}&fields=id&limit=1`)
  if (!found.length) await api('POST', '/items/pp_exhibition_organisers', { exhibition, organisation, role })
}
const exhibition = async (slug, base, en, de, people, site = []) => {
  const websites = await linkRows(site)
  return ensure('pp_exhibitions', slug, { kind: 'exhibition', tour_status: 'unavailable', ...base, participations: rows(people), websites, ...bilingual(en, de) })
}
const HOURS_DINZL = ['Monday, Wednesday, Friday, 8:00–12:00 · Tuesday, Thursday, 8:00–12:00 and 13:00–16:00 · closed on Saturdays, Sundays and public holidays', 'Montag, Mittwoch, Freitag, 8:00–12:00 Uhr · Dienstag, Donnerstag, 8:00–12:00 und 13:00–16:00 Uhr · an Samstagen, Sonn- und Feiertagen geschlossen']
const HOURS_FREI = ['Wednesday–Friday, 9:00–13:00 and 14:00–18:00 · Saturday, 9:00–15:00 · closed on Sundays and public holidays', 'Mittwoch–Freitag, 9:00–13:00 und 14:00–18:00 Uhr · Samstag, 9:00–15:00 Uhr · an Sonn- und Feiertagen geschlossen']

const FRAGIL = await exhibition('fragil', { primary_venue: DINZL, start_date: '2026-09-09', end_date: '2026-10-29', image: files.e_fragil }, {
  title: 'FRAGIL', date_range: '9 September–29 October 2026', opening_hours: HOURS_DINZL[0], vernissage: 'Tuesday, 8 September 2026, 19:00', medium: 'Painting, photography, installation, literature and performance',
  image_alt: 'Work by Marlies Liekfeld-Rapetti: a beige, densely gathered textile form above a branch, a thin net hanging below it on a white wall (© Marlies Liekfeld-Rapetti)',
  summary: 'Annual exhibition of the art association postWERK on fragility, with artists from Austria, Germany, Slovenia and Iran, part of the Triennale IV Kärnten 2026.',
  description: 'The Kunstverein postWERK devotes its annual exhibition at the Dinzlschloss to fragility, within the theme “schwach • šibko • debole” of the Triennale IV Kärnten 2026. Members and guest artists from Austria, Germany, Slovenia and Iran show painting, photography, installation, literature and performance. According to the organiser the exhibition treats tenderness as a state of attention, not of weakness. The works deal with vulnerability in material and in people, with fragile ecosystems and with a shared future. On the ORF Long Night of Museums on 3 October 2026, Christina Clar and Phil Yaeger performed “Wieso wir uns wiegen”. Source: villach.at, postwerk.at, langenacht.orf.at'
}, {
  title: 'FRAGIL', date_range: '9. September–29. Oktober 2026', opening_hours: HOURS_DINZL[1], vernissage: 'Dienstag, 8. September 2026, 19:00 Uhr', medium: 'Malerei, Fotografie, Installation, Literatur und Performance',
  image_alt: 'Arbeit von Marlies Liekfeld-Rapetti: eine beige, dicht gefasste textile Form über einem Ast, darunter ein dünnes Netz an einer weißen Wand (© Marlies Liekfeld-Rapetti)',
  summary: 'Jahresausstellung des Kunstvereins postWERK zum Zerbrechlichen, mit Künstler:innen aus Österreich, Deutschland, Slowenien und dem Iran, Beitrag zur Triennale IV Kärnten 2026.',
  description: 'Der Kunstverein postWERK widmet seine Jahresausstellung im Dinzlschloss dem Zerbrechlichen, im Rahmen des Themas „schwach • šibko • debole“ der Triennale IV Kärnten 2026. Mitglieder und Gastkünstler:innen aus Österreich, Deutschland, Slowenien und dem Iran zeigen Malerei, Fotografie, Installation, Literatur und Performance. Laut Veranstalter versteht die Ausstellung das Zarte als Zustand der Aufmerksamkeit, nicht der Schwäche. Die Arbeiten behandeln Verletzlichkeit im Material und im Menschen, fragile Ökosysteme und eine gemeinsame Zukunft. Bei der ORF-Langen Nacht der Museen am 3. Oktober 2026 zeigten Christina Clar und Phil Yaeger die Performance „Wieso wir uns wiegen“. Quelle: villach.at, postwerk.at, langenacht.orf.at'
}, [[P.ambrusch, CURATOR], [P.acht], [P.ambrusch], [P.bachinger], [P.freese], [P.kreuter], [P.lasser], [RAPETTI], [P.anita], [P.christl], [P.angerer], [P.clar], [P.markota], [P.mira], [P.yaeger]],
[['https://postwerk.at/2026/09/02/fragil-jahresausstellung-2026/', 'Exhibition page at postwerk.at', 'exhibition_page', 'Ausstellungsseite auf postwerk.at']])
await organiser(FRAGIL, POSTWERK, 'organiser')

await exhibition('homestory', { primary_venue: FREIHAUS, start_date: '2026-09-11', end_date: '2026-10-31', image: files.e_homestory }, {
  title: 'HOMESTORY', date_range: '11 September–31 October 2026', opening_hours: HOURS_FREI[0], vernissage: 'Thursday, 10 September 2026, 19:00', medium: 'Photography and colour woodcut',
  image_alt: 'Still life on black: white porcelain stags and hounds with wood-carving tools laid across them (© Sebastian Köpcke | Volker Weinhold)',
  summary: 'A photographic essay by Sebastian Köpcke and Volker Weinhold on the artist Lisa Huber, next to her colour woodcuts, part of the Triennale IV Kärnten 2026.',
  description: 'The photographers Sebastian Köpcke and Volker Weinhold portray the artist Lisa Huber, born in Villach, in a photographic essay. They met as exhibiting artists at Admont Abbey and then photographed in her Berlin studio and in her workshop in the Haus der künstlerischen Begegnung in Villach. Their staged still lifes show objects from her life and work. The gallery hangs them next to large colour woodcuts by Lisa Huber. The exhibition is part of the Triennale IV Kärnten 2026. Source: villach.at, langenacht.orf.at'
}, {
  title: 'HOMESTORY', date_range: '11. September–31. Oktober 2026', opening_hours: HOURS_FREI[1], vernissage: 'Donnerstag, 10. September 2026, 19:00 Uhr', medium: 'Fotografie und Farbholzschnitt',
  image_alt: 'Stillleben auf Schwarz: weiße Porzellanhirsche und Hunde, über die Schnitzwerkzeuge gelegt sind (© Sebastian Köpcke | Volker Weinhold)',
  summary: 'Ein fotografischer Essay von Sebastian Köpcke und Volker Weinhold über die Künstlerin Lisa Huber, dazu ihre Farbholzschnitte, Beitrag zur Triennale IV Kärnten 2026.',
  description: 'Die Fotografen Sebastian Köpcke und Volker Weinhold porträtieren die in Villach geborene Künstlerin Lisa Huber in einem fotografischen Essay. Sie trafen einander als ausstellende Künstler im Stift Admont und fotografierten danach in ihrem Berliner Atelier und in ihrer Werkstatt im Haus der künstlerischen Begegnung in Villach. Ihre inszenierten Stillleben zeigen Objekte aus ihrem Leben und Werk. Die Galerie hängt sie neben großformatige Farbholzschnitte von Lisa Huber. Die Ausstellung ist ein Beitrag zur Triennale IV Kärnten 2026. Quelle: villach.at, langenacht.orf.at'
}, [[P.koepcke], [P.weinhold], [P.huber]])

await exhibition('vintage-views-from-an-unknown-future', { primary_venue: FREIHAUS, start_date: '2026-11-13', end_date: '2026-12-23', image: files.e_gfk }, {
  title: 'Gernot Fischer-Kondratovitch – vintage views from an unknown future', date_range: '13 November–23 December 2026', opening_hours: HOURS_FREI[0], vernissage: 'Thursday, 12 November 2026, 19:00', medium: 'Painting: acrylic on canvas',
  image_alt: 'Painting from the series Schneehaluzinationen: a zebra on a snowfield in front of a mountain, a line of tiny people and elephants behind it (© Gernot Fischer-Kondratovitch)',
  summary: 'Announcement: paintings by Gernot Fischer-Kondratovitch that combine people, containers, houses and exotic animals with landscapes of ice and snow.',
  description: 'Announcement. This exhibition has not opened yet. The Galerie Freihausgasse shows paintings by Gernot Fischer-Kondratovitch, born in Villach in 1968, under the title “vintage views from an unknown future”. According to the gallery they show pictures from a distant future: people, containers, houses and exotic animals in landscapes of ice and snow, or palm trees, beaches and seas in front of mountains. One of the works is from the series “Schneehaluzinationen” of 2026, acrylic on canvas, 100 × 140 cm. Source: villach.at'
}, {
  title: 'Gernot Fischer-Kondratovitch – vintage views from an unknown future', date_range: '13. November–23. Dezember 2026', opening_hours: HOURS_FREI[1], vernissage: 'Donnerstag, 12. November 2026, 19:00 Uhr', medium: 'Malerei: Acryl auf Leinwand',
  image_alt: 'Bild aus der Serie Schneehaluzinationen: ein Zebra auf einem Schneefeld vor einem Berg, dahinter eine Reihe winziger Menschen und Elefanten (© Gernot Fischer-Kondratovitch)',
  summary: 'Ankündigung: Bilder von Gernot Fischer-Kondratovitch, die Menschen, Container, Häuser und exotische Tiere mit Eis- und Schneelandschaften verbinden.',
  description: 'Ankündigung. Diese Ausstellung ist noch nicht eröffnet. Die Galerie Freihausgasse zeigt Bilder von Gernot Fischer-Kondratovitch, 1968 in Villach geboren, unter dem Titel „vintage views from an unknown future“. Laut Galerie zeigen sie Bilder aus einer fernen Zukunft: Menschen, Container, Häuser und exotische Tiere in Eis- und Schneelandschaften, oder Palmen, Strände und Meere vor Bergkulissen. Eine der Arbeiten stammt aus der Serie „Schneehaluzinationen“ von 2026, Acryl auf Leinwand, 100 × 140 cm. Quelle: villach.at'
}, [[FISCHER]])

await exhibition('atemzuege', { primary_venue: WALLNER, start_date: '2026-05-22', end_date: '2026-07-17', image: files.e_atem, tour_status: 'available', tour_available_from: '2026-07-17' }, {
  title: 'Atemzüge', date_range: '22 May–17 July 2026', opening_hours: 'Monday–Thursday, 8:00–12:00 and 14:00–16:00 · Friday, 8:00–13:00', vernissage: 'Thursday, 21 May 2026, 19:00', medium: 'Mixed media on paper and on linen',
  image_alt: 'Vaulted first-floor room of the Wallnerhaus: framed works by Wolfgang Daborer on the left wall, tall strips of linen with black lines hanging from the ceiling (photo © Robert Wildling / PERMAPHEMERA, works © Wolfgang Daborer)',
  summary: 'Works from the cycle “Atemzüge” by Wolfgang Daborer, 2025/2026, mixed media on paper and on linen, in the vaulted rooms of the Wallnerhaus.',
  description: 'Wolfgang Daborer, who lives in Spittal an der Drau, shows works from his cycle “Atemzüge” of 2025 and 2026 in the Wallnerhaus: mixed media on paper, 49.5 × 34.5 cm, and on linen, 200 × 35 cm. According to the flyer, the title refers to the line as a trace of breath. The lines come together, separate and open up space, with some accents of colour. The linen strips hang freely in the room. Mayor Manfred Fleißner opened the exhibition on 21 May 2026. Source: kleblach-lind.at, radio-osttirol.at'
}, {
  title: 'Atemzüge', date_range: '22. Mai–17. Juli 2026', opening_hours: 'Montag–Donnerstag, 8:00–12:00 und 14:00–16:00 Uhr · Freitag, 8:00–13:00 Uhr', vernissage: 'Donnerstag, 21. Mai 2026, 19:00 Uhr', medium: 'Mischtechnik auf Papier und auf Leinen',
  image_alt: 'Gewölbter Raum im ersten Obergeschoß des Wallnerhauses: gerahmte Arbeiten von Wolfgang Daborer an der linken Wand, hohe Leinenbahnen mit schwarzen Linien hängen von der Decke (Foto © Robert Wildling / PERMAPHEMERA, Werke © Wolfgang Daborer)',
  summary: 'Arbeiten aus dem Zyklus „Atemzüge“ von Wolfgang Daborer, 2025/2026, Mischtechnik auf Papier und auf Leinen, in den gewölbten Räumen des Wallnerhauses.',
  description: 'Wolfgang Daborer, der in Spittal an der Drau lebt, zeigt im Wallnerhaus Arbeiten aus seinem Zyklus „Atemzüge“ von 2025 und 2026: Mischtechnik auf Papier, 49,5 × 34,5 cm, und auf Leinen, 200 × 35 cm. Laut Flyer verweist der Titel auf die Linie als Spur des Atems. Die Linien verdichten sich, lösen sich und öffnen Räume, mit einzelnen farbigen Akzenten. Die Leinenbahnen hängen frei im Raum. Bürgermeister Manfred Fleißner eröffnete die Ausstellung am 21. Mai 2026. Quelle: kleblach-lind.at, radio-osttirol.at'
}, [[DABORER]], [['https://www.kleblach-lind.at/Ausstellung_im_Wallnerhaus', 'Exhibition page at kleblach-lind.at', 'exhibition_page', 'Ausstellungsseite auf kleblach-lind.at']])

const KALENDER = await exhibition('kunstkalender-hoffnung-und-frieden', { primary_venue: KNITTEL, start_date: '2026-10-29', end_date: '2026-11-02', image: files.e_kalender }, {
  title: 'Exhibition for the presentation of the art calendar “Hoffnung und Frieden”', date_range: '29 October–2 November 2026', opening_hours: null, vernissage: 'Thursday, 29 October 2026, pop-up gallery, Knittelfeld; music: Uwe Schmidt (accordion)', medium: 'Painting, art calendar',
  image_alt: 'Two works on a white slatted wall: yellow hands and a pair of eyes on green, a sun and grapes on blue (photo © Walter Schindler, works © the artists)',
  summary: 'Works for the art calendar “Hoffnung und Frieden” by artists of the Lebenshilfe Region Knittelfeld, made with Helmuth Ploschnitznigg and Adi Schmölzer, in a pop-up gallery in Knittelfeld.',
  description: 'The Lebenshilfe Region Knittelfeld presents its art calendar “Hoffnung und Frieden” in a pop-up gallery in Knittelfeld, with the works for it on the walls. Artists of the Lebenshilfe with and without disabilities made it with Helmuth Ploschnitznigg and Adi Schmölzer, partly at a working morning with the Spielberg middle school on 24 March 2026. Works from the project also hung in the exhibition “Hoffnung & Frieden” at the Stadtgalerie Judenburg in April 2026. At the vernissage Johann Hubmann, chair of the Lebenshilfe, welcomed the guests, and the two artists spoke about how the calendar came about. Source: meinbezirk.at, kleinezeitung.at, lebenshilfe-knittelfeld.at, murtalinfo.at'
}, {
  title: 'Ausstellung anlässlich der Präsentation des Kunstkalenders „Hoffnung und Frieden“', date_range: '29. Oktober–2. November 2026', opening_hours: null, vernissage: 'Donnerstag, 29. Oktober 2026, Pop-up-Galerie, Knittelfeld; Musik: Uwe Schmidt (Akkordeon)', medium: 'Malerei, Kunstkalender',
  image_alt: 'Zwei Arbeiten an einer weißen Lamellenwand: gelbe Hände und ein Augenpaar auf Grün, eine Sonne und Trauben auf Blau (Foto © Walter Schindler, Werke © die Künstler:innen)',
  summary: 'Arbeiten für den Kunstkalender „Hoffnung und Frieden“ von Künstler:innen der Lebenshilfe Region Knittelfeld, entstanden mit Helmuth Ploschnitznigg und Adi Schmölzer, in einer Pop-up-Galerie in Knittelfeld.',
  description: 'Die Lebenshilfe Region Knittelfeld präsentiert ihren Kunstkalender „Hoffnung und Frieden“ in einer Pop-up-Galerie in Knittelfeld, die Arbeiten dafür hängen an den Wänden. Künstler:innen der Lebenshilfe mit und ohne Behinderung gestalteten ihn mit Helmuth Ploschnitznigg und Adi Schmölzer, zum Teil bei einem künstlerischen Vormittag mit der MS Spielberg am 24. März 2026. Arbeiten aus dem Projekt hingen im April 2026 auch in der Ausstellung „Hoffnung & Frieden“ in der Stadtgalerie Judenburg. Bei der Vernissage begrüßte Johann Hubmann, Obmann der Lebenshilfe, die Gäste, und die beiden Künstler erzählten von der Entstehung des Kalenders. Quelle: meinbezirk.at, kleinezeitung.at, lebenshilfe-knittelfeld.at, murtalinfo.at'
}, [[P.collective], [P.plo], [SCHMOELZER]], [['https://www.meinbezirk.at/murtal/c-leute/kunst-die-von-herzen-kommt_a8984211', 'Report at meinbezirk.at', 'exhibition_page', 'Bericht auf meinbezirk.at']])
await organiser(KALENDER, LEBENSHILFE, 'organiser')

console.log('done')
