import { describe, expect, it } from 'vitest'
import { parseEnvFile, purgeEverything, readCloudflareSettings } from '../../scripts/lib/cloudflare-purge.mjs'

// permaphemera.at sits behind Cloudflare, which keeps files with an unchanged
// name (tour-viewer.js, a re-graded panorama) for up to 4 hours. The deploy
// therefore empties Cloudflare's cache after every upload (2026-10-22).
describe('parseEnvFile', () => {
  it('reads KEY=value lines, strips quotes, skips comments and blanks', () => {
    expect(parseEnvFile('# note\nCLOUDFLARE_ZONE_ID=abc\n\nCLOUDFLARE_PURGE_TOKEN = "t0k"\n')).toEqual({
      CLOUDFLARE_ZONE_ID: 'abc',
      CLOUDFLARE_PURGE_TOKEN: 't0k',
    })
  })
})

describe('readCloudflareSettings', () => {
  it('returns the token and zone when both are set', () => {
    expect(readCloudflareSettings({ CLOUDFLARE_PURGE_TOKEN: 't', CLOUDFLARE_ZONE_ID: 'z' })).toEqual({ token: 't', zoneId: 'z' })
  })
  it('returns null when either is missing or blank', () => {
    expect(readCloudflareSettings({ CLOUDFLARE_PURGE_TOKEN: 't' })).toBeNull()
    expect(readCloudflareSettings({ CLOUDFLARE_PURGE_TOKEN: ' ', CLOUDFLARE_ZONE_ID: 'z' })).toBeNull()
  })
  // The generic name is what wrangler and other Cloudflare tools read, so a
  // shell may export a DIFFERENT token under it (2026-10-22: ~/.zprofile did,
  // and the environment beat .env.deploy.local). The purge never reads it.
  it('ignores the generic CLOUDFLARE_API_TOKEN other tools export', () => {
    expect(readCloudflareSettings({ CLOUDFLARE_API_TOKEN: 'other', CLOUDFLARE_ZONE_ID: 'z' })).toBeNull()
    expect(readCloudflareSettings({ CLOUDFLARE_API_TOKEN: 'other', CLOUDFLARE_PURGE_TOKEN: 't', CLOUDFLARE_ZONE_ID: 'z' })).toEqual({ token: 't', zoneId: 'z' })
  })
})

describe('purgeEverything', () => {
  it('asks Cloudflare to drop every cached file of the zone', async () => {
    const calls: { url: string, init: RequestInit }[] = []
    const fetch = async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      return new Response(JSON.stringify({ success: true, errors: [] }), { status: 200 })
    }
    await purgeEverything({ token: 'tok', zoneId: 'zone1', fetch })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.cloudflare.com/client/v4/zones/zone1/purge_cache')
    expect(calls[0].init.method).toBe('POST')
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ purge_everything: true })
  })

  it('fails with Cloudflare’s own reason when it refuses', async () => {
    const fetch = async () => new Response(JSON.stringify({ success: false, errors: [{ code: 10000, message: 'Authentication error' }] }), { status: 403 })
    await expect(purgeEverything({ token: 'bad', zoneId: 'zone1', fetch })).rejects.toThrow('Authentication error')
  })
})
