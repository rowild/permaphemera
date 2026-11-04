// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ArchiveDirectoryHero from '~/components/ArchiveDirectoryHero.vue'

const props = {
  titleId: 'galleries-page-title',
  breadcrumb: 'Galleries',
  eyebrow: 'Exhibition places',
  facts: '12 galleries · 4 states',
  title: 'Rooms that',
  accent: 'stay',
  intro: 'Every place an exhibition was recorded.',
  ledger: [{ label: 'Galleries', value: 12 }, { label: 'States', value: 4 }]
}

const hero = (extra: Record<string, unknown> = {}) => mount(ArchiveDirectoryHero, { props: { ...props, ...extra } })

describe('ArchiveDirectoryHero', () => {
  it('shows the breadcrumb, eyebrow, title with its accent, intro and ledger', () => {
    const wrapper = hero()
    expect(wrapper.get('nav').text()).toContain('navigation.archive')
    expect(wrapper.get('nav').text()).toContain('Galleries')
    expect(wrapper.get('.eyebrow').text()).toContain('Exhibition places')
    expect(wrapper.get('h1#galleries-page-title').text()).toBe('Rooms that stay')
    expect(wrapper.get('h1 .text-archive-red').text()).toBe('stay')
    expect(wrapper.text()).toContain('Every place an exhibition was recorded.')
    expect(wrapper.findAll('dt').map((dt) => dt.text())).toEqual(['Galleries', 'States'])
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe('galleries-page-title')
  })

  // The breadcrumb sits at the same height on every index page; the rest follows its text.
  it('keeps the breadcrumb at the top and at least 480px of height on every index page', () => {
    const section = hero().get('section')
    expect(section.classes()).toContain('min-h-120')
    expect(section.classes()).toContain('items-start')
    expect(section.classes()).not.toContain('items-end')
    expect(section.get('nav').element.parentElement?.parentElement).toBe(section.element)
  })

  it('puts the ledger at the bottom of the hero', () => {
    expect(hero().get('dl').classes()).toContain('self-end')
  })

  it('shows the facts instead of the eyebrow on mobile when there are facts', () => {
    const eyebrow = hero().get('.eyebrow')
    expect(eyebrow.get('.compact\\:hidden').text()).toBe('Exhibition places')
    expect(eyebrow.get('.compact\\:inline').text()).toBe('12 galleries · 4 states')
    expect(hero({ facts: undefined }).get('.eyebrow').text()).toBe('Exhibition places')
  })

  it('hides the ledger on mobile unless the page asks for it', () => {
    expect(hero().get('dl').classes()).toContain('compact:hidden')
    expect(hero({ ledgerOnMobile: true }).get('dl').classes()).not.toContain('compact:hidden')
  })
})
