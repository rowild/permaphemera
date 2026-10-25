import { describe, expect, it } from 'vitest'
import { loadArchive, retryPauseMs } from '~/utils/loadArchive'
import type { ArchiveClient } from '~/utils/directusClient'

const fake = (tables: Record<string, unknown[]>, calls: string[] = []): ArchiveClient => ({
  baseUrl: 'http://cms.test',
  async items(collection, query) {
    calls.push(`${collection}?${new URLSearchParams(query ?? {}).toString()}`)
    if (!(collection in tables)) throw new Error(`${collection}: 404 not found`)
    return tables[collection] as never[]
  }
})

const minimal = {
  pp_locations: [], pp_venues: [{ id: 'v1', slug: 'v', image: 'f1', hero_image: null, translations: [] }],
  pp_persons: [], pp_roles: [], pp_mm__persons_roles: [], pp_exhibitions: [{ id: 'e1', image: 'f2', source_pdf: 'f3', tour: '/media/tours/x/', translations: [] }],
  pp_exhibition_participations: [], pp_exhibition_statements: [], pp_sponsors: [{ id: 's1', logo: null }],
  pp_navigations: [], pp_navigation_items: [], pp_mm__exhibitions_venues: [], pp_mm__exhibitions_sponsors: [],
  pp_mm__persons_venues: [], pp_mm__persons_sponsors: [], pp_mm__locations_sponsors: [], pp_mm__sponsors_venues: [],
  pp_websites: [], pp_mm__exhibitions_websites: [], pp_mm__persons_websites: [],
  pp_organisations: [{ id: 'o1', slug: 'o', logo: 'f4', translations: [] }], pp_organisation_memberships: [], pp_organisation_venue_relations: [],
  pp_exhibition_organisers: [], pp_mm__organisations_websites: [], pp_mm__venues_websites: [], pp_quotes: []
}

describe('loadArchive', () => {
  it('fetches all 27 collections with translations where they exist and no limit', async () => {
    const calls: string[] = []
    await loadArchive(fake(minimal, calls))
    expect(calls).toHaveLength(27)
    expect(calls).toContain('pp_quotes?fields=*%2Ctranslations.*&limit=-1&sort=sort')
    expect(calls).toContain('pp_organisations?fields=*%2Ctranslations.*%2Clogo.id%2Clogo.filename_download%2Clogo.type%2Cimage.id%2Cimage.filename_download%2Cimage.type&limit=-1&sort=sort')
    expect(calls).toContain('pp_organisation_memberships?fields=*%2Ctranslations.*&limit=-1&sort=sort')
    expect(calls).toContain('pp_venues?fields=*%2Ctranslations.*%2Cimage.id%2Cimage.filename_download%2Cimage.type%2Chero_image.id%2Chero_image.filename_download%2Chero_image.type&limit=-1&sort=sort')
    expect(calls).toContain('pp_mm__persons_roles?fields=*&limit=-1&sort=sort')
    expect(calls).toContain('pp_persons?fields=*%2Ctranslations.*%2Cimage.id%2Cimage.filename_download%2Cimage.type&limit=-1&sort=sort')
  })

  it('turns file ids into asset URLs and leaves nulls and tour paths alone', async () => {
    const snapshot = await loadArchive(fake(minimal))
    expect(snapshot.venues[0].image).toBe('http://cms.test/assets/f1')
    expect(snapshot.venues[0].hero_image).toBeNull()
    expect(snapshot.exhibitions[0].source_pdf).toBe('http://cms.test/assets/f3')
    expect(snapshot.exhibitions[0].tour).toBe('/media/tours/x/')
    expect(snapshot.sponsors[0].logo).toBeNull()
    expect(snapshot.organisations[0].logo).toBe('http://cms.test/assets/f4')
  })

  it('turns expanded file objects into asset URLs and keeps the placeholder flag and the file type', async () => {
    const snapshot = await loadArchive(fake({
      ...minimal,
      pp_venues: [
        { id: 'v1', slug: 'v', image: { id: 'f9', filename_download: 'placeholder-venue.svg', type: 'image/svg+xml' }, hero_image: null, translations: [] },
        { id: 'v2', slug: 'w', image: { id: 'f1', filename_download: 'europahaus-klagenfurt.jpg', type: 'image/jpeg' }, hero_image: null, translations: [] }
      ]
    }))
    expect(snapshot.venues[0]).toMatchObject({ image: 'http://cms.test/assets/f9', image_placeholder: true, image_type: 'image/svg+xml', hero_image: null, hero_image_placeholder: false, hero_image_type: null })
    expect(snapshot.venues[1]).toMatchObject({ image: 'http://cms.test/assets/f1', image_placeholder: false, image_type: 'image/jpeg' })
  })

  it('names the collection when a request fails', async () => {
    const { pp_roles: _drop, ...broken } = minimal
    await expect(loadArchive(fake(broken), { pause: noPause })).rejects.toThrow(/pp_roles: 404/)
  })

  it('asks again for a request that failed, and only for that one', async () => {
    const calls: string[] = []
    const pauses: number[] = []
    const snapshot = await loadArchive(flaky(minimal, 'pp_roles', 2, calls), { pause: async (attempt) => { pauses.push(attempt) } })
    expect(snapshot.roles).toEqual([])
    expect(calls.filter((call) => call.startsWith('pp_roles?'))).toHaveLength(3)
    expect(calls).toHaveLength(27 + 2)
    expect(pauses).toEqual([1, 2])
  })

  it('gives up after two more tries', async () => {
    const calls: string[] = []
    await expect(loadArchive(flaky(minimal, 'pp_roles', 3, calls), { pause: noPause })).rejects.toThrow(/pp_roles: 503/)
    expect(calls.filter((call) => call.startsWith('pp_roles?'))).toHaveLength(3)
  })

  it('pauses longer before each further try', async () => {
    expect(retryPauseMs(1)).toBeGreaterThan(0)
    expect(retryPauseMs(2)).toBeGreaterThan(retryPauseMs(1))
  })
})

const noPause = async () => {}

// Fails the first `failures` requests for one collection with a 503, then answers.
const flaky = (tables: Record<string, unknown[]>, collection: string, failures: number, calls: string[]): ArchiveClient => {
  const client = fake(tables, calls)
  let failed = 0
  return {
    ...client,
    async items(name, query) {
      if (name === collection && failed < failures) {
        failed += 1
        calls.push(`${name}?${new URLSearchParams(query ?? {}).toString()}`)
        throw new Error(`${name}: 503 Service Unavailable`)
      }
      return client.items(name, query)
    }
  }
}
