# Agent Instructions (repository root)

This repository holds the whole PERMAPHEMERA project. Work happens in one of
these folders. Each has its own rules. Read them before you change anything there.

`PROJECT_INFO.md` maps this repo and its two sibling folders (the 360° image
pipeline and the Tour Editor app) and says where each step of the work happens.

| Folder      | Read first                                   |
|-------------|----------------------------------------------|
| `frontend/` | `frontend/AGENTS.md` (strict CSS and data rules, check scripts) |
| `directus/` | `directus/README.md`                         |
| `galerien-oesterreich/` | `galerien-oesterreich/README.md`   |
| `_Plans/`   | `_Plans/exhibitions-plan.md` is the active architecture plan. `_Plans/original chat.md` is history, not a source of truth. |

Cross-cutting design specs (Directus + frontend together) live in `docs/superpowers/specs/` at the root, named `YYYY-MM-DD-<topic>-design.md`. Frontend-only specs stay in `frontend/docs/superpowers/specs/`.

## Rules that apply everywhere

- Run frontend commands from `frontend/` on the Node version in `frontend/.nvmrc` (`nvm use` first).
- Run Directus commands from `directus/` with `docker compose`.
- Never commit `directus/.env`, `directus/database/`, `directus/uploads/`, or `frontend/.env.deploy.local`.
- `_Material/` and `_BU/` are git-ignored source material. Do not add code there.
- The `rowild-checklist-qa-for-permaphemera-frontend` skill (until 2026-10-20 `frontend-qa-checklist`) lives in `.claude/skills/`. Use it before shipping frontend UI changes.
- Adding or updating a gallery (venue), town, artist or exhibition in Directus: follow `docs/how-to-gallery-and-exhibition.md` (global skill `rowild-create-or-update-gallery-or-exhibition-in-permaphemera` in `~/.claude/skills/`, until 2026-10-20 the project skill `gallery-exhibition`).
- The `fin-patch` skill is global (`~/.claude/skills/fin-patch/`) and works from any folder.
- Agreed work parked for later lives in `BACKLOG.md` at the root.

## Data model

Directus is the single content source. The frontend reads it at app start;
the schema lives in `directus/scripts/schema.mjs`. When a field changes,
change `schema.mjs`, `frontend/shared/archive-schema.mjs` if it is a file
field or a new collection, `frontend/app/types/content.ts`, and
`_Plans/exhibitions-plan.md` §2 in the same commit.
