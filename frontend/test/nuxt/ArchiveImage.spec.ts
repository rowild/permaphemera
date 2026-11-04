import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ArchiveImage from '~/components/ArchiveImage.vue'
import { directusImageSet } from '~/utils/archiveAsset'

const id = '3e3a1e4c-1111-4222-8333-944455556666'
const directus = `http://localhost:8077/assets/${id}`

// Directus images load at the size the layout needs, as WebP, instead of the full original
// (16 MB of images on the start page; plans/2026-11-04__nuxt-optimisation-audit.md 1.1).
describe('ArchiveImage', () => {
  it('asks Directus for resized WebP versions in a srcset, and lets the browser pick by the layout width', async () => {
    const img = (await mountSuspended(ArchiveImage, { props: { src: directus, alt: 'Ausstellungsraum', sizes: '(max-width: 767px) 100vw, 50vw' } })).get('img')
    expect(img.attributes('src')).toMatch(new RegExp(`/assets/${id}\\?(?=.*width=)(?=.*format=webp)`))
    const candidates = (img.attributes('srcset') ?? '').split(', ').map((entry) => entry.split(' '))
    for (const [url, descriptor] of candidates) expect(url).toContain(`width=${descriptor!.slice(0, -1)}`)
    const widths = candidates.map(([, descriptor]) => Number.parseInt(descriptor!))
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(320)
    expect(Math.max(...widths)).toBeGreaterThanOrEqual(1600)
    expect(Math.max(...widths)).toBeLessThanOrEqual(2400)
    expect(img.attributes('sizes')).toBe('(max-width: 767px) 100vw, 50vw')
    expect(img.attributes('alt')).toBe('Ausstellungsraum')
    expect(img.attributes('loading')).toBe('lazy')
  })

  it('loads at once when asked (the image at the top of a page)', async () => {
    const img = (await mountSuspended(ArchiveImage, { props: { src: directus, alt: '', sizes: '100vw', eager: true } })).get('img')
    expect(img.attributes('loading')).toBe('eager')
  })

  it('leaves the site\'s own files as they are', async () => {
    const img = (await mountSuspended(ArchiveImage, { props: { src: '/media/images/landing/footer/permanently-preserved-stamp.png', alt: '', sizes: '100vw' } })).get('img')
    expect(img.attributes('src')).toBe('/media/images/landing/footer/permanently-preserved-stamp.png')
    expect(img.attributes('srcset')).toBeUndefined()
  })
})

// A preload (new Image()) must ask for the same file the <img> will show, or both load.
it('renders the src and srcset directusImageSet gives a preload', async () => {
  const img = (await mountSuspended(ArchiveImage, { props: { src: directus, alt: '', sizes: '50vw' } })).get('img')
  expect(directusImageSet(directus)).toEqual({ src: img.attributes('src'), srcset: img.attributes('srcset') })
})
