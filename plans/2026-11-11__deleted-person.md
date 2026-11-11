# Deleted person: analysis (2026-11-11)

Owner's question: within the last 14 days a person without first and last name was deleted
in the admin app (it looked empty); it may have had a display name. When, and can it be restored?

## Finding

The activity log of production Directus holds **one** delete in `pp_persons` in the last 14 days
(the 62 deleted on 2026-10-14 at 11:35 UTC are older: test data from before the import, e.g.
"Dario Novak"):

| | |
|---|---|
| Deleted | 2026-11-04 19:47:09 UTC = **20:47 Vienna**, by the Admin account |
| Record | `f7c02cfe-8aa2-4341-8c27-4852c219078a`, slug `kuenstlerinnen-und-kuenstler-der-lebenshilfe-knittelfeld` |
| What it was | the collective **"Künstlerinnen und Künstler der Lebenshilfe Region Knittelfeld"** (`is_collective`, `display_name`, first and last name empty), status **draft**, created 2026-11-01 20:41 UTC by the four-new-galleries run |
| Belonged to | exhibition `kunstkalender-hoffnung-und-frieden` (published), first artist (sort 0) |

What went with it:

- Its translation rows (211 en, 212 de) and its role row (182) were removed by the database
  (cascade); the log has no own entry for them.
- The exhibition's participation `394ee646-27aa-4b5b-95d8-c2dfb19a7d54` (artist, sort 0) stayed,
  now with `person` = empty.
- On the site nothing visible changed: the collective was a draft, so it never showed.

## Recoverable: yes, completely

The revisions hold the full last version of the person (all fields, SEO, its id) and the full
English and German texts (`plans/2026-11-11__deleted-person/restore-data.json`, written read-only
by `scripts/backup-copy.mjs`). The role row's data is not stored; it was the artist role (the
participation uses it).

Restore (not done, waiting for the owner): create the person with the same id and data
(draft), its two translations, the role `artist`, and set the participation's `person` back.
Its `about_html` still ends with the old "Source: lebenshilfe-knittelfeld.at, meinbezirk.at."
line; before publishing it needs the sources list with links to the exact pages (how-to §7a).

## Why it looked empty

The admin list of persons shows first and last name only. A collective has neither; its name is
in `display_name`. Fix proposal: the list template shows
`{{display_name}}{{first_name}} {{last_name}}` (schema `persons.displayTemplate`), so a collective
shows its name.

## Restored (2026-11-11, owner's OK)

`scripts/restore.mjs`: the person with its old id, draft, display name, all fields and both
texts; the old source line became the linked list ("Künstlerischer Vormittag",
lebenshilfe-knittelfeld.at, 25 March 2026; "Kunst, die von Herzen kommt", meinbezirk.at,
30 October 2026, the pages the exhibition cites); role artist; participation `394ee646…` points to
it again. SEO texts en/de from the history (`seo-restore.json`). `pnpm check:data` OK. The owner
fixed the admin list template (2026-11-11).
