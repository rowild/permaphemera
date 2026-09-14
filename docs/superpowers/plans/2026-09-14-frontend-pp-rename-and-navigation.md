# Frontend Rename to the pp_ Shape and Data-Driven Navigation Implementation Plan (part 2 of 2: frontend)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the frontend JSON, types, resolvers and checks mirror the Directus collections built in part 1 (persons, roles, participations, sponsors, navigations, `pp_` names), and render the header and footer menus from navigation data instead of hard-coded links.

**Architecture:** The resolvers stay the adapter: raw JSON and raw record types change, the shapes components receive (`ResolvedVenue`, `ResolvedExhibition`, `DirectoryArtist`) do not. A one-off migration script rewrites the JSON files once and is deleted. A new `resolveNavigation` + `useSiteNavigation()` feed `ArchiveHeader.vue` and `ArchiveFooterMenu.vue`.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Vitest (`test/unit/**`), the nine `scripts/check-*.mjs` assertion scripts, pnpm, Node 24 (`nvm use` first). No Directus at runtime.

**Spec:** `docs/superpowers/specs/2026-09-14-directus-conventions-schema-design.md` (sections "Persons, roles, participations", "Fields", "Seeded data", "Frontend"). Part 1 is `docs/superpowers/plans/2026-09-14-directus-schema-by-convention.md`; it must be complete (the live Directus carries the `pp_` schema) before this plan starts, because Task 1 mirrors that schema.

## Global Constraints

- Run every command from `frontend/` on the Node version in `.nvmrc` (`nvm use` first).
- Component-facing shapes do not change: `ResolvedVenue`, `ResolvedExhibition`, `DirectoryArtist`, `ArtistRecordLink`. If a page or component needs editing to consume renamed data, the resolver is wrong. Exceptions in this plan: the two pages that import the junction JSON directly (they switch to the composable), `ArchiveSponsorMark.vue` (reads `title`), and the header/footer (they switch to navigation data).
- JSON files are named after the Directus collections: `pp_<name>.json`. Keys are the Directus field names. Translations stay inline as `translations[]`. Every translated field also exists on the record as the English original and equals the `en` entry.
- `status` values: `published`, `draft`, `archived`. `VISIBLE_STATUSES` stays `['published', 'draft']`.
- Never write `text-[…]`; every font size is a named `@theme` step. Never add `<style scoped>`. Structural marker groups keep inner spaces: `[ site-shell ]`.
- The nine check scripts (`check:tailwind check:i18n check:directories check:artists check:links check:venues check:mobile check:preloader check:public`) plus `check:data` and `pnpm test` must pass before every commit **except** where a task says a check is red on purpose: after Task 1, `pnpm test` and the site are red until Task 3 completes (types and resolvers catch up with the data). Task 1 itself commits with `check:data` green.
- Commit with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File Structure

| Path | Change |
|---|---|
| `app/data/pp_locations.json`, `pp_venues.json`, `pp_persons.json`, `pp_roles.json`, `pp_mm__persons_roles.json`, `pp_exhibitions.json`, `pp_exhibition_participations.json`, `pp_exhibition_statements.json`, `pp_sponsors.json`, `pp_navigations.json`, `pp_navigation_items.json`, `pp_mm__exhibitions_venues.json`, `pp_mm__exhibitions_sponsors.json`, `pp_mm__persons_venues.json`, `pp_mm__persons_sponsors.json`, `pp_mm__locations_sponsors.json`, `pp_mm__sponsors_venues.json` | created by the migration; old files deleted |
| `scripts/check-data-integrity.mjs` | rewritten for the new files and rules |
| `scripts/check-i18n-privacy.mjs`, `check-directory-routes.mjs`, `check-mobile-density.mjs`, `publish-tour.mjs` | file names, key names, navigation assertions |
| `app/types/content.ts` | raw record types renamed; new person/role/participation/sponsor/navigation types |
| `app/utils/resolveVenues.ts`, `resolveExhibitions.ts`, `artistDirectory.ts` | new keys, participations + roles |
| `app/utils/resolveNavigation.ts`, `app/composables/useSiteNavigation.ts` | new |
| `app/composables/useArchiveData.ts` | new imports, `artistDirectory` computed |
| `app/pages/index.vue`, `app/pages/artists/index.vue` | drop the direct junction import |
| `app/components/ArchiveSponsorMark.vue` | `title` |
| `app/components/ArchiveHeader.vue`, `ArchiveFooterMenu.vue` | render from `useSiteNavigation()` |
| `i18n/locales/en.json`, `de.json` | remove keys that only served as menu labels |
| `test/unit/resolveVenues.spec.ts`, `resolveExhibitions.spec.ts`, `artistDirectory.spec.ts`, `resolveNavigation.spec.ts` | updated / new |
| `AGENTS.md`, `README.md` (frontend), `_Plans/exhibitions-plan.md` tracker | docs |

---

### Task 1: Data contract first, then migrate the JSON

**Files:**
- Rewrite: `scripts/check-data-integrity.mjs`
- Create then delete: `scripts/migrate-to-pp.mjs`
- Create: the 17 `app/data/pp_*.json` files; Delete: `app/data/{locations,venues,artists,exhibitions,exhibitions_artists,exhibition_statements,sponsors}.json`
- Modify: `scripts/check-i18n-privacy.mjs` (collection names, `location_id` → `location`), `scripts/check-directory-routes.mjs` (file names, `name` → `title`, `location_id` → `location`, `city_name` → `title`), `scripts/publish-tour.mjs` (file name)

**Interfaces:**
- Produces: JSON files in the shape below. Record ids are UUIDs, the same shape Directus assigns, so an import keeps them. Junction rows keep integer ids. Slugs stay readable and are the public identifier.

- [ ] **Step 1: Rewrite `check-data-integrity.mjs` (the failing test)**

