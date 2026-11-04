import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

let report: (visible: boolean) => void
class FakeObserver {
  constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) { report = (visible) => callback([{ isIntersecting: visible }]) }
  observe() {}
  disconnect() {}
}
const frames = async (count = 3) => { for (let i = 0; i < count; i++) await new Promise((resolve) => requestAnimationFrame(resolve)) }

let drawn = 0
const Wheel = defineComponent({
  setup() {
    const el = ref<HTMLElement | null>(null)
    useVisibleFrameLoop(el, () => { drawn++ }).start()
    return () => h('div', { ref: el })
  }
})

// The hero wheel drew every frame forever, also far below the fold (plans/…-audit.md 1.5).
describe('useVisibleFrameLoop', () => {
  beforeEach(() => { drawn = 0; vi.stubGlobal('IntersectionObserver', FakeObserver) })
  afterEach(() => vi.unstubAllGlobals())

  it('draws while the element is on screen and stops while it is off screen', async () => {
    const wheel = await mountSuspended(Wheel)
    report(true)
    await frames()
    expect(drawn).toBeGreaterThan(0)
    report(false)
    await frames(1)
    const paused = drawn
    await frames()
    expect(drawn).toBe(paused)
    report(true)
    await frames()
    expect(drawn).toBeGreaterThan(paused)
    wheel.unmount()
    const stopped = drawn
    await frames()
    expect(drawn).toBe(stopped)
  })
})
