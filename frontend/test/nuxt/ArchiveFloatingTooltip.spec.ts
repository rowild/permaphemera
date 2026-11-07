import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ArchiveFloatingTooltip from '~/components/ArchiveFloatingTooltip.vue'

// The tooltip is teleported to <body>. The caller's class (a structural marker such as
// "[ record-title-tooltip ]") must land on the tooltip, without a Vue warning per card.
describe('ArchiveFloatingTooltip', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('puts the caller\'s class on the teleported tooltip and warns about nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const anchor = document.createElement('span')
    document.body.append(anchor)
    await mountSuspended(ArchiveFloatingTooltip, {
      props: { anchor, open: true },
      attrs: { class: '[ record-title-tooltip ]' },
      slots: { default: () => 'Ein sehr langer Titel' }
    })
    const tooltip = document.body.querySelector('.archive-floating-tooltip')
    expect(tooltip?.classList.contains('record-title-tooltip')).toBe(true)
    expect(warn.mock.calls.some((call) => String(call[0]).includes('Extraneous non-props attributes'))).toBe(false)
    warn.mockRestore()
  })
})
