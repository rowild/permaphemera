// Creates the PERMAPHEMERA collections in Directus from _Plans/exhibitions-plan.md §2.
// Idempotent: existing collections and relations are left alone.
//
//   node scripts/create-schema.mjs
//
// Every core collection gets the six optional system fields the Directus app
// offers when you create a collection by hand: status, sort, user_created,
// date_created, user_updated, date_updated. The "special" flags on the last
// four make Directus fill them in automatically on create and update.

import { loadEnv, login } from './lib.mjs'

const { api } = await login(loadEnv())

// ---------------------------------------------------------------------------
// Field builders. These mirror the payloads the Directus app sends.
// ---------------------------------------------------------------------------

const uuidPk = () => ({
  field: 'id', type: 'uuid',
  meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
  schema: { is_primary_key: true, length: 36, has_auto_increment: false },
})

const intPk = () => ({
  field: 'id', type: 'integer',
  meta: { hidden: true, interface: 'input', readonly: true },
  schema: { is_primary_key: true, has_auto_increment: true },
})

const statusField = () => ({
  field: 'status', type: 'string',
  meta: {
    width: 'full', interface: 'select-dropdown', display: 'labels',
    options: { choices: [
      { text: '$t:published', value: 'published' },
      { text: '$t:draft', value: 'draft' },
    ] },
    display_options: { showAsDot: true, choices: [
      { text: '$t:published', value: 'published', foreground: '#FFFFFF', background: 'var(--theme--primary)' },
      { text: '$t:draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
    ] },
  },
  schema: { default_value: 'draft', is_nullable: false },
})

const sortField = () => ({
  field: 'sort', type: 'integer',
  meta: { interface: 'input', hidden: true },
  schema: {},
})

// The four automatic fields. `special` is what drives the automatism.
const auditFields = () => [
  { field: 'user_created', type: 'uuid',
    meta: { special: ['user-created'], interface: 'select-dropdown-m2o', options: { template: '{{avatar}} {{first_name}} {{last_name}}' }, display: 'user', readonly: true, hidden: true, width: 'half' },
    schema: {} },
  { field: 'date_created', type: 'timestamp',
    meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half', display: 'datetime', display_options: { relative: true } },
    schema: {} },
  { field: 'user_updated', type: 'uuid',
    meta: { special: ['user-updated'], interface: 'select-dropdown-m2o', options: { template: '{{avatar}} {{first_name}} {{last_name}}' }, display: 'user', readonly: true, hidden: true, width: 'half' },
    schema: {} },
  { field: 'date_updated', type: 'timestamp',
    meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true, width: 'half', display: 'datetime', display_options: { relative: true } },
    schema: {} },
]

const systemFields = () => [statusField(), sortField(), ...auditFields()]

const str = (field, opts = {}) => ({
  field, type: 'string',
  meta: { interface: 'input', width: opts.width ?? 'full', note: opts.note ?? null, required: opts.required ?? false },
  schema: { is_nullable: opts.required ? false : true, is_unique: opts.unique ?? false },
})

const text = (field, opts = {}) => ({
  field, type: 'text',
  meta: { interface: opts.markdown ? 'input-rich-text-md' : 'input-multiline', note: opts.note ?? null },
  schema: { is_nullable: true },
})

const integer = (field, opts = {}) => ({
  field, type: 'integer',
  meta: { interface: 'input', width: opts.width ?? 'half', note: opts.note ?? null },
  schema: { is_nullable: true },
})

const float = (field, opts = {}) => ({
  field, type: 'float',
  meta: { interface: 'input', width: 'half', note: opts.note ?? null, required: opts.required ?? false },
  schema: { is_nullable: !opts.required },
})

const bool = (field, def = false) => ({
  field, type: 'boolean',
  meta: { interface: 'boolean', width: 'half', special: ['cast-boolean'] },
  schema: { default_value: def, is_nullable: false },
})

const date = (field, opts = {}) => ({
  field, type: 'date',
  meta: { interface: 'datetime', width: 'half', note: opts.note ?? null, required: opts.required ?? false },
  schema: { is_nullable: !opts.required },
})

