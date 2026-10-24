# PERMAPHEMERA Directus

Headless CMS backend. Runs Directus 11.17.4 in Docker with SQLite.

Production has run on the Hetzner host since 2026-09-15: editors use
https://permaphemera.project-backends.info, the site reads it same-origin at
https://permaphemera.at/cms/. See `hetzner/README.md`. This page covers the
local instance and the scripts, which target either one.

## First start

```bash
cd directus
cp .env.example .env      # then fill in KEY, SECRET, ADMIN_PASSWORD, ADMIN_TOKEN, PROJECT_OWNER
docker compose up -d
```

Admin app: http://localhost:8077
Health:    http://localhost:8077/server/health

## Commands

```bash
docker compose up -d        # start
docker compose logs -f      # watch logs
docker compose down         # stop
docker compose pull         # fetch a newer image after changing the tag
```

## Scripts

`bash scripts/setup.sh` is the entry point on any machine. It reports what exists, asks before each step and never deletes content:

```bash
bash scripts/setup.sh                       # step by step
bash scripts/setup.sh --yes                 # all steps, no questions
bash scripts/setup.sh --status              # report only
bash scripts/setup.sh --from <dir>          # plus content import
bash scripts/setup.sh --reset-permissions   # delete and recreate the public read rules
DIRECTUS_URL=<url> bash scripts/setup.sh    # target another instance (default http://localhost:8077)
```

Single scripts, all safe to run twice:

```bash
node --test scripts/*.test.mjs        # unit tests for naming and the builder
node scripts/create-schema.mjs        # add missing collections, fields, relations
node scripts/seed.mjs                 # languages, roles, menus
node scripts/permissions.mjs          # public read rules (--reset recreates them)
node scripts/apply-settings.mjs       # name, colour, logo, login seal
node scripts/check-conventions.mjs    # assert the live schema follows the rules
node scripts/export.mjs               # backup records + files to ../_BU/directus-data
node scripts/import.mjs --from <dir>  # restore from ../_BU/directus-data by default
node scripts/snapshot.mjs             # export schema/snapshot.yaml
node scripts/upload-files.mjs <manifest.json>  # images/PDFs for venues and exhibitions, with credit lines (see ../docs/how-to-gallery-and-exhibition.md)
node scripts/files.mjs                # (helper, not run directly) upload/folder helpers shared by import.mjs and apply-settings.mjs
```

**Schema changes are additive.** Edit `scripts/schema.mjs`, run `create-schema.mjs`; it adds what is missing and touches nothing else, except the sidebar place (`meta.group`, `meta.sort`) of existing collections, which it realigns so a new sibling slots in without duplicate numbers. Removing or renaming a field: do it in the admin app, then `snapshot.mjs`. There is no reset; content is never wiped by a script.

**Backup before anything risky:** `node scripts/export.mjs`. The `_BU/` folder is not in git.

**Content history:** the first load came from the frontend JSON (`../frontend/app/data`, now retired to `../_BU/frontend-app-data-2026-09-15/`) on 2026-09-15. Every later load restores from an `export.mjs` backup under `../_BU/directus-data/`.

**CORS:** `.env` allows `http://localhost:4991` (the dev server) and `http://localhost:3000` (`pnpm preview`). On a remote host add the site's domain to `CORS_ORIGIN`.

## Fresh clone

No content is in git — `database/`, `uploads/` and `.env` are all git-ignored. On a new machine:

```bash
cp .env.example .env      # fill in KEY, SECRET, ADMIN_PASSWORD, ADMIN_TOKEN, PROJECT_OWNER
docker compose up -d
bash scripts/setup.sh --from <an export handed over out of band>
```

The export directory is not distributed through git either; get it from whoever ran `node scripts/export.mjs` last (or ask for a fresh one), then point `--from` at it.

## What is public

Every file in Directus is readable without a token (the public rule limits which fields come back — see `scripts/permissions.mjs`); since 2026-10-14 only published records, their translations, and relation rows whose ends are all published are public (`scripts/public-rules.mjs`; drafts and archived records never leave Directus). Earlier: archived records and their translations were hidden from public reads. A folder that needs to stay private (an unpublished document, a draft asset) needs its own permission policy — that is an owner decision for when it is needed, not something this setup builds in advance.

## Extensions

- **SEO plugin** `@directus-labs/seo-plugin` (marketplace id `6d5e25af-4c3e-4c81-8a42-d7b6f66c9703`,
  1.1.1, interface `seo-interface`, display `seo-display`). Its manifest still says host `^10.10.0`;
  it was installed and tried on the local 11.17.4 on 2026-10-24 (form, previews, length bars,
  list display, no console errors) before it went live. Install it through the API, which writes
  into `extensions/.registry/` (git-ignored; the registry is the source):
  `GET /extensions/registry/extension/<id>` → `versions[0].id`, then
  `POST /extensions/registry/install` with `{ extension, version }` and the admin token.
  Production has no `EXTENSIONS_AUTO_RELOAD`: restart the container afterwards.
  The `seo` fields (schema.mjs) use options `showOgImage`, `showSearchControls`, `showSitemap`,
  `titleTemplate`, `descriptionTemplate`; the stored JSON keys are `title`, `meta_description`,
  `og_image`, `no_index`, `no_follow`, `sitemap.change_frequency`, `sitemap.priority`.

- **SEO texts:** `node scripts/write-seo.mjs <file.json> [--dry-run]` (with `DIRECTUS_ENV_FILE=.env.remote` for production) writes hand-written titles and descriptions into the `seo` fields: English into the record and its `en` translation, German into `de`; share image, robots and sitemap settings stay. Rules (title ≤ 60, description 130–160 characters; an exhibition with a 360° tour 98–128 and never naming the tour, because the site adds that sentence) in `scripts/seo-texts.mjs`; the first batch is `seo/2026-10-24-seo-texts.json`, the tour sentences came out with `seo/2026-10-24-seo-without-tour-sentence.json`.

## Folders

| Folder        | Purpose                          | In git |
|---------------|----------------------------------|--------|
| `database/`   | SQLite file `data.db`            | no     |
| `uploads/`    | Uploaded files                   | no     |
| `extensions/` | Custom Directus extensions       | yes    |
| `schema/`     | Exported schema snapshot         | yes    |
| `scripts/`    | Admin scripts (Node, no deps)    | yes    |

