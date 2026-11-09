// Writes the records for "Wagner reloaded" (Theatergalerie, 2026) into production Directus.
// All new records are drafts. Run from directus/:
//   DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-06__wagner-reloaded/write-records.mjs
// Safe to run twice: a record whose slug exists is left alone. Deletes nothing.
import { readFileSync } from 'node:fs'
import { loadEnv, login } from '../../directus/scripts/lib.mjs'

const files = JSON.parse(readFileSync(new URL('./file-ids.json', import.meta.url), 'utf8'))
const { api } = await login(loadEnv())

const ARTIST = '37b28cb2-e0ba-4081-b51b-836149de0a06'
const CURATOR = '68b75859-8a9b-4bc8-aa98-8c6577c18fb3'
const KLAGENFURT = '2e1e264b-ab44-48ff-9f0f-03f613f7865c'
const THEATERGALERIE = '6a07ffe2-65ad-49f7-a810-9a50f06680ac'
const POESCHL = 'b0211bf5-355a-4575-8d3d-3e564c3c4e89'

const q = (value) => encodeURIComponent(value)
const bySlug = async (collection, slug) => (await api('GET', `/items/${collection}?filter[slug][_eq]=${q(slug)}&fields=id&limit=1`))[0]?.id
// English on the record and in `en`, German in `de` (pnpm check:data tests the mirror).
const bilingual = (en, de) => ({ ...en, translations: [{ languages_code: 'en', ...en }, { languages_code: 'de', ...de }] })
const link = async (url, title, kind) => {
  const [found] = await api('GET', `/items/pp_websites?filter[url][_eq]=${q(url)}&fields=id&limit=1`)
  return found?.id ?? (await api('POST', '/items/pp_websites', {
    status: 'published', title, url, kind,
    translations: [{ languages_code: 'en', title }, { languages_code: 'de', title }]
  })).id
}
const ensure = async (collection, slug, payload) => {
  const found = await bySlug(collection, slug)
  if (found) { console.log(`= ${collection}/${slug}`); return found }
  const { id } = await api('POST', `/items/${collection}`, { slug, status: 'draft', ...payload })
  console.log(`+ ${collection}/${slug} ${id}`)
  return id
}

// ─── Organisation ───────────────────────────────────────────────────────────
const THEATER = await ensure('pp_organisations', 'stadttheater-klagenfurt', {
  title: 'Stadttheater Klagenfurt', kind: 'institution', location: KLAGENFURT,
  address: 'Theaterplatz 4, 9020 Klagenfurt am Wörthersee, Austria', founded: '1910',
  image: files.o_theater,
  websites: [{ websites_id: await link('https://www.stadttheater-klagenfurt.at/', 'stadttheater-klagenfurt.at', 'website'), sort: 1 }],
  ...bilingual({
    lede: 'Municipal theatre in Klagenfurt am Wörthersee, built by Fellner & Helmer and opened in 1910.',
    description: 'Municipal theatre in Klagenfurt am Wörthersee, opened in 1910.',
    image_alt: 'The Stadttheater Klagenfurt seen from the west: an Art Nouveau building with a lantern on its roof, behind a lawn',
    image_caption: 'Stadttheater Klagenfurt, west side · Foto: Johann Jaritz (CC BY-SA 4.0)',
    about_html: '<p>The Stadttheater Klagenfurt was built from 1908 to 1910 to designs by the Viennese firm Fellner &amp; Helmer as the Kaiser-Franz-Joseph-Jubiläumstheater, for the 60th jubilee of Emperor Franz Joseph I. It was renovated in the 1960s and again from 1996 to 1998 to designs by Günther Domenig, and it received Nestroy Theatre Prizes in 2003, 2006 and 2011. Its artistic director (Intendant) is Aron Stiehl. Since 2011 the theatre has staged the works of Richard Wagner with marked intensity, from Der fliegende Holländer (2011) to Tristan und Isolde (2025).</p><p>Sources</p><ul><li>wikipedia.org</li><li>stadtgalerie.net</li></ul>'
  }, {
    lede: 'Städtisches Theater in Klagenfurt am Wörthersee, von Fellner & Helmer erbaut und 1910 eröffnet.',
    description: 'Städtisches Theater in Klagenfurt am Wörthersee, 1910 eröffnet.',
    image_alt: 'Das Stadttheater Klagenfurt von Westen: ein Jugendstilbau mit einer Laterne auf dem Dach, hinter einer Wiese',
    image_caption: 'Stadttheater Klagenfurt, Westseite · Foto: Johann Jaritz (CC BY-SA 4.0)',
    about_html: '<p>Das Stadttheater Klagenfurt wurde von 1908 bis 1910 nach Plänen des Wiener Büros Fellner &amp; Helmer als Kaiser-Franz-Joseph-Jubiläumstheater erbaut, zum 60. Regierungsjubiläum von Kaiser Franz Joseph I. Es wurde in den 1960er-Jahren und erneut von 1996 bis 1998 nach Plänen von Günther Domenig umgebaut und erhielt 2003, 2006 und 2011 den Nestroy-Theaterpreis. Intendant ist Aron Stiehl. Seit 2011 widmet sich das Theater mit bemerkenswerter Intensität dem Werk Richard Wagners, vom „Fliegenden Holländer“ (2011) bis zu „Tristan und Isolde“ (2025).</p><p>Quellen</p><ul><li>wikipedia.org</li><li>stadtgalerie.net</li></ul>'
  })
})

