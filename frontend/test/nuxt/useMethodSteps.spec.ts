import { describe, expect, it } from 'vitest'

// The three steps from exhibition to tour, on the start page and on how it works
// (plans/2026-11-04__nuxt-optimisation-audit.md 2.9).
describe('useMethodSteps', () => {
  it('lists captured, connected, preserved with number, icon and text', async () => {
    await useRouter().push('/about/')
    const steps = useMethodSteps().value
    expect(steps.map((step) => step.number)).toEqual(['01', '02', '03'])
    expect(steps.map((step) => step.icon.split('/').at(-1))).toEqual(['captured.png', 'connected.png', 'preserved.png'])
    expect(steps[0]!.title).toBe('Aufgenommen')
  })
})
