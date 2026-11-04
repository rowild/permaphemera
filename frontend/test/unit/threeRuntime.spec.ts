import { describe, expect, it } from 'vitest'
import { loadThree, useThree } from '~/utils/threeRuntime'

// Three.js leaves the start page's first chunk: it loads when the wheel builds its scene
// (plans/2026-11-04__nuxt-optimisation-audit.md 1.4).
describe('threeRuntime', () => {
  it('refuses to hand out Three.js before it has loaded', () => {
    expect(() => useThree()).toThrow(/loadThree/)
  })

  it('loads Three.js once and then hands it out synchronously', async () => {
    const [first, second] = await Promise.all([loadThree(), loadThree()])
    expect(first).toBe(second)
    expect(useThree()).toBe(first)
    expect(typeof useThree().Scene).toBe('function')
  })
})
