# Directus-Aligned Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the local JSON layer into six collections that map 1:1 onto the Directus schema in `_Plans/exhibitions-plan.md` §2, so the later migration is an adapter swap rather than a rewrite.

**Architecture:** New collections are built in a staging directory `app/data/v2/`, validated by a new `check:data` script, then moved into place in one atomic flip task that also rewires `useArchiveData()`. The site keeps working at every task boundary except inside the flip. Component-facing shapes never change, so the eight existing `check:*` scripts stay meaningful throughout and act as the regression net.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Tailwind CSS v4, pnpm 11.20.0, Node 24.11.1 (`nvm use` first). Data is static JSON imported at module scope.

## Global Constraints

- Run every command from `frontend/`, on the Node version pinned by `.nvmrc`. Run `nvm use` first.
- **Two verification layers, each with its own job.** The existing `scripts/check-*.mjs` assertion scripts read JSON data and source text — keep writing new data and contract checks in that idiom. Vitest, added in Task 5, covers *behaviour* of the pure resolver utilities only. Do not test components, pages or Nuxt runtime with it, and do not replace any existing check script.
- Every font size must be a named `@theme` step. Never write `text-[…]`. See `AGENTS.md`.
- Never add `<style scoped>` or CSS Modules. Custom CSS goes in `app/assets/css/main.css`.
- Structural marker groups keep mandatory inner spaces: `[ site-shell ]`, never `[site-shell]`.
- Component-facing data shapes must not change. If a component needs editing to consume the new data, the resolver is wrong.
- All eight existing checks plus the new `check:data` must pass before every commit: `check:tailwind check:i18n check:directories check:artists check:links check:locations check:mobile check:preloader`.
- Draft records **render**. `status` is a provenance marker, never a display filter.
- Never infer building-level coordinates. City centroids only, as listed in Task 2.

---

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `scripts/check-data-integrity.mjs` | Validates FKs, slug uniqueness, translation completeness, geo presence, record counts |
| `app/data/v2/locations.json` | 17 cities. Staging; moved in Task 7 |
| `app/data/v2/venues.json` | 36 buildings. Staging |
| `app/data/v2/artists.json` | 62 artists in Directus shape. Staging |
| `app/data/v2/exhibitions.json` | 13 exhibitions. Staging |
| `app/data/v2/exhibitions_artists.json` | M2M junction. Staging |
| `app/utils/contentStatus.ts` | `VISIBLE_STATUSES` constant and `isVisible()` |
| `app/utils/pickTranslation.ts` | Locale selection with `locale → en → first` fallback |
| `app/utils/resolveVenues.ts` | Joins venues to their location |
| `app/utils/resolveExhibitions.ts` | Joins exhibitions to venue, city and artists |
| `vitest.config.ts` | Vitest setup: `~` alias, node environment, `test/unit/**` |
| `test/unit/contentStatus.spec.ts` | Status gate behaviour |
| `test/unit/pickTranslation.spec.ts` | Fallback chain and empty-string fallthrough |
| `test/unit/resolveVenues.spec.ts` | Location join, geo levels, dangling-FK throw |
| `test/unit/resolveExhibitions.spec.ts` | Junction join, artist ordering, throws |
| `test/unit/artistDirectory.spec.ts` | Directory built from the junction |

**Modified:**

| Path | Change |
|---|---|
| `app/types/content.ts` | New interfaces; old ones removed in Task 7 |
| `app/composables/useArchiveData.ts` | Rewired onto resolvers |
| `app/utils/artistDirectory.ts` | Reads the junction instead of matching name strings |
| `app/pages/locations/` → `app/pages/venues/` | Route rename |
| `nuxt.config.ts` | Redirects from `/locations/*` |
| `scripts/check-directory-routes.mjs` | Paths + `locations.json` reference |
| `scripts/check-mobile-density.mjs` | Path |
| `scripts/check-archive-text-links.mjs` | Paths + `'/locations/'` link assertion |
| `scripts/check-location-exhibition-browser.mjs` | Path |
| `scripts/check-artist-directory-modal.mjs` | `locationExhibitions` binding name |
| `package.json` | `check:data` script |
| `AGENTS.md` | Translation rule amendment |

**Deleted in Task 7:** `app/data/location-exhibitions.json`, `app/data/translations/de/` (whole directory), and the old `locations.json` / `venues.json` / `exhibitions.json` / `artists.json` once replaced.

> **Correction to the spec:** §"Check scripts" names two scripts needing updates. The real count is **five** — `check-artist-directory-modal.mjs` and `check-archive-text-links.mjs` also depend on the renamed paths or the `locationExhibitions` binding. Task 8 covers all five.

---

## Task 1: Data-integrity check harness

Write the validator first. It fails until the data exists, which is the point.

**Files:**
- Create: `scripts/check-data-integrity.mjs`
- Modify: `package.json` (scripts block)

**Interfaces:**
- Consumes: nothing
- Produces: `pnpm check:data`, which every later data task runs

- [ ] **Step 1: Write the failing check**

Create `scripts/check-data-integrity.mjs`:

```js
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = async (path) => JSON.parse(await readFile(resolve(projectRoot, path), 'utf8'))

const [locations, venues, artists, exhibitions, junction] = await Promise.all([
  readJson('app/data/v2/locations.json'),
  readJson('app/data/v2/venues.json'),
  readJson('app/data/v2/artists.json'),
  readJson('app/data/v2/exhibitions.json'),
  readJson('app/data/v2/exhibitions_artists.json')
])

const ids = (records) => new Set(records.map((record) => record.id))
const locationIds = ids(locations)
const venueIds = ids(venues)
const artistIds = ids(artists)
const exhibitionIds = ids(exhibitions)

const uniqueSlugs = (records) => new Set(records.map((record) => record.slug)).size === records.length
const everyHasEnglish = (records) => records.every((record) =>
  Array.isArray(record.translations) && record.translations.some((entry) => entry.languages_code === 'en'))
const validStatus = (records) => records.every((record) => ['draft', 'published'].includes(record.status))

const checks = [
  ['locations count is 17', locations.length === 17],
  ['venues count is 36', venues.length === 36],
  ['artists count is 62', artists.length === 62],
  ['exhibitions count is 13', exhibitions.length === 13],

  ['every location has coordinates', locations.every((location) =>
    typeof location.latitude === 'number' && typeof location.longitude === 'number')],
  ['coordinates are inside Austria', locations.every((location) =>
    location.latitude > 46 && location.latitude < 49 && location.longitude > 9 && location.longitude < 17)],

  ['venue.location_id all resolve', venues.every((venue) => locationIds.has(venue.location_id))],
  ['exhibition.primary_venue_id all resolve', exhibitions.every((exhibition) =>
    venueIds.has(exhibition.primary_venue_id))],
  ['junction exhibition_id all resolve', junction.every((row) => exhibitionIds.has(row.exhibition_id))],
  ['junction artist_id all resolve', junction.every((row) => artistIds.has(row.artist_id))],
  ['every exhibition has at least one artist', exhibitions.every((exhibition) =>
    junction.some((row) => row.exhibition_id === exhibition.id))],

  ['every venue has a type', venues.every((venue) => typeof venue.type === 'string' && venue.type.length > 0)],
  ['venue types are from the known set', venues.every((venue) =>
    ['gallery', 'museum', 'kunsthalle', 'art_cafe', 'open_air', 'forum'].includes(venue.type))],

  ['location slugs unique', uniqueSlugs(locations)],
  ['venue slugs unique', uniqueSlugs(venues)],
  ['artist slugs unique', uniqueSlugs(artists)],
  ['exhibition slugs unique', uniqueSlugs(exhibitions)],

  ['every location has an en translation', everyHasEnglish(locations)],
  ['every venue has an en translation', everyHasEnglish(venues)],
  ['every exhibition has an en translation', everyHasEnglish(exhibitions)],

  ['locations have a valid status', validStatus(locations)],
  ['venues have a valid status', validStatus(venues)],
  ['artists have a valid status', validStatus(artists)],
  ['exhibitions have a valid status', validStatus(exhibitions)],

  ['no artist keeps a stored record_count', artists.every((artist) => artist.record_count === undefined)]
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Data integrity failed:')
  for (const [label] of failures) console.error(`  - ${label}`)
  process.exitCode = 1
} else {
  console.log(`Data integrity OK: ${checks.length} assertions across 5 collections.`)
}
```

