import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { collectTourStatus, isJsonResponse, liveState } from '../../scripts/lib/tour-status.mjs'

// Which exported tours the website still needs (2026-10-29).
describe('liveState', () => {
  it('tells new, untracked, changed, current and unreachable apart', () => {
    expect(liveState('a', { tour: false, hash: null })).toBe('new')
    expect(liveState('a', { tour: true, hash: null })).toBe('untracked')
    expect(liveState('a', { tour: true, hash: 'b' })).toBe('changed')
    expect(liveState('a', { tour: true, hash: 'a' })).toBe('current')
    expect(liveState('a', null)).toBe('unreachable')
  })
})

describe('isJsonResponse', () => {
  const answer = (ok: boolean, type: string) => ({ ok, headers: { get: () => type } })
  it('counts a file only when the answer is JSON — the site answers a missing file with its HTML page', () => {
    expect(isJsonResponse(answer(true, 'application/json'))).toBe(true)
    expect(isJsonResponse(answer(true, 'text/html'))).toBe(false)
    expect(isJsonResponse(answer(false, 'application/json'))).toBe(false)
  })
})

describe('collectTourStatus', () => {
  let root = ''
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'tour-status-'))
    for (const id of ['b-tour', 'a-tour']) {
      await mkdir(join(root, 'exported', id), { recursive: true })
      await writeFile(join(root, 'exported', id, 'tour.json'), JSON.stringify({ name: id.toUpperCase(), meta: { title: `Title ${id}` } }))
    }
    await mkdir(join(root, 'exported', 'not-a-tour'))
    await mkdir(join(root, 'website'))
  })
  afterEach(async () => { await rm(root, { recursive: true, force: true }) })

  it('lists only the exports, sorted, with names, fingerprints and the live state', async () => {
    const rows = await collectTourStatus({
      exportDirectory: join(root, 'exported'),
      toursDirectory: join(root, 'website'),
      fetchLive: async (id: string) => (id === 'a-tour' ? { tour: true, hash: null } : { tour: false, hash: null }),
    })
    expect(rows.map((r: { id: string }) => r.id)).toEqual(['a-tour', 'b-tour'])
    expect(rows[0]).toMatchObject({ name: 'A-TOUR', title: 'Title a-tour', website: null, live: { state: 'untracked' } })
    expect(rows[1].live.state).toBe('new')
    expect(rows[0].exported.hash).toMatch(/^[0-9a-f]{64}$/)
  })
})
