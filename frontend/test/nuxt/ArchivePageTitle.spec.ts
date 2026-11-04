import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchivePageTitle from '~/components/ArchivePageTitle.vue'

// Owner decision B (2026-11-04): one type scale for every page hero (index pages, text pages,
// news overview). The scale is the index pages' one.
describe('ArchivePageTitle', () => {
  it('renders the page title with its red accent and the intro, in the shared hero scale', async () => {
    const title = await mountSuspended(ArchivePageTitle, { props: { titleId: 'about-page-title', title: 'Was vergeht,', accent: 'bleibt.', intro: 'Räume von Ausstellungen.' } })
    const h1 = title.get('h1#about-page-title')
    expect(h1.text()).toBe('Was vergeht, bleibt.')
    expect(h1.get('.text-archive-red').text()).toBe('bleibt.')
    expect(h1.classes()).toEqual(expect.arrayContaining(['text-hero', 'font-light', 'leading-[0.92]', 'max-w-232']))
    expect(title.get('p').text()).toBe('Räume von Ausstellungen.')
    expect(title.get('p').classes()).toEqual(expect.arrayContaining(['max-w-180', 'leading-[1.55]']))
  })

  it('works without accent or intro (the news overview)', async () => {
    const title = await mountSuspended(ArchivePageTitle, { props: { titleId: 'news-page-title', title: 'Aktuelles' } })
    expect(title.get('h1').text()).toBe('Aktuelles')
    expect(title.find('h1 span').exists()).toBe(false)
    expect(title.find('p').exists()).toBe(false)
  })
})