- [ ] **Step 2: Register the script**

In `package.json`, add to `"scripts"`, keeping the existing alphabetical grouping of `check:*` entries:

```json
"check:data": "node scripts/check-data-integrity.mjs",
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm check:data`
Expected: FAIL — `ENOENT: no such file or directory … app/data/v2/locations.json`. The validator cannot pass before the data exists.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-data-integrity.mjs package.json
git commit -m "Add data-integrity checks for the Directus-aligned collections"
```

---

## Task 2: Cities and venues

**Files:**
- Create: `app/data/v2/locations.json`, `app/data/v2/venues.json`
- Read for source data: `app/data/locations.json`, `app/data/venues.json`, `app/data/exhibitions.json`

**Interfaces:**
- Consumes: `pnpm check:data` from Task 1
- Produces: `location.id` values shaped `location-<slug>`; `venue.id` values shaped `venue-<slug>`. Task 4 references `venue.id`.

- [ ] **Step 1: Write the transformation script**

Create `scripts/tmp-build-places.mjs` (deleted in Step 5 — it is a one-shot generator, not project tooling):

```js
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = async (p) => JSON.parse(await readFile(resolve(root, p), 'utf8'))

// Town-centre approximations. Verify against an authoritative source before launch;
// adequate for radius search, not for door-level mapping.
const CENTROIDS = {
  'Bad Eisenkappel': [46.4833, 14.5833],
  'Baden': [48.0059, 16.2318],
  'Bludenz': [47.1550, 9.8206],
  'Bregenz': [47.5031, 9.7471],
  'Eisenstadt': [47.8456, 16.5231],
  'Graz': [47.0707, 15.4395],
  'Hallein': [47.6819, 13.0958],
  'Innsbruck': [47.2692, 11.4041],
  'Klagenfurt am Wörthersee': [46.6247, 14.3053],
  'Krems an der Donau': [48.4103, 15.6142],
  'Linz': [48.3069, 14.2858],
  'Lustenau': [47.4269, 9.6606],
  'Salzburg': [47.8095, 13.0550],
  'Schruns': [47.0794, 9.9186],
  'Spittal an der Drau': [46.7967, 13.4989],
  'Vienna': [48.2082, 16.3738],
  'Villach': [46.6103, 13.8558]
}

const slugify = (value) => value.toLocaleLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Venue type for the 10 promoted institutions; everything from locations.json is a gallery.
const PROMOTED_TYPES = {
  'kuenstlerhaus-wien': 'kunsthalle',
  'werkraum-bregenzerwald': 'forum',
  'galerie-im-traklhaus': 'gallery',
  'neue-galerie-graz': 'museum',
  'lentos-kunstmuseum': 'museum',
  'kunsthalle-innsbruck': 'kunsthalle',
  'belvedere-21': 'museum',
  'leopold-museum': 'museum',
  'kunsthalle-wien': 'kunsthalle',
  'kunsthaus-graz': 'museum'
}

const oldLocations = await read('app/data/locations.json')
const oldVenues = await read('app/data/venues.json')
const oldExhibitions = await read('app/data/exhibitions.json')

// --- locations: one row per distinct city ---
const cities = new Map()
for (const record of oldLocations) {
  if (cities.has(record.city_name)) continue
  const [latitude, longitude] = CENTROIDS[record.city_name] ?? []
  if (latitude === undefined) throw new Error(`No centroid for ${record.city_name}`)
  cities.set(record.city_name, {
    id: `location-${slugify(record.city_name)}`,
    slug: slugify(record.city_name),
    city_name: record.city_name,
    postal_code: record.postal_code ?? '',
    state: record.state ?? '',
    country: record.country ?? 'Austria',
    latitude,
    longitude,
    status: 'published',
    translations: [{ languages_code: 'en', description: '' }]
  })
}

// --- venues: 26 real galleries + 6 orphans + 4 from the demo exhibitions ---
const venues = oldLocations.map((record) => ({
  id: `venue-${record.slug}`,
  slug: record.slug,
  location_id: `location-${slugify(record.city_name)}`,
  name: record.name,
  type: 'gallery',
  address: record.address ?? '',
  website_url: record.website_url,
  latitude: record.latitude,
  longitude: record.longitude,
  image: record.image,
  image_alt: record.image_alt,
  archive_number: record.archive_number,
  featured: record.featured ?? false,
  status: record.slug === 'parkschloessl-spittal-drau' ? 'published' : 'draft',
  translations: (record.translations ?? []).map((entry) => ({ ...entry }))
}))

const seen = new Set(venues.map((venue) => venue.slug))

for (const record of oldVenues) {
  if (seen.has(record.slug)) continue
  seen.add(record.slug)
  venues.push({
    id: `venue-${record.slug}`,
    slug: record.slug,
    location_id: `location-${slugify(record.city)}`,
    name: record.name,
    type: PROMOTED_TYPES[record.slug] ?? 'gallery',
    address: record.address ?? '',
    website_url: record.website_url,
    latitude: record.latitude,
    longitude: record.longitude,
    image: record.image,
    image_alt: record.hero_image_alt ?? '',
    archive_number: record.archive_number ?? '',
    featured: false,
    status: 'draft',
    translations: [{ languages_code: 'en', description: '', lede: record.lede ?? '', about: record.about ?? [] }]
  })
}

for (const record of oldExhibitions) {
  const slug = slugify(record.venue)
  if (seen.has(slug)) continue
  seen.add(slug)
  venues.push({
    id: `venue-${slug}`,
    slug,
    location_id: `location-${slugify(record.city)}`,
    name: record.venue,
    type: PROMOTED_TYPES[slug] ?? 'gallery',
    address: '',
    image: record.image,
    image_alt: '',
    archive_number: '',
    featured: false,
    status: 'draft',
    translations: [{ languages_code: 'en', description: '' }]
  })
}

await mkdir(resolve(root, 'app/data/v2'), { recursive: true })
const write = (name, value) =>
  writeFile(resolve(root, `app/data/v2/${name}`), JSON.stringify(value, null, 2) + '\n', 'utf8')

await write('locations.json', [...cities.values()])
await write('venues.json', venues)
console.log(`locations: ${cities.size}  venues: ${venues.length}`)
```

- [ ] **Step 2: Run it**

Run: `node scripts/tmp-build-places.mjs`
Expected: `locations: 17  venues: 36`

If the venue count is not 36, a slug collided. Print `venues.map(v => v.slug)` and compare against the disposition table in the spec before continuing.

- [ ] **Step 3: Run the integrity check**

Run: `pnpm check:data`
Expected: still FAILS, now on the three missing collections (`app/data/v2/artists.json`). The location and venue assertions must no longer appear in the failure list. If any of them do, fix the generator before moving on.

- [ ] **Step 4: Fill the English descriptions**

The generator writes `description: ''` for promoted venues because there is no source text. Copy each promoted venue's description from `app/data/venues.json`'s `translations` where one exists; leave `''` where none does. Never invent venue descriptions.

- [ ] **Step 5: Delete the generator and commit**

```bash
rm scripts/tmp-build-places.mjs
git add app/data/v2/locations.json app/data/v2/venues.json
git commit -m "Add cities and venues collections with city-level geo data"
```

---

## Task 3: Artists

**Files:**
- Create: `app/data/v2/artists.json`
- Read: `app/data/artists.json`

**Interfaces:**
- Consumes: nothing from Task 2
- Produces: `artist.id` unchanged from the current file (`artist-<slug>`), so Task 4's junction can reference them

- [ ] **Step 1: Write the transformation script**

Create `scripts/tmp-build-artists.mjs`:

```js
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artists = JSON.parse(await readFile(resolve(root, 'app/data/artists.json'), 'utf8'))

