# Umami: weekly sums kept for good (2026-11-11)

Owner's request (2026-11-11): the nightly job deletes PERMAPHEMERA's Umami visit data after
36 months. Keep the history instead: before anything goes, weekly sums of every important
collection are stored for good. The detailed visit rows still go after 36 months (GDPR,
storage limitation); the sums point to no person.

Owner's choices (2026-11-11):

- Option 1 of two: weekly sums for good, the detail rows still go after 36 months.
- "City" means both: the visitor's city (from Umami) and the town of the records (sums of the
  galleries, exhibitions, organisations and events in a town).
- The sums live in Directus (admin only, never public).
- 360° tours are counted too: each tour opening is a Umami event.

## What is counted

One row per week (Monday 00:00 to Monday 00:00, Vienna time), kind and thing:

| kind | one row per | views | visitors | tour_opens |
|---|---|---|---|---|
| `site` | week | all page views | distinct visitors | all tour openings |
| `record` | exhibition, person, gallery, organisation, event, news article, sponsor | views of its page (de + en together) | distinct visitors | exhibitions: openings of its tour |
| `town` | town (`pp_locations`) | views of its galleries, exhibitions (via the gallery), organisations, events | distinct visitors | openings of the tours of its exhibitions |
| `page` | other page (start page, lists, about …; path without `/en`, without `#…`) | views | distinct visitors | — |
| `country` | visitor country | views | visitors | tour openings |
| `city` | visitor city (label "AT · AT-9 · Vienna") | views | visitors | tour openings |
| `referrer` | other website that sent visitors (domain) | views | visitors | — |
| `device` | desktop / laptop / mobile / tablet | views | visitors | — |

Persons have no town (`based_in` is free text), so they are not in the town sums.

A "visitor" is Umami's visitor code, which changes every month; a weekly visitor count is
therefore exact within a week.

## Parts

1. **Tour openings** (site): `app/composables/useTourViewer.ts` sends
   `umami.track('tour-open', { tour: '<tour id>' })` once the tour is open. Test first.
2. **Directus collection** `pp_stats_weekly` (`directus/scripts/schema.mjs`): statusless, marked
   `private` so `permissions.mjs` never gives it a public read rule (`public-rules.mjs`,
   `check-conventions.mjs`, `build.test.mjs`). Fields: `key` (unique, `week|kind|id`), `week`,
   `kind`, `collection`, `item`, `label`, `path`, `views`, `visitors`, `tour_opens`.
3. **Job user**: a Directus user "Statistics job" with its own policy (create + read on
   `pp_stats_weekly`, read on the record collections) and a static token. The token lives only in
   `/srv/sites/permaphemera.at/stats-weekly-data/directus.env` (mode 600).
   Script: `directus/scripts/stats-job-access.mjs`.
4. **The job** `frontend/scripts/stats-weekly.mjs` (pure logic in `scripts/lib/stats-weekly.mjs`,
   unit tests) and `frontend/scripts/server/stats-weekly.sh`:
   - asks Directus which week comes next (the first one not stored);
   - exports that period from Umami (`docker exec umami-db-1 psql`, JSON lines) into the data
     folder;
   - sums it in the node container, writes the missing rows, deletes the export.
   It writes only rows whose `key` is missing: a second run adds nothing, a broken run is
   finished by the next one. Weeks are only summed once complete.
5. **Deploy**: `scripts/deploy-hetzner.sh` copies the job and adds the cron line
   (Mondays 05:30). First run: all weeks since 2026-10-19 (Umami started 2026-10-24).
6. **Texts**: privacy page de/en (tour openings are counted; detail rows go after 36 months,
   weekly totals stay), its date; `directus/hetzner/README.md`, retention script comment,
   `AGENTS.md` and `frontend/AGENTS.md` pointers, `BACKLOG.md`, `docs/exhibitions-plan.md` §2,
   restore order (`directus/scripts/import-order.mjs`).

## Not changed

- The 36-month deletion of the detail rows stays (it now only removes what is already summed).
- The Matomo notes stay (owner, 2026-11-11).

## Status (2026-11-11)

- Built and tested (`pnpm verify`: 525 tests; Directus script tests 48; live conventions check OK).
- Directus: `pp_stats_weekly` created (schema 2026-11-11.1), public read refused (403 on both
  addresses). User, role and policy "Statistics job" created; token only in the server file.
- Server: job copied, cron Mondays 05:30 added. First run wrote 221 rows for the weeks
  2026-10-19, 2026-10-26, 2026-11-02; a second run wrote 0 (no doubles).
- Released as 0.0.80 (2026-11-11): the tour counting and the new privacy texts are live.
