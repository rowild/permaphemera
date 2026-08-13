# Directus-Aligned Data Model — Design

Date: 2026-08-12
Status: approved, not yet implemented

## Problem

`_Plans/exhibitions-plan.md` §2 documents the production Directus v11 schema. The local JSON layer was meant to mirror it so the later migration is an adapter swap. It has drifted, and the repository now holds two competing models at once:

- `locations.json` — 26 records, **flattened**: venue fields (`name`, `address`, `image`, `archive_number`) and place fields (`city_name`, `postal_code`, `state`, `country`, `latitude`, `longitude`) in one row. Powers the live site.
- `venues.json` — 7 records, **plan-shaped**: carries `location_id`, `website_url` and richer detail fields. Only 1 of its 7 slugs (`parkschloessl-spittal-drau`) also exists in `locations.json`, and its `location_id` values (`location-spittal`, `location-wien`) point at a cities collection **that does not exist**.

Four further gaps against the plan:

1. **`locations` means the opposite thing.** In the plan, `locations` is the geographic place (`spittal-an-der-drau`, carrying `geo_data`) and `venues` is the building. The public route `/locations/<gallery-slug>` addresses a *venue*, and the navigation calls it "Galleries" — three vocabularies for two concepts.
2. **Artists are joined by name string.** The plan specifies an `exhibitions_artists` junction. Today `exhibition.artist` is free text (`"Sylvia Campidell & Judith Maria Kulle"`), split and normalised at runtime by `buildArtistDirectory`. A spelling variant silently creates a second artist instead of failing.
3. **Two exhibition files.** `exhibitions.json` (5 records) and `location-exhibitions.json` (9 records). The plan has one `exhibitions` collection. `exhibitions.json` is dead code: `useArchiveData()` loads, translates and exposes it, but no page or component destructures it.
4. **Geo is 1 of 26.** Only Parkschlössl has coordinates, so radius search has no data to work with.

## Non-goals

- **The "exhibitions near you" feature itself.** Radius maths, geolocation permission, and the surrounding UI are a separate spec that builds on this one. This spec delivers geo *readiness* only.
- **`panoramas`, `hotspots`, `exhibitions_locations`.** All three are in the plan; none has a consumer until the 360 viewer and travelling shows exist. Their absence is a decision, not an oversight.
- **Directus SDK integration.** Still deferred, per the plan.
- **Purging placeholder data.** The project is work in progress and deliberately uses invented records. This spec makes that data *identifiable*, not absent.

## Decisions taken

| Question | Decision |
|---|---|
| `locations` naming collision | Follow the plan: `locations` = cities, `venues` = buildings. Public route renamed `/locations/` → `/venues/`. |
| Relational fidelity | Fully normalised JSON mirroring Directus 1:1; joins resolved in `useArchiveData()`. |
| Missing coordinates | City centroids for the 17 towns are authored; venue-level pins stay optional and exact. No building-level coordinates are inferred. |
| User-facing wording | Stays "Galleries" / "Galerien" for now. `venue.type` drives per-venue labels, because gallery is the most common type but not the only one. |
| Invented records | Kept. Marked via `status`, not deleted. |

## Architecture

### Collections

Eight files in `app/data/`, each mapping 1:1 onto a Directus collection.

#### `locations.json` — the geographic place (17 rows)

The 26 galleries resolve to exactly 17 distinct Austrian towns. The 10 promoted institutions add **no new cities** — Bregenz, Graz, Innsbruck, Linz, Salzburg and Vienna are all already present — so this collection is 17 rows before and after the promotion.


```
id, slug, city_name, postal_code, state, country,
latitude, longitude,          // → geo_data Point in Directus
status,                       // draft | published
translations[]                // { languages_code, description }
```

#### `venues.json` — the building (36 rows)

```
id, slug, location_id → locations.id,
name, type, address, website_url,
latitude?, longitude?,        // optional exact pin, distinct from the city centroid
image, image_alt, hero_image?, hero_image_alt?,
archive_number, featured, status,
translations[]                // { languages_code, description, lede, about[], image_caption, coordinate_label }
```

`type` is **new — it is not in `_Plans/exhibitions-plan.md` §2** and that document must be updated to match. Initial values: `gallery`, `museum`, `kunsthalle`, `art_cafe`, `open_air`, `forum`. In Directus this becomes a Dropdown. Each value needs an i18n label pair, e.g. `venueType.gallery` = "Gallery" / "Galerie".

