// Completes the exhibition "Klaus Zlattinger & Friends" and its artists in production Directus
// (plans/2026-11-11__klaus-zlattinger-und-friends.md). Run from the directus folder:
//   DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-11__klaus-zlattinger-und-friends/scripts/record.mjs [--dry-run]
// Safe to run again: a person is created only when the slug is missing, a filled field is not
// overwritten, a participation only when that person/role pair is missing, a link only once.
import { loadEnv, login } from '../../../directus/scripts/lib.mjs'

const dryRun = process.argv.includes('--dry-run')
const EXHIBITION = 'klaus-zlattinger-and-friends'
const ROLE = { artist: '37b28cb2-e0ba-4081-b51b-836149de0a06', organiser: '095bd21b-4c58-4a42-a6c8-e5d41e91f16f' }
const IMAGE = 'b2df06cc-72a0-499f-8a75-3a57475d18da'

const SRC = {
  kipZl: { url: 'https://kultur-impuls.com/events/ausstellung-klauszlattinger/', en: '“Ausstellung Klaus Zlattinger and Friends”, kultur-impuls.com', de: '„Ausstellung Klaus Zlattinger and Friends“, kultur-impuls.com' },
  kipVern: { url: 'https://kultur-impuls.com/events/vernissage-klaus-zlattinger-and-friends-2/', en: '“Vernissage Klaus Zlattinger and Friends”, kultur-impuls.com', de: '„Vernissage Klaus Zlattinger and Friends“, kultur-impuls.com' },
  spittal: { url: 'https://www.spittal-drau.at/kultur/galerie/geschichte', en: '“Geschichte”, Galerie im Schloss Porcia, spittal-drau.at', de: '„Geschichte“, Galerie im Schloss Porcia, spittal-drau.at' },
  artothekZl: { url: 'https://www.artothek-impuls.at/produkt/klaus-zlattinger/', en: '“Klaus Zlattinger”, artothek-impuls.at', de: '„Klaus Zlattinger“, artothek-impuls.at' },
  stadtgalerie: { url: 'https://www.stadtgalerie.net/fileadmin/user_upload/Stadtgalerie_Klagenfurt/Living_Studio/Ausstellungsarchiv/2017/CHRISTINE_DE_PAULI_-_KLAUS_ZLATTINGER/Zur_Ausstellung_1_.pdf', en: '“Zur Ausstellung – Christine de Pauli, Klaus Zlattinger – Die gestundete Zeit”, Stadtgalerie Klagenfurt, 2017', de: '„Zur Ausstellung – Christine de Pauli, Klaus Zlattinger – Die gestundete Zeit“, Stadtgalerie Klagenfurt, 2017' },
  dolomiten: { url: 'https://www.dolomitenstadt.at/2013/09/12/i-can-see-your-house-from-here/', en: '“Kunstwerkstatt: ‘I can see your house from here’”, dolomitenstadt.at, 12 September 2013', de: '„Kunstwerkstatt: ‚I can see your house from here‘“, dolomitenstadt.at, 12. 9. 2013' },
  matinee: { url: 'https://www.meinbezirk.at/spittal/c-leute/emotionale-matinee-fuer-klaus-zlattinger_a2397825', en: '“Emotionale Matinee für Klaus Zlattinger”, meinbezirk.at, 5 February 2018', de: '„Emotionale Matinee für Klaus Zlattinger“, meinbezirk.at, 5. 2. 2018' },
  voukBio: { url: 'https://www.vouk.at/?page_id=4', en: '“Biographie / Biografija”, vouk.at', de: '„Biographie / Biografija“, vouk.at' },
  kglu: { url: 'https://www.glu-sg.si/en/?p=8729', en: '“Karl Vouk”, Koroška galerija likovnih umetnosti, glu-sg.si', de: '„Karl Vouk“, Koroška galerija likovnih umetnosti, glu-sg.si' },
  kipVouk: { url: 'https://kultur-impuls.com/events/ausstellung-karl-vouk/', en: '“Ausstellung Karl Vouk – Trans.Form”, kultur-impuls.com', de: '„Ausstellung Karl Vouk – Trans.Form“, kultur-impuls.com' },
  ederBio: { url: 'https://www.othmareder.ch/uploads/doc/Biografie-26_Othmar_Website.pdf', en: '“Biografie”, othmareder.ch, 2026', de: '„Biografie“, othmareder.ch, 2026' },
  ederBasis: { url: 'https://www.basis-wien.at/db/person/53828', en: '“Othmar Eder”, basis-wien.at', de: '„Othmar Eder“, basis-wien.at' },
  dpBio: { url: 'https://www.stadtgalerie.net/fileadmin/user_upload/Stadtgalerie_Klagenfurt/Living_Studio/Ausstellungsarchiv/2017/CHRISTINE_DE_PAULI_-_KLAUS_ZLATTINGER/Biographie-Christine_de_Pauli.pdf', en: '“Biographie Christine de Pauli”, Stadtgalerie Klagenfurt, 2017', de: '„Biographie Christine de Pauli“, Stadtgalerie Klagenfurt, 2017' },
  walkerDp: { url: 'https://www.galerie-walker.at/christine-de-pauli-1/', en: '“Christine de Pauli”, galerie-walker.at', de: '„Christine de Pauli“, galerie-walker.at' },
  dp2026: { url: 'https://www.mein-klagenfurt.at/aktuelle-pressemeldungen/pressemeldungen-maerz-2026/gestaltete-zeit-christine-de-pauli-in-der-alpen-adria-galerie', en: '“‘Gestaltete Zeit’ Christine de Pauli in der Alpen-Adria-Galerie”, mein-klagenfurt.at, 4 March 2026', de: '„‚Gestaltete Zeit‘ Christine de Pauli in der Alpen-Adria-Galerie“, mein-klagenfurt.at, 4. 3. 2026' },
  kipDp: { url: 'https://kultur-impuls.com/events/ausstellung-christine-de-pauli/', en: '“Ausstellung Christine de Pauli”, kultur-impuls.com', de: '„Ausstellung Christine de Pauli“, kultur-impuls.com' },
  janusWiki: { url: 'https://de.wikipedia.org/wiki/Gustav_Janu%C5%A1', en: '“Gustav Januš”, de.wikipedia.org', de: '„Gustav Januš“, de.wikipedia.org' },
  janusOrf: { url: 'https://volksgruppen.orf.at/slovenci/meldungen/stories/3273790/', en: '“Maler und Lyriker Gustav Januš ist 85”, volksgruppen.orf.at, 19 September 2024', de: '„Maler und Lyriker Gustav Januš ist 85“, volksgruppen.orf.at, 19. 9. 2024' },
  janusLit: { url: 'https://literatur-platforma.at/de/autor-innen/gustav-janus/', en: '“Gustav Januš”, literatur-platforma.at', de: '„Gustav Januš“, literatur-platforma.at' }
}
const sources = (keys, lang) => {
  const label = keys.length === 1 ? (lang === 'en' ? 'Source' : 'Quelle') : (lang === 'en' ? 'Sources' : 'Quellen')
  return `<p>${label}</p><ul>${keys.map((key) => `<li><a href="${SRC[key].url}">${SRC[key][lang]}</a></li>`).join('')}</ul>`
}
const html = (paragraphs, keys, lang) => paragraphs.map((p) => `<p>${p}</p>`).join('') + sources(keys, lang)

