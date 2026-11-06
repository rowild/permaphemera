# Worklog: Museum der Stadt Villach, "Wie Kriege enden / How wars end", 2026-11-05

Run without the owner (away; full permission, no deletes, no questions).

## 1. Search first

- `pp_venues`: no Museum der Stadt Villach (searched "museum", "villach"). Highest archive number 43
  (Ideenreich) → new venue gets 44.
- `pp_exhibitions`: nothing with "krieg" / "war" in title or slug.
- `pp_persons`: no Kuchler, Finding, Krenn, Zdolsek, Kleewein. Wolfgang Daborer exists (published,
  artist); the poster credits "Illustration: Wolfgang Daborer". Not linked: an illustrator of
  the poster is no participant of the exhibition, and it is not proven to be the same person.
- `pp_organisations`: none fits. The museum is a city department (Museum und Archiv) → no
  organisation record (how-to §5).
- Town Villach exists (`075119d3-…`).
- Tour folder `_360_GALLERIES_AND_TOURS/collection/_galleries/museum-villach/2025-05-08-museum-villach-wie-kriege-enden/`:
  203 360° photos of 26 October 2026 → tour exists. `_Material/`: poster PDF, two phone photos,
  `sources.txt` (copy here), 3D scans.

## 2. Sources read

| Source | Read | Facts |
|---|---|---|
| Poster PDF (owner) | yes | title, "8. Mai bis 2. November 2025", design ARGEntur, illustration Wolfgang Daborer |
| villach.at Folder 2025 (PDF, `sources/folder-2025.pdf`) | yes | 8 May–2 Nov 2025; hours Tue–Sun 10–16.30; € 6 / € 5; under 19 free; Peace Lab |
| villach.at Folder Museum 2026 (PDF) | yes | "aktualisiert und verlängert", 2 May–1 Nov 2026; € 8 / € 6; under 19 free |
| villach.at exhibition page | yes | 2 May–1 Nov 2026, bilingual, six conflicts; Widmanngasse 38 |
| villach.at museum page | yes | dept. Museum und Archiv; Museumsgütesiegel; hours 2026 |
| villach.at news items | no | URLs redirect to the news list (not readable) |
| meinbezirk.at 28 Apr 2025, 5min.at 1 May 2025 | yes | Kuchler: "ab 8. Mai" |
| klick-kaernten.at 7 May 2025, 17:01 | yes | "opens Friday, 9 May"; photo of Kuchler, Sandriesser and team (press presentation) |
| welcome2villach.at 25 May 2025 (de, en) | yes | "9. Mai bis 2. November 2025"; eleven eyewitnesses; alpine position replica; aerial bomb |
| kaernten.orf.at 26 Jul 2025 | yes | Kuchler director; Franz Arneitz (AI); Lada of 1981 shot at by both sides; "until 25 November" |
| museumsbund.at 2 Jun 2025 (author Kuchler) | yes | founded 1873 by Carl Andreas Picco; in the palace since 1960; town wall, "Grünes Eck" 2022 |
| blog.versoehnungsbund.at 18 Aug 2025 | yes | Peace Lab contents |
| klick-kaernten.at 8 May 2026 | yes | extended and enlarged: Cold War, Ukraine, Szent István; new archaeology rooms |
| it-gymnasium.at 11 Jul 2026 | yes | two student stations opened 2 July 2026 |
| langenacht.orf.at | yes | Szent István footage, air-raid shelter replica |
| vhsktn.at curator's tour | 403 (search snippet only) | "Curator's tour" 16 Oct 2025, led by director Dr. Andreas Kuchler |
| Facebook / Instagram | not read | login wall |

## 3. Decisions

| Point | Decision | Why |
|---|---|---|
| One or two records | one record, `start_date` 2025-05-08, `end_date` 2026-11-01, `date_range` names both runs | same exhibition, extended; the owner asked for one record; the tour shows the 2026 state |
| First public day 2025 | 8 May 2025 | poster and city folder (primary sources) and the director say 8 May; the city's news (via KLiCK, welcome2villach) says Friday 9 May. Conflict reported |
| Vernissage | empty | no opening evening found in any source. A press presentation took place by 7 May 2025 (KLiCK photo with Vice Mayor Sandriesser). The 2026 reopening with the new archaeology rooms was, per a search snippet of the unreadable villach.at news, on a Thursday evening, probably 7 May 2026: not confirmed |
| End 2025 | 2 November 2025 | poster and folders; the ORF "until 25 November" is not confirmed by any other source |
| Admission | both years in the text | prices changed (2025 € 6/5, 2026 € 8/6) |
| Curator | Andreas Kuchler, role curator | no source says "curated by"; the VHS listing calls his tour a curator's tour. Flag for the owner |
| Kuchler on the venue | `pp_mm__persons_venues` `relation: head` | museumsbund.at, ORF: director |
| Exhibition image | straight view from the owner's 360° photo `CAM_20261026105134_0103_D.JPG` (yaw −78°, pitch −2°, 82° view, 2000×1333) | rights-free; shows the Lada and the exhibition banners; no people |
| Venue image | Commons, Johann Jaritz, CC BY-SA 4.0 (`Villach_Innenstadt_Widmanngasse_38_Stadtmuseum_02072018_3811.jpg`) | free licence; no people |
| `source_pdf` | the owner's poster | primary source |
| Tour fields | `available`, `tour_available_from` empty, `tour` empty | the owner's instruction |
| Links | exhibition: villach.at page (exhibition_page), ORF report (press); venue: villach.at/museum, Facebook, Instagram | all load (200) |

## 4. Written (production, drafts)

- Files: venue photo `5473fce1-…`, exhibition image `8ba91b0c-…`, poster PDF `73dc7603-…`.
- Venue `museum-der-stadt-villach` `7135282a-36b0-4719-a629-81e489b69bcc`, draft, number 44.
- Person `andreas-kuchler` `55793118-f7a3-4e9a-8906-3d89e5eef8d5`, draft, no portrait.
- Exhibition `wie-kriege-enden` `23b6f814-b9be-4821-96b9-93452e8c6725`, draft.
- SEO: `directus/seo/2026-11-05-museum-villach-wie-kriege-enden.json` (dry-run clean, written).
- Poster copied to the tour folder as `poster.pdf` (the original stays in `_Material/`).

## 5. Check

Read back: all fields as written. `pnpm check:data` fails on one other record only:
`walther-preiml-sehnsucht` (published; SEO description over 128 characters with a tour). Not
touched here.

## 6. Gaps

- No vernissage date; no named curator other than the curator's-tour inference.
- No portrait of Andreas Kuchler; no birth data.
- The 2025 press team photo names Nadja Finding, Arlo Newton Kleewein, Astrid Krenn, Claudia
  Zdolsek without roles: not recorded.
- The local folder date 2025-05-08 matches the chosen start date; folder not renamed.
