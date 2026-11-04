import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

const scrollTo = async (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
  await nextTick()
}

const Probe = defineComponent({
  setup() {
    const past = useScrolledPast({ enter: 80, leave: 8 })
    return () => h('p', { 'data-past': String(past.value) })
  }
})

// The header shrinks once the page is scrolled and grows back near the top. The gap between the
// two points keeps it from flickering: shrinking moves the page up by the height it loses.
describe('useScrolledPast', () => {
  afterEach(() => scrollTo(0))

  it('turns on past the enter point and off only near the top', async () => {
    const probe = await mountSuspended(Probe)
    const past = () => probe.get('p').attributes('data-past')
    expect(past()).toBe('false')
    await scrollTo(60)
    expect(past()).toBe('false')
    await scrollTo(120)
    expect(past()).toBe('true')
    await scrollTo(40)
    expect(past()).toBe('true')
    await scrollTo(4)
    expect(past()).toBe('false')
  })

  it('starts on when the page opens scrolled down (back navigation)', async () => {
    await scrollTo(500)
    const probe = await mountSuspended(Probe)
    expect(probe.get('p').attributes('data-past')).toBe('true')
  })
})
