# PROJECT_INFO — PERMAPHEMERA, 3 linked project folders

> **This file exists 3 times, with the same content**, one copy in each folder:
>
> - `/Users/robertwildling/Desktop/_WWW/_WEBSITE PERMAPHEMERA/PROJECT_INFO.md`
> - `/Users/robertwildling/Desktop/_WWW/_360_GALLERIES_AND_TOURS/PROJECT_INFO.md`
> - `/Users/robertwildling/Desktop/_WWW/_MacAPP TOUR-VIEWER/PROJECT_INFO.md`
>
> It tells any agent, fast, what the 3 projects are, how they connect, and
> where each step of the work happens. It is a map. The detailed rules live in
> each folder's own `AGENTS.md` / `README.md`, and those win over this file.
>
> When you change this file, change all 3 copies. Edit one, then copy it:
>
> ```sh
> SRC="/Users/robertwildling/Desktop/_WWW/_WEBSITE PERMAPHEMERA/PROJECT_INFO.md"
> cp "$SRC" "/Users/robertwildling/Desktop/_WWW/_360_GALLERIES_AND_TOURS/PROJECT_INFO.md"
> cp "$SRC" "/Users/robertwildling/Desktop/_WWW/_MacAPP TOUR-VIEWER/PROJECT_INFO.md"
> ```
>
> **Important rule (owner, 2026-11-04): this file is always committed, in your own folder
> only.** Every commit also commits this file when it has changed, but only the copy in the
> folder you work in. Never commit it (or anything else) in one of the other two folders: that
> is forbidden; their own sessions commit their copy. When you see a change in it that you did
> not make, read the change, check what it means for your work, and tell the owner (for
> example: the website runs an older tour viewer than the Tour Editor).
>
> Last checked against the code and the live Directus: **2026-10-26**.

---

## 1. The big picture

PERMAPHEMERA is an online archive of art exhibitions in Austria (mostly
Carinthia). Each exhibition can have a 360° walk-through tour.
Live site: <https://permaphemera.at>.

| Folder (all under `/Users/robertwildling/Desktop/_WWW/`) | What it is | Git |
|---|---|---|
| `_360_GALLERIES_AND_TOURS/` | **The pixels.** Camera files, the grading pipeline, graded masters, the tour folders, and the exports. | text files only (GitHub `rowild/permaphemera-tour-data`) |
| `_MacAPP TOUR-VIEWER/` | **The Tour Editor** (Tauri Mac app, `Tour Editor.app`) that turns a folder of panoramas into a tour (`tour.json`). Also the **web viewer** (Photo Sphere Viewer 5) that the website embeds. | yes |
| `_WEBSITE PERMAPHEMERA/` | **The website** (`frontend/`, Nuxt 4, static) and the **Directus CMS** setup (`directus/`). Also a separate side site `galerien-oesterreich/`. | yes |

### How data flows

```
DJI Osmo 360 (15520×7760 equirectangular JPG, already stitched in camera)
   │
   ▼  drop into
_360_GALLERIES_AND_TOURS/collection/_galleries/<venue>/<tour-id>/building_01/floor_01/room_01/{normal,high,low}/
   │
   ▼  run.sh (skill rowild-panorama-tour)  rename → check-heights → proof → grade → web   (= GRADING)
   │     backups → <tour>/_grading/originals/   graded JPG → <tour>/_grading/masters/   8192 WebP → <tour>/
   │
   ▼  markers (same skill, MARKERS.md) → tour.json with links, hidden markers checked
   │
   ▼  Tour Editor: tour folder = collection/_galleries/<venue>/   → writes <tour-id>/tour.json
   │
   ▼  Tour Editor: Export (⌘E) → _360_GALLERIES_AND_TOURS/exported/<tour-id>/
   │     or File → Publish to website…: this step and the two below in one window,
   │     plus save + backup; it links the tour only after the upload (Handbook Tutorial No. 4)
   │     writes → the rights data (Settings → Rights) into every WebP (XMP) and into
   │              tour.json `rights` (since 2026-11-09, Tour Editor 1.0.10)
   │
   ▼  _WEBSITE PERMAPHEMERA/frontend:  pnpm tour:publish <tour-id>
   │     copies → frontend/public/media/tours/<tour-id>/
   │     makes  → start-view.jpg there (flat room picture of the first view, for the
   │              newsletter modal; since 2026-11-09; `pnpm tour:start-view` for old tours)
   │     sets   → pp_exhibitions.tour = "/media/tours/<tour-id>/"  (PRODUCTION Directus)
   │
   ▼  _WEBSITE PERMAPHEMERA/frontend:  pnpm deploy:hetzner
         rsync → permaphemera.at  /srv/sites/permaphemera.at/html/media/tours/<tour-id>/
```

