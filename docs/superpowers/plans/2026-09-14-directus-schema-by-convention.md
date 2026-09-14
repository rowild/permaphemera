# Directus Schema by Convention Implementation Plan (part 1 of 2: Directus)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the PERMAPHEMERA Directus instance from zero so every collection, field, relation, label and form layout follows `_Plans/directus-schema-conventions.md` with prefix `pp_`, including persons/roles/participations, sponsors and navigations, and so a wiped database comes back with one command and no clicking.

**Architecture:** One declarative file, `directus/scripts/schema.mjs`, describes entities, junctions and layouts as data. `create-schema.mjs` turns that data into Directus API calls (collections, fields, relations), idempotently. Derived names (junction tables, translation tables, FK columns) come from three helper functions and are never typed by hand. `seed.mjs`, `apply-settings.mjs`, `check-conventions.mjs` and `snapshot.mjs` are small single-purpose scripts; `reset.sh` chains them.

**Tech Stack:** Directus 11.17.4 in Docker (SQLite), Node 24 (plain `fetch`, no dependencies), bash. Frontend is untouched by this plan; part 2 covers it.

**Spec:** `docs/superpowers/specs/2026-09-14-directus-conventions-schema-design.md` — read it first. The conventions themselves are in `_Plans/directus-schema-conventions.md`.

## Global Constraints

- Prefix is `pp_`. Every project collection starts with it. `languages` does not.
- Collection names: lowercase snake_case, plural. Translation table `pp_translations__<host>`. Junction `pp_mm__<a>_<b>` with `a`, `b` = parent names without prefix and without underscores, sorted alphabetically, joined by one `_`. `__` is the structural separator.
- FK in a structural table: `<parent>_id` (parent name without prefix, underscores kept): `exhibitions_id`, `exhibition_statements_id`, `languages_code`.
- M2O on an entity: named by meaning, singular: `location`, `primary_venue`, `exhibition`, `person`, `role`, `navigation`, `parent`.
- Every entity: `id` (uuid), `status` (`published` | `draft` | `archived`, default `draft`), `sort`, `user_created`, `date_created`, `user_updated`, `date_updated`. Structural tables: `id`, two FKs, `sort` only.
- `on_delete`: CASCADE on structural FKs and child→host; SET NULL on entity M2O, files, audit. Never `NO ACTION`.
- Main-collection form: top level exactly `ui_accordion_main`, `ui_accordion_translations` (if translated), `ui_group_system`. Data fields never at top level.
- `color` `#a6523c` on every prefixed collection. Labels in `meta.translations` with `language: 'en-US'`.
- Every translated column also exists on the host as the English original. The translation table column has the same name and the note `Translated field for <host>.<column>`.
- Scripts run from `directus/` with `node scripts/<name>.mjs`. Docker commands run from `directus/` with `docker compose`.
- The container maps host port 8077 to container port 8055. Never use 8055 from the host; that is another project.
- Commit after every task with the `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` trailer. Never commit `directus/.env`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `directus/.env`, `directus/.env.example` | add `PROJECT_NAME`, `PROJECT_OWNER`, `PROJECT_OWNER_ENABLED`, `TELEMETRY`, `ADMIN_TOKEN` |
| `directus/scripts/lib.mjs` | env loading, auth (static token first), `api()` — **modified** |
| `directus/scripts/naming.mjs` | the three name helpers + validating regex — **new** |
| `directus/scripts/fields.mjs` | field builders (string, text, m2o, file, ui groups, system fields) — **new** |
| `directus/scripts/schema.mjs` | the declarative schema: entities, junctions, layouts, seeds of labels — **new** |
| `directus/scripts/build.mjs` | turns `schema.mjs` into collection/field/relation payloads — **new** |
| `directus/scripts/create-schema.mjs` | applies the payloads to the API, idempotently — **rewritten** |
| `directus/scripts/seed.mjs` | roles, navigations, navigation items — **new** |
| `directus/scripts/apply-settings.mjs` | project settings — **new** |
| `directus/scripts/check-conventions.mjs` | validates the live schema — **new** |
| `directus/scripts/snapshot.mjs` | unchanged |
| `directus/scripts/reset.sh` | wipe + rebuild — **new** |
| `directus/scripts/naming.test.mjs`, `build.test.mjs` | `node --test` unit tests — **new** |
| `directus/README.md` | commands — **modified** |
| `_Plans/exhibitions-plan.md` §2 | rewritten to the new collections — **modified** (Task 10) |

Tests use Node's built-in runner: `node --test scripts/` from `directus/`.

---

### Task 1: Naming helpers with tests

**Files:**
- Create: `directus/scripts/naming.mjs`
- Create: `directus/scripts/naming.test.mjs`

**Interfaces:**
- Produces: `PREFIX`, `col(name)`, `translationsTable(host)`, `mmTable(a, b)`, `fk(host)`, `squash(name)`, `NAME_REGEX`, `isValidName(name)`.

- [ ] **Step 1: Write the failing tests**

```js
// directus/scripts/naming.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { col, fk, isValidName, mmTable, squash, translationsTable } from './naming.mjs'

test('col adds the prefix', () => {
  assert.equal(col('exhibitions'), 'pp_exhibitions')
})

test('translationsTable keeps the host underscores', () => {
  assert.equal(translationsTable('exhibition_statements'), 'pp_translations__exhibition_statements')
})

test('mmTable squashes, sorts alphabetically and joins with one underscore', () => {
  assert.equal(mmTable('exhibitions', 'artists'), 'pp_mm__artists_exhibitions')
  assert.equal(mmTable('persons', 'roles'), 'pp_mm__persons_roles')
  assert.equal(mmTable('sponsors', 'venues'), 'pp_mm__sponsors_venues')
  assert.equal(mmTable('exhibition_statements', 'persons'), 'pp_mm__exhibitionstatements_persons')
})

test('mmTable refuses a self-reference without a role', () => {
  assert.throws(() => mmTable('persons', 'persons'), /role/)
  assert.equal(mmTable('persons', 'persons', 'members'), 'pp_mm__persons_persons__members')
})

test('fk names the column after the collection without prefix', () => {
  assert.equal(fk('exhibitions'), 'exhibitions_id')
  assert.equal(fk('exhibition_statements'), 'exhibition_statements_id')
})

test('squash removes underscores only', () => {
  assert.equal(squash('exhibition_statements'), 'exhibitionstatements')
})

test('isValidName accepts every shape in the conventions and rejects malformed ones', () => {
  for (const ok of ['pp_exhibitions', 'pp_translations__exhibition_statements', 'pp_mm__persons_roles', 'pp_mm__persons_persons__members', 'pp_m2a__exhibitions__blocks', 'pp_meta', 'pp_archive']) {
    assert.equal(isValidName(ok), true, ok)
  }
  for (const bad of ['exhibitions', 'pp_mm_persons_roles', 'pp_translation__venues', 'pp_mm__roles_persons', 'pp_Exhibitions', 'pp_mm__persons_persons']) {
    assert.equal(isValidName(bad), false, bad)
  }
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from `directus/`: `node --test scripts/naming.test.mjs`
Expected: FAIL, `Cannot find module './naming.mjs'`.

- [ ] **Step 3: Write the helpers**

```js
// directus/scripts/naming.mjs
// The three derived-name rules from _Plans/directus-schema-conventions.md §1.
// Nothing else in the scripts spells a derived name by hand.

export const PREFIX = 'pp_'

export const col = (name) => `${PREFIX}${name}`

export const squash = (name) => name.replace(/_/g, '')

export const translationsTable = (host) => `${PREFIX}translations__${host}`

export const mmTable = (a, b, role) => {
  const [x, y] = [squash(a), squash(b)].sort()
  if (x === y && !role) throw new Error(`mmTable(${a}, ${b}): a self-reference needs a role`)
  return `${PREFIX}mm__${x}_${y}${role ? `__${role}` : ''}`
}

export const fk = (host) => `${host}_id`

// Conventions §1 rule 7, with the prefix replaced.
export const NAME_REGEX = /^pp_(translations__[a-z0-9_]+|mm__[a-z0-9]+_[a-z0-9]+(__[a-z0-9]+)?|m2a__[a-z0-9]+__[a-z0-9]+|(?!mm_|m2a_|translations?_)[a-z][a-z0-9_]*)$/

