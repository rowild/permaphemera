// A tour folder's fingerprint (2026-10-29): what lets the Tour Editor tell,
// tour by tour, whether the website still needs an upload — without
// uploading anything. `fingerprint.json` sits in the tour folder and travels
// with it: exported/ → public/media/tours/ → the server. Comparing the
// exported copy's with the live one's answers "changed or not" in one small
// request per tour.
//
// `hash` covers every file of the tour but the fingerprint itself — its path,
// its size and its own SHA-256 — so a re-graded panorama of the same size is
// still a change. Dotfiles are skipped, as the copy into public/ skips them.
// `exportedAt` is the export's tour.json time: a new export writes a new
// tour.json, so an old fingerprint shows itself as stale and is made again.
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

export const FINGERPRINT_FILE = 'fingerprint.json'
export const FINGERPRINT_VERSION = 1

async function filesBelow(root, dir = root) {
  const files = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await filesBelow(root, path))
    else if (entry.isFile() && !(dir === root && entry.name === FINGERPRINT_FILE)) files.push(path)
  }
  return files
}

function hashFile(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(path).on('error', reject).on('data', (chunk) => hash.update(chunk)).on('end', () => resolve(hash.digest('hex')))
  })
}

/** The fingerprint of a tour folder, computed from its files. */
export async function fingerprintTour(dir) {
  const files = (await filesBelow(dir)).map((path) => ({ path, rel: relative(dir, path).split(sep).join('/') }))
  files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))
  const all = createHash('sha256')
  let bytes = 0
  for (const file of files) {
    const size = (await stat(file.path)).size
    bytes += size
    all.update(`${file.rel}\t${size}\t${await hashFile(file.path)}\n`)
  }
  return {
    version: FINGERPRINT_VERSION,
    hash: all.digest('hex'),
    files: files.length,
    bytes,
    exportedAt: (await stat(join(dir, 'tour.json'))).mtime.toISOString(),
  }
}

/** The fingerprint stored in a tour folder, or null when there is none or it cannot be read. */
export async function readFingerprint(dir) {
  try {
    const value = JSON.parse(await readFile(join(dir, FINGERPRINT_FILE), 'utf8'))
    return value && typeof value.hash === 'string' ? value : null
  }
  catch {
    return null
  }
}

/** The stored fingerprint while it belongs to the export in the folder; else a new one, written. */
export async function ensureFingerprint(dir) {
  const stored = await readFingerprint(dir)
  const exportedAt = (await stat(join(dir, 'tour.json'))).mtime.toISOString()
  if (stored && stored.version === FINGERPRINT_VERSION && stored.exportedAt === exportedAt) return stored
  const fresh = await fingerprintTour(dir)
  await writeFile(join(dir, FINGERPRINT_FILE), `${JSON.stringify(fresh, null, 2)}\n`)
  return fresh
}
