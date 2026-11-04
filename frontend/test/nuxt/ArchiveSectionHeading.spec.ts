import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import ArchiveSectionHeading from '~/components/ArchiveSectionHeading.vue'

// The heading of a page section; ~18 copies in drifted line heights before
// (plans/2026-11-04__nuxt-optimisation-audit.md 2.5).
describe('ArchiveSectionHeading', () => {
  it('is an h2 with the text and its red accent, in the section scale', async () => {
    const heading = await mountSuspended(ArchiveSectionHeading, { attrs: { id: 'records-title' }, slots: { default: () => ['Weitere ', h('span', { class: 'text-archive-red' }, 'Einträge.')] } })
    const h2 = heading.get('h2#records-title')
    expect(h2.text()).toBe('Weitere Einträge.')
    expect(h2.classes()).toEqual(expect.arrayContaining(['text-h2', 'leading-[0.98]']))
  })

  it('has a large and a small size', async () => {
    expect((await mountSuspended(ArchiveSectionHeading, { props: { size: 'lg' }, slots: { default: () => 'x' } })).get('h2').classes()).toEqual(expect.arrayContaining(['text-h2-lg', 'font-light']))
    expect((await mountSuspended(ArchiveSectionHeading, { props: { size: 'sm' }, slots: { default: () => 'x' } })).get('h2').classes()).toContain('text-h3')
  })
})
