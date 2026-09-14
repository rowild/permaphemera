# Directus Schema by Convention, Navigations, and the Frontend Rename — Design

Date: 2026-09-14
Status: draft, awaiting owner review
Supersedes: the collection shapes in `_Plans/exhibitions-plan.md` §2 as built on 2026-09-14 (they will be rebuilt)

## Problem

The 13 Directus collections created earlier today follow the plan but not the house rules. `_Plans/directus-schema-conventions.md` now defines those rules: prefix, naming of junctions and translation tables, `title` as the headline column, M2O fields named by meaning, three-value `status`, a fixed form layout, sidebar nesting, delete behaviour and labels. Two menus (main, footer) exist only as hard-coded links in two Vue components. There is no way to edit them without a deploy. The owner also decided that every translatable field keeps its English original on the record and all languages in the translation table.

The database is empty, so nothing is migrated. Everything is rebuilt from a script.

## Decisions taken by the owner (2026-09-14)

| Question | Decision |
|---|---|
| Prefix | `pp_` |
| Translated fields | Every translatable field exists on the record (English original) **and** in the translation table for every language, English included. Applies to all of them, not only the four exhibition fields. |
| Frontend JSON | Renamed now, in the same change, so one name exists for one thing. |
| Navigations | Modelled in Directus now. Header and footer read them from data, not from hard-coded links. |
| Blocks | Decided by the assistant below: **later, own spec**. |
| `status` values | `published`, `draft`, `archived` on every entity. Not the six of the other project. Domain states become their own column when needed (conventions §2 rule 18). |
| Geo | Two floats, `latitude` and `longitude`. SQLite has no spatial functions. Unchanged. |

## Non-goals

- **Content blocks.** See "Blocks: later" below.
- **`seo` field.** Conventions §6.1 puts a `seo` field last in the main accordion. It needs the `seo-interface` extension, which is not installed. Skipped; noted in §2 of the plan.
- **Auto-slug hook.** The other project fills `slug` by hook as `id42__the-title`. PERMAPHEMERA slugs are hand-written route slugs (`all-the-magic`) and stay so. `slug` is required on the form here.
- **Importing the JSON records into Directus.** Next step after this one.
- **Directus SDK in the frontend.** Still deferred. The frontend keeps reading JSON.
- **Category system for venues.** `venues.type` stays a single-value dropdown. It is an attribute of one venue, not a classification set.

## Blocks: later

Analysed `/Volumes/Work/__MY_WWW/__PLUGIN-DEV/catalogue-de-ligatures`. There, blocks are eight `cdl_block_*` tables attached to every main collection through one `cdl_m2a__<host>__blocks` junction per host, with a single shared allowed list. `blocks` sits in the Content group directly after `description`. The images block was redesigned once already (per-image texts replaced a gallery block), which shows the block set needs its own design pass.

Decision: **not in this step.** Reasons:

1. The owner's own framing: free text now (`description`), blocks as a second, structured way later.
2. A block is invisible without a renderer. The frontend renderer, the responsive rules and the minimal block set (richtext, header, images) are one piece of work and deserve one spec.
3. Adding blocks later costs one script change and one snapshot. Nothing built now has to be undone: `ui_group_content` already exists and `blocks` will be inserted after `description`.

Reserved for that spec: `pp_block_richtext`, `pp_block_header`, `pp_block_images` + `pp_block_image_items`, `pp_m2a__<host>__blocks` for `exhibitions`, `venues`, `artists`, `locations`; one shared allowed list; `blocks` alias in `ui_group_content` after `description`.

## Architecture

### Collections

Root folder `pp_archive` (label "PERMAPHEMERA", icon `inventory_2`, colour `#a6523c`) holds the six main collections. `pp_meta` is a hidden singleton. `languages` is Directus' own and stays unprefixed.

