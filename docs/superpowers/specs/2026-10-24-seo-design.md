# SEO for every page — design

Date: 2026-10-24. Scope: Directus (schema, extension, content) and frontend (head tags, snapshots, sitemap).

## Intent

Every page of permaphemera.at gets its own title, description, share image, canonical address and
language alternates, and search engines and link previews (Google, Bing, Facebook, WhatsApp,
LinkedIn) read them. The owner edits SEO per record in Directus with a search and social preview;
where a record has no SEO text, the site generates a good one from the record.

Why: the site is a client-rendered SPA (`ssr: false`). Today every route has the same generic
`<head>` until JavaScript runs; link previews and many crawlers never run it.

## Decisions taken by the owner

1. **Editing:** the Directus Labs SEO plugin (`@directus-labs/seo-plugin`, bundle, sandboxed,
   MIT, host `^10.10.0`, last release 2026-02-11, marketplace id
   `6d5e25af-4c3e-4c81-8a42-d7b6f66c9703`). Production runs Directus 11.17.4; the extensions
   folder is mounted (`/srv/stacks/permaphemera.project-backends.info/extensions`), so a
   marketplace install persists.
2. **Delivery:** snapshot at deploy. Every deploy writes one static HTML file per route with that
   route's head tags, plus `sitemap.xml` and `robots.txt`. nginx already serves
   `try_files $uri $uri/ /200.html`, so `/exhibitions/<slug>/index.html` wins over the SPA shell.

## Data model

- Field `seo` (type `json`, special `cast-json`, interface `seo-interface`, display `seo-display`)
  in a collapsed field group "SEO" on `pp_exhibitions`, `pp_venues`, `pp_persons`,
  `pp_organisations`, `pp_sponsors`.
- The plugin is single-language, so its object is split by purpose:
  - The record's `seo` holds the **English** title and description **and the settings that belong
    to the page in both languages**: share image, `no_index`/`no_follow`, sitemap. Its interface
    shows social image, search engine controls and sitemap controls.
  - A `seo` field in `pp_translations__exhibitions`, `__venues`, `__persons`, `__organisations`,
    `__sponsors` holds only **title and description** for its language (those plugin features
    off). The `en` entry equals the record's title and description; `check:data` adds that pair
    to the English-mirror rule.
  - The German page takes title and description from `de`, everything else from the record.
- A record without a German translation: its German page shows the English text (as the site does
  today), stays indexable with its own canonical, and hreflang marks both versions.
- Stored keys used by the site: `title`, `meta_description`, `og_image` (file id), `no_index`,
  `no_follow`, `sitemap.change_frequency`, `sitemap.priority`. Keyphrase analysis and custom
  fields stay off. Title and description templates only where the collection has the fields
  (exhibition translations: `{{title}}`, `{{summary}}`).
- **Step 0, compatibility:** the plugin's manifest declares host `^10.10.0`; the marketplace only
  warns about that, but Directus Labs extensions have broken after 11.x updates. It is installed
  and tried on the local Directus 11.17.4 first. If it does not install or load there, the same
  data goes into plain fields in a collapsed "SEO" group instead: `seo_title` and
  `seo_description` (record = English, translations = per language), `seo_image` (file),
  `seo_no_index` (boolean). The frontend reads either shape through one adapter.
- Schema as code: `directus/scripts/schema.mjs` (and helpers), the public read rules,
  `frontend/app/types/content.ts`, `frontend/shared/archive-schema.mjs` if the loader needs the
  field, `_Plans/exhibitions-plan.md` §2 — one commit.
- Extension install: through the Directus API (`POST /extensions/registry/install`) with the admin
  token, documented in `directus/README.md`.

## What the site renders (per route, both locales)

| Tag | Source |
|---|---|
| `<title>` | `seo.title` of the locale **verbatim** (it is the full title, at most 60 characters, as the plugin preview shows it); else generated: exhibition "Title – Artists · Venue, Town", gallery "Name, Town · Galerie", person "Name · Role", organisation "Name · Kind, Town", plus " · PERMAPHEMERA" when it fits in 60 characters |
| meta description | `seo.meta_description`, else summary / lede / description, cut at a word near 160 characters |
| canonical | `https://permaphemera.at/<path>/` (German, unprefixed) or `/en/<path>/` |
| hreflang | `de`, `en`, `x-default` (= German) |
| Open Graph / Twitter | title, description, `og:image` (`seo.og_image`, else the record image, as a 1200 px wide JPEG via the Directus asset transform), `og:type`, `og:locale`, `og:url`, `twitter:card` `summary_large_image` |
| robots | `noindex`/`nofollow` from `seo` |
| JSON-LD | exhibition `ExhibitionEvent` (dates, location `Place`/`ArtGallery` with address and coordinates, organizer, image, the artists); person `Person` (image, roles, `sameAs` links); organisation `Organization`; gallery `ArtGallery` / `Museum`; plus `BreadcrumbList` |

Static pages (start, indexes, about, how it works, contact, legal) keep their texts in the locale
files (`*.seoTitle`, `*.seoDescription`); these are reviewed and rewritten, and get a default share
image.

One pure module computes the head for a route from the archive data. The pages call it through a
composable (`useSeoMeta`/`useHead`); the snapshot script imports the same module, so the snapshot
and the live head never differ.

## Snapshot

- `frontend/scripts/seo-snapshot.mjs` runs inside `pnpm deploy:hetzner` after the build. It loads
  the published archive from Directus (as the check scripts do), takes `.output/public/200.html` as
  the shell, and writes `<route>/index.html` for every static and record route in both locales,
  with the head tags marked `data-seo-snapshot`.
- It writes `sitemap.xml` (every indexable route, `xhtml:link` alternates, `lastmod` from
  `date_updated`, `changefreq`/`priority` from `seo.sitemap` or defaults) and `robots.txt`
  (`Sitemap: https://permaphemera.at/sitemap.xml`). `check:public` allows these root files.
- A client plugin removes `[data-seo-snapshot]` elements at app start, so the live head tags are
  the only ones once the app runs.
- A record published after the last deploy gets its snapshot at the next deploy; until then it
  gets the SPA shell (Google still renders it). A scheduled refresh on the server is a later option.

## Content

The SEO text is written for every published record (about 27 exhibitions, 13 galleries, 80 persons,
10 organisations) in German and English: the full title at most 60 characters (written as it will
appear, "PERMAPHEMERA" only where it fits), description 130–160 characters, plain and factual (who,
what, where, when, "360° tour"), no metaphors or praise words.

## Checks

- Unit tests for the head module (fallbacks, lengths, canonical and hreflang, JSON-LD shape).
- A check that every published record route has a snapshot with title, description and canonical,
  and that `sitemap.xml` lists exactly the indexable routes.
- After deploy: inspect a few routes with `curl` (raw HTML head) and the share preview tools.

## Non-goals

No switch to SSR. No focus-keyphrase workflow. No rebuild triggered from Directus (later option).

## Builder's calls

Field group layout, default share image, exact fallback wording, JSON-LD details beyond the table,
priority defaults in the sitemap.
