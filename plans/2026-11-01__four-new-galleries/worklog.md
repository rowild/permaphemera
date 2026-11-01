# Worklog: four galleries, 2026-11-01

How the run went, in order. The reusable version is the skill `rowild-new-gallery-creation`.

## 1. How it was done the last time

`docs/how-to-gallery-and-exhibition.md` and the skill
`rowild-create-or-update-gallery-or-exhibition-in-permaphemera`. Blueprints read:
venue `galerie-im-stiegenhaus-seeboden`, exhibition `blinddate-der-perspektiven`, organisation
`kultur-im-puls` and `lebenshilfe-spittal`, collective person `schulklassen-aus-kaernten`.

## 2. Search first: what already existed

- Venue Galerie Freihausgasse (draft, number 15, placeholder image). Completed, not duplicated.
- Town Villach. Persons Adi Schmölzer, Gernot Fischer-Kondratovitch, Marlies Rapetti (her sources
  say Liekfeld-Rapetti), Wolfgang Daborer (empty fields). Organisation kultur.im.puls.
- The owner's 360° photos of the Wallnerhaus (23 October 2026) in
  `_360_GALLERIES_AND_TOURS/collection/_galleries/wallnerhaus_kleblach-lind/`. So a tour exists.

## 3. Research

All links of `sources.txt` (copy in this folder) downloaded and read. Facebook and Instagram
could not be read without a login; Kleine Zeitung is paywalled (only head and teaser read).
A helper agent researched 16 artists: `persons-research.json`.

## 4. Images

| Record | Image | Rights |
|---|---|---|
| Dinzlschloss | Commons, Raul de Chissota | public domain |
| Wallnerhaus | Commons, JJ55 | CC BY-SA 3.0 |
| Galerie Freihausgasse | Commons, Johann Jaritz (the street; no photo of the gallery) | CC BY-SA 4.0 |
| Lebenshilfe Knittelfeld | Commons, Guschi (the town; no photo of the building) | CC BY-SA 3.0 |
| Atemzüge | straight view from the owner's 360° photo | © Robert Wildling; works © Daborer |
| FRAGIL, HOMESTORY, vintage views | press images from villach.at | © holder; consent needed |
| Hoffnung und Frieden | press photo, Walter Schindler, meinbezirk.at | © holder; consent needed |
| Clar, Yaeger | portraits from postwerk.at | © Fessl, © Koller; consent needed |

Rejected: press photos of the calendar evening that show Lebenshilfe clients (private people,
some in wheelchairs; no consent known). Anita Wiegele's photo: a performance with a second
figure, not a portrait; uploaded, then unlinked from her record (file stays).

## 5. Writing

1. `upload-manifest.json` with `directus/scripts/upload-files.mjs`, ids in `file-ids.json`.
2. `write-records.mjs`: towns, organisations, venues, relations, persons, exhibitions. Drafts.
   Safe to run twice. `fix-1.mjs`: corrections after reading back.
3. `directus/seo/2026-11-01-four-galleries.json` with `directus/scripts/write-seo.mjs`
   (`--dry-run` first: it found 6 wrong lengths).
4. Read back; `pnpm check:data`: OK, 87 assertions.

## 6. Conflicts between sources and how they were decided

| Point | Sources | Decision |
|---|---|---|
| Calendar title | owner "Hoffnung auf Friede"; press and Lebenshilfe "Hoffnung und Frieden" | "Hoffnung und Frieden" |
| Calendar start | owner "Thursday, Oct. 27": 27 October 2026 is a Tuesday, Thursday is the 29th; press reports appeared on the 30th | 29 October; the owner checks |
| Calendar place | owner "Lebenshilfe"; press "Knittelfelder Pop-up-Galerie" in rooms lent by others, no address | venue is the Lebenshilfe, text names the pop-up gallery |
| Performance partner in FRAGIL | villach.at Tahereh Nourani; postwerk.at and ORF Phil Yaeger | Phil Yaeger, the organiser's name |
| Artists of FRAGIL | villach.at without Marjeta Angerer-Guggenberger; postwerk.at with her | with her |
| Wallnerhaus hours | flyer Mon–Thu 8–12, 14–16, Fri 8–13; Osttiroler Bote Mon–Thu 8–16 | the flyer |
| Atemzüge opening | invitation and municipality 21 May 2026; tour folder name 2026-05-28 (date of a press article) | 21 May; first public day 22 May |

## 7. Gaps

- Dinzlschloss and Wallnerhaus: no next exhibition is published anywhere. None invented.
- Calendar exhibition: no opening hours, no address of the pop-up gallery, end date only from the owner.
- Admission is unknown for HOMESTORY, vintage views, Atemzüge and the calendar exhibition. Empty
  shows "Free admission" on the site. FRAGIL is free (woerthersee.com).
- Mana Mira: no biography found. Marjeta Angerer-Guggenberger: from the GND record only.
- No portrait for most artists.

## 8. Found on the way

The site showed "Carinthia" on the German gallery page. With Styria this would have become two
English names. Fixed in frontend 0.0.45 (`useStateName`, `states` in the locale files).
