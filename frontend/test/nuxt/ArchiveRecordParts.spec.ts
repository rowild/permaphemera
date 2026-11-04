import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveRecordFigure from '~/components/ArchiveRecordFigure.vue'
import ArchiveRecordTitle from '~/components/ArchiveRecordTitle.vue'

// The repeated parts of the gallery, organisation, person and sponsor heroes (plans/…-audit.md 2.6).
describe('ArchiveRecordTitle', () => {
  it('shows the name, the town under it in red, and the lede', async () => {
    const title = await mountSuspended(ArchiveRecordTitle, { props: { titleId: 'venue-title', title: 'Parkschlössl', subtitle: 'Spittal an der Drau', lede: 'Ein Ausstellungshaus im Park.' } })
    const h1 = title.get('h1#venue-title')
    expect(h1.text()).toBe('Parkschlössl Spittal an der Drau')
    expect(h1.get('span.text-archive-red').text()).toBe('Spittal an der Drau')
    expect(title.get('p').text()).toBe('Ein Ausstellungshaus im Park.')
  })

  it('leaves out subtitle and lede when there are none', async () => {
    const title = await mountSuspended(ArchiveRecordTitle, { props: { titleId: 'sponsor-title', title: 'Stadt Spittal' } })
    expect(title.find('h1 span').exists()).toBe(false)
    expect(title.find('p').exists()).toBe(false)
  })
})

describe('ArchiveRecordFigure', () => {
  const src = 'http://localhost:8077/assets/3e3a1e4c-1111-4222-8333-944455556666'
  it('frames the picture and labels the caption as a figure', async () => {
    const figure = await mountSuspended(ArchiveRecordFigure, { props: { src, alt: 'Das Parkschlössl', caption: 'Foto: Johann Jaritz', imageClass: 'aspect-[1.28]' } })
    expect(figure.get('figure').findComponent({ name: 'ArchiveFramedImage' }).props('alt')).toBe('Das Parkschlössl')
    expect(figure.get('figcaption').text()).toMatch(/^Abb\. I\s+Foto: Johann Jaritz$/)
  })

  it('has no caption line without a caption', async () => {
    const figure = await mountSuspended(ArchiveRecordFigure, { props: { src, alt: '' } })
    expect(figure.find('figcaption').exists()).toBe(false)
  })
})
