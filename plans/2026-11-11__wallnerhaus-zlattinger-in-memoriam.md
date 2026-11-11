# Klaus Zlattinger – In Memoriam, Wallnerhaus Lind (2026-11-11)

Owner's request: create the tour folder for the new exhibition in the Wallnerhaus (structure
like the Atemzüge tour), move the invitation into `_MATERIAL/`, and create the exhibition in
Directus from the invitation (image, text, web research).

## Done

- Tour folder (naming rule, vernissage day first):
  `$PANORAMA_PROJECT/collection/_galleries/wallnerhaus_kleblach-lind/2026-11-20-wallnerhaus-kleblach-lind-klaus-zlattinger-in-memoriam/`
  with `building_01/floor_01/room_00/normal`, `floor_01/room_01/{normal,high,low}`,
  `floor_02/room_01/{normal,high,low}` (as Atemzüge), `_MATERIAL/Einladung-Zlatte-Lind.pdf`
  (moved) and `poster.pdf` (copy, for the Tour Editor's meta, skill step 2).
- Directus (draft): `pp_exhibitions` `klaus-zlattinger-in-memoriam`
  (id `c1d8f43e-aba1-4d74-92f5-9a1bf8b78671`), artist Klaus Zlattinger, organiser kultur.im.puls,
  image = the work on the invitation (cut out, print colours converted), `source_pdf` = the
  invitation, SEO en/de. `pnpm check:data` OK.

## Sources

- The invitation (only source of the dates, hours and programme); no web page announces the
  exhibition yet (kultur-impuls.com, kleblach-lind.at "Ausstellung im Wallnerhaus" still shows
  Atemzüge, web search 2026-11-11).
- Zlattinger's facts (1956–2016, gallerist, Spittal): https://www.artothek-impuls.at/produkt/klaus-zlattinger/ ,
  https://www.spittal-drau.at/kultur/galerie/geschichte , https://kultur-impuls.com/events/ausstellung-klauszlattinger/

## Decisions

- Title as on the invitation: "Klaus Zlattinger – In Memoriam. Seine letzte Schaffensperiode"
  (German in both languages, like "Atemzüge").
- `start_date` 2026-11-23: the first day the municipal office is open after the vernissage
  (Friday 20 November, 19:00); the office is closed at weekends. `end_date` 2027-01-15 (Friday,
  checked).
- Wolfgang Daborer (speech), Mayor Manfred Fleißner (opening), Eva and Philipp Schneider
  (music): in the vernissage text, no participation rows (they do not show works).
- kultur.im.puls as organiser: its logo is on the invitation beside the Gemeindeamt; the
  association already "exhibits at" the Wallnerhaus.
- Tour: `tour_status` available, `tour_available_from` empty = the last day, 15 January 2027.

## Gaps

- Admission: not on the invitation; left empty (the site shows "free admission"). A municipal
  office, so likely free; to confirm.
- Holiday closures of the office (Christmas, New Year) not stated.
- Medium of the works: not stated.
