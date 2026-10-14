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
> Last checked against the code and the live Directus: **2026-10-14**.

---

## 1. The big picture

PERMAPHEMERA is an online archive of art exhibitions in Austria (mostly
Carinthia). Each exhibition can have a 360° walk-through tour.
Live site: <https://permaphemera.at>.

| Folder (all under `/Users/robertwildling/Desktop/_WWW/`) | What it is | Git |
|---|---|---|
| `_360_GALLERIES_AND_TOURS/` | **The pixels.** Camera files, the grading pipeline, graded masters, the tour folders, and the exports. | no |
| `_MacAPP TOUR-VIEWER/` | **The Tour Editor** (Tauri Mac app, `Tour Editor.app`) that turns a folder of panoramas into a tour (`tour.json`). Also the **web viewer** (Photo Sphere Viewer 5) that the website embeds. | yes |
| `_WEBSITE PERMAPHEMERA/` | **The website** (`frontend/`, Nuxt 4, static) and the **Directus CMS** setup (`directus/`). Also a separate side site `galerien-oesterreich/`. | yes |

### How data flows

```
DJI Osmo 360 (15520×7760 equirectangular JPG, already stitched in camera)
   │
   ▼  drop into
_360_GALLERIES_AND_TOURS/collection/<group>/<tour-id>/building_01/floor_01/room_01/{normal,high,low}/
   │
   ▼  _pipeline/run.sh  rename → proof → grade → web           (= GRADING)
   │     backups → _originals/   graded JPG → _masters/   8192 WebP → collection/
   │
   ▼  Tour Editor: library = collection/   → writes collection/<…>/<tour-id>/tour.json
   │
   ▼  Tour Editor: Export (⌘E) → _360_GALLERIES_AND_TOURS/exported/<tour-id>/
   │
   ▼  _WEBSITE PERMAPHEMERA/frontend:  pnpm tour:publish <tour-id>
   │     copies → frontend/public/media/tours/<tour-id>/
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
| **Where do I grade images?** | `_360_GALLERIES_AND_TOURS/_pipeline/` with `./run.sh`. Fuse brackets first with the global `fuse` skill. See §3 step 2. |
| **Where do I add or update a gallery (venue), a town, an artist or an exhibition?** | In **Directus** (production): `pp_venues`, `pp_locations`, `pp_persons`, `pp_exhibitions`. Follow the step-by-step how-to **`_WEBSITE PERMAPHEMERA/docs/how-to-gallery-and-exhibition.md`** (Claude skill `gallery-exhibition`). The sources for each gallery are in `_360_GALLERIES_AND_TOURS/collection/<venue-folder>/sources.txt` and its PDFs. See §4. |
| **Where do I start a new 360° tour (a new shoot)?** | `_360_GALLERIES_AND_TOURS/collection/<group>/<tour-id>/building_01/floor_01/room_01/normal/`. See §3 step 1. |
| **Where do I build the tour (links, hotspots, texts)?** | `Tour Editor.app` (in `_MacAPP TOUR-VIEWER/`). See §3 step 3. |
| **Where do I upload finalised tours?** | Export from the Tour Editor to `_360_GALLERIES_AND_TOURS/exported/`. Then in `_WEBSITE PERMAPHEMERA/frontend/`: `pnpm tour:publish <tour-id>`, then `pnpm deploy:hetzner`. See §3 steps 4–5. |
| **Where do I change the database schema (new fields)?** | `_WEBSITE PERMAPHEMERA/directus/scripts/schema.mjs` plus the other files that root `AGENTS.md` lists. Never only in the admin app. |
| **Where does the viewer JS on the website come from?** | `_MacAPP TOUR-VIEWER`: `pnpm build:all` → copy `dist/tour-viewer.js` and `dist/tour-viewer.css` to `_WEBSITE PERMAPHEMERA/frontend/public/media/tour-viewer/`. |

---

## 3. The tour workflow, step by step

### Step 1 — Put the shoot in place (`_360_GALLERIES_AND_TOURS`)

- Folder layout for every tour:
  `collection/<group>/<tour-id>/building_NN/floor_NN/room_NN/{normal|high|low}/NN.jpg`
  - `normal` is required. `high` and `low` are extra tripod heights.
  - `NN.jpg` is the position number. Height files pair by the **same file name**.
    Never renumber to close a gap.
  - The folder tree **is** the tour structure. The Tour Editor cannot create or
    reorder buildings, floors, rooms or positions.
- `<group>` is a venue-and-year folder, e.g. `parkschloessl_2026/`. Some tours
  sit directly under `collection/` (e.g. `stadtgalerie_klagenfurt_2026/`).
- **`<tour-id>` naming:** `YYYY-MM-DD-<venue>-<city>-<artist>`, e.g.
  `2026-08-10-parkschloessl-spittal-moertl-birgit`. The folder name becomes the
  tour id **and the web address**. Fix it before the first publish.
- Put the exhibition poster in the tour folder as `poster.pdf`. The tour texts
  are copied from it.

### Step 2 — Grade (`_360_GALLERIES_AND_TOURS/_pipeline/`)

Main doc: `_360_GALLERIES_AND_TOURS/_pipeline/README.md`. Read its "Gotchas".

1. **Bracketed shoot?** Fuse first. The Osmo shoots no HDR stills, so each scene
   is a manual bracket in its own subfolder.
   ```sh
   python3 ~/.claude/skills/fuse/scripts/fuse_brackets.py --root "<shoot>" --equirect --dry-run
   python3 ~/.claude/skills/fuse/scripts/fuse_brackets.py --root "<shoot>" --equirect
   ```
   Optional: `punch.py` (contrast, clarity, vibrance). Tutorial:
   `_pipeline/Imitating HDR.md`. The skill is installed at `~/.claude/skills/fuse/`.
   Its editable working copy is `_MacAPP TOUR-VIEWER/_claude-skill-fuse/`
   (git-ignored, synced with `rsync`).
2. **Grade:**
   ```sh
   cd "/Users/robertwildling/Desktop/_WWW/_360_GALLERIES_AND_TOURS/_pipeline"
   export TOUR=parkschloessl_2026/<tour-id>   # path RELATIVE TO collection/
   ./run.sh rename            # camera names → 01.jpg, 02.jpg … (writes)
   ./run.sh snapshot <label>  # before any re-run that replaces output
   ./run.sh proof             # contact sheet → ~/Desktop/pano-proof (read only)
   ./run.sh grade             # backup → _originals, grade, move → _masters (writes)
   ./run.sh web               # _masters → 8192×4096 WebP q72 in collection/ (writes)
   ./run.sh sky-proof && ./run.sh sky   # only for outdoor shots with a blown sky
   ./run.sh verify            # read-only audit
   ```
   - `TOUR` must be the path under `collection/`, including the group folder.
     The example in the `run.sh` header (bare tour id) is older than the
     regrouping of 2026-09-06.
   - Without `TOUR`, the **whole** collection is processed.
   - `./run.sh web --tiled` copies the master JPG instead of making a WebP. The
     Tour Editor then cuts the tiles itself.
   - Other graders: `grade_set.py` (one lighting set, e.g. a party),
     `grade_affinity_wb.py` (reproduces a hand-made Affinity white-balance look;
     used on `stadtgalerie_klagenfurt_2026` on 2026-10-03, workspace
     `_wb_probe/`).
   - Nothing in the pipeline deletes files. Superseded files go to `_to_delete/`
     for manual removal.

### Step 3 — Build the tour (`_MacAPP TOUR-VIEWER`, Tour Editor)

- Open `/Users/robertwildling/Desktop/_WWW/_MacAPP TOUR-VIEWER/Tour Editor.app`
  (or `pnpm desktop:dev` in that repo).
- Library folder = `_360_GALLERIES_AND_TOURS/collection/`. Press **Update**. A new
  folder shows as a **Draft** card. Opening it builds the tour from the folders.
- Add: `meta` (artist, title, curator, venue, dates — from `poster.pdf`),
  languages, links, doors, hotspots, start view. **⌘S** writes `tour.json` into
  the tour folder.
- Optional: Settings → Tiles → Build tiles (multi-resolution `<stem>.tiles/`).
- The app does **no** grading. It only reads images, writes `tour.json`, cuts
  tiles, and exports. It never talks to Directus or any server (on purpose).

### Step 4 — Export (Tour Editor)

- **⌘E** exports to `_360_GALLERIES_AND_TOURS/exported/<tour-id>/`
  (`tour.json` + only the images it uses). `exported/` is flat: no group folder.
- Export refuses if an image is missing or the tiles are incomplete.

### Step 5 — Publish and deploy (`_WEBSITE PERMAPHEMERA/frontend/`)

```sh
cd "/Users/robertwildling/Desktop/_WWW/_WEBSITE PERMAPHEMERA/frontend"
nvm use
pnpm tour:publish <tour-id> --dry-run
pnpm tour:publish <tour-id> [--exhibition <exhibition-slug>]
pnpm dev                     # check http://localhost:4991/en/exhibitions/<slug>/
pnpm deploy:hetzner          # build + rsync to permaphemera.at
```

- `tour:publish` (`frontend/scripts/publish-tour.mjs`):
  - reads `../../_360_GALLERIES_AND_TOURS/exported/<tour-id>/` (override with
    `--from <dir>` or `TOUR_EXPORT_DIR`);
  - mirrors it to `frontend/public/media/tours/<tour-id>/` (git-ignored);
  - on first publish, sets `pp_exhibitions.tour` in Directus. `frontend/.env`
    points at **production** Directus, so this writes to production;
  - runs `pnpm check:public`. It does **not** deploy.
- The exhibition record must already exist in Directus (§4).
- Also set `tour_status` (`available` / `restricted` / `unavailable`) and, if
  needed, `tour_available_from` on the exhibition.
- `deploy:hetzner` (`frontend/scripts/deploy-hetzner.sh`) syncs tours **add and
  update only, never delete**. Removing a tour from the server is a manual job.

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

### `_360_GALLERIES_AND_TOURS/` (no git, about 25 GB)

| Folder | Purpose |
|---|---|
| `collection/` | The tours. Graded 8192 WebP (or master JPG for tiled tours) + `tour.json` + `poster.pdf`. Also a work area: raw shoots, brackets, phone photos, `_BU/` backups. |
| `_originals/` | Untouched camera files. The pipeline copies each source here before grading. "Has a backup" marks a file as graded. |
| `_masters/` | Graded JPEG q93 at native size. WebP and tiles are made from here. |
| `_pipeline/` | Scripts (`run.sh`, `grade_panos.py`, `grade_sky_panos.py`, `grade_set.py`, `grade_affinity_wb.py`, `make_web.py`, `rename_positions.py`, `verify.py`) and docs (`README.md`, `Imitating HDR.md`, `SUPERSEDED.md`, `move-log.txt`). |
| `_versions/` | Snapshots from `./run.sh snapshot <label>`: `YYYY-MM-DD-HHMM-<label>/`. |
| `_wb_probe/` | One-off white-balance experiment (2026-10-03, stadtgalerie). |
| `_to_delete/` | Superseded files, for manual removal. |
| `exported/` | Tour Editor exports, flat by tour id. Input of `pnpm tour:publish`. |

- `_masters/` and `_originals/` mirror the `collection/` paths. If you move a tour
  inside `collection/`, move its `_masters/` and `_originals/` folders too.
- This folder was called `_tours/` and sat inside the Tour Editor repo until
  2026-09-29.

### `_MacAPP TOUR-VIEWER/` (git)

- Read first: `CLAUDE.md`, `README.md`, `AGENTS.md` (large; skim headings).
- Two apps, one data file (`tour.json`, schema v2; Tour → Building → Floor →
  Room → Position → Height):
  - Viewer: `index.html` → `src/viewer/`. Also built as an embeddable widget
    (`dist/tour-viewer.js`, `dist/tour-viewer.css`, `mountTour()`).
  - Editor: `editor.html` → `src/editor/` (Vue 3), in the Tauri shell `src-tauri/`.
- Tiling: Rust `src-tauri/src/tiles.rs` or the JS/WASM worker
  `src/editor/tiles/tile.worker.js`.
- No hardcoded paths to the 360 folder. The library and export folders are
  picked in the app and remembered per machine.
- Commands (pnpm): `dev`, `build`, `build:all` (+ widget), `desktop:dev`,
  `desktop:build` (copies the app to `Tour Editor.app`), `test`, `typecheck`,
  `verify` (the full gate; every change ends with it).
- Project skill `.claude/skills/pano-pipeline/SKILL.md` documents the grading
  pipeline of the 360 folder.

### `_WEBSITE PERMAPHEMERA/` (git)

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
  towns, artists and exhibitions. Claude skill: `.claude/skills/gallery-exhibition/`.
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

## 7. Traps (known on 2026-10-14)

The stale docs found on 2026-10-14 (old deploy command, retired JSON data,
old folder names and paths, `TOUR=` examples) were corrected that day in all
3 folders. What is left:

- `pnpm deploy` still exists in `frontend/package.json`. It uploads to the old
  all-inkl host, not to permaphemera.at. Use **`pnpm deploy:hetzner`**.
- A tour button shows only when `tour_status` is `available` **and**
  `tour_available_from` has passed. `pnpm tour:publish` sets only `tour`.
- The installed fuse skill `~/.claude/skills/fuse/README.md` still has the old
  `/Volumes/Work/__MY_WWW/...` path. The working copy in
  `_MacAPP TOUR-VIEWER/_claude-skill-fuse/` is fixed; sync it over (rsync
  command in that README).
- `_MacAPP TOUR-VIEWER/docs/tutorials/pdf/Tour-Editor-Handbook-Tutorial-03-Website.pdf`
  is older than the updated HTML tutorial.
- Some tours were graded ad hoc (logs: `collection/*/_originals/grading-claude-2026-09-22.txt`),
  with backups inside the tour folder, not in the root `_originals/`.
- `dobratsch-aussichtsplatform-2026-08-16`: its `tour.json` id is
  `Dobratsch_Aussichtsplatform_2026-08-16` (matches `_masters/`, not its
  `collection/` folder).

---

## 8. State on 2026-10-14 (a snapshot; check before you trust it)

- **Live with a tour** (Directus `tour` set, files on the server), all at
  Parkschlössl Spittal/Drau:
  `2026-06-01-…-adi-schmoelzer`, `2026-06-15-…-comic-festival`,
  `2026-06-22-…-nicoline-von-heyl`, `2026-07-06-…-lebenshilfe-spittal-drau`,
  `2026-07-13-…-herbert-meisslitzer`,
  `2026-07-30-…-sylvia-campidell-und-judith-maria-kulle`,
  `2026-08-10-…-moertl-birgit`.
- **Exported, not published:** `alpen_adria_galerie_klagenfurt_2026`,
  `kindergalerie_klagenfurt_2026` (+ a `-copy`).
- **In `collection/` with `tour.json`, not exported:**
  `parkschloessl_2026/2026-08-24-…-peter-kohlweiss`,
  `parkschloessl_2026/2026-09-07-…-santino-solace`,
  `stadtgalerie_klagenfurt_2026`, `dobratsch/…aussichtsplatform…`.
- **Raw or in progress:** `living_studio_klagenfurt_2026`, `europahaus_klagenfurt`,
  `galerie_porcia/…`, `mamas-party-2026-08-29`, most `dobratsch/` walks.
  `galerie_palais_fugger/` and `startupgalerie/` hold only source links.
- Directus: 25 exhibitions (13 published, 12 draft), 46 venues (7 published,
  39 draft).
- Added as drafts on 2026-10-14: venues Galerie im Schloss Porcia (Spittal),
  Galerie Palais Fugger (Klagenfurt), stARTup gallery (Kötschach-Mauthen, new
  town); exhibitions "Schwach.Unperfekt.Ausgefranst.Echt" (Inés Urach,
  Europahaus), "Epische Gemälde" (Ingrid Pröller, Porcia), "Mediterraneo"
  (Harald Scheicher, Palais Fugger), "Walther Preiml – Sehnsucht" (stARTup),
  Drago Druškovič (Alpen-Adria-Galerie), Karlheinz Simonitsch (Living Studio).