const PERSONS = [
  // replaceAbout: the old text was a two-sentence placeholder from the announcement (2026-10-14).
  { slug: 'klaus-zlattinger', born: '1956', basedIn: { en: 'Spittal an der Drau', de: 'Spittal an der Drau' }, replaceAbout: true,
    src: ['artothekZl', 'spittal', 'stadtgalerie', 'dolomiten', 'matinee', 'kipZl'],
    about: {
      en: ['Klaus Zlattinger (1956–2016) studied at the Pädagogische Akademie in Klagenfurt under Siegfried Tragatschnig. From 1993 to 2005 he ran the Galerie im Schloss Porcia in Spittal an der Drau together with Ingrid Weichselberger. He was a member of the Kunstverein Kärnten.',
        'His prints start from photographs, mostly taken on travels, which he cut, filtered and changed in colour on the computer; he also made drawings and, in 2016, the video installation “Die gestundete Zeit”. In 2013 he exhibited with his long-time friend Othmar Eder at the Kunstwerkstatt Lienz. He died in December 2016 after a serious illness. In 2017 the Stadtgalerie Klagenfurt showed “Die gestundete Zeit” together with works by Christine de Pauli; in 2018 the Galerie im Schloss Porcia showed “Klaus Zlattinger in Memoriam”. In 2026 the association kultur.im.puls marks the tenth anniversary of his death with the exhibition “Klaus Zlattinger &amp; Friends” in the Galerie im Stiegenhaus in Seeboden.'],
      de: ['Klaus Zlattinger (1956–2016) studierte an der Pädagogischen Akademie in Klagenfurt bei Siegfried Tragatschnig. Von 1993 bis 2005 leitete er mit Ingrid Weichselberger die Galerie im Schloss Porcia in Spittal an der Drau. Er war Mitglied des Kunstvereins Kärnten.',
        'Seine Fotografiken gehen von Fotos aus, meist auf Reisen entstanden, die er am Computer beschnitt, filterte und farblich veränderte; dazu kommen Zeichnungen und 2016 die Videoinstallation „Die gestundete Zeit“. 2013 stellte er mit seinem langjährigen Freund Othmar Eder in der Kunstwerkstatt Lienz aus. Er starb im Dezember 2016 nach schwerer Krankheit. 2017 zeigte die Stadtgalerie Klagenfurt „Die gestundete Zeit“ gemeinsam mit Arbeiten von Christine de Pauli, 2018 die Galerie im Schloss Porcia „Klaus Zlattinger in Memoriam“. 2026 erinnert der Verein kultur.im.puls mit der Ausstellung „Klaus Zlattinger &amp; Friends“ in der Galerie im Stiegenhaus in Seeboden an seinen zehnten Todestag.'] } },
  { slug: 'karl-vouk', born: '1958, Klagenfurt', basedIn: { en: 'Rinkolach near Bleiburg', de: 'Rinkolach bei Bleiburg' },
    link: { url: 'https://www.vouk.at/', title: 'vouk.at', kind: 'website' },
    src: ['voukBio', 'kglu', 'kipVouk'],
    lede: { en: 'Artist and architect from Klagenfurt: drawing, painting, photography, film and art in public space.', de: 'Künstler und Architekt aus Klagenfurt: Zeichnung, Malerei, Fotografie, Film und Kunst im öffentlichen Raum.' },
    about: {
      en: ['Karl Vouk was born in 1958 in Klagenfurt/Celovec and finished school at the Bundesgymnasium für Slowenen there in 1976. From 1976 to 1986 he studied architecture at the Technische Universität and the Akademie der bildenden Künste in Vienna; during his studies he worked for Friedrich Achleitner, Rob Krier and Gustav Peichl, among others. He works in drawing, painting, photography, film, objects and art in public space and lives in Rinkolach/Rinkole near Bleiburg/Pliberk.',
        'He started and coordinated cross-border projects such as Crossover (Austria and Slovenia, Kunstverein Kärnten, 2004–2006) and Bilder einer Landschaft (2019–2021), and projects of remembrance such as Denk mal: Deportation! (2012) and the Partisanendenkmal Velden (2019). From 2005 to 2009 he painted nine “Kärntner Triptychen”; some of them are in the collection of the Koroška galerija likovnih umetnosti in Slovenj Gradec. In 2025 kultur.im.puls showed his exhibition “Trans.Form” in Seeboden.'],
      de: ['Karl Vouk wurde 1958 in Klagenfurt/Celovec geboren und maturierte dort 1976 am Bundesgymnasium für Slowenen. Von 1976 bis 1986 studierte er Architektur an der Technischen Universität und der Akademie der bildenden Künste in Wien; während des Studiums arbeitete er unter anderem für Friedrich Achleitner, Rob Krier und Gustav Peichl. Er arbeitet mit Zeichnung, Malerei, Fotografie, Film, Objekten und Kunst im öffentlichen Raum und lebt in Rinkolach/Rinkole bei Bleiburg/Pliberk.',
        'Er initiierte und koordinierte grenzüberschreitende Projekte wie Crossover (Österreich und Slowenien, Kunstverein Kärnten, 2004–2006) und Bilder einer Landschaft (2019–2021) sowie Erinnerungsprojekte wie Denk mal: Deportation! (2012) und das Partisanendenkmal Velden (2019). Von 2005 bis 2009 malte er neun „Kärntner Triptychen“; einige davon sind in der Sammlung der Koroška galerija likovnih umetnosti in Slovenj Gradec. 2025 zeigte kultur.im.puls seine Ausstellung „Trans.Form“ in Seeboden.'] } },
  { slug: 'otmar-eder', firstName: 'Othmar', born: '1955, Kufstein', basedIn: { en: 'Stettfurt, Switzerland', de: 'Stettfurt, Schweiz' },
    link: { url: 'https://www.othmareder.ch/', title: 'othmareder.ch', kind: 'website' },
    src: ['ederBio', 'ederBasis', 'dolomiten'],
    lede: { en: 'Artist from Kufstein, in Switzerland since 1982: drawing, video, photography, painting and objects.', de: 'Künstler aus Kufstein, seit 1982 in der Schweiz: Zeichnung, Video, Fotografie, Malerei und Objekte.' },
    about: {
      en: ['Othmar Eder (also written Otmar) was born in 1955 in Kufstein and studied at the Akademie der bildenden Künste in Vienna from 1977 to 1982, where he received the Meisterschulpreis in 1978 and 1982. He has lived in Switzerland since 1982, in Stettfurt in the canton of Thurgau since 2001, and works in drawing, video, photography, painting and objects.',
        'His awards include the Rome scholarship of the Austrian federal ministry (1989), the Förderpreis des Landes Tirol (1996), the Deutsch-Schweizerischer Kunstpreis (2001) and the Thurgauer Kulturpreis (2025). The Tiroler Landesmuseum Ferdinandeum and the Kunstmuseum Thurgau, among others, hold works by him. The Kunstverein Kärnten showed his work in 2009, 2013 and 2019; in 2013 he exhibited with his long-time friend Klaus Zlattinger at the Kunstwerkstatt Lienz.'],
      de: ['Othmar Eder (auch Otmar geschrieben) wurde 1955 in Kufstein geboren und studierte von 1977 bis 1982 an der Akademie der bildenden Künste in Wien, wo er 1978 und 1982 den Meisterschulpreis erhielt. Seit 1982 lebt er in der Schweiz, seit 2001 in Stettfurt im Kanton Thurgau, und arbeitet mit Zeichnung, Video, Fotografie, Malerei und Objekten.',
        'Zu seinen Auszeichnungen gehören das Rom-Stipendium des österreichischen Bundesministeriums (1989), der Förderpreis des Landes Tirol (1996), der Deutsch-Schweizerische Kunstpreis (2001) und der Thurgauer Kulturpreis (2025). Unter anderem besitzen das Tiroler Landesmuseum Ferdinandeum und das Kunstmuseum Thurgau Arbeiten von ihm. Der Kunstverein Kärnten zeigte seine Arbeiten 2009, 2013 und 2019; 2013 stellte er mit seinem langjährigen Freund Klaus Zlattinger in der Kunstwerkstatt Lienz aus.'] } },
  { slug: 'christine-de-pauli', born: '1946, Fai della Paganella', basedIn: { en: 'Klagenfurt', de: 'Klagenfurt' },
    src: ['dpBio', 'walkerDp', 'dp2026', 'kipDp'],
    lede: { en: 'Painter, born 1946 near Trento, in Klagenfurt since 1976; mostly egg tempera on canvas and paper.', de: 'Malerin, geboren 1946 bei Trient, seit 1976 in Klagenfurt; meist Eitempera auf Leinwand und Papier.' },
    about: {
      en: ['Christine De Pauli was born in 1946 in Fai della Paganella near Trento and grew up in Klagenfurt. From 1967 to 1971 she studied painting with Josef Mikl at the Akademie der bildenden Künste in Vienna. She paints, often in egg tempera, on canvas and paper, and gives her paintings no titles. She has lived in Klagenfurt since 1976.',
        'Her solo exhibitions include the Kärntner Landesgalerie, the Neue Galerie Wien, the Gorenjski muzej in Kranj, the Galerie im Schloss Porcia and the Museum der Stadt Lienz; the Albertina, the state of Carinthia and the Republic of Austria own works by her. In 2017 the Stadtgalerie Klagenfurt showed “Die gestundete Zeit” with Klaus Zlattinger; her two-part work “Addio Klaus” is dedicated to him. In 2023 kultur.im.puls showed “Auf der Suche nach…” in Seeboden; in 2026 the Alpen-Adria-Galerie in Klagenfurt showed “Gestaltete Zeit” for her 80th birthday.'],
      de: ['Christine De Pauli wurde 1946 in Fai della Paganella bei Trient geboren und wuchs in Klagenfurt auf. Von 1967 bis 1971 studierte sie Malerei bei Josef Mikl an der Akademie der bildenden Künste in Wien. Sie malt, oft in Eitempera, auf Leinwand und Papier und gibt ihren Bildern keine Titel. Seit 1976 lebt sie in Klagenfurt.',
        'Einzelausstellungen hatte sie unter anderem in der Kärntner Landesgalerie, der Neuen Galerie Wien, dem Gorenjski muzej in Kranj, der Galerie im Schloss Porcia und dem Museum der Stadt Lienz; die Albertina, das Land Kärnten und die Republik Österreich besitzen Arbeiten von ihr. 2017 zeigte die Stadtgalerie Klagenfurt „Die gestundete Zeit“ mit Klaus Zlattinger; ihre zweiteilige Arbeit „Addio Klaus“ ist ihm gewidmet. 2023 zeigte kultur.im.puls „Auf der Suche nach…“ in Seeboden, 2026 die Alpen-Adria-Galerie in Klagenfurt „Gestaltete Zeit“ zu ihrem 80. Geburtstag.'] } },
  { slug: 'gustav-janus', create: { first: 'Gustav', last: 'Januš' }, born: '1939, Zell-Pfarre', basedIn: { en: 'Frießnitz, St. Jakob im Rosental', de: 'Frießnitz, St. Jakob im Rosental' },
    src: ['janusWiki', 'janusOrf', 'janusLit'],
    lede: { en: 'Painter and poet from Zell-Pfarre/Sele-Fara who writes in Slovene; lives in Frießnitz/Breznica.', de: 'Maler und Dichter aus Zell-Pfarre/Sele-Fara, der slowenisch schreibt; lebt in Frießnitz/Breznica.' },
    about: {
      en: ['Gustav Januš was born on 19 September 1939 in Zell-Pfarre/Sele-Fara in Carinthia. After the Gymnasium Tanzenberg/Plešivec and a year of theology in Klagenfurt he trained as a primary-school teacher; from 1971 to 1998 he taught Slovene, art, physics and chemistry at the Hauptschule in St. Jakob im Rosental/Šentjakob v Rožu. He lives in Frießnitz/Breznica.',
        'As a poet and painter he is self-taught. He writes only in Slovene and translates from German into Slovene; from 1961 he published in the magazine mladje. Peter Handke translated several of his volumes of poetry into German. He received the Petrarca-Preis in 1984 and the Humbert-Fink-Literaturpreis of the city of Klagenfurt in 2018. He has exhibited his paintings since 1969.'],
      de: ['Gustav Januš wurde am 19. September 1939 in Zell-Pfarre/Sele-Fara in Kärnten geboren. Nach dem Gymnasium Tanzenberg/Plešivec und einem Jahr Theologie in Klagenfurt wurde er Volksschullehrer; von 1971 bis 1998 unterrichtete er Slowenisch, Bildnerische Erziehung, Physik und Chemie an der Hauptschule in St. Jakob im Rosental/Šentjakob v Rožu. Er lebt in Frießnitz/Breznica.',
        'Als Dichter und Maler ist er Autodidakt. Er schreibt ausschließlich slowenisch und übersetzt aus dem Deutschen ins Slowenische; ab 1961 veröffentlichte er in der Zeitschrift mladje. Peter Handke übersetzte mehrere seiner Gedichtbände ins Deutsche. Er erhielt 1984 den Petrarca-Preis und 2018 den Humbert-Fink-Literaturpreis der Stadt Klagenfurt. Seit 1969 stellt er seine Bilder aus.'] } }
]

