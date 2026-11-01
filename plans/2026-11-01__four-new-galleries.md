# Four galleries from sources.txt (2026-11-01)

Owner's request: add Galerie Freihausgasse Villach, Dinzlschloss, Wallnerhaus (Kleblach-Lind)
and Lebenshilfe Knittelfeld "as the other ones", record how it is done, then write the skill
`rowild-new-gallery-creation`. Owner away: no questions; everything allowed except deleting.

Lebenshilfe Knittelfeld matters most: first gallery outside Carinthia, Adi Schmölzer's
connection, and a key partner of the project.

## Decisions made while the owner is away

- Records stay `draft`, as the how-to and the gallery skill require. The owner publishes.
- Galerie Freihausgasse already exists as a draft (archive number 15): complete it, no new record.
- Tour fields: `tour_status: unavailable`, except Atemzüge (the owner photographed it on
  23 October 2026): `available`, from its last day.
- New archive numbers: 39 Dinzlschloss, 40 Wallnerhaus, 41 Lebenshilfe Knittelfeld.

## Steps

- [x] Research venues, exhibitions, artists (`2026-11-01__four-new-galleries/worklog.md`)
- [x] Commons photos for the venues, press images for the exhibitions
- [x] Upload files (`directus/scripts/upload-files.mjs`)
- [x] Towns, venues, organisations, persons, exhibitions in Directus (draft)
- [x] SEO texts (`directus/scripts/write-seo.mjs`)
- [x] Read back, `pnpm check:data`
- [x] Check the frontend for a second federal state: state names now in the current language (0.0.45)
- [x] Skill `rowild-new-gallery-creation` in rowild-skills
- [x] Project command `/away` for the "owner is away" text block

## Left for the owner

Check the drafts, then publish. See the conflicts and gaps in the worklog (§6, §7).
