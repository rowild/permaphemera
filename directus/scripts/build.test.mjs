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

test('the expected 26 prefixed collections exist', () => {
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
