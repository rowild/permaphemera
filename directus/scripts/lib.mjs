// directus/scripts/lib.mjs
// Shared helpers for the Directus admin scripts. Node 24, no dependencies.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

export function loadEnv() {
  let text
  try {
    text = readFileSync(join(here, '..', '.env'), 'utf8')
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error('directus/.env is missing; run: cp .env.example .env and fill in the values')
    throw e
  }
  const env = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2]
  }
  return env
}

export async function login(env) {
  const base = env.PUBLIC_URL || 'http://localhost:8077'
  let token = env.ADMIN_TOKEN

  if (token === 'replace-with-64-hex-chars') throw new Error('ADMIN_TOKEN in .env is still the placeholder; generate one with: openssl rand -hex 32')

  if (!token) {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(`login failed: ${JSON.stringify(json)}`)
    token = json.data.access_token
  }

  async function api(method, path, body) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (res.status === 204) return null
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) {
      const err = new Error(`${method} ${path} -> ${res.status}: ${data?.errors?.[0]?.message ?? text}`)
      err.status = res.status
      throw err
    }
    return data?.data ?? data
  }

  // Fail early with a clear message if the token is not accepted.
  const me = await api('GET', '/users/me?fields=email')
  return { base, token, api, me }
}
