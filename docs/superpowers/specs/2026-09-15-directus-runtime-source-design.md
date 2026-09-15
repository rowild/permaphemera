# Directus as the Live Data Source — Design

Date: 2026-09-15
Status: draft, awaiting owner review
Builds on: `docs/superpowers/specs/2026-09-14-directus-conventions-schema-design.md` (schema, JSON mirror). Branch: `feature/directus-runtime`.

## Problem

The frontend reads 17 JSON files. Directus holds the same schema but no content. Editing in Directus changes nothing on the site. The owner wants Directus to be the single live source: the frontend fetches from Directus at runtime, locally today (`http://localhost:8077`), from a remote host later with the same code and a different URL.

## Decisions taken by the owner (2026-09-15)

| Question | Decision |
|---|---|
| Data source | Runtime fetch from Directus. No build-time snapshot, no fallback. |
| The JSON files | Kept until the site runs on Directus end to end. Then moved to `_BU/` (root, not in git) and deleted from the repo. |
| Images and PDFs | Uploaded into Directus. The site loads them from Directus `/assets/<id>`. They leave the frontend repo. |
| Tours | Unchanged in this step: a path string on the exhibition; folders stay in `frontend/public/media/tours/`. Own design later. |
| `reset.sh` | Deleted. No wipe in the workflow. Additive schema changes only; export/import for backup and restore; `install.sh` for a fresh machine. |
| Logo | Directus project logo = the header temple mark `frontend/public/media/svg/brand/archive-temple.svg`; login-screen foreground = `permaphemera_seal.svg`. |
| Branch | `feature/directus-runtime`, one branch for both folders. |

## Non-goals

- Hosting Directus. Local only; the URL is one env variable.
- Directus flows (English/`en` sync, participation role guard). Still open items.
- Editing content through the site. Read only.
- Content blocks, tours in object storage.
- Server-side rendering. The site stays a client-rendered SPA (`ssr: false`); the fetch happens in the browser.

## Architecture

### Data flow

```
Directus (SQLite, uploads/)  ──REST, public read──▶  browser  ──▶  useArchiveSource()  ──▶  useState('archive')
                                                                                              │
                                                              resolvers (unchanged)  ◀── useArchiveData() / useSiteNavigation()
```

One fetch per page load, in `app.vue`, before `<NuxtPage>` renders. It loads the same 17 collections the JSON files held, in the same item shape (`fields=*,translations.*`), and stores them in one shared state. `useArchiveData()` and `useSiteNavigation()` read that state synchronously, so every page and component keeps its current code. Detail pages still throw their 404 only after the data is present.

### Directus side

**Import** (`directus/scripts/import.mjs`): reads the JSON files from a source directory (default `../frontend/app/data`, later `_BU/…`), uploads every referenced file (45 today: venue images, exhibition images, PDFs, sponsor logos) into Directus folders that mirror the old path (`media/images/locations/parkschloessl/…`), and creates every record with the UUID it already has, translations inline, in dependency order: locations, venues, persons, roles, person-roles, exhibitions, participations, statements, sponsors, junctions. File fields get the new file id. Idempotent: an existing id (or, for junctions, an existing pair) is skipped. Prints counts.

**Export** (`directus/scripts/export.mjs`): the reverse. Writes every `pp_` collection as `pp_<name>.json` and every file into a target directory, default `_BU/directus-data/` (root, not in git). That is the content backup; `import.mjs --from <dir>` is the restore. Neither deletes anything.

**No reset.** `reset.sh` is deleted (owner decision 2026-09-15: the one reshape is done; a wipe has no place in the loop). Schema changes are additive: edit `schema.mjs`, run `create-schema.mjs`, which only adds what is missing. Removals and renames go through the admin app or `directus schema apply` with the snapshot, which diffs before it acts. Content stays in every case.

**Fresh machine** (`directus/scripts/install.sh`): refuses to run if `database/data.db` exists; otherwise `docker compose up -d`, wait for health, `create-schema`, `seed`, `permissions`, `apply-settings`, `check-conventions`, then `import.mjs --from <dir>` when a directory is given. The owner screen is skipped by the env variables in `.env`, read by Directus at first start; the script does not touch that.

**Public read** (`directus/scripts/permissions.mjs`): on the public policy (`$t:public_label`), `read` on every `pp_` collection except `pp_meta`, with the filter `status != archived` where the collection has `status`; `read` on `languages`; `read` on `directus_files`. Idempotent by (policy, collection, action). Part of `install.sh` after `seed`.

**Branding** (`apply-settings.mjs` extended): uploads the two SVGs once (folder `branding`), sets `project_logo`, `public_foreground`, `public_note` "PERMAPHEMERA exhibition archive".

**CORS**: `.env` already allows `http://localhost:4991`. When Directus moves to a host, `CORS_ORIGIN` gets the site's domain; noted in `directus/README.md`.

### Frontend side

