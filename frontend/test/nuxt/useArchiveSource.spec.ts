import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isReactive } from 'vue'
import { startArchiveLoad, takeArchiveLoad } from '~/utils/archivePreload'
import type { ArchiveSnapshot } from '~/types/content'

const venue = { id: 'v1', slug: 'parkschloessl', status: 'published', title: 'Parkschlössl' }

describe('useArchiveSource', () => {
  // The plugin already started a load when the test app booted (against no server): drop it.
  beforeEach(() => { takeArchiveLoad() })
  afterEach(() => {
    vi.unstubAllGlobals()
    clearNuxtState('archive')
    clearNuxtData('archive')
  })

  // The archive is ~830 KB of JSON that nothing changes after loading; deep reactivity made
  // every resolver pass about 8× slower (plans/2026-11-04__nuxt-optimisation-audit.md, 1.2).
  it('keeps the loaded archive out of Vue\'s deep reactivity, and still announces its arrival', async () => {
    vi.stubGlobal('fetch', async (url: string) => ({
      ok: true,
      json: async () => ({ data: url.includes('/items/pp_venues?') ? [venue] : [] })
    }))
    const ready = useArchiveReady()
    const { archive } = useArchiveSource()
    await vi.waitUntil(() => archive.value, { timeout: 3000 })

    expect(isReactive(archive.value)).toBe(false)
    expect(isReactive(archive.value!.venues[0])).toBe(false)
    expect(ready.value).toBe(true)
    expect(useArchiveSnapshot().value.venues[0]?.slug).toBe('parkschloessl')
  })

  // The plugin starts the request before the language file has loaded; the page takes it over.
  it('takes over the load the plugin started, without a second request', async () => {
    const fetch = vi.fn(async (url: string) => ({ ok: true, json: async () => ({ data: url.includes('/items/pp_venues?') ? [venue] : [] }) }))
    vi.stubGlobal('fetch', fetch)
    startArchiveLoad('http://directus.test')
    const requests = fetch.mock.calls.length
    const { archive } = useArchiveSource()
    await vi.waitUntil(() => archive.value, { timeout: 3000 })
    expect(fetch.mock.calls.length).toBe(requests)
    expect(fetch.mock.calls[0]?.[0]).toMatch(/^http:\/\/directus\.test\/items\//)
    expect((archive.value as ArchiveSnapshot).venues[0]?.slug).toBe('parkschloessl')
  })
})