// ─── Persons ────────────────────────────────────────────────────────────────
const SCHMIDAUER = await ensure('pp_persons', 'guenter-schmidauer', {
  first_name: 'Günter', last_name: 'Schmidauer', born: '1955, Klagenfurt',
  roles: [{ roles_id: CURATOR }],
  ...bilingual({
    lede: 'Writer, journalist and dramaturge, born in Klagenfurt in 1955.',
    about_html: '<p>Günter Schmidauer was born in Klagenfurt in 1955. He studied theatre studies, German studies and advertising management at the University of Vienna and wrote his doctoral thesis on Karl Kraus’s Die letzten Tage der Menschheit. He founded and ran the travelling street theatre Wiener Comoediantenkarren, was an assistant dramaturge at the Burgtheater and a freelance contributor to ORF Kärnten, and headed dramaturgy, advertising and public relations at the Stadttheater Klagenfurt under Herbert Wochinz. He worked with the Komödienspiele Porcia, the Friesacher Burghofspiele and the Kärntner Komödianten and founded the VolXbühne. He has taught at the University of Klagenfurt, was city manager of Feldkirchen and president of the Kärntner P.E.N. Club, and has published several books. He curated the exhibition Wagner reloaded in the Theatergalerie in Klagenfurt (2026).</p><p>Sources</p><ul><li>mohorjeva.com</li><li>stadtgalerie.net</li></ul>'
  }, {
    lede: 'Schriftsteller, Journalist und Dramaturg, 1955 in Klagenfurt geboren.',
    about_html: '<p>Günter Schmidauer wurde 1955 in Klagenfurt geboren. Er studierte Theaterwissenschaft, Germanistik und Werbung und Verkauf an der Universität Wien und schrieb seine Dissertation über „Die letzten Tage der Menschheit“ von Karl Kraus. Er gründete und leitete das Wander- und Straßentheater Wiener Comoediantenkarren, war Dramaturgieassistent am Burgtheater und freier Mitarbeiter des ORF Kärnten und leitete unter Herbert Wochinz Dramaturgie, Werbeabteilung und Öffentlichkeitsarbeit am Stadttheater Klagenfurt. Er arbeitete mit den Komödienspielen Porcia, den Friesacher Burghofspielen und den Kärntner Komödianten und gründete die VolXbühne. Er lehrte an der Universität Klagenfurt, war Stadtmanager in Feldkirchen und Präsident des Kärntner P.E.N.-Clubs und hat mehrere Bücher veröffentlicht. Er kuratierte die Ausstellung „Wagner reloaded“ in der Theatergalerie in Klagenfurt (2026).</p><p>Quellen</p><ul><li>mohorjeva.com</li><li>stadtgalerie.net</li></ul>'
  })
})

const BREITENECKER = await ensure('pp_persons', 'bettina-breitenecker', {
  first_name: 'Bettina', last_name: 'Breitenecker', born: 'Vienna',
  roles: [{ roles_id: ARTIST }],
  image: files.p_breitenecker,
  ...bilingual({
    based_in: 'Klagenfurt',
    lede: 'Costume designer, head of the costume department of the Stadttheater Klagenfurt.',
    image_alt: 'Bettina Breitenecker in a cap and a striped jumper, standing beside a costume from Tristan und Isolde in the Theatergalerie',
    image_caption: 'Bettina Breitenecker · Photo: STG',
    about_html: '<p>Bettina Breitenecker was born in Vienna. In 1999 she graduated from the textile design department of the HTBLVA for the textile industry at Spengergasse in Vienna, then trained as a costume painter with ART for ART Theaterservice. From 2003 to 2011 she worked freelance as a costume painter and costume design assistant at theatres including the Theater in der Josefstadt, the Burgtheater, the Volksoper and Theater Bielefeld, and for many years as a costume painter at the Bregenz Festival. She designed the costumes for Fame at the Oper Graz (2012) and for Der Mann von La Mancha at the Gärtnerplatztheater in Munich. At the Stadttheater Klagenfurt she has been head of design for costume and make-up since the 2011/12 season and head of the costume department since 2022/23; her productions there include Tristan und Isolde.</p><p>Source</p><ul><li>stadtgalerie.net (artist biographies for Wagner reloaded, 2026)</li></ul>'
  }, {
    based_in: 'Klagenfurt',
    lede: 'Kostümbildnerin, Leiterin des Kostümwesens am Stadttheater Klagenfurt.',
    image_alt: 'Bettina Breitenecker mit Kappe und gestreiftem Pullover neben einem Kostüm aus „Tristan und Isolde“ in der Theatergalerie',
    image_caption: 'Bettina Breitenecker · Foto: STG',
    about_html: '<p>Bettina Breitenecker wurde in Wien geboren. 1999 schloss sie die HTBLVA für Textilindustrie, Abteilung Textildesign, in der Spengergasse in Wien ab und ließ sich danach bei ART for ART Theaterservice zur Kostümmalerin ausbilden. Von 2003 bis 2011 arbeitete sie selbstständig als Kostümmalerin und Kostümbildassistentin an Theatern wie dem Theater in der Josefstadt, dem Burgtheater, der Volksoper und dem Theater Bielefeld, viele Jahre auch als Kostümmalerin bei den Bregenzer Festspielen. Sie entwarf die Kostüme für „Fame“ an der Oper Graz (2012) und für „Der Mann von La Mancha“ am Gärtnerplatztheater in München. Am Stadttheater Klagenfurt ist sie seit der Spielzeit 2011/12 Ausstattungsleiterin für Kostüm und Maske und seit 2022/23 Leiterin des Kostümwesens; zu ihren Arbeiten dort gehört „Tristan und Isolde“.</p><p>Quelle</p><ul><li>stadtgalerie.net (Künstlerbiografien zu „Wagner reloaded“, 2026)</li></ul>'
  })
})