**Two kinds of data, two places:**

- **Text and records** (towns, venues, exhibitions, people, sponsors,
  organisations) live only in **Directus** (production). The website reads
  Directus in the browser each time the app starts. So a Directus change
  goes live **with no deploy**.
- **Tour images and `tour.json`** never go into Directus. They are static
  files on the web host. They need `tour:publish` plus a deploy.

The only link between the two is the text field `pp_exhibitions.tour`.

---

## 2. Quick answers

| Question | Answer |
|---|---|
| **Where do I grade images?** | `run.sh` in the global skill `rowild-panorama-tour` (`~/.claude/skills/rowild-panorama-tour/scripts/`). Fuse brackets first with the global skill `rowild-photo-fuse`. See §3 step 4. |
| **Where do I add or update a gallery (venue), a town, an artist or an exhibition?** | In **Directus** (production): `pp_venues`, `pp_locations`, `pp_persons`, `pp_exhibitions`. Follow the step-by-step how-to **`_WEBSITE PERMAPHEMERA/docs/how-to-gallery-and-exhibition.md`** (global Claude skill `rowild-create-or-update-gallery-or-exhibition-in-permaphemera`). The sources for each gallery are in `_360_GALLERIES_AND_TOURS/collection/<group>/<venue-folder>/sources.txt` and its PDFs. See §4. |
| **Where do I start a new 360° tour (a new shoot)?** | `_360_GALLERIES_AND_TOURS/collection/<group>/<venue>/<tour-id>/building_01/floor_01/room_01/normal/`. See §3 step 2. |
| **Where do I build the tour (links, hotspots, texts)?** | `Tour Editor.app` (in `_MacAPP TOUR-VIEWER/`). See §3 steps 5–6 (markers are made by script first). |
| **Where do I upload finalised tours?** | Export from the Tour Editor to `_360_GALLERIES_AND_TOURS/exported/`. Then in `_WEBSITE PERMAPHEMERA/frontend/`: `pnpm tour:publish <tour-id>`, then `pnpm deploy:hetzner -- --tours <tour-id> --no-site` (only this tour; the site is not built, tested or uploaded). Or in the Tour Editor: File → Publish to website… (or the tour's Export tab), which does these steps plus the save and the backup in one window (Handbook Tutorial No. 4). Since 2026-11-04 it uploads only the tour: the site reads Directus in the browser, so a tour needs no site build. See §3 steps 7–8. |
| **Where do I change the database schema (new fields)?** | `_WEBSITE PERMAPHEMERA/directus/scripts/schema.mjs` plus the other files that root `AGENTS.md` lists. Never only in the admin app. |
| **Where does the viewer JS on the website come from?** | `_MacAPP TOUR-VIEWER`. In `_WEBSITE PERMAPHEMERA/frontend/`, `pnpm viewer:update` runs its `pnpm build:all`, copies `dist/tour-viewer.js` and `dist/tour-viewer.css` to `public/media/tour-viewer/` and writes their fingerprint (`app/utils/tourViewerBuild.ts`); then commit and `pnpm deploy:hetzner`. Or in the Tour Editor: File → Update viewer on website… does all of it, and uploads ONLY the two viewer files (`pnpm deploy:hetzner -- --viewer-only`: no site build, no site tests; since 1.0.2, 2026-11-04). When the viewer changed, the editor shows it: a warning on the start page, and a red pulsing dot on "File" and on that menu item. It asks only when the viewer itself changed, not on every release (since 1.0.2); the viewer says the app version it was built in (`TourViewer.version`, `data-viewer-version`), so the website's viewer may say an older version than the app. |

---

## 3. The tour workflow, step by step

**The whole chain is ONE checklist: the global skill `rowild-panorama-tour`**
(`~/.claude/skills/rowild-panorama-tour/SKILL.md`, since 2026-10-20). It has the command and a
"done when" check for every step, and holds all the 360 scripts (`scripts/`) and their pages
(NAMING.md, GRADING.md, MARKERS.md). This
section is only the overview.

| # | Step | Where | Skill |
|---|---|---|---|
| 0 | Exhibition record in Directus (production) | Directus | `rowild-create-or-update-gallery-or-exhibition-in-permaphemera` |
| 1 | Fuse brackets (bracket shoots only; never `punch` tour photos) | the shoot folder | `rowild-photo-fuse` |
| 2 | Photos in place, tour id `YYYY-MM-DD-<gallery>-<title>`, `poster.pdf` | `_360_GALLERIES_AND_TOURS/collection/` | `rowild-panorama-tour` (NAMING.md) |
| 3 | `rename` + `check-heights` | `run.sh` in the skill | `rowild-panorama-tour` (NAMING.md) |
| 4 | `proof`, `grade`, `web` (`sky` outdoors), `verify` | `run.sh` in the skill | `rowild-panorama-tour` (GRADING.md) |
| 5 | Markers + hidden markers | `scripts/markers/` in the skill | `rowild-panorama-tour` (MARKERS.md) |
| 6 | Check and save (⌘S) in the Tour Editor | `_MacAPP TOUR-VIEWER` | `rowild-panorama-tour` (SKILL.md) |
| 7 | Export (⌘E) to `exported/<tour-id>/` | Tour Editor | `rowild-panorama-tour` (SKILL.md) |
| 8 | `pnpm tour:publish` + `pnpm deploy:hetzner` (or steps 7–8 in one go: File → Publish to website…, which also saves and backs up) | `_WEBSITE PERMAPHEMERA/frontend/` | `rowild-panorama-tour` (SKILL.md) |

The Tour Editor does **no** grading. It only reads images, writes `tour.json`, cuts tiles
and exports. It makes no network calls of its own (on purpose). Only File → Publish to
website… and File → Update viewer on website… (desktop app) run the website's and the
skill's own scripts (`tour:publish`, `deploy:hetzner`, `viewer:update`, `run.sh`; see
`src-tauri/src/publish.rs`), and those talk to Directus and the web host.