| Collection | Kind | Group | Hidden |
|---|---|---|---|
| `pp_exhibitions` | main | `pp_archive` | no |
| `pp_venues` | main | `pp_archive` | no |
| `pp_artists` | main | `pp_archive` | no |
| `pp_locations` | main | `pp_archive` | no |
| `pp_sponsors` | main | `pp_archive` | no |
| `pp_navigations` | main | `pp_archive` | no |
| `pp_exhibition_statements` | child of exhibitions | `pp_exhibitions` | yes (reachable from the host form) |
| `pp_navigation_items` | child of navigations | `pp_navigations` | yes |
| `pp_mm__artists_exhibitions` | structural | `pp_exhibitions` | yes |
| `pp_translations__exhibitions` | structural | `pp_exhibitions` | yes |
| `pp_translations__venues` | structural | `pp_venues` | yes |
| `pp_translations__artists` | structural | `pp_artists` | yes |
| `pp_translations__locations` | structural | `pp_locations` | yes |
| `pp_translations__exhibition_statements` | structural | `pp_exhibition_statements` | yes |
| `pp_translations__navigation_items` | structural | `pp_navigation_items` | yes |
| `pp_meta` | installer state, singleton | root | yes |

Added on owner review (2026-09-14, second round):

| Collection | Kind | Group | Hidden |
|---|---|---|---|
| `pp_translations__sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__artists_venues` | structural | `pp_artists` | yes |
| `pp_mm__artists_sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__exhibitions_sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__locations_sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__sponsors_venues` | structural | `pp_sponsors` | yes |

`pp_navigations` has no translation table. Menu names are admin labels. Menu **item** titles are translated.

### Relation map

Every line is one relation. The naming rule (conventions §2 rule 12) makes an M2O look like a plain field: `primary_venue` is a relation, not a string.

| From | To | Shape | Field / table | Meaning |
|---|---|---|---|---|
| exhibition | venue | M2O | `pp_exhibitions.primary_venue` | where the show happens; the venue lists its `exhibitions` |
| venue | location | M2O | `pp_venues.location` | the town the building stands in; the town lists its `venues` |
| statement | exhibition | M2O, child | `pp_exhibition_statements.exhibition` | dies with the show |
| statement | artist | M2O | `pp_exhibition_statements.artist` | who said it |
| navigation item | navigation | M2O, child | `pp_navigation_items.navigation` | which menu |
| navigation item | navigation item | M2O, self | `pp_navigation_items.parent` | group nesting |
| artist | exhibition | M2M | `pp_mm__artists_exhibitions` | credited on the show; aliases `artists` / `exhibitions` |
| artist | venue | M2M | `pp_mm__artists_venues` | the venue represents or works with the artist; not derived from exhibitions; aliases `venues` / `artists` |
| sponsor | venue | M2M | `pp_mm__sponsors_venues` | supports the house; aliases `venues` / `sponsors` |
| sponsor | exhibition | M2M | `pp_mm__exhibitions_sponsors` | supports the show; aliases `exhibitions` / `sponsors` |
| sponsor | artist | M2M | `pp_mm__artists_sponsors` | supports the artist; aliases `artists` / `sponsors` |
| sponsor | location | M2M | `pp_mm__locations_sponsors` | a town as supporter; aliases `locations` / `sponsors` |

**Exhibition → location is deliberately absent.** Exhibition → venue → location is one chain; a direct link would repeat it and could contradict it.

