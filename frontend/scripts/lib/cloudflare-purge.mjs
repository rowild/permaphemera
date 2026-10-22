// Emptying Cloudflare's cache for permaphemera.at (2026-10-22).
//
// The site sits behind Cloudflare, which keeps static files for up to
// 4 hours. Files whose NAME changes with their content (the Nuxt bundles)
// are never stale, and pages and tour.json are not cached at all. But a file
// replaced under the same name — tour-viewer.js / .css, a re-graded panorama,
// a rebuilt tile — kept being served old after a deploy. `pnpm deploy:hetzner`
// therefore purges the whole zone after every upload; `pnpm cache:purge` does
// the same on its own.

const API = 'https://api.cloudflare.com/client/v4'

/** KEY=value lines, the same rules scripts/deploy.mjs reads .env.deploy.local by. */
export function parseEnvFile(source) {
  const values = {}
  for (const line of source.split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/u)
    if (!match) {
      continue
    }
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1)
    }
    values[match[1]] = value
  }
  return values
}

/** The API token and zone id, or null when either is missing or blank. */
export function readCloudflareSettings(env) {
  const token = env.CLOUDFLARE_API_TOKEN?.trim()
  const zoneId = env.CLOUDFLARE_ZONE_ID?.trim()
  return token && zoneId ? { token, zoneId } : null
}

/** Ask Cloudflare to drop every cached file of the zone. Throws with
 *  Cloudflare's own reason when it refuses. */
export async function purgeEverything({ token, zoneId, fetch = globalThis.fetch }) {
  const response = await fetch(`${API}/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ purge_everything: true }),
  })
  let result = null
  try {
    result = await response.json()
  }
  catch {
    // Not JSON: fall through to the status code below.
  }
  if (!response.ok || !result?.success) {
    const reasons = (result?.errors ?? []).map(error => error.message).filter(Boolean)
    throw new Error(reasons.length ? reasons.join('; ') : `Cloudflare answered ${response.status}`)
  }
}
