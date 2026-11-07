import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveCheckbox from '~/components/ArchiveCheckbox.vue'

// One checkbox row: box, title, optional note and badge. The cookie notice had three copies
// of it, the newsletter form needs it for topics, towns and the consent.
describe('ArchiveCheckbox', () => {
  it('shows title and note and follows v-model', async () => {
    const wrapper = await mountSuspended(ArchiveCheckbox, {
      props: { title: 'Neu im Archiv', note: 'Neue Ausstellungen', modelValue: false, 'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }) }
    })
    expect(wrapper.text()).toContain('Neu im Archiv')
    expect(wrapper.text()).toContain('Neue Ausstellungen')
    const box = wrapper.get('input[type="checkbox"]')
    await box.setValue(true)
    expect(wrapper.props('modelValue')).toBe(true)
    expect(wrapper.get('label').element.contains(box.element)).toBe(true)
  })

  it('can be fixed (checked and disabled) and carry a badge', async () => {
    const wrapper = await mountSuspended(ArchiveCheckbox, { props: { title: 'Notwendig', badge: 'Immer aktiv', modelValue: true, disabled: true } })
    const box = wrapper.get('input').element as HTMLInputElement
    expect(box.checked).toBe(true)
    expect(box.disabled).toBe(true)
    expect(wrapper.text()).toContain('Immer aktiv')
  })

  it('carries the value it stands for', async () => {
    const wrapper = await mountSuspended(ArchiveCheckbox, { props: { title: 'Villach', value: 'villach' } })
    expect(wrapper.get('input').attributes('value')).toBe('villach')
  })

  it('shows a half state for a group that is partly chosen', async () => {
    const wrapper = await mountSuspended(ArchiveCheckbox, { props: { title: 'Kärnten', indeterminate: true } })
    expect((wrapper.get('input').element as HTMLInputElement).indeterminate).toBe(true)
  })

  it('takes rich content in the slot, in the small text size, and passes required and describedby', async () => {
    const wrapper = await mountSuspended(ArchiveCheckbox, {
      props: { size: 'small', required: true, describedby: 'hint' },
      slots: { default: () => 'Ich möchte den Newsletter erhalten.' }
    })
    expect(wrapper.text()).toContain('Ich möchte den Newsletter erhalten.')
    const box = wrapper.get('input')
    expect(box.attributes('required')).toBeDefined()
    expect(box.attributes('aria-describedby')).toBe('hint')
    expect(wrapper.get('[data-part="title"]').classes()).toContain('text-sm')
  })
})
