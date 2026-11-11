import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import GalleryDirectoryCard from '~/components/GalleryDirectoryCard.vue'
import type { ResolvedVenue } from '~/utils/resolveVenues'

const venue = {
  id: 'cb8c9052-7193-48f6-91d3-3a1621d907da', slug: 'galerie-im-stiegenhaus-seeboden', name: 'Galerie im Stiegenhaus',
  parent: null, spaces: [], organisations: [], persons: [], type: 'gallery', address: '', links: [],
  image: 'http://localhost:8077/assets/a0bc9d09-4060-48eb-a104-a1deb25d1f2f', image_alt: 'Das Stiegenhaus', has_image: true,
  archive_number: '37', featured: false, city: 'seeboden', city_name: 'Seeboden am Millstätter See', postal_code: '9871',
  state: 'Carinthia', country: 'Austria', city_latitude: 46.8, city_longitude: 13.5
} as unknown as ResolvedVenue

const imageTransform = async (hover: boolean) => {
  const card = await mountSuspended(GalleryDirectoryCard, { route: '/venues/', props: { venue } })
  if (hover) await card.trigger('mouseenter')
  return (card.findComponent({ name: 'VenueMaskedImage' }).element as HTMLElement).style.transform
}

// Owner, 2026-11-11: preview images stand straight. The tilt was an archive idea; it is gone.
describe('GalleryDirectoryCard', () => {
  it('shows its preview image straight, at rest and on hover', async () => {
    expect(await imageTransform(false)).not.toMatch(/rotate|translate/)
    expect(await imageTransform(true)).not.toMatch(/rotate|translate/)
  })
})
