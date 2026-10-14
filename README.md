# PERMAPHEMERA

A curated digital archive for temporary exhibitions and spatial memories.

This is one repository with two runnable parts and the planning material.

| Folder         | What it is                                          | Docs                        |
|----------------|-----------------------------------------------------|-----------------------------|
| `frontend/`    | Nuxt 4 site. Static SPA. Reads from Directus at runtime. | `frontend/README.md`  |
| `directus/`    | Directus 11.17.4 in Docker. The content backend.    | `directus/README.md`        |
| `galerien-oesterreich/` | Static directory of Austrian galleries, deployed to gvoe.rowild.at | `galerien-oesterreich/README.md` |
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

The frontend is live as a static site at https://permaphemera.at (Hetzner;
deploy with `pnpm deploy:hetzner` from `frontend/`), and it reads its content
from Directus at runtime (`useArchiveSource()`); `frontend/app/data/` no longer
exists. Directus is hosted too, since 2026-09-15: editors use
https://permaphemera.project-backends.info, the site reads it same-origin at
https://permaphemera.at/cms/ (see `directus/hetzner/README.md`).
