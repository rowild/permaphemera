# Events ("Veranstaltungen") — a new collection

Date: 2026-11-04. Branch: `feature/events` (local only, not pushed). Status: **released 2026-11-04 as 0.0.65** (owner: "release it"; the two events and the menu item published as part of the release, owner's choice).
Source: `BACKLOG.md` → "Events: a new collection for festivals and similar events".
Helper scripts and read-outs: `plans/2026-11-04__events-collection/`.

## Owner decisions (2026-11-04)

1. Two events today: the **Spittaler Comicfestival** and the **ORF Lange Nacht der Museen**.
   The pop-up gallery in Knittelfeld is not an event.
2. **Event + editions:** one event record with its own page; one edition per year (number,
   dates); exhibitions belong to an edition.
3. **Event pages, an index page `/events/` and a main-menu item.**
4. The old organisation record "Spittaler Comicfestival" is **deleted** after the move, once
   nothing points to it.
5. **Words:** the site archives exhibitions, so exhibition records are "Ausstellung(en)".
   "Veranstaltung(en)" / "Event(s)" is the name of the new collection. A special single record
   of kind `event` (today only "BV Flohmarkt 2026") keeps "Veranstaltungseintrag" (owner: "ok when
   it is a special exhibition like a Flohmarkt"). A scan of both locale files found no other
   generic use of "Veranstaltung" for exhibitions; "Ausstellungen und Veranstaltungen" on
   organisation pages becomes accurate.
6. **Build locally** in a local Directus with a proper schema (`directus/scripts/schema.mjs`), so
   that the live install is `create-schema.mjs` plus one data script.

## Schema (`directus/scripts/schema.mjs`; also `frontend/shared/archive-schema.mjs`,
`frontend/app/types/content.ts`, `_Plans/exhibitions-plan.md` §2, as root `AGENTS.md` says)

- `pp_events` (entity, status): `title`, `slug`, `kind` (`festival`, `long_night`),
  `location` (M2O town; empty for a nation-wide event), `lede`, `description`, `about_html`,
  `image` + `image_alt` + `image_caption`, `website_url`, `seo`, `translations` (de/en, English
  mirrored on the record, as on every entity).
- `pp_event_editions` (child of events, no status: shown when its event is published):
  `event`, `edition_number` (the "7th"), `year`, `start_date`, `end_date`, `sort`.
- `pp_exhibitions.event_edition` (M2O, nullable; alias `exhibitions` on the edition).
- `pp_event_organisers` (child of events, no status): `event`, `organisation`, `role`
  (`organiser`, `presenter`, `cooperation`, `supporter`), `sort`.
- Junctions: `pp_mm__events_websites`, `pp_mm__events_news`.
- Not now (no case yet): event ↔ venue without an exhibition, event sponsors.

## Data (local first; on the live Directus at the release, by one script)

`plans/2026-11-04__events-collection/migrate-events.mjs`, idempotent, `--env` local or remote:
- Event "Spittaler Comicfestival" (`spittaler-comicfestival`), kind `festival`, town Spittal an der
  Drau, texts from the organisation record (de/en, SEO); edition 7, 2026, with "Auf Linien zum
  Leben"; organiser Austriatoon; the two news links. The news text "Der Sommer im Parkschlössl"
  links `/events/spittaler-comicfestival/` again.
- Event "ORF Lange Nacht der Museen" (`lange-nacht-der-museen`), kind `long_night`, no town;
  edition 2026 (3 October) with the four exhibitions of that night.
- Both as **drafts**; the owner publishes. Main-menu item "Veranstaltungen" / "Events" as draft
  until the release.
- Then delete the organisation record "Spittaler Comicfestival" and its rows.

## Website (components first, test first)

- Data: `COLLECTIONS`, loader, types; `resolveEvents` (unit tests); `useArchiveData`.
- `/events/` index (`ArchiveDirectoryHero`, the events as cards), `/events/<slug>/` (shared hero
  parts, text, editions newest first with `ExhibitionCardGrid`, organisers, links), `/en/…` too.
- "Teil von …" / "Part of …" on an exhibition page; events on organisation pages; news chips.
- Menu key `events` (`navActive`), `check:data` allows it in the main menu.
- SEO (`shared/seo.mjs`, sitemap, snapshots), `usePageSeo` on both pages.
- Checks: `check:data` event rules; e2e tests for the index, the event page, the "part of" link.
- Docs and skills: how-to (create an event, not an organisation, for a festival), the two data
  skills, `PROJECT_INFO.md` only if the workflow changes.

## Progress (2026-11-04, evening)

Done on the branch, test first, all against the local Directus (a copy of the live data):
schema (39 schema tests), restore order fixed and tested (`import.mjs` dropped organisations, news
and six junctions), data script run twice locally (second run: no change), resolver and news,
shared `ArchiveRecordHero` / `ArchiveRecordExhibitions` (person and organisation pages
pixel-checked), event index and pages, "Teil von" on exhibitions, events on organisation and news
pages, SEO and sitemap, data-check rules, schema-sync test for the loader's lists. Gates on the
local build: 396 unit/component tests, 160 browser tests. Locally only, the two events and the
menu item are published for the review.

Notes:
- Two commits of the Tour Editor session (`bc73893` deploy `--viewer-only`, `9311aa0`
  PROJECT_INFO.md) landed on this branch (shared folder); owner: leave them on the branch.
- Commit `a130ed6` carried 22 MB of stray screenshots (removed in `fbb8a19`). Merge with
  `git merge --squash` so they never reach `main`.

## Release order (owner's go)

1. `cd directus && DIRECTUS_ENV_FILE=.env.remote node scripts/create-schema.mjs` and
   `… node scripts/permissions.mjs` — **before** the website upload: the site loads every listed
   table at start and fails if one is missing.
2. `DIRECTUS_ENV_FILE=.env.remote node ../plans/2026-11-04__events-collection/migrate-events.mjs --dry-run`,
   then without `--dry-run`. Events and menu item stay drafts; the owner publishes them.
3. Squash-merge into `main`, changelog, version, `pnpm deploy:hetzner -- --site-only`.
4. Then update the two global data skills (`~/.claude/skills/rowild-new-gallery-creation`,
   `…/rowild-create-or-update-gallery-or-exhibition-in-permaphemera`): a festival or museum night
   is an event with an edition, never an organisation (as in the how-to).
5. Schema snapshot (`snapshot.mjs`), `_Plans/exhibitions-plan.md` §2, BACKLOG entry closed.

## Steps

1. Local Directus from a fresh export of the live data (backup copy; read-only on live).
2. Schema in `schema.mjs`, test first (`build.test.mjs`); `create-schema.mjs` local.
3. Data script against local.
4. Frontend against local Directus (dev server on 4991 with `NUXT_PUBLIC_DIRECTUS_URL` local).
5. All gates; review with the owner on localhost.
6. Release (owner's go): `create-schema.mjs` + `permissions.mjs` on live, data script on live,
   merge, deploy.
