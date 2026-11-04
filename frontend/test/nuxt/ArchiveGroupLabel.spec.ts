import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveGroupLabel from '~/components/ArchiveGroupLabel.vue'

// The small capital heading above a group of cards or names, three drifted versions before
// (plans/2026-11-04__nuxt-optimisation-audit.md 2.9).
describe('ArchiveGroupLabel', () => {
  it('is an h3 in the display face, red by default', async () => {
    const label = (await mountSuspended(ArchiveGroupLabel, { slots: { default: () => 'Galerien' } })).get('h3')
    expect(label.text()).toBe('Galerien')
    expect(label.classes()).toEqual(expect.arrayContaining(['font-display', 'text-eyebrow', 'tracking-widest', 'uppercase', 'text-archive-red']))
  })

  it('can be muted (a quieter group) and keeps an id for aria-labelledby', async () => {
    const label = (await mountSuspended(ArchiveGroupLabel, { props: { tone: 'muted' }, attrs: { id: 'exhibitions-past-title' }, slots: { default: () => 'Vergangene' } })).get('h3')
    expect(label.classes()).toContain('text-archive-copy')
    expect(label.attributes('id')).toBe('exhibitions-past-title')
  })
})