// The nine real figures. Everything else is alphabet-rail scaffolding and is marked draft.
const REAL = new Set([
  'Anselm Kiefer', 'Brigitte Kowanz', 'Birgit Juergenssen', 'Guenter Brus',
  'Oskar Kokoschka', 'Maria Lassnig', 'Raqs Media Collective', 'VALIE EXPORT', 'Franz West'
])

// Names that are collectives or mononyms, not first/last pairs.
const COLLECTIVE = new Set(['Raqs Media Collective', 'VALIE EXPORT'])

const splitName = (name) => {
  if (COLLECTIVE.has(name)) return { first_name: '', last_name: '', artist_name: name }
  const parts = name.split(/\s+/)
  return { first_name: parts.slice(0, -1).join(' '), last_name: parts.at(-1), artist_name: null }
}

const next = artists.map((artist) => {
  const { first_name, last_name, artist_name } = splitName(artist.name)
  return {
    id: artist.id,
    slug: artist.slug,
    first_name,
    last_name,
    middle_initial: null,
    artist_name,
    birth_year: null,
    death_year: null,
    nationality: null,
    website_url: null,
    instagram_handle: null,
    profile_image: null,
    status: REAL.has(artist.name) ? 'published' : 'draft',
    translations: [{ languages_code: 'en', biography: '' }]
  }
})

await writeFile(resolve(root, 'app/data/v2/artists.json'), JSON.stringify(next, null, 2) + '\n', 'utf8')
console.log(`artists: ${next.length}  published: ${next.filter((a) => a.status === 'published').length}`)
```

`record_count`, `location` and `years` are deliberately dropped. All three are recomputed at runtime by `buildArtistDirectory`, and the stored values are already ignored.

**Do not populate `birth_year`, `nationality` or `biography`.** For the 53 scaffolding artists there is no source, and inventing biography would put unverifiable claims into an archive. `null` makes the gap self-evident.

- [ ] **Step 2: Run it**

Run: `node scripts/tmp-build-artists.mjs`
Expected: `artists: 62  published: 9`

- [ ] **Step 3: Verify the name split on the hard cases**

Run:

```bash
node -e "const a=require('./app/data/v2/artists.json'); \
for (const n of ['valie-export','raqs-media-collective','birgit-juergenssen','anselm-kiefer']) \
console.log(JSON.stringify(a.find(x=>x.slug===n)?.first_name)+' | '+JSON.stringify(a.find(x=>x.slug===n)?.last_name)+' | '+JSON.stringify(a.find(x=>x.slug===n)?.artist_name));"
```

Expected:
```
"" | "" | "VALIE EXPORT"
"" | "" | "Raqs Media Collective"
"Birgit" | "Juergenssen" | null
"Anselm" | "Kiefer" | null
```

- [ ] **Step 4: Run the integrity check**

Run: `pnpm check:data`
Expected: FAILS only on the two missing exhibition collections. The artist assertions must pass, including `no artist keeps a stored record_count`.

- [ ] **Step 5: Delete the generator and commit**

```bash
rm scripts/tmp-build-artists.mjs
git add app/data/v2/artists.json
git commit -m "Add artists collection in the Directus field shape"
```

---

## Task 4: Exhibitions and the artist junction

**Files:**
- Create: `app/data/v2/exhibitions.json`, `app/data/v2/exhibitions_artists.json`
- Read: `app/data/location-exhibitions.json`, `app/data/exhibitions.json`, `app/data/translations/de/location-exhibitions.json`, `app/data/v2/artists.json`, `app/data/v2/venues.json`

**Interfaces:**
- Consumes: `venue.id` from Task 2, `artist.id` from Task 3
- Produces: `exhibition.id`; the junction rows Task 7's `buildArtistDirectory` reads

- [ ] **Step 1: Write the transformation script**

Create `scripts/tmp-build-exhibitions.mjs`:

```js
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = async (p) => JSON.parse(await readFile(resolve(root, p), 'utf8'))

const locationExhibitions = await read('app/data/location-exhibitions.json')
const legacy = await read('app/data/exhibitions.json')
const deOverlay = await read('app/data/translations/de/location-exhibitions.json')
const artists = await read('app/data/v2/artists.json')
const venues = await read('app/data/v2/venues.json')

const slugify = (value) => value.toLocaleLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const venueBySlug = new Map(venues.map((venue) => [venue.slug, venue]))
const artistByName = new Map(artists.map((artist) => [
  (artist.artist_name ?? `${artist.first_name} ${artist.last_name}`).trim().toLocaleLowerCase(),
  artist
]))

const splitCredit = (value) => value.split(/\s*(?:&|·|,| and )\s*/).map((s) => s.trim()).filter(Boolean)

const exhibitions = []
const junction = []
let junctionId = 1

const link = (exhibitionId, credit) => {
  splitCredit(credit).forEach((name, index) => {
    const artist = artistByName.get(name.toLocaleLowerCase())
    if (!artist) throw new Error(`No artist record for credit "${name}" (${exhibitionId})`)
    junction.push({ id: junctionId++, exhibition_id: exhibitionId, artist_id: artist.id, sort: index })
  })
}

// --- the 9 real Parkschlössl records ---
for (const record of locationExhibitions) {
  const venue = venueBySlug.get(record.venue_slug)
  if (!venue) throw new Error(`No venue for ${record.venue_slug}`)
  const de = deOverlay[record.id] ?? {}
  exhibitions.push({
    id: record.id,
    slug: record.slug,
    primary_venue_id: venue.id,
    start_date: record.start_date,
    end_date: record.end_date,
    is_permanent: false,
    image: record.image,
    image_alt: record.image_alt,
    opening_hours: record.opening_hours,
    vernissage: record.vernissage,
    medium: record.medium ?? null,
    source_pdf: record.source_pdf ?? null,
    featured: record.featured ?? false,
    status: 'published',
    translations: [
      { languages_code: 'en', title: record.title, summary: record.summary,
        description: record.description ?? '', date_range: record.date_range,
        opening_hours: record.opening_hours, vernissage: record.vernissage,
        image_alt: record.image_alt, medium: record.medium ?? '' },
      { languages_code: 'de', title: record.title, summary: de.summary ?? '',
        description: de.description ?? '', date_range: de.date_range ?? '',
        opening_hours: de.opening_hours ?? '', vernissage: de.vernissage ?? '',
        image_alt: de.image_alt ?? '', medium: de.medium ?? '' }
    ]
  })
  link(record.id, record.artist)
}

// --- the 4 invented records; the Schmölzer duplicate collapses into the real one ---
const DUPLICATE = 'exhibition-all-the-magic'
for (const record of legacy) {
  if (record.id === DUPLICATE) continue
  const venue = venueBySlug.get(slugify(record.venue))
  if (!venue) throw new Error(`No venue for ${record.venue}`)
  exhibitions.push({
    id: record.id,
    slug: record.slug,
    primary_venue_id: venue.id,
    start_date: record.date_range.slice(0, 10).split('.').reverse().join('-'),
    end_date: record.date_range.slice(-10).split('.').reverse().join('-'),
    is_permanent: false,
    image: record.image,
    image_alt: '',
    opening_hours: '',
    vernissage: '',
    medium: null,
    source_pdf: null,
    featured: record.featured ?? false,
    status: 'draft',
    translations: [
      { languages_code: 'en', title: record.title, summary: '', description: '',
        date_range: record.date_range, opening_hours: '', vernissage: '', image_alt: '', medium: '' }
    ]
  })
  link(record.id, record.artist)
}

const write = (name, value) =>
  writeFile(resolve(root, `app/data/v2/${name}`), JSON.stringify(value, null, 2) + '\n', 'utf8')

