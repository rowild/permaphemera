import { mkdtemp, mkdir, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FINGERPRINT_FILE, ensureFingerprint, fingerprintTour, readFingerprint } from '../../scripts/lib/tour-fingerprint.mjs'

// A tour folder's fingerprint (2026-10-29): changed or not, per tour, without
// uploading anything.
let dir = ''
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tour-fp-'))
  await writeFile(join(dir, 'tour.json'), '{"id":"t"}')
  await mkdir(join(dir, 'building_01'))
  await writeFile(join(dir, 'building_01', '01.webp'), 'pixels')
  await writeFile(join(dir, '.DS_Store'), 'junk')
})
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

describe('fingerprintTour', () => {
  it('counts every file but dotfiles and itself', async () => {
    const fp = await fingerprintTour(dir)
    expect(fp.files).toBe(2)
    expect(fp.bytes).toBe('{"id":"t"}'.length + 'pixels'.length)
    expect(fp.hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('changes when a file changes, even at the same size', async () => {
    const before = (await fingerprintTour(dir)).hash
    await writeFile(join(dir, 'building_01', '01.webp'), 'pixelz')
    expect((await fingerprintTour(dir)).hash).not.toBe(before)
  })

  it('ignores dotfiles and its own file', async () => {
    const before = (await fingerprintTour(dir)).hash
    await writeFile(join(dir, '.other'), 'x')
    await writeFile(join(dir, FINGERPRINT_FILE), '{}')
    expect((await fingerprintTour(dir)).hash).toBe(before)
  })
})

describe('ensureFingerprint', () => {
  it('writes one, and reuses it while the export is the same', async () => {
    const first = await ensureFingerprint(dir)
    expect(await readFingerprint(dir)).toEqual(first)
    await writeFile(join(dir, 'building_01', '01.webp'), 'changed but not re-exported')
    expect((await ensureFingerprint(dir)).hash).toBe(first.hash)
  })

  it('makes a new one after a new export (a newer tour.json)', async () => {
    const first = await ensureFingerprint(dir)
    await writeFile(join(dir, 'building_01', '01.webp'), 'a re-export')
    const later = new Date(Date.now() + 60_000)
    await utimes(join(dir, 'tour.json'), later, later)
    const second = await ensureFingerprint(dir)
    expect(second.hash).not.toBe(first.hash)
    expect(JSON.parse(await readFile(join(dir, FINGERPRINT_FILE), 'utf8')).hash).toBe(second.hash)
  })
})