```js
// scripts/check-data-integrity.mjs
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = async (path) => JSON.parse(await readFile(resolve(projectRoot, path), 'utf8'))
const data = async (name) => readJson(`app/data/${name}.json`)

const [locations, venues, persons, roles, personRoles, exhibitions, participations, statements, sponsors, navigations, navigationItems] = await Promise.all([
  data('pp_locations'), data('pp_venues'), data('pp_persons'), data('pp_roles'), data('pp_mm__persons_roles'),
  data('pp_exhibitions'), data('pp_exhibition_participations'), data('pp_exhibition_statements'), data('pp_sponsors'),
  data('pp_navigations'), data('pp_navigation_items')
])
const junctions = await Promise.all(['pp_mm__exhibitions_venues', 'pp_mm__exhibitions_sponsors', 'pp_mm__persons_venues', 'pp_mm__persons_sponsors', 'pp_mm__locations_sponsors', 'pp_mm__sponsors_venues'].map(data))

const ids = (records) => new Set(records.map((record) => record.id))
const locationIds = ids(locations), venueIds = ids(venues), personIds = ids(persons), roleIds = ids(roles)
const exhibitionIds = ids(exhibitions), navigationIds = ids(navigations), itemIds = ids(navigationItems)
const roleArtist = roles.find((role) => role.slug === 'artist')?.id

const uniqueBy = (records, key) => new Set(records.map((record) => record[key])).size === records.length
const en = (record) => (record.translations ?? []).find((entry) => entry.languages_code === 'en')
const everyHasEnglish = (records) => records.every((record) => Boolean(en(record)))
const validStatus = (records) => records.every((record) => ['draft', 'published', 'archived'].includes(record.status))
const norm = (value) => (value === '' || value === undefined ? null : value)
// English on the record must equal the `en` translation entry, field by field.
const englishMirrors = (records, fields) => records.every((record) => {
  const entry = en(record) ?? {}
  return fields.every((field) => JSON.stringify(norm(record[field])) === JSON.stringify(norm(entry[field])))
})
const rolesOf = (personId) => new Set(personRoles.filter((row) => row.persons_id === personId).map((row) => row.roles_id))

const checks = [
  ['locations count is 17', locations.length === 17],
  ['venues count is 36', venues.length === 36],
  ['persons count is 73', persons.length === 73],
  ['roles are artist and curator', roles.map((role) => role.slug).sort().join(',') === 'artist,curator'],
  ['exhibitions count is 13', exhibitions.length === 13],
  ['participations count is 15', participations.length === 15],
  ['sponsors count is 8', sponsors.length === 8],
  ['navigations are main and footer', navigations.map((nav) => nav.key).sort().join(',') === 'footer,main'],
  ['navigation items count is 18', navigationItems.length === 18],

  ['every location has coordinates inside Austria', locations.every((location) =>
    location.latitude > 46 && location.latitude < 49 && location.longitude > 9 && location.longitude < 17)],

  ['venue.location all resolve', venues.every((venue) => locationIds.has(venue.location))],
  ['exhibition.primary_venue all resolve', exhibitions.every((exhibition) => venueIds.has(exhibition.primary_venue))],
  ['participation.exhibition all resolve', participations.every((row) => exhibitionIds.has(row.exhibition))],
  ['participation.person all resolve', participations.every((row) => personIds.has(row.person))],
  ['participation.role all resolve', participations.every((row) => roleIds.has(row.role))],
  ['participation role is one of the person\'s roles', participations.every((row) => rolesOf(row.person).has(row.role))],
  ['every person has at least one role', persons.every((person) => rolesOf(person.id).size > 0)],
  ['person-role rows resolve both ends', personRoles.every((row) => personIds.has(row.persons_id) && roleIds.has(row.roles_id))],
  ['every exhibition has at least one artist participation', exhibitions.every((exhibition) =>
    participations.some((row) => row.exhibition === exhibition.id && row.role === roleArtist))],
  ['statement.exhibition all resolve', statements.every((row) => exhibitionIds.has(row.exhibition))],
  ['statement.person all resolve', statements.every((row) => personIds.has(row.person))],
  ['every statement is by a participant of that exhibition', statements.every((row) =>
    participations.some((link) => link.exhibition === row.exhibition && link.person === row.person))],
  ['statement ids unique', uniqueBy(statements, 'id')],
  ['participation ids unique', uniqueBy(participations, 'id')],
  ['empty junctions are arrays', junctions.every(Array.isArray)],

  ['navigation item.navigation all resolve', navigationItems.every((item) => navigationIds.has(item.navigation))],
  ['navigation item.parent resolves and stays in the same navigation', navigationItems.every((item) => {
    if (item.parent === null) return true
    const parent = navigationItems.find((candidate) => candidate.id === item.parent)
    return Boolean(parent) && parent.navigation === item.navigation
  })],
  ['navigation item keys unique per navigation', navigations.every((nav) =>
    uniqueBy(navigationItems.filter((item) => item.navigation === nav.id), 'key'))],
  ['navigation item kind matches its path/url', navigationItems.every((item) => {
    if (item.kind === 'url') return typeof item.url === 'string' && item.url.length > 0 && item.path === null
    if (item.kind === 'action') return typeof item.path === 'string' && item.path.length > 0 && item.url === null
    return item.kind === 'route' && item.url === null && (item.path === null || item.path.startsWith('/'))
  })],
  ['navigation item ids unique', itemIds.size === navigationItems.length],

  ['every venue has a known type', venues.every((venue) =>
    ['gallery', 'museum', 'kunsthalle', 'art_cafe', 'open_air', 'forum'].includes(venue.type))],

  ['location slugs unique', uniqueBy(locations, 'slug')],
  ['venue slugs unique', uniqueBy(venues, 'slug')],
  ['person slugs unique', uniqueBy(persons, 'slug')],
  ['exhibition slugs unique', uniqueBy(exhibitions, 'slug')],
  ['sponsor slugs unique', uniqueBy(sponsors, 'slug')],

  ['every location has an en translation', everyHasEnglish(locations)],
  ['every venue has an en translation', everyHasEnglish(venues)],
  ['every exhibition has an en translation', everyHasEnglish(exhibitions)],
  ['every role has an en translation', everyHasEnglish(roles)],
  ['every sponsor has an en translation', everyHasEnglish(sponsors)],
  ['every navigation item has an en translation', everyHasEnglish(navigationItems)],
  ['persons carry no translations', persons.every((person) => person.translations === undefined)],

  ['locations: English on the record equals the en entry', englishMirrors(locations, ['description'])],
  ['venues: English on the record equals the en entry', englishMirrors(venues, ['description', 'lede', 'about', 'image_caption', 'coordinate_label'])],
  ['exhibitions: English on the record equals the en entry', englishMirrors(exhibitions, ['title', 'summary', 'description', 'date_range', 'opening_hours', 'vernissage', 'image_alt', 'medium'])],
  ['statements: English on the record equals the en entry', englishMirrors(statements, ['prompt', 'statement'])],
  ['roles: English on the record equals the en entry', englishMirrors(roles, ['title'])],
  ['sponsors: English on the record equals the en entry', englishMirrors(sponsors, ['description'])],
  ['navigation items: English on the record equals the en entry', englishMirrors(navigationItems, ['title'])],

  ['all collections have a valid status', [locations, venues, persons, roles, exhibitions, participations, statements, sponsors, navigations, navigationItems].every(validStatus)],
  ['no person keeps dropped fields', persons.every((person) => ['biography', 'birth_year', 'death_year', 'nationality', 'instagram_handle', 'profile_image', 'artist_name', 'record_count'].every((field) => person[field] === undefined))],
  ['no exhibition keeps a manual featured flag', exhibitions.every((exhibition) => exhibition.featured === undefined)],
  ['no old key survives', [...venues, ...exhibitions, ...participations, ...statements].every((record) =>
    ['location_id', 'primary_venue_id', 'exhibition_id', 'artist_id', 'name', 'city_name'].every((key) => record[key] === undefined))]
]

const failures = checks.filter(([, passed]) => !passed)
if (failures.length) {
  console.error('Data integrity failed:')
  for (const [label] of failures) console.error(`  - ${label}`)
  process.exitCode = 1
} else {
  console.log(`Data integrity OK: ${checks.length} assertions across 17 collections.`)
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm check:data`
Expected: FAIL with `ENOENT … pp_locations.json`.

- [ ] **Step 3: Write the one-off migration script**

```js
// scripts/migrate-to-pp.mjs  — ONE-OFF. Delete after the JSON is committed.
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data')
const read = async (name) => JSON.parse(await readFile(resolve(root, `${name}.json`), 'utf8'))
const write = (name, rows) => writeFile(resolve(root, `${name}.json`), JSON.stringify(rows, null, 2) + '\n')
const en = (record) => (record.translations ?? []).find((entry) => entry.languages_code === 'en') ?? {}
const norm = (value) => (value === '' || value === undefined ? null : value)
const slugify = (value) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const [locations, venues, artists, exhibitions, junction, statements, sponsors] = await Promise.all(
  ['locations', 'venues', 'artists', 'exhibitions', 'exhibitions_artists', 'exhibition_statements', 'sponsors'].map(read))

// locations: city_name -> title; English description on the record
await write('pp_locations', locations.map(({ city_name, ...rest }) => ({
  id: rest.id, slug: rest.slug, title: city_name, postal_code: rest.postal_code, state: rest.state, country: rest.country,
  latitude: rest.latitude, longitude: rest.longitude, description: norm(en(rest).description), status: rest.status, translations: rest.translations
})))

// venues: name -> title, location_id -> location; English texts on the record
await write('pp_venues', venues.map(({ name, location_id, translations, ...rest }) => {
  const e = en({ translations })
  return {
    id: rest.id, slug: rest.slug, location: location_id, title: name, type: rest.type, address: rest.address,
    website_url: rest.website_url ?? null, latitude: rest.latitude ?? null, longitude: rest.longitude ?? null,
    image: rest.image, image_alt: rest.image_alt, hero_image: rest.hero_image ?? null, hero_image_alt: rest.hero_image_alt ?? null,
    archive_number: rest.archive_number, featured: rest.featured,
    description: norm(e.description), lede: norm(e.lede), about: norm(e.about), image_caption: norm(e.image_caption), coordinate_label: norm(e.coordinate_label),
    status: rest.status, translations
  }
}))

// persons: from artists, minimal
await write('pp_persons', artists.map((a) => ({
  id: a.id, slug: a.slug, first_name: a.first_name, last_name: a.last_name, middle_initial: a.middle_initial ?? null,
  display_name: a.artist_name ?? null, website_url: a.website_url ?? null, status: a.status
})))

// roles + person roles
await write('pp_roles', [
  { id: 'role-artist', slug: 'artist', title: 'Artist', status: 'published', sort: 1, translations: [{ languages_code: 'en', title: 'Artist' }, { languages_code: 'de', title: 'Künstler:in' }] },
  { id: 'role-curator', slug: 'curator', title: 'Curator', status: 'published', sort: 2, translations: [{ languages_code: 'en', title: 'Curator' }, { languages_code: 'de', title: 'Kurator:in' }] }
])
await write('pp_mm__persons_roles', artists.map((a, i) => ({ id: i + 1, persons_id: a.id, roles_id: 'role-artist', sort: 0 })))

// exhibitions: primary_venue_id -> primary_venue; English texts on the record
await write('pp_exhibitions', exhibitions.map(({ primary_venue_id, translations, ...rest }) => {
  const e = en({ translations })
  return {
    id: rest.id, slug: rest.slug, primary_venue: primary_venue_id, start_date: rest.start_date, end_date: rest.end_date, is_permanent: rest.is_permanent,
    image: rest.image, image_alt: norm(e.image_alt) ?? rest.image_alt, title: norm(e.title), summary: norm(e.summary), description: norm(e.description),
    date_range: norm(e.date_range), opening_hours: norm(e.opening_hours) ?? rest.opening_hours, vernissage: norm(e.vernissage) ?? rest.vernissage,
    medium: norm(e.medium) ?? norm(rest.medium), source_pdf: rest.source_pdf ?? null, tour: rest.tour ?? null, tour_status: rest.tour_status, tour_available_from: rest.tour_available_from ?? null,
    status: rest.status, translations
  }
}))

// participations: the old junction rows, all as artists
await write('pp_exhibition_participations', junction
  .sort((a, b) => a.id - b.id)
  .map((row, i) => ({ id: `participation-${i + 1}`, exhibition: row.exhibition_id, person: row.artist_id, role: 'role-artist', sort: row.sort, status: 'published' })))

// statements (file is empty today; keep the shape rule)
await write('pp_exhibition_statements', statements.map(({ exhibition_id, artist_id, translations, ...rest }) => ({
  id: rest.id, exhibition: exhibition_id, person: artist_id, sort: rest.sort, prompt: norm(en({ translations }).prompt), statement: norm(en({ translations }).statement), status: rest.status, translations
})))

// sponsors
await write('pp_sponsors', sponsors.map((s, i) => ({
  id: s.id, slug: slugify(s.name), title: s.name, website_url: null, logo: null, description: null, status: 'published', sort: i + 1,
  translations: [{ languages_code: 'en', description: '' }]
})))

// navigations — the same rows part 1 seeded into Directus
const item = (nav, key, enTitle, deTitle, o = {}) => ({
  id: `nav-${nav}-${key}`, navigation: `nav-${nav}`, parent: o.parent ? `nav-${nav}-${o.parent}` : null, key, title: enTitle,
  kind: o.kind ?? 'route', path: o.path ?? null, url: null, target: '_self', sort: o.sort ?? 0, status: 'published',
  translations: [{ languages_code: 'en', title: enTitle }, { languages_code: 'de', title: deTitle }]
})
await write('pp_navigations', [
  { id: 'nav-main', key: 'main', title: 'Main navigation', status: 'published', sort: 1 },
  { id: 'nav-footer', key: 'footer', title: 'Footer navigation', status: 'published', sort: 2 }
])
await write('pp_navigation_items', [
  item('main', 'exhibitions', 'Exhibitions', 'Ausstellungen', { path: '/exhibitions/', sort: 1 }),
  item('main', 'artists', 'Artists', 'Künstler:innen', { path: '/artists/', sort: 2 }),
  item('main', 'galleries', 'Galleries', 'Galerien', { path: '/venues/', sort: 3 }),
  item('main', 'about', 'About the Project', 'Über das Projekt', { path: '/about/', sort: 4 }),
  item('footer', 'explore', 'Explore', 'Entdecken', { sort: 1 }),
  item('footer', 'information', 'Information', 'Information', { sort: 2 }),
  item('footer', 'legal', 'Legal', 'Rechtliches', { sort: 3 }),
  item('footer', 'exhibitions', 'Exhibitions', 'Ausstellungen', { path: '/exhibitions/', parent: 'explore', sort: 1 }),
  item('footer', 'artists', 'Artists', 'Künstler:innen', { path: '/artists/', parent: 'explore', sort: 2 }),
  item('footer', 'galleries', 'Galleries', 'Galerien', { path: '/venues/', parent: 'explore', sort: 3 }),
  item('footer', 'about', 'About the Project', 'Über das Projekt', { path: '/about/', parent: 'information', sort: 1 }),
  item('footer', 'how-it-works', 'How it works', 'Wie es funktioniert', { path: '/how-it-works/', parent: 'information', sort: 2 }),
  item('footer', 'contact', 'Contact', 'Kontakt', { path: '/contact/', parent: 'information', sort: 3 }),
  item('footer', 'imprint', 'Imprint', 'Impressum', { path: '/imprint/', parent: 'legal', sort: 1 }),
  item('footer', 'privacy', 'Privacy Policy', 'Datenschutzerklärung', { path: '/privacy/', parent: 'legal', sort: 2 }),
  item('footer', 'terms', 'Terms of Use', 'Nutzungsbedingungen', { path: '/terms/', parent: 'legal', sort: 3 }),
  item('footer', 'accessibility', 'Accessibility', 'Barrierefreiheit', { path: '/accessibility/', parent: 'legal', sort: 4 }),
  item('footer', 'cookies', 'Cookie settings', 'Cookie-Einstellungen', { kind: 'action', path: 'cookie-settings', parent: 'legal', sort: 5 })
])

// empty junctions
for (const name of ['pp_mm__exhibitions_venues', 'pp_mm__exhibitions_sponsors', 'pp_mm__persons_venues', 'pp_mm__persons_sponsors', 'pp_mm__locations_sponsors', 'pp_mm__sponsors_venues']) await write(name, [])

// remove the old files
for (const name of ['locations', 'venues', 'artists', 'exhibitions', 'exhibitions_artists', 'exhibition_statements', 'sponsors']) await unlink(resolve(root, `${name}.json`))
console.log('migrated')
```

