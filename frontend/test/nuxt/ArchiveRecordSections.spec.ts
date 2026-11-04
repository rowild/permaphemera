import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import ArchiveRecordExhibitions from '~/components/ArchiveRecordExhibitions.vue'
import ArchiveRecordHero from '~/components/ArchiveRecordHero.vue'

// The person, organisation and event pages share their hero and their exhibitions section
// (plans/2026-11-04__events-collection.md: the event page would have been the third copy).
describe('ArchiveRecordHero', () => {
  it('puts the breadcrumb across the top, then the copy and the aside side by side, labelled by the title', async () => {
    const hero = await mountSuspended(ArchiveRecordHero, {
      props: { titleId: 'event-title' },
      slots: { breadcrumb: () => h('nav', 'Startseite / Veranstaltungen'), default: () => h('h1', { id: 'event-title' }, 'Spittaler Comicfestival'), aside: () => h('figure', 'Plakat') }
    })
    const section = hero.get('section')
    expect(section.attributes('aria-labelledby')).toBe('event-title')
    expect(section.element.firstElementChild?.tagName).toBe('NAV')
    const grid = section.get('.record-hero-grid')
    expect(grid.classes()).toEqual(expect.arrayContaining(['grid', 'tablet:grid-cols-1']))
    expect(grid.get('.record-hero-copy h1').text()).toBe('Spittaler Comicfestival')
    expect(grid.element.lastElementChild?.tagName).toBe('FIGURE')
  })
})

describe('ArchiveRecordExhibitions', () => {
  // The card is a stub here, so a few fields stand for the full record.
  const exhibition = { id: 'e1', slug: 'auf-linien-zum-leben', title: 'Auf Linien zum Leben' } as never

  it('shows an eyebrow, the heading and the exhibition cards', async () => {
    const section = await mountSuspended(ArchiveRecordExhibitions, {
      props: { titleId: 'event-2026-title', eyebrow: '7. Ausgabe', items: [{ exhibition, label: 'Ausstellung', key: 'e1' }], empty: 'Nichts.' },
      slots: { default: () => 'Ausstellungen 2026' },
      global: { stubs: { ExhibitionCard: true } }
    })
    expect(section.get('section').attributes('aria-labelledby')).toBe('event-2026-title')
    expect(section.get('.eyebrow').text()).toContain('7. Ausgabe')
    expect(section.get('h2#event-2026-title').text()).toBe('Ausstellungen 2026')
    expect(section.findComponent({ name: 'ExhibitionCardGrid' }).props('items')).toHaveLength(1)
  })

  it('says so when there is no exhibition', async () => {
    const section = await mountSuspended(ArchiveRecordExhibitions, {
      props: { titleId: 'x-title', eyebrow: 'Ausstellungen', items: [], empty: 'Von diesem Eintrag ist noch keine Ausstellung im Archiv.' },
      slots: { default: () => 'Ausstellungen' }
    })
    expect(section.find('h2').exists()).toBe(false)
    expect(section.text()).toBe('Von diesem Eintrag ist noch keine Ausstellung im Archiv.')
  })
})