Junction ownership in the sidebar (conventions §3 rule 1): under the parent whose form lists it, alphabetical as tie-break. Sponsor junctions live under `pp_sponsors`; `pp_mm__artists_venues` under `pp_artists`; `pp_mm__artists_exhibitions` under `pp_exhibitions` (its `sort` serves the exhibition's credit order).

### Fields

Rules applied everywhere (conventions §2, §8):

- Headline column is `title`. `venues.name`, `locations.city_name`, `sponsors.name` become `title`. Artists keep `first_name` + `last_name` (the `persons` exception).
- M2O on an entity is named by meaning, singular: `location`, `primary_venue`, `exhibition`, `artist`, `navigation`, `parent`.
- Junction and translation FKs are `<parent>_id` after the collection without prefix: `exhibitions_id`, `artists_id`, `languages_code`.
- Every entity: `id` (uuid), `status`, `sort`, `user_created`, `date_created`, `user_updated`, `date_updated`.
- Structural tables: none of those except `id` and, on the junction, `sort`.
- Translated columns carry the note `Translated field for <host>.<column>`.

#### `pp_locations`

`id`, `status`, `sort`, `title` (city name), `slug` (unique), `postal_code`, `state`, `country`, `latitude`, `longitude`, `description` (text, English), `translations`, `venues` (o2m alias), `sponsors` (m2m alias), audit.
Translated: `description`.

#### `pp_venues`

`id`, `status`, `sort`, `title`, `slug`, `location` (M2O → `pp_locations`, SET NULL), `type` (dropdown, allow other), `address`, `website_url`, `latitude`, `longitude`, `image`, `image_alt`, `hero_image`, `hero_image_alt`, `archive_number`, `featured`, `description`, `lede`, `about` (json array of paragraphs), `image_caption`, `coordinate_label`, `translations`, `exhibitions` (o2m alias), `artists`, `sponsors` (m2m aliases), audit.
Translated: `description`, `lede`, `about`, `image_caption`, `coordinate_label`.

#### `pp_artists`

`id`, `status`, `sort`, `first_name`, `last_name`, `middle_initial`, `artist_name`, `slug`, `birth_year`, `death_year`, `nationality`, `website_url`, `instagram_handle`, `profile_image`, `biography` (text, English), `translations`, `exhibitions`, `venues`, `sponsors` (m2m aliases), audit.
Translated: `biography`.

#### `pp_exhibitions`

`id`, `status`, `sort`, `title`, `slug`, `primary_venue` (M2O → `pp_venues`, SET NULL), `start_date`, `end_date`, `is_permanent`, `image`, `image_alt`, `summary`, `description` (rich text markdown, English), `date_range`, `opening_hours`, `vernissage`, `medium`, `source_pdf`, `tour`, `tour_status`, `tour_available_from`, `translations`, `artists`, `sponsors` (m2m aliases), `statements` (o2m alias), audit.
Translated: `title`, `summary`, `description`, `date_range`, `opening_hours`, `vernissage`, `image_alt`, `medium`.

#### `pp_exhibition_statements` (child)

`id`, `status`, `sort`, `exhibition` (M2O → `pp_exhibitions`, CASCADE, NOT NULL), `artist` (M2O → `pp_artists`, SET NULL), `prompt`, `statement`, `translations`, audit.
Translated: `prompt`, `statement`.

#### `pp_mm__artists_exhibitions` (structural)

`id`, `artists_id` (CASCADE, NOT NULL), `exhibitions_id` (CASCADE, NOT NULL), `sort`.
Sorted from the exhibitions side only, so the column is `sort` (conventions §2 rule 4). `one_field` = `artists` on `pp_exhibitions` and `exhibitions` on `pp_artists`.

#### Sponsor and artist–venue junctions (structural)

`pp_mm__artists_venues`, `pp_mm__artists_sponsors`, `pp_mm__exhibitions_sponsors`, `pp_mm__locations_sponsors`, `pp_mm__sponsors_venues`: each `id`, `<a>_id`, `<b>_id` (both CASCADE, NOT NULL, indexed), `sort`. Sorted from the host side that lists them (`sort` only). Aliases on both ends, plural, `list-m2m`.

#### `pp_sponsors`

`id`, `status`, `sort`, `title`, `slug` (unique), `website_url`, `logo` (file), `description` (text, English), `translations`, `venues`, `exhibitions`, `artists`, `locations` (m2m aliases), audit.
Translated: `description`.

#### `pp_navigations`

`id`, `status`, `sort`, `title` (admin label, e.g. "Main navigation"), `key` (string, unique: `main`, `footer`), `items` (o2m alias, sorted by `sort`), audit.

#### `pp_navigation_items` (child)

`id`, `status`, `sort`, `navigation` (M2O → `pp_navigations`, CASCADE, NOT NULL), `parent` (self M2O → `pp_navigation_items`, SET NULL; the only allowed self-M2O shape), `key` (string, stable identifier such as `exhibitions`, `legal`, `cookies`), `title` (English), `kind` (dropdown: `route`, `url`, `action`), `path` (route path like `/exhibitions/`, or the action name), `url` (external link), `target` (dropdown `_self`, `_blank`, default `_self`), `children` (o2m alias), `translations`, audit.
Translated: `title`.

Route paths are locale-neutral; the frontend passes them through `localePath()`.

#### `pp_meta` (singleton, hidden)

`id`, `schema_version` (string), `applied_at` (timestamp). Written by the schema script.

### Seeded navigation data

`main` (header): Exhibitions `/exhibitions/`, Artists `/artists/`, Galleries `/venues/`, About the Project `/about/`.

`footer`: three groups, each a parent item of kind `route` with an empty path that renders as a heading:

- `explore` ("Explore" / "Entdecken"): Exhibitions, Artists, Galleries.
- `information` ("Information"): About the Project, How it works `/how-it-works/`, Contact `/contact/`.
- `legal` ("Legal" / "Rechtliches"): Imprint `/imprint/`, Privacy Policy `/privacy/`, Terms of Use `/terms/`, Accessibility `/accessibility/`, Cookie settings (kind `action`, path `cookie-settings`).

German titles come from the current locale files. The mobile header menu renders `main` plus the footer groups `information` and `legal`, which is what it shows today.

### Form layout (conventions §6)

Main collections, top level in this order: `ui_accordion_main` (group-accordion, start first), `ui_accordion_translations` (group-accordion; only if translated), `ui_group_system` (group-detail, start closed).

Inside `ui_accordion_main`, per collection:

| Collection | Sections in `ui_accordion_main` |
|---|---|
| exhibitions | `ui_group_title` (status, title, slug, primary_venue) · `ui_group_dates` (start_date, end_date, is_permanent, date_range, opening_hours, vernissage) · `ui_group_media` (image, image_alt, source_pdf, medium) · `ui_group_tour` (tour, tour_status, tour_available_from) · `ui_group_relations` (artists, sponsors, statements) · `ui_group_content` (summary, description) |
| venues | `ui_group_title` (status, title, slug, type, location, featured, archive_number) · `ui_group_address` (address, website_url, latitude, longitude, coordinate_label) · `ui_group_images` (image, image_alt, hero_image, hero_image_alt, image_caption) · `ui_group_relations` (exhibitions, artists, sponsors) · `ui_group_content` (lede, description, about) |
| artists | `ui_group_title` (status, first_name, last_name, middle_initial, artist_name, slug) · `ui_group_details` (birth_year, death_year, nationality, website_url, instagram_handle, profile_image) · `ui_group_relations` (exhibitions, venues, sponsors) · `ui_group_content` (biography) |
| locations | `ui_group_title` (status, title, slug) · `ui_group_address` (postal_code, state, country, latitude, longitude) · `ui_group_relations` (venues, sponsors) · `ui_group_content` (description) |
| sponsors | `ui_group_title` (status, title, slug, website_url, logo) · `ui_group_relations` (venues, exhibitions, artists, locations) · `ui_group_content` (description) |
| navigations | `ui_group_title` (status, title, key) · `ui_group_relations` (items) |

`ui_group_content` is a `group-detail` with start open. `description` is the last field in it, so `blocks` can follow later. Child entities (statements, navigation items) are flat: status first, host FK hidden, content, then `ui_accordion_translations` and `ui_group_system`. Structural tables have no `ui_*` fields and all columns hidden.

`ui_group_system` holds `id` (hidden), `sort` (hidden), and the four audit fields visible and read-only, all half width.

Labels (`meta.translations`, `en-US`): "Main", "Translations", "System", "Title", "Dates", "Media", "Tour", "Relations", "Content", "Address", "Images", "Details".

### Collection meta (conventions §4)

Mains: `icon` distinct per collection (`auto_awesome`, `museum`, `person`, `location_city`, `handshake`, `menu`), `color` `#a6523c` on every prefixed collection, `display_template` `{{title}}` (artists: `{{first_name}} {{last_name}}`), `archive_field` `status` / `archive_value` `archived` / `unarchive_value` `draft`, `sort_field` `sort` on child tables ordered inside a host, `collapse` closed on mains and open on hidden structural tables, `translations` label with singular/plural on mains. Structural: `mm__` icon `import_export`, `translations__` icon `translate`, `display_template` null, `note` "Junction: artists ↔ exhibitions for pp_exhibitions.artists m2m".

### Relations (conventions §5)

| Where | `on_delete` | `one_deselect_action` |
|---|---|---|
| structural FKs (`mm__`, `translations__`) | CASCADE | delete |
| child → host (`statements.exhibition`, `navigation_items.navigation`) | CASCADE | delete |
| entity M2O (`venues.location`, `exhibitions.primary_venue`, `statements.artist`, `navigation_items.parent`) | SET NULL | nullify |
| file fields → `directus_files` | SET NULL | nullify |
| audit → `directus_users` | SET NULL | nullify |

Never `NO ACTION`. Every FK indexed. No unique index on a FK.

### First start without clicking

`directus/.env` gains:

```
PROJECT_NAME=PERMAPHEMERA
PROJECT_OWNER=<admin email>        # read by bootstrap on a fresh database; skips the owner screen
PROJECT_OWNER_ENABLED=false        # do not send the owner registration to Directus
TELEMETRY=false
ADMIN_TOKEN=<random>               # static token; scripts use it instead of a password login
```

Verified in the container: `cli/commands/bootstrap/index.js` reads `PROJECT_NAME` and `PROJECT_OWNER` and calls `settingsService.setOwner(...)` when the database is new.

Settings that are not env variables go into `scripts/apply-settings.mjs` (PATCH `/settings`): `project_color` `#a6523c`, `project_descriptor` "Exhibition archive", `default_language` `en-US`, `project_url` `http://localhost:4991`.

### Scripts (`directus/scripts/`)

| Script | Does |
|---|---|
| `lib.mjs` | env, auth (static token first, password fallback), `api()` |
| `schema.mjs` | the declarative schema: collections, fields, layout, relations, labels — data, not code |
| `create-schema.mjs` | builds everything in `schema.mjs`; idempotent; writes `pp_meta` |
| `seed-navigations.mjs` | inserts the two menus and their items with en/de titles; idempotent by `key` |
| `apply-settings.mjs` | project settings |
| `snapshot.mjs` | exports `schema/snapshot.yaml` |
| `reset.sh --yes` | stops the container, deletes `database/data.db`, starts, waits for health, runs the four scripts above in order |

`reset.sh` refuses to run without `--yes`. It never touches `uploads/`.

### Frontend

**Boundary.** The resolvers are the adapter. Raw record types and JSON change; the shapes components receive (`ResolvedVenue`, `ResolvedExhibition`, `DirectoryArtist`) do not. `ResolvedVenue.name` stays `name` and is filled from `title`. Two pages import the junction JSON directly today (`pages/index.vue`, `pages/artists/index.vue`); they switch to the composable.

**JSON files** (`frontend/app/data/`), named after the collections. The JSON mirrors the API **item shape**, not the table layout: translations stay inline as `translations[]`, the junction stays its own file.

| Old | New |
|---|---|
| `locations.json` | `pp_locations.json` — `city_name` → `title`; `description` added on the record |
| `venues.json` | `pp_venues.json` — `name` → `title`, `location_id` → `location`; `description`, `lede`, `about`, `image_caption`, `coordinate_label` added on the record |
| `artists.json` | `pp_artists.json` — `biography` added on the record |
| `exhibitions.json` | `pp_exhibitions.json` — `primary_venue_id` → `primary_venue`; `title`, `summary`, `description`, `date_range` added on the record |
| `exhibition_statements.json` | `pp_exhibition_statements.json` — `exhibition_id` → `exhibition`, `artist_id` → `artist`; `prompt`, `statement` on the record |
| `exhibitions_artists.json` | `pp_mm__artists_exhibitions.json` — `exhibition_id` → `exhibitions_id`, `artist_id` → `artists_id` |
| `sponsors.json` | `pp_sponsors.json` — `name` → `title`; `slug`, `website_url`, `logo`, `description` added (null / empty until real sponsors exist) |
| — | `pp_mm__artists_venues.json`, `pp_mm__artists_sponsors.json`, `pp_mm__exhibitions_sponsors.json`, `pp_mm__locations_sponsors.json`, `pp_mm__sponsors_venues.json` (new, empty arrays; the resolvers expose them, no page renders them yet) |
| — | `pp_navigations.json`, `pp_navigation_items.json` (new) |

Record-level English values are copied from the `en` translation entry by a one-off migration script, then deleted from the repo.

**Types** (`app/types/content.ts`): raw record interfaces renamed field by field. New `NavigationRecord`, `NavigationItemRecord`.

**New resolver** `app/utils/resolveNavigation.ts`: `resolveNavigation(navigations, items, locale)` → `{ main: NavLink[], footer: NavGroup[] }` where a `NavLink` is `{ key, label, kind, to?, href?, action?, target }`. Throws on a dangling `navigation` or `parent`, on a `parent` in another navigation, and on a duplicate `key` within one navigation.

**New composable** `useSiteNavigation()` wraps the resolver over the JSON. `ArchiveHeader.vue` and `ArchiveFooterMenu.vue` render from it. The cookie item calls the existing `showCookieNotice`. Locale keys that only served as link labels are removed from `en.json`/`de.json`; aria labels and headings stay.

**Checks.** `check-data-integrity.mjs` gains: every record-level English field equals its `en` translation value; navigation FKs resolve; `parent` is in the same navigation; `key` unique per navigation; every item has exactly one of `path`/`url` filled according to `kind`. All nine `check:*` scripts and `pnpm test` stay green before every commit.

## Error handling

- Schema script: a failed API call aborts with the collection and field named; re-running continues from what exists.
- `reset.sh` without `--yes`: prints what it would delete and exits 1.
- Resolver: dangling FK throws with the offending id and file (existing rule). Missing translation falls back `locale → en → first available`. Unknown `kind` on a navigation item throws; it is a data error, not a display case.
- Record-level English value differs from the `en` translation: integrity check fails. In Directus the two can drift; a sync flow is listed under open items.

## Verification

1. `bash directus/scripts/reset.sh --yes` on a deleted database completes with no browser interaction; `GET /server/info` shows project name PERMAPHEMERA; the admin app opens to the login screen, not the owner screen.
2. `schema/snapshot.yaml` lists exactly the 22 prefixed collections above and no `NO ACTION` in any `on_delete`.
3. A validating regex pass over every collection name against conventions §1 rule 7 with prefix `pp_`.
4. `node scripts/create-schema.mjs` a second time changes nothing (all lines `(exists)`).
5. Frontend: `pnpm check:*` (all nine) and `pnpm test` green; `pnpm build` succeeds.
6. Manual pass with the frontend-qa-checklist skill: header desktop and mobile, footer, both locales, cookie settings link.
7. Record counts unchanged: 17 locations, 36 venues, 73 artists, 13 exhibitions, 15 junction rows, 8 sponsors; new: 2 navigations, 18 navigation items (4 main + 3 groups + 11 group children).

## Open items for a later spec

- Content blocks (see above).
- Import of the JSON records into Directus, then the SDK adapter.
- A Directus flow that copies a saved English translation back onto the record field (or the reverse), so the two cannot drift.
- `seo` field once the extension is chosen.
- Proposed on 2026-09-14, awaiting the owner's yes/no: (A) `pp_mm__exhibitions_venues` for travelling shows, replacing the old `exhibitions_locations` idea; (B) `pp_artists.based_in` M2O → `pp_locations`; (C) `pp_mm__artists_artists__members` for collectives and their members; (D) `pp_mm__exhibitions_files__documents`; (E) curators, which first needs `pp_artists` → `pp_persons` renamed.
- A friendlier interface for `venues.about` than raw JSON.
