# Directus schema conventions — portable rule set

Derived on 2026-09-14 from the shipped schema of the Catalogue de Ligatures extension
(220 collections, 1944 fields, 472 relations, Directus 11.17). The rules below are the ones the
build enforces by code and by gate. They are written so another project can adopt them by
replacing the prefix `cdl_` with its own. Everything else transfers unchanged.

Terms used below:

- **PREFIX** — the project prefix, here `cdl_`. Every catalog table starts with it. Nothing else does.
- **main collection** — a top-level editorial table with its own detail page (here 16: artworks,
  awards, events, formations, organisations, performances, persons, playlists, playlist_videos,
  publishers, recordings, research_projects, testimonials, venues, websites, writings).
- **entity collection** — any table that holds editorial rows: main collections, category tables,
  child tables, block types. Entities get status + audit fields. (Here 51.)
- **structural collection** — a table that only wires two other tables together: `mm__`, `m2a__`,
  `translations__`. Structural tables get NO status, NO audit fields, NO form layout.

---

## 1. Collection names

All names: lowercase, `snake_case`, ASCII `[a-z0-9_]`, always with PREFIX.

| Kind | Shape | Example |
|---|---|---|
| main / entity / category / child | `PREFIX<snake_plural>` | `cdl_artworks`, `cdl_event_categories`, `cdl_program_items` |
| block type (page-builder fragment) | `PREFIX block_<snake_singular_or_plural>` | `cdl_block_richtext`, `cdl_block_images`, `cdl_block_image_items` |
| translation table | `PREFIX translations__<parent>` — parent keeps its underscores | `cdl_translations__artworks`, `cdl_translations__event_categories` |
| many-to-many | `PREFIX mm__<a>_<b>` — `a`, `b` = the two parents' names without PREFIX and **without underscores**, sorted **alphabetically**, joined by ONE `_` | `cdl_mm__artworkcategories_artworks`, `cdl_mm__events_venues` |
| many-to-many with a role | `PREFIX mm__<a>_<b>__<role>` — role required when the same pair has more than one junction, or when `a == b` (self-reference). Role = lowercase, no underscores, taken from the alias field on the host | `cdl_mm__artworks_persons__artists`, `cdl_mm__artworks_persons__premiere`, `cdl_mm__artworks_artworks__variants` |
| many-to-any | `PREFIX m2a__<parent>__<role>` | `cdl_m2a__artworks__blocks`, `cdl_m2a__artworks__dedicatees` |
| system files inside a junction name | `directus_files` is written `files` | `cdl_mm__artworks_files__scores` |
| root sidebar folders | `PREFIX<name>` (folders are collections with no table) | `cdl_catalogue`, `cdl_blocks` |
| installer state | `PREFIX meta` (hidden singleton) | `cdl_meta` |

Rules behind the table:

1. **Table names are plural.** `cdl_publishers`, not `cdl_publisher`. Only `persons` and the
   block types follow their own convention.
2. **A junction part is the parent's CURRENT name, squashed.** `cdl_artwork_categories` appears
   inside a junction as `artworkcategories`. Renaming a parent renames every junction, m2a table,
   translation table and foreign key derived from it. Never hand-spell a derived name.
3. **Junction parts are alphabetical, so a rename can flip them.** `files_opus__scores` became
   `artworks_files__scores` after opus → artworks.
4. **Double underscore `__` is the structural separator**, single `_` is the word separator.
   `mm_`, `m2a_`, `translation_` (single underscore, or singular) are rejected as malformed.
5. **Category tables** are named `<host_singular>_categories`: `cdl_artwork_categories`,
   `cdl_award_categories`, `cdl_organisation_categories`.
6. **Child tables** (rows that belong to exactly one host row) are named as a plain plural:
   `cdl_program_items` (child of events), `cdl_formation_memberships` (child of formations),
   `cdl_block_image_items` (child of block_images), `cdl_venue_addresses`, `cdl_writing_pages`.
