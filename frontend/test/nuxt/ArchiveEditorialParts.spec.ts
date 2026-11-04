import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import ArchiveActionBand from '~/components/ArchiveActionBand.vue'
import ArchiveEditorialHero from '~/components/ArchiveEditorialHero.vue'
import ArchiveMethodFigure from '~/components/ArchiveMethodFigure.vue'

// The text pages (about, how it works, contact, legal) shared their hero frame, closing band and
// figure as copies (plans/2026-11-04__nuxt-optimisation-audit.md 2.7).
describe('ArchiveEditorialHero', () => {
  it('puts the heading beside a figure, the figure first on tablets', async () => {
    const hero = await mountSuspended(ArchiveEditorialHero, { props: { titleId: 'about-page-title', layout: 'figure' }, slots: { default: () => h('h1', 'Titel'), aside: () => h('figure', 'Bild') } })
    const section = hero.get('section')
    expect(section.attributes('aria-labelledby')).toBe('about-page-title')
    expect(section.get('h1').element.parentElement?.className).toContain('tablet:row-start-2')
    expect(section.find('figure').exists()).toBe(true)
  })

  it('puts the heading beside a fact box in the aside layout (contact, legal)', async () => {
    const hero = await mountSuspended(ArchiveEditorialHero, { props: { titleId: 'contact-page-title', layout: 'aside' }, slots: { default: () => h('h1', 'Kontakt'), aside: () => h('aside', 'Daten') } })
    expect(hero.get('section').classes()).toContain('min-h-128')
    expect(hero.get('h1').element.parentElement?.tagName).toBe('HEADER')
    expect(hero.get('header').classes()).not.toContain('tablet:row-start-2')
  })
})

describe('ArchiveActionBand', () => {
  it('shows eyebrow, title with accent, an optional note and the actions', async () => {
    const band = await mountSuspended(ArchiveActionBand, {
      props: { titleId: 'about-actions-title', eyebrow: 'Das Archiv erkunden', title: 'Was jetzt geschieht,', accent: 'entdecken.' },
      slots: { default: () => 'Hinweis', actions: () => h('a', { href: '/exhibitions/' }, 'Ausstellungen') }
    })
    expect(band.get('section').attributes('aria-labelledby')).toBe('about-actions-title')
    expect(band.get('h2#about-actions-title').text()).toBe('Was jetzt geschieht, entdecken.')
    expect(band.text()).toContain('Das Archiv erkunden')
    expect(band.text()).toContain('Hinweis')
    expect(band.get('a').text()).toBe('Ausstellungen')
  })
})

describe('ArchiveMethodFigure', () => {
  it('shows the method picture with its label and caption', async () => {
    const figure = await mountSuspended(ArchiveMethodFigure, { props: { alt: 'Rundgang', label: 'Rundgang', caption: 'Verbundene Blickpunkte' } })
    expect(figure.get('img').attributes('src')).toBe('/media/images/landing/method/archive-method-composition.png')
    expect(figure.get('figcaption').text()).toMatch(/^Rundgang\s+Verbundene Blickpunkte$/)
  })
})
