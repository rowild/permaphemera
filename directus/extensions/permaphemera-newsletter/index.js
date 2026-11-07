// directus/extensions/permaphemera-newsletter/index.js
// Directus endpoint: POST /newsletter/subscribe (public: https://permaphemera.at/cms/newsletter/subscribe).
// The logic lives in lib.js; this file connects it to Directus. Plan: plans/2026-11-07__newsletter.md.
import { createRateLimiter, readConfig, stateSlug, subscribe } from './lib.js'

const TOWN_CACHE_MS = 5 * 60 * 1000

export default {
  id: 'newsletter',
  handler: (router, { env, services, getSchema, logger }) => {
    const config = readConfig(env)
    const limiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 })
    let towns = { at: 0, map: null }

    if (!config.ready) logger.warn('newsletter: not configured (NEWSLETTER_* variables); sign-ups answer "unavailable"')

    // Published towns and their states. The filter, not a role, keeps drafts out, so this
    // does not depend on how the public permissions are set up.
    const loadTowns = async () => {
      const now = Date.now()
      if (towns.map && now - towns.at < TOWN_CACHE_MS) return towns.map
      const items = new services.ItemsService('pp_locations', { schema: await getSchema(), accountability: null })
      const rows = await items.readByQuery({ fields: ['slug', 'state'], filter: { status: { _eq: 'published' } }, limit: -1 })
      towns = { at: now, map: new Map(rows.map((row) => [row.slug, stateSlug(row.state)])) }
      return towns.map
    }

    router.post('/subscribe', async (req, res) => {
      const answer = await subscribe(req.body, {
        config,
        now: Date.now(),
        origin: req.get('origin'),
        ip: req.get('cf-connecting-ip') || req.ip,
        loadTowns,
        fetch: globalThis.fetch,
        limiter,
        log: logger
      })
      res.set('Cache-Control', 'no-store').json(answer)
    })
  }
}
