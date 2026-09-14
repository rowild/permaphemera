// directus/scripts/snapshot.mjs
// Exports the current Directus schema to schema/snapshot.yaml.
// Re-apply on a fresh instance with:
//   docker compose exec directus npx directus schema apply --yes /directus/schema/snapshot.yaml
// (mount ./schema into the container first, or copy the file in with `docker cp`).

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadEnv, login } from './lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const { base, token } = await login(loadEnv())
const res = await fetch(`${base}/schema/snapshot?export=yaml`, { headers: { Authorization: `Bearer ${token}` } })
if (!res.ok) throw new Error(`snapshot failed: ${res.status} ${await res.text()}`)
const out = join(here, '..', 'schema', 'snapshot.yaml')
writeFileSync(out, await res.text())
console.log(`wrote ${out}`)
