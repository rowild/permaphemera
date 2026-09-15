// scripts/lib/archive-source.mjs
// The check scripts' view of the archive: fetched from Directus, same shape as the site's loader.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { COLLECTIONS, FILE_FIELDS, TRANSLATED } from '../../shared/archive-schema.mjs'

const projectRoot = resolve(import.meta.dirname, '..', '..')

export const readEnv = () => {
  const env = { ...process.env }
  const file = resolve(projectRoot, '.env')
  if (existsSync(file)) for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in env)) env[m[1]] = m[2]
  }
  return env
}

const env = readEnv()
export const directusUrl = (env.DIRECTUS_URL || env.NUXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8077').replace(/\/$/, '')
export const directusToken = env.DIRECTUS_TOKEN || ''

export { COLLECTIONS }

export async function directusGet(path, { token = '' } = {}) {
  let response
  try {
    response = await fetch(`${directusUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch (error) {
    throw new Error(`Directus not reachable at ${directusUrl}: ${error.message}`)
  }
  if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`)
  return (await response.json()).data
}

export async function directusPatch(path, body, token) {
  if (!token) throw new Error('DIRECTUS_TOKEN is not set in frontend/.env; the tour link needs write access')
  const response = await fetch(`${directusUrl}${path}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`)
  return (await response.json()).data
}

/**
 * Runs a check script's body and, when Directus itself is the problem, prints one clean
 * line and exits 1 instead of the full stack trace loadArchiveFromDirectus()'s error would
 * otherwise produce. Any other failure (an assertion, a bug) still surfaces in full.
 */
export async function runCheck(fn) {
  try {
    await fn()
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Directus not reachable')) {
      console.error(error.message)
      process.exit(1)
    }
    throw error
  }
}

export async function loadArchiveFromDirectus() {
  const snapshot = {}
  for (const [key, collection] of Object.entries(COLLECTIONS)) {
    const fields = TRANSLATED.has(collection) ? '*,translations.*' : '*'
    const rows = await directusGet(`/items/${collection}?fields=${encodeURIComponent(fields)}&limit=-1&sort=sort`)
    for (const field of FILE_FIELDS[collection] ?? []) for (const row of rows) row[field] = row[field] ? `${directusUrl}/assets/${row[field]}` : null
    snapshot[key] = rows
  }
  return snapshot
}