// ─── Exhibition ─────────────────────────────────────────────────────────────
await ensure('pp_exhibitions', 'wagner-reloaded', {
  kind: 'exhibition', primary_venue: THEATERGALERIE,
  start_date: '2026-04-14', end_date: '2027-02-28',
  image: files.e_image, source_pdf: files.e_pdf,
  tour_status: 'available', tour_available_from: null,
  participations: [
    { person: SCHMIDAUER, role: CURATOR, sort: 0 },
    { person: BREITENECKER, role: ARTIST, sort: 1 },
    { person: POESCHL, role: ARTIST, sort: 2 }
  ],
  organisers: [{ organisation: THEATER, role: 'cooperation' }],
  ...bilingual({
    title: 'Wagner reloaded',
    date_range: '14 April 2026–28 February 2027',
    opening_hours: 'Thursday and Friday, 9:00–12:00, also on public holidays; groups by appointment',
    vernissage: 'Monday, 13 April 2026, 18:00',
    medium: 'Costumes, costume designs and stage photographs',
    image_alt: 'Costume designs for a Wagner production with fabric samples and gold braid (© Stadttheater Klagenfurt)',
    summary: 'Four Wagner costumes and their designs from the Stadttheater Klagenfurt, with a look at its tailoring and make-up departments.',
    description: '<p>Since 2011 the Stadttheater Klagenfurt has staged Richard Wagner with marked intensity, from Der fliegende Holländer to Tristan und Isolde. The Theatergalerie shows four costumes from Wagner’s Walküre and Tristan und Isolde together with their designs, and turns to the work behind the curtain: the theatre’s tailoring and make-up departments, headed by Bettina Breitenecker and Renate Wutte. Stage photographs by Arnold Pöschl accompany the costumes. Curated by Günter Schmidauer, in cooperation with the Stadttheater Klagenfurt, which lent the works. The room also holds Burgis Paier’s permanent installation Das große Welttheater.</p><p>Sources</p><ul><li>stadtgalerie.net</li><li>Invitation of the Stadtgalerie Klagenfurt (2026)</li></ul>'
  }, {
    title: 'Wagner reloaded',
    date_range: '14. April 2026–28. Februar 2027',
    opening_hours: 'Donnerstag und Freitag, 9:00–12:00 Uhr, auch an Feiertagen; Gruppen nach Vereinbarung',
    vernissage: 'Montag, 13. April 2026, 18:00 Uhr',
    medium: 'Kostüme, Kostümentwürfe und Bühnenfotografien',
    image_alt: 'Kostümentwürfe für eine Wagner-Inszenierung mit Stoffmustern und Goldborte (© Stadttheater Klagenfurt)',
    summary: 'Vier Wagner-Kostüme und ihre Entwürfe aus dem Stadttheater Klagenfurt, mit einem Blick auf Schneiderei und Maske.',
    description: '<p>Seit 2011 widmet sich das Stadttheater Klagenfurt mit bemerkenswerter Intensität Richard Wagner, vom „Fliegenden Holländer“ bis zu „Tristan und Isolde“. Die Theatergalerie zeigt vier Kostüme aus Wagners „Walküre“ und „Tristan und Isolde“ mit den dazugehörigen Entwürfen und holt die Werkstätten vor den Vorhang: Schneiderei und Maske des Theaters, geleitet von Bettina Breitenecker und Renate Wutte. Bühnenfotografien von Arnold Pöschl begleiten die Kostüme. Kuratiert von Günter Schmidauer, in Kooperation mit dem Stadttheater Klagenfurt, das die Leihgaben stellt. Im selben Raum steht Burgis Paiers Dauerausstellung „Das große Welttheater“.</p><p>Quellen</p><ul><li>stadtgalerie.net</li><li>Einladung der Stadtgalerie Klagenfurt (2026)</li></ul>'
  })
})
