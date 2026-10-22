// Empty Cloudflare's cache for permaphemera.at — run at the end of
// `pnpm deploy:hetzner`, or on its own as `pnpm cache:purge`.
// Reads CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID from the environment or
// from .env.deploy.local (see .env.deploy.example). Without them it warns and
// exits 0: the upload itself has already succeeded. A refused purge exits 1,
// so a wrong token cannot go unnoticed.
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnvFile, purgeEverything, readCloudflareSettings } from './lib/cloudflare-purge.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

let fromFile = {}
try {
  fromFile = parseEnvFile(await readFile(join(projectRoot, '.env.deploy.local'), 'utf8'))
}
catch (error) {
  if (error.code !== 'ENOENT') {
    throw error
  }
}

const settings = readCloudflareSettings({ ...fromFile, ...process.env })
if (!settings) {
  console.warn('[deploy] WARNING: Cloudflare cache NOT purged — CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are missing in .env.deploy.local (see .env.deploy.example). Replaced files may stay old for up to 4 hours.')
  process.exit(0)
}

try {
  await purgeEverything(settings)
  console.log('[deploy] Cloudflare cache purged')
}
catch (error) {
  console.error(`[deploy] Cloudflare cache purge FAILED: ${error.message}`)
  process.exit(1)
}