---

## 4. Adding galleries, locations and exhibitions (Directus)

Directus is the single content source. The records are in production:

| Collection | Means | Key fields |
|---|---|---|
| `pp_locations` | A **town** | `title`, `slug`, `latitude`, `longitude` (required), `postal_code`, `state`, `country` |
| `pp_venues` | A **building / gallery** | `title`, `slug` (required), `type` (gallery, museum, kunsthalle, art_cafe, open_air, forum), `location` → `pp_locations`, `part_of` → parent venue, `address`, `website_url`, `image`, `hero_image` |
| `pp_exhibitions` | An **exhibition or event** | `title`, `slug`, `start_date`, `end_date` (required), `kind`, `primary_venue` → `pp_venues`, `further_venues`, `image`, `source_pdf`, `tour`, `tour_status`, `tour_available_from` |
| `pp_persons`, `pp_roles`, `pp_exhibition_participations` | People and what they did in an exhibition | Each published person has a page `/persons/<slug>/`: photo, intro line, bio, born, lives in (since 2026-10-14) |
| `pp_organisations` (+ memberships, venue relations, `pp_exhibition_organisers`) | Associations and institutions | Photo fields `image`, `image_alt`, `image_caption` (since 2026-10-14); member names link to person pages |
| `pp_sponsors`, `pp_websites`, `pp_navigations` | Supporters, external links, menus | A published sponsor has a page `/sponsors/<slug>/` (all are drafts now) |

Rules:

- **Order:** location → venue → exhibition → participations / organisers.
- Exhibition → venue → location. There is no direct exhibition → location link.
- Translations: languages `de` and `en`, in `pp_translations__*` tables.
- Every record has `status`: `draft`, `published`, `archived`. **The site shows
  only `published`.** The public API also returns drafts, so do not put private
  text in drafts.
- Images and PDFs on records are Directus files, in folders named
  `media/<venue-slug>`. Venue photos come only from Wikimedia Commons;
  exhibition images are press images with a © note, or the placeholder.
- **Adding records is not a schema change.** A new field or collection is: then
  change `directus/scripts/schema.mjs`, `frontend/shared/archive-schema.mjs`
  (file fields / new collections), `frontend/app/types/content.ts`, and
  `_Plans/exhibitions-plan.md` §2 in the same commit (root `AGENTS.md`).