7. A validating regex for the whole family (replace `cdl_`):
   ```
   ^cdl_(translations__[a-z0-9_]+|mm__[a-z0-9]+_[a-z0-9]+(__[a-z0-9]+)?|m2a__[a-z0-9]+__[a-z0-9]+|(?!mm_|m2a_|translations?_)[a-z][a-z0-9_]*)$
   ```
   plus: the two `mm__` parts must be in alphabetical order, and `a == b` requires a role.

---

## 2. Field names

| # | Rule | Example |
|---|---|---|
| 1 | lowercase `snake_case` only | `isbn_10`, `seo`, `url` — never `ISBN_10`, `SEO` |
| 2 | Junction foreign key = `<parent>_id`, named after the COLLECTION (plural), never the meaning | `artworks_id`, `event_categories_id`, `directus_files_id` |
| 3 | Self-reference junction: second side = `related_<parent>_id` | `artworks_id` + `related_artworks_id` |
| 4 | Junction sort column of the alphabetically-first parent's relation = `sort`; the other side = `sort_<otherparent>`; self-reference = `sort` + `sort_related`. A junction sorted from one side only has just `sort` | `cdl_mm__events_persons`: `sort` (events side), `sort_persons` (persons side) |
| 5 | Translation table columns: `id`, `<parent>_id`, `languages_code`, then one column per translated field, **same name as on the host** | `cdl_translations__events.title` |
| 6 | M2A table columns: `id`, `<parent>_id`, `collection`, `item`, `sort` | `cdl_m2a__events__blocks` |
| 7 | Layout-only alias fields: `ui_<kind>_<name>` with kind ∈ `accordion`, `tabs`, `group`, `detail`, `divider`, `notice` | `ui_accordion_main`, `ui_tabs_main`, `ui_group_title`, `ui_group_system`, `ui_detail_tree`, `ui_divider_names` |
| 8 | Category alias on a host is always called `categories` | `cdl_events.categories` |
| 9 | Headline column of every entity is called exactly `title` (the auto-slug hook keys on it) | `cdl_persons` is the one exception: `first_name` + `last_name`, configured explicitly |
| 10 | Every entity with a detail page has `slug` (string, unique index, NOT required on the form, nullable in the DB — the hook fills it) | `id42__the-title` |
| 11 | Six system fields on every entity: `status`, `sort`, `date_created`, `date_updated`, `user_created`, `user_updated` | — |
| 12 | M2O on an entity is named after its **meaning** (singular), not `<x>_id` | `cdl_performances.artwork`, `cdl_awards.giver`, `cdl_program_items.event` |
| 13 | A list of several things is plural; an attribute of one thing is singular | `cdl_persons.artworks_created` (list) vs `cdl_artworks.artwork_number` (attribute) |
| 14 | Relational alias on the host is named after what it lists, plural; a second alias for the same target gets a role suffix or prefix | `events`, `writings__event_reviews`, `premiere_persons`, `member_of_formations` |
| 15 | A free-text escape hatch beside a picker is `<picker>_free_text` | `giver` + `giver_free_text`, `role` + `role_free_text` |
| 16 | Layout groups inside a form describe ONE row, so they are singular | `ui_group_artwork_performances` |
| 17 | A translated column carries the note `Translated field for <host>.<column>` | — |
| 18 | A domain-specific status that must not hide rows is NOT the house `status` column | `cdl_performer_setups.appearance_status` (`performed`/`announced`/`cancelled`) |

---

## 3. Sidebar nesting

```
(root)
  cdl_catalogue            folder, open   — the 16 main collections, alphabetical, sort 1..16;
                                             hidden helper tables last (cdl_text_snippets)
  cdl_blocks               folder, open   — the block types, hidden, alphabetical
  languages                Directus' own, shared, never replaced
  cdl_meta                 hidden singleton

cdl_<main>                                — group = cdl_catalogue
  ├─ visible child/category entities      alphabetical, sort 1..n     (cdl_event_categories, cdl_program_items*)
  ├─ cdl_m2a__<main>__*                   hidden
  ├─ cdl_mm__*<main>*                     hidden
  └─ cdl_translations__<main>             hidden
      (* a child that is only reachable from the host form is hidden too)

cdl_<x>_categories                        — group = its host
  └─ cdl_translations__<x>_categories     hidden
```

Rules:

