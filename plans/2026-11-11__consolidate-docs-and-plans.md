# Consolidate `_Plans/`, `docs/` and `plans/`

Owner's choice (2026-11-11): option A, frontend included. Status: done, released as 0.0.82 (2026-11-11). `sources.txt`: finished entries move under IGNORE (owner chose this over deleting them).

- `docs/` keeps only what stays true: how-tos, text rules, legal papers, the data model.
- `plans/` gets every dated job: plans, specs, audits, reviews, old history.
- `_Plans/` goes away.

## Moves

All moves use `git mv` (history stays). Names follow `plans/YYYY-MM-DD__<title>.md`.
A spec that has a plan goes into the plan's folder as `design.md`.

| From | To |
| --- | --- |
| `_Plans/exhibitions-plan.md` | `docs/exhibitions-plan.md` |
| `_Plans/directus-schema-conventions.md` | `docs/directus-schema-conventions.md` |
| `_Plans/original chat.md` | `plans/2026-06-22__original-chat.md` |
| `_Plans/naming-ideas.md` | `plans/2026-06-22__naming-ideas.md` |
| `_Plans/migrating-to-tailwind.md` | `plans/2026-07-12__migrating-to-tailwind.md` |
| `_Plans/newsletter-subscription.md` | `plans/2026-11-07__newsletter/older-plan-subscription.md` (it says itself that `plans/2026-11-07__newsletter.md` replaces it) |
| `_Plans/designs/` (not in git) | `_Material/designs/` |
| `website-copy-review-and-ai-brief.md` | `plans/2026-10-25__website-copy-review.md` |
| `docs/text-audit/start-page.md` | `plans/2026-10-25__text-audit-start-page.md` |
| `docs/text-audit/header-footer.md` | `plans/2026-10-26__text-audit-header-footer.md` |
| `docs/content/2026-10-person-organisation-sources.md` | `plans/2026-10-14__person-sponsor-organisation-pages/sources.md` |
| `docs/superpowers/plans/*`, `docs/superpowers/specs/*` | `plans/` (table in `scripts/move.mjs`) |
| `frontend/docs/superpowers/plans/*`, `.../specs/*` | `plans/` (same) |

Dates: the date in the old file name; for `_Plans/` files the date the file was made
(git only knows 2026-09-14, the day the repo started).

## Links

`scripts/move.mjs` rewrites every old path in tracked text files to the new path, written from
the top folder (`plans/...`, `docs/...`). Not changed: `frontend/changelog.md` (release history
says what was true then) and `_BU/`.

By hand: the folder rows in `README.md` and `AGENTS.md`, the spec rule in `AGENTS.md` and
`frontend/AGENTS.md`, `.gitignore` (`_Plans/designs/`), the memory note `text-rules.md`
(audits now go to `plans/`). `PROJECT_INFO.md` also changes; its two sibling copies get the same
text (no commit there).

## Check

- `git grep` finds no old path outside `frontend/changelog.md`.
- `_Plans/`, `docs/superpowers/`, `docs/text-audit/`, `docs/content/`,
  `frontend/docs/superpowers/` are gone.
- `frontend/docs/` keeps `CSS_ARCHITECTURE.md` and `STYLE_GUIDE.md` (rules, they stay).
