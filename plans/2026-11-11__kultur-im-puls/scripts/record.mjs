// Completes the organisation kultur.im.puls in production Directus (plans/2026-11-11__kultur-im-puls.md):
// 11 new persons (draft), 12 memberships, logo, photo, address, links, about text.
// Run from the directus folder:
//   DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-11__kultur-im-puls/scripts/record.mjs [--dry-run]
// Safe to run again: existing persons (by slug), memberships (by person) and links (by url) are kept.
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'

const dryRun = process.argv.includes('--dry-run')
const ORG_SLUG = 'kultur-im-puls'
const ARTIST = '37b28cb2-e0ba-4081-b51b-836149de0a06'
const LOGO = '19c8b1cd-bca3-45b9-a99d-ef08a5967ba0'
const PHOTO = '7906a433-fa3f-4599-b0c7-67bb11d130cf'

// Sources: the whole line is the link (how-to §7a).
const SRC = {
  team: { url: 'https://kultur-impuls.com/vorstand-und-team/', en: '“Vorstand und Team”, kultur-impuls.com', de: '„Vorstand und Team“, kultur-impuls.com' },
  article: { url: 'https://kultur-impuls.com/wp-content/uploads/KIPVorstand.jpg', en: '“Verjüngung bei kultur.im.puls Seeboden”, press clipping (2024) in the press review of kultur-impuls.com', de: '„Verjüngung bei kultur.im.puls Seeboden“, Zeitungsausschnitt (2024) im Pressespiegel von kultur-impuls.com' },
  verein: { url: 'https://kultur-impuls.com/der-verein/', en: '“Der Verein ‘kultur.im.puls’”, kultur-impuls.com', de: '„Der Verein ‚kultur.im.puls‘“, kultur-impuls.com' },
  impressum: { url: 'https://kultur-impuls.com/impressum/', en: '“Impressum”, kultur-impuls.com', de: '„Impressum“, kultur-impuls.com' },
  galerie: { url: 'https://kultur-impuls.com/unsere-galerie/', en: '“Unsere Galerie”, kultur-impuls.com', de: '„Unsere Galerie“, kultur-impuls.com' },
  joch: { url: 'https://kultur-impuls.com/events/ausstellung-melanie-joch/', en: '“Ausstellung Melanie Joch”, kultur-impuls.com', de: '„Ausstellung Melanie Joch“, kultur-impuls.com' },
  weihs: { url: 'https://kultur-impuls.com/events/ausstellung-gerhart-weihs/', en: '“Ausstellung Gerhart Weihs”, kultur-impuls.com', de: '„Ausstellung Gerhart Weihs“, kultur-impuls.com' }
}
const sources = (keys, lang) => {
  const label = keys.length === 1 ? (lang === 'en' ? 'Source' : 'Quelle') : (lang === 'en' ? 'Sources' : 'Quellen')
  return `<p>${label}</p><ul>${keys.map((key) => `<li><a href="${SRC[key].url}">${SRC[key][lang]}</a></li>`).join('')}</ul>`
}
const html = (paragraphs, keys, lang) => paragraphs.map((p) => `<p>${p}</p>`).join('') + sources(keys, lang)

