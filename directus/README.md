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

The collections come from `_Plans/exhibitions-plan.md` section 2 and are created
by script, not by hand in the admin app.

```bash
node scripts/create-schema.mjs   # create missing collections, fields, relations, languages
node scripts/snapshot.mjs        # export the live schema to schema/snapshot.yaml
```

To rebuild a fresh instance from the snapshot instead:

```bash
docker compose exec directus npx directus schema apply --yes /directus/schema/snapshot.yaml
```

When a field changes: edit the JSON in `../frontend/app/data/`, the types in
`../frontend/app/types/content.ts`, section 2 of the plan, and the script, then
re-export the snapshot. All in one commit.

## Folders

| Folder        | Purpose                          | In git |
|---------------|----------------------------------|--------|
| `database/`   | SQLite file `data.db`            | no     |
| `uploads/`    | Uploaded files                   | no     |
| `extensions/` | Custom Directus extensions       | yes    |
| `schema/`     | Exported schema snapshot         | yes    |
| `scripts/`    | Admin scripts (Node, no deps)    | yes    |

