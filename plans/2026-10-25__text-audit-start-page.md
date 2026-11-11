# Text audit: start page

Date: 2026-10-25. Rules: `docs/text-rules.md`. Status: steps 1–6 decided and done (2026-10-25).

Owner's decisions of 2026-10-25: the hero line "Vergängliche Welten. Dauerhaft bewahrt." stays. Scope words say "Österreich" (not "Kärnten"); the hero lede says "österreichischen Galerien".

Decisions: keep · change · delete · check (a fact or a behaviour must be confirmed first).
Global texts (header tagline, menu, footer) get their own audit.

## Header outline, top to bottom

The page-level view: every header and the line below it.

| Section | Header now | Header new | Line below now | Line below new |
|---|---|---|---|---|
| Hero (H1) | Vergängliche Welten. Dauerhaft bewahrt. | keep (owner) | Ein kuratiertes Archiv temporärer Ausstellungen und räumlicher Erinnerungen. | PERMAPHEMERA dokumentiert Ausstellungen in österreichischen Galerien als digitale 360°-Rundgänge, die ab dem letzten Tag der Laufzeit online verfügbar sind. (done) |
| Programm | Aktuelle / kommende Ausstellungen | keep | Entdecken Sie, was jetzt zu sehen ist und welche Ausstellungen als Nächstes ins Archiv kommen. | delete |
| Räume (was: Orte) | Galerien in ganz Österreich. | Galerien in Österreich (done) | Entdecken Sie Ausstellungsräume und Archive im ganzen Land. | delete |
| Ausstellungen | Zuletzt eröffnet | keep | Die neuesten Ausstellungen aus Galerien in Österreich. Wo es einen 360°-Rundgang gibt, … | delete (the hero says it now) |
| Künstler:innen | Künstler:innen im Archiv. | Von A bis Z (done) | Entdecken Sie Positionen, die in temporären Ausstellungen dokumentiert wurden. | delete |
| Die Archivmethode | Eine Ausstellung, bewahrt im Raum. | So entsteht ein 360°-Rundgang | Wir erfassen, was sich nicht aufbewahren lässt: Atmosphäre, Anordnung und Bewegung durch den Raum. | delete (the three steps say it) |
| Quote in the method section | Keine Replik. Ein Dokument der Präsenz. | delete | | |

Read as a list, the new headers name what each section holds: the offer, the dates, the
galleries, the newest exhibitions, the artists A–Z, the process. No header repeats its
eyebrow, and none is a two-part slogan.

## Step 1: hero (done 2026-10-25)

