import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveLinkList from '~/components/ArchiveLinkList.vue'

// Names joined by commas, each a link: 13 hand-written copies before (plans/…-audit.md 2.9).
describe('ArchiveLinkList', () => {
  it('joins the links with commas and localizes site links', async () => {
    const list = await mountSuspended(ArchiveLinkList, { route: '/en/about/', props: { items: [{ label: 'Parkschlössl', to: '/venues/parkschloessl/' }, { label: 'Europahaus', to: '/venues/europahaus/' }] } })
    expect(list.text().replace(/\s+/g, ' ')).toBe('Parkschlössl, Europahaus')
    expect(list.findAll('a').map((a) => a.attributes('href'))).toEqual(['/en/venues/parkschloessl/', '/en/venues/europahaus/'])
  })

  it('opens other sites in a new tab', async () => {
    const link = (await mountSuspended(ArchiveLinkList, { props: { items: [{ label: 'kultur-impuls.com', href: 'https://kultur-impuls.com/' }] } })).get('a')
    expect(link.attributes('href')).toBe('https://kultur-impuls.com/')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noreferrer')
  })
})