const EX_SRC = ['kipZl', 'kipVern', 'spittal']
const EX = {
  en: {
    summary: 'Announcement: an exhibition for the tenth anniversary of the death of Klaus Zlattinger, with works by Wolfgang Daborer, Christine De Pauli, Othmar Eder, Karl Vouk and Gustav Januš.',
    description: ['Announcement. This exhibition has not opened yet. The association kultur.im.puls marks the tenth anniversary of the death of Klaus Zlattinger (1956–2016), artist, art educator and gallerist, who ran the Galerie im Schloss Porcia in Spittal an der Drau from 1993 to 2005. The exhibition presents a cross-section of his work together with works by artist friends: Wolfgang Daborer, Christine De Pauli, Othmar Eder, Karl Vouk and Gustav Januš. Wolfgang Daborer organises it. At the vernissage Christine Strobl-Oman reads from the poetry volume “alles leben”, which includes photographic works by Zlattinger. Further works are on view in the Seeboden municipal office.'],
    image_alt: 'A black, ink-like patch over green brushstrokes on white: the image of kultur.im.puls for the exhibition (© kultur.im.puls / the artist)'
  },
  de: {
    summary: 'Ankündigung: eine Ausstellung zum zehnten Todestag von Klaus Zlattinger, mit Arbeiten von Wolfgang Daborer, Christine De Pauli, Othmar Eder, Karl Vouk und Gustav Januš.',
    description: ['Ankündigung. Diese Ausstellung ist noch nicht eröffnet. Der Verein kultur.im.puls erinnert an den zehnten Todestag von Klaus Zlattinger (1956–2016), Künstler, Kunstvermittler und Galerist, der von 1993 bis 2005 die Galerie im Schloss Porcia in Spittal an der Drau leitete. Die Ausstellung gibt einen Querschnitt durch sein Werk und zeigt dazu Arbeiten befreundeter Künstler: Wolfgang Daborer, Christine De Pauli, Othmar Eder, Karl Vouk und Gustav Januš. Organisiert wird sie von Wolfgang Daborer. Bei der Vernissage liest Christine Strobl-Oman aus dem Lyrikband „alles leben“, der Fotografiken von Zlattinger enthält. Weitere Arbeiten sind im Marktgemeindeamt Seeboden zu sehen.'],
    image_alt: 'Ein schwarzer, tuscheartiger Fleck über grünen Pinselstrichen auf Weiß: das Bild von kultur.im.puls zur Ausstellung (© kultur.im.puls / Künstler)'
  }
}

