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
bash scripts/setup.sh                 # step by step
bash scripts/setup.sh --yes           # all steps, no questions
bash scripts/setup.sh --status        # report only
bash scripts/setup.sh --from <dir>    # plus content import
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
node scripts/import.mjs --from <dir>  # restore, or first load from ../frontend/app/data
node scripts/snapshot.mjs             # export schema/snapshot.yaml
```

**Schema changes are additive.** Edit `scripts/schema.mjs`, run `create-schema.mjs`; it adds what is missing and touches nothing else. Removing or renaming a field: do it in the admin app, then `snapshot.mjs`. There is no reset; content is never wiped by a script.

**Backup before anything risky:** `node scripts/export.mjs`. The `_BU/` folder is not in git.

**CORS:** `.env` allows `http://localhost:4991`. On a remote host add the site's domain to `CORS_ORIGIN`.

## Folders

| Folder        | Purpose                          | In git |
|---------------|----------------------------------|--------|
| `database/`   | SQLite file `data.db`            | no     |
| `uploads/`    | Uploaded files                   | no     |
| `extensions/` | Custom Directus extensions       | yes    |
| `schema/`     | Exported schema snapshot         | yes    |
| `scripts/`    | Admin scripts (Node, no deps)    | yes    |

