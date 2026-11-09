import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveCloseButton from '~/components/ArchiveCloseButton.vue'

// The one close button of the site: a drawn ×, never a text character (owner's rule,
// 2026-11-09: symbols in buttons sit exactly in the middle). The browser test measures the
// centring (test/e2e/newsletter.spec.ts).
describe('ArchiveCloseButton', () => {
  it('is a named button with a drawn icon and no text', async () => {
    const wrapper = await mountSuspended(ArchiveCloseButton, { props: { label: 'Close it' } })
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')).toBe('Close it')
    expect(button.text()).toBe('')
    expect(button.find('[aria-hidden="true"][data-part="close-icon"]').exists()).toBe(true)
  })

  it('reports clicks and can take the focus', async () => {
    const wrapper = await mountSuspended(ArchiveCloseButton, { props: { label: 'Close it' }, attachTo: document.body })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    ;(wrapper.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(wrapper.get('button').element)
    wrapper.unmount()
  })
})