const dropdown = (field, choices, opts = {}) => ({
  field, type: 'string',
  meta: { interface: 'select-dropdown', display: 'labels', width: 'half', note: opts.note ?? null,
    options: { choices: choices.map((c) => ({ text: c, value: c })), allowOther: opts.allowOther ?? false } },
  schema: { default_value: opts.default ?? null, is_nullable: opts.default ? false : true },
})

const file = (field, opts = {}) => ({
  field, type: 'uuid',
  meta: { special: ['file'], interface: opts.image ? 'file-image' : 'file', display: opts.image ? 'image' : 'file', width: 'half', note: opts.note ?? null },
  schema: { is_nullable: true },
})

const jsonArray = (field, opts = {}) => ({
  field, type: 'json',
  meta: { interface: 'input-code', options: { language: 'json' }, special: ['cast-json'], note: opts.note ?? null },
  schema: { is_nullable: true },
})

const m2o = (field, related, template, opts = {}) => ({
  field, type: related === 'languages' ? 'string' : 'uuid',
  meta: { special: ['m2o'], interface: 'select-dropdown-m2o', options: { template }, display: 'related-values', display_options: { template }, width: 'half', required: opts.required ?? false, hidden: opts.hidden ?? false },
  schema: { is_nullable: !opts.required },
})

const translationsAlias = () => ({
  field: 'translations', type: 'alias',
  meta: { special: ['translations'], interface: 'translations', options: { languageField: 'name', defaultLanguage: 'en', userLanguage: true } },
})

const o2mAlias = (field, template) => ({
  field, type: 'alias',
  meta: { special: ['o2m'], interface: 'list-o2m', options: { template }, display: 'related-values', display_options: { template } },
})

const m2mAlias = (field, template) => ({
  field, type: 'alias',
  meta: { special: ['m2m'], interface: 'list-m2m', options: { template }, display: 'related-values', display_options: { template } },
})

// ---------------------------------------------------------------------------
// Collection definitions.
// ---------------------------------------------------------------------------