export const isValidName = (name) => {
  if (!NAME_REGEX.test(name)) return false
  const mm = name.match(/^pp_mm__([a-z0-9]+)_([a-z0-9]+)(?:__([a-z0-9]+))?$/)
  if (mm) {
    const [, a, b, role] = mm
    if (a > b) return false
    if (a === b && !role) return false
  }
  return true
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/naming.test.mjs`
Expected: all 7 pass.

- [ ] **Step 5: Commit**

```bash
git add directus/scripts/naming.mjs directus/scripts/naming.test.mjs
git commit -m "Add the Directus naming helpers with tests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Field builders

**Files:**
- Create: `directus/scripts/fields.mjs`

**Interfaces:**
- Produces: builder functions that return Directus field payloads `{ field, type, meta, schema }`. Every builder accepts an `opts` object; `opts.translated: true` marks the column for copying into the translation table. Exports: `uuidPk, intPk, statusField, sortField, auditFields, str, text, markdown, integer, float, bool, date, dropdown, file, jsonArray, m2o, translationsAlias, o2mAlias, m2mAlias, uiAccordion, uiGroup, label`.

No unit test: the builders are data shaping; `build.test.mjs` in Task 4 covers them through `buildAll()`.

- [ ] **Step 1: Write the builders**

```js
// directus/scripts/fields.mjs
// Field payload builders. They mirror what the Directus app sends when you
// create a field by hand, so the result looks native in the admin app.

export const label = (text) => [{ language: 'en-US', translation: text }]

const base = (field, type, meta, schema = {}) => ({ field, type, meta, schema })

export const uuidPk = () => base('id', 'uuid',
  { hidden: true, readonly: true, interface: 'input', special: ['uuid'], width: 'half' },
  { is_primary_key: true, length: 36, has_auto_increment: false })

export const intPk = () => base('id', 'integer',
  { hidden: true, readonly: true, interface: 'input', width: 'half' },
  { is_primary_key: true, has_auto_increment: true })

export const statusField = () => base('status', 'string',
  {
    width: 'half', interface: 'select-dropdown', display: 'labels',
    options: { choices: [
      { text: '$t:published', value: 'published' },
      { text: '$t:draft', value: 'draft' },
      { text: '$t:archived', value: 'archived' },
    ] },
    display_options: { showAsDot: true, choices: [
      { text: '$t:published', value: 'published', foreground: '#FFFFFF', background: 'var(--theme--primary)' },
      { text: '$t:draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
      { text: '$t:archived', value: 'archived', foreground: '#FFFFFF', background: 'var(--theme--warning)' },
    ] },
  },
  { default_value: 'draft', is_nullable: false })

export const sortField = () => base('sort', 'integer', { interface: 'input', hidden: true, width: 'half' })

// The four automatic fields. `special` drives the automatism.
export const auditFields = () => [
  base('user_created', 'uuid', { special: ['user-created'], interface: 'select-dropdown-m2o', options: { template: '{{avatar}} {{first_name}} {{last_name}}' }, display: 'user', readonly: true, width: 'half' }),
  base('date_created', 'timestamp', { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half', display: 'datetime', display_options: { relative: true } }),
  base('user_updated', 'uuid', { special: ['user-updated'], interface: 'select-dropdown-m2o', options: { template: '{{avatar}} {{first_name}} {{last_name}}' }, display: 'user', readonly: true, width: 'half' }),
  base('date_updated', 'timestamp', { special: ['date-updated'], interface: 'datetime', readonly: true, width: 'half', display: 'datetime', display_options: { relative: true } }),
]

const withOpts = (payload, opts) => {
  if (opts.note) payload.meta.note = opts.note
  if (opts.translated) payload.translated = true
  if (opts.required) { payload.meta.required = true; payload.schema.is_nullable = false }
  return payload
}

export const str = (field, opts = {}) => withOpts(base(field, 'string',
  { interface: 'input', width: opts.width ?? 'full', options: opts.slug ? { slug: true, trim: true } : { trim: true } },
  { is_nullable: true, is_unique: opts.unique ?? false }), opts)

export const text = (field, opts = {}) => withOpts(base(field, 'text',
  { interface: 'input-multiline', width: 'full' }, { is_nullable: true }), opts)

export const markdown = (field, opts = {}) => withOpts(base(field, 'text',
  { interface: 'input-rich-text-md', width: 'full' }, { is_nullable: true }), opts)

export const integer = (field, opts = {}) => withOpts(base(field, 'integer',
  { interface: 'input', width: opts.width ?? 'half' }, { is_nullable: true }), opts)

export const float = (field, opts = {}) => withOpts(base(field, 'float',
  { interface: 'input', width: 'half' }, { is_nullable: true }), opts)

export const bool = (field, opts = {}) => withOpts(base(field, 'boolean',
  { interface: 'boolean', width: 'half', special: ['cast-boolean'] },
  { default_value: opts.default ?? false, is_nullable: false }), opts)

export const date = (field, opts = {}) => withOpts(base(field, 'date',
  { interface: 'datetime', width: 'half' }, { is_nullable: true }), opts)

export const dropdown = (field, choices, opts = {}) => withOpts(base(field, 'string',
  { interface: 'select-dropdown', display: 'labels', width: 'half',
    options: { choices: choices.map((value) => ({ text: value, value })), allowOther: opts.allowOther ?? false } },
  { default_value: opts.default ?? null, is_nullable: !opts.default }), opts)

export const file = (field, opts = {}) => {
  const payload = base(field, 'uuid',
    { special: ['file'], interface: opts.image ? 'file-image' : 'file', display: opts.image ? 'image' : 'file', width: 'half' },
    { is_nullable: true })
  payload.relation = { related: 'directus_files', onDelete: 'SET NULL', oneField: null, oneTemplate: null, oneDeselect: 'nullify', sortField: null }
  return withOpts(payload, opts)
}

export const jsonArray = (field, opts = {}) => withOpts(base(field, 'json',
  { interface: 'input-code', options: { language: 'json' }, special: ['cast-json'], width: 'full' },
  { is_nullable: true }), opts)

// M2O on an entity. `related` is the target key without prefix ('venues') or a
// system collection ('directus_files'). `oneField` is the alias on the target.
export const m2o = (field, related, opts = {}) => {
  const payload = base(field, related === 'languages' ? 'string' : 'uuid',
    { special: ['m2o'], interface: 'select-dropdown-m2o', options: { template: opts.template ?? '{{title}}' },
      display: 'related-values', display_options: { template: opts.template ?? '{{title}}' },
      width: opts.width ?? 'half', hidden: opts.hidden ?? false },
    { is_nullable: !opts.required, is_indexed: true })
  payload.relation = { related, onDelete: opts.onDelete ?? 'SET NULL', oneField: opts.oneField ?? null, oneTemplate: opts.oneTemplate ?? null, oneDeselect: opts.onDelete === 'CASCADE' ? 'delete' : 'nullify', sortField: opts.sortField ?? null }
  return withOpts(payload, opts)
}

export const translationsAlias = () => ({
  field: 'translations', type: 'alias',
  meta: { special: ['translations'], interface: 'translations', width: 'full',
    options: { languageField: 'name', defaultLanguage: 'en', userLanguage: true, defaultOpenSplitView: true } },
})

export const o2mAlias = (field, template) => ({
  field, type: 'alias',
  meta: { special: ['o2m'], interface: 'list-o2m', width: 'full', options: { template }, display: 'related-values', display_options: { template } },
})

export const m2mAlias = (field, template) => ({
  field, type: 'alias',
  meta: { special: ['m2m'], interface: 'list-m2m', width: 'full', options: { template }, display: 'related-values', display_options: { template } },
})

// Layout-only alias fields (conventions §2 rule 7, §6).
export const uiAccordion = (name, text, opts = {}) => ({
  field: `ui_accordion_${name}`, type: 'alias',
  meta: { special: ['alias', 'no-data', 'group'], interface: 'group-accordion', width: 'full',
    options: opts.start ? { fillWidth: true, start: opts.start } : { fillWidth: true }, translations: label(text) },
})

export const uiGroup = (name, text, opts = {}) => ({
  field: `ui_group_${name}`, type: 'alias',
  meta: { special: ['alias', 'no-data', 'group'], interface: opts.detail ? 'group-detail' : 'group-raw', width: 'full',
    options: opts.detail ? { start: opts.start ?? 'open' } : null, translations: label(text) },
})
```

- [ ] **Step 2: Syntax check**

Run: `node -e "import('./scripts/fields.mjs').then(m => console.log(Object.keys(m).length, 'builders'))"`
Expected: `22 builders`.

- [ ] **Step 3: Commit**

```bash
git add directus/scripts/fields.mjs
git commit -m "Add Directus field payload builders

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: The declarative schema

**Files:**
- Create: `directus/scripts/schema.mjs`

**Interfaces:**
- Consumes: builders from `fields.mjs`.
- Produces: `COLOR`, `SCHEMA_VERSION`, `ROOT_FOLDER`, `ROOT_LABEL`, `entities` (object keyed by unprefixed name), `junctions` (array), `section()`, `content()`.

Entity shape:

```
{
  kind: 'main' | 'child',
  icon, sort (position inside its sidebar parent), labels: [label, singular, plural],
  display: ['title'] | ['first_name', 'last_name'],   // headline columns, drives templates
  displayTemplate, note,
  host?, hostField?, hostAlias?, hostAliasTemplate?,   // child only
  fields: [...builder payloads],                        // data fields only; no id/status/sort/audit
  layout: [section, ...] (main)  |  { flat: [...names] } (child)
}
```

The builder (Task 4) injects: `id`, `status`, `sort`, audit fields, the host M2O on a child, the `translations` alias when any field is `translated`, O2M aliases named by other entities' `oneField`, and M2M aliases from `junctions`. Layouts reference those injected names.

- [ ] **Step 1: Write the schema**

```js
// directus/scripts/schema.mjs
// The PERMAPHEMERA schema as data. Names of junction tables, translation tables
// and FK columns are never written here; naming.mjs derives them.
import { bool, date, dropdown, file, float, jsonArray, m2o, markdown, str, text } from './fields.mjs'

export const COLOR = '#a6523c'
export const SCHEMA_VERSION = '2026-09-14.1'
export const ROOT_FOLDER = 'archive'
export const ROOT_LABEL = 'PERMAPHEMERA'

export const section = (key, label, fields, opts = {}) => ({ key, label, fields, ...opts })
export const content = (fields) => section('content', 'Content', fields, { detail: true, start: 'open' })

const PERSON = '{{first_name}} {{last_name}}'

export const entities = {
  locations: {
    kind: 'main', icon: 'location_city', sort: 4, labels: ['Locations', 'Location', 'Locations'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'The geographic place: a town. Venues stand in a location. Exhibition → venue → location is one chain; there is no direct exhibition → location link on purpose.',
    fields: [
      str('title', { required: true, note: 'City or town name.' }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      str('postal_code', { width: 'half' }),
      str('state', { width: 'half' }),
      str('country', { width: 'half' }),
      float('latitude', { required: true, note: 'Town-centre approximation. Two floats, because SQLite has no geometry type.' }),
      float('longitude', { required: true }),
      text('description', { translated: true }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug']),
      section('address', 'Address', ['postal_code', 'state', 'country', 'latitude', 'longitude']),
      section('relations', 'Relations', ['venues', 'sponsors']),
      content(['description']),
    ],
  },

  venues: {
    kind: 'main', icon: 'museum', sort: 2, labels: ['Venues', 'Venue', 'Venues'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'The building an exhibition happens in.',
    fields: [
      str('title', { required: true }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      m2o('location', 'locations', { oneField: 'venues', oneTemplate: '{{title}}' }),
      dropdown('type', ['gallery', 'museum', 'kunsthalle', 'art_cafe', 'open_air', 'forum'], { default: 'gallery', allowOther: true }),
      str('address'),
      str('website_url', { width: 'half' }),
      float('latitude', { note: 'Optional exact building pin.' }),
      float('longitude'),
      file('image', { image: true }),
      str('image_alt', { width: 'half' }),
      file('hero_image', { image: true }),
      str('hero_image_alt', { width: 'half' }),
      str('archive_number', { width: 'half', note: 'Two-digit display number, e.g. 01.' }),
      bool('featured', { note: 'Curated landing-page highlight.' }),
      text('description', { translated: true }),
      str('lede', { translated: true, note: 'One-line teaser under the venue title.' }),
      jsonArray('about', { translated: true, note: 'JSON array of paragraph strings.' }),
      str('image_caption', { translated: true }),
      str('coordinate_label', { translated: true, note: 'Human-readable DMS readout.' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug', 'type', 'location', 'featured', 'archive_number']),
      section('address', 'Address', ['address', 'website_url', 'latitude', 'longitude', 'coordinate_label']),
      section('images', 'Images', ['image', 'image_alt', 'hero_image', 'hero_image_alt', 'image_caption']),
      section('relations', 'Relations', ['exhibitions', 'further_exhibitions', 'persons', 'sponsors']),
      content(['lede', 'description', 'about']),
    ],
  },

  persons: {
    kind: 'main', icon: 'person', sort: 3, labels: ['Persons', 'Person', 'Persons'],
    display: ['first_name', 'last_name'], displayTemplate: PERSON,
    note: 'People and collectives: artists, curators. The site shows a name, a website link and their statements. Nothing else, by decision of 2026-09-14.',
    fields: [
      str('first_name', { width: 'half' }),
      str('last_name', { width: 'half' }),
      str('middle_initial', { width: 'half' }),
      str('display_name', { width: 'half', note: 'Pseudonym or collective name. Shown instead of first + last when set.' }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      str('website_url', { width: 'half' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'first_name', 'last_name', 'middle_initial', 'display_name', 'slug', 'roles']),
      section('links', 'Links', ['website_url']),
      section('relations', 'Relations', ['participations', 'venues', 'sponsors']),
    ],
  },

  roles: {
    kind: 'main', icon: 'badge', sort: 6, labels: ['Roles', 'Role', 'Roles'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'What a person can be on a show: artist, curator, … Vocabulary table; add rows, not columns.',
    fields: [
      str('title', { required: true, translated: true }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug']),
      section('relations', 'Relations', ['persons']),
    ],
  },

  exhibitions: {
    kind: 'main', icon: 'auto_awesome', sort: 1, labels: ['Exhibitions', 'Exhibition', 'Exhibitions'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'The show. Highlighting on the site is derived from dates and never stored.',
    fields: [
      str('title', { required: true, translated: true }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      m2o('primary_venue', 'venues', { oneField: 'exhibitions', oneTemplate: '{{title}}' }),
      date('start_date', { required: true }),
      date('end_date', { required: true }),
      bool('is_permanent'),
      file('image', { image: true }),
      str('image_alt', { width: 'half', translated: true }),
      str('summary', { translated: true, note: 'One-line teaser.' }),
      markdown('description', { translated: true, note: 'Curatorial statement.' }),
      str('date_range', { width: 'half', translated: true, note: 'Display form of the dates.' }),
      str('opening_hours', { width: 'half', translated: true }),
      str('vernissage', { width: 'half', translated: true }),
      str('medium', { width: 'half', translated: true }),
      file('source_pdf', { note: 'The invitation or press sheet the record was derived from.' }),
      str('tour', { note: 'Root-relative folder of the exported 360° tour, e.g. /media/tours/<id>/. Empty while none is published.' }),
      dropdown('tour_status', ['available', 'restricted', 'unavailable'], { default: 'unavailable' }),
      date('tour_available_from', { note: 'Usually the day after the analog show closes. Empty means at once.' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug', 'primary_venue']),
      section('dates', 'Dates', ['start_date', 'end_date', 'is_permanent', 'date_range', 'opening_hours', 'vernissage']),
      section('media', 'Media', ['image', 'image_alt', 'source_pdf', 'medium']),
      section('tour', 'Tour', ['tour', 'tour_status', 'tour_available_from']),
      section('relations', 'Relations', ['participations', 'statements', 'further_venues', 'sponsors']),
      content(['summary', 'description']),
    ],
  },

  exhibition_participations: {
    kind: 'child', host: 'exhibitions', hostField: 'exhibition', hostAlias: 'participations',
    hostAliasTemplate: '{{person.first_name}} {{person.last_name}} · {{role.title}}',
    icon: 'group', sort: 1, labels: ['Exhibition Participations', 'Exhibition Participation', 'Exhibition Participations'],
    display: ['person', 'role'], displayTemplate: '{{person.first_name}} {{person.last_name}} · {{role.title}}',
    note: 'One person in one function on one show. A person who both makes and curates a show has two rows. The role must be one of the person\'s roles.',
    fields: [
      m2o('person', 'persons', { template: PERSON, oneField: 'participations', oneTemplate: '{{exhibition.title}} · {{role.title}}' }),
      m2o('role', 'roles', { template: '{{title}}' }),
    ],
    layout: { flat: ['status', 'exhibition', 'person', 'role'] },
  },

  exhibition_statements: {
    kind: 'child', host: 'exhibitions', hostField: 'exhibition', hostAlias: 'statements',
    hostAliasTemplate: '{{person.first_name}} {{person.last_name}}: {{prompt}}',
    icon: 'format_quote', sort: 2, labels: ['Exhibition Statements', 'Exhibition Statement', 'Exhibition Statements'],
    display: ['prompt'], displayTemplate: '{{person.first_name}} {{person.last_name}}: {{prompt}}',
    note: "An artist's words about one show.",
    fields: [
      m2o('person', 'persons', { template: PERSON }),
      str('prompt', { translated: true, note: 'The question asked, e.g. "How did you approach the room?"' }),
      text('statement', { translated: true }),
    ],
    layout: { flat: ['status', 'exhibition', 'person', 'prompt', 'statement'] },
  },

  sponsors: {
    kind: 'main', icon: 'handshake', sort: 5, labels: ['Sponsors', 'Sponsor', 'Sponsors'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'Supporters and partners. Linked to what they support.',
    fields: [
      str('title', { required: true }),
      str('slug', { required: true, unique: true, slug: true, width: 'half' }),
      str('website_url', { width: 'half' }),
      file('logo', { image: true }),
      text('description', { translated: true }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'slug', 'website_url', 'logo']),
      section('relations', 'Relations', ['venues', 'exhibitions', 'persons', 'locations']),
      content(['description']),
    ],
  },

  navigations: {
    kind: 'main', icon: 'menu', sort: 7, labels: ['Navigations', 'Navigation', 'Navigations'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'One row per menu: main, footer.',
    fields: [
      str('title', { required: true, note: 'Admin label, e.g. "Main navigation".' }),
      str('key', { required: true, unique: true, width: 'half', note: 'Stable identifier the frontend reads: main, footer.' }),
    ],
    layout: [
      section('title', 'Title', ['status', 'title', 'key']),
      section('relations', 'Relations', ['items']),
    ],
  },

  navigation_items: {
    kind: 'child', host: 'navigations', hostField: 'navigation', hostAlias: 'items', hostAliasTemplate: '{{title}}',
    icon: 'link', sort: 1, labels: ['Navigation Items', 'Navigation Item', 'Navigation Items'],
    display: ['title'], displayTemplate: '{{title}}',
    note: 'One menu entry. A parent item with an empty path renders as a group heading.',
    fields: [
      m2o('parent', 'navigation_items', { template: '{{title}}', oneField: 'children', oneTemplate: '{{title}}' }),
      str('key', { required: true, width: 'half', note: 'Stable identifier, unique within one navigation.' }),
      str('title', { required: true, translated: true, width: 'half' }),
      dropdown('kind', ['route', 'url', 'action'], { default: 'route' }),
      str('path', { width: 'half', note: 'Locale-neutral route like /exhibitions/, or the action name for kind=action.' }),
      str('url', { width: 'half', note: 'External link for kind=url.' }),
      dropdown('target', ['_self', '_blank'], { default: '_self' }),
    ],
    layout: { flat: ['status', 'navigation', 'parent', 'key', 'title', 'kind', 'path', 'url', 'target', 'children'] },
  },
}

// Many-to-many links. Table names come from mmTable(a, b); FK columns from fk().
// `owner` = sidebar parent. `sortedFrom` = the side whose list order the junction's
// `sort` column stores (conventions §2 rule 4: one side only → the column is `sort`).
export const junctions = [
  { a: 'exhibitions', b: 'venues', aliasA: 'further_venues', aliasB: 'further_exhibitions', owner: 'exhibitions', sortedFrom: 'exhibitions', note: 'Further venues of a travelling show; primary_venue stays the main one.' },
  { a: 'exhibitions', b: 'sponsors', aliasA: 'sponsors', aliasB: 'exhibitions', owner: 'sponsors', sortedFrom: 'exhibitions' },
  { a: 'persons', b: 'roles', aliasA: 'roles', aliasB: 'persons', owner: 'persons', sortedFrom: 'persons', note: 'What a person can be. A participation role must be one of these.' },
  { a: 'persons', b: 'venues', aliasA: 'venues', aliasB: 'persons', owner: 'persons', sortedFrom: 'venues', note: 'The venue represents or works with the person. Not derived from exhibitions.' },
  { a: 'persons', b: 'sponsors', aliasA: 'sponsors', aliasB: 'persons', owner: 'sponsors', sortedFrom: 'persons' },
  { a: 'locations', b: 'sponsors', aliasA: 'sponsors', aliasB: 'locations', owner: 'sponsors', sortedFrom: 'locations' },
  { a: 'sponsors', b: 'venues', aliasA: 'venues', aliasB: 'sponsors', owner: 'sponsors', sortedFrom: 'venues' },
]
```

- [ ] **Step 2: Syntax check**

Run: `node -e "import('./scripts/schema.mjs').then(m => console.log(Object.keys(m.entities).length, 'entities,', m.junctions.length, 'junctions'))"`
Expected: `10 entities, 7 junctions`.

- [ ] **Step 3: Commit**

```bash
git add directus/scripts/schema.mjs
git commit -m "Describe the PERMAPHEMERA Directus schema as data

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The builder, with tests

**Files:**
- Create: `directus/scripts/build.mjs`
- Create: `directus/scripts/build.test.mjs`

**Interfaces:**
- Consumes: `entities`, `junctions`, constants from `schema.mjs`; helpers from `naming.mjs` and `fields.mjs`.
- Produces: `buildAll()` → `{ collections: CollectionPayload[], relations: RelationPayload[] }` in creation order. `CollectionPayload = { collection, meta, schema, fields }` where every field is a clean Directus payload (no `relation`, `translated` keys). `RelationPayload = { collection, field, related_collection, meta, schema }`.

- [ ] **Step 1: Write the failing tests**

```js
// directus/scripts/build.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildAll } from './build.mjs'
import { isValidName } from './naming.mjs'

const { collections, relations } = buildAll()
const byName = Object.fromEntries(collections.map((c) => [c.collection, c]))
const fieldsOf = (name) => byName[name].fields
const field = (name, f) => fieldsOf(name).find((x) => x.field === f)

test('every collection name passes the conventions regex', () => {
  for (const c of collections) {
    if (c.collection === 'languages') continue
    assert.equal(isValidName(c.collection), true, c.collection)
  }
})

test('the expected 25 prefixed collections exist', () => {
  const names = collections.map((c) => c.collection).filter((n) => n.startsWith('pp_')).sort()
  assert.deepEqual(names, [
    'pp_archive', 'pp_exhibition_participations', 'pp_exhibition_statements', 'pp_exhibitions', 'pp_locations',
    'pp_meta', 'pp_mm__exhibitions_sponsors', 'pp_mm__exhibitions_venues', 'pp_mm__locations_sponsors',
    'pp_mm__persons_roles', 'pp_mm__persons_sponsors', 'pp_mm__persons_venues', 'pp_mm__sponsors_venues',
    'pp_navigation_items', 'pp_navigations', 'pp_persons', 'pp_roles', 'pp_sponsors',
    'pp_translations__exhibition_statements', 'pp_translations__exhibitions', 'pp_translations__locations',
    'pp_translations__navigation_items', 'pp_translations__roles', 'pp_translations__sponsors', 'pp_translations__venues',
    'pp_venues',
  ])
})

test('entities carry the six system fields; structural tables carry none', () => {
  const six = ['status', 'sort', 'user_created', 'date_created', 'user_updated', 'date_updated']
  for (const e of ['pp_exhibitions', 'pp_exhibition_statements', 'pp_navigation_items', 'pp_roles']) {
    for (const f of six) assert.ok(field(e, f), `${e}.${f}`)
  }
  for (const s of ['pp_translations__exhibitions', 'pp_mm__persons_roles']) {
    for (const f of ['status', 'user_created', 'date_created', 'user_updated', 'date_updated']) assert.equal(field(s, f), undefined, `${s}.${f}`)
  }
  assert.ok(field('pp_mm__persons_roles', 'sort'))
})

test('a main collection has exactly three top-level fields, in order', () => {
  const top = fieldsOf('pp_exhibitions').filter((f) => f.meta.group == null).sort((a, b) => a.meta.sort - b.meta.sort).map((f) => f.field)
  assert.deepEqual(top, ['ui_accordion_main', 'ui_accordion_translations', 'ui_group_system'])
  const topSponsors = fieldsOf('pp_navigations').filter((f) => f.meta.group == null).map((f) => f.field)
  assert.deepEqual(topSponsors, ['ui_accordion_main', 'ui_group_system'])
})

test('every data field of a main collection sits in a section of the main accordion', () => {
  for (const f of fieldsOf('pp_venues')) {
    if (f.field.startsWith('ui_')) continue
    assert.ok(f.meta.group, `${f.field} has no group`)
    if (f.meta.group === 'ui_group_system') continue
    if (f.field === 'translations') { assert.equal(f.meta.group, 'ui_accordion_translations'); continue }
    assert.match(f.meta.group, /^ui_group_/)
    assert.equal(field('pp_venues', f.meta.group).meta.group, 'ui_accordion_main')
  }
})

test('description is the last field of the content group', () => {
  const content = fieldsOf('pp_exhibitions').filter((f) => f.meta.group === 'ui_group_content').sort((a, b) => a.meta.sort - b.meta.sort)
  assert.equal(content.at(-1).field, 'description')
})

test('translated fields exist on the host and in the translation table with the note', () => {
  assert.ok(field('pp_exhibitions', 'title'))
  const t = field('pp_translations__exhibitions', 'title')
  assert.equal(t.meta.note, 'Translated field for pp_exhibitions.title')
  assert.equal(t.meta.required, undefined)
  assert.ok(field('pp_translations__exhibitions', 'exhibitions_id'))
  assert.ok(field('pp_translations__exhibitions', 'languages_code'))
  assert.equal(field('pp_persons', 'translations'), undefined)
})

test('a child table has the host FK hidden and CASCADE, and the host gets the alias', () => {
  const rel = relations.find((r) => r.collection === 'pp_exhibition_statements' && r.field === 'exhibition')
  assert.equal(rel.related_collection, 'pp_exhibitions')
  assert.equal(rel.schema.on_delete, 'CASCADE')
  assert.equal(rel.meta.one_field, 'statements')
  assert.equal(rel.meta.one_deselect_action, 'delete')
  assert.equal(field('pp_exhibition_statements', 'exhibition').meta.hidden, true)
  assert.equal(field('pp_exhibition_statements', 'exhibition').schema.is_nullable, false)
  assert.equal(field('pp_exhibitions', 'statements').meta.special[0], 'o2m')
})

test('junction relations: alphabetical FKs, CASCADE, aliases on both ends, sort on one side', () => {
  const j = byName['pp_mm__exhibitions_venues']
  assert.deepEqual(j.fields.map((f) => f.field), ['id', 'exhibitions_id', 'venues_id', 'sort'])
  const toExhibitions = relations.find((r) => r.collection === j.collection && r.field === 'exhibitions_id')
  const toVenues = relations.find((r) => r.collection === j.collection && r.field === 'venues_id')
  assert.equal(toExhibitions.meta.one_field, 'further_venues')
  assert.equal(toExhibitions.meta.junction_field, 'venues_id')
  assert.equal(toExhibitions.meta.sort_field, 'sort')
  assert.equal(toVenues.meta.one_field, 'further_exhibitions')
  assert.equal(toVenues.meta.sort_field, null)
  assert.equal(toVenues.schema.on_delete, 'CASCADE')
  assert.equal(field('pp_exhibitions', 'further_venues').meta.special[0], 'm2m')
  assert.equal(field('pp_venues', 'further_exhibitions').meta.options.template, '{{exhibitions_id.title}}')
})

test('no relation uses NO ACTION and audit relations are SET NULL', () => {
  for (const r of relations) assert.notEqual(r.schema?.on_delete, 'NO ACTION', `${r.collection}.${r.field}`)
  const audit = relations.find((r) => r.collection === 'pp_venues' && r.field === 'user_created')
  assert.equal(audit.related_collection, 'directus_users')
  assert.equal(audit.schema.on_delete, 'SET NULL')
})

test('self-referencing parent on navigation items points at itself with a children alias', () => {
  const rel = relations.find((r) => r.collection === 'pp_navigation_items' && r.field === 'parent')
  assert.equal(rel.related_collection, 'pp_navigation_items')
  assert.equal(rel.meta.one_field, 'children')
  assert.ok(field('pp_navigation_items', 'children'))
})

test('sidebar: mains under pp_archive, structural under their owner, contiguous sort', () => {
  assert.equal(byName['pp_exhibitions'].meta.group, 'pp_archive')
  assert.equal(byName['pp_mm__persons_roles'].meta.group, 'pp_persons')
  assert.equal(byName['pp_mm__exhibitions_sponsors'].meta.group, 'pp_sponsors')
  assert.equal(byName['pp_translations__venues'].meta.group, 'pp_venues')
  assert.equal(byName['pp_exhibition_statements'].meta.group, 'pp_exhibitions')
  const underExhibitions = collections.filter((c) => c.meta?.group === 'pp_exhibitions').sort((a, b) => a.meta.sort - b.meta.sort)
  assert.deepEqual(underExhibitions.map((c) => c.collection), ['pp_exhibition_participations', 'pp_exhibition_statements', 'pp_mm__exhibitions_venues', 'pp_translations__exhibitions'])
  assert.deepEqual(underExhibitions.map((c) => c.meta.sort), [1, 2, 3, 4])
})

test('every prefixed collection carries the colour and a label; mains carry singular/plural and archive', () => {
  for (const c of collections) {
    if (!c.collection.startsWith('pp_')) continue
    assert.equal(c.meta.color, '#a6523c', c.collection)
    assert.ok(c.meta.translations?.[0]?.translation, c.collection)
  }
  assert.equal(byName['pp_venues'].meta.translations[0].singular, 'Venue')
  assert.equal(byName['pp_venues'].meta.archive_field, 'status')
  assert.equal(byName['pp_translations__venues'].meta.translations[0].translation, 'Venues · Translations')
  assert.equal(byName['pp_mm__persons_roles'].meta.translations[0].translation, 'Persons ↔ Roles')
})

test('the builder refuses a layout that forgets a data field', () => {
  assert.throws(() => buildAll({ venues: { layout: [] } }), /not placed/)
})

test('the payloads carry no builder-only keys', () => {
  for (const c of collections) for (const f of c.fields) {
    assert.equal('relation' in f, false, `${c.collection}.${f.field}`)
    assert.equal('translated' in f, false, `${c.collection}.${f.field}`)
  }
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/build.test.mjs`
Expected: FAIL, `Cannot find module './build.mjs'`.

- [ ] **Step 3: Write the builder**

```js
// directus/scripts/build.mjs
// Turns schema.mjs into Directus API payloads. Pure: no network.
import { auditFields, intPk, label, m2o, m2mAlias, o2mAlias, sortField, statusField, translationsAlias, uiAccordion, uiGroup, uuidPk } from './fields.mjs'
import { col, fk, mmTable, squash, translationsTable } from './naming.mjs'
import { COLOR, ROOT_FOLDER, ROOT_LABEL, entities as baseEntities, junctions } from './schema.mjs'

const clone = (v) => JSON.parse(JSON.stringify(v))
const titleCase = (s) => s.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

const systemCollection = (name) => name.startsWith('directus_') || name === 'languages'
const target = (name) => (systemCollection(name) ? name : col(name))

// The template an M2M alias shows: `{{<fk>.<display columns>}}`.
const viaTemplate = (fkField, entity) => entity.display.map((c) => `{{${fkField}.${c}}}`).join(' ')

const strip = (f) => { const { relation, translated, ...clean } = f; return clean }

export function buildAll(overrides = {}) {
  const entities = clone(baseEntities)
  for (const [k, v] of Object.entries(overrides)) Object.assign(entities[k], v)

  const collections = []
  const relations = []

  // ---- root folder -------------------------------------------------------
  collections.push({ collection: col(ROOT_FOLDER), schema: null, fields: [],
    meta: { icon: 'inventory_2', color: COLOR, collapse: 'open', sort: 1, translations: label(ROOT_LABEL) } })

  // ---- languages (Directus' own shape, unprefixed) -----------------------
  collections.push({ collection: 'languages', schema: {}, meta: { icon: 'translate', sort: 3, translations: label('Languages') }, fields: [
    { field: 'code', type: 'string', meta: { interface: 'input', width: 'half', readonly: true }, schema: { is_primary_key: true, length: 255 } },
    { field: 'name', type: 'string', meta: { interface: 'input', width: 'half', required: true }, schema: { is_nullable: false } },
    { field: 'direction', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'ltr', value: 'ltr' }, { text: 'rtl', value: 'rtl' }] } }, schema: { default_value: 'ltr' } },
  ] })

  // ---- inject host FKs, aliases -------------------------------------------
  for (const [key, e] of Object.entries(entities)) {
    e.key = key
    e.aliases = []
    if (e.kind === 'child') {
      const host = entities[e.host]
      e.fields.unshift(m2o(e.hostField, e.host, { hidden: true, required: true, onDelete: 'CASCADE', oneField: e.hostAlias, oneTemplate: e.hostAliasTemplate, sortField: 'sort', template: host.displayTemplate }))
    }
  }
  // O2M aliases from every m2o that names a oneField.
  for (const e of Object.values(entities)) {
    for (const f of e.fields) {
      if (!f.relation?.oneField) continue
      const targetEntity = entities[f.relation.related]
      if (!targetEntity) throw new Error(`${e.key}.${f.field}: unknown related entity ${f.relation.related}`)
      targetEntity.aliases.push(o2mAlias(f.relation.oneField, f.relation.oneTemplate ?? e.displayTemplate))
    }
  }
  // M2M aliases from junctions.
  for (const j of junctions) {
    const [A, B] = [entities[j.a], entities[j.b]]
    A.aliases.push(m2mAlias(j.aliasA, viaTemplate(fk(j.b), B)))
    B.aliases.push(m2mAlias(j.aliasB, viaTemplate(fk(j.a), A)))
  }

  // ---- entities -----------------------------------------------------------
  const placed = (name, fields, group, startSort) => fields.map((f, i) => { f.meta.group = group; f.meta.sort = startSort + i; return f })

  for (const e of Object.values(entities)) {
    const name = col(e.key)
    const translated = e.fields.filter((f) => f.translated)
    const hasTranslations = translated.length > 0
    const data = [...e.fields, ...e.aliases]
    if (hasTranslations) data.push(translationsAlias())
    const system = [uuidPk(), sortField(), ...auditFields()]
    const status = statusField()
    const byField = Object.fromEntries([...data, status].map((f) => [f.field, f]))

    const fields = []
    let sort = 1
    if (e.kind === 'main') {
      fields.push(placed(name, [uiAccordion('main', 'Main', { start: 'first' })], null, sort++)[0])
      if (hasTranslations) fields.push(placed(name, [uiAccordion('translations', 'Translations')], null, sort++)[0])
      fields.push(placed(name, [uiGroup('system', 'System', { detail: true, start: 'closed' })], null, sort++)[0])
      const used = new Set()
      e.layout.forEach((s, i) => {
        const group = uiGroup(s.key, s.label, { detail: s.detail, start: s.start })
        fields.push(placed(name, [group], 'ui_accordion_main', i + 1)[0])
        s.fields.forEach((fname, j) => {
          const f = byField[fname]
          if (!f) throw new Error(`${name}: layout names unknown field ${fname}`)
          if (used.has(fname)) throw new Error(`${name}: field ${fname} placed twice`)
          used.add(fname)
          fields.push(placed(name, [f], group.field, j + 1)[0])
        })
      })
      for (const f of [...data, status]) {
        if (f.field === 'translations') { fields.push(placed(name, [f], 'ui_accordion_translations', 1)[0]); continue }
        if (!used.has(f.field)) throw new Error(`${name}: data field ${f.field} not placed in any layout section`)
      }
      fields.push(...placed(name, system, 'ui_group_system', 1))
    } else if (e.kind === 'child') {
      const used = new Set()
      e.layout.flat.forEach((fname, i) => {
        const f = byField[fname]
        if (!f) throw new Error(`${name}: layout names unknown field ${fname}`)
        used.add(fname)
        fields.push(placed(name, [f], null, i + 1)[0])
      })
      for (const f of [...data, status]) {
        if (f.field === 'translations') continue
        if (!used.has(f.field)) throw new Error(`${name}: data field ${f.field} not placed in the flat layout`)
      }
      let top = e.layout.flat.length + 1
      if (hasTranslations) {
        fields.push(placed(name, [uiAccordion('translations', 'Translations')], null, top++)[0])
        fields.push(placed(name, [byField.translations], 'ui_accordion_translations', 1)[0])
      }
      fields.push(placed(name, [uiGroup('system', 'System', { detail: true, start: 'closed' })], null, top++)[0])
      fields.push(...placed(name, system, 'ui_group_system', 1))
    }

    // Relations from m2o fields.
    for (const f of e.fields) {
      if (!f.relation) continue
      relations.push({ collection: name, field: f.field, related_collection: target(f.relation.related),
        meta: { one_field: f.relation.oneField, sort_field: f.relation.sortField, one_deselect_action: f.relation.oneDeselect },
        schema: { on_delete: f.relation.onDelete } })
    }
    for (const a of ['user_created', 'user_updated']) {
      relations.push({ collection: name, field: a, related_collection: 'directus_users', meta: { one_field: null, sort_field: null, one_deselect_action: 'nullify' }, schema: { on_delete: 'SET NULL' } })
    }

    collections.push({ collection: name, schema: {}, fields: fields.map(strip),
      meta: { icon: e.icon, color: COLOR, note: e.note ?? null, display_template: e.displayTemplate,
        group: e.kind === 'child' ? col(e.host) : col(ROOT_FOLDER), hidden: e.kind === 'child',
        collapse: e.kind === 'child' ? 'open' : 'closed', sort_field: 'sort', accountability: 'all',
        archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', archive_app_filter: true,
        translations: [{ language: 'en-US', translation: e.labels[0], singular: e.labels[1], plural: e.labels[2] }] } })

    // Translation table.
    if (hasTranslations) {
      const tname = translationsTable(e.key)
      const hostFk = m2o(fk(e.key), e.key, { hidden: true, required: true, onDelete: 'CASCADE', template: e.displayTemplate })
      const langFk = m2o('languages_code', 'languages', { hidden: true, required: true, onDelete: 'CASCADE', template: '{{name}}' })
      const copies = translated.map((f) => {
        const c = clone(strip(f))
        c.meta.note = `Translated field for ${name}.${f.field}`
        delete c.meta.required; delete c.meta.group; delete c.meta.sort
        c.schema.is_nullable = true; delete c.schema.is_unique
        return c
      })
      collections.push({ collection: tname, schema: {}, fields: [intPk(), strip(hostFk), strip(langFk), ...copies].map((f, i) => { f.meta.sort = i + 1; return f }),
        meta: { icon: 'translate', color: COLOR, hidden: true, collapse: 'open', group: name, display_template: null, accountability: 'all',
          translations: label(`${e.labels[0]} · Translations`) } })
      relations.push({ collection: tname, field: hostFk.field, related_collection: name,
        meta: { one_field: 'translations', junction_field: 'languages_code', sort_field: null, one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } })
      relations.push({ collection: tname, field: 'languages_code', related_collection: 'languages',
        meta: { one_field: null, junction_field: hostFk.field, sort_field: null, one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } })
    }
  }

  // ---- junctions ------------------------------------------------------------
  for (const j of junctions) {
    const name = mmTable(j.a, j.b)
    const [first, second] = [j.a, j.b].sort((x, y) => squash(x).localeCompare(squash(y))) // FK order follows the name
    const fkA = m2o(fk(first), first, { hidden: true, required: true, onDelete: 'CASCADE', template: entities[first].displayTemplate })
    const fkB = m2o(fk(second), second, { hidden: true, required: true, onDelete: 'CASCADE', template: entities[second].displayTemplate })
    const s = sortField()
    collections.push({ collection: name, schema: {}, fields: [intPk(), strip(fkA), strip(fkB), s].map((f, i) => { f.meta.sort = i + 1; return f }),
      meta: { icon: 'import_export', color: COLOR, hidden: true, collapse: 'open', group: col(j.owner), display_template: null, accountability: 'all',
        note: j.note ?? `Junction: ${j.a} ↔ ${j.b} for ${col(j.a)}.${j.aliasA} m2m`,
        translations: label(`${entities[j.a].labels[0]} ↔ ${entities[j.b].labels[0]}`) } })
    const alias = { [j.a]: j.aliasA, [j.b]: j.aliasB }
    for (const [side, other] of [[first, second], [second, first]]) {
      relations.push({ collection: name, field: fk(side), related_collection: col(side),
        meta: { one_field: alias[side], junction_field: fk(other), sort_field: j.sortedFrom === side ? 'sort' : null, one_deselect_action: 'delete' },
        schema: { on_delete: 'CASCADE' } })
    }
  }

  // ---- meta singleton ---------------------------------------------------------
  collections.push({ collection: col('meta'), schema: {}, fields: [
    uuidPk(),
    { field: 'schema_version', type: 'string', meta: { interface: 'input', readonly: true, width: 'half' }, schema: {} },
    { field: 'applied_at', type: 'timestamp', meta: { interface: 'datetime', readonly: true, width: 'half' }, schema: {} },
  ], meta: { icon: 'settings', color: COLOR, hidden: true, singleton: true, accountability: 'all', translations: label('Schema Meta') } })

  // ---- sidebar sort: contiguous within each parent -----------------------------
  const byGroup = new Map()
  for (const c of collections) {
    if (!c.meta) continue
    const g = c.meta.group ?? '(root)'
    byGroup.set(g, [...(byGroup.get(g) ?? []), c])
  }
  for (const [g, list] of byGroup) {
    if (g === '(root)') continue
    const ent = (c) => Object.values(entities).find((e) => col(e.key) === c.collection)
    const visible = list.filter((c) => !c.meta.hidden || ent(c)).sort((x, y) => (ent(x)?.sort ?? 0) - (ent(y)?.sort ?? 0) || x.collection.localeCompare(y.collection))
    const structural = list.filter((c) => c.meta.hidden && !ent(c)).sort((x, y) => x.collection.localeCompare(y.collection))
    ;[...visible, ...structural].forEach((c, i) => { c.meta.sort = i + 1 })
  }

  return { collections, relations }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/`
Expected: all naming and build tests pass (7 + 15). If `sidebar` fails on ordering, check that `entities[*].sort` values are as in `schema.mjs` (participations 1, statements 2).

- [ ] **Step 5: Commit**

```bash
git add directus/scripts/build.mjs directus/scripts/build.test.mjs
git commit -m "Build Directus collection and relation payloads from the schema data

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Static-token auth and the first-start env variables

**Files:**
- Modify: `directus/scripts/lib.mjs`
- Modify: `directus/.env.example`, `directus/.env`

**Interfaces:**
- Produces: `login(env)` → `{ base, token, api }` as before, but uses `ADMIN_TOKEN` when set and falls back to email/password.

- [ ] **Step 1: Add the variables to `.env.example`**

Append to `directus/.env.example`:

```
# First start on a fresh database: bootstrap reads these and skips the
# "who owns this project" screen. PROJECT_OWNER must be the admin email.
PROJECT_NAME=PERMAPHEMERA
PROJECT_OWNER=admin@example.com
# Do not send the owner registration or usage reports to Directus.
PROJECT_OWNER_ENABLED=false
TELEMETRY=false
# Static token for the admin user, set at bootstrap. Scripts use it instead of
# a password login. Generate with: openssl rand -hex 32
ADMIN_TOKEN=replace-with-64-hex-chars
```

- [ ] **Step 2: Add the same to `.env` with real values**

Run from `directus/`:

```bash
printf '\nPROJECT_NAME=PERMAPHEMERA\nPROJECT_OWNER=%s\nPROJECT_OWNER_ENABLED=false\nTELEMETRY=false\nADMIN_TOKEN=%s\n' \
  "$(grep '^ADMIN_EMAIL=' .env | cut -d= -f2)" "$(openssl rand -hex 32)" >> .env
grep -c "PROJECT_OWNER\|ADMIN_TOKEN" .env
```
Expected: `3`.

- [ ] **Step 3: Make `lib.mjs` prefer the static token**

Replace the `login` function body in `directus/scripts/lib.mjs`:

```js
export async function login(env) {
  const base = env.PUBLIC_URL || 'http://localhost:8077'
  let token = env.ADMIN_TOKEN

  if (!token) {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(`login failed: ${JSON.stringify(json)}`)
    token = json.data.access_token
  }

  async function api(method, path, body) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (res.status === 204) return null
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) {
      const err = new Error(`${method} ${path} -> ${res.status}: ${data?.errors?.[0]?.message ?? text}`)
      err.status = res.status
      throw err
    }
    return data?.data ?? data
  }

  // Fail early with a clear message if the token is not accepted.
  const me = await api('GET', '/users/me?fields=email')
  return { base, token, api, me }
}
```

- [ ] **Step 4: Verify**

The running instance was bootstrapped without `ADMIN_TOKEN`, so the token is not yet on the admin user. Set it once by password, then test:

```bash
node --input-type=module -e "
import { loadEnv, login } from './scripts/lib.mjs'
const env = loadEnv(); const saved = env.ADMIN_TOKEN; delete env.ADMIN_TOKEN
const { api } = await login(env)
await api('PATCH', '/users/me', { token: saved })
console.log('token stored')
"
node --input-type=module -e "import { loadEnv, login } from './scripts/lib.mjs'; const { me } = await login(loadEnv()); console.log('static token works for', me.email)"
```
Expected: `token stored`, then `static token works for <admin email>`.

- [ ] **Step 5: Commit**

```bash
git add directus/.env.example directus/scripts/lib.mjs
git commit -m "Use a static admin token in the Directus scripts and pre-set the project owner

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Apply the schema idempotently

**Files:**
- Rewrite: `directus/scripts/create-schema.mjs`

**Interfaces:**
- Consumes: `buildAll()` from `build.mjs`, `login/loadEnv` from `lib.mjs`, `SCHEMA_VERSION` from `schema.mjs`.
- Produces: a live instance with every collection, field and relation from `buildAll()`, plus `pp_meta` written. Prints `+` for created and `=` for existing lines, and `done`.

- [ ] **Step 1: Rewrite the script**

```js
// directus/scripts/create-schema.mjs
// Creates every collection, field and relation from build.mjs. Idempotent:
// existing collections, fields and relations are left alone (they are not
// updated — change the schema by resetting, see reset.sh).
//
//   node scripts/create-schema.mjs
import { buildAll } from './build.mjs'
import { loadEnv, login } from './lib.mjs'
import { SCHEMA_VERSION } from './schema.mjs'

const { api } = await login(loadEnv())
const { collections, relations } = buildAll()

async function exists(path) {
  try { await api('GET', path); return true } catch (e) { if (e.status === 403 || e.status === 404) return false; throw e }
}

for (const c of collections) {
  if (await exists(`/collections/${c.collection}`)) {
    // Add fields that are missing on an existing collection (e.g. after a schema edit).
    const live = await api('GET', `/fields/${c.collection}`)
    const liveNames = new Set(live.map((f) => f.field))
    let added = 0
    for (const f of c.fields) {
      if (liveNames.has(f.field)) continue
      await api('POST', `/fields/${c.collection}`, f)
      added += 1
    }
    console.log(`= ${c.collection}${added ? ` (+${added} fields)` : ''}`)
    continue
  }
  const payload = c.schema === null
    ? { collection: c.collection, meta: c.meta, schema: null }
    : { collection: c.collection, meta: c.meta, schema: c.schema, fields: c.fields }
  await api('POST', '/collections', payload)
  console.log(`+ ${c.collection}${c.schema === null ? ' (folder)' : ` (${c.fields.length} fields)`}`)
}

for (const r of relations) {
  if (await exists(`/relations/${r.collection}/${r.field}`)) { console.log(`= ${r.collection}.${r.field}`); continue }
  await api('POST', '/relations', r)
  console.log(`+ ${r.collection}.${r.field} -> ${r.related_collection}`)
}

await api('PATCH', '/items/pp_meta', { schema_version: SCHEMA_VERSION, applied_at: new Date().toISOString() })
console.log(`pp_meta: schema_version ${SCHEMA_VERSION}`)
console.log('done')
```

- [ ] **Step 2: Wipe the old collections and run against the live instance**

The 13 collections from the morning are dropped. They are empty, and part 2 of the design supersedes them. From `directus/`:

```bash
node --input-type=module -e "
import { loadEnv, login } from './scripts/lib.mjs'
const { api } = await login(loadEnv())
const all = await api('GET', '/collections')
const mine = all.map((c) => c.collection).filter((n) => !n.startsWith('directus_') && !n.startsWith('pp_'))
for (const n of ['locations_translations','venues_translations','artists_translations','exhibitions_translations','exhibition_statements_translations','exhibitions_artists','exhibition_statements','exhibitions','venues','locations','artists','sponsors','languages']) {
  if (mine.includes(n)) { await api('DELETE', '/collections/' + n); console.log('dropped', n) }
}
"
node scripts/create-schema.mjs
```
Expected: 13 `dropped` lines; then `+` lines for `pp_archive (folder)`, `languages`, ten entity collections, seven translation tables, seven junctions, `pp_meta`, every relation, then `pp_meta: schema_version 2026-09-14.1` and `done`. If a POST fails, the error names the collection; fix the schema data and re-run — created collections are skipped.

- [ ] **Step 3: Run it again to prove idempotency**

Run: `node scripts/create-schema.mjs | grep -c '^+'`
Expected: `0`.

- [ ] **Step 4: Prove the automatic fields and a translated participation round trip**

```bash
node --input-type=module -e "
import { loadEnv, login } from './scripts/lib.mjs'
const { api } = await login(loadEnv())
const loc = await api('POST', '/items/pp_locations', { slug: 'zz-town', title: 'Town', latitude: 1, longitude: 2, translations: [{ languages_code: 'en', description: 'x' }] })
console.log('date_created set:', Boolean(loc.date_created), '| user_created set:', Boolean(loc.user_created))
const back = await api('GET', '/items/pp_locations/' + loc.id + '?fields=title,translations.languages_code,translations.description')
console.log(JSON.stringify(back))
await api('DELETE', '/items/pp_locations/' + loc.id)
console.log('orphans:', (await api('GET', '/items/pp_translations__locations')).length)
"
```
Expected: `date_created set: true | user_created set: true`, the record with its translation, `orphans: 0`. (`languages` has no rows yet; Directus accepts the FK because SQLite does not enforce it by default. Task 7 seeds `en` and `de`.)

- [ ] **Step 5: Commit**

```bash
git add directus/scripts/create-schema.mjs
git commit -m "Create the convention-based Directus schema from the built payloads

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Seed languages, roles and navigations

**Files:**
- Create: `directus/scripts/seed.mjs`

**Interfaces:**
- Produces: rows in `languages` (`en`, `de`), `pp_roles` (`artist`, `curator`), `pp_navigations` (`main`, `footer`), `pp_navigation_items` (18). Idempotent by `code` / `slug` / `key`.

- [ ] **Step 1: Write the seed script**

```js
// directus/scripts/seed.mjs
// Reference data the site needs on day one. Safe to run twice.
//   node scripts/seed.mjs
import { loadEnv, login } from './lib.mjs'

const { api } = await login(loadEnv())

const one = async (collection, filter) => {
  const q = Object.entries(filter).map(([k, v]) => `filter[${k}][_eq]=${encodeURIComponent(v)}`).join('&')
  const rows = await api('GET', `/items/${collection}?${q}&limit=1`)
  return rows[0] ?? null
}
const ensure = async (collection, filter, data) => {
  const existing = await one(collection, filter)
  if (existing) { console.log(`= ${collection} ${JSON.stringify(filter)}`); return existing }
  const created = await api('POST', `/items/${collection}`, { ...filter, ...data })
  console.log(`+ ${collection} ${JSON.stringify(filter)}`)
  return created
}
const tr = (en, de) => [{ languages_code: 'en', title: en }, { languages_code: 'de', title: de }]

// Languages
await ensure('languages', { code: 'en' }, { name: 'English', direction: 'ltr' })
await ensure('languages', { code: 'de' }, { name: 'Deutsch', direction: 'ltr' })

// Roles
await ensure('pp_roles', { slug: 'artist' }, { status: 'published', title: 'Artist', sort: 1, translations: tr('Artist', 'Künstler:in') })
await ensure('pp_roles', { slug: 'curator' }, { status: 'published', title: 'Curator', sort: 2, translations: tr('Curator', 'Kurator:in') })

// Navigations. Titles come from the frontend locale files of 2026-09-14.
const main = await ensure('pp_navigations', { key: 'main' }, { status: 'published', title: 'Main navigation', sort: 1 })
const footer = await ensure('pp_navigations', { key: 'footer' }, { status: 'published', title: 'Footer navigation', sort: 2 })

const item = async (nav, key, en, de, opts = {}) => ensure('pp_navigation_items', { navigation: nav.id, key }, {
  status: 'published', title: en, kind: opts.kind ?? 'route', path: opts.path ?? null, url: opts.url ?? null,
  target: '_self', parent: opts.parent?.id ?? null, sort: opts.sort ?? 0, translations: tr(en, de),
})

// main
await item(main, 'exhibitions', 'Exhibitions', 'Ausstellungen', { path: '/exhibitions/', sort: 1 })
await item(main, 'artists', 'Artists', 'Künstler:innen', { path: '/artists/', sort: 2 })
await item(main, 'galleries', 'Galleries', 'Galerien', { path: '/venues/', sort: 3 })
await item(main, 'about', 'About the Project', 'Über das Projekt', { path: '/about/', sort: 4 })

// footer groups
const explore = await item(footer, 'explore', 'Explore', 'Entdecken', { sort: 1 })
const information = await item(footer, 'information', 'Information', 'Information', { sort: 2 })
const legal = await item(footer, 'legal', 'Legal', 'Rechtliches', { sort: 3 })

await item(footer, 'exhibitions', 'Exhibitions', 'Ausstellungen', { path: '/exhibitions/', parent: explore, sort: 1 })
await item(footer, 'artists', 'Artists', 'Künstler:innen', { path: '/artists/', parent: explore, sort: 2 })
await item(footer, 'galleries', 'Galleries', 'Galerien', { path: '/venues/', parent: explore, sort: 3 })

await item(footer, 'about', 'About the Project', 'Über das Projekt', { path: '/about/', parent: information, sort: 1 })
await item(footer, 'how-it-works', 'How it works', 'Wie es funktioniert', { path: '/how-it-works/', parent: information, sort: 2 })
await item(footer, 'contact', 'Contact', 'Kontakt', { path: '/contact/', parent: information, sort: 3 })

await item(footer, 'imprint', 'Imprint', 'Impressum', { path: '/imprint/', parent: legal, sort: 1 })
await item(footer, 'privacy', 'Privacy Policy', 'Datenschutzerklärung', { path: '/privacy/', parent: legal, sort: 2 })
await item(footer, 'terms', 'Terms of Use', 'Nutzungsbedingungen', { path: '/terms/', parent: legal, sort: 3 })
await item(footer, 'accessibility', 'Accessibility', 'Barrierefreiheit', { path: '/accessibility/', parent: legal, sort: 4 })
await item(footer, 'cookies', 'Cookie settings', 'Cookie-Einstellungen', { kind: 'action', path: 'cookie-settings', parent: legal, sort: 5 })

console.log('done')
```

- [ ] **Step 2: Run it twice**

Run: `node scripts/seed.mjs | grep -c '^+'` then `node scripts/seed.mjs | grep -c '^+'`
Expected: `24` then `0`.

- [ ] **Step 3: Verify the German title and the nesting through the API**

```bash
node --input-type=module -e "
import { loadEnv, login } from './scripts/lib.mjs'
const { api } = await login(loadEnv())
const rows = await api('GET', '/items/pp_navigation_items?filter[key][_eq]=cookies&fields=kind,path,parent.key,translations.languages_code,translations.title')
console.log(JSON.stringify(rows[0]))
"
```
Expected: `{"kind":"action","path":"cookie-settings","parent":{"key":"legal"},"translations":[{"languages_code":"en","title":"Cookie settings"},{"languages_code":"de","title":"Cookie-Einstellungen"}]}`.

- [ ] **Step 4: Commit**

```bash
git add directus/scripts/seed.mjs
git commit -m "Seed languages, roles and the two navigations

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Project settings and the conventions check

**Files:**
- Create: `directus/scripts/apply-settings.mjs`
- Create: `directus/scripts/check-conventions.mjs`

- [ ] **Step 1: Write `apply-settings.mjs`**

```js
// directus/scripts/apply-settings.mjs
// Project settings that are not environment variables.
//   node scripts/apply-settings.mjs
import { loadEnv, login } from './lib.mjs'
import { COLOR } from './schema.mjs'

const env = loadEnv()
const { api } = await login(env)
const settings = await api('PATCH', '/settings', {
  project_name: env.PROJECT_NAME || 'PERMAPHEMERA',
  project_descriptor: 'Exhibition archive',
  project_color: COLOR,
  default_language: 'en-US',
  project_url: 'http://localhost:4991',
})
console.log(`settings: ${settings.project_name} · ${settings.project_color} · ${settings.default_language}`)
```

- [ ] **Step 2: Write `check-conventions.mjs`**

```js
// directus/scripts/check-conventions.mjs
// Reads the LIVE schema and asserts the house rules from
// _Plans/directus-schema-conventions.md. Exit 1 on the first group of failures.
//   node scripts/check-conventions.mjs
import { loadEnv, login } from './lib.mjs'
import { isValidName } from './naming.mjs'

const { api } = await login(loadEnv())
const collections = (await api('GET', '/collections')).filter((c) => c.collection.startsWith('pp_'))
const fields = (await api('GET', '/fields')).filter((f) => f.collection.startsWith('pp_'))
const relations = (await api('GET', '/relations')).filter((r) => r.collection.startsWith('pp_'))

const failures = []
const check = (ok, msg) => { if (!ok) failures.push(msg) }

const isStructural = (n) => /^pp_(mm__|m2a__|translations__)/.test(n)
const isFolder = (c) => c.schema === null
const fieldsOf = (n) => fields.filter((f) => f.collection === n)
const has = (n, f) => fieldsOf(n).some((x) => x.field === f)
const SIX = ['status', 'sort', 'user_created', 'date_created', 'user_updated', 'date_updated']

for (const c of collections) {
  const n = c.collection
  check(isValidName(n), `name violates §1: ${n}`)
  check(c.meta?.color === '#a6523c', `missing colour: ${n}`)
  check(Boolean(c.meta?.translations?.[0]?.translation), `missing label: ${n}`)
  if (isFolder(c) || n === 'pp_meta') continue

  if (isStructural(n)) {
    for (const f of SIX.filter((x) => x !== 'sort')) check(!has(n, f), `structural table carries ${f}: ${n}`)
    check(!fieldsOf(n).some((f) => f.field.startsWith('ui_')), `structural table has layout fields: ${n}`)
    check(c.meta.hidden === true, `structural table not hidden: ${n}`)
    check(Boolean(c.meta.group), `structural table loose at root: ${n}`)
  } else {
    for (const f of SIX) check(has(n, f), `entity misses ${f}: ${n}`)
    check(c.meta.archive_field === 'status', `archive not on status: ${n}`)
    const top = fieldsOf(n).filter((f) => f.meta?.group == null).sort((a, b) => a.meta.sort - b.meta.sort).map((f) => f.field)
    if (c.meta.group === 'pp_archive') {
      const expected = has(n, 'translations') ? ['ui_accordion_main', 'ui_accordion_translations', 'ui_group_system'] : ['ui_accordion_main', 'ui_group_system']
      check(JSON.stringify(top) === JSON.stringify(expected), `main layout skeleton wrong: ${n} -> ${top.join(', ')}`)
    } else {
      check(top.at(-1) === 'ui_group_system', `child layout must end with ui_group_system: ${n}`)
    }
    const status = fieldsOf(n).find((f) => f.field === 'status')
    const values = status?.meta?.options?.choices?.map((x) => x.value).sort()
    check(JSON.stringify(values) === JSON.stringify(['archived', 'draft', 'published']), `status choices wrong: ${n}`)
  }
}

for (const r of relations) {
  check(r.schema?.on_delete !== 'NO ACTION', `NO ACTION on ${r.collection}.${r.field}`)
  if (isStructural(r.collection)) check(r.schema?.on_delete === 'CASCADE', `structural FK not CASCADE: ${r.collection}.${r.field}`)
  if (['directus_users', 'directus_files'].includes(r.related_collection)) check(r.schema?.on_delete === 'SET NULL', `system FK not SET NULL: ${r.collection}.${r.field}`)
}

// Sidebar sort contiguous per parent.
const byGroup = new Map()
for (const c of collections) byGroup.set(c.meta?.group ?? '(root)', [...(byGroup.get(c.meta?.group ?? '(root)') ?? []), c])
for (const [g, list] of byGroup) {
  if (g === '(root)') continue
  const sorts = list.map((c) => c.meta.sort).sort((a, b) => a - b)
  check(sorts.every((s, i) => s === i + 1), `sidebar sort not contiguous under ${g}: ${sorts.join(',')}`)
}

if (failures.length) {
  console.error(`Conventions check failed (${failures.length}):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`Conventions OK: ${collections.length} collections, ${fields.length} fields, ${relations.length} relations.`)
```

- [ ] **Step 3: Run both**

Run: `node scripts/apply-settings.mjs && node scripts/check-conventions.mjs`
Expected: `settings: PERMAPHEMERA · #a6523c · en-US` and `Conventions OK: 25 collections, … fields, … relations.` If a check fails, fix `schema.mjs` or `build.mjs`, then `bash scripts/reset.sh --yes` (Task 9) or drop and re-create the affected collection, and re-run.

- [ ] **Step 4: Commit**

```bash
git add directus/scripts/apply-settings.mjs directus/scripts/check-conventions.mjs
git commit -m "Add project settings and a live conventions check for Directus

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: One-command reset, snapshot, README

**Files:**
- Create: `directus/scripts/reset.sh`
- Modify: `directus/README.md`
- Regenerate: `directus/schema/snapshot.yaml`

- [ ] **Step 1: Write `reset.sh`**

```bash
#!/usr/bin/env bash
# Wipes the local SQLite database and rebuilds everything from the scripts.
# Never touches uploads/. Refuses to run without --yes.
#   bash scripts/reset.sh --yes
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${1:-}" != "--yes" ]]; then
  echo "This deletes database/data.db and rebuilds the schema and seeds."
  echo "Run again with --yes to proceed."
  exit 1
fi

docker compose down
rm -f database/data.db
docker compose up -d

echo -n "waiting for Directus"
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null http://localhost:8077/server/health; then echo " ok"; break; fi
  echo -n "."; sleep 2
done
curl -fsS -o /dev/null http://localhost:8077/server/health || { echo "Directus did not come up"; exit 1; }

node scripts/create-schema.mjs
node scripts/seed.mjs
node scripts/apply-settings.mjs
node scripts/check-conventions.mjs
node scripts/snapshot.mjs
echo "reset complete"
```

- [ ] **Step 2: Run it for real**

Run: `bash scripts/reset.sh --yes`
Expected: ends with `Conventions OK…`, `wrote …snapshot.yaml`, `reset complete`. Then open `http://localhost:8077` in a browser: the **login** screen appears, not the owner screen, and after login the sidebar shows the folder PERMAPHEMERA with Exhibitions, Venues, Persons, Locations, Sponsors, Roles, Navigations.

- [ ] **Step 3: Confirm the snapshot and the owner setting**

```bash
grep -c "^  - collection: pp_" schema/snapshot.yaml
grep -c "on_delete: NO ACTION" schema/snapshot.yaml || true
node --input-type=module -e "import { loadEnv, login } from './scripts/lib.mjs'; const { api } = await login(loadEnv()); const s = await api('GET', '/settings?fields=project_name,project_owner'); console.log(JSON.stringify(s))"
```
Expected: `25`, `0`, `{"project_name":"PERMAPHEMERA","project_owner":"<admin email>"}`.

- [ ] **Step 4: Update the README "Schema scripts" section**

Replace the "Schema scripts" section of `directus/README.md` with:

```markdown
## Schema scripts

The schema is data: `scripts/schema.mjs` describes entities, junctions and form
layouts; `scripts/naming.mjs` derives every junction, translation-table and FK
name from the conventions in `../_Plans/directus-schema-conventions.md`
(prefix `pp_`). Never create or rename a collection in the admin app.

```bash
node --test scripts/               # unit tests for naming and the builder
node scripts/create-schema.mjs     # create what is missing (idempotent)
node scripts/seed.mjs              # languages, roles, navigations (idempotent)
node scripts/apply-settings.mjs    # project name, colour, default language
node scripts/check-conventions.mjs # assert the live schema follows the rules
node scripts/snapshot.mjs          # export schema/snapshot.yaml
bash scripts/reset.sh --yes        # wipe database/data.db and run all of the above
```

A fresh database starts without any browser interaction: `PROJECT_NAME`,
`PROJECT_OWNER` and `ADMIN_TOKEN` in `.env` are read at bootstrap.

To change a field: edit `scripts/schema.mjs`, run `bash scripts/reset.sh --yes`,
then update `../frontend/app/data/`, `../frontend/app/types/content.ts` and
`../_Plans/exhibitions-plan.md` §2 in the same commit.
```

- [ ] **Step 5: Commit**

```bash
git add directus/scripts/reset.sh directus/README.md directus/schema/snapshot.yaml
git commit -m "Add a one-command Directus reset and document the schema scripts

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Rewrite the plan's schema section

**Files:**
- Modify: `_Plans/exhibitions-plan.md` §2 (lines from `## 2.` to the `---` before `## 3.`)

- [ ] **Step 1: Replace §2**

Replace the whole section with a version that lists the 25 collections of the spec's "Collections" table, the "Relation map" table, the per-collection field lists from the spec's "Fields" section, the three-value status, the six system fields, and these two paragraphs verbatim at the top:

```markdown
## 2. Production Database Schema (Directus v11)

This section is the **single living schema**. It is built by `directus/scripts/schema.mjs` (the source of truth for Directus), mirrored 1:1 by the JSON files in `frontend/app/data/` and the types in `frontend/app/types/content.ts`. Naming and layout follow `_Plans/directus-schema-conventions.md` with prefix `pp_`. The design that produced it is `docs/superpowers/specs/2026-09-14-directus-conventions-schema-design.md`.

Last reconciled: 2026-09-14. Schema version `2026-09-14.1` (see `pp_meta`).
```

Keep the "Deferred" subsection for blocks and `pp_mm__exhibitions_files__documents`. Delete the old `panoramas` / `hotspots` / `exhibitions_locations` text: `exhibitions_locations` is replaced by `pp_mm__exhibitions_venues`; the two 360° tables stay listed under "Deferred" in one line each.

- [ ] **Step 2: Update the Phase 4 tracker**

In the `PHASE 4` block, replace the four `[x]` lines with:

```
    ├── [x] Install Directus 11.17.4 locally (Docker, `directus/`, port 8077) — 2026-09-14
    ├── [x] Rebuild all collections by the pp_ conventions from `directus/scripts/schema.mjs`, incl. persons/roles/participations, sponsors, navigations — 2026-09-14
    ├── [x] Seed languages (en, de), roles and the two navigations — 2026-09-14
    ├── [ ] Rename the frontend JSON, types and resolvers to the pp_ shape; header and footer read the navigations (plan part 2)
```

- [ ] **Step 3: Commit**

```bash
git add _Plans/exhibitions-plan.md
git commit -m "Rewrite the plan's schema section to the pp_ collections

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review notes

- Spec coverage: collections (T3/T4/T6), relation map (T3/T4), fields (T3), seeds (T7), layout (T4), meta (T4), relations (T4), first start (T5/T9), scripts (T5–T9), verification 1–3 (T8/T9). Frontend and verification 4–7 are plan part 2.
- `is_indexed` on M2O schema: if the API rejects it on this version, remove it from `fields.mjs` `m2o` and note it in the commit; the rule "every FK indexed" then depends on Directus' own FK index.
- The `languages` FK is not enforced by SQLite; `seed.mjs` runs right after `create-schema.mjs` in `reset.sh`, so no real row is ever written before `en`/`de` exist.
