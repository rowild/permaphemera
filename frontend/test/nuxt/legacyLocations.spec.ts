import { describe, expect, it } from 'vitest'

// Galleries were called "locations" until 2026-09; old links must still arrive.
describe('old /locations/ links', () => {
  it.each([
    ['/locations/galerie-3/', '/venues/galerie-3/'],
    ['/locations/galerie-3', '/venues/galerie-3/'],
    ['/locations/', '/venues/'],
    ['/locations', '/venues/'],
    ['/en/locations/galerie-3/', '/en/venues/galerie-3/']
  ])('%s goes to %s', async (from, to) => {
    const router = useRouter()
    await router.push(from)
    expect(router.currentRoute.value.path).toBe(to)
  })
})
