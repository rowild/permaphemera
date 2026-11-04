import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArtistDirectoryGroup from '~/components/ArtistDirectoryGroup.vue'
import type { DirectoryArtist } from '~/types/content'

const artist = (slug: string) => ({ id: slug, slug, name: slug, sortName: slug, letter: 'S', records: [] }) as unknown as DirectoryArtist

// One letter group of artists, on the start page and the artists page (LandingArtistGroup was a
// copy without the "more" link; plans/2026-11-04__nuxt-optimisation-audit.md 2.9).
describe('ArtistDirectoryGroup', () => {
  it('shows the letter and its artists', async () => {
    const group = await mountSuspended(ArtistDirectoryGroup, { props: { letter: 'S', artists: [artist('solace'), artist('schmoelzer')], openArtistSlug: '' } })
    expect(group.get('h3').text()).toBe('S')
    expect(group.findAllComponents({ name: 'ArtistDirectoryEntry' })).toHaveLength(2)
    expect(group.find('a[href*="letter"]').exists()).toBe(false)
  })

  it('links to the whole letter when there are more artists than shown', async () => {
    const group = await mountSuspended(ArtistDirectoryGroup, { props: { letter: 'S', artists: [artist('solace')], openArtistSlug: '', more: { count: 4, to: '/artists/?letter=S' } } })
    const link = group.get('a[href="/artists/?letter=S"]')
    expect(link.text()).toMatch(/4/)
  })
})
