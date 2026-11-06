// Writes the records of 2026-11-05 (Museum der Stadt Villach, "Wie Kriege enden / How wars end")
// into production Directus. All new records are drafts.
// Run from directus/:  DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-05__museum-villach-wie-kriege-enden/write-records.mjs
// Safe to run twice: a record whose slug exists is left alone. Deletes nothing, publishes nothing.
import { readFileSync } from 'node:fs'
import { loadEnv, login } from '../../directus/scripts/lib.mjs'

const files = JSON.parse(readFileSync(new URL('./file-ids.json', import.meta.url), 'utf8'))
const { api } = await login(loadEnv())

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

const link = async (url, title, kind, titleDe = title) => {
  const [found] = await api('GET', `/items/pp_websites?filter[url][_eq]=${q(url)}&fields=id&limit=1`)
  if (found) return found.id
  return (await api('POST', '/items/pp_websites', {
    status: 'published', title, url, kind,
    translations: [{ languages_code: 'en', title }, { languages_code: 'de', title: titleDe }]
  })).id
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

// ─── Venue ──────────────────────────────────────────────────────────────────
const LAT = 46.61314
const LON = 13.8443
const MUSEUM = await ensure('pp_venues', 'museum-der-stadt-villach', {
  title: 'Museum der Stadt Villach', type: 'museum', location: VILLACH, archive_number: '44',
  address: 'Widmanngasse 38, 9500 Villach, Austria', website_url: 'https://villach.at/museum',
  latitude: LAT, longitude: LON, image: files.v_museum, hero_image: files.v_museum,
  websites: await linkRows([
    ['https://www.facebook.com/museumderstadtvillach', 'Facebook', 'social'],
    ['https://www.instagram.com/villach.museum/', 'Instagram', 'social']
  ]),
  ...bilingual({
    image_alt: 'The pale three-storey building of the Museum der Stadt Villach behind a small park with young trees, hedges and a paved square',
    hero_image_alt: 'The Museum der Stadt Villach at Widmanngasse 38 under a light sky, seen across the park',
    image_caption: 'The Museum der Stadt Villach, Widmanngasse 38 · Foto: Johann Jaritz (CC BY-SA 4.0)',
    coordinate_label: dms(LAT, LON),
    lede: 'Municipal museum of Villach in a palace more than 400 years old on the Widmanngasse, with collections on the history, art and culture of the region.',
    description: 'Municipal museum of Villach, founded in 1873, with archaeology, city history, an art collection and special exhibitions.',
    about_html: '<p>The Museum der Stadt Villach was founded in 1873 by Carl Andreas Picco and is one of the oldest municipal museums in Austria. Since 1960 it has been housed in a palace more than 400 years old at Widmanngasse 38, with an arcaded courtyard from around 1600. On 800 m² it shows archaeological finds from six millennia, the history of the city and an art collection from the Middle Ages to the present, as well as a lapidarium. Its garden lies on the last preserved part of the town wall, with the open-air museum “Grünes Eck”, opened in 2022.</p><p>The museum belongs to the City of Villach and is directed by Andreas Kuchler; the Stadtpfarrturm, the Relief von Kärnten and the Schauraum Burg belong to it. It holds the Austrian Museum Seal of Approval. From May to the beginning of November it is open Tuesday to Sunday from 10 am to 4.30 pm and closed on Mondays, except on public holidays.</p>'
  }, {
    image_alt: 'Das helle dreigeschoßige Gebäude des Museums der Stadt Villach hinter einem kleinen Park mit jungen Bäumen, Hecken und einem gepflasterten Platz',
    hero_image_alt: 'Das Museum der Stadt Villach in der Widmanngasse 38 unter hellem Himmel, vom Park aus gesehen',
    image_caption: 'Das Museum der Stadt Villach, Widmanngasse 38 · Foto: Johann Jaritz (CC BY-SA 4.0)',
    coordinate_label: dms(LAT, LON),
    lede: 'Städtisches Museum Villachs in einem über 400 Jahre alten Palais in der Widmanngasse, mit Sammlungen zu Geschichte, Kunst und Kultur der Region.',
    description: 'Städtisches Museum Villachs, gegründet 1873, mit Archäologie, Stadtgeschichte, Kunstsammlung und Sonderausstellungen.',
    about_html: '<p>Das Museum der Stadt Villach wurde 1873 von Carl Andreas Picco gegründet und zählt zu den ältesten kommunalen Museen Österreichs. Seit 1960 ist es in einem über 400 Jahre alten Palais in der Widmanngasse 38 untergebracht, mit einem Arkadenhof aus der Zeit um 1600. Auf 800 m² zeigt es Bodenfunde aus sechs Jahrtausenden, die Geschichte der Stadt und eine Kunstsammlung vom Mittelalter bis zur Gegenwart sowie ein Lapidarium. Sein Garten liegt auf dem letzten erhaltenen Teil der Stadtmauer, mit dem 2022 eröffneten Freilichtmuseum „Grünes Eck“.</p><p>Das Museum gehört der Stadt Villach und wird von Andreas Kuchler geleitet; Stadtpfarrturm, Relief von Kärnten und Schauraum Burg gehören dazu. Es trägt das Österreichische Museumsgütesiegel. Von Mai bis Anfang November ist es Dienstag bis Sonntag von 10 bis 16.30 Uhr geöffnet, montags geschlossen, ausgenommen an Feiertagen.</p>'
  })
})

// ─── Person: the museum director, who led the curator's tour ───────────────
const KUCHLER = await ensure('pp_persons', 'andreas-kuchler', {
  first_name: 'Andreas', last_name: 'Kuchler', born: null, image: null,
  roles: [{ roles_id: CURATOR }],
  ...bilingual({
    based_in: 'Villach',
    lede: 'Director of the Museum der Stadt Villach.',
    about_html: '<p>Andreas Kuchler is the director of the Museum der Stadt Villach. He presented its special exhibition “Wie Kriege enden / How wars end” in 2025 and led curator’s tours through it. In 2025 he wrote about the museum’s sites in Villach for the Museumsbund Österreich. Source: kaernten.orf.at, klick-kaernten.at, vhsktn.at, museumsbund.at.</p>'
  }, {
    based_in: 'Villach',
    lede: 'Direktor des Museums der Stadt Villach.',
    about_html: '<p>Andreas Kuchler ist Direktor des Museums der Stadt Villach. Er stellte 2025 die Sonderausstellung „Wie Kriege enden / How wars end“ vor und führte in Kuratorenführungen durch sie. 2025 schrieb er für den Museumsbund Österreich über die Museumsstandorte Villachs. Quelle: kaernten.orf.at, klick-kaernten.at, vhsktn.at, museumsbund.at.</p>'
  })
})
{
  const found = await api('GET', `/items/pp_mm__persons_venues?filter[persons_id][_eq]=${KUCHLER}&filter[venues_id][_eq]=${MUSEUM}&fields=id&limit=1`)
  if (!found.length) await api('POST', '/items/pp_mm__persons_venues', { persons_id: KUCHLER, venues_id: MUSEUM, relation: 'head' })
}

// ─── Exhibition ─────────────────────────────────────────────────────────────
// One record for both runs: 8 May–2 November 2025 and, updated and extended, 2 May–1 November 2026.
// Tour: photographed 26 October 2026; the owner wants the button at once (tour_available_from empty).
// `tour` stays empty: it is set at publish time (pnpm tour:publish).
const TITLE = 'Wie Kriege enden / How wars end'
await ensure('pp_exhibitions', 'wie-kriege-enden', {
  kind: 'exhibition', primary_venue: MUSEUM, start_date: '2025-05-08', end_date: '2026-11-01',
  image: files.e_kriege, source_pdf: files.pdf_poster,
  tour_status: 'available', tour_available_from: null,
  participations: [{ person: KUCHLER, role: CURATOR, sort: 0 }],
  websites: await linkRows([
    ['https://villach.at/stadt-erleben/museum-der-stadt/aktuelle-sonderausstellung-im-stadtmuseum', 'Exhibition page at villach.at', 'exhibition_page', 'Ausstellungsseite auf villach.at'],
    ['https://kaernten.orf.at/stories/3315182/', 'Report at kaernten.orf.at (July 2025)', 'press', 'Bericht auf kaernten.orf.at (Juli 2025)']
  ]),
  ...bilingual({
    title: TITLE,
    date_range: '8 May–2 November 2025 and 2 May–1 November 2026',
    opening_hours: 'Tuesday–Sunday, 10:00–16:30 · closed on Mondays, except public holidays',
    vernissage: null,
    admission: '2026: € 8, reduced € 6 (2025: € 6, reduced € 5); free for children and young people under 19',
    medium: 'Original objects, photographs, documents, eyewitness accounts, films and interactive stations',
    image_alt: 'Courtyard of the Museum der Stadt Villach: a shot-up orange Lada from Ukraine in front of arcades with the exhibition banners “Wie / How” and “Kriege / Wars” (photo © Robert Wildling / PERMAPHEMERA, exhibition © Museum der Stadt Villach)',
    summary: 'Special exhibition of the Museum der Stadt Villach on how six wars ended, from Napoleon to the war in Ukraine, with eyewitness accounts and an interactive Peace Lab.',
    description: 'Eighty years after the end of the Second World War, the Museum der Stadt Villach shows how wars end, in German and English. Six conflicts, from the Napoleonic Wars to the war in Ukraine, are linked to the history of Villach. Eleven eyewitnesses tell of flight, violence and new beginnings. Among the objects are a defused aerial bomb from the Second World War, a replica of an alpine position from the First World War and a Lada from Ukraine that was shot at by both sides. For 2026 the exhibition was extended and updated, with new content on the Cold War, the war in Ukraine and the sinking of the warship “Szent István”. It ends in a Peace Lab with interactive stations; two of them were developed by pupils of the BG/BRG Villach St. Martin. Source: villach.at, kaernten.orf.at, welcome2villach.at, klick-kaernten.at, it-gymnasium.at'
  }, {
    title: TITLE,
    date_range: '8. Mai–2. November 2025 und 2. Mai–1. November 2026',
    opening_hours: 'Dienstag–Sonntag, 10:00–16:30 Uhr · montags geschlossen, ausgenommen Feiertage',
    vernissage: null,
    admission: '2026: € 8, ermäßigt € 6 (2025: € 6, ermäßigt € 5); Kinder und Jugendliche unter 19 frei',
    medium: 'Originalobjekte, Fotografien, Dokumente, Zeitzeug:innenberichte, Filme und Mitmach-Stationen',
    image_alt: 'Innenhof des Museums der Stadt Villach: ein zerschossener orangefarbener Lada aus der Ukraine vor Arkaden mit den Ausstellungsbannern „Wie / How“ und „Kriege / Wars“ (Foto © Robert Wildling / PERMAPHEMERA, Ausstellung © Museum der Stadt Villach)',
    summary: 'Sonderausstellung des Museums der Stadt Villach über das Ende von sechs Kriegen, von Napoleon bis zum Ukraine-Krieg, mit Zeitzeug:innen und interaktivem Friedenslabor.',
    description: '80 Jahre nach dem Ende des Zweiten Weltkriegs zeigt das Museum der Stadt Villach zweisprachig, wie Kriege enden. Sechs Konflikte, von den Napoleonischen Kriegen bis zum Krieg in der Ukraine, werden mit der Geschichte Villachs verbunden. Elf Zeitzeug:innen erzählen von Flucht, Gewalt und Neubeginn. Zu den Objekten zählen eine entschärfte Fliegerbombe aus dem Zweiten Weltkrieg, der Nachbau einer alpinen Kriegsstellung aus dem Ersten Weltkrieg und ein Lada aus der Ukraine, auf den beide Seiten geschossen haben. Für 2026 wurde die Ausstellung verlängert und aktualisiert, mit neuen Inhalten zum Kalten Krieg, zum Krieg in der Ukraine und zum Untergang des Kriegsschiffs „Szent István“. Am Ende steht ein Friedenslabor mit Mitmach-Stationen; zwei davon entwickelten Schüler:innen des BG/BRG Villach St. Martin. Quelle: villach.at, kaernten.orf.at, welcome2villach.at, klick-kaernten.at, it-gymnasium.at'
  })
})