const { api } = await login(loadEnv())
const say = (line) => console.log(dryRun ? `~ ${line}` : line)
const enc = encodeURIComponent
const fill = (current, value, replace = false) => (replace || current === null || current === undefined || current === '') ? (current === value ? undefined : value) : undefined

// 1. Persons
const personId = {}
for (const p of PERSONS) {
  const [rec] = await api('GET', `/items/pp_persons?filter[slug][_eq]=${p.slug}&fields=id,status,first_name,born,based_in,lede,about_html,roles.roles_id,websites.websites_id.url,translations.id,translations.languages_code,translations.lede,translations.about_html,translations.based_in&limit=1`)
  const linkRow = async () => {
    if (!p.link) return []
    if (rec?.websites?.some((w) => w.websites_id?.url === p.link.url)) return []
    const [existing] = await api('GET', `/items/pp_websites?filter[url][_eq]=${enc(p.link.url)}&fields=id&limit=1`)
    return [existing ? { websites_id: existing.id, sort: 1 } : { websites_id: { status: 'published', url: p.link.url, title: p.link.title, kind: p.link.kind,
      translations: [{ languages_code: 'en', title: p.link.title }, { languages_code: 'de', title: p.link.title }] }, sort: 1 }]
  }
  if (!rec) {
    if (!p.create) throw new Error(`${p.slug} missing`)
    const record = { status: 'draft', first_name: p.create.first, last_name: p.create.last, slug: p.slug, born: p.born, based_in: p.basedIn.en,
      lede: p.lede.en, about_html: html(p.about.en, p.src, 'en'), roles: [{ roles_id: ROLE.artist }], websites: await linkRow(),
      translations: ['en', 'de'].map((l) => ({ languages_code: l, lede: p.lede[l], about_html: html(p.about[l], p.src, l), based_in: p.basedIn[l] })) }
    if (dryRun) { say(`+ person ${p.slug}`); personId[p.slug] = `<new ${p.slug}>`; continue }
    personId[p.slug] = (await api('POST', '/items/pp_persons', record)).id
    say(`+ person ${p.slug} ${personId[p.slug]} (draft)`)
    continue
  }
  personId[p.slug] = rec.id
  const patch = {}
  if (p.firstName && rec.first_name !== p.firstName) patch.first_name = p.firstName
  for (const [field, value] of [['born', p.born], ['based_in', p.basedIn.en], ['lede', p.lede?.en], ['about_html', html(p.about.en, p.src, 'en')]]) {
    const v = value === undefined ? undefined : fill(rec[field], value, field === 'about_html' && p.replaceAbout)
    if (v !== undefined) patch[field] = v
  }
  const tUpdate = []
  for (const l of ['en', 'de']) {
    const t = rec.translations.find((x) => x.languages_code === l)
    const row = {}
    for (const [field, value] of [['based_in', p.basedIn[l]], ['lede', p.lede?.[l]], ['about_html', html(p.about[l], p.src, l)]]) {
      const v = value === undefined ? undefined : fill(t?.[field], value, field === 'about_html' && p.replaceAbout)
      if (v !== undefined) row[field] = v
    }
    if (Object.keys(row).length) tUpdate.push(t ? { id: t.id, ...row } : { languages_code: l, ...row })
  }
  if (tUpdate.length) patch.translations = { create: tUpdate.filter((t) => !t.id), update: tUpdate.filter((t) => t.id), delete: [] }
  const links = await linkRow()
  if (links.length) patch.websites = { create: links, update: [], delete: [] }
  if (!Object.keys(patch).length) { say(`= person ${p.slug} (nothing empty)`); continue }
  say(`~ person ${p.slug} (${rec.status}): ${Object.keys(patch).join(', ')}`)
  if (!dryRun) await api('PATCH', `/items/pp_persons/${rec.id}`, patch)
}