- `galerien-oesterreich/` (657 researched Austrian galleries, a separate site
  at gvoe.rowild.at) is **not** connected to Directus. Use it as a research
  source only.

**The full procedure** (sources, search first, images and credits, field
conventions, tour fields, payloads, verification) is
`_WEBSITE PERMAPHEMERA/docs/how-to-gallery-and-exhibition.md`. Images and PDFs
are uploaded with `directus/scripts/upload-files.mjs`.

**Ways to write:**

- Admin app: <https://permaphemera.project-backends.info>.
- MCP server `permaphemera-directus`. It is configured at **user level** in
  `~/.claude.json` (not in any repo), so it works from all 3 folders. It points
  at `https://permaphemera.project-backends.info/mcp`, which is **production**.
  Every write is live.

---

## 5. Per-folder reference

### `_360_GALLERIES_AND_TOURS/` (about 34 GB; git for its text files only, GitHub `rowild/permaphemera-tour-data`)

| Folder | Purpose |
|---|---|
| `collection/` | The tours. Until the last step the master JPG as working image, then the 8192 WebP (or, for tiled tours, the master JPG + its tiles) + `tour.json` + `poster.pdf`. Also a work area: raw shoots, brackets, phone photos, `_BU/` backups. |
| `<tour>/_grading/` | Inside each tour (since 2026-10-24; before, one `_grading/` at the project root): `originals/` (untouched camera files; "has a backup" marks a file as graded), `masters/` (native size: the camera file unless the owner asked for grading, then graded JPEG q93; WebP and tiles are made from here), `versions/` (snapshots `YYYY-MM-DD-HHMM-<label>/{web,masters}/`), `proof/` and `sky-proof/` (the contact sheets of `run.sh proof` / `sky-proof`, since 2026-10-26; before, on the Desktop; `run.sh web` removes them), and when needed `verify-accepted.txt` and `move-log.txt`. A moved or renamed tour folder takes it along; the Tour Editor ignores it. The former `_pipeline/` folder was deleted on 2026-10-20. |
| `<tour>/_markers/` | Inside each tour (since 2026-10-25; before, one `_markers/<tour-id>/` per tour at the project root): work folder and results of the marker steps: step results, check sheets, hidden-marker review, the tour's `meta.json`. The feature cache `featcache/` (about 12 MB per photo) exists only during a run. A moved tour takes it along; the Tour Editor ignores it. |
| `exported/` | Tour Editor exports, flat by tour id. Input of `pnpm tour:publish`. |
| `__MATERIAL/` | Material per gallery and artist, kept by hand. No script uses it. |
| `_experiments/` | Finished tests, no script uses them: `2026-10-03-wb-probe-stadtgalerie/` (white-balance experiment), `2026-10-19-flicker-probe-palais-fugger/` (lamp-flicker analysis and the 24 repaired Fugger photos, not yet in the tour; see its `README.md`). |

- **Git, text files only** (since 2026-10-20): GitHub `rowild/permaphemera-tour-data`
  (private). `.gitignore` lets in only `*.json`, `*.txt`, `*.md`, `poster.pdf` and the marker logs: the
  `tour.json` files, the tours' `_markers/`, logs, `sources.txt`, posters (about 30 MB). Photos, masters,
  originals, exports and snapshots are NOT in git; the backup to the external drive keeps
  them: `run.sh backup` of the skill (`BACKUP_TARGET`, on this Mac
  `/Volumes/Work/_360_GALLERIES_AND_TOURS`; the drive must be connected). Save after a step that changes `tour.json` or marker results, for ONE tour (other tours may
  hold someone's open work): `TOUR=<path below collection/> ./run.sh save "<step>"` (skill
  `rowild-panorama-tour`).
- The scripts are NOT here: they live in the global skill `rowild-panorama-tour`
  (`~/.claude/skills/rowild-panorama-tour/scripts/`, since 2026-10-20). Its source is the
  git repo `~/Desktop/_WWW/__SKILLS-DEV/rowild-skills` (GitHub `rowild/rowild-skills`,
  private) with all `rowild-*` skills; its `setup.sh` links them into `~/.claude/skills/`
  and `~/.agents/skills/` (Codex) and writes the paths file `~/.config/rowild-skills/paths.env`.
  Edit skills in the repo, then commit and push.
