import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ExhibitionCard from '~/components/ExhibitionCard.vue'

const base = { id: 'e1', slug: 'hydrotopia', title: 'Hydrotopia', artist: 'Katharina Gruzei', venue: 'Living Studio', city: 'Klagenfurt', date_range: '30. Sept.–15. Nov. 2026', image: '/media/x.png' }
const card = (tour: Record<string, unknown>) => mountSuspended(ExhibitionCard, { route: '/exhibitions/', props: { exhibition: { ...base, ...tour } } })
const tiles = async (tour: Record<string, unknown>) => (await card(tour)).findAllComponents({ name: 'ExhibitionActionTile' }).map((tile) => tile.props('kind'))

// Card rules (docs/superpowers/specs/2026-10-21-exhibition-card-rules-design.md), as behaviour
// instead of the text matching of check-directory-routes.
describe('ExhibitionCard', () => {
  it('offers the 360° tour while it is open, and always the exhibition page', async () => {
    expect(await tiles({ tour: '/media/tours/hydrotopia/', tour_status: 'available', tour_available_from: '2020-01-01' })).toEqual(['tour', 'page'])
  })

  it('gives a scheduled tour a date line instead of the tour tile', async () => {
    const scheduled = await card({ tour: '/media/tours/hydrotopia/', tour_status: 'available', tour_available_from: '2099-12-19' })
    expect(scheduled.findAllComponents({ name: 'ExhibitionActionTile' }).map((tile) => tile.props('kind'))).toEqual(['page'])
    expect(scheduled.text()).toMatch(/Online verfügbar ab 19\.\u00A0Dez\.\u00A02099/)
  })

  it('promises nothing for a restricted tour', async () => {
    const restricted = await card({ tour_status: 'restricted', tour_available_from: null })
    expect(restricted.findAllComponents({ name: 'ExhibitionActionTile' }).map((tile) => tile.props('kind'))).toEqual(['page'])
    expect(restricted.text()).not.toMatch(/Online verfügbar/)
  })

  it('is an article, never a link itself; the page tile links to the exhibition', async () => {
    const wrapper = await card({ tour_status: 'unavailable', tour_available_from: null })
    expect(wrapper.find('article').exists()).toBe(true)
    expect(wrapper.find('a article, article[href]').exists()).toBe(false)
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toContain('/exhibitions/hydrotopia/')
  })
})