// 2. Exhibition
const [ex] = await api('GET', `/items/pp_exhibitions?filter[slug][_eq]=${EXHIBITION}&fields=id,participations.person,participations.role,translations.id,translations.languages_code&limit=1`)
const have = new Set(ex.participations.map((r) => `${r.person}:${r.role}`))
const wanted = [
  { person: personId['gustav-janus'], role: ROLE.artist, sort: 5 },
  { person: (await api('GET', '/items/pp_persons?filter[slug][_eq]=wolfgang-daborer&fields=id&limit=1'))[0].id, role: ROLE.organiser, sort: 6 }
].filter((r) => !have.has(`${r.person}:${r.role}`))
const tr = (l) => ex.translations.find((t) => t.languages_code === l).id
const exPatch = {
  image: IMAGE, image_alt: EX.en.image_alt, summary: EX.en.summary, description: html(EX.en.description, EX_SRC, 'en'),
  participations: { create: wanted, update: [], delete: [] },
  translations: { create: [], delete: [], update: ['en', 'de'].map((l) => ({ id: tr(l), image_alt: EX[l].image_alt, summary: EX[l].summary, description: html(EX[l].description, EX_SRC, l) })) }
}
say(`~ exhibition ${EXHIBITION}: image, texts, ${wanted.length} participations`)
if (!dryRun) await api('PATCH', `/items/pp_exhibitions/${ex.id}`, exPatch)