- [ ] **Step 4: Run the migration, then the data check**

Run: `node scripts/migrate-to-pp.mjs && pnpm check:data`
Expected: `migrated` then `Data integrity OK: 55 assertions across 17 collections.` If `venues: English on the record equals the en entry` fails, inspect a venue whose `en.about` is `[]` versus `null`: `norm` treats `''` and `undefined` as null but keeps `[]`; adjust the record value to match the entry, never the other way round.

- [ ] **Step 5: Point the other scripts at the new names**

In `scripts/check-i18n-privacy.mjs`: `['exhibitions', 'venues', 'locations']` → `['pp_exhibitions', 'pp_venues', 'pp_locations']`; in the `immutableField` list replace `'location_id'` with `'location'`.

In `scripts/check-directory-routes.mjs`: `app/data/locations.json` → `app/data/pp_locations.json`, `venues.json` → `pp_venues.json`, `exhibitions.json` → `pp_exhibitions.json`; `gallery.location_id` → `gallery.location` (two places); `['id', 'slug', 'name', 'image']` → `['id', 'slug', 'title', 'image']`; `['city_name', 'postal_code', 'state', 'country']` → `['title', 'postal_code', 'state', 'country']`. Leave the header/footer loop at the end for Task 5.

In `scripts/publish-tour.mjs`: every `exhibitions.json` → `pp_exhibitions.json` (five occurrences: the path constant and four messages).

Run: `pnpm check:i18n && pnpm check:directories && pnpm check:public && pnpm tour:publish --help >/dev/null 2>&1; echo tour-script-loads:$?`
Expected: both checks pass; `check:public` reports the asset paths it checked; the tour script loads (exit code 0 or its own usage exit, not a module error).

- [ ] **Step 6: Delete the migration script and commit**

```bash
rm scripts/migrate-to-pp.mjs
git add -A app/data scripts/check-data-integrity.mjs scripts/check-i18n-privacy.mjs scripts/check-directory-routes.mjs scripts/publish-tour.mjs
git commit -m "Migrate the frontend JSON to the pp_ collections

Renames files and keys to the Directus schema of part 1, splits artists
into persons, roles and participations, copies the English original of
every translated field onto its record, adds sponsor fields and the two
navigations, and rewrites check-data-integrity for the new contract.
Types and resolvers follow in the next commits; pnpm test is red until then.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Raw record types

**Files:**
- Rewrite: `app/types/content.ts`

**Interfaces:**
- Produces the types every later task imports. Component-facing types (`ArtistRecordLink`, `DirectoryArtist`) keep their names and shapes.

- [ ] **Step 1: Rewrite the file**

```ts
// app/types/content.ts
import type { TourStatus } from '~/utils/tourAccess'

// ---- component-facing shapes (unchanged) -----------------------------------

export interface ArtistRecordLink {
  id: string
  title: string
  venue: string
  city: string
  href: string
}

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

// ---- raw records: mirror the Directus pp_ collections 1:1 ------------------

export type ContentStatus = 'draft' | 'published' | 'archived'

export type VenueType = 'gallery' | 'museum' | 'kunsthalle' | 'art_cafe' | 'open_air' | 'forum'

export interface TranslationEntry {
  languages_code: string
  [field: string]: string | string[] | null
}

/** pp_locations — the town. */
export interface LocationRecord {
  id: string
  slug: string
  title: string
  postal_code: string
  state: string
  country: string
  latitude: number
  longitude: number
  description: string | null
  status: ContentStatus
  translations: TranslationEntry[]
}

/** pp_venues — the building. `location` → pp_locations.id */
export interface VenueRecord {
  id: string
  slug: string
  location: string
  title: string
  type: VenueType
  address: string
  website_url: string | null
  latitude: number | null
  longitude: number | null
  image: string
  image_alt: string
  hero_image: string | null
  hero_image_alt: string | null
  archive_number: string
  featured: boolean
  description: string | null
  lede: string | null
  about: string[] | null
  image_caption: string | null
  coordinate_label: string | null
  status: ContentStatus
  translations: TranslationEntry[]
}

/** pp_persons — people and collectives. No translations, no biography (owner decision 2026-09-14). */
export interface PersonRecord {
  id: string
  slug: string
  first_name: string
  last_name: string
  middle_initial: string | null
  /** Pseudonym or collective name; shown instead of first + last when set. */
  display_name: string | null
  website_url: string | null
  status: ContentStatus
}