// In the order of the page "Vorstand und Team". `function` = membership function.
const PEOPLE = [
  { first: 'Peter', last: 'Kleinfercher', slug: 'peter-kleinfercher', src: ['team'],
    fn: { en: 'Honorary chairman', de: 'Ehrenobmann' },
    lede: { en: 'Honorary chairman of the association kultur.im.puls in Seeboden.', de: 'Ehrenobmann des Vereins kultur.im.puls in Seeboden.' },
    about: { en: ['Peter Kleinfercher is the honorary chairman of the association kultur.im.puls, which runs the Galerie im Stiegenhaus in the Impuls Center in Seeboden.'],
      de: ['Peter Kleinfercher ist Ehrenobmann des Vereins kultur.im.puls, der die Galerie im Stiegenhaus im Impuls Center in Seeboden betreibt.'] } },
  { first: 'Carolin', last: 'Meinl', slug: 'carolin-meinl', src: ['team', 'article', 'impressum'],
    fn: { en: 'Chair, artistic advisory board, workshops at the Rojachhof', de: 'Obfrau, Künstlerischer Beirat, Workshoporganisation Rojachhof' },
    lede: { en: 'Chair of the association kultur.im.puls in Seeboden since 2024.', de: 'Obfrau des Vereins kultur.im.puls in Seeboden seit 2024.' },
    about: { en: ['Carolin Meinl has chaired the association kultur.im.puls since 2024, when a new board took over in the association’s 15th year. She also sits on its artistic advisory board and organises its workshops at the Rojachhof. The association runs the Galerie im Stiegenhaus in the Impuls Center in Seeboden.'],
      de: ['Carolin Meinl ist seit 2024 Obfrau des Vereins kultur.im.puls; in diesem Jahr, dem 15. des Vereins, übernahm ein neuer Vorstand. Sie gehört auch dem Künstlerischen Beirat an und organisiert die Workshops am Rojachhof. Der Verein betreibt die Galerie im Stiegenhaus im Impuls Center in Seeboden.'] } },
  { existing: true, slug: 'wolfgang-daborer',
    fn: { en: 'Vice chair, artistic advisory board', de: 'Obmann-Stellvertreter, Künstlerischer Beirat' } },
  { first: 'Manuela', last: 'Molzbichler', slug: 'manuela-molzbichler', src: ['team', 'article'],
    fn: { en: 'Secretary', de: 'Schriftführerin' },
    lede: { en: 'Secretary of the association kultur.im.puls in Seeboden.', de: 'Schriftführerin des Vereins kultur.im.puls in Seeboden.' },
    about: { en: ['Manuela Molzbichler is the secretary of the association kultur.im.puls, which runs the Galerie im Stiegenhaus in Seeboden. She joined the board when it was renewed in 2024.'],
      de: ['Manuela Molzbichler ist Schriftführerin des Vereins kultur.im.puls, der die Galerie im Stiegenhaus in Seeboden betreibt. Sie kam 2024 mit dem neuen Vorstand in dieses Amt.'] } },
  { first: 'Sissy', last: 'Brunner-Schützelhofer', slug: 'sissy-brunner-schuetzelhofer', src: ['team', 'article'],
    fn: { en: 'Deputy secretary, artistic advisory board', de: 'Schriftführerin-Stellvertreterin, Künstlerischer Beirat' },
    lede: { en: 'Deputy secretary of the association kultur.im.puls in Seeboden.', de: 'Schriftführerin-Stellvertreterin des Vereins kultur.im.puls in Seeboden.' },
    about: { en: ['Sissy Brunner-Schützelhofer is the deputy secretary of the association kultur.im.puls and sits on its artistic advisory board. She joined the board when it was renewed in 2024. The association runs the Galerie im Stiegenhaus in Seeboden.'],
      de: ['Sissy Brunner-Schützelhofer ist Schriftführerin-Stellvertreterin des Vereins kultur.im.puls und gehört seinem Künstlerischen Beirat an. Sie kam 2024 mit dem neuen Vorstand in dieses Amt. Der Verein betreibt die Galerie im Stiegenhaus in Seeboden.'] } },
  { first: 'Manfred', last: 'Göllner', slug: 'manfred-goellner', src: ['team', 'article'],
    fn: { en: 'Treasurer', de: 'Kassier' },
    lede: { en: 'Treasurer of the association kultur.im.puls in Seeboden.', de: 'Kassier des Vereins kultur.im.puls in Seeboden.' },
    about: { en: ['Manfred Göllner is the treasurer of the association kultur.im.puls, which runs the Galerie im Stiegenhaus in Seeboden. He joined the board when it was renewed in 2024.'],
      de: ['Manfred Göllner ist Kassier des Vereins kultur.im.puls, der die Galerie im Stiegenhaus in Seeboden betreibt. Er kam 2024 mit dem neuen Vorstand in dieses Amt.'] } },
  { first: 'Melanie', last: 'Joch', slug: 'melanie-joch', src: ['joch', 'team'], artist: true,
    born: '1974, Leonberg', basedIn: { en: 'Carinthia', de: 'Kärnten' },
    link: { url: 'https://www.instagram.com/melanie_joch/', title: 'Instagram', kind: 'social' },
    fn: { en: 'Deputy treasurer', de: 'Kassier-Stellvertretung' },
    lede: { en: 'Graphic designer and artist from Leonberg, in Carinthia since 1998.', de: 'Grafik-Designerin und Künstlerin aus Leonberg, seit 1998 in Kärnten.' },
    about: { en: ['Melanie Joch was born in 1974 in Leonberg, Germany, and studied communication design, with a focus on text and image, at the Merz Akademie in Stuttgart. She moved to Carinthia in 1998 and works as a graphic designer and freelance artist; most of her works are abstract and large. In 2025 the Galerie im Stiegenhaus in Seeboden showed her exhibition “Gegensätze” (17 March–14 May). She is deputy treasurer of the association kultur.im.puls, which runs the gallery.'],
      de: ['Melanie Joch wurde 1974 in Leonberg in Deutschland geboren und studierte Kommunikations-Design mit Schwerpunkt Text-Bild-Konzeption an der Merz Akademie in Stuttgart. 1998 zog sie nach Kärnten; sie arbeitet als Grafik-Designerin und freischaffende Künstlerin, meist abstrakt und großformatig. 2025 zeigte die Galerie im Stiegenhaus in Seeboden ihre Ausstellung „Gegensätze“ (17. März–14. Mai). Im Verein kultur.im.puls, der die Galerie betreibt, ist sie Kassier-Stellvertreterin.'] } },
  { first: 'Heidi', last: 'Pucher', slug: 'heidi-pucher', src: ['team', 'article'],
    fn: { en: 'Exhibition organisation', de: 'Ausstellungsorganisation' },
    lede: { en: 'Organises the exhibitions of the association kultur.im.puls in Seeboden.', de: 'Organisiert die Ausstellungen des Vereins kultur.im.puls in Seeboden.' },
    about: { en: ['Heidi Pucher organises the exhibitions of the association kultur.im.puls in the Galerie im Stiegenhaus in the Impuls Center and in the Seeboden municipal office. At the end of 2024 she presented the programme for 2025.'],
      de: ['Heidi Pucher organisiert die Ausstellungen des Vereins kultur.im.puls in der Galerie im Stiegenhaus im Impuls Center und im Gemeindeamt Seeboden. Ende 2024 stellte sie das Programm für 2025 vor.'] } },
  { first: 'Gerhild', last: 'Göllner', slug: 'gerhild-goellner', src: ['team'],
    fn: { en: 'Press and public relations, workshop organisation', de: 'Presse und Öffentlichkeitsarbeit, Workshoporganisation' },
    lede: { en: 'Press and public relations of the association kultur.im.puls in Seeboden.', de: 'Presse und Öffentlichkeitsarbeit des Vereins kultur.im.puls in Seeboden.' },
    about: { en: ['Gerhild Göllner is in charge of press and public relations of the association kultur.im.puls and organises workshops for it. The association runs the Galerie im Stiegenhaus in Seeboden.'],
      de: ['Gerhild Göllner ist im Verein kultur.im.puls für Presse und Öffentlichkeitsarbeit zuständig und organisiert Workshops. Der Verein betreibt die Galerie im Stiegenhaus in Seeboden.'] } },
  { first: 'Maria', last: 'Sandner', slug: 'maria-sandner', src: ['team', 'article'],
    fn: { en: 'Website and Facebook, Artothek, workshop organisation', de: 'Homepage und Facebook, Artothek, Workshoporganisation' },
    lede: { en: 'Runs the Artothek of the association kultur.im.puls in Seeboden.', de: 'Betreut die Artothek des Vereins kultur.im.puls in Seeboden.' },
    about: { en: ['Maria Sandner looks after the website and the Facebook page of the association kultur.im.puls and organises workshops for it. She runs its Artothek, the online platform <a href="https://artothek-impuls.at/">artothek-impuls.at</a>, which lends more than 170 original works of art for a small fee.'],
      de: ['Maria Sandner betreut die Homepage und die Facebook-Seite des Vereins kultur.im.puls und organisiert Workshops. Sie betreut und koordiniert seine Artothek, die Online-Plattform <a href="https://artothek-impuls.at/">artothek-impuls.at</a>, die über 170 Original-Kunstwerke für ein geringes Entgelt zum Ausleihen anbietet.'] } },
  { first: 'Margret', last: 'Joch', slug: 'margret-joch', src: ['team', 'article'],
    fn: { en: 'Workshop organisation, honorary member', de: 'Workshoporganisation, Ehrenmitglied' },
    lede: { en: 'Organises workshops for the association kultur.im.puls in Seeboden; honorary member.', de: 'Organisiert Workshops für den Verein kultur.im.puls in Seeboden; Ehrenmitglied.' },
    about: { en: ['Margret Joch was on the board of the association kultur.im.puls until 2024; when a new board took over, the association made her an honorary member. She organises workshops for it. The association runs the Galerie im Stiegenhaus in Seeboden.'],
      de: ['Margret Joch gehörte bis 2024 dem Vorstand des Vereins kultur.im.puls an; beim Wechsel zum neuen Vorstand ernannte der Verein sie zum Ehrenmitglied. Sie organisiert Workshops für den Verein, der die Galerie im Stiegenhaus in Seeboden betreibt.'] } },
  { first: 'Gerhart', last: 'Weihs', slug: 'gerhart-weihs', src: ['weihs', 'team', 'article'], artist: true,
    fn: { en: 'Poetry Slam and poetry festival, honorary member', de: 'Poetry Slam und Poesiefestival, Ehrenmitglied' },
    lede: { en: 'Artist; leads the poetry festival of the association kultur.im.puls in Seeboden.', de: 'Künstler; leitet das Poesie-Festival des Vereins kultur.im.puls in Seeboden.' },
    about: { en: ['Gerhart Weihs is an artist. In 2022 the association kultur.im.puls showed his exhibition “Längsschnitt” in the Impuls Center in Seeboden (8 April–9 June): works from 32 years, shown for his 80th birthday, a year later than planned.', 'He was on the board of the association until 2024; when a new board took over, the association made him an honorary member. He leads its poetry festival and organises its Poetry Slam.'],
      de: ['Gerhart Weihs ist Künstler. 2022 zeigte der Verein kultur.im.puls im Impuls Center in Seeboden seine Ausstellung „Längsschnitt“ (8. April–9. Juni): Arbeiten aus 32 Jahren, zu seinem 80. Geburtstag, um ein Jahr verschoben.', 'Bis 2024 gehörte er dem Vorstand des Vereins an; beim Wechsel zum neuen Vorstand ernannte der Verein ihn zum Ehrenmitglied. Er leitet das Poesie-Festival des Vereins und organisiert den Poetry Slam.'] } }
]