const collections = [
  {
    collection: 'languages',
    meta: { icon: 'translate', note: 'Content languages. English is authored first.', display_template: '{{name}}' },
    fields: [
      { field: 'code', type: 'string', meta: { interface: 'input', width: 'half' }, schema: { is_primary_key: true, length: 255 } },
      str('name', { width: 'half', required: true }),
      dropdown('direction', ['ltr', 'rtl'], { default: 'ltr' }),
    ],
  },
  {
    collection: 'locations',
    meta: { icon: 'location_city', note: 'The geographic place: a city or town.', display_template: '{{city_name}}', sort_field: 'sort' },
    fields: [
      uuidPk(), ...systemFields(),
      str('slug', { required: true, unique: true }),
      str('city_name', { required: true }),
      str('postal_code', { width: 'half' }),
      str('state', { width: 'half' }),
      str('country', { width: 'half' }),
      float('latitude', { required: true, note: 'Town-centre approximation. SQLite has no geometry type.' }),
      float('longitude', { required: true }),
      translationsAlias(),
      o2mAlias('venues', '{{name}}'),
    ],
    translations: [text('description', { markdown: true })],
  },
  {
    collection: 'venues',
    meta: { icon: 'museum', note: 'The building an exhibition happens in.', display_template: '{{name}}', sort_field: 'sort' },
    fields: [
      uuidPk(), ...systemFields(),
      str('slug', { required: true, unique: true }),
      m2o('location_id', 'locations', '{{city_name}}', { required: true }),
      str('name', { required: true }),
      dropdown('type', ['gallery', 'museum', 'kunsthalle', 'art_cafe', 'open_air', 'forum'], { default: 'gallery', allowOther: true }),
      str('address'),
      str('website_url', { width: 'half' }),
      float('latitude', { note: 'Optional exact building pin.' }),
      float('longitude'),
      file('image', { image: true }),
      str('image_alt', { width: 'half' }),
      file('hero_image', { image: true }),
      str('hero_image_alt', { width: 'half' }),
      str('archive_number', { width: 'half', note: 'Two-digit display number, e.g. 01' }),
      bool('featured'),
      translationsAlias(),
      o2mAlias('exhibitions', '{{slug}}'),
    ],
    translations: [
      text('description'),
      str('lede'),
      jsonArray('about', { note: 'JSON array of paragraphs.' }),
      str('image_caption'),
      str('coordinate_label', { note: 'Human-readable DMS readout.' }),
    ],
  },
  {
    collection: 'artists',
    meta: { icon: 'person', note: 'People and collectives.', display_template: '{{first_name}} {{last_name}}', sort_field: 'sort' },
    fields: [
      uuidPk(), ...systemFields(),
      str('slug', { required: true, unique: true }),
      str('first_name', { width: 'half' }),
      str('last_name', { width: 'half' }),
      str('middle_initial', { width: 'half' }),
      str('artist_name', { width: 'half', note: 'Pseudonym or collective brand identity.' }),
      integer('birth_year'),
      integer('death_year'),
      str('nationality', { width: 'half' }),
      str('website_url', { width: 'half' }),
      str('instagram_handle', { width: 'half' }),
      file('profile_image', { image: true }),
      translationsAlias(),
      m2mAlias('exhibitions', '{{exhibition_id.slug}}'),
    ],
    translations: [text('biography', { markdown: true })],
  },
  {
    collection: 'exhibitions',
    meta: { icon: 'auto_awesome', note: 'The show. Highlighting is derived from dates, never stored.', display_template: '{{slug}}', sort_field: 'sort' },
    fields: [
      uuidPk(), ...systemFields(),
      str('slug', { required: true, unique: true }),
      m2o('primary_venue_id', 'venues', '{{name}}', { required: true }),
      date('start_date', { required: true }),
      date('end_date', { required: true }),
      bool('is_permanent'),
      file('image', { image: true }),
      str('image_alt', { width: 'half', note: 'English original. Translated copies live in translations.' }),
      str('opening_hours', { width: 'half', note: 'English original.' }),
      str('vernissage', { width: 'half', note: 'English original.' }),
      str('medium', { width: 'half', note: 'English original.' }),
      file('source_pdf', { note: 'The invitation or press sheet the record was derived from.' }),
      str('tour', { note: 'Root-relative folder of the exported 360° tour, e.g. /media/tours/<id>/. Empty while none is published.' }),
      dropdown('tour_status', ['available', 'restricted', 'unavailable'], { default: 'unavailable' }),
      date('tour_available_from', { note: 'Usually the day after the analog show closes. Empty means at once.' }),
      translationsAlias(),
      m2mAlias('artists', '{{artist_id.first_name}} {{artist_id.last_name}}'),
      o2mAlias('statements', '{{artist_id.last_name}}'),
    ],
    translations: [
      str('title', { required: true }),
      str('summary', { note: 'One-line teaser.' }),
      text('description', { markdown: true, note: 'Curatorial statement.' }),
      str('date_range', { width: 'half', note: 'Display form of the dates.' }),
      str('opening_hours', { width: 'half' }),
      str('vernissage', { width: 'half' }),
      str('image_alt', { width: 'half' }),
      str('medium', { width: 'half' }),
    ],
  },
  {
    collection: 'exhibition_statements',
    meta: { icon: 'format_quote', note: "An artist's words about one show.", display_template: '{{artist_id.last_name}} on {{exhibition_id.slug}}', sort_field: 'sort' },
    fields: [
      uuidPk(), ...systemFields(),
      m2o('exhibition_id', 'exhibitions', '{{slug}}', { required: true }),
      m2o('artist_id', 'artists', '{{first_name}} {{last_name}}', { required: true }),
      translationsAlias(),
    ],
    translations: [
      str('prompt', { note: 'The question asked, e.g. "How did you approach the room?"' }),
      text('statement'),
    ],
  },
  {
    collection: 'exhibitions_artists',
    meta: { icon: 'import_export', hidden: true, note: 'Junction: which artists are credited on which exhibition.', sort_field: 'sort' },
    fields: [
      intPk(),
      m2o('exhibition_id', 'exhibitions', '{{slug}}', { hidden: true }),
      m2o('artist_id', 'artists', '{{first_name}} {{last_name}}', { hidden: true }),
      sortField(),
    ],
  },
  {
    collection: 'sponsors',
    meta: { icon: 'handshake', note: 'Footer sponsor strip.', display_template: '{{name}}', sort_field: 'sort' },
    fields: [
      uuidPk(), ...systemFields(),
      str('name', { required: true }),
    ],
  },
]

