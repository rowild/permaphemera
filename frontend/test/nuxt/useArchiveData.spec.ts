import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw, nextTick } from 'vue'

let seen: Array<ReturnType<typeof useArchiveData>> = []
const Reader = defineComponent({ setup() { seen.push(useArchiveData()); return () => h('p') } })

// 13 places read the archive; each call used to build and compute every join again
// (plans/2026-11-04__nuxt-optimisation-audit.md 3.1).
describe('useArchiveData', () => {
  it('is one shared instance for every caller', async () => {
    seen = []
    await mountSuspended(Reader)
    await mountSuspended(Reader)
    expect(seen).toHaveLength(2)
    expect(seen[0]!.venues).toBe(seen[1]!.venues)
    expect(seen[0]!.news).toBe(seen[1]!.news)
  })

  it('still follows the archive when it arrives', async () => {
    const data = useArchiveData()
    const state = useState<unknown>('archive')
    const empty = Object.fromEntries(Object.keys(useArchiveSnapshot().value).map((key) => [key, []]))
    state.value = markRaw({ ...empty, sponsors: [{ id: 's1', slug: 'stadt-spittal', status: 'published', title: 'Stadt Spittal' }] })
    await nextTick()
    expect(data.sponsors.value.map((sponsor) => sponsor.slug)).toEqual(['stadt-spittal'])
    clearNuxtState('archive')
  })

  it('keeps galleries abroad out of the overview lists (owner, 2026-11-09)', async () => {
    const data = useArchiveData()
    const state = useState<unknown>('archive')
    const empty = Object.fromEntries(Object.keys(useArchiveSnapshot().value).map((key) => [key, []]))
    const town = (id: string, country: string) => ({ id, slug: id, title: id, postal_code: '', state: 'S', country, latitude: 46, longitude: 14, description: null, status: 'published', sort: 1, translations: [] })
    const venue = (id: string, location: string) => ({ id, slug: id, title: id, type: 'gallery', location, address: '', status: 'published', translations: [] })
    const exhibition = (id: string, venueId: string) => ({ id, slug: id, primary_venue: venueId, start_date: '2026-01-01', end_date: '2026-02-01', is_permanent: false, image: '/e.webp', title: id, status: 'published', translations: [] })
    state.value = markRaw({
      ...empty,
      locations: [town('villach', 'Austria'), town('dobrovo', 'Slovenia')],
      venues: [venue('galerie-at', 'villach'), venue('kmetija-si', 'dobrovo')],
      exhibitions: [exhibition('at-1', 'galerie-at'), exhibition('si-1', 'kmetija-si')]
    })
    await nextTick()
    expect(data.venues.value.map((v) => v.slug).sort()).toEqual(['galerie-at', 'kmetija-si'])
    expect(data.overviewVenues.value.map((v) => v.slug)).toEqual(['galerie-at'])
    expect(data.venueExhibitions.value.map((e) => e.slug).sort()).toEqual(['at-1', 'si-1'])
    expect(data.overviewExhibitions.value.map((e) => e.slug)).toEqual(['at-1'])
    clearNuxtState('archive')
  })
})
