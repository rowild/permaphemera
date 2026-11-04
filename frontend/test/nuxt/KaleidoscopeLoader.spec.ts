import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import KaleidoscopeLoader from '~/components/KaleidoscopeLoader.vue'

// The legend in the centre of the wheel while its images load (was text matching in
// check-kaleidoscope-preloader).
describe('KaleidoscopeLoader', () => {
  const loader = () => mountSuspended(KaleidoscopeLoader, { route: '/about/', props: { readySlices: [true, true, true, false, false, false, false, false, false, false, false, false], total: 12, activeIndex: 3, fraction: 0.456 } })

  it('reports its progress to assistive technology from the ready slices', async () => {
    const bar = (await loader()).get('[role="progressbar"]')
    expect(bar.attributes()).toMatchObject({ 'aria-valuemin': '0', 'aria-valuemax': '12', 'aria-valuenow': '3' })
    expect(bar.attributes('aria-label')).toBe('Ausstellungsbild wird geladen')
    expect(bar.attributes('aria-valuetext')).toMatch(/3/)
  })

  it('counts the image in flight in Roman numerals and shows its download percentage', async () => {
    const text = (await loader()).text()
    expect(text).toContain('IV')
    expect(text).toContain('XII')
    expect(text).toContain('46%')
  })

  it('takes no pointer input', async () => {
    expect((await loader()).get('[role="progressbar"]').classes()).toContain('pointer-events-none')
  })
})