const ORG_ABOUT = {
  en: [
    'The association kultur.im.puls (ZVR 972619581) was founded in 2009 and runs the Galerie im Stiegenhaus, a staircase gallery over four floors of the Impuls Center in Seeboden, with a second exhibition space in the stairwell of the Seeboden municipal office. It sees itself as a platform for cultural impulses, art education and exchange across borders. Besides the exhibitions it organises “Kunst am Abend” in the centre of Seeboden, a Poetry Slam, a poetry festival, painting Saturdays, workshops and courses, and an Artothek: the online platform <a href="https://artothek-impuls.at/">artothek-impuls.at</a> lends more than 170 original works of art for a small fee.',
    'Carolin Meinl has chaired the association since 2024, with Wolfgang Daborer as vice chair; Peter Kleinfercher is its honorary chairman. When the board was renewed in 2024, in the association’s 15th year, the departing board members Margret Joch, Gerhart Weihs, Luzie Pinkas and Erika Drumel and the long-standing artistic adviser Gerold Sternig became honorary members. Heidi Pucher organises the exhibitions; Maria Sandner looks after the Artothek.'
  ],
  de: [
    'Der Verein kultur.im.puls (ZVR 972619581) besteht seit 2009 und betreibt die Galerie im Stiegenhaus, eine Galerie über vier Geschoße im Stiegenhaus des Impuls Centers in Seeboden, mit einem zweiten Ausstellungsort im Stiegenhaus des Gemeindeamts Seeboden. Er versteht sich als Plattform für kulturelle Impulse, Kunstvermittlung und Austausch über Grenzen hinweg. Neben den Ausstellungen veranstaltet er „Kunst am Abend“ im Seebodner Ortszentrum, einen Poetry Slam, ein Poesie-Festival, Mal-Samstage, Workshops und Kurse sowie eine Artothek: Die Online-Plattform <a href="https://artothek-impuls.at/">artothek-impuls.at</a> bietet über 170 Original-Kunstwerke für ein geringes Entgelt zum Ausleihen an.',
    'Obfrau ist seit 2024 Carolin Meinl, Stellvertreter Wolfgang Daborer, Ehrenobmann Peter Kleinfercher. Beim Wechsel zum neuen Vorstand 2024, im 15. Jahr des Vereins, wurden die scheidenden Vorstandsmitglieder Margret Joch, Gerhart Weihs, Luzie Pinkas und Erika Drumel sowie der langjährige künstlerische Berater Gerold Sternig zu Ehrenmitgliedern ernannt. Heidi Pucher organisiert die Ausstellungen, Maria Sandner betreut die Artothek.'
  ]
}
const ORG_SRC = ['verein', 'team', 'article', 'impressum', 'galerie']
const ORG_FIELDS = {
  address: 'Impuls Center, Thomas Morgenstern Platz 1, 9871 Seeboden am Millstätter See, Austria',
  logo: LOGO, image: PHOTO,
  en: {
    logo_alt: 'Logo of kultur.im.puls: the words “kultur” and “im.puls” on either side of an orange circle with a red drop',
    image_alt: 'Group photo of the board of kultur.im.puls Seeboden in 2024: twelve people, the departing members holding certificates of honorary membership; chair Carolin Meinl in front',
    image_caption: 'The new board around chair Carolin Meinl (front) and the departing board members, 2024 · Foto: kultur.im.puls Seeboden',
    lede: 'Association in Seeboden, founded in 2009, that runs the Galerie im Stiegenhaus in the Impuls Center.',
    description: 'Association in Seeboden, founded in 2009, that runs the Galerie im Stiegenhaus and organises Kunst am Abend, a Poetry Slam, a poetry festival and an Artothek.'
  },
  de: {
    logo_alt: 'Logo von kultur.im.puls: die Wörter „kultur“ und „im.puls“ links und rechts eines orangen Kreises mit einem roten Tropfen',
    image_alt: 'Gruppenfoto des Vorstands von kultur.im.puls Seeboden 2024: zwölf Personen, die scheidenden Mitglieder mit Urkunden der Ehrenmitgliedschaft; Obfrau Carolin Meinl vorne',
    image_caption: 'Der neue Vorstand um Obfrau Carolin Meinl (vorne) und die scheidenden Vorstandsmitglieder, 2024 · Foto: kultur.im.puls Seeboden',
    lede: 'Verein in Seeboden, gegründet 2009, der die Galerie im Stiegenhaus im Impuls Center betreibt.',
    description: 'Verein in Seeboden, gegründet 2009, der die Galerie im Stiegenhaus betreibt und Kunst am Abend, einen Poetry Slam, ein Poesie-Festival und eine Artothek veranstaltet.'
  }
}
const NEW_LINKS = [
  { url: 'https://artothek-impuls.at/', title: 'artothek-impuls.at', kind: 'website' },
  { url: 'https://www.youtube.com/channel/UCXgmZJD1yPAkA8z_tZBEBPQ', title: 'YouTube', kind: 'social' }
]

