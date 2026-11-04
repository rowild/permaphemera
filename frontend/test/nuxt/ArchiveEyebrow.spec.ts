import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveEyebrow from '~/components/ArchiveEyebrow.vue'

const eyebrow = (props: Record<string, unknown> = {}) => mountSuspended(ArchiveEyebrow, { props, slots: { default: () => 'Ausstellungsort' } })

// The small capital line above a heading, ~30 copies in five drifted variants before
// (plans/2026-11-04__nuxt-optimisation-audit.md 2.5).
describe('ArchiveEyebrow', () => {
  it('shows its text in the eyebrow style, red, with the page ornament by default', async () => {
    const p = (await eyebrow()).get('p')
    expect(p.text()).toBe('Ausstellungsort')
    expect(p.classes()).toEqual(expect.arrayContaining(['eyebrow', 'text-eyebrow', 'uppercase', 'text-archive-red', 'archive-routed-eyebrow']))
  })

  it('takes the section ornament, no ornament, or the gold tone', async () => {
    expect((await eyebrow({ ornament: 'section' })).get('p').classes()).toContain('archive-section-eyebrow')
    const plain = (await eyebrow({ ornament: 'none' })).get('p').classes()
    expect(plain).not.toContain('archive-routed-eyebrow')
    expect(plain).not.toContain('archive-section-eyebrow')
    expect((await eyebrow({ tone: 'gold' })).get('p').classes()).toContain('text-archive-ochre')
  })
})
