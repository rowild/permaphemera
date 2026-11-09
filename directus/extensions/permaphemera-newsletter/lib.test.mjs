// directus/extensions/permaphemera-newsletter/lib.test.mjs
// node --test extensions/permaphemera-newsletter/*.test.mjs (from directus/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { brevoApiKey, brevoRequest, checkBrevoKey, createRateLimiter, parseSubscription, pipeList, readConfig, stateSlug, subscribe } from './lib.js'

const NOW = Date.UTC(2026, 10, 7, 12, 0, 0)
const TOWNS = new Map([['wien', 'vienna'], ['graz', 'styria'], ['villach', 'carinthia'], ['spittal-an-der-drau', 'carinthia']])

const ENV = {
  NEWSLETTER_BREVO_API_KEY: 'xkeysib-test',
  NEWSLETTER_BREVO_LIST_DE: 3,
  NEWSLETTER_BREVO_LIST_EN: '4',
  NEWSLETTER_BREVO_TEMPLATE_DE: 5,
  NEWSLETTER_BREVO_TEMPLATE_EN: '6',
  NEWSLETTER_BREVO_SITE_URL: 'https://permaphemera.at/',
  NEWSLETTER_BREVO_ALLOWED_ORIGINS: 'https://permaphemera.at, http://localhost:4991'
}

const body = (overrides = {}) => ({
  email: '  Maria@Example.AT ',
  firstName: ' Maria ',
  lastName: ' Beispiel ',
  language: 'de',
  towns: ['wien', 'graz', 'atlantis'],
  topics: ['new_records', 'nearby', 'spam'],
  consent: true,
  consentVersion: '2026-11-nl-v1',
  source: 'page',
  pageUrl: 'https://permaphemera.at/newsletter/',
  website: '',
  startedAt: NOW - 30_000,
  ...overrides
})

// ── readConfig ────────────────────────────────────────────────────────────

test('a complete environment is ready; numbers may arrive as strings or numbers', () => {
  const config = readConfig(ENV)
  assert.equal(config.ready, true)
  assert.deepEqual(config.lists, { de: 3, en: 4 })
  assert.deepEqual(config.templates, { de: 5, en: 6 })
  assert.equal(config.siteUrl, 'https://permaphemera.at')
  assert.deepEqual(config.allowedOrigins, ['https://permaphemera.at', 'http://localhost:4991'])
})

test('the origin list may also arrive as an array (Directus splits comma values)', () => {
  assert.deepEqual(readConfig({ ...ENV, NEWSLETTER_BREVO_ALLOWED_ORIGINS: ['https://permaphemera.at'] }).allowedOrigins, ['https://permaphemera.at'])
})

test('a missing key or id leaves the endpoint unready', () => {
  assert.equal(readConfig({ ...ENV, NEWSLETTER_BREVO_API_KEY: '' }).ready, false)
  assert.equal(readConfig({ ...ENV, NEWSLETTER_BREVO_TEMPLATE_EN: undefined }).ready, false)
  assert.equal(readConfig({ ...ENV, NEWSLETTER_BREVO_LIST_DE: 'abc' }).ready, false)
  assert.equal(readConfig({}).ready, false)
})

// ── small helpers ─────────────────────────────────────────────────────────

test('state names become stable slugs', () => {
  assert.equal(stateSlug('Upper Austria'), 'upper-austria')
  assert.equal(stateSlug('Kärnten'), 'karnten')
  assert.equal(stateSlug(''), '')
  assert.equal(stateSlug(null), '')
})

test('lists are written as |a|b| so a Brevo segment can ask "contains |a|"', () => {
  assert.equal(pipeList(['a', 'b']), '|a|b|')
  assert.equal(pipeList([]), '')
})

// ── parseSubscription ─────────────────────────────────────────────────────

test('a good request is cleaned: e-mail, names, known topics, published towns and their states', () => {
  const result = parseSubscription(body(), { now: NOW, towns: TOWNS })
  assert.equal(result.kind, 'ok')
  assert.deepEqual(result.value, {
    email: 'maria@example.at',
    firstName: 'Maria',
    lastName: 'Beispiel',
    name: 'Maria Beispiel',
    language: 'de',
    towns: ['wien', 'graz'],
    regions: ['vienna', 'styria'],
    topics: ['new_records', 'nearby'],
    consentVersion: '2026-11-nl-v1',
    source: 'page',
    pageUrl: 'https://permaphemera.at/newsletter/'
  })
})

