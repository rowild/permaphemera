// directus/extensions/permaphemera-newsletter/lib.js
// The newsletter sign-up, without Directus: checks a request, builds the Brevo call and sends
// it. index.js wires it into Directus. Plan: plans/2026-11-07__newsletter.md §3.

export const TOPICS = ['new_records', 'nearby', 'closing_soon', 'project_news']
export const LANGUAGES = ['de', 'en']
export const SOURCES = ['page', 'invite']
export const BREVO_DOI_URL = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation'

const MIN_FILL_MS = 2000
const MAX_EMAIL = 254
const MAX_NAME = 100
const MAX_PAGE_URL = 300
const BREVO_TIMEOUT_MS = 8000
const EMAIL_FORM = /^[^\s@"<>]+@(?:[^\s@".<>]+\.)+[^\s@".<>]{2,}$/
const CONSENT_VERSION_FORM = /^[a-z0-9-]{1,40}$/
// C0 and C1 control characters (line breaks, NUL, …): a name is one plain line.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g

const PENDING = Object.freeze({ ok: true, state: 'pending' })
const fail = (error) => ({ ok: false, error })

const positiveInt = (value) => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  return Number.isInteger(n) && n > 0 ? n : null
}

const listOf = (value) => (Array.isArray(value) ? value : String(value ?? '').split(','))
  .map((entry) => String(entry).trim())
  .filter(Boolean)

/**
 * The Brevo key as the REST API wants it (`xkeysib-…`). Brevo's key page also offers an "MCP"
 * form, base64 of `{"api_key":"xkeysib-…"}`; both forms work here. Anything else is passed on
 * unchanged, and Brevo answers 401.
 */
export function brevoApiKey(raw) {
  const key = String(raw ?? '').trim()
  if (!key || key.startsWith('xkeysib-')) return key
  try {
    const inner = JSON.parse(Buffer.from(key, 'base64').toString('utf8'))?.api_key
    return typeof inner === 'string' && inner.trim() ? inner.trim() : key
  } catch {
    return key
  }
}

/**
 * One cheap call with the key (GET /account). Brevo switches a key off after 90 days without
 * use; directus/hetzner/brevo-keepalive.sh runs this every week, so a quiet newsletter keeps it.
 */
export async function checkBrevoKey(apiKey, fetchImpl = fetch) {
  if (!apiKey) return { ok: false, status: 0, message: 'NEWSLETTER_BREVO_API_KEY is not set' }
  try {
    const res = await fetchImpl('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: { 'api-key': apiKey, accept: 'application/json' }
    })
    if (res.ok) return { ok: true, status: res.status, message: '' }
    const text = await res.text()
    let message = text
    try { message = JSON.parse(text)?.message ?? text } catch { /* not JSON */ }
    return { ok: false, status: res.status, message: String(message).slice(0, 200) }
  } catch (error) {
    return { ok: false, status: 0, message: String(error?.message ?? error) }
  }
}

/** The endpoint's settings from the Directus environment. `ready` is false until all are set. */
export function readConfig(env = {}) {
  const config = {
    apiKey: brevoApiKey(env.NEWSLETTER_BREVO_API_KEY),
    lists: { de: positiveInt(env.NEWSLETTER_LIST_DE), en: positiveInt(env.NEWSLETTER_LIST_EN) },
    templates: { de: positiveInt(env.NEWSLETTER_TEMPLATE_DE), en: positiveInt(env.NEWSLETTER_TEMPLATE_EN) },
    siteUrl: String(env.NEWSLETTER_SITE_URL ?? '').trim().replace(/\/+$/, ''),
    allowedOrigins: listOf(env.NEWSLETTER_ALLOWED_ORIGINS).map((origin) => origin.replace(/\/+$/, ''))
  }
  config.ready = Boolean(config.apiKey && config.siteUrl
    && config.lists.de && config.lists.en && config.templates.de && config.templates.en)
  return config
}

