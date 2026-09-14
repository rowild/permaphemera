# PERMAPHEMERA

A curated digital archive for temporary exhibitions and spatial memories.

This is one repository with two runnable parts and the planning material.

| Folder         | What it is                                          | Docs                        |
|----------------|-----------------------------------------------------|-----------------------------|
| `frontend/`    | Nuxt 4 site. Static SPA. Reads local JSON today.    | `frontend/README.md`        |
| `directus/`    | Directus 11.17.4 in Docker. Future content backend. | `directus/README.md`        |
| `_Plans/`      | Architecture plan, design mockups, ideas.           | `_Plans/exhibitions-plan.md`|
| `.claude/`     | Project skills and design critiques for Claude Code.| `.claude/skills/`           |

`_Material/` and `_BU/` hold large source files and backups. They are not in git.

## Quick start

```bash
# Frontend  ->  http://localhost:4991
cd frontend
nvm use
pnpm install
pnpm dev

# Directus  ->  http://localhost:8077
cd directus
cp .env.example .env   # fill in KEY, SECRET, ADMIN_PASSWORD
docker compose up -d
```

## Where we are

The frontend is live as a static site. Its JSON data in `frontend/app/data/`
already mirrors the Directus schema from `_Plans/exhibitions-plan.md` section 2.
The next step is to build those collections in Directus and swap the JSON
adapter for the Directus SDK. See Phase 4 in the plan.