await write('exhibitions.json', exhibitions)
await write('exhibitions_artists.json', junction)
console.log(`exhibitions: ${exhibitions.length}  junction rows: ${junction.length}`)
```

- [ ] **Step 2: Run it**

Run: `node scripts/tmp-build-exhibitions.mjs`
Expected: `exhibitions: 13  junction rows: 14`

14 rows rather than 13 because *Farben im Park* credits two artists (Sylvia Campidell and Judith Maria Kulle) and therefore produces two junction rows.

If it throws `No artist record for credit …`, the credit string does not match any artist in `v2/artists.json`. That is the migration surfacing exactly the fragility this refactor removes: add the missing artist to `app/data/v2/artists.json` with `status: "draft"` and re-run. Do not weaken `splitCredit` to make the error disappear.

- [ ] **Step 3: Verify the multi-artist join**

Run:

```bash
node -e "const j=require('./app/data/v2/exhibitions_artists.json'); \
console.log(j.filter(r=>r.exhibition_id==='parkschloessl-campidell-kulle-2026'));"
```

Expected: two rows, `sort` 0 and 1, with different `artist_id` values.

- [ ] **Step 4: Run the integrity check**

Run: `pnpm check:data`
Expected: **PASS** — `Data integrity OK: 25 assertions across 5 collections.`

- [ ] **Step 5: Delete the generator and commit**

```bash
rm scripts/tmp-build-exhibitions.mjs
git add app/data/v2/exhibitions.json app/data/v2/exhibitions_artists.json
git commit -m "Add exhibitions collection and the exhibitions_artists junction"
```

---

## Task 5: Unit-test runner

The resolvers added in Task 6 are the riskiest part of this migration: they must reproduce the exact shape components already consume, and the existing `check:*` scripts cannot verify behaviour — they only assert that strings appear in files.

These utilities import nothing but internal modules and *types*, which are erased at runtime. No Nuxt runtime, no DOM, no `@nuxt/test-utils` — plain Vitest with one path alias.

**Files:**
- Create: `vitest.config.ts`, `test/unit/contentStatus.spec.ts` (smoke test only)
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: `pnpm test` and `pnpm test:watch`, used by Tasks 6 and 7

- [ ] **Step 1: Install Vitest**

```bash
pnpm add -D vitest
```

- [ ] **Step 2: Configure it**

Create `vitest.config.ts` at the repository root:

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url))
    }
  },
  test: {
    include: ['test/unit/**/*.spec.ts'],
    environment: 'node'
  }
})
```

`environment: 'node'` is deliberate. Every unit under test is a pure function; a DOM environment would only slow the suite down.

Tests live in `test/`, not beside the source, because `app/` is Nuxt's `srcDir` — spec files inside it risk being picked up by the build.

- [ ] **Step 3: Register the scripts**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
```

- [ ] **Step 4: Write a smoke test that fails**

Create `test/unit/contentStatus.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { VISIBLE_STATUSES } from '~/utils/contentStatus'

describe('VISIBLE_STATUSES', () => {
  it('includes draft, because draft records must still render', () => {
    expect(VISIBLE_STATUSES).toContain('draft')
  })
})
```

- [ ] **Step 5: Run it to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "~/utils/contentStatus"`. The module does not exist until Task 6, which proves the alias and the runner are wired correctly and that the test is really executing.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts test/unit/contentStatus.spec.ts package.json pnpm-lock.yaml
git commit -m "Add Vitest for the pure resolver utilities"
```

---

## Task 6: Types and resolver utilities

Test-first. Pure additions otherwise — nothing imports them yet, so the site is unaffected and all existing checks stay green.

**Files:**
- Create: `app/utils/contentStatus.ts`, `app/utils/pickTranslation.ts`, `app/utils/resolveVenues.ts`, `app/utils/resolveExhibitions.ts`
- Create: `test/unit/pickTranslation.spec.ts`, `test/unit/resolveVenues.spec.ts`, `test/unit/resolveExhibitions.spec.ts`
- Modify: `app/types/content.ts` (add interfaces; old ones stay until Task 7), `test/unit/contentStatus.spec.ts`

**Interfaces:**
- Consumes: the v2 JSON shapes from Tasks 2–4, `pnpm test` from Task 5
- Produces: `isVisible(record)`, `pickTranslation(record, locale)`, `resolveVenues(locations, venues, locale)`, `resolveExhibitions(exhibitions, venues, locations, junction, artists, locale)` — all consumed by Task 7

- [ ] **Step 1: Add the new interfaces**

Append to `app/types/content.ts`:

```ts
export type ContentStatus = 'draft' | 'published'

export type VenueType = 'gallery' | 'museum' | 'kunsthalle' | 'art_cafe' | 'open_air' | 'forum'

export interface TranslationEntry {
  languages_code: string
  [field: string]: string | string[]
}

export interface CityLocation {
  id: string
  slug: string
  city_name: string
  postal_code: string
  state: string
  country: string
  latitude: number
  longitude: number
  status: ContentStatus
  translations: TranslationEntry[]
}

export interface VenueRecord {
  id: string
  slug: string
  location_id: string
  name: string
  type: VenueType
  address: string
  website_url?: string
  latitude?: number
  longitude?: number
  image: string
  image_alt: string
  archive_number: string
  featured: boolean
  status: ContentStatus
  translations: TranslationEntry[]
}

export interface ExhibitionRecord {
  id: string
  slug: string
  primary_venue_id: string
  start_date: string
  end_date: string
  is_permanent: boolean
  image: string
  image_alt: string
  opening_hours: string
  vernissage: string
  medium: string | null
  source_pdf: string | null
  featured: boolean
  status: ContentStatus
  translations: TranslationEntry[]
}

export interface ExhibitionArtistLink {
  id: number
  exhibition_id: string
  artist_id: string
  sort: number
}

export interface ArtistRecord {
  id: string
  slug: string
  first_name: string
  last_name: string
  middle_initial: string | null
  artist_name: string | null
  birth_year: number | null
  death_year: number | null
  nationality: string | null
  website_url: string | null
  instagram_handle: string | null
  profile_image: string | null
  status: ContentStatus
  translations: TranslationEntry[]
}
```

- [ ] **Step 2: Write the failing tests for the status gate and translation picker**

Extend `test/unit/contentStatus.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { VISIBLE_STATUSES, isVisible } from '~/utils/contentStatus'

describe('VISIBLE_STATUSES', () => {
  it('includes draft, because draft records must still render', () => {
    expect(VISIBLE_STATUSES).toContain('draft')
  })

  it('includes published', () => {
    expect(VISIBLE_STATUSES).toContain('published')
  })
})

describe('isVisible', () => {
  it('accepts a published record', () => {
    expect(isVisible({ status: 'published' })).toBe(true)
  })

  it('accepts a draft record while the project is work in progress', () => {
    expect(isVisible({ status: 'draft' })).toBe(true)
  })
})
```

Create `test/unit/pickTranslation.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { pickTranslation } from '~/utils/pickTranslation'

const record = {
  translations: [
    { languages_code: 'en', title: 'Walking & Seeing', summary: 'English summary', medium: 'Watercolour' },
    { languages_code: 'de', title: 'Gehen & Sehen', summary: '', medium: 'Aquarelle' }
  ]
}

describe('pickTranslation', () => {
  it('returns the requested locale when it exists', () => {
    expect(pickTranslation(record, 'de').title).toBe('Gehen & Sehen')
  })

  it('falls back to English for an unknown locale', () => {
    expect(pickTranslation(record, 'fr').title).toBe('Walking & Seeing')
  })

  it('falls through empty strings to the next rung', () => {
    // German summary is empty, so English must fill it rather than blanking the field.
    expect(pickTranslation(record, 'de').summary).toBe('English summary')
  })

  it('keeps a non-empty value from the requested locale', () => {
    expect(pickTranslation(record, 'de').medium).toBe('Aquarelle')
  })

  it('never returns the languages_code marker as a content field', () => {
    expect(pickTranslation(record, 'de').languages_code).toBeUndefined()
  })

  it('uses the first available translation when neither locale nor en exist', () => {
    const only = { translations: [{ languages_code: 'it', title: 'Solo italiano' }] }
    expect(pickTranslation(only, 'de').title).toBe('Solo italiano')
  })
})
```

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "~/utils/pickTranslation"` and the `isVisible` import error. Neither module exists yet.