1. **A structural table is never loose at a root.** It is filed under the collection it hangs off:
   translation and m2a tables under their single parent; an mm junction under the parent whose
   form lists it (prefer the side that carries `one_field`; alphabetical as tie-break).
2. **Within one parent, order is: visible entities first (alphabetical), then structural tables
   alphabetically by name**, which because of the prefixes gives `m2a__` < `mm__` < `translations__`.
3. **A junction between two mains is owned by ONE of them**, and cross-module junctions by the
   module of their non-core end (only relevant if the schema is split into installable modules).
4. Every `hidden` structural table has `collapse: "open"`; mains are `collapse: "closed"`.
5. `meta.sort` is set on everything and is contiguous within each parent.

---

## 4. Collection meta

| Key | Entity (main) | Category / child entity | Structural |
|---|---|---|---|
| `hidden` | `false` | `false` for categories; `true` for child tables reachable only from the host | `true` |
| `icon` | one distinct Material icon per main (`queue_music`, `emoji_events`, `event_available`, `groups`, `people_alt`, …) | optional; `category` where set, else inherits the default | `mm__`/`m2a__`: `import_export`; `translations__`: `translate` |
| `color` | catalog colour on EVERY prefixed collection (here `#A81F7D`) | same | same |
| `translations` | `[{language, translation, singular, plural}]` | `[{language, translation}]` | derived label, see §7 |
| `display_template` | `{{title}}` or `{{title}} ({{year}})` | `{{title}}` | `null` |
| `archive_field` / `archive_value` / `unarchive_value` | `status` / `archived` / `draft` | same | `null` |
| `sort_field` | `null` on mains; `sort` on a child table that is ordered inside its host | — | `null` (ordering lives on the relations) |
| `accountability` | `all` | `all` | `all` |
| `singleton` | `false` | `false` | `false` |
| `note` | prose about the table; a deprecated table says so here | — | junction: `Junction: <a> ↔ <b> for <host>.<alias> m2m`, or null |

---

## 5. Relations and referential behaviour

| Where | `schema.on_delete` | `meta.one_deselect_action` | nullable | indexed |
|---|---|---|---|---|
| Any FK of a structural table (`mm__`, `m2a__`, `translations__`) | `CASCADE` | `delete` | NOT NULL | yes |
| Child table → its host (`cdl_program_items.event`) | `CASCADE` | `delete` | NOT NULL | yes |
| M2O on an entity to another entity (`cdl_performances.artwork`, `cdl_awards.giver`) | `SET NULL` | `nullify` | nullable | yes |
| M2O to `directus_files` | `SET NULL` | `nullify` | nullable | yes |
| Audit `user_created` / `user_updated` → `directus_users` | `SET NULL` | `nullify` | nullable | yes |
| M2A `item` column | none (no FK; target chosen per row) | `nullify` | — | — |

Additional rules:

- **Never `NO ACTION`.** `CASCADE` on an entity M2O only by explicit allow-list (a child that dies
  with its host). `RESTRICT` only where a delete must be refused and is listed as such.
- **No unique index on a foreign key.**
- **An M2M junction with a `sort` column is sortable from BOTH ends**: both relations carry
  `meta.sort_field` (`sort` on the first-named parent, `sort_<other>` on the second).
- **Inverse alias (`meta.one_field`)** is set on the host side of every M2M and every child O2M;
  it may be `null` deliberately when the inverse list would duplicate one already on the form.
- `meta.one_allowed_collections` on an M2A lists every block type the host may use.
- A self-referential M2O (`cdl_formations.part_of` ↔ `sub_formations`) is the only allowed
  self-M2O shape; it is `SET NULL`.

---

## 6. Form layout (fields' `meta.group` / `meta.sort` / `meta.interface`)

### 6.1 Main collections — the fixed skeleton

Every main collection has EXACTLY these top-level fields (`meta.group = null`), in this order:

```
1  ui_accordion_main           group-accordion   options.start = "first"
2  ui_accordion_translations   group-accordion               (only if the table is translated)
3  ui_group_system             group-detail      options.start = "closed"
```

No loose data field may sit at the top level. Inside `ui_accordion_main`, each child is a section
of the accordion:

