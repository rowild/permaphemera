# PERMAPHEMERA Directus

Headless CMS backend. Runs Directus 11.17.4 in Docker with SQLite.

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
node scripts/files.mjs                # (helper, not run directly) upload/folder helpers shared by import.mjs and apply-settings.mjs
```

**Schema changes are additive.** Edit `scripts/schema.mjs`, run `create-schema.mjs`; it adds what is missing and touches nothing else. Removing or renaming a field: do it in the admin app, then `snapshot.mjs`. There is no reset; content is never wiped by a script.

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

Every file in Directus is readable without a token (the public rule limits which fields come back — see `scripts/permissions.mjs`); archived records and their translations are hidden from public reads. A folder that needs to stay private (an unpublished document, a draft asset) needs its own permission policy — that is an owner decision for when it is needed, not something this setup builds in advance.

## Folders

| Folder        | Purpose                          | In git |
|---------------|----------------------------------|--------|
| `database/`   | SQLite file `data.db`            | no     |
| `uploads/`    | Uploaded files                   | no     |
| `extensions/` | Custom Directus extensions       | yes    |
| `schema/`     | Exported schema snapshot         | yes    |
| `scripts/`    | Admin scripts (Node, no deps)    | yes    |

