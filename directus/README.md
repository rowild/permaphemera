# PERMAPHEMERA Directus

Headless CMS backend. Runs Directus 11.17.4 in Docker with SQLite.

## First start

```bash
cd directus
cp .env.example .env      # then fill in KEY, SECRET, ADMIN_PASSWORD
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

## Schema scripts

The schema is data: `scripts/schema.mjs` describes entities, junctions and form
layouts; `scripts/naming.mjs` derives every junction, translation-table and FK
name from the conventions in `../_Plans/directus-schema-conventions.md`
(prefix `pp_`). Never create or rename a collection in the admin app.

```bash
node --test scripts/*.test.mjs     # unit tests for naming and the builder
node scripts/create-schema.mjs     # create what is missing (idempotent)
node scripts/seed.mjs              # languages, roles, navigations (idempotent)
node scripts/apply-settings.mjs    # project name, colour, default language
node scripts/check-conventions.mjs # assert the live schema follows the rules
node scripts/snapshot.mjs          # export schema/snapshot.yaml
bash scripts/reset.sh --yes        # wipe database/data.db and run all of the above
```

A fresh database starts without any browser interaction: `PROJECT_NAME`,
`PROJECT_OWNER` and `ADMIN_TOKEN` in `.env` are read at bootstrap.

To change a field: edit `scripts/schema.mjs`, run `bash scripts/reset.sh --yes`,
then update `../frontend/app/data/`, `../frontend/app/types/content.ts` and
`../_Plans/exhibitions-plan.md` §2 in the same commit.

## Folders

| Folder        | Purpose                          | In git |
|---------------|----------------------------------|--------|
| `database/`   | SQLite file `data.db`            | no     |
| `uploads/`    | Uploaded files                   | no     |
| `extensions/` | Custom Directus extensions       | yes    |
| `schema/`     | Exported schema snapshot         | yes    |
| `scripts/`    | Admin scripts (Node, no deps)    | yes    |