```
ui_accordion_main
  ui_group_title            group-raw     status, title, slug, [subtitle…], categories  ← categories LAST in the title group
  ui_group_<topic>…         group-raw     any number of topic sections (Dates, Relations, Images, …)
  ui_tabs_<name>            group-tabs    a tab bar; each child group-raw is one tab
  ui_group_content          group-detail  options.start = "open": description, blocks   ← in that order, adjacent
  <loose m2m aliases>       list-m2m      allowed directly in the accordion if no section fits
  seo                       seo-interface ← ALWAYS the last child of the accordion

ui_accordion_translations
  translations              translations  (the single child)

ui_group_system            (closed group-detail, half-width fields)
  id            hidden
  sort          hidden
  user_created  visible, read-only
  date_created  visible, read-only
  user_updated  visible, read-only
  date_updated  visible, read-only
```

Laws:

1. **Outer sections are accordions, never tabs.** Tabs are allowed only nested inside an accordion section.
2. **`status`, `title`, `slug` open the title group**, in that order.
3. **A `categories` alias lives in the title group, last**, never in a "Relations" group. (The
   group is then labelled "Title & Categories".) One blessed exception may exist, named in the gate.
4. **Content = `description` (rich text) then `blocks` (list-m2a), adjacent**, inside a
   `group-detail` called `ui_group_content`. Anything else in Content stands before them.
5. **`seo` is the last child of the main accordion.**
6. **The six system fields are grouped in ONE closed `ui_group_system`, last at top level.**
7. `translations` is alone in its own accordion, second at top level.
8. A `list-m2m` picker and its free-text twin share one line: both `width: half`, picker first.

### 6.2 Category entities

```
1  ui_group_main               group-raw       (top-level wrapper; label = "Category")
     ui_group_title            group-raw       status, title, slug, description, <host alias>
2  ui_accordion_translations   group-accordion  translations
3  ui_group_system             group-detail     the six fields
```

### 6.3 Child entities and block types (no outer accordion)

Data fields sit flat at the top level (status first, host FK hidden, then the content), followed by:

```
n    ui_accordion_translations   group-accordion  (if translated)
n+1  ui_group_system             group-detail
```

### 6.4 Structural tables

No `ui_*` fields. All columns `hidden: true`, `interface: null` (FKs may show `select-dropdown-m2o`).

### 6.5 Layout field labels (`renames/ui-labels.json` → `meta.translations`)

- Every `ui_*` group has a label; a divider may be untitled.
- Title Case, ≤ 24 characters for the words (56 hard ceiling for tab-bar containers that list their tabs after a colon).
- Name the CONTENT, never the container: no "UI", "Group", "Tab", "Accordion".
- Sibling sections of one accordion or one tab bar carry distinct labels.
- Labels may carry several languages: `[{language:"en-US",…},{language:"de-DE",…}]`, en-US required.
- Standard labels: "Main", "Translations", "System", "Content", "Title & Categories", "Relations", "Images", "Files", "Dates".

---

## 7. Collection labels (`meta.translations[].translation`)

| Kind | Label rule | Example |
|---|---|---|
| plain entity | Title Case of the name without PREFIX; owner may override | `cdl_event_categories` → "Event Categories" (overridden to "Concert Categories") |
| main | as above plus `singular` / `plural` | "Artworks" / "Artwork" / "Artworks" |
| block type | `Block: <Title Case>` | `cdl_block_richtext` → "Block: Richtext" |
| translation table | `<parent default label> · Translations` | "Artworks · Translations" |
| mm junction | `<A> ↔ <B>` plus ` · <role>` | "Artworks ↔ Persons · artists" |
| m2a | `<Parent> ↔ any · <role>` | "Artworks ↔ any · blocks" |
| root folders | fixed | "Catalogue de Ligatures", "Blocks" |

Derived labels (junction, translation) are built from the parents' DEFAULT labels, not their
overridden ones, so a junction always names the tables it wires.

---

## 8. Status and audit