- [ ] **Step 4: Write the status gate**

Create `app/utils/contentStatus.ts`:

```ts
import type { ContentStatus } from '~/types/content'

/**
 * Which records reach the frontend.
 *
 * `status` marks provenance, not visibility. While the project is work in
 * progress much of the content is invented or refers to institutions that are
 * not yet partners, and it must still render or most pages would be empty.
 *
 * Pre-launch, narrow this to ['published']. That is the only change required —
 * no component contains a status conditional.
 */
export const VISIBLE_STATUSES: readonly ContentStatus[] = ['published', 'draft']

export const isVisible = <T extends { status: ContentStatus }>(record: T): boolean =>
  VISIBLE_STATUSES.includes(record.status)
```

- [ ] **Step 5: Write the translation picker**

Create `app/utils/pickTranslation.ts`:

```ts
import type { TranslationEntry } from '~/types/content'

/**
 * Selects the translation for `locale`, falling back locale → en → first available.
 *
 * Languages are equal in the frontend: nothing privileges `en` beyond its place
 * as a fallback rung. English-first is a backend authoring convention.
 *
 * Empty-string fields fall through to the next rung so a half-filled German
 * record does not blank out text that English has.
 */
export const pickTranslation = <T extends { translations: TranslationEntry[] }>(
  record: T,
  locale: string
): Record<string, string | string[]> => {
  const byCode = (code: string) => record.translations.find((entry) => entry.languages_code === code)
  const chain = [byCode(locale), byCode('en'), record.translations[0]].filter(Boolean) as TranslationEntry[]

  const merged: Record<string, string | string[]> = {}
  for (const entry of chain) {
    for (const [field, value] of Object.entries(entry)) {
      if (field === 'languages_code') continue
      const missing = merged[field] === undefined || merged[field] === ''
      if (missing && value !== '' && value !== undefined) merged[field] = value
    }
  }
  return merged
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 10 tests across two files.

If `falls through empty strings to the next rung` fails, the merge loop is treating `''` as a present value. That case is the whole reason the function merges rung by rung rather than returning the first matching entry.

- [ ] **Step 7: Write the failing tests for the resolvers**

Create `test/unit/resolveVenues.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { resolveVenues } from '~/utils/resolveVenues'

const locations = [{
  id: 'location-graz', slug: 'graz', city_name: 'Graz', postal_code: '8010',
  state: 'Styria', country: 'Austria', latitude: 47.0707, longitude: 15.4395,
  status: 'published' as const, translations: [{ languages_code: 'en', description: '' }]
}]

const venue = {
  id: 'venue-neue-galerie-graz', slug: 'neue-galerie-graz', location_id: 'location-graz',
  name: 'Neue Galerie Graz', type: 'museum' as const, address: 'Joanneumsviertel',
  image: '/i.webp', image_alt: 'alt', archive_number: '03', featured: false,
  status: 'draft' as const,
  translations: [{ languages_code: 'en', description: 'English text' }]
}

describe('resolveVenues', () => {
  it('inlines the city from the linked location', () => {
    expect(resolveVenues(locations, [venue], 'en')[0].city).toBe('Graz')
  })

  it('exposes the city centroid separately from the venue pin', () => {
    const resolved = resolveVenues(locations, [venue], 'en')[0]
    expect(resolved.city_latitude).toBe(47.0707)
    expect(resolved.latitude).toBeUndefined()
  })

  it('keeps draft venues, because they must still render', () => {
    expect(resolveVenues(locations, [venue], 'en')).toHaveLength(1)
  })

  it('throws with the offending id when location_id does not resolve', () => {
    const orphan = { ...venue, location_id: 'location-nowhere' }
    expect(() => resolveVenues(locations, [orphan], 'en'))
      .toThrow(/venue-neue-galerie-graz references unknown location location-nowhere/)
  })
})
```

Create `test/unit/resolveExhibitions.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { resolveExhibitions } from '~/utils/resolveExhibitions'

const locations = [{
  id: 'location-spittal', slug: 'spittal-an-der-drau', city_name: 'Spittal an der Drau',
  postal_code: '9800', state: 'Carinthia', country: 'Austria',
  latitude: 46.7967, longitude: 13.4989, status: 'published' as const,
  translations: [{ languages_code: 'en', description: '' }]
}]

const venues = [{
  id: 'venue-parkschloessl', slug: 'parkschloessl-spittal-drau', location_id: 'location-spittal',
  name: 'Parkschlössl', type: 'gallery' as const, address: '', image: '/v.webp', image_alt: '',
  archive_number: '17', featured: true, status: 'published' as const,
  translations: [{ languages_code: 'en', description: '' }]
}]

const artists = [
  { id: 'artist-sylvia-campidell', slug: 'sylvia-campidell', first_name: 'Sylvia',
    last_name: 'Campidell', middle_initial: null, artist_name: null, birth_year: null,
    death_year: null, nationality: null, website_url: null, instagram_handle: null,
    profile_image: null, status: 'published' as const, translations: [{ languages_code: 'en', biography: '' }] },
  { id: 'artist-judith-maria-kulle', slug: 'judith-maria-kulle', first_name: 'Judith Maria',
    last_name: 'Kulle', middle_initial: null, artist_name: null, birth_year: null,
    death_year: null, nationality: null, website_url: null, instagram_handle: null,
    profile_image: null, status: 'published' as const, translations: [{ languages_code: 'en', biography: '' }] }
]

const exhibitions = [{
  id: 'parkschloessl-campidell-kulle-2026', slug: 'farben-im-park',
  primary_venue_id: 'venue-parkschloessl', start_date: '2026-07-28', end_date: '2026-08-07',
  is_permanent: false, image: '/e.webp', image_alt: 'alt', opening_hours: 'Mon-Fri',
  vernissage: 'Mon 27 July', medium: null, source_pdf: null, featured: false,
  status: 'published' as const,
  translations: [{ languages_code: 'en', title: 'Farben im Park', summary: 's',
    description: '', date_range: '28 July–7 August 2026', opening_hours: '', vernissage: '',
    image_alt: '', medium: '' }]
}]

const junction = [
  { id: 2, exhibition_id: 'parkschloessl-campidell-kulle-2026', artist_id: 'artist-judith-maria-kulle', sort: 1 },
  { id: 1, exhibition_id: 'parkschloessl-campidell-kulle-2026', artist_id: 'artist-sylvia-campidell', sort: 0 }
]

const resolve = () => resolveExhibitions(exhibitions, venues, locations, junction, artists, 'en')

