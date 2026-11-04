import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveEmptyState from '~/components/ArchiveEmptyState.vue'

// "Keine Treffer" with a way back, seven copies before (plans/…-audit.md 2.8).
describe('ArchiveEmptyState', () => {
  it('shows the message and a button that reports the action', async () => {
    const empty = await mountSuspended(ArchiveEmptyState, { props: { message: 'Keine Galerie passt.', actionLabel: 'Alle Galerien zeigen' } })
    expect(empty.get('p').text()).toBe('Keine Galerie passt.')
    await empty.get('button').trigger('click')
    expect(empty.emitted('action')).toHaveLength(1)
  })

  it('leads to a page instead when it has a target', async () => {
    const empty = await mountSuspended(ArchiveEmptyState, { props: { message: 'Keine kommenden Ausstellungen.', actionLabel: 'Zum Ausstellungsindex', to: '/exhibitions/' } })
    expect(empty.find('button').exists()).toBe(false)
    expect(empty.get('a').attributes('href')).toBe('/exhibitions/')
  })

  it('shows only the message without an action', async () => {
    const empty = await mountSuspended(ArchiveEmptyState, { props: { message: 'Noch keine Einträge.' } })
    expect(empty.find('button').exists()).toBe(false)
    expect(empty.find('a').exists()).toBe(false)
  })
})