| Column | Type | Rule |
|---|---|---|
| `status` | string, default `draft` (a few legacy tables default to `published`) | main collections: `published`, `planned`, `work-in-progress`, `withdrawn`, `draft`, `archived`. All other entities: `published`, `draft`, `archived`. `select-dropdown`, half width. The public API filters on it. |
| `sort` | integer, hidden | present on every entity |
| `date_created` / `date_updated` | timestamp, `special: date-created` / `date-updated` | read-only in the System group |
| `user_created` / `user_updated` | uuid → `directus_users`, `special: user-created` / `user-updated`, `SET NULL` | read-only in the System group |

Structural tables carry none of these (except the ordering `sort` columns of §2 rule 4).

---

## 9. Standard building blocks (templates)

### 9.1 A translation table for host H

- name `PREFIX translations__<H without prefix>`, hidden, icon `translate`, group = H
- columns `id`, `<H>_id` (CASCADE, NOT NULL, one_field `translations`), `languages_code` (→ `languages.code`, CASCADE), then the translated columns, same names as on H
- H gets alias `translations` (interface `translations`, `special: translations`) inside `ui_accordion_translations`
- `status`, `url`, `sort` and the system fields are **never** translated

### 9.2 A category system for host H

- entity `PREFIX <h_singular>_categories` (title, slug, description, status, system fields; group = H; `display_template` `{{title}}`)
- its translation table (§9.1)
- junction `PREFIX mm__<hcategories>_<h>` (alphabetical), two FKs `<h>_categories_id` + `<h>_id`, `sort`, `id`
- alias `categories` on H (list-m2m, in the **title group, last**) and alias `<h>` (plural) on the category entity
- display template on the picker `{{<h>_categories_id.title}}`

### 9.3 A plain M2M between A and B

- junction `PREFIX mm__<a>_<b>[__<role>]`, columns `id`, `sort`, `<a>_id`, `<b>_id`, NOT NULL, CASCADE, indexed
- both relations `sort_field = sort` (add `sort_<b>` if B orders its own list)
- alias on each side, plural, list-m2m; the side that "owns" the link holds the junction in the sidebar
- no `role` column on the junction; a role is a `__role` in the NAME (a second junction), never a column

### 9.4 A child collection of host H

- name plural, hidden if only reachable from H, group = H
- columns: `id`, `status`, `sort`, `<h_singular>` (M2O → H, CASCADE, NOT NULL, one_field = the alias on H, sort_field = `sort`), content columns, system fields
- other M2Os inside it are `SET NULL`
- H gets a list-o2m alias (e.g. `program_items`, `memberships`) in a topic group of the accordion

### 9.5 A blocks (page-builder) host H

- M2A junction `PREFIX m2a__<h>__blocks` with `one_allowed_collections` = all block types
- alias `blocks` (list-m2a) on H, in `ui_group_content` directly after `description`

---

## 10. Vocabulary

- One word per concept, chosen once, applied everywhere including notes and labels: here
  **artist** (creator) / **artwork** (the work), **venue** (place), **organisation**; never
  composer/composition/opus/location for those senses. A *role* named "composer" is a different
  sense and keeps its word.
- English notes follow the field names: when a column is renamed, its `note` and any
  `display_template` that mentions it are rewritten in the same change.
- A deprecated table or field is **deprecated in its `note`, never dropped in place**: state
  what replaces it and since which version.

---

## 11. Checklist for a new collection

1. Name: plural, prefixed, snake_case; passes the regex in §1.
2. Kind decided: main / category / child / block / structural.
3. Entity: `id`, `status` (right value set), `sort`, `title`, `slug` (unique, not required), the four audit fields, `ui_group_system`.
4. Main: `ui_accordion_main` (start first) → `ui_group_title` (status, title, slug, …, categories) … `ui_group_content` (description, blocks) … `seo` last; `ui_accordion_translations`; `ui_group_system`.
5. Translation table if any text is per-language (§9.1). Categories if it is classifiable (§9.2).
6. Every FK: type per §5, indexed, `one_field` set, sort fields set on both ends.
7. Sidebar: `group` = host or `cdl_catalogue`; structural tables under the owner; `sort` contiguous.
8. Meta: icon, colour, label with singular/plural, `display_template = {{title}}`, archive on `status`.
9. Every `ui_*` field labelled per §6.5.
10. Derived names (junction, m2a, translation, `<parent>_id`) generated, never typed.
