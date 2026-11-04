# News system ("Aktuelles" / "News")

Written 2026-11-04. Status: **built on 2026-11-04** (release 0.0.48), not yet deployed. Mockups
approved by the owner the same day (fewer divider lines: only a line between list items;
desktop split 3/4 + 1/4). Changes during the build are marked "Build:".

Items marked **(owner)** are the owner's decisions. Items marked **(Claude's call)** are
proposals the owner can change while reading.

## 1. Why

The archive changes every month: galleries, artists and organisations are added, sponsors
join, exhibitions open and close, and 360° tours go online. Today a visitor sees these changes
only when they find the record by chance. News articles say what is new, in one place, with
links to the records.

## 2. Goals, non-goals, anti-goals

Goals

- An overview page and a detail page for news articles, in German and English.
- Each article links to any number of galleries, exhibitions, persons, organisations and
  sponsors. Not to towns: a town has no page (`/locations/**` redirects to `/venues/**`), so a
  town link would lead nowhere **(Claude's call)**. Name the town in the text instead.
- A small list of the latest articles on the start page.
- A monthly e-mail report to the owner that lists what happened, so the owner can decide if an
  article is worth writing.

Non-goals

- No automatic articles. The site never writes or publishes an article by itself **(owner)**.
- No comments, no likes, no sharing buttons.
- No newsletter. The newsletter is still only planned (`legal.privacy.sections.planned`).
  Articles can feed it later.
- No RSS feed in the first version (easy to add later from the SEO snapshot step).

Anti-goals (a failure even if it works)

- An article that says "wir" / "we", or rates ("kuratiert", "ausgewählt", "herausragend").
  All texts follow `docs/text-rules.md`.
- An article about a new exhibition only because it is new. Welcome articles are for
  galleries, organisers and artists, not for exhibitions **(owner)**. Exhibitions get articles
  only for "opens soon" and "closes soon, tour follows".
- Empty news: an article only to fill the month. If nothing important happened, no article
  **(owner)**.
- A dated sentence that goes stale ("ab 24. Oktober online"). The exhibition page already says
  the tour state by itself (`frontend/shared/tour-access.mjs`); an article links to it and may
  name the date, because an article carries its own publication date.

## 3. Topics

Each article has one topic. The topic is a fixed list (a dropdown), shown as the eyebrow with
the date. Labels are proposals **(Claude's call)**; final wording goes through the text-rules
method with the owner.

| Key | DE label | EN label | What it covers (owner's list) |
|---|---|---|---|
| `welcome` | Neu im Archiv | New in the archive | New galleries, organisers, artists. Never exhibitions. |
| `support` | Förderung | Support | New sponsors and similar supporters. |
| `opening` | Eröffnung | Opening | Upcoming "analog" exhibitions. |
| `closing` | Rundgang folgt | Tour to follow | Exhibitions that close soon; their 360° tour comes after. |
| `site` | Website | Website | Announcements about the website, above all new features: the geo search, the exhibition tags **(owner)**. |

Ideas for `site` articles:

- **(owner)** New website features, for example the geo search (exhibitions and galleries near
  the visitor, `BACKLOG.md`) and the exhibition tags (filter by medium, theme, format,
  `BACKLOG.md`).
- Other new sections or functions: the English version of a page, a new viewer function in the
  360° tours, the ratings when they come **(Claude's call)**.
- The newsletter: when it starts, how to subscribe.
- A first gallery in a new federal state, or the archive now covers a new region.
- Counts that are facts, not rankings: "100 Ausstellungen im Archiv", "20 Rundgänge online".
- Information for galleries: how a gallery gets into the archive (a link to `/contact/`).
- The year in numbers ("2026: 42 Ausstellungen, 18 Rundgänge"), once a year.
- Lange Nacht der Museen: which presentations are in the archive.
- Accessibility improvements (with a link to `/accessibility/`).

## 4. Where the link goes

- **(owner)** Not in the header bar. The link goes into the menu behind the menu button
  (the "hamburger" popup), next to "Über das Projekt".
- How it works today: the popup shows the footer groups `information` and `legal`
  (`frontend/app/components/ArchiveHeader.vue`, `secondaryGroups`). So one new item in the
  footer group `information` puts the link into the popup **and** into the footer.
- New `pp_navigation_items` row: navigation `footer`, parent `information`, key `news`,
  path `/news/`, title "Aktuelles" / "News", first in the group, before "About"
  **(Claude's call)**. "About" has sort 1 today, so the items of the group get new sort numbers. Status `draft` until the first article is published, so the site never
  links to an empty page.

## 5. Pages

URLs follow the site's pattern (English paths, German without prefix):
`/news/`, `/news/<slug>/`, `/en/news/`, `/en/news/<slug>/`.

### 5.1 Overview `/news/`

- Header like the other index pages (eyebrow + title + one line that says what the page lists).
- Articles newest first, grouped by year with a year heading (few articles per year, so no
  pagination) **(Claude's call)**.
- Each entry, one reusable component (`NewsCard`, `frontend/AGENTS.md`: every repeated record is
  a component): topic + date (eyebrow), title, summary line, small image.
- Topic filter chips above the list. A chip shows only when at least one article has that
  topic **(Claude's call)**. This is a new pattern: /exhibitions/ has only a text search
  (`ArchiveSearchForm`). Build the chips as one reusable component, so the tag filter
  (`BACKLOG.md`, Tags) can use it later.
- Mockups for the overview and the detail page go to the owner before the code, like the start
  page (§5.3) **(Claude's call)**.

### 5.2 Detail `/news/<slug>/`

- Eyebrow: topic + date. Title. Image (optional). Body text (markdown).
- "Im Artikel" / "In this article": the linked records, with the existing components:
  `ExhibitionCard`, `VenueArchiveCard`, the list rows `PersonDirectoryEntry` and
  `OrganisationDirectoryEntry` (persons and organisations have no card), and the sponsor logo.
  Grouped by kind, in this order: exhibitions, galleries, persons, organisations, sponsors
  **(Claude's call)**.
- At the end: older / newer article, and a link back to the overview.
- Image fallback: no own image → the image of the first linked exhibition or gallery; no image
  at all → a layout without an image, never a placeholder **(Claude's call)**.

### 5.3 Start page

- **(owner)** A list of the 3 to 5 latest articles: title, date, link to the detail page, in the
  usual design of the site. On desktop and tablet it takes the **right part of a row** that it
  shares with other content: 1/4 vs 3/4 or 1/3 vs 2/3 on desktop, 1/3 vs 2/3 on tablet. On
  mobile it is the last section before the sponsors.
- Where **(Claude's call)**: the row "current and upcoming exhibitions" right after the hero
  (`LandingExhibitionSchedule`, `#current-upcoming`). Both are about what is happening now, so
  the news fits there, and it is high on the page.
  - Today the row is: heading on the left (0.55fr), then the columns "current" and "upcoming"
    (1.45fr). A news column on the right would make four columns, too narrow.
  - So the heading moves above the row. The row then is: current + upcoming (2/3 or 3/4) | news
    (1/3 or 1/4), with a fine vertical rule before the news column, like the artists sidebar
    (`border-l border-archive-rule-brown/24`).
  - Tablet: current and upcoming one below the other in 2/3, news in 1/3.
  - Mobile: the schedule keeps its sliders; the news list moves to the last section before
    the sponsors.
  - The mockup shows both ratios (1/4 and 1/3) on desktop, so the owner can pick.
  - No current or upcoming exhibitions: today the row does not render. Then the news list shows
    alone in the same place. No articles: the schedule keeps its whole width.
- Fallback, if the mockup does not work: the right sidebar of the artists section
  (`aside.archive-sidebar`, 18rem, about 1/4 on desktop). It already has the right shape, but it
  is far down the page and has nothing to do with news. On tablet it drops below the artists.
- Each entry: date (small, red eyebrow style), title (display font), whole entry is the link.
  Below the list: "Alle Meldungen" / "All news" → `/news/`. Count: 5 on desktop and tablet, 3 on
  mobile **(Claude's call)**.
- Mockups (2026-11-04, screenshots in `2026-11-04__news-system/mockups/`, the dev-only
  throwaway pages are kept in `2026-11-04__news-system/mockup-pages/`):
  - Desktop 3/4 + 1/4 (`start-desktop-quarter.jpg`): the exhibition cards keep their normal
    size. **Recommended.**
  - Desktop 2/3 + 1/3 (`start-desktop-third.jpg`): the cards get narrow and cut their texts
    more.
  - Tablet (`start-tablet.jpg`): the cards are large there, so the exhibition column is much
    taller than the news list. The news list is therefore `sticky`: it stays in view while the
    page scrolls past the cards.
  - Mobile (`start-mobile.jpg`): its own section before the sponsors.
- Like the other sections it waits for `belowHeroStep` and `useArchiveReady()`. Build: the mobile
  section renders with the method section's step (`belowHeroStep >= 5`), so
  `BELOW_HERO_SECTIONS` stays 6. Without any article the row looks exactly as before.
- A mockup comes first and goes to the owner before the code (the start page follows approved
  mockups, `frontend/AGENTS.md`).

### 5.4 Back links on the linked records (not in this build)

Later, a separate step: a gallery, exhibition, person, organisation or sponsor page shows
"Aktuelles" with the titles and dates of the articles that link to it, only when there is at
least one. It touches five detail pages and their QA, so it is not part of this build
**(Claude's call)**. It goes into `BACKLOG.md` when this build ships.

## 6. Data in Directus

New collection `pp_news` (kind `main`, follows `directus/scripts/schema.mjs`):

| Field | Type | Note |
|---|---|---|
| `status` | standard | draft / published / archived, like every main collection |
| `title` | string, translated, required | |
| `slug` | string, unique, required | |
| `published_on` | date, required | Date shown on the site; also the sort key. Only a date to show: the status alone decides if the article is public. |
| `topic` | dropdown | the keys of §3 |
| `image` | file, optional | |
| `image_alt` | string, translated | |
| `summary` | string, translated | One line for the lists, the start page and SEO. |
| `description` | markdown, translated | The article. Build: named `description`, not `body`, because the Directus builder requires the content section to end with `description` (as in every other collection). |
| `seo` | seo | like the other collections |

Links to other records: one junction per collection, the same pattern as the existing
`pp_mm__*` junctions (for example `pp_mm__exhibitions_sponsors`), to venues, exhibitions,
persons, organisations and sponsors. Naming follows `schema.mjs`.

Why separate junctions and not one many-to-any (M2A) field **(Claude's call)**: the public rules
(`directus/scripts/public-rules.mjs`) deliver a relation row only when every record it connects
is published. That filter is simple on a normal junction and awkward on an M2A junction, and
the frontend resolvers already work per junction.

Public read rule: `status = published`, the same rule as every other collection. No
publishing by date **(Claude's call)**: the owner publishes an article when it is ready.
Why: a date rule (`published_on <= $NOW`) does not fit `public-rules.mjs`, which builds every
rule from `status` alone. The translations and link rows inherit only the status, so the text
of a future article would still be public through its translation table. The builder and
`check-conventions.mjs` would have to change, and `$NOW` is UTC on the server. Not worth it
for one article a month. The frontend keeps `VISIBLE_STATUSES` as the second safety net.

Same-commit rule (root `AGENTS.md`): change `directus/scripts/schema.mjs`,
`frontend/shared/archive-schema.mjs`, `frontend/app/types/content.ts` and
`_Plans/exhibitions-plan.md` §2 together.

## 7. The monthly report (the reminder)

**(owner)** Articles are written on the owner's command, at least once a month. A job sends the
owner a report by e-mail. The owner reads it and says what to write, or that nothing is worth
an article. The owner decides the date.

### 7.1 What the report lists

Asked for by the owner:

1. Exhibitions that close within the next 3 weeks (`end_date`).
2. Exhibitions whose 360° tour went online since the last report
   (`tourAccess(...).kind` changed to `open`).
3. Exhibitions whose 360° tour goes online within the next 3 weeks (`kind = scheduled`, date in
   the window).
4. Galleries (venues) published since the last report.
5. Artists (persons) published since the last report.

Added **(Claude's call)**, small and useful for the topics:

6. Organisations and sponsors published since the last report (topics `welcome`, `support`).
7. Exhibitions that open within the next 3 weeks (`start_date`, topic `opening`).
8. Exhibitions published since the last report (for information only, never a welcome article).
9. The date of the last published article and the days since then.

Each line has the title, the date, a link to the page on the site and a link to the record in
the Directus admin. At the end: "To write an article: tell Claude, e.g. 'News: welcome for X
and Y'". An empty report still goes out ("Nothing new since …"), so the owner knows the job
runs **(Claude's call)**.

### 7.2 How "since the last report" works

The public API delivers only published records. The job stores the list of published slugs
(and the tour state per exhibition) in a small state file on the server after each run. The
next run compares. This catches every record, however it was published (by hand, by a skill),
and needs no new field on the existing collections **(Claude's call)**. The first run only
writes the state and says "Baseline set".

### 7.3 Where it runs and how it sends

- **(Claude's call)** A Node script in `frontend/scripts/news-report.mjs`. It reads the archive
  with `scripts/lib/archive-source.mjs` and uses `shared/tour-access.mjs`, the same code the site
  uses. On the server it runs like `scripts/server/seo-refresh.sh`: in the `node` container,
  from the crontab of `rowild`, copied by `deploy-hetzner.sh`.
- Schedule: the 1st of each month, 08:00 Europe/Vienna **(Claude's call)**.
- By hand: `pnpm news:report` prints the report and sends nothing; `--send` sends it.
- Sending: by SMTP from a mailbox at all-inkl (mail for permaphemera.at is at all-inkl,
  `directus/hetzner/README.md`). The Node script (in the container) only writes the mail to a
  file. The host shell script then sends it with `curl` (SMTP over TLS); the
  `node:24.11.1-alpine` container has no curl **(Claude's call)**. The builder checks first that
  the host has curl. The SMTP password stays in a file on the
  server, never in git.
- Why not a Directus Flow: Directus has no mail set up, and a Flow script cannot use the
  site's shared rules (`tour-access.mjs`). Two places with the same rule would drift.

### 7.4 What the owner must give before step 7 is built

- Build: the settings file is `/srv/sites/permaphemera.at/news-report-data/mail.env` with
  `SMTP_URL` (`smtp://w00c8d25.kasserver.com:587`, STARTTLS: Hetzner blocks outgoing port 465), `SMTP_USER`, `SMTP_PASS`,
  `NEWS_REPORT_FROM`, `NEWS_REPORT_TO`. The deploy creates the folder; the owner writes the file.
- **(owner, 2026-11-04)** Sender: `webmaster@rowild.at` (an all-inkl mailbox; may change
  later). Receiver: `robertwildling@gmail.com`. Both are settings in the server file, not in
  code, so a change needs no deploy.
- The SMTP password of `webmaster@rowild.at`. The owner puts it into the server file; Claude
  never sees it in chat.

## 8. Writing an article

- The owner says "News: …". Claude writes the article in German and English as a `draft` in
  Directus, sets the topic, `published_on`, the links and the SEO texts, and follows
  `docs/text-rules.md`. The owner reads and publishes. Drafts stay drafts (also under `/away`).
- A short how-to `docs/how-to-news.md` describes this, and a line in the root `AGENTS.md` points
  to it. A skill can follow later if the routine needs one.

## 9. SEO

- `shared/seo.mjs`: entries for `/news/` and each article (title, summary, share image,
  canonical, hreflang, JSON-LD `NewsArticle` with `datePublished`).
- `scripts/seo-snapshot.mjs` writes the static snapshots and the sitemap entries. The nightly
  refresh (00:15) already runs, so an article published in Directus gets its snapshot the next
  night without a deploy, like every other record.

## 10. Build order

1. **Data.** `pp_news` + junctions in `schema.mjs`, public rules, `archive-schema.mjs`,
   `content.ts`, §2 of the exhibitions plan. Apply to production Directus. One test article as
   a draft.
2. **Mockups.** Overview, detail page and the start-page row (desktop 1/4 and 1/3, tablet,
   mobile) → owner.
3. **Pages.** `resolveNews` in `useArchiveData()`, `NewsCard`, the chip filter, `/news/`,
   `/news/[slug].vue`, i18n keys (DE + EN), SEO entries, 404 for an unknown or unpublished slug.
4. **Menu and start page.** Navigation item (draft, new sort numbers), start-page section.
5. **Report.** `news-report.mjs`, state file, cron, mail. Needs §7.4 first.
6. **Docs.** `docs/how-to-news.md`, root `AGENTS.md`, `frontend/AGENTS.md` data rules.

Checks before shipping: `pnpm check:data`, `check:i18n`, `check:tailwind`, `check:directories`,
`check:links`, `check:mobile`, the skill `rowild-checklist-qa-for-permaphemera-frontend`, a look
at desktop and mobile with a localhost link for the owner. Deploy only when the owner asks.

## 11. Left to the builder

Component names, exact CSS within the style guide, the JSON-LD details, the format of the state
file, the mail layout, the junction names (by the `schema.mjs` pattern).

## 12. Related backlog items

Added to `BACKLOG.md` on 2026-11-04: ratings for exhibitions, geo search near the visitor,
and the question of visitor accounts.
