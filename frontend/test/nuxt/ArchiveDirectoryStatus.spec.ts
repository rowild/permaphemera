import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveDirectoryStatus from '~/components/ArchiveDirectoryStatus.vue'

// The "x von y" line under a search: a count shows once per page, so the line shows only while a
// search or a filter is active, unless a page keeps it (owner, 2026-11-04).
describe('ArchiveDirectoryStatus', () => {
  it('shows the text and a clear button while a search is active', async () => {
    const status = await mountSuspended(ArchiveDirectoryStatus, { props: { text: '5 von 22 passen', show: true, clearLabel: 'Suche löschen' } })
    expect(status.get('[role="status"]').text()).toBe('5 von 22 passen')
    await status.get('button').trigger('click')
    expect(status.emitted('clear')).toHaveLength(1)
  })

  // Its margin stays: the first heading below the divider keeps its space (owner, 2026-11-04).
  it('shows nothing without a search, but keeps its space and the live region for the next announcement', async () => {
    const status = await mountSuspended(ArchiveDirectoryStatus, { props: { text: '22 im Archiv', show: false, clearLabel: 'Suche löschen' } })
    const region = status.get('[role="status"]')
    expect(region.attributes('aria-live')).toBe('polite')
    expect(region.text()).toBe('')
    expect(status.find('button').exists()).toBe(false)
    expect(status.classes()).not.toContain('sr-only')
    expect(status.classes()).not.toContain('flex')
  })

  it('a page can keep the line without a clear button', async () => {
    const status = await mountSuspended(ArchiveDirectoryStatus, { props: { text: '9 von 9 Einträgen' } })
    expect(status.get('[role="status"]').text()).toBe('9 von 9 Einträgen')
    expect(status.find('button').exists()).toBe(false)
    expect(status.classes()).not.toContain('sr-only')
  })
})
