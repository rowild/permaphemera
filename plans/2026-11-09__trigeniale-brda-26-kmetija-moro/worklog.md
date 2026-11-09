# Worklog: Kmetija Moro, Trigeniale Brda 26, three artists (2026-11-09)

Skill `rowild-new-gallery-creation`. Owner away; full permission except deleting; no questions.
Everything written as `draft` in production Directus. Nothing published, deleted or deployed.
No code, docs or features changed.

## Owner's brief (instead of a sources.txt)

1. New venue: Kmetija Moro (family farm / winery "Hiša Moro", brand "Moro Wines"), Vipolže 62,
   5212 Dobrovo v Brdih, Slovenia (Goriška Brda). "Kunstbotschaft Kärntens in Slowenien" /
   "Ambasada umetnosti Koroške v Sloveniji" / "Ambasciata d'arte della Carinzia in Slovenia".
   Hosts: Damjan and Dragica Jakončič. https://www.moro-wines.com . Type `forum`. Camera GPS
   45°58'24.53"N 13°31'49.32"E.
2. New exhibition: "Trigeniale Brda 26", 18th exhibition of "Kunst in den Hügeln / Umetnost v
   Brdih / Arte nel Collio". Opening Fri 25 Sep 2026, 16:00, by Franc Mužič. Until end of 2026,
   visits by phone, +386 51 604649. Artists Giulia Cernetig, Aleksandra Rusjan, Margrit Pernull.
   Partners Künstlergruppe "Albrecht Dürer" Tavagnacco, DABLO Brda; patronage AACC. Organiser
   bewegungINkultur (exists). Sources:
   - https://www.meinbezirk.at/klagenfurt/c-regionauten-community/neue-dreilaenderausstellung-trigeniale-brda-26-in-gorika-brda_a8905011
   - https://www.meinbezirk.at/klagenfurt/c-regionauten-community/trigeniale-brda-im-herbst_a8921886
   - https://www.meinbezirk.at/klagenfurt/c-regionauten-community/kunst-in-den-huegeln-dreilaenderausstellung-trigeniale-brda-26_a8554924
   - https://www.meinbezirk.at/tag/kmetija-moro
   Tour: `available`, `tour_available_from` 2026-12-31, no `tour` link. Tour id
   2026-09-25-moro-wine-trigeniale-brda-26.
3. New persons: Giulia Cernetig, Aleksandra Rusjan, Margrit Pernull.

## Search (step 2)

- `pp_venues`: no "moro", no "brda". Highest `archive_number` 44 (museum-der-stadt-villach) → 45.
- `pp_locations`: all 23 towns in Austria; no Brda/Dobrovo/Vipolže. A new town is needed, the
  first outside Austria.
- `pp_exhibitions`: "trigen" only finds `trigeniale-26` (Studiogalerie Klagenfurt). "moro",
  "brda": none.
- `pp_persons`: no Cernetig, Rusjan, Pernull, Jakončič, nor first names Giulia, Aleksandra, Margrit.
  Related existing: Gerhard Lepicnik (organiser role, published; his bio already names the Moro
  series and Boris Jakončič), Alda Grudina (DABLO president).
- `pp_organisations`: bewegungINkultur = `bewegung-in-kultur` (44330447-…, published). No Dürer
  group, DABLO, AACC.
- `pp_websites`: no URL with "moro".
- 360 folder: `_360_GALLERIES_AND_TOURS/collection/_galleries/moro_wine/2026-09-25-moro-wine-trigeniale-brda-26/`,
  33 CAM files of 2026-11-08, already sorted into building_01/floor_01/room_01 (outside, entrance)
  and room_02 (hall). Read only, nothing written there.

## Research (step 3)

Downloaded to `sources/`: the three meinbezirk articles (a8905011, a8921886, a8554924), the tag page,
three older articles (a4772672 2021, a5268373 2022, a6295668 2023), moro-wines.com (slo + eng),
the Benečija event page (Cernetig).

Facts found:

- a8905011 (18 Sep 2026, by bewegungINkultur): the 17th exhibition (Zaninotti, Petrovčič, Kucher)
  ended 15 Sep 2026; changeover; Cernetig (Udine), Rusjan (Brda), Pernull (Hermagor) in the 18th
  exhibition of "Kunst in den Hügeln – Umetnost v Brdih – Arte nel Collio" at Kmetija Moro,
  SLO-5212 Vipolže 62; opening Friday 25 Sep 2026, 16:00, by the mayor of Brda; patronage AACC;
  cooperation Künstlergruppe "Albrecht Dürer" Tavagnacco and DABLO Brda. Captions: Boris Jakončič
  = "Seniorchef"; Pernull with landscapes of the Nockberge.
- a8921886 (28 Sep 2026): opening report. Franc Mužič, mayor of Brda for 32 years, 80 on 15 Oct,
  leaves office at the end of the term in November 2026: his last opening of the series. Host
  family Jakončič; caption Damjan Jakončič; "Hausfrau Dragica Jakončič". Also present: Alda
  Grudina (DABLO), Maria Unterkofler (Kärntner Malergilde), Malgruppe Milan Baltić (Pernull is a
  member). Works named: Pernull "Weißensee", "Landschaft Früchte und Blumen"; Rusjan "Kanjon",
  "Češnja" (her favourite), "Schloss Dobrovo"; Cernetig member of Gruppo artistico culturale
  Albrecht Dürer, Tavagnacco. "Bis Ende 2026 jeweils nach telefonischer Anfrage bei Kmetija Moro
  unter 00386 51604649."
- moro-wines.com: Damjan Jakončič, +386 51 604 649, Vipolže 62, 5212 Dobrovo v Brdih; family farm
  history (great-grandmother Margerita, grandfather nicknamed Moro, horse Pubi, son Boris);
  7 ha vineyards + 5 ha orchards (Slovenian page; the English page says 5 ha land + 7 ha vineyards).
  Instagram moro_wines and Facebook MoroWines linked from the site.
- Older articles: 2021 5th exhibition, "Hausherr Boris Jakončič", "Hauses Moro von Boris und
  Dragica Jakončič"; 2022 7th exhibition; 2023 11th exhibition = five years of the series,
  Damjan Jakončič ("Juniorchef") named honorary ambassador for Carinthian art.
