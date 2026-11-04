import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveFactRecord from '~/components/ArchiveFactRecord.vue'

const items = [{ label: 'Projekt', value: 'PERMAPHEMERA' }, { label: 'E-Mail', value: 'office@rowild.at', href: 'mailto:office@rowild.at' }]

// The fact box beside a text-page title: contact data on the contact page, the document note on
// the legal pages (two copies before; plans/2026-11-04__nuxt-optimisation-audit.md 2.9).
describe('ArchiveFactRecord', () => {
  it('lists label and value, linked where there is an address, with its own label', async () => {
    const record = await mountSuspended(ArchiveFactRecord, { props: { label: 'Dokumentvermerk', recordAria: 'Angaben', items } })
    expect(record.get('aside').attributes('aria-label')).toBe('Angaben')
    expect(record.get('aside > p').text()).toBe('Dokumentvermerk')
    expect(record.findAll('dt').map((dt) => dt.text())).toEqual(['Projekt', 'E-Mail'])
    expect(record.get('dd a').attributes('href')).toBe('mailto:office@rowild.at')
    expect(record.find('address').exists()).toBe(false)
    expect(record.find('img').exists()).toBe(false)
  })

  it('marks contact data as an address and can carry the archive stamp', async () => {
    const record = await mountSuspended(ArchiveFactRecord, { props: { label: 'Direkter Kontakt', recordAria: 'Kontakt', items, address: true, stamp: true } })
    expect(record.find('address dl').exists()).toBe(true)
    expect(record.get('img').attributes('src')).toContain('archive-stamp')
  })
})
