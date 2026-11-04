import { describe, expect, it } from 'vitest'
import { createTextureCache } from '~/utils/textureCache'

// The wheel's texture cache: it survives remounts, so its policy must hold on its own.
describe('createTextureCache', () => {
  it('loads a repeated address once', async () => {
    const calls: string[] = []
    const cache = createTextureCache({ capacity: 2, load: (url: string) => { calls.push(url); return Promise.resolve(`texture:${url}`) }, dispose: () => {} })
    expect([await cache.get('a'), await cache.get('a')]).toEqual(['texture:a', 'texture:a'])
    expect(calls).toEqual(['a'])
  })

  it('shares one request between callers at the same time', async () => {
    const pending = new Map<string, (value: string) => void>()
    const cache = createTextureCache({ capacity: 8, load: (url: string) => new Promise<string>((resolve) => pending.set(url, resolve)), dispose: () => {} })
    const both = Promise.all([cache.get('b'), cache.get('b')])
    expect(pending.size).toBe(1)
    pending.get('b')!('texture:b')
    expect(await both).toEqual(['texture:b', 'texture:b'])
  })

  it('drops and disposes the least recently used entry when full', async () => {
    const disposed: string[] = []
    const cache = createTextureCache({ capacity: 2, load: (url: string) => Promise.resolve(`texture:${url}`), dispose: (value: string) => disposed.push(value) })
    await cache.get('a'); await cache.get('b'); await cache.get('a'); await cache.get('c')
    expect(disposed).toEqual(['texture:b'])
    expect([cache.has('a'), cache.has('b'), cache.has('c'), cache.size()]).toEqual([true, false, true, 2])
  })

  it('does not keep a failed load, so it can be tried again', async () => {
    let attempts = 0
    const cache = createTextureCache({ capacity: 4, load: () => (++attempts === 1 ? Promise.reject(new Error('boom')) : Promise.resolve('texture:d')), dispose: () => {} })
    await cache.get('d').catch(() => {})
    expect(await cache.get('d')).toBe('texture:d')
    expect(attempts).toBe(2)
  })

  it('disposes everything when cleared', async () => {
    const disposed: string[] = []
    const cache = createTextureCache({ capacity: 4, load: (url: string) => Promise.resolve(`texture:${url}`), dispose: (value: string) => disposed.push(value) })
    await cache.get('e')
    cache.clear()
    expect(disposed).toContain('texture:e')
    expect([cache.size(), cache.has('e')]).toEqual([0, false])
  })
})
