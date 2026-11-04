import { describe, expect, it } from 'vitest'
import { directusFileId, directusImageSet, directusImageUrl, IMAGE_WIDTHS, imageWidthFor } from '~/utils/archiveAsset'
import { wheelTextureUrl } from '~/utils/kaleidoscopeTextures'

const directus = 'http://localhost:8077/assets/3e3a1e4c-1111-4222-8333-944455556666'

describe('directusFileId', () => {
  it('finds the file id in a Directus asset address, with or without a query', () => {
    expect(directusFileId('https://permaphemera.at/cms/assets/3e3a1e4c-1111-4222-8333-944455556666')).toBe('3e3a1e4c-1111-4222-8333-944455556666')
    expect(directusFileId('http://localhost:8077/assets/3e3a1e4c-1111-4222-8333-944455556666?width=800')).toBe('3e3a1e4c-1111-4222-8333-944455556666')
  })

  it('leaves the site\'s own files and empty values alone', () => {
    expect(directusFileId('/media/images/stamp.png')).toBeUndefined()
    expect(directusFileId(null)).toBeUndefined()
  })
})

describe('imageWidthFor', () => {
  it('picks the smallest step that covers the layout width at the screen\'s pixel density', () => {
    expect(imageWidthFor(300, 1)).toBe(320)
    expect(imageWidthFor(436, 2)).toBe(1024)
    expect(imageWidthFor(700, 1)).toBe(800)
  })

  it('stops at the largest step', () => {
    expect(imageWidthFor(1800, 2)).toBe(IMAGE_WIDTHS.at(-1))
  })
})

describe('directusImageUrl', () => {
  it('asks Directus for one width as WebP, never enlarged', () => {
    expect(directusImageUrl(directus, 1200)).toBe(`${directus}?width=1200&format=webp&quality=80&withoutEnlargement=true`)
    expect(directusImageUrl(`${directus}?download`, 640)).toBe(`${directus}?width=640&format=webp&quality=80&withoutEnlargement=true`)
  })

  it('leaves other addresses and empty values alone', () => {
    expect(directusImageUrl('/media/x.png', 1200)).toBe('/media/x.png')
    expect(directusImageUrl(undefined, 1200)).toBeUndefined()
  })

  // The start page shows the same exhibition in the wheel and in a card: one address, one download.
  it('gives the hero wheel the address a card uses at 800 px', () => {
    expect(wheelTextureUrl(directus)).toBe(directusImageUrl(directus, 800))
  })
})

describe('directusImageSet', () => {
  it('lists every width step and uses 1280 as the fallback src', () => {
    const set = directusImageSet(directus)
    expect(set.src).toBe(directusImageUrl(directus, 1280))
    expect(set.srcset?.split(', ').map((entry) => entry.split(' ')[1])).toEqual(IMAGE_WIDTHS.map((width) => `${width}w`))
  })
})
