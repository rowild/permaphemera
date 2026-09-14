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
  base('user_created', 'uuid', { special: ['user-created'], interface: 'select-dropdown-m2o', options: { template: '{{avatar}} {{first_name}} {{last_name}}' }, display: 'user', readonly: true, width: 'half' }, { is_indexed: true }),
  base('date_created', 'timestamp', { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half', display: 'datetime', display_options: { relative: true } }, { is_indexed: true }),
  base('user_updated', 'uuid', { special: ['user-updated'], interface: 'select-dropdown-m2o', options: { template: '{{avatar}} {{first_name}} {{last_name}}' }, display: 'user', readonly: true, width: 'half' }, { is_indexed: true }),
  base('date_updated', 'timestamp', { special: ['date-updated'], interface: 'datetime', readonly: true, width: 'half', display: 'datetime', display_options: { relative: true } }, { is_indexed: true }),
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
    { is_nullable: true, is_indexed: true })
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