// ---------------------------------------------------------------------------
// Relations. `meta.one_field` names the alias on the "one" side.
// ---------------------------------------------------------------------------

const relations = [
  // M2O
  { collection: 'venues', field: 'location_id', related_collection: 'locations', meta: { one_field: 'venues', sort_field: 'sort', one_deselect_action: 'nullify' }, schema: { on_delete: 'SET NULL' } },
  { collection: 'exhibitions', field: 'primary_venue_id', related_collection: 'venues', meta: { one_field: 'exhibitions', sort_field: 'sort', one_deselect_action: 'nullify' }, schema: { on_delete: 'SET NULL' } },
  { collection: 'exhibition_statements', field: 'exhibition_id', related_collection: 'exhibitions', meta: { one_field: 'statements', sort_field: 'sort', one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } },
  { collection: 'exhibition_statements', field: 'artist_id', related_collection: 'artists', meta: {}, schema: { on_delete: 'SET NULL' } },
  // M2M junction
  { collection: 'exhibitions_artists', field: 'exhibition_id', related_collection: 'exhibitions', meta: { one_field: 'artists', junction_field: 'artist_id', sort_field: 'sort', one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } },
  { collection: 'exhibitions_artists', field: 'artist_id', related_collection: 'artists', meta: { one_field: 'exhibitions', junction_field: 'exhibition_id', sort_field: 'sort', one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } },
]

for (const c of collections) {
  if (c.translations) {
    const t = `${c.collection}_translations`
    const idField = `${c.collection}_id`
    relations.push(
      { collection: t, field: idField, related_collection: c.collection, meta: { one_field: 'translations', junction_field: 'languages_code', one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } },
      { collection: t, field: 'languages_code', related_collection: 'languages', meta: { one_field: null, junction_field: idField }, schema: { on_delete: 'SET NULL' } },
    )
  }
  for (const f of c.fields) {
    if (f.meta?.special?.includes('file')) relations.push({ collection: c.collection, field: f.field, related_collection: 'directus_files', meta: {}, schema: { on_delete: 'SET NULL' } })
    if (f.meta?.special?.includes('user-created') || f.meta?.special?.includes('user-updated')) relations.push({ collection: c.collection, field: f.field, related_collection: 'directus_users', meta: {}, schema: { on_delete: 'NO ACTION' } })
  }
}

// ---------------------------------------------------------------------------
// Run.
// ---------------------------------------------------------------------------

async function exists(path) {
  try { await api('GET', path); return true } catch (e) { if (e.status === 403 || e.status === 404) return false; throw e }
}

async function ensureCollection(def) {
  if (await exists(`/collections/${def.collection}`)) { console.log(`= ${def.collection} (exists)`); return }
  await api('POST', '/collections', { collection: def.collection, meta: def.meta, schema: {}, fields: def.fields })
  console.log(`+ ${def.collection} (${def.fields.length} fields)`)
}

for (const c of collections) {
  await ensureCollection(c)
  if (c.translations) {
    await ensureCollection({
      collection: `${c.collection}_translations`,
      meta: { icon: 'translate', hidden: true, group: null },
      fields: [
        intPk(),
        m2o(`${c.collection}_id`, c.collection, '{{id}}', { hidden: true }),
        m2o('languages_code', 'languages', '{{name}}', { hidden: true }),
        ...c.translations,
      ],
    })
  }
}

for (const r of relations) {
  if (await exists(`/relations/${r.collection}/${r.field}`)) { console.log(`= ${r.collection}.${r.field} -> ${r.related_collection} (exists)`); continue }
  await api('POST', '/relations', r)
  console.log(`+ ${r.collection}.${r.field} -> ${r.related_collection}`)
}

// Seed the two languages the site uses.
for (const lang of [{ code: 'en', name: 'English', direction: 'ltr' }, { code: 'de', name: 'Deutsch', direction: 'ltr' }]) {
  if (await exists(`/items/languages/${lang.code}`)) continue
  await api('POST', '/items/languages', lang)
  console.log(`+ language ${lang.code}`)
}

console.log('done')