describe('resolveExhibitions', () => {
  it('joins multiple artists in sort order regardless of junction row order', () => {
    expect(resolve()[0].artist).toBe('Sylvia Campidell & Judith Maria Kulle')
  })

  it('exposes the artist ids for downstream linking', () => {
    expect(resolve()[0].artist_ids).toEqual(['artist-sylvia-campidell', 'artist-judith-maria-kulle'])
  })

  it('inlines venue slug, venue name and city', () => {
    const [record] = resolve()
    expect(record.venue_slug).toBe('parkschloessl-spittal-drau')
    expect(record.venue).toBe('Parkschlössl')
    expect(record.city).toBe('Spittal an der Drau')
  })

  it('throws when primary_venue_id does not resolve', () => {
    const orphan = [{ ...exhibitions[0], primary_venue_id: 'venue-nowhere' }]
    expect(() => resolveExhibitions(orphan, venues, locations, junction, artists, 'en'))
      .toThrow(/references unknown venue venue-nowhere/)
  })

  it('throws when a junction row points at a missing artist', () => {
    const broken = [{ id: 3, exhibition_id: 'parkschloessl-campidell-kulle-2026', artist_id: 'artist-ghost', sort: 0 }]
    expect(() => resolveExhibitions(exhibitions, venues, locations, broken, artists, 'en'))
      .toThrow(/unknown artist artist-ghost/)
  })
})
```

- [ ] **Step 8: Run them to verify they fail**

Run: `pnpm test`
Expected: FAIL — both resolver modules unresolved.

- [ ] **Step 9: Write the venue resolver**

Create `app/utils/resolveVenues.ts`:

```ts
import type { CityLocation, VenueRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'

export interface ResolvedVenue {
  id: string
  slug: string
  name: string
  type: string
  address: string
  website_url?: string
  image: string
  image_alt: string
  archive_number: string
  featured: boolean
  city: string
  postal_code: string
  state: string
  country: string
  latitude?: number
  longitude?: number
  city_latitude: number
  city_longitude: number
  description?: string
  lede?: string
  about?: string[]
  image_caption?: string
  coordinate_label?: string
}

export const resolveVenues = (
  locations: CityLocation[],
  venues: VenueRecord[],
  locale: string
): ResolvedVenue[] => {
  const locationById = new Map(locations.map((location) => [location.id, location]))

  return venues.filter(isVisible).map((venue) => {
    const location = locationById.get(venue.location_id)
    if (!location) throw new Error(`venues.json: ${venue.id} references unknown location ${venue.location_id}`)
    const text = pickTranslation(venue, locale)

    return {
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      type: venue.type,
      address: venue.address,
      website_url: venue.website_url,
      image: venue.image,
      image_alt: venue.image_alt,
      archive_number: venue.archive_number,
      featured: venue.featured,
      city: location.city_name,
      postal_code: location.postal_code,
      state: location.state,
      country: location.country,
      latitude: venue.latitude,
      longitude: venue.longitude,
      city_latitude: location.latitude,
      city_longitude: location.longitude,
      description: text.description as string | undefined,
      lede: text.lede as string | undefined,
      about: text.about as string[] | undefined,
      image_caption: text.image_caption as string | undefined,
      coordinate_label: text.coordinate_label as string | undefined
    }
  })
}
```

- [ ] **Step 10: Write the exhibition resolver**

Create `app/utils/resolveExhibitions.ts`:

```ts
import type {
  ArtistRecord, CityLocation, ExhibitionArtistLink, ExhibitionRecord, VenueRecord
} from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'

export interface ResolvedExhibition {
  id: string
  slug: string
  title: string
  artist: string
  artist_ids: string[]
  venue_slug: string
  venue: string
  city: string
  start_date: string
  end_date: string
  date_range: string
  image: string
  image_alt: string
  summary: string
  description?: string
  medium?: string
  opening_hours: string
  vernissage: string
  source_pdf?: string
  featured: boolean
}

export const displayArtistName = (artist: ArtistRecord): string =>
  artist.artist_name ?? `${artist.first_name} ${artist.last_name}`.trim()

export const resolveExhibitions = (
  exhibitions: ExhibitionRecord[],
  venues: VenueRecord[],
  locations: CityLocation[],
  junction: ExhibitionArtistLink[],
  artists: ArtistRecord[],
  locale: string
): ResolvedExhibition[] => {
  const venueById = new Map(venues.map((venue) => [venue.id, venue]))
  const locationById = new Map(locations.map((location) => [location.id, location]))
  const artistById = new Map(artists.map((artist) => [artist.id, artist]))

  const linksByExhibition = new Map<string, ExhibitionArtistLink[]>()
  for (const link of junction) {
    const rows = linksByExhibition.get(link.exhibition_id) ?? []
    rows.push(link)
    linksByExhibition.set(link.exhibition_id, rows)
  }

  return exhibitions.filter(isVisible).map((exhibition) => {
    const venue = venueById.get(exhibition.primary_venue_id)
    if (!venue) {
      throw new Error(`exhibitions.json: ${exhibition.id} references unknown venue ${exhibition.primary_venue_id}`)
    }
    const location = locationById.get(venue.location_id)
    if (!location) throw new Error(`venues.json: ${venue.id} references unknown location ${venue.location_id}`)

    const links = (linksByExhibition.get(exhibition.id) ?? []).sort((a, b) => a.sort - b.sort)
    const linkedArtists = links.map((link) => {
      const artist = artistById.get(link.artist_id)
      if (!artist) throw new Error(`exhibitions_artists.json: unknown artist ${link.artist_id}`)
      return artist
    })

    const text = pickTranslation(exhibition, locale)

    return {
      id: exhibition.id,
      slug: exhibition.slug,
      title: text.title as string,
      artist: linkedArtists.map(displayArtistName).join(' & '),
      artist_ids: linkedArtists.map((artist) => artist.id),
      venue_slug: venue.slug,
      venue: venue.name,
      city: location.city_name,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      date_range: text.date_range as string,
      image: exhibition.image,
      image_alt: (text.image_alt as string) || exhibition.image_alt,
      summary: (text.summary as string) ?? '',
      description: (text.description as string) || undefined,
      medium: (text.medium as string) || undefined,
      opening_hours: (text.opening_hours as string) || exhibition.opening_hours,
      vernissage: (text.vernissage as string) || exhibition.vernissage,
      source_pdf: exhibition.source_pdf ?? undefined,
      featured: exhibition.featured
    }
  })
}
```

- [ ] **Step 11: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 19 tests across four files.

- [ ] **Step 12: Verify nothing broke**

Run: `pnpm test && pnpm check:tailwind && pnpm check:i18n && pnpm check:directories && pnpm check:artists && pnpm check:links && pnpm check:locations && pnpm check:mobile && pnpm check:preloader && pnpm build`
Expected: all PASS, build succeeds. Nothing imports the new utilities yet, so the check scripts only prove the additions are type-clean; the unit tests are what prove the behaviour.

- [ ] **Step 13: Commit**

```bash
git add app/types/content.ts app/utils/contentStatus.ts app/utils/pickTranslation.ts \
        app/utils/resolveVenues.ts app/utils/resolveExhibitions.ts test/unit
git commit -m "Add resolver utilities and Directus-shaped content types"
```

---

## Task 7: The flip

The single atomic task. Move `v2/` into place, rewire the composable and the artist directory, delete the old files.

**Files:**
- Move: `app/data/v2/*.json` → `app/data/`
- Delete: `app/data/location-exhibitions.json`, `app/data/translations/` (whole tree)
- Modify: `app/composables/useArchiveData.ts`, `app/utils/artistDirectory.ts`, `app/types/content.ts`, `scripts/check-data-integrity.mjs`

**Interfaces:**
- Consumes: everything from Tasks 2–6
- Produces: `useArchiveData()` returning `{ artists, locations, venues, locationExhibitions, sponsors }` — `locationExhibitions` keeps its name so no page changes

- [ ] **Step 1: Move the data into place**

```bash
git rm -q app/data/location-exhibitions.json app/data/exhibitions.json
git rm -q -r app/data/translations
mv app/data/v2/locations.json app/data/v2/venues.json app/data/v2/artists.json \
   app/data/v2/exhibitions.json app/data/v2/exhibitions_artists.json app/data/
rmdir app/data/v2
```

- [ ] **Step 2: Repoint the integrity check**

In `scripts/check-data-integrity.mjs`, change all five `readJson('app/data/v2/…')` paths to `readJson('app/data/…')`.

Run: `pnpm check:data`
Expected: PASS, 25 assertions.

- [ ] **Step 3: Rewrite the composable**

Replace `app/composables/useArchiveData.ts` entirely:

```ts
import artists from '~/data/artists.json'
import exhibitions from '~/data/exhibitions.json'
import exhibitionsArtists from '~/data/exhibitions_artists.json'
import locations from '~/data/locations.json'
import sponsors from '~/data/sponsors.json'
import venues from '~/data/venues.json'
import type {
  ArtistRecord, CityLocation, ExhibitionArtistLink, ExhibitionRecord, Sponsor, VenueRecord
} from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveVenues } from '~/utils/resolveVenues'

export function useArchiveData() {
  const { locale } = useI18n()

  const visibleLocations = computed(() => (locations as CityLocation[]).filter(isVisible))

  const venuesForLocale = computed(() =>
    resolveVenues(locations as CityLocation[], venues as VenueRecord[], locale.value))

  const exhibitionsForLocale = computed(() => resolveExhibitions(
    exhibitions as ExhibitionRecord[],
    venues as VenueRecord[],
    locations as CityLocation[],
    exhibitionsArtists as ExhibitionArtistLink[],
    artists as ArtistRecord[],
    locale.value
  ))

  return {
    artists: computed(() => (artists as ArtistRecord[]).filter(isVisible)),
    locations: venuesForLocale,
    venues: venuesForLocale,
    locationExhibitions: exhibitionsForLocale,
    sponsors: computed(() => sponsors as Sponsor[])
  }
}
```

`locations` and `venues` both return the resolved venues. Pages currently destructure `locations` and treat it as galleries; keeping the alias means no page changes in this task. Task 8 renames the binding.

- [ ] **Step 4: Write the failing test for the rebuilt artist directory**

Create `test/unit/artistDirectory.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildArtistDirectory } from '~/utils/artistDirectory'

const artist = (id: string, first: string, last: string) => ({
  id, slug: `${first}-${last}`.toLowerCase(), first_name: first, last_name: last,
  middle_initial: null, artist_name: null, birth_year: null, death_year: null,
  nationality: null, website_url: null, instagram_handle: null, profile_image: null,
  status: 'published' as const, translations: [{ languages_code: 'en', biography: '' }]
})

const artists = [artist('a-1', 'Sylvia', 'Campidell'), artist('a-2', 'Nobody', 'Unshown')]

const exhibitions = [
  { id: 'e-1', slug: 'farben-im-park', title: 'Farben im Park', venue: 'Parkschlössl',
    city: 'Spittal an der Drau', start_date: '2026-07-28' },
  { id: 'e-2', slug: 'zweite', title: 'Zweite', venue: 'Parkschlössl',
    city: 'Spittal an der Drau', start_date: '2025-01-01' }
] as never[]

const junction = [
  { id: 1, exhibition_id: 'e-1', artist_id: 'a-1', sort: 0 },
  { id: 2, exhibition_id: 'e-2', artist_id: 'a-1', sort: 0 }
]

describe('buildArtistDirectory', () => {
  it('counts records from the junction, not from a stored field', () => {
    const [campidell] = buildArtistDirectory(artists, exhibitions, junction)
      .filter((entry) => entry.id === 'a-1')
    expect(campidell.record_count).toBe(2)
  })

  it('aggregates years from the linked exhibitions in order', () => {
    const [campidell] = buildArtistDirectory(artists, exhibitions, junction)
      .filter((entry) => entry.id === 'a-1')
    expect(campidell.years).toBe('2025 · 2026')
  })

  it('keeps an artist with no exhibitions, so the alphabet rail stays populated', () => {
    const entry = buildArtistDirectory(artists, exhibitions, junction)
      .find((candidate) => candidate.id === 'a-2')
    expect(entry?.record_count).toBe(0)
  })

  it('never invents an artist that has no record in artists.json', () => {
    const ghost = [{ id: 9, exhibition_id: 'e-1', artist_id: 'a-missing', sort: 0 }]
    const built = buildArtistDirectory(artists, exhibitions, [...junction, ...ghost])
    expect(built.some((entry) => entry.id === 'a-missing')).toBe(false)
  })
})
```

The last test pins the behaviour change that motivated this refactor: the old implementation synthesised a directory entry for any name it found in an exhibition credit, so a typo silently produced a second artist. The new one cannot.

Run: `pnpm test`
Expected: FAIL — `buildArtistDirectory` still takes two arguments and reads name strings.

- [ ] **Step 5: Rewrite the artist directory**

Replace the body of `buildArtistDirectory` in `app/utils/artistDirectory.ts`:

```ts
import type { ArtistRecord, ArtistRecordLink, DirectoryArtist, ExhibitionArtistLink } from '~/types/content'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { displayArtistName } from '~/utils/resolveExhibitions'
import { formatArtistName, getArtistFamilyLetter } from '~/utils/artistNames'

export const buildArtistDirectory = (
  artists: ArtistRecord[],
  exhibitions: ResolvedExhibition[],
  junction: ExhibitionArtistLink[]
): DirectoryArtist[] => {
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]))

  const recordsByArtist = new Map<string, ArtistRecordLink[]>()
  const yearsByArtist = new Map<string, Set<string>>()

  for (const link of junction) {
    const exhibition = exhibitionById.get(link.exhibition_id)
    if (!exhibition) continue

    const records = recordsByArtist.get(link.artist_id) ?? []
    if (!records.some((record) => record.id === exhibition.id)) {
      records.push({
        id: exhibition.id,
        title: exhibition.title,
        venue: exhibition.venue,
        city: exhibition.city,
        href: `/exhibitions/${exhibition.slug}/`
      })
    }
    recordsByArtist.set(link.artist_id, records)

    const years = yearsByArtist.get(link.artist_id) ?? new Set<string>()
    years.add(exhibition.start_date.slice(0, 4))
    yearsByArtist.set(link.artist_id, years)
  }

  return artists.map((artist) => {
    const records = recordsByArtist.get(artist.id) ?? []
    const name = displayArtistName(artist)

    return {
      id: artist.id,
      slug: artist.slug,
      name,
      location: [...new Set(records.map((record) => record.city))].join(' · '),
      years: [...(yearsByArtist.get(artist.id) ?? [])].sort().join(' · '),
      record_count: records.length,
      displayName: formatArtistName(name, artist.slug),
      records,
      letter: getArtistFamilyLetter(artist.slug, name)
    }
  }).sort((left, right) => {
    if (left.letter !== right.letter) return left.letter.localeCompare(right.letter)
    return left.displayName.localeCompare(right.displayName)
  })
}
```

`normalizeArtistName`, `slugifyArtistName`, `splitArtistCredit` and the second synthesis loop are all deleted. Artists now exist only if they have a record in `artists.json`.

- [ ] **Step 6: Update the directory call site**

In `app/pages/artists/index.vue` line 7, the composable now needs the junction. Change:

```ts
const { artists, locationExhibitions } = useArchiveData()
```

to:

```ts
import exhibitionsArtists from '~/data/exhibitions_artists.json'
import type { ExhibitionArtistLink } from '~/types/content'

const { artists, locationExhibitions } = useArchiveData()
```

and line 14:

```ts
const directoryArtists = computed(() =>
  buildArtistDirectory(artists.value, locationExhibitions.value, exhibitionsArtists as ExhibitionArtistLink[]))
```

- [ ] **Step 7: Remove the superseded types**

Delete `Location`, `Venue`, `Artist`, `Exhibition` and `LocationExhibition` from `app/types/content.ts`. Keep `LocationTranslation`, `ArtistRecordLink`, `DirectoryArtist` and `Sponsor`. Update `DirectoryArtist` to no longer extend the deleted `Artist`:

```ts
export interface DirectoryArtist {
  id: string
  slug: string
  name: string
  location: string
  years: string
  record_count: number
  displayName: string
  records: ArtistRecordLink[]
  letter: string
}
```

- [ ] **Step 8: Full verification**

Run: `pnpm test && pnpm check:data && pnpm check:tailwind && pnpm check:i18n && pnpm check:directories && pnpm check:artists && pnpm check:links && pnpm check:locations && pnpm check:mobile && pnpm check:preloader && pnpm build`
Expected: 23 unit tests PASS, all nine checks PASS, build succeeds.

If `check:artists` fails, the directory shape changed. Compare one artist's resolved object against the previous git revision before adjusting anything.

- [ ] **Step 9: Manual check in both locales**

Run: `pnpm dev`, then visit `/`, `/locations/`, `/locations/parkschloessl-spittal-drau`, `/exhibitions/`, `/artists/`, and each again under `/en/`. Confirm records render, German text appears, and the artist directory shows the same names as before.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Flip the frontend onto the Directus-aligned collections"
```

---

## Task 8: Route rename and check scripts

**Files:**
- Move: `app/pages/locations/index.vue` → `app/pages/venues/index.vue`, `app/pages/locations/[slug].vue` → `app/pages/venues/[slug].vue`
- Modify: `nuxt.config.ts`, `app/composables/useArchiveData.ts`, and all five check scripts

**Interfaces:**
- Consumes: Task 7's composable
- Produces: `/venues/` routes; `venues` as the only binding name

- [ ] **Step 1: Move the pages**

```bash
mkdir -p app/pages/venues
git mv app/pages/locations/index.vue app/pages/venues/index.vue
git mv "app/pages/locations/[slug].vue" "app/pages/venues/[slug].vue"
rmdir app/pages/locations
```

- [ ] **Step 2: Update internal links**

Run `grep -rn "'/locations/" app/ i18n/` and change every occurrence to `'/venues/`. Verified hits, five files: `app/components/ArchiveHeader.vue`, `app/components/ArchiveFooterMenu.vue`, `app/pages/index.vue`, and the two pages moved in Step 1 (`app/pages/venues/index.vue`, `app/pages/venues/[slug].vue`).

Visible labels stay "Galleries" / "Galerien". Do not touch `i18n/locales/*.json` label values.

- [ ] **Step 3: Add redirects**

In `nuxt.config.ts`, inside `routeRules`, add:

```ts
'/locations': { redirect: { to: '/venues', statusCode: 301 } },
'/locations/**': { redirect: { to: '/venues/**', statusCode: 301 } },
```

If `routeRules` does not exist, add it as a top-level key of `defineNuxtConfig`.

- [ ] **Step 4: Drop the composable alias**

In `app/composables/useArchiveData.ts`, delete the `locations: venuesForLocale,` line added in Task 7, leaving only `venues`.

- [ ] **Step 5: Update every consumer binding**

Run `grep -rln "locations," app/pages app/components` and change each `const { locations, … } = useArchiveData()` to `const { venues, … } = useArchiveData()`, renaming the local usages. Affected: `app/pages/index.vue`, `app/pages/venues/index.vue`, `app/pages/venues/[slug].vue`, `app/pages/exhibitions/[slug].vue`.

- [ ] **Step 6: Update the five check scripts**

| Script | Change |
|---|---|
| `check-directory-routes.mjs` | `pages/locations/[slug].vue` → `pages/venues/[slug].vue`; `pages/locations/index.vue` → `pages/venues/index.vue`; `locations.json` → `venues.json` |
| `check-mobile-density.mjs` | `pages/locations/[slug].vue` → `pages/venues/[slug].vue` |
| `check-archive-text-links.mjs` | both page paths, and the `'/locations/\'` link assertion → `'/venues/\'` |
| `check-location-exhibition-browser.mjs` | `pages/locations/[slug].vue` → `pages/venues/[slug].vue` |
| `check-artist-directory-modal.mjs` | `locationExhibitions` → keep as-is; the binding name is unchanged in Task 7 |

- [ ] **Step 7: Full verification**

Run: `pnpm check:data && pnpm check:tailwind && pnpm check:i18n && pnpm check:directories && pnpm check:artists && pnpm check:links && pnpm check:locations && pnpm check:mobile && pnpm check:preloader && pnpm build`
Expected: all nine PASS.

- [ ] **Step 8: Verify the redirect**

Run: `pnpm dev`, then visit `/locations/parkschloessl-spittal-drau`.
Expected: redirects to `/venues/parkschloessl-spittal-drau`, which renders.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Rename the location routes to /venues/ with redirects"
```

---

## Task 9: Documentation

**Files:**
- Modify: `AGENTS.md`, `README.md`

**Interfaces:**
- Consumes: the collection names from Tasks 2–4, `VISIBLE_STATUSES` from Task 5, `pickTranslation` from Task 5, and the `/venues/` routes from Task 7
- Produces: nothing consumed by code. This task closes the loop between the running system and the always-loaded guidance, so the two stop contradicting each other.

- [ ] **Step 1: Amend the translation rule**

In `AGENTS.md`, replace the sentence beginning *"English is the canonical content source. Store German translations for record fields in ID-keyed overlay files under `app/data/translations/de/`"* with:

```markdown
Each record carries a `translations[]` array of `{ languages_code, … }` entries. In the frontend all languages are equal: the active locale is selected by `pickTranslation`, which falls back `locale → en → first available`. In the backend English is first — it is the language entered into Directus, and every other translation is derived from it. That is an authoring convention, not a privileged field in the data shape.
```

- [ ] **Step 2: Record the collection model**

In `AGENTS.md`'s Data Rules section, replace the "Recommended initial files" guidance with:

```markdown
Local JSON mirrors the Directus collections in `../_Plans/exhibitions-plan.md` §2: `locations.json` (cities, with the coordinates radius search needs), `venues.json` (buildings, each with a `type` and a `location_id`), `artists.json`, `exhibitions.json`, and the `exhibitions_artists.json` junction. Joins happen in `useArchiveData()`, never in components.

`status` (`draft` | `published`) records provenance, not visibility. Draft records render; the gate is the single `VISIBLE_STATUSES` constant in `app/utils/contentStatus.ts`. Never add a status conditional to a component.
```

- [ ] **Step 3: Update the README route reference**

In `README.md`, change any `/locations/` route mention to `/venues/`, and add `check:data` to the documented check scripts.

- [ ] **Step 4: Verify and commit**

Run: `pnpm check:i18n && pnpm build`
Expected: PASS.

```bash
git add AGENTS.md README.md
git commit -m "Document the Directus-aligned collections and the status field"
```

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: collections → Tasks 2–4; `status` → Tasks 2–4 (data) and 6 (gate); resolver layer → Tasks 6–7; translations inline → Tasks 4 and 7; geo → Task 2; migration approach → the `v2/` staging structure; routes → Task 8; check scripts → Task 8; error handling → the `throw` sites in Tasks 6–7, each with a unit test asserting the message; verification → `pnpm test`, the new `check:data`, and the existing eight.

**Placeholder scan.** No TBD/TODO. Every code step carries the actual code. The two places that say "copy from the source file" (Task 2 Step 4, venue descriptions) are deliberate: inventing that text is prohibited by the spec.

**Type consistency.** `pickTranslation` returns `Record<string, string | string[]>` and is consumed with casts in both resolvers. `displayArtistName` is defined once in `resolveExhibitions.ts` and imported by `artistDirectory.ts`. `buildArtistDirectory` takes three arguments in its test (Task 7 Step 4), its definition (Task 7 Step 5) and its call site (Task 7 Step 6). `ResolvedExhibition` keeps every field the current `LocationExhibition` had, which is what lets components stay untouched.

**Test coverage.** 23 unit tests across five files, covering only the pure utilities: the status gate, the translation fallback chain including empty-string fallthrough, both resolvers' joins and their dangling-reference throws, and the junction-based artist directory. Every `throw` site in the plan has a test asserting its message, because a build-time error whose text is wrong is nearly as unhelpful as no error.

**What unit tests deliberately do not cover.** Components, pages and anything needing the Nuxt runtime. Those stay with the eight `check:*` scripts and the manual pass in Task 7 Step 9, which is the right division: Vitest proves the resolvers behave, the check scripts prove the rendered contracts hold, and neither duplicates the other.