| Piece | Responsibility |
|---|---|
| `nuxt.config.ts` `runtimeConfig.public.directusUrl` | from `NUXT_PUBLIC_DIRECTUS_URL`, default `http://localhost:8077`. `.env.example` documents it. |
| `app/utils/directusClient.ts` | `createArchiveClient(baseUrl)` → typed `fetchCollection(name, query)` on `$fetch`; no SDK dependency (17 GETs, nothing else). |
| `app/utils/loadArchive.ts` | `loadArchive(client)` → `ArchiveSnapshot` with the 17 collections in the JSON item shape; translations inline; file ids mapped to `${baseUrl}/assets/<id>` **here**, so records reaching the resolvers carry URL strings exactly like the JSON paths did. Throws with the collection name on any failed request. |
| `app/composables/useArchiveSource.ts` | `await useAsyncData('archive', …)` once; stores the snapshot in `useState<ArchiveSnapshot>('archive')`; exposes `{ pending, error, refresh }`. |
| `app/app.vue` | awaits the source; renders `<NuxtPage>` when loaded; a small centred archival "Loading the archive…" paragraph while pending; the existing error page on failure (`createError` with the Directus URL in the message). |
| `app/composables/useArchiveData.ts`, `useSiteNavigation.ts` | read `useState('archive')` instead of importing JSON. Same return shapes. |
| `app/types/content.ts` | adds `ArchiveSnapshot` (one field per collection, arrays of the existing record types). |
| Check scripts | `scripts/lib/archive-source.mjs` fetches the 17 collections from `DIRECTUS_URL` (env, default localhost:8077) with the same field mapping; `check-data-integrity`, `check-directory-routes`, `check-i18n-privacy`, `check-mobile-density`, `check-public-namespace` and `publish-tour` read from it instead of `app/data`. `check-public-namespace` drops its image checks (files live in Directus) and keeps the tour-folder check. `publish-tour` writes `tour` to Directus with `PATCH /items/pp_exhibitions/<id>` using `DIRECTUS_TOKEN` from the frontend `.env` (the static admin token, local only). |
| Tests | `loadArchive` unit test with a fake client: field mapping, asset URL mapping, error naming. Resolver tests unchanged. |

**Image sizing.** `/assets/<id>` returns the original. Cards may request `?width=…&format=webp` later; not in this step.

**The JSON files at the end.** Last task, after the manual QA pass on the Directus-backed site: `git mv frontend/app/data ../_BU/frontend-app-data-2026-09-15` is not possible across the ignore boundary, so: copy `frontend/app/data/` to `_BU/frontend-app-data-2026-09-15/`, `git rm -r frontend/app/data`, and delete the two hard-coded JSON imports that remain nowhere. `directus/scripts/import.mjs` then defaults to `_BU/directus-data/` (the export target). The 150 tracked image files under `frontend/public/media/images/` that the import uploaded are removed from the repo the same way (copied to `_BU/frontend-public-media-images-2026-09-15/`), except files the site references outside records (header brand SVGs, footer ornaments, method illustrations, landing hero art) — the check `check-public-namespace` lists what code still references; only unreferenced record images go.

## Error handling

- Directus unreachable at app start: the error page names the URL. No silent fallback (owner decision).
- A collection request fails: `loadArchive` throws `pp_<name>: <status> <message>`.
- A record references a file id that `/assets/` cannot serve: the browser shows a broken image; the data check reports files that do not exist in Directus (`GET /files/<id>`).
- Import: a failed upload or create stops the run with the record id; re-running skips what exists.
- Permissions missing: the browser gets 403 → the error page. `check-conventions` gains: every `pp_` collection except `pp_meta` has a public read permission.

## Verification

1. On the running instance: `node directus/scripts/permissions.mjs`, `node directus/scripts/apply-settings.mjs`, `node directus/scripts/import.mjs --from ../frontend/app/data` finish; `GET http://localhost:8077/items/pp_exhibitions?limit=1` without a token returns one record; `/assets/<id>` of a venue image returns 200 with `image/webp` or `image/jpeg`. `install.sh` is proven once on a throwaway copy of the `directus/` folder with an empty `database/`, then that copy is deleted.
2. `node directus/scripts/import.mjs` a second time creates nothing.
3. Frontend: `pnpm test`, `pnpm check:types`, all checks green with Directus running; with Directus stopped, `pnpm check:data` fails with the URL in the message.
4. `pnpm dev`: landing, artists, one venue, one exhibition, both locales, header and footer menus, all images visible from `localhost:8077/assets/…`. Same QA walk as 2026-09-14, plus the network tab shows no request to `/media/images/`.
5. Edit a venue's `lede` in the Directus admin app; reload the site; the new text shows.
6. `export.mjs` to a temp dir; the throwaway install of item 1 gets `import.mjs --from <that dir>`; its item counts equal the live instance.
7. After 4–6: JSON and record images moved to `_BU/`, repo builds and all checks pass without them.

## Open items for later

- Remote Directus host: URL, CORS origin, HTTPS, backups. Same code.
- Image presets (`?key=card`) once sizes are chosen.
- Tours to object storage with a `pp_tours` table (owner: "discuss in detail later").
- The two Directus flows.
- A `check:conventions` step in the frontend pipeline that pings Directus before the other checks and gives one clear message.