test('towns of one state give that state once', () => {
  const result = parseSubscription(body({ towns: ['villach', 'spittal-an-der-drau', 'villach'] }), { now: NOW, towns: TOWNS })
  assert.deepEqual(result.value.towns, ['villach', 'spittal-an-der-drau'])
  assert.deepEqual(result.value.regions, ['carinthia'])
})

test('a filled honeypot or a form sent within 2 seconds is dropped silently', () => {
  assert.deepEqual(parseSubscription(body({ website: 'http://spam' }), { now: NOW, towns: TOWNS }), { kind: 'drop' })
  assert.deepEqual(parseSubscription(body({ startedAt: NOW - 500 }), { now: NOW, towns: TOWNS }), { kind: 'drop' })
  assert.deepEqual(parseSubscription(body({ startedAt: 'soon' }), { now: NOW, towns: TOWNS }), { kind: 'drop' })
})

test('consent must be exactly true', () => {
  for (const consent of [false, 'true', 1, undefined]) {
    assert.deepEqual(parseSubscription(body({ consent }), { now: NOW, towns: TOWNS }), { kind: 'reject', error: 'missing_consent' })
  }
})

test('a bad e-mail address is refused', () => {
  for (const email of ['', 'maria', 'maria@', '@example.at', 'maria@example', 'ma ria@example.at', `${'a'.repeat(250)}@example.at`, 42]) {
    assert.deepEqual(parseSubscription(body({ email }), { now: NOW, towns: TOWNS }), { kind: 'reject', error: 'invalid_email' }, String(email))
  }
})

test('at least one known topic is needed', () => {
  assert.deepEqual(parseSubscription(body({ topics: [] }), { now: NOW, towns: TOWNS }), { kind: 'reject', error: 'missing_topic' })
  assert.deepEqual(parseSubscription(body({ topics: ['spam'] }), { now: NOW, towns: TOWNS }), { kind: 'reject', error: 'missing_topic' })
  assert.deepEqual(parseSubscription(body({ topics: 'nearby' }), { now: NOW, towns: TOWNS }), { kind: 'reject', error: 'missing_topic' })
})

test('a request that is not an object, or has no consent version, is invalid', () => {
  for (const value of [null, 'text', [], 7]) {
    assert.deepEqual(parseSubscription(value, { now: NOW, towns: TOWNS }), { kind: 'reject', error: 'invalid_request' })
  }
  assert.deepEqual(parseSubscription(body({ consentVersion: undefined }), { now: NOW, towns: TOWNS }), { kind: 'reject', error: 'invalid_request' })
  assert.deepEqual(parseSubscription(body({ consentVersion: '<script>' }), { now: NOW, towns: TOWNS }), { kind: 'reject', error: 'invalid_request' })
})

test('language, source, name and page fall back to safe values', () => {
  const result = parseSubscription(body({ language: 'fr', source: 'evil', firstName: 'x'.repeat(300), lastName: 'y'.repeat(300), pageUrl: 'https://evil.example/' , towns: 'wien' }), { now: NOW, towns: TOWNS })
  assert.equal(result.value.language, 'de')
  assert.equal(result.value.source, 'page')
  assert.equal(result.value.firstName.length, 100)
  assert.equal(result.value.lastName.length, 100)
  assert.equal(result.value.pageUrl, '')
  assert.deepEqual(result.value.towns, [])
  assert.equal(parseSubscription(body({ language: 'en', source: 'invite' }), { now: NOW, towns: TOWNS }).value.source, 'invite')
})

test('control characters are removed from the names', () => {
  const value = parseSubscription(body({ firstName: 'Ma\u0000ria\n', lastName: ' Bei\tspiel' }), { now: NOW, towns: TOWNS }).value
  assert.equal(value.firstName, 'Maria')
  assert.equal(value.lastName, 'Beispiel')
})

test('a page from before the two name fields sends one "name": it becomes the first name (2026-11-09)', () => {
  const value = parseSubscription(body({ firstName: undefined, lastName: undefined, name: ' Maria Beispiel ' }), { now: NOW, towns: TOWNS }).value
  assert.equal(value.firstName, 'Maria Beispiel')
  assert.equal(value.lastName, '')
  assert.equal(value.name, 'Maria Beispiel')
})

// ── brevoRequest ──────────────────────────────────────────────────────────

