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
        if (s.key === 'content' && s.fields.at(-1) !== 'description') throw new Error(`${name}: ui_group_content must end with description, got ${s.fields.at(-1)}`)
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