- A tour's masters and originals are in its own `_grading/` (since 2026-10-24), so moving or
  renaming a tour folder inside `collection/` takes them along.
- This folder was called `_tours/` and sat inside the Tour Editor repo until
  2026-09-29.

### `_MacAPP TOUR-VIEWER/` (git, GitHub `rowild/tour-editor`, private, since 2026-10-20)

- Read first: `CLAUDE.md`, `README.md`, `AGENTS.md` (large; skim headings).
- Two apps, one data file (`tour.json`, schema v2; Tour → Building → Floor →
  Room → Position → Height):
  - Viewer: `index.html` → `src/viewer/`. Also built as an embeddable widget
    (`dist/tour-viewer.js`, `dist/tour-viewer.css`, `mountTour()`).
  - Editor: `editor.html` → `src/editor/` (Vue 3), in the Tauri shell `src-tauri/`.
- Tiling: Rust `src-tauri/src/tiles.rs` or the JS/WASM worker
  `src/editor/tiles/tile.worker.js`.
- No hardcoded paths to the 360 folder. The library and export folders are
  picked in the app and remembered per machine. The project folders (the 360
  folder, this app, the website, the tour scripts, the backup) are in
  `~/.config/rowild-skills/paths.env`, which the skill's scripts and the
  website's `tour:publish` / `viewer:update` read too; Settings → Folders
  shows and edits it.
- Commands (pnpm): `dev`, `build`, `build:all` (+ widget), `desktop:dev`,
  `desktop:build` (copies the app to `Tour Editor.app`), `test`, `typecheck`,
  `verify` (the full gate; every change ends with it).
- The 360 scripts (naming, grading, markers) and their docs are the global skill
  `~/.claude/skills/rowild-panorama-tour/` (since 2026-10-20; before: `_pipeline/` in the
  360 folder plus the skills `rowild-panorama-tour-naming`/`-grading`/`-markers`/`-setup`,
  earlier the project skill `.claude/skills/pano-pipeline/` in this repo).

### `_WEBSITE PERMAPHEMERA/` (git, GitHub `rowild/permaphemera`)

- Read first: `AGENTS.md`, then `frontend/AGENTS.md`, `directus/README.md`.
- `frontend/` — Nuxt 4, static (`nuxt generate`). Reads all content from
  Directus once at app start (`app/composables/useArchiveSource.ts`). Tour
  access logic: `app/utils/tourAccess.ts`. Tours: `public/media/tours/`
  (git-ignored). Viewer: `public/media/tour-viewer/`.