const { api } = await login(loadEnv())
const say = (line) => console.log(dryRun ? `~ ${line}` : line)
const enc = encodeURIComponent

const [org] = await api('GET', `/items/pp_organisations?filter[slug][_eq]=${ORG_SLUG}&fields=id,translations.id,translations.languages_code,members.person.slug,websites.websites_id.url&limit=1`)
if (!org) throw new Error('organisation missing')

// 1. Persons
const personId = {}
for (const p of PEOPLE) {
  const [found] = await api('GET', `/items/pp_persons?filter[slug][_eq]=${p.slug}&fields=id&limit=1`)
  if (found) { personId[p.slug] = found.id; say(`= person ${p.slug}`); continue }
  if (p.existing) throw new Error(`expected ${p.slug} to exist`)
  const record = {
    status: 'draft', first_name: p.first, last_name: p.last, slug: p.slug,
    born: p.born ?? null, based_in: p.basedIn?.en ?? null,
    lede: p.lede.en, about_html: html(p.about.en, p.src, 'en'),
    roles: p.artist ? [{ roles_id: ARTIST }] : [],
    websites: p.link ? [{ websites_id: { status: 'published', url: p.link.url, title: p.link.title, kind: p.link.kind,
      translations: [{ languages_code: 'en', title: p.link.title }, { languages_code: 'de', title: p.link.title }] }, sort: 1 }] : [],
    translations: ['en', 'de'].map((lang) => ({ languages_code: lang, lede: p.lede[lang], about_html: html(p.about[lang], p.src, lang), based_in: p.basedIn?.[lang] ?? null }))
  }
  if (dryRun) { say(`+ person ${p.slug}: ${record.lede}`); personId[p.slug] = `<new ${p.slug}>`; continue }
  const created = await api('POST', '/items/pp_persons', record)
  personId[p.slug] = created.id
  say(`+ person ${p.slug} ${created.id}`)
}

