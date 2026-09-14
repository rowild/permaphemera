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

## Folders

| Folder        | Purpose                          | In git |
|---------------|----------------------------------|--------|
| `database/`   | SQLite file `data.db`            | no     |
| `uploads/`    | Uploaded files                   | no     |
| `extensions/` | Custom Directus extensions       | yes    |

## Schema

The target collections are described in `../_Plans/exhibitions-plan.md`, section 2.
The frontend JSON files in `../frontend/app/data/` already mirror that shape.
