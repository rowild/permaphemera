// directus/scripts/brevo-setup.mjs
// Prepares the Brevo account for the newsletter: the folder, the lists "Newsletter DE" and
// "Newsletter EN", the contact attributes the sign-up writes, and a check of the two
// double-opt-in templates. Safe to run twice: it creates only what is missing, never deletes.
//
//   DIRECTUS_ENV_FILE=.env.remote node scripts/brevo-setup.mjs --dry-run
//   DIRECTUS_ENV_FILE=.env.remote node scripts/brevo-setup.mjs
//
// The key comes from NEWSLETTER_BREVO_API_KEY (environment, else the env file); template ids
// from NEWSLETTER_TEMPLATE_DE / _EN when they are set. Plan: plans/2026-11-07__newsletter.md.
import { fileURLToPath } from 'node:url'

export const SENDER = 'newsletter@permaphemera.at'
export const FOLDER = 'PERMAPHEMERA'
export const LISTS = [
  { language: 'de', name: 'Newsletter DE' },
  { language: 'en', name: 'Newsletter EN' }
]
// Lists of values are text "|a|b|" (see the extension's lib.js), so new towns need no Brevo change.
export const ATTRIBUTES = [
  { name: 'NL_NAME', type: 'text' },
  { name: 'NL_LANGUAGE', type: 'text' },
  { name: 'NL_TOPICS', type: 'text' },
  { name: 'NL_TOWNS', type: 'text' },
  { name: 'NL_REGIONS', type: 'text' },
  { name: 'NL_SOURCE', type: 'text' },
  { name: 'NL_SIGNUP_URL', type: 'text' },
  { name: 'NL_CONSENT_VERSION', type: 'text' },
  { name: 'NL_SIGNUP_DATE', type: 'date' }
]

const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()

/** What to create, from what the account already holds. */
export function planBrevoSetup({ folders, lists, attributes }) {
  const folder = folders.find((f) => same(f.name, FOLDER))
  const conflicts = []
  const missing = ATTRIBUTES.filter((wanted) => {
    const found = attributes.find((a) => same(a.name, wanted.name))
    if (!found) return true
    if (found.type && found.type !== wanted.type) conflicts.push(`${wanted.name} is "${found.type}" in Brevo, needs "${wanted.type}"`)
    return false
  })
  return {
    folder: { name: FOLDER, id: folder?.id ?? null },
    lists: LISTS.map((l) => ({ ...l, id: lists.find((found) => same(found.name, l.name))?.id ?? null })),
    attributes: missing,
    conflicts
  }
}

/** The lines for the Directus env file. */
export function envLines(listIds, templateIds) {
  const value = (id, label) => id ?? `<id of the ${label} DOI template>`
  return [
    `NEWSLETTER_LIST_DE=${listIds.de}`,
    `NEWSLETTER_LIST_EN=${listIds.en}`,
    `NEWSLETTER_TEMPLATE_DE=${value(templateIds.de, 'German')}`,
    `NEWSLETTER_TEMPLATE_EN=${value(templateIds.en, 'English')}`
  ].join('\n')
}

/** What is wrong with one template for the double opt-in. */
export function templateProblems(template) {
  const problems = []
  const id = template.id
  if (!template.isActive) problems.push(`template ${id} is not active`)
  if (!template.doiTemplate) problems.push(`template ${id} is not a double opt-in template (tag "optin" missing)`)
  if (!/\{\{\s*doubleoptin\s*\}\}/.test(template.htmlContent ?? '')) problems.push(`template ${id} has no {{ doubleoptin }} link`)
  const from = template.sender?.email
  if (!same(from ?? '', SENDER)) problems.push(`template ${id} is sent from ${from || 'an unknown sender'}, not ${SENDER}`)
  return problems
}

// ── the run ───────────────────────────────────────────────────────────────

async function main() {
  const { loadEnv } = await import('./lib.mjs')
  const dryRun = process.argv.includes('--dry-run')
  let fileEnv = {}
  try { fileEnv = loadEnv() } catch { /* the key may come from the environment alone */ }
  const read = (name) => process.env[name] || fileEnv[name] || ''
  const { brevoApiKey } = await import('../extensions/permaphemera-newsletter/lib.js')
  const key = brevoApiKey(read('NEWSLETTER_BREVO_API_KEY'))
  if (!key) throw new Error('NEWSLETTER_BREVO_API_KEY is not set (environment or the Directus env file)')

  const brevo = async (method, path, body) => {
    const res = await fetch(`https://api.brevo.com/v3${path}`, {
      method,
      headers: { 'api-key': key, accept: 'application/json', 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${data?.message ?? text}`)
    return data
  }

  const account = await brevo('GET', '/account')
  console.log(`Brevo account: ${account.companyName ?? ''} <${account.email}>`)

  const [folders, lists, attributes] = await Promise.all([
    brevo('GET', '/contacts/folders?limit=50&offset=0').then((d) => d?.folders ?? []),
    brevo('GET', '/contacts/lists?limit=50&offset=0').then((d) => d?.lists ?? []),
    brevo('GET', '/contacts/attributes').then((d) => d?.attributes ?? [])
  ])
  const plan = planBrevoSetup({ folders, lists, attributes })
  for (const conflict of plan.conflicts) console.warn(`! ${conflict} (change it by hand in Brevo)`)

  const create = async (label, fn) => {
    if (dryRun) { console.log(`would create ${label}`); return null }
    const result = await fn()
    console.log(`created ${label}`)
    return result
  }

  let folderId = plan.folder.id
  if (!folderId) folderId = (await create(`folder ${FOLDER}`, () => brevo('POST', '/contacts/folders', { name: FOLDER })))?.id ?? null

  const listIds = {}
  for (const list of plan.lists) {
    listIds[list.language] = list.id
      ?? (await create(`list ${list.name}`, () => brevo('POST', '/contacts/lists', { name: list.name, folderId })))?.id
      ?? '<new>'
  }
  for (const attribute of plan.attributes) {
    await create(`attribute ${attribute.name} (${attribute.type})`,
      () => brevo('POST', `/contacts/attributes/normal/${attribute.name}`, { type: attribute.type }))
  }

  const templateIds = { de: Number(read('NEWSLETTER_TEMPLATE_DE')) || null, en: Number(read('NEWSLETTER_TEMPLATE_EN')) || null }
  for (const [language, id] of Object.entries(templateIds)) {
    if (!id) { console.log(`template ${language}: not set yet (NEWSLETTER_TEMPLATE_${language.toUpperCase()})`); continue }
    const problems = templateProblems(await brevo('GET', `/smtp/templates/${id}`))
    console.log(problems.length ? problems.map((p) => `! ${p}`).join('\n') : `template ${language} (${id}): ok`)
  }

  console.log(`\nFor the Directus env file:\n${envLines(listIds, templateIds)}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1) })
}