#### `artists.json` — people and collectives (62 rows)

```
id, slug, first_name, last_name, middle_initial?, artist_name?,
birth_year?, death_year?, nationality?, website_url?, instagram_handle?,
profile_image?, status,
translations[]                // { languages_code, biography }
```

`name` is split into `first_name` / `last_name` mechanically. **No biographical fields are invented**: for placeholder artists every optional field stays `null`, which makes filler self-evident.

`record_count` is dropped. It is already recomputed at runtime and the stored value is ignored.

#### `exhibitions.json` — the show (13 rows)

```
id, slug, primary_venue_id → venues.id,
start_date, end_date, is_permanent,
image, image_alt, opening_hours, vernissage, medium?,
source_pdf?, status,
translations[]                // { languages_code, title, description, summary, date_range, opening_hours, vernissage, image_alt }
```

The implemented exhibition schema deliberately omits `featured`. Highlighting
is time-derived UI state: current first, then the nearest upcoming record, then
the first record in the reverse-chronological directory. It must not be entered
or maintained in Directus.

#### `exhibitions_artists.json` — junction

```
id, exhibition_id → exhibitions.id, artist_id → artists.id, sort
```

Multi-artist credits become multiple rows. `"Sylvia Campidell & Judith Maria Kulle"` yields two.

#### `sponsors.json`

Unchanged. Not part of the plan schema and has no relations.

### The `status` field

`draft | published`, present on `locations`, `venues`, `artists` and `exhibitions`. It records **provenance, not visibility**.

| Records | status |
|---|---|
| Parkschlössl and its 9 real exhibitions | `published` |
| 10 real institutions not yet partnered | `draft` |
| 4 invented exhibitions | `draft` |
| 53 alphabet-filler artists | `draft` |
| 9 real artists | `published` |

**Draft records render on the site.** Filtering them out now would empty most pages. The resolver therefore exposes every record regardless of status, gated by a single constant:

```ts
// app/composables/useArchiveData.ts
const VISIBLE_STATUSES = ['published', 'draft'] as const
```

Pre-launch this becomes `['published']` — one line, one place. No status conditionals anywhere in components.

### Resolver layer

Component-facing shapes **do not change**. This is a hard constraint: the nine `check:*` scripts encode behavioural contracts against the current shapes and must stay meaningful throughout the migration.

```
JSON (normalised, Directus-shaped)          useArchiveData()              components
─────────────────────────────────           ────────────────              ──────────
locations.json      ─┐
venues.json         ─┼─ resolve FKs ───────▶ venues[]  (+ location)  ───▶ unchanged
exhibitions.json    ─┤                       exhibitions[] (+ venue,
exhibitions_artists ─┘  join junction        artists[], city)        ───▶ unchanged
artists.json        ──── pick translation ─▶ artists[] (+ records)   ───▶ unchanged
```

Three pure functions in `app/utils/`, each testable in isolation:

- `resolveVenues(locations, venues, locale)` → venue with its location inlined.
- `resolveExhibitions(exhibitions, venues, locations, junction, artists, locale)` → exhibition with venue, city and artist array inlined.
- `buildArtistDirectory(artists, exhibitions, junction)` → **simplified**: reads the junction instead of normalising and string-matching names. `slugifyArtistName` and the name-key `Map` are deleted.

`applyOverlay(records, overlay)` is replaced by `pickTranslation(record, locale)`, which selects from the inline `translations[]` array with a fallback chain `locale → en → first available`.

### Translations move inline

`app/data/translations/de/*.json` overlay files are folded into each record's `translations[]` array and deleted. `locations.json` already uses this shape.

**This amends an existing rule rather than deleting it.** `AGENTS.md` states *"English is the canonical content source. Store German translations for record fields in ID-keyed overlay files under `app/data/translations/de/`"*. The storage half is retired — overlay files are gone. The English-first half survives, but it belongs to authoring, not to the data shape:

- **In the frontend, languages are equal.** Nothing privileges `en`. The active locale is picked from `translations[]`, and `en` appears only as a fallback rung.
- **In the backend, English is first.** English is the language entered into Directus, and every other translation is derived from it. That is an editorial workflow rule, not a structural one.

