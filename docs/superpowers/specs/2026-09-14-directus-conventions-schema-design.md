# Directus Schema by Convention, Persons and Roles, Navigations, and the Frontend Rename — Design

Date: 2026-09-14
Status: approved by the owner in three review rounds on 2026-09-14; ready for the implementation plan
Supersedes: the collection shapes in `_Plans/exhibitions-plan.md` §2 as built on 2026-09-14 (they are rebuilt from zero)

## Problem

The 13 Directus collections created earlier today follow the plan but not the house rules. `_Plans/directus-schema-conventions.md` defines those rules: prefix, naming of junctions and translation tables, `title` as the headline column, M2O fields named by meaning, three-value `status`, a fixed form layout, sidebar nesting, delete behaviour and labels. Two menus exist only as hard-coded links in two Vue components. People appear only as "artists", but a person can also curate a show, and one person can be both on the same show. The owner also decided that every translatable field keeps its English original on the record and all languages in the translation table.

The database is empty, so nothing is migrated. Everything is rebuilt from a script.

## Decisions taken by the owner (2026-09-14)

| Question | Decision |
|---|---|
| Prefix | `pp_` |
| Translated fields | Every translatable field exists on the record (English original) **and** in the translation table for every language, English included. |
| Frontend JSON | Renamed now, in the same change. One name for one thing. |
| Navigations | Modelled in Directus now. Header and footer read them from data. |
| Blocks | Later, own spec (assistant's call, accepted). |
| `status` values | `published`, `draft`, `archived` on every entity. |
| Geo | Two floats. SQLite has no spatial functions. |
| Artist ↔ venue | Yes: `pp_mm__persons_venues`. |
| Sponsors | Get `description`, `website_url`, `logo`, and M2M to venues, exhibitions, persons, locations. |
| Travelling shows (A) | Yes: `pp_mm__exhibitions_venues` for further venues; `primary_venue` stays. |
| Person home town (B) | No. The site says nothing about a person beyond name, website link and their statements. |
| Collectives and members (C) | No. Same reason. |
| Exhibition documents (D) | Yes, but in the blocks spec. |
| Curators (E) | Yes, now. `pp_artists` becomes `pp_persons`. A `pp_roles` table defines what a person can be. A person's function on one show is stored per participation. |

## Non-goals

- **Content blocks** and **`pp_mm__exhibitions_files__documents`.** Own spec.
- **`seo` field.** Needs the `seo-interface` extension, not installed.
- **Auto-slug hook.** PERMAPHEMERA slugs are hand-written route slugs and stay so. `slug` is required on the form here.
- **Importing the JSON records into Directus.** Next step.
- **Directus SDK in the frontend.** Deferred. The frontend keeps reading JSON.
- **Category system for venues.** `venues.type` stays a single-value dropdown.
- **Person details.** No biography, birth or death year, nationality, photo or Instagram. The data has none, the site shows none, the owner wants none. Those fields are dropped, and with them the persons translation table.

## Persons, roles, participations

Three tables replace the old `artists` + `exhibitions_artists` pair.

**`pp_roles`** is the vocabulary: `artist`, `curator` today, more later without a schema change. It is an entity with a translated `title`, so the site can print "Kurator:in".

**`pp_mm__persons_roles`** says what a person can be. A person with no roles is a data error the integrity check reports.

**`pp_exhibition_participations`** is a child table of exhibitions (conventions §9.4), not a plain junction. Each row is one person in one function on one show: `exhibition`, `person`, `role`, `sort`. A person who both makes and curates a show has two rows. The old junction had no room for that, and the convention forbids a role column on an `mm__` table (§9.3); a child entity with attributes is the conventional shape (`cdl_formation_memberships` is the precedent).

Rule enforced by the integrity check and, later, a Directus flow: a participation's `role` must be one of the person's roles.

The frontend derives from participations: `exhibition.artists` = participations with role `artist`, ordered by `sort`; `exhibition.curators` likewise. The artist directory lists persons who have at least one `artist` participation. Component-facing shapes do not change.

## Blocks: later

Analysed `/Volumes/Work/__MY_WWW/__PLUGIN-DEV/catalogue-de-ligatures`. Eight `cdl_block_*` tables attach to every main collection through one `cdl_m2a__<host>__blocks` junction per host with one shared allowed list; `blocks` sits in the Content group directly after `description`. The images block was redesigned once already, which shows the block set needs its own design pass. Not in this step: a block without a renderer is invisible, and adding blocks later costs one script change. `ui_group_content` ends with `description` so `blocks` can follow.

Reserved for that spec: `pp_block_richtext`, `pp_block_header`, `pp_block_images` + `pp_block_image_items`, `pp_m2a__<host>__blocks` for exhibitions, venues, persons, locations; `pp_mm__exhibitions_files__documents`.

## Architecture

### Collections

Root folder `pp_archive` (label "PERMAPHEMERA", icon `inventory_2`, colour `#a6523c`) holds the main collections. `pp_meta` is a hidden singleton. `languages` is Directus' own and stays unprefixed.

| Collection | Kind | Group | Hidden |
|---|---|---|---|
| `pp_exhibitions` | main | `pp_archive` | no |
| `pp_venues` | main | `pp_archive` | no |
| `pp_persons` | main | `pp_archive` | no |
| `pp_locations` | main | `pp_archive` | no |
| `pp_sponsors` | main | `pp_archive` | no |
| `pp_roles` | main (vocabulary) | `pp_archive` | no |
| `pp_navigations` | main | `pp_archive` | no |
| `pp_exhibition_participations` | child of exhibitions | `pp_exhibitions` | yes |
| `pp_exhibition_statements` | child of exhibitions | `pp_exhibitions` | yes |
| `pp_navigation_items` | child of navigations | `pp_navigations` | yes |
| `pp_mm__exhibitions_venues` | structural | `pp_exhibitions` | yes |
| `pp_mm__exhibitions_sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__persons_roles` | structural | `pp_persons` | yes |
| `pp_mm__persons_venues` | structural | `pp_persons` | yes |
| `pp_mm__persons_sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__locations_sponsors` | structural | `pp_sponsors` | yes |
| `pp_mm__sponsors_venues` | structural | `pp_sponsors` | yes |
| `pp_translations__exhibitions` | structural | `pp_exhibitions` | yes |
| `pp_translations__venues` | structural | `pp_venues` | yes |
| `pp_translations__locations` | structural | `pp_locations` | yes |
| `pp_translations__sponsors` | structural | `pp_sponsors` | yes |
| `pp_translations__roles` | structural | `pp_roles` | yes |
| `pp_translations__exhibition_statements` | structural | `pp_exhibition_statements` | yes |
| `pp_translations__navigation_items` | structural | `pp_navigation_items` | yes |
| `pp_meta` | installer state, singleton | root | yes |

25 prefixed collections, 26 with the `pp_archive` folder. `pp_persons` and `pp_navigations` have no translation table.

### Relation map

Every line is one relation. The naming rule (conventions §2 rule 12) makes an M2O look like a plain field: `primary_venue` is a relation, not a string.

| From | To | Shape | Field / table | Meaning |
|---|---|---|---|---|
| exhibition | venue | M2O | `pp_exhibitions.primary_venue` | where the show happens; the venue lists its `exhibitions` |
| exhibition | venue | M2M | `pp_mm__exhibitions_venues` | further venues of a travelling show; aliases `further_venues` / `further_exhibitions` |
| venue | location | M2O | `pp_venues.location` | the town the building stands in; the town lists its `venues` |
| participation | exhibition | M2O, child | `pp_exhibition_participations.exhibition` | dies with the show; the show lists `participations` |
| participation | person | M2O | `pp_exhibition_participations.person` | who; the person lists `participations` |
| participation | role | M2O | `pp_exhibition_participations.role` | in which function |
| person | role | M2M | `pp_mm__persons_roles` | what the person can be; aliases `roles` / `persons` |
| statement | exhibition | M2O, child | `pp_exhibition_statements.exhibition` | dies with the show |
| statement | person | M2O | `pp_exhibition_statements.person` | who said it |
| person | venue | M2M | `pp_mm__persons_venues` | the venue represents or works with the person; aliases `venues` / `persons` |
| sponsor | venue | M2M | `pp_mm__sponsors_venues` | aliases `venues` / `sponsors` |
| sponsor | exhibition | M2M | `pp_mm__exhibitions_sponsors` | aliases `exhibitions` / `sponsors` |
| sponsor | person | M2M | `pp_mm__persons_sponsors` | aliases `persons` / `sponsors` |
| sponsor | location | M2M | `pp_mm__locations_sponsors` | aliases `locations` / `sponsors` |
| navigation item | navigation | M2O, child | `pp_navigation_items.navigation` | which menu |
| navigation item | navigation item | M2O, self | `pp_navigation_items.parent` | group nesting |

**Exhibition → location is deliberately absent.** Exhibition → venue → location is one chain.

Junction ownership in the sidebar (conventions §3 rule 1): under the parent whose form lists it, alphabetical as tie-break.

### Fields

Rules applied everywhere (conventions §2, §8):

- Headline column is `title`. `venues.name`, `locations.city_name`, `sponsors.name` become `title`. Persons keep `first_name` + `last_name`.
- M2O on an entity is named by meaning, singular: `location`, `primary_venue`, `exhibition`, `person`, `role`, `navigation`, `parent`.
- Junction and translation FKs are `<parent>_id` after the collection without prefix: `exhibitions_id`, `persons_id`, `roles_id`, `languages_code`.
- Every entity: `id` (uuid), `status`, `sort`, `user_created`, `date_created`, `user_updated`, `date_updated`.
- Structural tables: only `id`, the two FKs and `sort`.
- Translated columns carry the note `Translated field for <host>.<column>`.

#### `pp_locations`

`id`, `status`, `sort`, `title`, `slug` (unique), `postal_code`, `state`, `country`, `latitude`, `longitude`, `description` (English), `translations`, `venues` (o2m), `sponsors` (m2m), audit.
Translated: `description`.

#### `pp_venues`

`id`, `status`, `sort`, `title`, `slug`, `location` (M2O → locations, SET NULL), `type` (dropdown, allow other), `address`, `website_url`, `latitude`, `longitude`, `image`, `image_alt`, `hero_image`, `hero_image_alt`, `archive_number`, `featured`, `description`, `lede`, `about` (json array of paragraphs), `image_caption`, `coordinate_label`, `translations`, `exhibitions` (o2m), `further_exhibitions`, `persons`, `sponsors` (m2m), audit.
Translated: `description`, `lede`, `about`, `image_caption`, `coordinate_label`.

#### `pp_persons`

`id`, `status`, `sort`, `first_name`, `last_name`, `middle_initial`, `display_name` (pseudonym or collective name, shown instead of first + last when set; was `artist_name`), `slug` (unique), `website_url`, `roles`, `venues`, `sponsors` (m2m), `participations` (o2m), audit.
No translations.

#### `pp_roles`

`id`, `status`, `sort`, `title` (English), `slug` (unique: `artist`, `curator`), `translations`, `persons` (m2m), audit.
Translated: `title`. Seeded: artist ("Artist" / "Künstler:in"), curator ("Curator" / "Kurator:in").

#### `pp_exhibitions`

`id`, `status`, `sort`, `title`, `slug`, `primary_venue` (M2O → venues, SET NULL), `start_date`, `end_date`, `is_permanent`, `image`, `image_alt`, `summary`, `description` (markdown, English), `date_range`, `opening_hours`, `vernissage`, `medium`, `source_pdf`, `tour`, `tour_status`, `tour_available_from`, `translations`, `participations`, `statements` (o2m), `further_venues`, `sponsors` (m2m), audit.
Translated: `title`, `summary`, `description`, `date_range`, `opening_hours`, `vernissage`, `image_alt`, `medium`.

#### `pp_exhibition_participations` (child)

`id`, `status`, `sort`, `exhibition` (M2O → exhibitions, CASCADE, NOT NULL), `person` (M2O → persons, SET NULL), `role` (M2O → roles, SET NULL), audit. `display_template` `{{person.first_name}} {{person.last_name}} · {{role.title}}`.

#### `pp_exhibition_statements` (child)

`id`, `status`, `sort`, `exhibition` (M2O → exhibitions, CASCADE, NOT NULL), `person` (M2O → persons, SET NULL), `prompt`, `statement`, `translations`, audit.
Translated: `prompt`, `statement`.

#### `pp_sponsors`

`id`, `status`, `sort`, `title`, `slug` (unique), `website_url`, `logo` (file), `description` (English), `translations`, `venues`, `exhibitions`, `persons`, `locations` (m2m), audit.
Translated: `description`.

#### `pp_navigations`

`id`, `status`, `sort`, `title` (admin label), `key` (unique: `main`, `footer`), `items` (o2m, by `sort`), audit.

#### `pp_navigation_items` (child)

`id`, `status`, `sort`, `navigation` (M2O → navigations, CASCADE, NOT NULL), `parent` (self M2O, SET NULL), `key` (stable identifier), `title` (English), `kind` (dropdown `route` | `url` | `action`), `path`, `url`, `target` (`_self` | `_blank`), `children` (o2m), `translations`, audit.
Translated: `title`. Route paths are locale-neutral; the frontend passes them through `localePath()`.

#### Structural junctions

`pp_mm__exhibitions_venues`, `pp_mm__exhibitions_sponsors`, `pp_mm__persons_roles`, `pp_mm__persons_venues`, `pp_mm__persons_sponsors`, `pp_mm__locations_sponsors`, `pp_mm__sponsors_venues`: each `id`, `<a>_id`, `<b>_id` (CASCADE, NOT NULL, indexed), `sort`. Aliases on both ends, plural, `list-m2m`.

#### `pp_meta` (singleton, hidden)

`id`, `schema_version`, `applied_at`. Written by the schema script.

### Seeded data

Roles: as above.

`main` navigation: Exhibitions `/exhibitions/`, Artists `/artists/`, Galleries `/venues/`, About the Project `/about/`.

`footer` navigation: three group items (kind `route`, empty path, rendered as headings) with children:

- `explore` ("Explore" / "Entdecken"): Exhibitions, Artists, Galleries.
- `information` ("Information"): About the Project, How it works `/how-it-works/`, Contact `/contact/`.
- `legal` ("Legal" / "Rechtliches"): Imprint `/imprint/`, Privacy Policy `/privacy/`, Terms of Use `/terms/`, Accessibility `/accessibility/`, Cookie settings (kind `action`, path `cookie-settings`).

German titles come from the current locale files. The mobile header menu renders `main` plus the footer groups `information` and `legal`, as today.

### Form layout (conventions §6)

Main collections, top level in this order: `ui_accordion_main` (group-accordion, start first), `ui_accordion_translations` (only if translated), `ui_group_system` (group-detail, start closed).

| Collection | Sections in `ui_accordion_main` |
|---|---|
| exhibitions | `ui_group_title` (status, title, slug, primary_venue) · `ui_group_dates` (start_date, end_date, is_permanent, date_range, opening_hours, vernissage) · `ui_group_media` (image, image_alt, source_pdf, medium) · `ui_group_tour` (tour, tour_status, tour_available_from) · `ui_group_relations` (participations, statements, further_venues, sponsors) · `ui_group_content` (summary, description) |
| venues | `ui_group_title` (status, title, slug, type, location, featured, archive_number) · `ui_group_address` (address, website_url, latitude, longitude, coordinate_label) · `ui_group_images` (image, image_alt, hero_image, hero_image_alt, image_caption) · `ui_group_relations` (exhibitions, further_exhibitions, persons, sponsors) · `ui_group_content` (lede, about, description) |
| persons | `ui_group_title` (status, first_name, last_name, middle_initial, display_name, slug, roles) · `ui_group_links` (website_url) · `ui_group_relations` (participations, venues, sponsors) |
| roles | `ui_group_title` (status, title, slug) · `ui_group_relations` (persons) |
| locations | `ui_group_title` (status, title, slug) · `ui_group_address` (postal_code, state, country, latitude, longitude) · `ui_group_relations` (venues, sponsors) · `ui_group_content` (description) |
| sponsors | `ui_group_title` (status, title, slug, website_url, logo) · `ui_group_relations` (venues, exhibitions, persons, locations) · `ui_group_content` (description) |
| navigations | `ui_group_title` (status, title, key) · `ui_group_relations` (items) |

`ui_group_content` is a `group-detail`, start open. `description` is its last field so `blocks` can follow later. Child entities (participations, statements, navigation items) are flat: status first, host FK hidden, content, then `ui_accordion_translations` if translated, then `ui_group_system`. Structural tables have no `ui_*` fields and all columns hidden. Exception: the translated columns of `pp_translations__*` tables stay visible, otherwise the Directus translations interface renders an empty form.

`ui_group_system` holds `id` (hidden), `sort` (hidden), the four audit fields visible and read-only, all half width.

Labels (`meta.translations`, `en-US`): "Main", "Translations", "System", "Title", "Dates", "Media", "Tour", "Relations", "Content", "Address", "Images", "Links".

### Collection meta (conventions §4)

Mains: distinct `icon` (`auto_awesome`, `museum`, `person`, `location_city`, `handshake`, `badge`, `menu`), `color` `#a6523c` on every prefixed collection, `display_template` `{{title}}` (persons: `{{first_name}} {{last_name}}`), `archive_field` `status` / `archive_value` `archived` / `unarchive_value` `draft`, `sort_field` `sort` on child tables, `collapse` closed on mains and open on hidden structural tables, label with singular/plural on mains. Structural: `mm__` icon `import_export`, `translations__` icon `translate`, `display_template` null, `note` "Junction: a ↔ b for host.alias m2m".

### Relations (conventions §5)

| Where | `on_delete` | `one_deselect_action` |
|---|---|---|
| structural FKs (`mm__`, `translations__`) | CASCADE | delete |
| child → host (`participations.exhibition`, `statements.exhibition`, `navigation_items.navigation`) | CASCADE | delete |
| entity M2O (`venues.location`, `exhibitions.primary_venue`, `participations.person`, `participations.role`, `statements.person`, `navigation_items.parent`) | SET NULL | nullify |
| file fields → `directus_files` | SET NULL | nullify |
| audit → `directus_users` | SET NULL | nullify |

Never `NO ACTION`. Every FK indexed. No unique index on a FK.

### First start without clicking

`directus/.env` gains:

```
PROJECT_NAME=PERMAPHEMERA
PROJECT_OWNER=<admin email>        # bootstrap reads it on a fresh database and skips the owner screen
PROJECT_OWNER_ENABLED=false        # do not send the owner registration to Directus
TELEMETRY=false
ADMIN_TOKEN=<random>               # static token; scripts use it instead of a password login
```

Verified in the container: `cli/commands/bootstrap/index.js` reads `PROJECT_NAME` and `PROJECT_OWNER` and calls `settingsService.setOwner(...)` on a new database.

`scripts/apply-settings.mjs` (PATCH `/settings`): `project_color` `#a6523c`, `project_descriptor` "Exhibition archive", `default_language` `en-US`, `project_url` `http://localhost:4991`.

### Scripts (`directus/scripts/`)

| Script | Does |
|---|---|
| `lib.mjs` | env, auth (static token first, password fallback), `api()` |
| `schema.mjs` | the declarative schema: collections, fields, layout, relations, labels. Data, not code. Derived names are generated by helpers, never typed. |
| `create-schema.mjs` | builds everything in `schema.mjs`; idempotent; writes `pp_meta` |
| `seed.mjs` | roles, the two menus and their items with en/de titles; idempotent by `slug` / `key` |
| `apply-settings.mjs` | project settings |
| `snapshot.mjs` | exports `schema/snapshot.yaml` |
| `check-conventions.mjs` | validates the live schema: name regex with `pp_`, alphabetical `mm__` parts, no `NO ACTION`, six system fields on entities and none on structural tables, layout skeleton on mains |
| `reset.sh --yes` | stops the container, deletes `database/data.db`, starts, waits for health, runs create-schema, seed, apply-settings, check-conventions, snapshot |

`reset.sh` refuses to run without `--yes`. It never touches `uploads/`.

### Frontend

**Boundary.** The resolvers are the adapter. Raw record types and JSON change; the shapes components receive (`ResolvedVenue`, `ResolvedExhibition`, `DirectoryArtist`) do not. `ResolvedVenue.name` stays and is filled from `title`. `ResolvedExhibition.artists` stays and is filled from participations with role `artist`; a new `curators` array sits beside it, unrendered for now. Two pages import the junction JSON directly today (`pages/index.vue`, `pages/artists/index.vue`); they switch to the composable.

**JSON files** (`frontend/app/data/`), named after the collections. The JSON mirrors the API **item shape**: translations inline as `translations[]`; junctions and child tables as their own files.

| Old | New |
|---|---|
| `locations.json` | `pp_locations.json` — `city_name` → `title`; `description` on the record |
| `venues.json` | `pp_venues.json` — `name` → `title`, `location_id` → `location`; `description`, `lede`, `about`, `image_caption`, `coordinate_label` on the record |
| `artists.json` | `pp_persons.json` — `artist_name` → `display_name`; `biography`, `birth_year`, `death_year`, `nationality`, `instagram_handle`, `profile_image`, `translations` removed |
| — | `pp_roles.json` (2 rows), `pp_mm__persons_roles.json` (73 rows, all `artist`) |
| `exhibitions_artists.json` | `pp_exhibition_participations.json` — `exhibition_id` → `exhibition`, `artist_id` → `person`, `role` = the artist role id, `status` `published`, `sort` kept |
| `exhibitions.json` | `pp_exhibitions.json` — `primary_venue_id` → `primary_venue`; `title`, `summary`, `description`, `date_range` on the record |
| `exhibition_statements.json` | `pp_exhibition_statements.json` — `exhibition_id` → `exhibition`, `artist_id` → `person`; `prompt`, `statement` on the record |
| `sponsors.json` | `pp_sponsors.json` — `name` → `title`; `slug`, `website_url`, `logo`, `description`, `translations` added |
| — | `pp_navigations.json`, `pp_navigation_items.json` (seeded) |
| — | `pp_mm__exhibitions_venues.json`, `pp_mm__exhibitions_sponsors.json`, `pp_mm__persons_venues.json`, `pp_mm__persons_sponsors.json`, `pp_mm__locations_sponsors.json`, `pp_mm__sponsors_venues.json` (empty; resolvers expose them, no page renders them yet) |

Record-level English values are copied from the `en` translation entry by a one-off migration script that is deleted after use.

**Types** (`app/types/content.ts`): raw record interfaces renamed field by field. New `PersonRecord`, `RoleRecord`, `ParticipationRecord`, `NavigationRecord`, `NavigationItemRecord`.

**Resolvers.** `resolveExhibitions` reads participations + roles instead of the junction. `buildArtistDirectory` lists persons with an `artist` participation. New `resolveNavigation(navigations, items, locale)` → `{ main: NavLink[], footer: NavGroup[] }`, `NavLink = { key, label, kind, to?, href?, action?, target }`; throws on a dangling `navigation` or `parent`, a `parent` in another navigation, a duplicate `key` within one navigation, or an unknown `kind`.

**Composable** `useSiteNavigation()` wraps the resolver. `ArchiveHeader.vue` and `ArchiveFooterMenu.vue` render from it; the cookie item calls the existing `showCookieNotice`. Locale keys that only served as link labels are removed from `en.json`/`de.json`; aria labels and headings stay.

**Checks.** `check-data-integrity.mjs` gains: every record-level English field equals its `en` translation value; every participation's role is one of the person's roles; every person has at least one role; navigation FKs resolve; `parent` is in the same navigation; `key` unique per navigation; `path`/`url` filled according to `kind`. All nine `check:*` scripts and `pnpm test` stay green before every commit.

## Error handling

- Schema script: a failed API call aborts naming the collection and field; re-running continues from what exists.
- `reset.sh` without `--yes`: prints what it would delete and exits 1.
- Resolver: dangling FK throws with the offending id and file. Missing translation falls back `locale → en → first available`. Unknown navigation `kind` or role slug throws.
- Record-level English value differs from the `en` translation: integrity check fails. In Directus the two can drift; a sync flow is an open item.

## Verification

1. `bash directus/scripts/reset.sh --yes` on a deleted database completes with no browser interaction; `GET /server/info` shows project name PERMAPHEMERA; the admin app opens to the login screen.
2. `check-conventions.mjs` passes on the live schema; `schema/snapshot.yaml` lists the 25 prefixed collections and no `on_delete: NO ACTION` (`on_update: NO ACTION` is SQLite's default and is not covered by the rule).
3. `node scripts/create-schema.mjs` a second time changes nothing.
4. Frontend: all nine `pnpm check:*` and `pnpm test` green; `pnpm build` succeeds.
5. Manual pass with the frontend-qa-checklist skill: header desktop and mobile, footer, both locales, cookie settings link, artist directory, one exhibition detail.
6. Record counts: 17 locations, 36 venues, 73 persons, 2 roles, 73 person-role rows, 13 exhibitions, 15 participations, 8 sponsors, 2 navigations, 18 navigation items.

## Open items for a later spec

- Content blocks, with `pp_mm__exhibitions_files__documents`.
- Import of the JSON records into Directus, then the SDK adapter.
- A Directus flow that keeps the record-level English field and the `en` translation in step, and one that rejects a participation whose role the person does not have.
- `seo` field once the extension is chosen.
- Rendering curators, sponsors and further venues on the site.
- A friendlier interface for `venues.about` than raw JSON.
