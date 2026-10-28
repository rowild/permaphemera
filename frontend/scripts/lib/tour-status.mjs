// Which exported tours the website still needs (2026-10-29). Pure apart from
// reading the folders; the live site is asked through an injected function,
// so the rules are tested without a network.
//
// Only tours in exported/ count: that folder is what this website publishes.
// A tour's live state compares the export's fingerprint with the live one's:
//   new        — no tour.json on the live site
//   untracked  — a live tour.json but no fingerprint (uploaded before
//                fingerprints existed; one upload starts tracking it)
//   changed    — both fingerprints, different
//   current    — both fingerprints, equal
//   unreachable — the live site did not answer
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { ensureFingerprint, readFingerprint } from './tour-fingerprint.mjs'

/** The site answers EVERY path with 200 — a missing file gets the app's HTML
 * page (its single-page fallback) — so a file is there only when the answer
 * is JSON. @param {{ ok: boolean, headers: { get(name: string): string | null } }} response */
export function isJsonResponse(response) {
  return response.ok && (response.headers.get('content-type') ?? '').includes('json')
}

/** @param {string | null} exportedHash @param {{ tour: boolean, hash: string | null } | null} live */
export function liveState(exportedHash, live) {
  if (!live) return 'unreachable'
  if (!live.tour) return 'new'
  if (!live.hash) return 'untracked'
  return live.hash === exportedHash ? 'current' : 'changed'
}

async function readTourName(dir) {
  try {
    const tour = JSON.parse(await readFile(join(dir, 'tour.json'), 'utf8'))
    return { name: typeof tour.name === 'string' ? tour.name : '', title: typeof tour.meta?.title === 'string' ? tour.meta.title : '' }
  }
  catch {
    return { name: '', title: '' }
  }
}

/**
 * Every tour in the export folder, with its fingerprint (made when missing or
 * stale), the website copy's and the live state. `fetchLive(id)` answers
 * `{ tour, hash }` or null when the site cannot be reached.
 */
export async function collectTourStatus({ exportDirectory, toursDirectory, fetchLive, concurrency = 6 }) {
  const ids = []
  for (const entry of await readdir(exportDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    try {
      await readFile(join(exportDirectory, entry.name, 'tour.json'))
      ids.push(entry.name)
    }
    catch { /* not an export: no tour.json */ }
  }
  ids.sort()
  const rows = new Array(ids.length)
  let next = 0
  async function worker() {
    while (next < ids.length) {
      const index = next++
      const id = ids[index]
      const dir = join(exportDirectory, id)
      const exported = await ensureFingerprint(dir)
      const website = await readFingerprint(join(toursDirectory, id))
      const live = await fetchLive(id)
      rows[index] = {
        id,
        ...await readTourName(dir),
        exported: { hash: exported.hash, exportedAt: exported.exportedAt, files: exported.files, bytes: exported.bytes },
        website: website ? { hash: website.hash } : null,
        live: { state: liveState(exported.hash, live), hash: live?.hash ?? null },
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker))
  return rows
}