/** "Upper Austria" → "upper-austria": the state of a town as a value for Brevo segments. */
export function stateSlug(state) {
  return String(state ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** ['a', 'b'] → '|a|b|', so a Brevo segment can ask "contains |a|". */
export const pipeList = (values) => (values.length ? `|${values.join('|')}|` : '')

const unique = (values) => [...new Set(values)]
const strings = (value) => (Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : [])

/**
 * Checks and cleans one request.
 * → { kind: 'ok', value } | { kind: 'reject', error } | { kind: 'drop' } (a bot: answer as if it worked)
 * `towns` maps each published town slug to the slug of its state.
 */
export function parseSubscription(body, { now, towns, siteUrl = 'https://permaphemera.at' }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'reject', error: 'invalid_request' }

  if (typeof body.website === 'string' && body.website.trim() !== '') return { kind: 'drop' }
  if (typeof body.startedAt !== 'number' || now - body.startedAt < MIN_FILL_MS) return { kind: 'drop' }

  if (body.consent !== true) return { kind: 'reject', error: 'missing_consent' }
  if (typeof body.consentVersion !== 'string' || !CONSENT_VERSION_FORM.test(body.consentVersion)) {
    return { kind: 'reject', error: 'invalid_request' }
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > MAX_EMAIL || !EMAIL_FORM.test(email)) return { kind: 'reject', error: 'invalid_email' }

  const topics = unique(strings(body.topics).filter((topic) => TOPICS.includes(topic)))
  if (topics.length === 0) return { kind: 'reject', error: 'missing_topic' }

  const chosenTowns = unique(strings(body.towns).filter((slug) => towns.has(slug)))
  const regions = unique(chosenTowns.map((slug) => towns.get(slug)).filter(Boolean))

  const name = typeof body.name === 'string' ? body.name.replace(CONTROL, '').trim().slice(0, MAX_NAME) : ''
  const pageUrl = typeof body.pageUrl === 'string' && body.pageUrl.length <= MAX_PAGE_URL
    && (body.pageUrl === siteUrl || body.pageUrl.startsWith(`${siteUrl}/`))
    ? body.pageUrl
    : ''

  return {
    kind: 'ok',
    value: {
      email,
      name,
      language: LANGUAGES.includes(body.language) ? body.language : 'de',
      towns: chosenTowns,
      regions,
      topics,
      consentVersion: body.consentVersion,
      source: SOURCES.includes(body.source) ? body.source : 'page',
      pageUrl
    }
  }
}

const viennaDay = (time) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(time)

/** The double-opt-in call for one cleaned request. */
export function brevoRequest(value, config, now) {
  const prefix = value.language === 'de' ? '' : `/${value.language}`
  return {
    url: BREVO_DOI_URL,
    init: {
      method: 'POST',
      headers: { 'api-key': config.apiKey, accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        email: value.email,
        includeListIds: [config.lists[value.language]],
        templateId: config.templates[value.language],
        redirectionUrl: `${config.siteUrl}${prefix}/newsletter/confirmed/`,
        attributes: {
          NL_NAME: value.name,
          NL_LANGUAGE: value.language,
          NL_TOPICS: pipeList(value.topics),
          NL_TOWNS: pipeList(value.towns),
          NL_REGIONS: pipeList(value.regions),
          NL_SOURCE: value.source,
          NL_SIGNUP_URL: value.pageUrl,
          NL_CONSENT_VERSION: value.consentVersion,
          NL_SIGNUP_DATE: viennaDay(now)
        }
      })
    }
  }
}

/** Counts tries per key (IP) in memory: `max` per `windowMs`. A restart forgets them. */
export function createRateLimiter({ max = 5, windowMs = 3_600_000 } = {}) {
  const hits = new Map()
  return {
    hit(key, now) {
      for (const [k, times] of hits) {
        const fresh = times.filter((t) => now - t < windowMs)
        if (fresh.length) hits.set(k, fresh)
        else hits.delete(k)
      }
      const times = hits.get(key) ?? []
      if (times.length >= max) return false
      hits.set(key, [...times, now])
      return true
    }
  }
}

const readJson = async (response) => {
  try { return await response.json() } catch { return {} }
}

/**
 * One sign-up from start to end. Never throws; the answer is the JSON for the browser.
 * deps: { config, now, origin, ip, loadTowns, fetch, limiter, log }
 */
export async function subscribe(body, deps) {
  const { config, now, origin, ip, loadTowns, fetch, limiter, log } = deps
  if (!config.ready) return fail('unavailable')
  if (origin && !config.allowedOrigins.includes(String(origin).replace(/\/+$/, ''))) return fail('invalid_request')

  let towns
  try {
    towns = await loadTowns()
  } catch (error) {
    log.error(`newsletter: town lookup failed: ${error?.message ?? error}`)
    return fail('upstream_error')
  }

  const parsed = parseSubscription(body, { now, towns, siteUrl: config.siteUrl })
  if (parsed.kind === 'drop') return PENDING
  if (!limiter.hit(ip || 'unknown', now)) return fail('rate_limited')
  if (parsed.kind === 'reject') return fail(parsed.error)

  const { url, init } = brevoRequest(parsed.value, config, now)
  let response
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(BREVO_TIMEOUT_MS) })
  } catch (error) {
    log.error(`newsletter: Brevo not reached: ${error?.message ?? error}`)
    return fail('upstream_error')
  }
  if (response.ok) return PENDING

  const answer = await readJson(response)
  const code = String(answer?.code ?? '')
  const message = String(answer?.message ?? '')
  if (response.status === 400 && code === 'duplicate_parameter') return PENDING
  if (response.status === 400 && /e-?mail/i.test(message)) return fail('invalid_email')

  // Status and Brevo's code only: the log never holds the address.
  log.error(`newsletter: Brevo answered ${response.status} ${code}`.trim())
  return fail('upstream_error')
}
