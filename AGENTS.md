# Agent Instructions (repository root)

This repository holds the whole PERMAPHEMERA project. Work happens in one of
these folders. Each has its own rules. Read them before you change anything there.

`PROJECT_INFO.md` maps this repo and its two sibling folders (the 360° image
pipeline and the Tour Editor app) and says where each step of the work happens.

**Important rule (owner, 2026-11-04): always commit `PROJECT_INFO.md` too, in this folder
only.** It lives in 3 folders and must stay current. When it has changed, commit it with your
next commit, here. Never commit in the two sibling folders (forbidden; their own sessions commit
their copy). When it shows a change you did not make, read it, check what it means for your
work, and tell the owner.

| Folder      | Read first                                   |
|-------------|----------------------------------------------|
| `frontend/` | `frontend/AGENTS.md` (strict CSS and data rules, check scripts) |
| `directus/` | `directus/README.md`                         |
| `galerien-oesterreich/` | `galerien-oesterreich/README.md`   |
| `_Plans/`   | `_Plans/exhibitions-plan.md` is the active architecture plan. `_Plans/original chat.md` is history, not a source of truth. |

Cross-cutting design specs (Directus + frontend together) live in `docs/superpowers/specs/` at the root, named `YYYY-MM-DD-<topic>-design.md`. Frontend-only specs stay in `frontend/docs/superpowers/specs/`.

## Rules that apply everywhere

- **360° tours are published on the last day of an exhibition. Exceptions apply.** (owner's
  rule, written down 2026-11-11). An empty `tour_available_from` means the last day
  (`end_date`); a date there is an exception, earlier or later. The site, the SEO texts and the
  scripts read it through one function, `tourOnlineDate` / `tourAccess` in
  `frontend/shared/tour-access.mjs`. The start page leads with the tours that came online last.
- Run frontend commands from `frontend/` on the Node version in `frontend/.nvmrc` (`nvm use` first).
- Run Directus commands from `directus/` with `docker compose`.
- Never commit `directus/.env`, `directus/database/`, `directus/uploads/`, or `frontend/.env.deploy.local`.
- `_Material/` and `_BU/` are git-ignored source material. Do not add code there.
- The `rowild-checklist-qa-for-permaphemera-frontend` skill (until 2026-10-20 `frontend-qa-checklist`) lives in `.claude/skills/`. Use it before shipping frontend UI changes.
- Adding or updating a gallery (venue), town, artist or exhibition in Directus: follow `docs/how-to-gallery-and-exhibition.md` (global skill `rowild-create-or-update-gallery-or-exhibition-in-permaphemera` in `~/.claude/skills/`, until 2026-10-20 the project skill `gallery-exhibition`).
- Adding new data from a list of links (galleries, persons, exhibitions; for example `sources.txt`): global skill `rowild-new-gallery-creation`.
- `/away <task>` (`.claude/commands/away.md`): the owner is away; work to the end without questions, delete nothing.
- The `fin-patch` skill is global (`~/.claude/skills/fin-patch/`) and works from any folder.
- Agreed work parked for later lives in `BACKLOG.md` at the root.
- Visit statistics: Umami (cookieless) counts pages and 360° tour openings (`tour-open` event, `frontend/app/utils/tourTracking.ts`). Its visit details go after 36 months; every Monday `frontend/scripts/server/stats-weekly.sh` keeps weekly sums for good in Directus `pp_stats_weekly` (private, never public; per record, town, page, visitor country and city, referrer, device). Plan `plans/2026-11-11__umami-weekly-sums.md`.
- News articles ("Aktuelles", `pp_news`, `/news/`): written on the owner's command as drafts, after `docs/how-to-news.md`; the monthly report that prompts them is `frontend/scripts/news-report.mjs` (`pnpm news:report`).
- Newsletter (Brevo, double opt-in): plan `plans/2026-11-07__newsletter.md`, the owner's steps `plans/2026-11-07__newsletter/brevo-setup.md`; server side `directus/extensions/permaphemera-newsletter/` (no PHP), site side `frontend/AGENTS.md` "Newsletter".
- Every text visitors read (locale files, fixed and SEO texts in Directus) follows `docs/text-rules.md`: the owner's rules, a word list and the method for changing a text.

## Data model

Directus is the single content source. The frontend reads it at app start;
the schema lives in `directus/scripts/schema.mjs`. When a field changes,
change `schema.mjs`, `frontend/shared/archive-schema.mjs` if it is a file
field or a new collection, `frontend/app/types/content.ts`, and
`_Plans/exhibitions-plan.md` §2 in the same commit.

**Museums stay draft (owner, 2026-11-06).** A venue of type `museum`, every exhibition at it
(`primary_venue`) and every person who appears only there stay `draft` until the owner releases
that museum by name. Keep collecting their data (research, records, tours); never publish them.
On the owner's word, add the museum's slug to `MUSEUMS_RELEASED` in
`frontend/shared/museum-drafts.mjs` (with the date). `pnpm check:data` fails on any published
record that breaks the rule (`frontend/test/unit/museumDrafts.spec.ts`).

**Never Markdown (owner, 2026-11-06).** A new long text field is always WYSIWYG
(`richText` in `directus/scripts/fields.mjs`, interface `input-rich-text-html`), never Markdown;
`fields.mjs` has no Markdown helper and `directus/scripts/build.test.mjs` fails on any
`input-rich-text-md` field. Links work in every text (owner, 2026-11-09; every WYSIWYG field has the link button): a web
address in a text is always a link, never plain text, and every source in the closing list links
to the exact page it came from (`docs/how-to-gallery-and-exhibition.md` §7a). A record's own
website and profiles also go into its link records (the Links list on its page). A short one-line field stays `str` / `text`.
The site renders every WYSIWYG field through `ArchiveRichText` (sanitised). Since 2026-11-06 no
Markdown field is left (`plans/2026-11-06__no-markdown-fields.md`).