`AGENTS.md` must be reworded in the same change to say exactly this. Leaving the current text would leave a rule that contradicts the code; deleting it outright would lose a real authoring convention.

### Geo

Two levels, deliberately distinct:

- **`locations.latitude/longitude`** — required, city centroid, ~4 decimal places. Powers radius search. Authored for all 17 towns.
- **`venues.latitude/longitude`** — optional, exact building pin. Drives the map link and the coordinate readout the Parkschlössl page already renders. Absent for venues whose exact position is unverified.

City centroids are town-centre approximations, not surveyed points. They are adequate for "exhibitions in your area" and explicitly not adequate for door-level mapping.

## Migration

Build the new files alongside the old, flip the readers in one commit, then delete the old files. The site works at every step, the check suite stays green throughout, and the previous data remains on disk for comparison if a resolver is wrong.

### Record disposition

| Source | Destination |
|---|---|
| `locations.json` (26 galleries) | split → `venues.json` (26 rows) + `locations.json` (~17 city rows) |
| `venues.json` (7) | 1 merges with Parkschlössl; 6 orphans become venue rows, `status: draft` |
| `exhibitions.json` (5) | 4 invented records → `exhibitions.json`, `status: draft`; their 4 institutions → venue rows |
| `location-exhibitions.json` (9) | → `exhibitions.json`, `status: published` |
| `translations/de/*.json` | folded into `translations[]`, files deleted |

**One deletion.** `exhibition-all-the-magic` duplicates `parkschloessl-adi-schmoelzer-2026` — the same exhibition with two ids and two date formats. A single `exhibitions` collection cannot hold it twice, so it collapses into the Parkschlössl record, which is the richer of the two. This is forced by normalisation, not by a judgement about the data.

Venue count after migration: 26 + 6 + 4 = **36**.

### Routes

- `app/pages/locations/index.vue` → `app/pages/venues/index.vue`
- `app/pages/locations/[slug].vue` → `app/pages/venues/[slug].vue`
- Redirects from the old paths, which are deployed and indexed.
- Visible labels stay "Galleries" / "Galerien"; the collective noun is a single i18n key so it can widen when the type vocabulary demands.

### Check scripts

`check-directory-routes.mjs` and `check-location-exhibition-browser.mjs` assert on `app/pages/locations/…` paths and on the `locationExhibitions` binding. Both are updated in the same commit as the rename. All nine `check:*` scripts must pass before and after.

## Error handling

The resolver runs at module scope on static JSON, so failures are build-time, not runtime.

- **Dangling FK** (`location_id`, `primary_venue_id`, junction ids with no target) — throw during resolution with the offending id and file. Silent `undefined` would surface as a blank page far from the cause.
- **Missing translation for the active locale** — fall back `locale → en → first available`. Never throw; a missing translation is a content gap, not a structural fault.
- **Missing city coordinates** — allowed. `locations` without geo are simply absent from radius results once that feature exists. Not an error.
- **Unknown `venue.type`** — falls back to the generic collective label rather than rendering a raw enum value.

## Verification

1. All nine `check:*` scripts pass.
2. A new `check:data-integrity.mjs`: every FK resolves, every junction row points at existing records, every slug is unique within its collection, every `translations[]` has an `en` entry, every `locations` row has coordinates.
3. `pnpm build` succeeds.
4. Record counts match the disposition table: 17 locations, 36 venues, 73 artists, 13 exhibitions.

> **Corrected during implementation.** This originally said 62 artists, which was wrong. The 11 people and organisations credited on the Parkschlössl exhibitions have never existed in `artists.json` — the current `buildArtistDirectory` *synthesises* them at runtime from the credit string. Replacing that synthesis with a junction means they must exist as real records, so the collection grows 62 → 73. The two facts are inseparable: you cannot delete the synthesis and keep the old count.
5. Manual pass over the venue index, a venue detail page, the exhibitions index, and the artists directory in both locales — the frontend-qa-checklist skill covers this.

## Open items for a later spec

- Radius search and the "exhibitions near you" feature.
- Whether `record_count` should return as a Directus computed field.
- `exhibitions_locations` junction, when a travelling show first needs it.
- `panoramas` and `hotspots`, with the 360 viewer.
