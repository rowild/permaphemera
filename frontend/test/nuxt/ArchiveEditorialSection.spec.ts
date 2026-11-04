import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveEditorialSection from '~/components/ArchiveEditorialSection.vue'

const base = { id: 'controller', title: 'Verantwortlich', paragraphs: ['Ein Absatz.'] }

// The text pages and the legal pages share one section (LegalEditorialSection was a copy with
// two extras; plans/2026-11-04__nuxt-optimisation-audit.md 2.9).
describe('ArchiveEditorialSection', () => {
  it('works without eyebrow and accent (legal sections)', async () => {
    const section = await mountSuspended(ArchiveEditorialSection, { props: base })
    expect(section.get('h2#controller-title').text()).toBe('Verantwortlich')
    expect(section.find('header p').exists()).toBe(false)
    expect(section.find('h2 span').exists()).toBe(false)
  })

  it('lists label and value pairs, linked where they have an address', async () => {
    const section = await mountSuspended(ArchiveEditorialSection, { props: { ...base, details: [{ label: 'E-Mail', value: 'office@rowild.at', href: 'mailto:office@rowild.at' }, { label: 'Name', value: 'Robert Wildling' }] } })
    expect(section.findAll('dt').map((dt) => dt.text())).toEqual(['E-Mail', 'Name'])
    expect(section.get('dd a').attributes('href')).toBe('mailto:office@rowild.at')
  })

  it('shows source links that open in a new tab', async () => {
    const section = await mountSuspended(ArchiveEditorialSection, { props: { ...base, links: [{ label: 'RIS', href: 'https://www.ris.bka.gv.at/' }] } })
    const link = section.get('a[href="https://www.ris.bka.gv.at/"]')
    expect(link.attributes('target')).toBe('_blank')
  })
})
