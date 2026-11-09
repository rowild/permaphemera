import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import ArchiveModal from '~/components/ArchiveModal.vue'

// The one modal frame of the site (artist modal, newsletter modal): it covers the page, holds
// the focus, locks the page scroll and closes with ×, Escape or a click beside it.
describe('ArchiveModal', () => {
  const open = ref(false)
  const closed: string[] = []

  const Host = defineComponent({
    setup: () => () => h(ArchiveModal, {
      open: open.value,
      labelledby: 'test-modal-title',
      closeLabel: 'Close the test',
      onClose: () => {
        closed.push('close')
        open.value = false
      }
    }, () => [
      h('h2', { id: 'test-modal-title' }, 'Title'),
      h('a', { href: '/somewhere/' }, 'A link')
    ])
  })

  const mounted: { unmount: () => void }[] = []
  const mount = async () => {
    const wrapper = await mountSuspended(Host, { attachTo: document.body })
    mounted.push(wrapper)
    return wrapper
  }

  afterEach(async () => {
    open.value = false
    await nextTick()
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
    closed.length = 0
  })

  const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
  const settle = async () => {
    await nextTick()
    await nextTick()
  }

  it('renders nothing while closed', async () => {
    await mount()
    expect(dialog()).toBeNull()
  })

  it('opens as a labelled modal dialog, with the focus on its close button and the page scroll locked', async () => {
    await mount()
    open.value = true
    await settle()
    expect(dialog()?.getAttribute('aria-modal')).toBe('true')
    expect(dialog()?.getAttribute('aria-labelledby')).toBe('test-modal-title')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close the test')
    expect(document.body.style.overflow).toBe('hidden')

    open.value = false
    await settle()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes with the × button, with Escape and with a click beside the panel', async () => {
    await mount()
    open.value = true
    await settle()
    document.body.querySelector<HTMLButtonElement>('button[aria-label="Close the test"]')!.click()
    expect(closed).toEqual(['close'])

    open.value = true
    await settle()
    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(closed).toEqual(['close', 'close'])

    open.value = true
    await settle()
    dialog()!.parentElement!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(closed).toEqual(['close', 'close', 'close'])
  })

  it('keeps Tab inside the panel', async () => {
    await mount()
    open.value = true
    await settle()
    const link = document.body.querySelector<HTMLAnchorElement>('a[href="/somewhere/"]')!
    link.focus()
    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close the test')
  })
})
