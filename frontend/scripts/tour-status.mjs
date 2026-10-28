// pnpm tour:status [--json] [--from <dir>]
//
// Which exported tours the website still needs (2026-10-29): every tour in
// exported/ with its fingerprint, the copy in public/media/tours/ and the
// state on the live site — new, untracked, changed or current — read over
// https, one small request per tour, past every cache. Changes nothing but
// the fingerprints of exports that lack one (scripts/lib/tour-fingerprint.mjs).
// The Tour Editor reads the --json answer for its upload list.
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readProjectPaths } from './lib/project-paths.mjs'
import { collectTourStatus, isJsonResponse } from './lib/tour-status.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toursDirectory = join(projectRoot, 'public', 'media', 'tours')
const defaultExportDirectory = resolve(projectRoot, '..', '..', '_360_GALLERIES_AND_TOURS', 'exported')
const site = (process.env.TOUR_SITE_URL || 'https://permaphemera.at').replace(/\/$/, '')

const argv = process.argv.slice(2)
const json = argv.includes('--json')
const fromIndex = argv.indexOf('--from')

async function fetchLive(id) {
  const base = `${site}/media/tours/${encodeURIComponent(id)}/`
  const ask = (file, method) => fetch(`${base}${file}?check=${Date.now()}`, { method, cache: 'no-store', signal: AbortSignal.timeout(10_000) })
  try {
    const fingerprint = await ask('fingerprint.json', 'GET')
    if (isJsonResponse(fingerprint)) {
      const value = await fingerprint.json().catch(() => null)
      if (value && typeof value.hash === 'string') return { tour: true, hash: value.hash }
    }
    return { tour: isJsonResponse(await ask('tour.json', 'HEAD')), hash: null }
  }
  catch {
    return null
  }
}

const projectPaths = await readProjectPaths()
const configuredExports = projectPaths.PANORAMA_PROJECT ? join(projectPaths.PANORAMA_PROJECT, 'exported') : null
const exportDirectory = resolve((fromIndex >= 0 ? argv[fromIndex + 1] : null) ?? process.env.TOUR_EXPORT_DIR ?? configuredExports ?? defaultExportDirectory)

const tours = await collectTourStatus({ exportDirectory, toursDirectory, fetchLive })
if (json) {
  process.stdout.write(`${JSON.stringify({ site, exportDirectory, tours })}\n`)
}
else {
  for (const t of tours) console.log(`${t.live.state.padEnd(11)} ${t.id}`)
}
