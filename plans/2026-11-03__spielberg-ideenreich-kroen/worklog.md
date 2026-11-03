# Worklog: Art Hotel Spielberg, Ideenreich, Séverin Krön (2026-11-03)

Skill `rowild-new-gallery-creation` (1.6.12). Owner's list: `sources.txt` (copy here). Everything
below its "IGNORE" line was skipped.

## 1. Jobs

| Entry | Job |
|---|---|
| Art Hotel Spielberg, Steiermark | new venue |
| Lebenshilfe Knittelfeld, Ideenreich | new venue "Ideenreich" (decision, see §2) |
| Séverin Krön (Kurator der Galerie Porcia) | new person, linked to the Galerie im Schloss Porcia |

## 2. Search first

- No venue, town or organisation for Spielberg. No person Krön / Kron / Kroen.
- Venue `lebenshilfe-knittelfeld` (draft, no. 41) and organisation `lebenshilfe-region-knittelfeld`
  exist (2026-11-01). Its text already names the shop "Ideenreich" at Hauptplatz 17.
  **Decision:** the entry means the shop as its own place. New venue `ideenreich-knittelfeld`,
  `part_of` the Lebenshilfe venue, run by the Lebenshilfe organisation. The Lebenshilfe venue stays as it is.
- No folders of these venues in `_360_GALLERIES_AND_TOURS/collection/`. The Porcia folder does
  not name Krön. So no tour fields to set (no exhibitions).

## 3. Research

**Art Hotel Spielberg** (arthotel-spielberg.at, all pages read): hotel at Lilienweg 7, 8724 Spielberg;
46 rooms, 96 beds, open all year, seminar room. Run by MFST GmbH, Kärntner Straße 12, Knittelfeld
(imprint). **Gap:** no source shows art or an exhibition at the hotel: not its site, not two web
searches, not the press. The venue is created anyway (skill rule) and reported. A listing calls it
"formerly Best sleep Hotel" (hotel.com.au); not used, weak source.

**Ideenreich** (ideenreich-knittelfeld.at, lebenshilfe-knittelfeld.at): inclusive shop with an
integrated workshop (wood and clay), a project of the Lebenshilfe Region Knittelfeld, Hauptplatz 17.
Aim: a meeting place for craft, art, information and culture events. A painting workshop with
Helmuth "PLO" Ploschnitznigg took place there in 2026 (date on the page unclear: June or July).
Hours: Mon–Thu 8.30–12 and 13–16, Fri 8.30–12. **Gap:** no exhibition found there.

**Séverin Krön**
- spittal-drau.at: staff list, "Kultur – Galerie", Schloss Porcia, task "Galeriebetreuung".
- meinbezirk.at 24 Jan 2022 (Michael Thun): new head (Galerieleiter) of the Galerie Porcia, successor
  of Elisabeth Kleinwächter; first exhibition "HEART IMPAKT" (Paszkiewicz, Makra) from 28 Jan 2022.
  "Wahl-Kärntner". Born 1964 in Paris.
- meinbezirk.at 5 Sep 2019: exhibition "Fließende Bilder, veränderbare Welten!" at the KUNSTradln
  gallery in Millstatt; "Art permutable": panels to swap and turn; bilingual.
- Gmünd catalogue 2015 (kuenstlerstadt-gmuend.at, PDF, CV page read as image): born 1964 in Nanterre
  near Paris; 1985–1992 painting and art education in Vienna (Hochschule für Bildende Künste) and at
  the Mozarteum Salzburg; teachers Arnulf Rainer, Anton Lehmden; 2007 Art permutable; 2014 Ring
  series; solo exhibitions 1993–2013; 2015 guest studio Maltator, Gmünd. Gmünd page: "from Lisses in France".
- artmajeur.com (via WebFetch; curl gets 403): portfolio, 14 works, "Frankreich". YouTube channel
  "Séverin KRÖN" loads. Instagram loads (login wall). LinkedIn blocks robots (HTTP 405).
- menschlichkeit.jetzt: a paid "Mirror of Soul" drawing offer. Not used (an offer, not a fact for the archive).
- zugaenglichekunst.at: exhibition "KUNST oder SPIEL", no date on the page. Not used.

**Conflicts**
- Birthplace: Nanterre near Paris (his own catalogue) vs Paris (meinbezirk 2019, 2022). Used: Nanterre.
- Parents: "Austrian parents" (catalogue) vs Austrian father and German-Swiss mother (meinbezirk).
  Left out of the text; "grew up bilingual" (meinbezirk) used.
- Spelling: Séverin Krön (catalogue, Gmünd, artmajeur, YouTube), Sévérin (meinbezirk 2022), Severin
  Krön (spittal-drau.at), severin.kron (Instagram). Used: Séverin Krön.
- based_in: no current home address in a source; "Wahl-Kärntner" (2022) → "Carinthia".
- Role: owner says curator; press says head of the gallery (Galerieleiter) who curates its exhibitions.
  Roles: artist, curator; relation persons–venues to the Galerie im Schloss Porcia.

## 4. Images

| Record | Image | Rights |
|---|---|---|
| Art Hotel Spielberg | Commons, Robert Kropf (TheRunnerUp), Stadtplatz Spielberg; no photo of the hotel | CC BY-SA 4.0 |
| Ideenreich | Commons, Ewaldm, Hauptplatz Knittelfeld (2004, 1024 px, original size); no photo of the shop | CC BY-SA 3.0 |
| Séverin Krön | press photo meinbezirk.at, Michael Thun, 2022: Krön alone in the Porcia vault | © Michael Thun; consent needed |

## 5. Records (all drafts; `write-records.mjs`)

| Record | Id |
|---|---|
| town `spielberg` (Styria, 8724) | f9a10966-d674-4de0-a2d4-bfb6828de1e3 |
| venue `art-hotel-spielberg`, no. 42, `forum` | 33aca2f9-a03b-4703-9514-2ad3f9b76b67 |
| venue `ideenreich-knittelfeld`, no. 43, `forum`, `part_of` lebenshilfe-knittelfeld | 0bedb9f2-9188-4c5e-85d9-946a457d3944 |
| relation: Lebenshilfe Region Knittelfeld `runs` Ideenreich | |
| person `severin-kroen` (artist, curator; venues: Galerie im Schloss Porcia) | 3cfbac5f-e237-410c-9cfa-507026a27023 |
| links (published): artmajeur, Instagram, YouTube, LinkedIn | |

Nothing published, nothing deleted, no published record changed.

## 6. SEO

`directus/seo/2026-11-03-spielberg-ideenreich-kroen.json`: dry run clean, then written (3 records).

## 7. Check

Every record read back. `pnpm check:data`: OK (87 assertions). Styria is not new (Graz, Knittelfeld).