/** pp_roles — what a person can be: artist, curator, … */
export interface RoleRecord {
  id: string
  slug: string
  title: string
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

/** pp_mm__persons_roles */
export interface PersonRoleLink {
  id: number
  persons_id: string
  roles_id: string
  sort: number
}

/** pp_exhibition_participations — one person in one function on one show. */
export interface ParticipationRecord {
  id: string
  exhibition: string
  person: string
  role: string
  sort: number
  status: ContentStatus
}

/** pp_exhibitions. `primary_venue` → pp_venues.id */
export interface ExhibitionRecord {
  id: string
  slug: string
  primary_venue: string
  start_date: string
  end_date: string
  is_permanent: boolean
  image: string
  image_alt: string
  title: string
  summary: string | null
  description: string | null
  date_range: string | null
  opening_hours: string
  vernissage: string
  medium: string | null
  source_pdf: string | null
  /** Root-relative folder of the exported 360° tour (`/media/tours/<id>/`), or null while none is published. */
  tour: string | null
  tour_status: TourStatus
  tour_available_from: string | null
  status: ContentStatus
  translations: TranslationEntry[]
}

/** pp_exhibition_statements — one person's words about one show. */
export interface ExhibitionStatement {
  id: string
  exhibition: string
  person: string
  sort: number
  prompt: string | null
  statement: string | null
  status: ContentStatus
  translations: TranslationEntry[]
}

/** pp_sponsors */
export interface SponsorRecord {
  id: string
  slug: string
  title: string
  website_url: string | null
  logo: string | null
  description: string | null
  status: ContentStatus
  sort: number
  translations: TranslationEntry[]
}

/** pp_navigations — one row per menu. */
export interface NavigationRecord {
  id: string
  key: string
  title: string
  status: ContentStatus
  sort: number
}

export type NavigationItemKind = 'route' | 'url' | 'action'

/** pp_navigation_items. `navigation` → pp_navigations.id, `parent` → pp_navigation_items.id */
export interface NavigationItemRecord {
  id: string
  navigation: string
  parent: string | null
  key: string
  title: string
  kind: NavigationItemKind
  path: string | null
  url: string | null
  target: '_self' | '_blank'
  sort: number
  status: ContentStatus
  translations: TranslationEntry[]
}
```

- [ ] **Step 2: Type-check only this file's consumers compile later; commit now**

Run: `pnpm check:types 2>&1 | grep -c "error TS"` — a non-zero count is expected (resolvers still use old names). Note the number; Task 3 brings it to 0.

```bash
git add app/types/content.ts
git commit -m "Type the pp_ records: persons, roles, participations, sponsors, navigations

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Resolvers, composable, pages — the site works again

**Files:**
- Modify: `app/utils/resolveVenues.ts`, `app/utils/resolveExhibitions.ts`, `app/utils/artistDirectory.ts`, `app/composables/useArchiveData.ts`
- Modify: `app/pages/index.vue`, `app/pages/artists/index.vue`, `app/components/ArchiveSponsorMark.vue`
- Modify: `test/unit/resolveVenues.spec.ts`, `test/unit/resolveExhibitions.spec.ts`, `test/unit/artistDirectory.spec.ts`

**Interfaces:**
- `resolveVenues(locations: LocationRecord[], venues: VenueRecord[], locale: string): ResolvedVenue[]` — unchanged output.
- `resolveExhibitions(exhibitions, venues, locations, participations: ParticipationRecord[], persons: PersonRecord[], roles: RoleRecord[], locale, statements = []): ResolvedExhibition[]` — output gains `curators: ResolvedExhibitionArtist[]`.
- `displayPersonName(person: PersonRecord): string` (was `displayArtistName`).
- `buildArtistDirectory(persons, exhibitions, participations, personRoles: PersonRoleLink[], roles): DirectoryArtist[]` — lists persons who hold the `artist` role.
- `useArchiveData()` returns `{ artists, venues, venueExhibitions, sponsors, artistDirectory }`.

- [ ] **Step 1: Update the venue test fixtures and add one assertion**

In `test/unit/resolveVenues.spec.ts` change the fixtures: location `city_name: 'Graz'` → `title: 'Graz'` and add `description: null`; venue `location_id: 'location-graz'` → `location: 'location-graz'`, `name: 'Neue Galerie Graz'` → `title: 'Neue Galerie Graz'`, and add `website_url: null, latitude: null, longitude: null, hero_image: null, hero_image_alt: null, description: 'English text', lede: null, about: null, image_caption: null, coordinate_label: null`. In the "throws" test rename `location_id` → `location`. In the dossier test set `lede` and `about` both on the record and in the `en` entry. Add:

```ts
  it('maps title to the component-facing name', () => {
    expect(resolveVenues(locations, [venue], 'en')[0].name).toBe('Neue Galerie Graz')
  })
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- resolveVenues`
Expected: FAIL on `name` (undefined) and on the location join.

- [ ] **Step 3: Update `resolveVenues.ts`**

Replace the import line with `import type { LocationRecord, VenueRecord } from '~/types/content'`, the signature's first parameter type with `LocationRecord[]`, and inside the map:

```ts
    const location = locationById.get(venue.location)
    if (!location) throw new Error(`pp_venues.json: ${venue.id} references unknown location ${venue.location}`)
    const text = pickTranslation(venue, locale)

    return {
      id: venue.id,
      slug: venue.slug,
      name: venue.title,
      type: venue.type,
      address: venue.address,
      website_url: venue.website_url ?? undefined,
      image: venue.image,
      image_alt: venue.image_alt,
      hero_image: venue.hero_image ?? undefined,
      hero_image_alt: venue.hero_image_alt ?? undefined,
      archive_number: venue.archive_number,
      featured: venue.featured,
      city: location.title,
      city_name: location.title,
      postal_code: location.postal_code,
      state: location.state,
      country: location.country,
      latitude: venue.latitude ?? undefined,
      longitude: venue.longitude ?? undefined,
      city_latitude: location.latitude,
      city_longitude: location.longitude,
      description: (text.description as string) || undefined,
      lede: (text.lede as string) || undefined,
      about: (text.about as string[]) || undefined,
      image_caption: (text.image_caption as string) || undefined,
      coordinate_label: (text.coordinate_label as string) || undefined
    }
```

Run: `pnpm test -- resolveVenues` → PASS.

- [ ] **Step 4: Rewrite the exhibition test fixtures**

Replace the fixture block at the top of `test/unit/resolveExhibitions.spec.ts`:

```ts
const locations = [{
  id: 'location-spittal', slug: 'spittal-an-der-drau', title: 'Spittal an der Drau',
  postal_code: '9800', state: 'Carinthia', country: 'Austria',
  latitude: 46.7967, longitude: 13.4989, description: null, status: 'published' as const,
  translations: [{ languages_code: 'en', description: '' }]
}]

const venues = [{
  id: 'venue-parkschloessl', slug: 'parkschloessl-spittal-drau', location: 'location-spittal',
  title: 'Parkschlössl', type: 'gallery' as const, address: '', website_url: null, latitude: null, longitude: null,
  image: '/v.webp', image_alt: '', hero_image: null, hero_image_alt: null,
  archive_number: '17', featured: true, description: null, lede: null, about: null, image_caption: null, coordinate_label: null,
  status: 'published' as const, translations: [{ languages_code: 'en', description: '' }]
}]

const persons = [
  { id: 'person-sylvia-campidell', slug: 'sylvia-campidell', first_name: 'Sylvia', last_name: 'Campidell',
    middle_initial: null, display_name: null, website_url: null, status: 'published' as const },
  { id: 'person-judith-maria-kulle', slug: 'judith-maria-kulle', first_name: 'Judith Maria', last_name: 'Kulle',
    middle_initial: null, display_name: null, website_url: null, status: 'published' as const },
  { id: 'person-curator', slug: 'cura-tor', first_name: 'Cura', last_name: 'Tor',
    middle_initial: null, display_name: null, website_url: null, status: 'published' as const }
]

const roles = [
  { id: 'role-artist', slug: 'artist', title: 'Artist', status: 'published' as const, sort: 1, translations: [{ languages_code: 'en', title: 'Artist' }] },
  { id: 'role-curator', slug: 'curator', title: 'Curator', status: 'published' as const, sort: 2, translations: [{ languages_code: 'en', title: 'Curator' }] }
]

const exhibitions = [{
  id: 'parkschloessl-campidell-kulle-2026', slug: 'farben-im-park',
  primary_venue: 'venue-parkschloessl', start_date: '2026-07-28', end_date: '2026-08-07',
  is_permanent: false, image: '/e.webp', image_alt: 'alt', title: 'Farben im Park', summary: 's', description: null,
  date_range: '28 July–7 August 2026', opening_hours: 'Mon-Fri', vernissage: 'Mon 27 July', medium: null,
  source_pdf: null, tour: null, tour_status: 'available' as const, tour_available_from: null,
  status: 'published' as const,
  translations: [{ languages_code: 'en', title: 'Farben im Park', summary: 's',
    description: '', date_range: '28 July–7 August 2026', opening_hours: '', vernissage: '',
    image_alt: '', medium: '' }]
}]

const participations = [
  { id: 'p-2', exhibition: 'parkschloessl-campidell-kulle-2026', person: 'person-judith-maria-kulle', role: 'role-artist', sort: 1, status: 'published' as const },
  { id: 'p-1', exhibition: 'parkschloessl-campidell-kulle-2026', person: 'person-sylvia-campidell', role: 'role-artist', sort: 0, status: 'published' as const },
  { id: 'p-3', exhibition: 'parkschloessl-campidell-kulle-2026', person: 'person-curator', role: 'role-curator', sort: 0, status: 'published' as const }
]

const resolve = () => resolveExhibitions(exhibitions, venues, locations, participations, persons, roles, 'en')
```

Then in every test: replace `junction` with `participations`, `artists` with `persons`, add `roles` before `'en'` in each call, `artist_ids` expectations use `person-…` ids, `primary_venue_id` → `primary_venue`, `artist_id: 'artist-ghost'` → `person: 'person-ghost'` (expect `/unknown person person-ghost/`), the statement helper builds `{ id, exhibition: exhibitions[0].id, person: persons[0].id, sort, prompt: 'How did you approach the room?', statement: text, status, translations }`, and `artists.map((artist) => …website_url…)` becomes `persons.map(…)`. Add two tests:

```ts
  it('lists only artist-role participations as artists and curators separately', () => {
    const [record] = resolve()
    expect(record.artist).toBe('Sylvia Campidell & Judith Maria Kulle')
    expect(record.curators.map((c) => c.name)).toEqual(['Cura Tor'])
  })

  it('throws when a participation names an unknown role', () => {
    const broken = [{ ...participations[0], role: 'role-ghost' }]
    expect(() => resolveExhibitions(exhibitions, venues, locations, broken, persons, roles, 'en'))
      .toThrow(/unknown role role-ghost/)
  })
```

- [ ] **Step 5: Run to verify it fails**

Run: `pnpm test -- resolveExhibitions` → FAIL (wrong signature).

- [ ] **Step 6: Rewrite `resolveExhibitions.ts`**

```ts
import type {
  ExhibitionRecord, ExhibitionStatement, LocationRecord, ParticipationRecord, PersonRecord, RoleRecord, VenueRecord
} from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'
import type { TourStatus } from '~/utils/tourAccess'

export interface ResolvedExhibitionArtist {
  id: string
  name: string
  website_url?: string
}

export interface ResolvedStatement {
  id: string
  artist: string
  prompt?: string
  text: string
}

export interface ResolvedExhibition {
  id: string
  slug: string
  title: string
  artist: string
  artist_ids: string[]
  artists: ResolvedExhibitionArtist[]
  curators: ResolvedExhibitionArtist[]
  statements: ResolvedStatement[]
  venue_slug: string
  venue: string
  venue_website?: string
  city: string
  start_date: string
  end_date: string
  is_permanent: boolean
  date_range: string
  image: string
  image_alt: string
  summary: string
  description?: string
  medium?: string
  opening_hours: string
  vernissage: string
  source_pdf?: string
  tour?: string
  tour_status: TourStatus
  tour_available_from: string | null
}

export const displayPersonName = (person: PersonRecord): string =>
  person.display_name ?? `${person.first_name} ${person.last_name}`.trim()

const toCredit = (person: PersonRecord): ResolvedExhibitionArtist => ({
  id: person.id,
  name: displayPersonName(person),
  website_url: person.website_url ?? undefined
})

export const resolveExhibitions = (
  exhibitions: ExhibitionRecord[],
  venues: VenueRecord[],
  locations: LocationRecord[],
  participations: ParticipationRecord[],
  persons: PersonRecord[],
  roles: RoleRecord[],
  locale: string,
  statements: ExhibitionStatement[] = []
): ResolvedExhibition[] => {
  const venueById = new Map(venues.map((venue) => [venue.id, venue]))
  const locationById = new Map(locations.map((location) => [location.id, location]))
  const personById = new Map(persons.map((person) => [person.id, person]))
  const roleSlugById = new Map(roles.map((role) => [role.id, role.slug]))

  const participationsByExhibition = new Map<string, ParticipationRecord[]>()
  for (const row of participations.filter(isVisible)) {
    const rows = participationsByExhibition.get(row.exhibition) ?? []
    rows.push(row)
    participationsByExhibition.set(row.exhibition, rows)
  }

  const statementsByExhibition = new Map<string, ExhibitionStatement[]>()
  for (const statement of statements.filter(isVisible)) {
    const rows = statementsByExhibition.get(statement.exhibition) ?? []
    rows.push(statement)
    statementsByExhibition.set(statement.exhibition, rows)
  }

  return exhibitions.filter(isVisible).map((exhibition) => {
    const venue = venueById.get(exhibition.primary_venue)
    if (!venue) {
      throw new Error(`pp_exhibitions.json: ${exhibition.id} references unknown venue ${exhibition.primary_venue}`)
    }
    const location = locationById.get(venue.location)
    if (!location) throw new Error(`pp_venues.json: ${venue.id} references unknown location ${venue.location}`)

    const rows = (participationsByExhibition.get(exhibition.id) ?? []).sort((a, b) => a.sort - b.sort)
    const credited = rows.map((row) => {
      const person = personById.get(row.person)
      if (!person) throw new Error(`pp_exhibition_participations.json: unknown person ${row.person}`)
      const role = roleSlugById.get(row.role)
      if (!role) throw new Error(`pp_exhibition_participations.json: unknown role ${row.role}`)
      return { person, role }
    })
    const artists = credited.filter(({ role }) => role === 'artist').map(({ person }) => person)
    const curators = credited.filter(({ role }) => role === 'curator').map(({ person }) => person)

    const text = pickTranslation(exhibition, locale)
    const resolvedStatements = (statementsByExhibition.get(exhibition.id) ?? [])
      .sort((a, b) => a.sort - b.sort)
      .map((statement) => {
        const person = personById.get(statement.person)
        if (!person) throw new Error(`pp_exhibition_statements.json: unknown person ${statement.person}`)
        const words = pickTranslation(statement, locale)
        return {
          id: statement.id,
          artist: displayPersonName(person),
          prompt: (words.prompt as string) || undefined,
          text: (words.statement as string) ?? ''
        }
      })
      .filter((statement) => statement.text)

    return {
      id: exhibition.id,
      slug: exhibition.slug,
      title: (text.title as string) || exhibition.title,
      artist: artists.map(displayPersonName).join(' & '),
      artist_ids: artists.map((person) => person.id),
      artists: artists.map(toCredit),
      curators: curators.map(toCredit),
      statements: resolvedStatements,
      venue_slug: venue.slug,
      venue: venue.title,
      venue_website: venue.website_url || undefined,
      city: location.title,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      is_permanent: exhibition.is_permanent,
      date_range: (text.date_range as string) || exhibition.date_range || '',
      image: exhibition.image,
      image_alt: (text.image_alt as string) || exhibition.image_alt,
      summary: (text.summary as string) || exhibition.summary || '',
      description: (text.description as string) || undefined,
      medium: (text.medium as string) || undefined,
      opening_hours: (text.opening_hours as string) || exhibition.opening_hours,
      vernissage: (text.vernissage as string) || exhibition.vernissage,
      source_pdf: exhibition.source_pdf ?? undefined,
      tour: exhibition.tour ?? undefined,
      tour_status: exhibition.tour_status,
      tour_available_from: exhibition.tour_available_from
    }
  })
}
```

Run: `pnpm test -- resolveExhibitions` → PASS.

- [ ] **Step 7: Rewrite the artist directory test**

```ts
// test/unit/artistDirectory.spec.ts
import { describe, expect, it } from 'vitest'
import { buildArtistDirectory } from '~/utils/artistDirectory'

const person = (id: string, first: string, last: string) => ({
  id, slug: `${first}-${last}`.toLowerCase(), first_name: first, last_name: last,
  middle_initial: null, display_name: null, website_url: null, status: 'published' as const
})

const persons = [person('a-1', 'Sylvia', 'Campidell'), person('a-2', 'Nobody', 'Unshown'), person('c-1', 'Only', 'Curator')]
const roles = [
  { id: 'role-artist', slug: 'artist', title: 'Artist', status: 'published' as const, sort: 1, translations: [] },
  { id: 'role-curator', slug: 'curator', title: 'Curator', status: 'published' as const, sort: 2, translations: [] }
]
const personRoles = [
  { id: 1, persons_id: 'a-1', roles_id: 'role-artist', sort: 0 },
  { id: 2, persons_id: 'a-2', roles_id: 'role-artist', sort: 0 },
  { id: 3, persons_id: 'c-1', roles_id: 'role-curator', sort: 0 }
]

const exhibitions = [
  { id: 'e-1', slug: 'farben-im-park', title: 'Farben im Park', venue: 'Parkschlössl',
    city: 'Spittal an der Drau', start_date: '2026-07-28' },
  { id: 'e-2', slug: 'zweite', title: 'Zweite', venue: 'Parkschlössl',
    city: 'Spittal an der Drau', start_date: '2025-01-01' }
] as never[]

const participations = [
  { id: 'p-1', exhibition: 'e-1', person: 'a-1', role: 'role-artist', sort: 0, status: 'published' as const },
  { id: 'p-2', exhibition: 'e-2', person: 'a-1', role: 'role-artist', sort: 0, status: 'published' as const },
  { id: 'p-3', exhibition: 'e-1', person: 'c-1', role: 'role-curator', sort: 0, status: 'published' as const }
]

const build = (rows = participations) => buildArtistDirectory(persons, exhibitions, rows, personRoles, roles)

describe('buildArtistDirectory', () => {
  it('counts records from artist participations, not from a stored field', () => {
    expect(build().find((entry) => entry.id === 'a-1')?.record_count).toBe(2)
  })

  it('aggregates years from the linked exhibitions in order', () => {
    expect(build().find((entry) => entry.id === 'a-1')?.years).toBe('2025 · 2026')
  })

  it('keeps an artist with no exhibitions, so the alphabet rail stays populated', () => {
    expect(build().find((entry) => entry.id === 'a-2')?.record_count).toBe(0)
  })

  it('leaves out a person who holds no artist role, even when they participate', () => {
    expect(build().some((entry) => entry.id === 'c-1')).toBe(false)
  })

  it('never invents a person that has no record in pp_persons.json', () => {
    const ghost = [{ id: 'p-9', exhibition: 'e-1', person: 'a-missing', role: 'role-artist', sort: 0, status: 'published' as const }]
    expect(build([...participations, ...ghost]).some((entry) => entry.id === 'a-missing')).toBe(false)
  })
})
```

- [ ] **Step 8: Rewrite `artistDirectory.ts`**

```ts
import type { ArtistRecordLink, DirectoryArtist, ParticipationRecord, PersonRecord, PersonRoleLink, RoleRecord } from '~/types/content'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { displayPersonName } from '~/utils/resolveExhibitions'
import { formatArtistName, getArtistFamilyLetter } from '~/utils/artistNames'

/** Persons who hold the `artist` role, with their artist-role participations as records. */
export const buildArtistDirectory = (
  persons: PersonRecord[],
  exhibitions: ResolvedExhibition[],
  participations: ParticipationRecord[],
  personRoles: PersonRoleLink[],
  roles: RoleRecord[]
): DirectoryArtist[] => {
  const artistRole = roles.find((role) => role.slug === 'artist')?.id
  if (!artistRole) throw new Error('pp_roles.json: no role with slug "artist"')
  const artistIds = new Set(personRoles.filter((row) => row.roles_id === artistRole).map((row) => row.persons_id))
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]))

  const recordsByPerson = new Map<string, ArtistRecordLink[]>()
  const yearsByPerson = new Map<string, Set<string>>()

  for (const row of participations) {
    if (row.role !== artistRole) continue
    const exhibition = exhibitionById.get(row.exhibition)
    if (!exhibition) continue

    const records = recordsByPerson.get(row.person) ?? []
    if (!records.some((record) => record.id === exhibition.id)) {
      records.push({
        id: exhibition.id,
        title: exhibition.title,
        venue: exhibition.venue,
        city: exhibition.city,
        href: `/exhibitions/${exhibition.slug}/`
      })
    }
    recordsByPerson.set(row.person, records)

    const years = yearsByPerson.get(row.person) ?? new Set<string>()
    years.add(exhibition.start_date.slice(0, 4))
    yearsByPerson.set(row.person, years)
  }

  return persons.filter((person) => artistIds.has(person.id)).map((person) => {
    const records = recordsByPerson.get(person.id) ?? []
    const name = displayPersonName(person)

    return {
      id: person.id,
      slug: person.slug,
      name,
      location: [...new Set(records.map((record) => record.city))].join(' · '),
      years: [...(yearsByPerson.get(person.id) ?? [])].sort().join(' · '),
      record_count: records.length,
      displayName: formatArtistName(name, person.slug),
      records,
      letter: getArtistFamilyLetter(person.slug, name)
    }
  }).sort((left, right) => {
    if (left.letter !== right.letter) return left.letter.localeCompare(right.letter)
    return left.displayName.localeCompare(right.displayName)
  })
}
```

Run: `pnpm test` → all green.

- [ ] **Step 9: Rewire the composable**

```ts
// app/composables/useArchiveData.ts
import exhibitionStatements from '~/data/pp_exhibition_statements.json'
import exhibitions from '~/data/pp_exhibitions.json'
import locations from '~/data/pp_locations.json'
import participations from '~/data/pp_exhibition_participations.json'
import personRoles from '~/data/pp_mm__persons_roles.json'
import persons from '~/data/pp_persons.json'
import roles from '~/data/pp_roles.json'
import sponsors from '~/data/pp_sponsors.json'
import venues from '~/data/pp_venues.json'
import type {
  ExhibitionRecord, ExhibitionStatement, LocationRecord, ParticipationRecord, PersonRecord, PersonRoleLink, RoleRecord, SponsorRecord, VenueRecord
} from '~/types/content'
import { buildArtistDirectory } from '~/utils/artistDirectory'
import { isVisible } from '~/utils/contentStatus'
import { resolveExhibitions } from '~/utils/resolveExhibitions'
import { resolveVenues } from '~/utils/resolveVenues'

export function useArchiveData() {
  const { locale } = useI18n()

  const venuesForLocale = computed(() =>
    resolveVenues(locations as LocationRecord[], venues as VenueRecord[], locale.value))

  const exhibitionsForLocale = computed(() => resolveExhibitions(
    exhibitions as ExhibitionRecord[],
    venues as VenueRecord[],
    locations as LocationRecord[],
    participations as ParticipationRecord[],
    persons as PersonRecord[],
    roles as RoleRecord[],
    locale.value,
    exhibitionStatements as ExhibitionStatement[]
  ))

  const artistDirectory = computed(() => buildArtistDirectory(
    (persons as PersonRecord[]).filter(isVisible),
    exhibitionsForLocale.value,
    participations as ParticipationRecord[],
    personRoles as PersonRoleLink[],
    roles as RoleRecord[]
  ))

  return {
    artists: computed(() => (persons as PersonRecord[]).filter(isVisible)),
    venues: venuesForLocale,
    venueExhibitions: exhibitionsForLocale,
    sponsors: computed(() => (sponsors as SponsorRecord[]).filter(isVisible)),
    artistDirectory
  }
}
```

- [ ] **Step 10: Pages and the sponsor mark**

In `app/pages/index.vue` and `app/pages/artists/index.vue`: delete the two imports (`buildArtistDirectory`, `exhibitionsArtists`) and the `ExhibitionArtistLink` type import; replace the local `directoryArtists` computed with the composable's:

```ts
const { artists, venues, venueExhibitions, artistDirectory: directoryArtists } = useArchiveData()   // index.vue
const { artists, venueExhibitions, artistDirectory: directoryArtists } = useArchiveData()           // artists/index.vue
```
(Keep whichever of `artists`/`venues` each page still uses; remove unused destructured names so lint stays clean.)

In `app/components/ArchiveSponsorMark.vue`: `import type { Sponsor }` → `import type { SponsorRecord }`, the prop type `Sponsor` → `SponsorRecord`, and every `sponsor.name` in the template → `sponsor.title` (`grep -n "sponsor\.name" app/components/ArchiveSponsorMark.vue` must return nothing afterwards).

- [ ] **Step 11: Verify everything**

Run: `pnpm check:types && pnpm test && pnpm check:data && pnpm check:artists && pnpm check:venues && pnpm check:links && pnpm check:directories && pnpm check:i18n && pnpm check:public && pnpm check:tailwind && pnpm check:mobile && pnpm check:preloader`
Expected: all pass. Then `pnpm dev` and open `http://localhost:4991/`: landing hero, artists directory (`/artists/`), one venue (`/venues/parkschloessl-spittal-drau/`), one exhibition (`/exhibitions/all-the-magic/`) render with names, cities and credits as before.

- [ ] **Step 12: Commit**

```bash
git add app test
git commit -m "Resolve persons, roles and participations behind unchanged component shapes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Navigation resolver and composable

**Files:**
- Create: `app/utils/resolveNavigation.ts`, `app/composables/useSiteNavigation.ts`
- Create: `test/unit/resolveNavigation.spec.ts`

**Interfaces:**
- `resolveNavigation(navigations: NavigationRecord[], items: NavigationItemRecord[], locale: string): ResolvedNavigation`
- `NavLink = { key: string; label: string; kind: NavigationItemKind; to?: string; href?: string; action?: string; target: '_self' | '_blank' }`
- `NavGroup = { key: string; label: string; links: NavLink[] }`
- `ResolvedNavigation = { main: NavLink[]; footer: NavGroup[] }`
- `useSiteNavigation()` → `ComputedRef<ResolvedNavigation>` with `to` already passed through `localePath()`.

- [ ] **Step 1: Write the failing test**

```ts
// test/unit/resolveNavigation.spec.ts
import { describe, expect, it } from 'vitest'
import { resolveNavigation } from '~/utils/resolveNavigation'

const navigations = [
  { id: 'nav-main', key: 'main', title: 'Main', status: 'published' as const, sort: 1 },
  { id: 'nav-footer', key: 'footer', title: 'Footer', status: 'published' as const, sort: 2 }
]
const item = (nav: string, key: string, o: Partial<{ parent: string | null; kind: 'route' | 'url' | 'action'; path: string | null; url: string | null; sort: number; status: 'draft' | 'published' | 'archived' }> = {}) => ({
  id: `nav-${nav}-${key}`, navigation: `nav-${nav}`, parent: o.parent ?? null, key, title: key.toUpperCase(),
  kind: o.kind ?? 'route', path: o.path ?? null, url: o.url ?? null, target: '_self' as const, sort: o.sort ?? 0, status: o.status ?? 'published' as const,
  translations: [{ languages_code: 'en', title: `EN ${key}` }, { languages_code: 'de', title: `DE ${key}` }]
})
const items = [
  item('main', 'about', { path: '/about/', sort: 2 }),
  item('main', 'exhibitions', { path: '/exhibitions/', sort: 1 }),
  item('footer', 'legal', { sort: 1 }),
  item('footer', 'imprint', { parent: 'nav-footer-legal', path: '/imprint/', sort: 1 }),
  item('footer', 'cookies', { parent: 'nav-footer-legal', kind: 'action', path: 'cookie-settings', sort: 2 }),
  item('footer', 'site', { parent: 'nav-footer-legal', kind: 'url', url: 'https://example.org/', sort: 3 }),
  item('footer', 'hidden', { parent: 'nav-footer-legal', path: '/x/', sort: 4, status: 'archived' })
]

describe('resolveNavigation', () => {
  it('orders main links by sort and localizes labels', () => {
    const nav = resolveNavigation(navigations, items, 'de')
    expect(nav.main.map((l) => l.key)).toEqual(['exhibitions', 'about'])
    expect(nav.main[0]).toMatchObject({ label: 'DE exhibitions', kind: 'route', to: '/exhibitions/', target: '_self' })
  })

  it('builds footer groups with typed links and drops archived items', () => {
    const [legal] = resolveNavigation(navigations, items, 'en').footer
    expect(legal.label).toBe('EN legal')
    expect(legal.links.map((l) => l.key)).toEqual(['imprint', 'cookies', 'site'])
    expect(legal.links[1]).toMatchObject({ kind: 'action', action: 'cookie-settings' })
    expect(legal.links[2]).toMatchObject({ kind: 'url', href: 'https://example.org/' })
  })

  it('throws on a parent from another navigation', () => {
    const cross = [...items, item('main', 'stray', { parent: 'nav-footer-legal', path: '/y/' })]
    expect(() => resolveNavigation(navigations, cross, 'en')).toThrow(/parent nav-footer-legal belongs to another navigation/)
  })

  it('throws on a duplicate key inside one navigation', () => {
    const dupe = [...items, item('main', 'about', { path: '/dupe/' })]
    expect(() => resolveNavigation(navigations, dupe, 'en')).toThrow(/duplicate key about/)
  })

  it('throws on a missing navigation', () => {
    expect(() => resolveNavigation([navigations[0]], items, 'en')).toThrow(/no navigation with key footer/)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test -- resolveNavigation` → FAIL, module not found.

- [ ] **Step 3: Write the resolver**

```ts
// app/utils/resolveNavigation.ts
import type { NavigationItemKind, NavigationItemRecord, NavigationRecord } from '~/types/content'
import { isVisible } from '~/utils/contentStatus'
import { pickTranslation } from '~/utils/pickTranslation'

export interface NavLink {
  key: string
  label: string
  kind: NavigationItemKind
  /** Locale-neutral route path for kind `route`; the composable localizes it. */
  to?: string
  href?: string
  action?: string
  target: '_self' | '_blank'
}

export interface NavGroup {
  key: string
  label: string
  links: NavLink[]
}

export interface ResolvedNavigation {
  main: NavLink[]
  footer: NavGroup[]
}

const FILE = 'pp_navigation_items.json'
const bySort = (a: { sort: number }, b: { sort: number }) => a.sort - b.sort

const toLink = (item: NavigationItemRecord, locale: string): NavLink => {
  const label = (pickTranslation(item, locale).title as string) || item.title
  const base = { key: item.key, label, kind: item.kind, target: item.target }
  if (item.kind === 'route') return { ...base, to: item.path ?? undefined }
  if (item.kind === 'url') return { ...base, href: item.url ?? undefined }
  if (item.kind === 'action') return { ...base, action: item.path ?? undefined }
  throw new Error(`${FILE}: ${item.id} has unknown kind ${String(item.kind)}`)
}

export const resolveNavigation = (
  navigations: NavigationRecord[],
  items: NavigationItemRecord[],
  locale: string
): ResolvedNavigation => {
  const navByKey = new Map(navigations.map((nav) => [nav.key, nav]))
  const itemById = new Map(items.map((item) => [item.id, item]))

  const itemsOf = (key: string): NavigationItemRecord[] => {
    const nav = navByKey.get(key)
    if (!nav) throw new Error(`pp_navigations.json: no navigation with key ${key}`)
    const rows = items.filter((item) => item.navigation === nav.id)
    const seen = new Set<string>()
    for (const row of rows) {
      if (seen.has(row.key)) throw new Error(`${FILE}: duplicate key ${row.key} in navigation ${key}`)
      seen.add(row.key)
      if (row.parent !== null) {
        const parent = itemById.get(row.parent)
        if (!parent) throw new Error(`${FILE}: ${row.id} references unknown parent ${row.parent}`)
        if (parent.navigation !== row.navigation) throw new Error(`${FILE}: ${row.id}: parent ${row.parent} belongs to another navigation`)
      }
    }
    return rows.filter(isVisible)
  }

  const mainItems = itemsOf('main')
  const main = mainItems.filter((item) => item.parent === null).sort(bySort).map((item) => toLink(item, locale))

  const footerItems = itemsOf('footer')
  const footer = footerItems.filter((item) => item.parent === null).sort(bySort).map((group) => ({
    key: group.key,
    label: (pickTranslation(group, locale).title as string) || group.title,
    links: footerItems.filter((item) => item.parent === group.id).sort(bySort).map((item) => toLink(item, locale))
  }))

  return { main, footer }
}
```

Run: `pnpm test -- resolveNavigation` → PASS.

- [ ] **Step 4: Write the composable**

```ts
// app/composables/useSiteNavigation.ts
import navigations from '~/data/pp_navigations.json'
import navigationItems from '~/data/pp_navigation_items.json'
import type { NavigationItemRecord, NavigationRecord } from '~/types/content'
import { resolveNavigation, type NavLink, type ResolvedNavigation } from '~/utils/resolveNavigation'

/** Header and footer menus from pp_navigations, with route paths localized. */
export function useSiteNavigation() {
  const { locale } = useI18n()
  const localePath = useLocalePath()

  const localize = (link: NavLink): NavLink => (link.kind === 'route' && link.to ? { ...link, to: localePath(link.to) } : link)

  return computed<ResolvedNavigation>(() => {
    const nav = resolveNavigation(navigations as NavigationRecord[], navigationItems as NavigationItemRecord[], locale.value)
    return {
      main: nav.main.map(localize),
      footer: nav.footer.map((group) => ({ ...group, links: group.links.map(localize) }))
    }
  })
}
```

- [ ] **Step 5: Commit**

```bash
git add app/utils/resolveNavigation.ts app/composables/useSiteNavigation.ts test/unit/resolveNavigation.spec.ts
git commit -m "Resolve the header and footer menus from navigation data

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Header and footer render from navigation data

**Files:**
- Modify: `app/components/ArchiveHeader.vue`, `app/components/ArchiveFooterMenu.vue`
- Modify: `i18n/locales/en.json`, `i18n/locales/de.json`
- Modify: `scripts/check-mobile-density.mjs`, `scripts/check-directory-routes.mjs`

**Interfaces:**
- Consumes: `useSiteNavigation()` from Task 4.

- [ ] **Step 1: Update the two check scripts first (they are the tests)**

In `scripts/check-mobile-density.mjs`: delete the line `const primaryLinkDefinition = …`. After the `Promise.all([...])` block add:

```js
const navigationItems = JSON.parse(await readProjectFile('app/data/pp_navigation_items.json'))
```

Replace the whole check line that starts with `['About belongs to the primary group while the desktop popup retains only secondary information and legal actions'` with:

```js
  ['the header renders its links from the navigation data: About in the primary group, only the information and legal groups in the popup', archiveHeader.includes('useSiteNavigation()') && /\[ mobile-nav-primary \][^\"]*hidden tablet:grid/.test(archiveHeader) && archiveHeader.includes("['information', 'legal']") && !/localePath\('\/(?:about|how-it-works|contact|imprint|privacy|terms|accessibility)\/'\)/.test(archiveHeader) && navigationItems.some((item) => item.key === 'about' && item.navigation === 'nav-main' && item.parent === null)],
```

In `scripts/check-directory-routes.mjs` replace the final `for (const navigation of [header, footerMenu]) { … }` loop with:

```js
const navigationItems = await readJson('app/data/pp_navigation_items.json')
const mainPaths = navigationItems.filter((item) => item.navigation === 'nav-main').map((item) => item.path)
assert(mainPaths.includes('/venues/'), 'Gallery navigation must target the real gallery index.')
assert(mainPaths.includes('/exhibitions/'), 'Exhibition navigation must target the real exhibition index.')
for (const navigation of [header, footerMenu]) {
  assert.match(navigation, /useSiteNavigation\(\)/, 'Header and footer must render their links from the navigation data.')
}
```

Run: `pnpm check:mobile; pnpm check:directories` → both FAIL on the new assertions (components not yet changed).

- [ ] **Step 2: Rewrite the header script and the three link blocks**

Replace the `<script setup>` of `app/components/ArchiveHeader.vue` with:

```ts
<script setup lang="ts">
const props = withDefaults(defineProps<{
  active?: 'archive' | 'galleries' | 'artists' | 'exhibitions' | 'about'
  skipTarget?: string
}>(), {
  active: undefined,
  skipTarget: 'main-content'
})

const menuOpen = ref(false)
const route = useRoute()
const localePath = useLocalePath()
const { show: showCookieNotice } = useCookieNotice()
const navigation = useSiteNavigation()

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

// Main menu from pp_navigations `main`; the popup shows the footer's
// information and legal groups, exactly the two secondary blocks it had before.
const primaryLinks = computed(() => navigation.value.main)
const secondaryGroups = computed(() => navigation.value.footer.filter((group) => ['information', 'legal'].includes(group.key)))

const runAction = (action?: string) => {
  menuOpen.value = false
  if (action === 'cookie-settings') showCookieNotice()
}
</script>
```

The desktop `<nav class="[ desktop-nav ] …">` and the `[ mobile-nav-primary ]` block keep their markup; only the binding names already match (`link.to`, `link.label`, `link.key`). Replace the whole `[ mobile-nav-secondary ]` div with:

```vue
          <div class="[ mobile-nav-secondary ] grid grid-cols-2 gap-6 px-4 py-4 compact:gap-4 compact:px-3 compact:py-3">
        <div v-for="group in secondaryGroups" :key="group.key" class="[ mobile-nav-group ] grid content-start gap-2.5" :data-group="group.key">
          <p class="m-0 mb-1 font-display text-xs tracking-widest text-archive-red uppercase">{{ group.label }}</p>
          <template v-for="link in group.links" :key="link.key">
            <NuxtLink v-if="link.kind === 'route'" class="archive-navigation-link relative w-fit font-display text-base text-archive-ink no-underline transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red current-page:text-archive-red" :to="link.to" @click="menuOpen = false">{{ link.label }}</NuxtLink>
            <a v-else-if="link.kind === 'url'" class="archive-navigation-link relative w-fit font-display text-base text-archive-ink no-underline transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red" :href="link.href" :target="link.target" rel="noopener">{{ link.label }}</a>
            <button v-else class="archive-navigation-link relative w-fit cursor-pointer border-0 bg-transparent p-0 font-display text-base text-archive-ink transition-colors duration-150 hover:text-archive-red focus-visible:text-archive-red" type="button" @click="runAction(link.action)">{{ link.label }}</button>
          </template>
        </div>
          </div>
```

Delete the old `openCookieSettings` function (replaced by `runAction`). `localePath` stays imported: the brand link and skip link use it.

- [ ] **Step 3: Rewrite the footer menu**

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'desktop' | 'drawer'
}>(), {
  variant: 'desktop'
})

const rootElement = computed(() => props.variant === 'desktop' ? 'section' : 'div')
const rootClasses = computed(() => props.variant === 'desktop'
  ? 'archive-footer-link-grid relative z-1 mx-auto grid max-w-384 grid-cols-[1.35fr_repeat(3,minmax(9rem,0.72fr))_16rem] gap-0 border-y border-archive-ochre/20 py-[3.2rem] *:relative *:min-w-0 *:px-[2.4rem] *:first:pl-0 *:last:pr-0 tablet:hidden'
  : 'relative z-1 grid grid-cols-2 gap-x-4 gap-y-5')
const { show: showCookieNotice } = useCookieNotice()
const navigation = useSiteNavigation()
const footerGroups = computed(() => navigation.value.footer)
const isLegal = (key: string) => key === 'legal'

const runAction = (action?: string) => {
  if (action === 'cookie-settings') showCookieNotice()
}
</script>

<template>
  <component :is="rootElement" class="[ footer-menu ]" :class="rootClasses">
    <ArchiveFooterIdentity v-if="props.variant === 'desktop'" />
    <div v-else class="[ footer-menu-language ] col-span-2 flex justify-end border-b border-archive-ochre/20 pb-4">
      <ArchiveLanguageSwitch inverted />
    </div>

    <ArchiveFooterNav
      v-for="group in footerGroups"
      :key="group.key"
      :title="group.label"
      :ariaLabel="$t(`footer.${group.key}Aria`)"
      :compact-columns="props.variant === 'drawer' && isLegal(group.key)"
      :class="props.variant === 'drawer' && isLegal(group.key) ? 'col-span-2 border-t border-archive-ochre/20 pt-4' : ''"
    >
      <template v-for="link in group.links" :key="link.key">
        <NuxtLink v-if="link.kind === 'route'" :to="link.to">{{ link.label }}</NuxtLink>
        <a v-else-if="link.kind === 'url'" :href="link.href" :target="link.target" rel="noopener">{{ link.label }}</a>
        <button v-else class="cursor-pointer border-0 bg-transparent p-0 text-left" type="button" @click="runAction(link.action)">{{ link.label }}</button>
      </template>
    </ArchiveFooterNav>
    <img v-if="props.variant === 'desktop'" class="[ footer-seal ] w-62 max-w-full self-center opacity-90 mix-blend-screen" src="/media/images/landing/footer/permanently-preserved-stamp.png" :alt="$t('footer.sealAlt')" />
  </component>
</template>
```

The grid still has five columns on desktop: identity, three groups, seal. If the seeded footer ever gains a fourth group the grid template must grow with it; that is a design change, not a data change.

- [ ] **Step 4: Remove the locale keys that only served as menu labels**

From both `i18n/locales/en.json` and `de.json` delete: `navigation.artists`, `navigation.about`, `navigation.contact`, `navigation.information`, `footer.explore`, `footer.legal`, `footer.imprint`, `footer.privacy`, `footer.terms`, `footer.accessibility`, `footer.cookies`. Keep `navigation.archive`, `navigation.exhibitions`, `navigation.galleries`, `navigation.howItWorks` (breadcrumbs and the landing page use them) and every `*Aria`, `openMenu`, `closeMenu` key.

Verify nothing else used them: `grep -rn --include='*.vue' --include='*.ts' -E "navigation\.(artists|about|contact|information)|footer\.(explore|legal|imprint|privacy|terms|accessibility|cookies)\b" app` → no output.

- [ ] **Step 5: Run everything and look**

Run: `pnpm check:types && pnpm test && pnpm check:data && pnpm check:i18n && pnpm check:directories && pnpm check:mobile && pnpm check:tailwind && pnpm check:artists && pnpm check:venues && pnpm check:links && pnpm check:public && pnpm check:preloader`
Expected: all pass.

Then `pnpm dev`, open `http://localhost:4991/` and `http://localhost:4991/en/`: desktop header shows Exhibitions · Artists · Galleries · About the Project (German: Ausstellungen · Künstler:innen · Galerien · Über das Projekt); at 1280px or narrower the menu button opens the popup with the four primary links, then "Information" (How it works, Contact) and "Legal" (Imprint … Cookie settings); Cookie settings opens the cookie notice. The footer shows Explore / Information / Legal with the same links; in the mobile footer drawer, Legal spans both columns.

- [ ] **Step 6: Commit**

```bash
git add app/components/ArchiveHeader.vue app/components/ArchiveFooterMenu.vue i18n scripts/check-mobile-density.mjs scripts/check-directory-routes.mjs
git commit -m "Render the header and footer menus from the navigation data

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Docs, build, QA

**Files:**
- Modify: `AGENTS.md` (frontend), `README.md` (frontend), `_Plans/exhibitions-plan.md` (Phase 4 tracker), `docs/superpowers/specs/2026-09-14-directus-conventions-schema-design.md` (one line)

- [ ] **Step 1: Frontend AGENTS.md data paragraph**

Replace the paragraph that begins `Local JSON mirrors the Directus collections in` with:

```markdown
Local JSON mirrors the Directus collections 1:1, file by file and key by key, named after the collection: `pp_locations.json` (towns, with the coordinates radius search needs), `pp_venues.json` (buildings, each with a `type` and a `location`), `pp_persons.json` (people and collectives: name, slug, website link, nothing more), `pp_roles.json` + `pp_mm__persons_roles.json` (what a person can be), `pp_exhibitions.json`, `pp_exhibition_participations.json` (one person in one role on one show), `pp_exhibition_statements.json`, `pp_sponsors.json`, `pp_navigations.json` + `pp_navigation_items.json` (header and footer menus), and six empty `pp_mm__*.json` junctions for sponsor, venue and travelling-show links. The schema itself lives in `../directus/scripts/schema.mjs`; `../_Plans/exhibitions-plan.md` §2 describes it. Joins happen in `useArchiveData()` and `useSiteNavigation()`, never in components. When a field is added or removed, change `../directus/scripts/schema.mjs`, the JSON, `app/types/content.ts` and §2 in the same commit. Every translatable field exists on the record as the English original and in `translations[]` for every language; `pnpm check:data` enforces that they match.
```

Also in `AGENTS.md`, search for `exhibitions_artists`, `artists.json`, `venues.json` and `locations.json` and replace each with the `pp_` name.

- [ ] **Step 2: Frontend README**

In `README.md`, replace `local English source records, local German translation overlays` with `local records in the Directus shape (`app/data/pp_*.json`) carrying inline English and German translations`, and add a bullet to the "It includes" list: `- header and footer menus driven by navigation data (`pp_navigations.json`), not by hard-coded links;`.

- [ ] **Step 3: Tracker and spec line**

In `_Plans/exhibitions-plan.md` Phase 4, tick the line `[ ] Rename the frontend JSON, types and resolvers to the pp_ shape; header and footer read the navigations (plan part 2)` to `[x] … — <today's date>`.

In the spec, "Persons, roles, participations" section, replace `The artist directory lists persons who have at least one `artist` participation.` with `The artist directory lists persons who hold the `artist` role (via `pp_mm__persons_roles`); their records are their artist-role participations, so filler artists without shows still appear on the alphabet rail.`

- [ ] **Step 4: Build and QA**

Run: `pnpm build`
Expected: `nuxt generate` succeeds; `.output/public/` contains `index.html`, `en/index.html`, `artists/index.html`, `venues/parkschloessl-spittal-drau/index.html`.

Then invoke the `frontend-qa-checklist` skill against `http://localhost:4991` and walk: landing (hero credits, current programme, header), `/artists/` (directory counts unchanged: 73 artists), `/venues/parkschloessl-spittal-drau/` (lede, about paragraphs, coordinate label), `/exhibitions/all-the-magic/` (credits, statements block absent, tour entry), footer on desktop and in the mobile drawer, cookie settings from both menus, both locales. Fix anything the checklist finds before committing.

- [ ] **Step 5: Commit and push**

```bash
git add AGENTS.md README.md ../_Plans/exhibitions-plan.md ../docs/superpowers/specs/2026-09-14-directus-conventions-schema-design.md
git commit -m "Document the pp_ data layer and the data-driven menus

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main
```

---

## Self-review notes

- Spec coverage (Frontend section): boundary (T3), JSON table (T1), types (T2), resolvers (T3), navigation resolver + composable (T4), components + locale cleanup (T5), checks (T1, T5), verification 4–7 (T3, T5, T6). Curators are resolved (T3) but not rendered — an open item in the spec.
- Type consistency: `LocationRecord`, `VenueRecord`, `PersonRecord`, `RoleRecord`, `PersonRoleLink`, `ParticipationRecord`, `ExhibitionRecord`, `ExhibitionStatement`, `SponsorRecord`, `NavigationRecord`, `NavigationItemRecord` are defined in T2 and used with those exact names in T3–T5. `displayPersonName` replaces `displayArtistName` everywhere (T3). `ResolvedExhibition.curators` added in T3 and read nowhere yet.
- The `pp_exhibition_statements.json` file is empty today, so the "English on the record" rule is exercised by the check only; the shape is still written for the day the first statement lands.
