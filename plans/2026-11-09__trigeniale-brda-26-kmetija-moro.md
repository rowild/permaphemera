# Trigeniale Brda 26 at Kmetija Moro (2026-11-09)

Skill `rowild-new-gallery-creation`, run without questions (owner away, full permission except
deleting). All records are drafts in production Directus. Nothing published, deleted or deployed.
No code or docs changed.

Jobs (from the owner's brief, kept in `2026-11-09__trigeniale-brda-26-kmetija-moro/worklog.md`):

1. New venue: Kmetija Moro (Moro Wines), Vipolže 62, 5212 Dobrovo v Brdih, Slovenia, type `forum`,
   with a new town record (Brda, Slovenia).
2. New exhibition: Trigeniale Brda 26, 25 September – end of 2026, organiser bewegungINkultur
   (exists), tour fields `available` / 2026-12-31, no `tour` link.
3. New persons: Giulia Cernetig, Aleksandra Rusjan, Margrit Pernull.

Files in the folder `2026-11-09__trigeniale-brda-26-kmetija-moro/`:

- `worklog.md`: findings, decisions, conflicts, gaps.
- `sources/`: downloaded source pages and the poster view from the 360° photo.
- `images/`: straight views from the owner's 360° photos (uploaded).
- `upload-manifest.json`, `file-ids.json`: the upload.
- `write-records.mjs`: creates the records (safe to run twice).
- SEO: `directus/seo/2026-11-09-trigeniale-brda-26.json`.

## State on 2026-11-09 (evening)

- Published 2026-11-09 in the evening (owner): venue `kmetija-moro-brda`, town `brda`, exhibition
  `trigeniale-brda-26`, persons Giulia Cernetig, Aleksandra Rusjan, Margrit Pernull. `pnpm check:data` allows a town in a
  neighbouring country inside the Alps-Adriatic region (it demanded Austria).
- SEO texts written (all match `directus/seo/2026-11-09-trigeniale-brda-26.json`).
- The sources of these texts link the exact pages since 2026-11-09 (`2026-11-09__linked-sources.md`);
  the poster and the artist sheet have no online copy and stay plain text.
- For the owner before publishing (worklog: Conflicts, Gaps): admission unknown (the site shows
  "free admission" for an empty field); a spring exhibition of the same name (April 2026) is not
  recorded; the hosts are written as Boris, Dragica and Damjan Jakončič.
