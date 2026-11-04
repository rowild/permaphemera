/** The Directus file id inside an asset address (`…/assets/<uuid>`), or undefined for other addresses. */
export const directusFileId = (src?: string | null) =>
  src ? /\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[?#].*)?$/i.exec(src)?.[1] : undefined

/** The widths Directus delivers an image in: a phone at 1× up to a wide screen at 2×. */
export const IMAGE_WIDTHS = [320, 480, 640, 800, 1024, 1280, 1600, 2048] as const

/** The smallest width step that covers `cssWidth` CSS pixels at `pixelRatio`. */
export const imageWidthFor = (cssWidth: number, pixelRatio = 1) =>
  IMAGE_WIDTHS.find((step) => step >= cssWidth * pixelRatio) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]!

/**
 * A Directus image at `width` pixels as WebP, never larger than the original. One address for
 * every part of the site (ArchiveImage, the masked cards, the hero wheel), so a file the start
 * page shows twice downloads once. Other addresses come back unchanged.
 */
export const directusImageUrl = <T extends string | null | undefined>(src: T, width: number): T =>
  (directusFileId(src) ? `${src!.split('?')[0]}?width=${width}&format=webp&quality=80&withoutEnlargement=true` : src) as T

/** `src` and `srcset` in every width step (ArchiveImage, and a preload that must ask for the same file). */
export const directusImageSet = (src: string) => directusFileId(src)
  ? { src: directusImageUrl(src, 1280), srcset: IMAGE_WIDTHS.map((width) => `${directusImageUrl(src, width)} ${width}w`).join(', ') }
  : { src, srcset: undefined }