- OpenStreetMap: Vipolže 62 = building way 1286663695 (45.97342–45.97369 N, 13.53008–13.53057 E),
  shop "Vina Moro" node next to it. Owner's GPS (45.973481, 13.530367) and the EXIF of hall photo
  05 (45°58'24.87"N 13°31'49.37"E) lie inside the building. Venue coordinates: building centre
  45.97359, 13.53031. Municipality: Brda (SI-007), seat Dobrovo (45.9974, 13.5274).
- Weekdays: 25 Sep 2026 = Friday (correct). 31 Dec 2026 = Thursday.
- Poster: not found online (not in any meinbezirk gallery, no brda.si/novice listing found).
  It hangs on the hall's glass door and is visible in the owner's 360° photos (see below).
  Readable on it: "Ausstellung – Razstava – Mostra / Trigeniale / Kunst in den Hügeln / Umetnost
  v Brdih / Arte nel Collio / aus Kärnten, Friaul, Slowenien … / Brda / vom 25. Sept. bis Ende
  2026 / od 25 sept. do konca 2026 / dal 25 sett. fino alla fine 2026 / in der KUNSTBOTSCHAFT
  KÄRNTENS in SLOWENIEN / na AMBASADI UMETNOSTI KOROŠKE v SLOVENIJI / nell'AMBASCIATA d'ARTE della
  CARINZIA in SLOVENIA / Kmetija Moro / Vipolže – Brda / Eröffnung … 25. Sept. 2026 …", Moro logo,
  three works labelled Margrit Pernull, Aleksandra Rusjan, Giulia Cernetig.
- Artist sheet of Margrit Pernull on the hall wall (360° photo 09, readable): born 1958 in Gmünd
  (Carinthia), lives in Hermagor since 1980; after retiring as an occupational therapist studied
  at the Freie Akademie der bildenden Künste Klagenfurt (Slovenian text: from 2018), diploma 2023;
  since 2021 in the painting group of the academic painter Milan Baltić; solo exhibition at the
  Pressegger See (Slovenian and Italian text: 2022; the German line reads 2020 or 2022, blurred);
  2023–2024 group exhibitions BV-Galerie, Gewölbegalerie Klagenfurt, Bildungshaus Sodalitas Tainach.
  The sheets of Cernetig and Rusjan are too far from every camera spot to read.
- Cernetig: benecija.eu (DMO Turismo Benečija) – solo exhibition "The Breath of Color",
  6–27 June 2026, council chamber of San Pietro al Natisone. No own website, no other biography found.
- Rusjan: nothing beyond meinbezirk. Web searches found only other Rusjans (Rene Rusjan, sculptor).
- Pernull: nothing online beyond meinbezirk.

## Decisions

1. Venue slug `kmetija-moro-brda` (how-to: `<name>-<town>`), title "Kmetija Moro", type `forum`
   (winery that exhibits), archive number 45, `website_url` https://www.moro-wines.com/,
   social links Instagram + Facebook (Facebook answers 400 to curl, as it does for bots; it is
   linked from the official site, so kept).
2. New town `brda` (title "Brda", the municipality Občina Brda; postal code 5212, coordinates of
   the seat Dobrovo). Slovenia has no federal states: `state` = "Goriška" (the statistical
   region), `country` = "Slovenia" (shared/seo.mjs maps it to SI).
3. Exhibition slug `trigeniale-brda-26`, title "Trigeniale Brda 26" (owner's title, used by the
   organiser in all autumn articles; the poster itself only says "Trigeniale … Brda").
4. `start_date` 2026-09-25 (official opening; the works were hung on 15 Sep, but no public day
   before the opening is published), `end_date` 2026-12-31 (sources: "bis Ende 2026").
   `tour_status` available, `tour_available_from` 2026-12-31, `tour` not set.
5. Organiser: bewegungINkultur (`pp_exhibition_organisers`, role organiser) + venue relation
   `exhibits_at`. Gerhard Lepicnik as participation with role organiser, as on `trigeniale-26`
   (he is in the opening photo as organiser).
6. Albrecht Dürer group, DABLO, AACC: named in the description only, no organisation records
   (as on the style model `trigeniale-26`; the owner did not list them as jobs).
7. The Jakončič family: named in the venue text, no person records. Hosts written as "Boris and
   Dragica Jakončič and Damjan Jakončič, the junior head" (see conflict 2).
8. Artist order: Cernetig, Rusjan, Pernull (articles and owner's order).
9. Admission: unknown, left empty (the site shows "free admission" for empty: see gaps).
10. Images: the owner's own 360° photos (skill §4.1), straight views at 78°, no people:
    - exhibition: room_02/normal/04.jpg, yaw 0, pitch 5° → `trigeniale-brda-26-kmetija-moro-hall-view-2026.jpg`
      (file 2874595d-7b3b-4028-a867-2c94b4ec50bf)
    - venue (image + hero): room_02/normal/02.jpg, yaw 0 → `kmetija-moro-hall-vipolze-62-brda.jpg`
      (file 3e4d2bc1-5bf5-487c-a717-21d6ef821b43)
    Not used: the "the-crew" photo; outside views (cars with number plates). No Commons photo of
    the farm exists; the owner's photo is free of third-party rights except the works.
11. No portraits: the only portraits are on the artist sheets and in bewegungINkultur's press
    photos (rights of bewegungINkultur / the artists). No portrait is better than a doubtful one.
12. No `source_pdf`: no invitation PDF exists online. The poster view from the 360° photo is saved
    for the owner: `sources/poster-trigeniale-brda-26-from-360-photo.jpg`.
13. The March article (a8554924) is about the spring exhibition, not linked to this record
    (see conflict 1). Linked: a8905011 (announcement) and a8921886 (opening report), kind `press`.

## Conflicts

1. **Two exhibitions called "Trigeniale Brda 26".** The March 2026 article (a8554924, one of the
   owner's sources) announces a spring "Trigeniale Brda 26" with Paola Zaninotti, Helena Petrovčič
   and Maria Kucher, opened Friday 10 April 2026, 16:00 (= the 17th exhibition, ended 15 Sep 2026).
   The autumn exhibition (18th, our record) uses the same name. The spring exhibition is not in
   Directus and has no photos; not created.
2. **Hosts.** Owner: Damjan and Dragica Jakončič. Sources: Boris Jakončič "Seniorchef"/"Hausherr"
   (2021, 2026), Damjan Jakončič "Juniorchef"/"Hausherr" (2023, 2026), Dragica Jakončič "Hausfrau";
   2021: "Hauses Moro von Boris und Dragica Jakončič". Written neutrally with all three names.
3. **Opening by the mayor:** the September announcement names only "the mayor of Brda"; the opening
   report names Franc Mužič. Owner's fact confirmed.
4. **Dates:** none against the owner's brief. Opening 25 Sep 2026 16:00 (Friday) and "bis Ende
   2026" confirmed by article and poster.
5. Spelling variants: "Alexandra Rusjan" and "Trigoniale" in two captions (a8905011); "Helena
   Petrocic" tag vs "Petrovčič" in the text. Used Aleksandra Rusjan.
6. Moro farm size: Slovenian page 7 ha vineyards + 5 ha orchards; English page 5 ha land + 7 ha
   vineyards. Used the Slovenian page.
7. Pernull's solo exhibition year: 2022 (Slovenian, Italian text of her sheet) vs. blurred German
   line (2020 or 2022). Used 2022.

## Gaps

- Admission unknown (left empty: the site would say "free admission" once published).
- No portraits of the three artists; no birth data for Cernetig and Rusjan; no websites.
- Biographies of Cernetig and Rusjan are thin (two sources only).
- No invitation PDF; only the poster on the door, from the 360° photo (low resolution, the footer
  with the opening line is barely readable).
- First venue outside Austria. Before the owner publishes town and venue:
  - `frontend/scripts/check-data-integrity.mjs` asserts "every location has coordinates inside
    Austria" (latitude > 46). Brda lies at 45.97 N: `pnpm check:data` will fail once the town is
    published (it passes now because drafts are not in the public API). Code change needed
    (not made: no code changes in this run).
  - The gallery filter will show the state "Goriška" untranslated (no key in `states` of the
    locale files), and as a new entry beside the Austrian states.
  - Text rules and the site say the archive's scope is Austria ("in ganz Österreich").
- `pnpm check:data`: OK (104 assertions), 2026-11-09.

## Records (all draft)

| Collection | Slug | Id |
|---|---|---|
| pp_locations | brda | 4ca27fa4-de03-4b49-b2d3-71c30f44ef72 |
| pp_venues | kmetija-moro-brda | bc81ccea-8a78-4f9b-898b-a8f80e7432dd |
| pp_persons | giulia-cernetig | 43b4f1d5-12bb-48ab-a740-1aeb810572c5 |
| pp_persons | aleksandra-rusjan | e91f6c82-aae5-4b09-b609-142afc6f6086 |
| pp_persons | margrit-pernull | 0f7e1c17-0310-45df-9ac7-f9693b06e017 |
| pp_exhibitions | trigeniale-brda-26 | 77ca9d88-16aa-446a-88a6-f41eb06d3c19 |

Plus: venue relation bewegungINkultur `exhibits_at` Kmetija Moro (b48e6ac2-…), organiser row
bewegungINkultur on the exhibition, four `pp_websites` links (published, as links always are):
Instagram, Facebook, two meinbezirk articles. SEO: `directus/seo/2026-11-09-trigeniale-brda-26.json`
(5 records written).
