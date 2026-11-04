import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import DefaultLayout from '~/layouts/default.vue'

const page = (text = 'Seiteninhalt') => defineComponent({ render: () => h('p', { class: 'page-content' }, text) })
const layout = (route: string) => mountSuspended(DefaultLayout, { route, slots: { default: page() } })

// One page frame for every page except the start page (plans/2026-11-04__nuxt-optimisation-audit.md 2.1).
describe('default layout', () => {
  it('puts header, main content and footer side by side, so each is its own landmark', async () => {
    const frame = await layout('/about/')
    const main = frame.get('main#main-content')
    expect(main.find('.page-content').exists()).toBe(true)
    expect(main.find('header').exists()).toBe(false)
    expect(main.find('footer').exists()).toBe(false)
    expect(frame.find('header').exists()).toBe(true)
    expect(frame.find('footer').exists()).toBe(true)
  })

  it('marks the menu item the page belongs to (page meta navActive)', async () => {
    // The links themselves come from Directus; the layout's part is to hand the item to the header.
    expect((await layout('/exhibitions/')).findComponent({ name: 'ArchiveHeader' }).props('active')).toBe('exhibitions')
    expect((await layout('/about/')).findComponent({ name: 'ArchiveHeader' }).props('active')).toBe('about')
  })

  it('lets a page choose its menu item at runtime (a person page: artist or not)', async () => {
    const PersonLike = defineComponent({
      setup() {
        useNavActive('artists')
        return () => h('p', 'Person')
      }
    })
    const frame = await mountSuspended(DefaultLayout, { route: '/persons/ondina-altran/', slots: { default: () => h(PersonLike) } })
    expect(frame.findComponent({ name: 'ArchiveHeader' }).props('active')).toBe('artists')
  })

  it('keeps the frame from clipping the sticky header (overflow: clip, never hidden)', async () => {
    const shell = (await layout('/about/')).get('.site-shell')
    expect(shell.classes()).toContain('overflow-clip')
    expect(shell.classes()).not.toContain('overflow-hidden')
  })
})