test('the Brevo call uses the list, template and confirmation page of the language', () => {
  const config = readConfig(ENV)
  const value = parseSubscription(body({ language: 'en' }), { now: NOW, towns: TOWNS }).value
  const { url, init } = brevoRequest(value, config, NOW)
  assert.equal(url, 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation')
  assert.equal(init.method, 'POST')
  assert.equal(init.headers['api-key'], 'xkeysib-test')
  assert.deepEqual(JSON.parse(init.body), {
    email: 'maria@example.at',
    includeListIds: [4],
    templateId: 6,
    redirectionUrl: 'https://permaphemera.at/en/newsletter/confirmed/',
    attributes: {
      FIRSTNAME: 'Maria',
      LASTNAME: 'Beispiel',
      NL_NAME: 'Maria Beispiel',
      NL_LANGUAGE: 'en',
      NL_TOPICS: '|new_records|nearby|',
      NL_TOWNS: '|wien|graz|',
      NL_REGIONS: '|vienna|styria|',
      NL_SOURCE: 'page',
      NL_SIGNUP_URL: 'https://permaphemera.at/newsletter/',
      NL_CONSENT_VERSION: '2026-11-nl-v1',
      NL_SIGNUP_DATE: '2026-11-07'
    }
  })
})

test('Brevo shows the name in its own fields; without a name none is sent (owner, 2026-11-09)', () => {
  const config = readConfig(ENV)
  const named = JSON.parse(brevoRequest(parseSubscription(body({ lastName: '' }), { now: NOW, towns: TOWNS }).value, config, NOW).init.body)
  assert.equal(named.attributes.FIRSTNAME, 'Maria')
  assert.equal('LASTNAME' in named.attributes, false)
  const nameless = JSON.parse(brevoRequest(parseSubscription(body({ firstName: '', lastName: '' }), { now: NOW, towns: TOWNS }).value, config, NOW).init.body)
  assert.equal('FIRSTNAME' in nameless.attributes, false)
  assert.equal('LASTNAME' in nameless.attributes, false)
  assert.equal(nameless.attributes.NL_NAME, '')
})

test('German subscribers confirm on the unprefixed page; the date is Vienna\'s day', () => {
  const config = readConfig(ENV)
  const value = parseSubscription(body(), { now: NOW, towns: TOWNS }).value
  const lateEvening = Date.UTC(2026, 10, 7, 23, 30, 0) // 00:30 on 8 November in Vienna
  const sent = JSON.parse(brevoRequest(value, config, lateEvening).init.body)
  assert.equal(sent.redirectionUrl, 'https://permaphemera.at/newsletter/confirmed/')
  assert.deepEqual(sent.includeListIds, [3])
  assert.equal(sent.templateId, 5)
  assert.equal(sent.attributes.NL_SIGNUP_DATE, '2026-11-08')
})

// ── createRateLimiter ─────────────────────────────────────────────────────

test('the rate limit allows 5 tries per hour and IP, then frees the IP again', () => {
  const limiter = createRateLimiter({ max: 5, windowMs: 3_600_000 })
  for (let i = 0; i < 5; i++) assert.equal(limiter.hit('1.2.3.4', NOW + i), true)
  assert.equal(limiter.hit('1.2.3.4', NOW + 10), false)
  assert.equal(limiter.hit('5.6.7.8', NOW + 10), true)
  assert.equal(limiter.hit('1.2.3.4', NOW + 3_600_001), true)
})

// ── subscribe ─────────────────────────────────────────────────────────────

const fakeFetch = (status, json = {}) => {
  const calls = []
  const fn = async (url, init) => {
    calls.push({ url, init })
    return { ok: status >= 200 && status < 300, status, json: async () => json, text: async () => JSON.stringify(json) }
  }
  fn.calls = calls
  return fn
}

const deps = (overrides = {}) => ({
  config: readConfig(ENV),
  now: NOW,
  origin: 'https://permaphemera.at',
  ip: '1.2.3.4',
  loadTowns: async () => TOWNS,
  fetch: fakeFetch(201),
  limiter: createRateLimiter({ max: 5, windowMs: 3_600_000 }),
  log: { warn: () => {}, error: () => {} },
  ...overrides
})

test('a good request goes to Brevo and answers pending', async () => {
  const d = deps()
  assert.deepEqual(await subscribe(body(), d), { ok: true, state: 'pending' })
  assert.equal(d.fetch.calls.length, 1)
})

test('without configuration nothing is sent', async () => {
  const d = deps({ config: readConfig({}) })
  assert.deepEqual(await subscribe(body(), d), { ok: false, error: 'unavailable' })
  assert.equal(d.fetch.calls.length, 0)
})

test('a foreign origin is refused; a missing origin is allowed', async () => {
  assert.deepEqual(await subscribe(body(), deps({ origin: 'https://evil.example' })), { ok: false, error: 'invalid_request' })
  assert.deepEqual(await subscribe(body(), deps({ origin: undefined })), { ok: true, state: 'pending' })
})

test('a dropped request answers pending and sends nothing', async () => {
  const d = deps()
  assert.deepEqual(await subscribe(body({ website: 'x' }), d), { ok: true, state: 'pending' })
  assert.equal(d.fetch.calls.length, 0)
})

test('the sixth try within an hour is rate limited', async () => {
  const d = deps()
  for (let i = 0; i < 5; i++) await subscribe(body(), d)
  assert.deepEqual(await subscribe(body(), d), { ok: false, error: 'rate_limited' })
  assert.equal(d.fetch.calls.length, 5)
})

test('a known address answers the same as a new one', async () => {
  const d = deps({ fetch: fakeFetch(400, { code: 'duplicate_parameter', message: 'Contact already exist' }) })
  assert.deepEqual(await subscribe(body(), d), { ok: true, state: 'pending' })
  assert.deepEqual(await subscribe(body(), deps({ fetch: fakeFetch(204) })), { ok: true, state: 'pending' })
})

test('Brevo refusing the e-mail gives invalid_email; other errors give upstream_error and a log line', async () => {
  assert.deepEqual(await subscribe(body(), deps({ fetch: fakeFetch(400, { code: 'invalid_parameter', message: 'email is not valid' }) })), { ok: false, error: 'invalid_email' })
  const lines = []
  const log = { warn: (...a) => lines.push(a), error: (...a) => lines.push(a) }
  assert.deepEqual(await subscribe(body(), deps({ log, fetch: fakeFetch(401, { code: 'unauthorized', message: 'Key not found' }) })), { ok: false, error: 'upstream_error' })
  assert.equal(lines.length, 1)
  assert.ok(!JSON.stringify(lines).includes('maria@example.at'), 'the log never holds the address')
})

test('a network failure or a failing town lookup gives upstream_error', async () => {
  const broken = async () => { throw new Error('ECONNRESET') }
  assert.deepEqual(await subscribe(body(), deps({ fetch: broken })), { ok: false, error: 'upstream_error' })
  assert.deepEqual(await subscribe(body(), deps({ loadTowns: broken })), { ok: false, error: 'upstream_error' })
})

test('brevoApiKey takes the plain key and the base64 "MCP" form of it', () => {
  assert.equal(brevoApiKey('  xkeysib-abc-def  '), 'xkeysib-abc-def')
  const mcp = Buffer.from(JSON.stringify({ api_key: 'xkeysib-abc-def' })).toString('base64')
  assert.equal(brevoApiKey(mcp), 'xkeysib-abc-def')
  assert.equal(brevoApiKey('not-a-key'), 'not-a-key', 'anything else is passed on; Brevo answers 401')
  assert.equal(brevoApiKey(undefined), '')
  assert.equal(readConfig({ ...ENV, NEWSLETTER_BREVO_API_KEY: mcp }).apiKey, 'xkeysib-abc-def')
})

test('checkBrevoKey asks /account once and reports ok, a refusal, or a network error', async () => {
  const calls = []
  const ok = await checkBrevoKey('xkeysib-k', async (url, init) => { calls.push([url, init]); return new Response('{}', { status: 200 }) })
  assert.deepEqual(ok, { ok: true, status: 200, message: '' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 'https://api.brevo.com/v3/account')
  assert.equal(calls[0][1].headers['api-key'], 'xkeysib-k')
  const refused = await checkBrevoKey('xkeysib-k', async () => new Response(JSON.stringify({ message: 'Key not found' }), { status: 401 }))
  assert.deepEqual(refused, { ok: false, status: 401, message: 'Key not found' })
  const offline = await checkBrevoKey('xkeysib-k', async () => { throw new Error('ECONNRESET') })
  assert.deepEqual(offline, { ok: false, status: 0, message: 'ECONNRESET' })
  const never = async () => { throw new Error('never called') }
  assert.deepEqual(await checkBrevoKey('', never), { ok: false, status: 0, message: 'NEWSLETTER_BREVO_API_KEY is not set' })
})
