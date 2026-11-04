import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ExhibitionCardGrid from '~/components/ExhibitionCardGrid.vue'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'

const exhibition = (id: string) => ({ id, slug: id, title: `Titel ${id}`, artist: 'A', artists: [], venue: 'V', city: 'C', venue_slug: 'v', date_range: '1. Jan 2026', start_date: '2026-01-01', end_date: '2026-01-02', image: '/media/x.png', image_alt: '', summary: '', kind: 'exhibition', tour_status: 'none' }) as unknown as ResolvedExhibition

// The grid of exhibition cards on organisation, person, sponsor and exhibition pages
// (plans/2026-11-04__nuxt-optimisation-audit.md 2.9).
describe('ExhibitionCardGrid', () => {
  it('lays the cards out in three columns, two on tablets, one on phones', async () => {
    const grid = await mountSuspended(ExhibitionCardGrid, { props: { items: [{ exhibition: exhibition('a') }, { exhibition: exhibition('b') }] } })
    expect(grid.get('div').classes()).toEqual(expect.arrayContaining(['grid-cols-3', 'tablet:grid-cols-2', 'compact:grid-cols-1']))
    expect(grid.findAllComponents({ name: 'ExhibitionCard' })).toHaveLength(2)
  })

  it('puts a role label above a card when it has one', async () => {
    const grid = await mountSuspended(ExhibitionCardGrid, { props: { items: [{ exhibition: exhibition('a'), label: 'Kuratorin' }, { exhibition: exhibition('b') }] } })
    const labels = grid.findAll('p.uppercase').map((p) => p.text())
    expect(labels).toEqual(['Kuratorin'])
  })
})