| Text | Now (de / en) | Decision | New (de / en) |
|---|---|---|---|
| H1 | Vergängliche Welten. Dauerhaft bewahrt. / Ephemeral worlds. Permanently preserved. | keep (owner: the brand line) | — |
| Lede | Ein kuratiertes Archiv temporärer Ausstellungen und räumlicher Erinnerungen. / A curated archive of temporary exhibitions and spatial memories. | change (owner's wording, then without the second "Ausstellung" and with Österreich) | PERMAPHEMERA dokumentiert Ausstellungen in österreichischen Galerien als digitale 360°-Rundgänge, die ab dem letzten Tag der Laufzeit online verfügbar sind. / PERMAPHEMERA documents exhibitions in Austrian galleries as digital 360° tours, available online from the last day of each run. |
| Button 1 | Das Archiv erkunden / Explore the archive | change (owner) | Alle Ausstellungen / All exhibitions, opens `/exhibitions/` |
| Button 2, wheel and scroll-cue labels | | keep | |

## Step 2: current and upcoming exhibitions (`landing.schedule`) (done 2026-10-25)

| Text | Now (de / en) | Decision | Reason | New (de / en) |
|---|---|---|---|---|
| Eyebrow | Programm / Programme | keep | | — |
| Header | Aktuelle / kommende Ausstellungen / Current / Upcoming exhibitions | keep (en: fix case) | Names the two groups below. | — / Current / upcoming exhibitions |
| Line below | Entdecken Sie, was jetzt zu sehen ist und welche Ausstellungen als Nächstes ins Archiv kommen. / See what is open now and the next exhibitions entering the archive. | delete | Invitation that repeats the header (§1.6); the cards show dates and tour states. | — |
| Group labels | Aktuelle Ausstellungen · Kommende Ausstellungen / Current · Upcoming | keep | | — |
| Link | Alle Ausstellungen ansehen / View all exhibitions | keep | Control. | — |

## Step 3: galleries (`landing.venues`) (done 2026-10-25)

| Text | Was (de / en) | Owner's decision (de / en) |
|---|---|---|
| Eyebrow | Orte / Venues | Räume / Spaces. "Orte" are the towns in Directus (`pp_locations`); the section lists galleries. |
| Header | Galerien in ganz Österreich. / Galleries across Austria. | Galerien in Österreich / Galleries in Austria |
| Line below | Entdecken Sie Ausstellungsräume und Archive im ganzen Land. / Explore exhibition spaces and archives across the country. | deleted |
| Scroll cue below the hero (`landing.hero.continue`) | Weiter zu den Orten / Continue to venues | Weiter zu den Galerien / Continue to galleries |
| Search | Orte durchsuchen · Galerien suchen… | removed (see "Four things") |

Still saying "Orte" for galleries: the sidebar count "Orte" and the link "Alle Orte anzeigen" (step 5).
Later, with the card texts: the gallery cards' link "Archiv öffnen" / "Open archive" opens the gallery's page.

## Step 4: newest exhibitions (`landing.exhibitions`) (done 2026-10-25: line below deleted)

| Text | Now (de / en) | Decision | Reason | New (de / en) |
|---|---|---|---|---|
| Eyebrow, header | Ausstellungen · Zuletzt eröffnet | keep | Set on 2026-10-25. | — |
| Line below | Die neuesten Ausstellungen aus Galerien in Österreich. Wo es einen 360°-Rundgang gibt, … | delete | The first sentence repeats the header; the tour sentence moves into the hero lede ("say each idea once"). | — |

## Step 5: artists (`landing.artists`, sidebar) (done 2026-10-25)

| Text | Was (de / en) | Owner's decision (de / en) |
|---|---|---|
| Eyebrow | Künstler:innen / Artists | keep |
| Header | Künstler:innen im Archiv. / Artists in the archive. | Von A bis Z / From A to Z |
| Line below | Entdecken Sie Positionen, die in temporären Ausstellungen dokumentiert wurden. / Browse practices documented across temporary exhibitions. | deleted |
| Sidebar count | Bewahrte Ausstellungen / Exhibitions preserved | Ausstellungen im Archiv / Exhibitions in the archive |
| Sidebar count (tablet ledger) | Orte / Venues | Galerien / Galleries |
| Sidebar list of towns | Städte / Cities | Städte und Orte / Cities and towns |
| Sidebar link | Alle Orte anzeigen / View all venues (scrolled to the gallery cards) | Alle Galerien / All galleries, opens `/venues/` |
| Button | Weitere Künstler:innen anzeigen / Show more artists | keep |

## Step 6: how a tour is made (`landing.method`) (done 2026-10-25)

Owner's decisions: this section may philosophise a little; the line below the header stays and explains why 360° shows more than flat photos; the scope fact says "Galerien und Ausstellungsorte in ganz Österreich" (value-free: no "ausgewählt", no "Kuration"); a new quote is chosen from 15 proposals.


| Text | Now (de / en) | Decision | Reason | New (de / en) |
|---|---|---|---|---|
| Eyebrow | Die Archivmethode / The archive method | keep | | — |
| Header | Eine Ausstellung, bewahrt im Raum. / An exhibition, retained in space. | change | Two-part slogan; "bewahrt im Raum" says nothing concrete. | So entsteht ein 360°-Rundgang / How a 360° tour is made |
| Line below | Wir erfassen, was sich nicht aufbewahren lässt: Atmosphäre, Anordnung und Bewegung durch den Raum. / We capture what cannot be kept: … | change (owner's direction) | No "Wir"; say why 360° captures more than flat photos. | Mit 360°-Kameras lassen sich die Atmosphäre eines Raumes, die Anordnung der Werke und ihre Zwiesprache untereinander genauer einfangen und nachvollziehbarer festhalten als mit zweidimensionalen Fotos. Ein Foto zeigt ein Werk; ein Rundgang zeigt auch, was daneben hängt, was gegenüber steht und wohin der Blick von dort weiterwandert. / 360° cameras capture the atmosphere of a room, the arrangement of the works and the dialogue between them more fully and more traceably than flat photographs. A photograph shows one work; a tour also shows what hangs beside it, what faces it, and where the eye travels next. |
| Step 1 | Erfasst · Panoramen, Perspektiven und Details werden vor Ort sorgfältig und präzise aufgenommen. | change | Filler ("sorgfältig und präzise", a list of three). | Aufgenommen · Während die Ausstellung läuft, werden ihre Räume mit einer 360°-Kamera fotografiert, von mehreren Standpunkten aus. / Recorded · While the exhibition is on, its rooms are photographed with a 360° camera from several viewpoints. |
| Step 2 | Verbunden · Blickpunkte werden verknüpft, um den räumlichen Verlauf der Ausstellung nachzuzeichnen. | change | Abstract. | Verbunden · Die Standpunkte werden Raum für Raum zu einem Rundgang verknüpft. / Connected · Room by room, the viewpoints are linked into a tour. |
| Step 3 | Bewahrt · Das Erlebnis bleibt lange nach dem Ende der Ausstellung navigierbar. | change | "navigierbar" is jargon; say where it is. The timing is in the hero text. | Online · Der Rundgang erscheint auf dieser Website, mit Angaben zu Galerie, Laufzeit und Beteiligten. / Online · The tour appears on this website with the gallery, dates and people involved. |
| Facts: Technologie | 360°-Erfassung & räumliche Kartierung | change | "räumliche Kartierung" overstates what is done. | 360°-Fotografie, verbundene Standpunkte / 360° photography, connected viewpoints |
| Facts: Kuration | Kuration: Ausgewählte Ausstellungen · In ganz Österreich | change (owner: value-free) | | Umfang: Galerien und Ausstellungsorte · in ganz Österreich / Scope: Galleries and exhibition venues · across Austria |
| Facts: Status | Pilotarchiv · In Entwicklung | keep | Plain. | — |
| Button | Beispieleintrag erkunden / Explore a sample record | change (done) | See "Four things". | Einen Rundgang öffnen / Open a tour (a random open tour) |
| Quote | Keine Replik. Ein Dokument der Präsenz. / Not a replica. A record of presence. | change (owner) | An exhibition is never a "Dokument" (§1.1). | All 15 proposals, from Directus (`pp_quotes`): one at random on every visit, weighted; hidden when draft or archived; optional dates and source. |
| Image alt | Geschichtete Archivpapiere rahmen einen Museumsrundgang … | keep | Describes the picture. | — |

## Four things beyond the locale texts (decided and done 2026-10-25)

| Where | Was | Owner's decision |
|---|---|---|
| Hero button 1 | "Das Archiv erkunden", scrolled to the galleries | "Alle Ausstellungen" / "All exhibitions" (compact: "Ausstellungen" / "Exhibitions"), opens `/exhibitions/`. |
| Method button | "Beispieleintrag erkunden", scrolled back up | "Einen Rundgang öffnen" / "Open a tour": opens one open 360° tour at random, in the same viewer as the wheel. Hidden while no tour is open. |
| Search fields | Galleries, newest exhibitions and artists each had a search that only filtered the cards of the start page | All three removed. The artists' alphabet stays and opens `/artists/?letter=…`. The index pages keep their searches. |
| Background picture `fig-caption.png` | "Fig. I. TEMPORARY, YET ENDURING." | Keep. A good example of a two-part line in a brand place (`docs/text-rules.md` §1.4). |

## In the code (with the change)

- `landing.*.intro` becomes optional: a section with no line below its header renders no
  empty paragraph and no empty space (`docs/text-rules.md` §6).
- The hero H1 is set in two lines with a red part (`line1`, `line1Accent`, `line2`,
  `line2Accent`) and falling letters on the red part. New split: "Ausstellungen" / "als
  **360°-Rundgänge**".
