import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveRichText from '~/components/ArchiveRichText.vue'

// CMS rich text: sanitised, and a closing source block styled as one (owner, 2026-11-06).
describe('ArchiveRichText', () => {
  it('marks the closing source list', async () => {
    const text = await mountSuspended(ArchiveRichText, { props: { html: '<p>Bio.</p><p>Quellen</p><ul><li>a.at</li><li>b.at</li></ul>' } })
    expect(text.get('.archive-sources-label').text()).toBe('Quellen')
    expect(text.findAll('ul.archive-sources li').map((item) => item.text())).toEqual(['a.at', 'b.at'])
  })

  it('never lets a class from the CMS through', async () => {
    const text = await mountSuspended(ArchiveRichText, { props: { html: '<p class="archive-sources-label">Fake</p><p>Text</p>' } })
    expect(text.find('.archive-sources-label').exists()).toBe(false)
  })

  it('has a larger lead size for the exhibition description', async () => {
    const body = await mountSuspended(ArchiveRichText, { props: { html: '<p>A</p>' } })
    const lead = await mountSuspended(ArchiveRichText, { props: { html: '<p>A</p>', size: 'lead' } })
    expect(body.get('.archive-rich-text').classes()).toContain('text-button')
    expect(lead.get('.archive-rich-text').classes()).toContain('text-lg')
    expect(lead.get('.archive-rich-text').classes()).not.toContain('text-button')
  })

  it('keeps site links only with `links` and gives them the current language', async () => {
    const html = '<p><a href="/exhibitions/a/">tour</a></p>'
    const plain = await mountSuspended(ArchiveRichText, { props: { html } })
    expect(plain.find('a').exists()).toBe(false)
    const linked = await mountSuspended(ArchiveRichText, { route: '/en/about/', props: { html, links: true } })
    expect(linked.get('a').attributes('href')).toBe('/en/exhibitions/a/')
  })
})
