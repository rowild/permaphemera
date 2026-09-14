import { test } from 'node:test'
import assert from 'node:assert/strict'
import { col, fk, isValidName, mmParts, mmTable, squash, translationsTable } from './naming.mjs'

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

test('mmParts orders the two parent names the way mmTable orders them', () => {
  assert.deepEqual(mmParts('exhibitions', 'artists'), ['artists', 'exhibitions'])
  assert.deepEqual(mmParts('exhibition_statements', 'persons'), ['exhibition_statements', 'persons'])
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
