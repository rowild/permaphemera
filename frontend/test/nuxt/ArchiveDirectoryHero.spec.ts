import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveDirectoryHero from '~/components/ArchiveDirectoryHero.vue'

const props = {
  titleId: 'galleries-page-title',
  breadcrumb: 'Galleries',
  eyebrow: 'Exhibition places',
  facts: ['12 galleries', '4 states'],
  title: 'Rooms that',
  accent: 'stay',
  intro: 'Every place an exhibition was recorded.',
  ledger: [{ label: 'Galleries', value: 12 }, { label: 'States', value: 4 }]
}

const hero = (extra: Record<string, unknown> = {}) => mountSuspended(ArchiveDirectoryHero, { props: { ...props, ...extra } })

describe('ArchiveDirectoryHero', () => {
  it('shows the breadcrumb back to the start page, eyebrow, title with its accent, intro and ledger', async () => {
    const wrapper = await hero()
    const crumb = wrapper.get('nav')
    expect(crumb.text()).toContain('Startseite')
    expect(crumb.get('a').attributes('href')).toBe('/')
    expect(crumb.text()).toContain('Galleries')
    expect(wrapper.get('.eyebrow').text()).toContain('Exhibition places')
    expect(wrapper.get('h1#galleries-page-title').text()).toBe('Rooms that stay')
    expect(wrapper.get('h1 .text-archive-red').text()).toBe('stay')
    expect(wrapper.text()).toContain('Every place an exhibition was recorded.')
    expect(wrapper.findAll('dt').map((dt) => dt.text())).toEqual(['Galleries', 'States'])
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe('galleries-page-title')
  })

  // The breadcrumb sits at the same height on every index page; the rest follows its text.
  // (The rendered geometry is checked in the browser; this pins the layout the props cannot change.)
  it('keeps the breadcrumb at the top and at least 480px of height on every index page', async () => {
    const section = (await hero()).get('section')
    expect(section.classes()).toEqual(expect.arrayContaining(['min-h-120', 'items-start']))
    expect(section.get('nav').element.parentElement?.parentElement).toBe(section.element)
  })

  it('shows the facts instead of the eyebrow on mobile when there are facts', async () => {
    const eyebrow = (await hero()).get('.eyebrow')
    expect(eyebrow.get('.compact\\:hidden').text()).toBe('Exhibition places')
    // One line: the words of a fact never break apart (non-breaking spaces), the facts are joined by ·.
    expect(eyebrow.get('.compact\\:inline').text()).toBe('12\u00A0galleries · 4\u00A0states')
    expect((await hero({ facts: undefined })).get('.eyebrow').text()).toBe('Exhibition places')
  })

  it('hides the ledger on mobile unless the page asks for it', async () => {
    expect((await hero()).get('dl').classes()).toContain('compact:hidden')
    expect((await hero({ ledgerOnMobile: true })).get('dl').classes()).not.toContain('compact:hidden')
  })
})