- `directus/` — Directus 11 + SQLite. Local: `docker-compose.yml`
  (<http://localhost:8077>). Production stack: `directus/hetzner/`. Scripts in
  `directus/scripts/` (`setup.sh`, `schema.mjs`, `create-schema.mjs`, `seed.mjs`,
  `permissions.mjs`, `export.mjs`, `import.mjs`, `upload-files.mjs`, …). Scripts
  use local `.env` by default; `DIRECTUS_ENV_FILE=.env.remote` targets production.
- `docs/how-to-gallery-and-exhibition.md` — how to create or update galleries,
  towns, artists and exhibitions. Global Claude skill:
  `~/.claude/skills/rowild-create-or-update-gallery-or-exhibition-in-permaphemera/` (until 2026-10-20 the project skill `gallery-exhibition`).
- `galerien-oesterreich/` — separate static React site (GVÖ), not linked to Directus.
- `_Plans/exhibitions-plan.md` — the active architecture plan (§2 = data model).
- `_Material/`, `_BU/` — git-ignored source material and backups.

---

## 6. Hosts and environments

| What | Where |
|---|---|
| Live site | <https://permaphemera.at> — Hetzner, `/srv/sites/permaphemera.at/html`, Cloudflare in front. Deploy: `pnpm deploy:hetzner`. |
| Tours on the server | `/srv/sites/permaphemera.at/html/media/tours/<tour-id>/` |
| Directus, production | Admin <https://permaphemera.project-backends.info>. The site reads it at <https://permaphemera.at/cms/>. Server stack `/srv/stacks/permaphemera.project-backends.info/`. Credentials: `directus/.env.remote` (git-ignored). |
| Directus, local | <http://localhost:8077> via `directus/docker-compose.yml`, credentials in `directus/.env`. |
| `frontend/.env` | `NUXT_PUBLIC_DIRECTUS_URL` = **production**. So `pnpm dev` and `pnpm tour:publish` use production data. |
| Old host (legacy) | `pnpm deploy` (`frontend/scripts/deploy.mjs`) uploads to all-inkl, `exhibition-archiv.rowild.at`. Not the permaphemera.at route. |
| GVÖ side site | `gvoe.rowild.at`, via `galerien-oesterreich/scripts/deploy-all-inkl.sh`. |

Never print or commit secrets (`directus/.env*`, `frontend/.env*`, the MCP
Authorization header in `~/.claude.json`).

---

## 7. Traps (checked on 2026-10-26)

The stale docs found on 2026-10-14 (old deploy command, retired JSON data,
old folder names and paths, `TOUR=` examples) were corrected that day in all
3 folders. What is left:

- `pnpm deploy` still exists in `frontend/package.json`. It uploads to the old
  all-inkl host, not to permaphemera.at. Use **`pnpm deploy:hetzner`**.
- A tour button shows only when `tour_status` is `available` **and**
  `tour_available_from` has passed. `pnpm tour:publish` sets only `tour`
  (except `--link-only --show-now`, which the Publish window uses for "Show now").
- The Kindergalerie tour is no longer in `collection/`: it sits in
  `__MATERIAL/kindergalerie_klagenfurt/`. It was graded ad hoc on 2026-09-22 (log:
  `__MATERIAL/kindergalerie_klagenfurt/_grading/grading-claude-2026-09-22.txt`); its
  originals are in that `_grading/originals/`.
- `dobratsch-aussichtsplatform-2026-08-16`: its `tour.json` id is
  `Dobratsch_Aussichtsplatform_2026-08-16` (the name of its folder in the former project-level
  `_grading/masters/`, not its tour folder).

---

## 8. State on 2026-10-26 (a snapshot; check before you trust it)

- **Live with a tour** (Directus `tour` set, `tour_status` `available`, files on
  the server), 11 tours:
  - Parkschlössl Spittal/Drau: `2026-06-01-…-adi-schmoelzer`,
    `2026-06-15-…-comic-festival`, `2026-06-22-…-nicoline-von-heyl`,
    `2026-07-06-…-lebenshilfe-spittal-drau`, `2026-07-13-…-herbert-meisslitzer`,
    `2026-07-30-…-sylvia-campidell-und-judith-maria-kulle`,
    `2026-08-10-…-moertl-birgit`, `2026-09-07-…-santino-solace`.
  - Europahaus Klagenfurt: `2026-10-03-…-ines-urach-schwach-unperfekt-ausgefranst-echt`,
    `2026-10-03-…-kunstverein-velden-spannungsfelder-und-perspektiven`.
  - Studiogalerie Klagenfurt: `2026-10-15-…-trigeniale-26`.
- **Exported, not published:** `2026-04-13-wagner-reloaded` (Theatergalerie),
  `2026-10-03-walther-preiml-sehnsucht` (stARTup).
- **In `collection/` with `tour.json`, not exported:** in `_galleries/`:
  `alpen_adria_galerie_klagenfurt/2026-06-24-mighty-woman` and
  `/2026-09-22-durch-die-zeit`, `living_studio_klagenfurt/2026-09-30-hydrotopia`,
  `parkschloessl_spittal/2026-08-24-…-peter-kohlweiss`,
  `stadtgalerie_klagenfurt/2026-05-29-all-about-nature`; `_others/mamas-party-2026-08-29`;
  `_outdoors/dobratsch/dobratsch-aussichtsplatform-2026-08-16` and `/dobratsch-sonnenwege`.
- **Photos, no `tour.json` yet:** `galerie_im_stiegenhaus/2026-09-14-…`,
  `galerie_palais_fugger/2026-10-03-mediterraneo`,
  `galerie_porcia/2026-09-11-ingrid-proeller-epische-gemaelde`,
  `living_studio_klagenfurt/2026-05-30-biodiversitaet-entdecken`,
  `wallnerhaus_kleblach-lind/2026-05-28-…`, the other five `dobratsch/` walks.
  The remaining tour folders (coming shows, `bv_klagenfurt/`, `_museums/`) hold no
  photos yet.
- Directus: 30 exhibitions (27 published, 3 draft), 44 venues (12 published,
  32 draft).
