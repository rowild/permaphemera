import { describe, expect, it } from 'vitest'
import { loadArchive } from '~/utils/loadArchive'
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
  pp_exhibition_organisers: [], pp_mm__organisations_websites: []
}

describe('loadArchive', () => {
  it('fetches all 25 collections with translations where they exist and no limit', async () => {
    const calls: string[] = []
    await loadArchive(fake(minimal, calls))
    expect(calls).toHaveLength(25)
    expect(calls).toContain('pp_organisations?fields=*%2Ctranslations.*&limit=-1&sort=sort')
    expect(calls).toContain('pp_organisation_memberships?fields=*%2Ctranslations.*&limit=-1&sort=sort')
    expect(calls).toContain('pp_venues?fields=*%2Ctranslations.*&limit=-1&sort=sort')
    expect(calls).toContain('pp_mm__persons_roles?fields=*&limit=-1&sort=sort')
    expect(calls).toContain('pp_persons?fields=*&limit=-1&sort=sort')
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

  it('names the collection when a request fails', async () => {
    const { pp_roles: _drop, ...broken } = minimal
    await expect(loadArchive(fake(broken))).rejects.toThrow(/pp_roles: 404/)
  })
})
