export interface PaperStackTransform {
  rest: string
  expanded: string
  zIndex: number
  delay: string
}

export interface OrnamentTransform {
  right: string
  bottom: string
  rest: string
  active: string
}

export interface DirectoryImageTransform {
  rest: string
  active: string
}

const hashString = (value: string) => {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

const seededRandom = (seed: string) => {
  let state = hashString(seed)

  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const between = (random: () => number, minimum: number, maximum: number) => {
  return minimum + (maximum - minimum) * random()
}

const signed = (random: () => number, index: number, minimum: number, maximum: number) => {
  const direction = index % 2 === 0 ? -1 : 1
  return between(random, minimum, maximum) * direction
}

const transform = (x: number, y: number, rotation: number) => {
  return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rotation.toFixed(2)}deg)`
}

export const createPaperStackTransforms = (
  stackId: string,
  itemIds: string[],
  variant: 'artist' | 'venue'
): PaperStackTransform[] => {
  return itemIds.map((itemId, index) => {
    const random = seededRandom(`${stackId}:${itemId}`)
    const x = signed(random, index, variant === 'venue' ? 6 : 4, variant === 'venue' ? 12 : 9)
    const yDirection = index < Math.ceil(itemIds.length / 2) ? 1 : -1
    const y = between(random, 2, variant === 'venue' ? 8 : 7) * yDirection
    const rotation = signed(random, index, 1.2, variant === 'venue' ? 5.2 : 4.2)
    const expansion = between(random, 1.65, 2.05)

    return {
      rest: transform(x, y, rotation),
      expanded: transform(x * expansion, y * expansion, rotation * between(random, 1.3, 1.65)),
      zIndex: index + 1,
      delay: `${index * 18}ms`
    }
  })
}

export const createOrnamentTransform = (contentId: string, featured = false): OrnamentTransform => {
  const random = seededRandom(`ornament:${contentId}`)
  const rotation = between(random, -13, 11)
  const turn = between(random, 7, 13)

  return {
    right: `${between(random, featured ? -0.05 : -0.35, featured ? 0.2 : 0.25).toFixed(2)}rem`,
    bottom: `${between(random, featured ? 0.05 : -0.35, featured ? 0.25 : 0.35).toFixed(2)}rem`,
    rest: `rotate(${rotation.toFixed(2)}deg)`,
    active: `rotate(${(rotation + turn).toFixed(2)}deg) scale(1.04)`
  }
}

export interface CornerOrnament {
  top: string
  right: string
  size: string
  opacity: number
  rest: string
  active: string
}

/**
 * Ornament for the top-right corner of a card's text area. Spot, size and
 * opacity are random per record but stable across visits, and the spot never
 * hugs the top or right edge.
 */
export const createCornerOrnament = (contentId: string): CornerOrnament => {
  const random = seededRandom(`corner-ornament:${contentId}`)
  const rotation = between(random, -13, 11)
  const turn = between(random, 7, 13)

  return {
    top: `${between(random, 0.9, 2.2).toFixed(2)}rem`,
    right: `${between(random, 1.2, 3).toFixed(2)}rem`,
    size: `${between(random, 4.2, 6).toFixed(2)}rem`,
    opacity: Number(between(random, 0.32, 0.6).toFixed(2)),
    rest: `rotate(${rotation.toFixed(2)}deg)`,
    active: `rotate(${(rotation + turn).toFixed(2)}deg) scale(1.04)`
  }
}

export const createDirectoryImageTransform = (contentId: string): DirectoryImageTransform => {
  const random = seededRandom(`directory-image:${contentId}`)
  const rotation = between(random, -1.15, 1.15)
  const horizontalShift = between(random, -2.5, 2.5)

  return {
    rest: `translateX(${horizontalShift.toFixed(2)}px) rotate(${rotation.toFixed(2)}deg)`,
    active: `translateX(${horizontalShift.toFixed(2)}px) rotate(${(rotation * 0.35).toFixed(2)}deg) scale(1.012)`
  }
}

export interface StuckLetter {
  /** Index of the letter in the text. */
  index: number
  /** Degrees the letter leans while it is stuck. */
  tilt: number
}

/**
 * The one letter of a text that sticks during a letter-by-letter reveal
 * (ArchiveLetters): never the first or the last character, never a space or
 * punctuation. Seeded by the text, so the same word always sticks the same way.
 */
/** The logo's broken letter: the H in the middle of PERMAPHEMERA leans 10°. */
export const BRAND_STUCK_LETTER: StuckLetter = { index: 6, tilt: 10 }

export const pickStuckLetter = (text: string): StuckLetter | null => {
  const candidates = [...text]
    .map((character, index) => ({ character, index }))
    .filter(({ character, index }) => index > 0 && index < text.length - 1 && /\p{L}/u.test(character))
  if (!candidates.length) return null

  const random = seededRandom(`stuck-letter:${text}`)
  const pick = candidates[Math.floor(random() * candidates.length)]!
  const tilt = (9 + random() * 7) * (random() < 0.5 ? -1 : 1)

  return { index: pick.index, tilt: Number(tilt.toFixed(2)) }
}