// 2. Organisation: fields, about, memberships, links
const haveMember = new Set(org.members.map((m) => m.person?.slug))
const members = PEOPLE.filter((p) => !haveMember.has(p.slug)).map((p) => ({
  person: personId[p.slug], function: p.fn.en,
  translations: [{ languages_code: 'en', function: p.fn.en }, { languages_code: 'de', function: p.fn.de }]
}))
const haveUrl = new Set(org.websites.map((w) => w.websites_id?.url))
const links = []
for (const link of NEW_LINKS.filter((l) => !haveUrl.has(l.url))) {
  const [existing] = await api('GET', `/items/pp_websites?filter[url][_eq]=${enc(link.url)}&fields=id&limit=1`)
  links.push(existing ? { websites_id: existing.id } : { websites_id: { status: 'published', url: link.url, title: link.title, kind: link.kind,
    translations: [{ languages_code: 'en', title: link.title }, { languages_code: 'de', title: link.title }] } })
}
const translation = (lang) => org.translations.find((t) => t.languages_code === lang).id
const payload = {
  address: ORG_FIELDS.address, logo: ORG_FIELDS.logo, image: ORG_FIELDS.image,
  ...ORG_FIELDS.en, about_html: html(ORG_ABOUT.en, ORG_SRC, 'en'),
  members: { create: members, update: [], delete: [] },
  websites: { create: links.map((l, i) => ({ ...l, sort: 4 + i })), update: [], delete: [] },
  translations: { create: [], delete: [], update: ['en', 'de'].map((lang) => ({ id: translation(lang), ...ORG_FIELDS[lang], about_html: html(ORG_ABOUT[lang], ORG_SRC, lang) })) }
}
if (dryRun) {
  say(`organisation: ${members.length} memberships, ${links.length} links`)
  console.log(JSON.stringify(payload, null, 1).slice(0, 3000))
} else {
  await api('PATCH', `/items/pp_organisations/${org.id}`, payload)
  say(`organisation updated: ${members.length} memberships, ${links.length} links`)
}
