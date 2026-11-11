import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import ArchiveHeader from '~/components/ArchiveHeader.vue'

const scrollTo = async (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
  await nextTick()
}

// Owner, 2026-11-04: the header stays at the top and shrinks to a slim bar while the page is
// scrolled (smaller text, padding and graphics), on a solid background.
describe('ArchiveHeader', () => {
  afterEach(() => scrollTo(0))

  it('is full size at the top of the page', async () => {
    const header = (await mountSuspended(ArchiveHeader)).get('header')
    expect(header.attributes('data-compact')).toBeUndefined()
    expect(header.classes()).toContain('sticky')
  })

  it('shrinks while the page is scrolled and grows back at the top', async () => {
    const wrapper = await mountSuspended(ArchiveHeader)
    await scrollTo(300)
    const header = wrapper.get('header')
    expect(header.attributes('data-compact')).toBeDefined()
    // Every part follows the mark: tagline away, smaller brand, mark and menu, solid background.
    expect(wrapper.get('[data-header-tagline]').classes().join(' ')).toMatch(/group-data-compact\/header:/)
    // The logo follows one size, the mark's (main.css .archive-brand-*; geometry in test/e2e/layout.spec.ts).
    expect(wrapper.get('[data-header-lockup]').classes().join(' ')).toMatch(/group-data-compact\/header:\[--brand-mark:/)
    // The solid background: main.css .archive-header-surface[data-compact] (checked in the browser).
    expect(header.classes()).toContain('archive-header-surface')
    await scrollTo(0)
    expect(wrapper.get('header').attributes('data-compact')).toBeUndefined()
  })
})
