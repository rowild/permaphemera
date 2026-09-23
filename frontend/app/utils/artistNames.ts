// Names that are never inverted to "Family, Given". Stopgap until organisations
// get their own collection (docs/superpowers/specs/2026-09-23-organisations-design.md
// at the repository root): an association such as "BV Kärnten" must never
// appear as "Kärnten, BV".
const organizationSlugs = new Set([
  '7th-spittaler-comicfestival',
  'austriatoon',
  'bv-kaernten',
  'lebenshilfe-spittal',
  'raqs-media-collective'
])

const displayNameOverrides: Record<string, string> = {
  'nicoline-von-heyl': 'von Heyl, Nicoline'
}

const letterOverrides: Record<string, string> = {
  '7th-spittaler-comicfestival': '#',
  'bv-kaernten': 'B',
  'lebenshilfe-spittal': 'L',
  'nicoline-von-heyl': 'H'
}

export const splitArtistCredit = (value: string) => value
  .split(/\s+(?:&|·)\s+/)
  .map((name) => name.trim())
  .filter(Boolean)

export const formatArtistName = (name: string, slug: string) => {
  if (displayNameOverrides[slug]) return displayNameOverrides[slug]
  if (organizationSlugs.has(slug)) return name

  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name

  const familyName = parts.pop()!
  return `${familyName}, ${parts.join(' ')}`
}

export const getArtistFamilyLetter = (slug: string, name: string) => {
  if (letterOverrides[slug]) return letterOverrides[slug]

  const displayName = formatArtistName(name, slug)
  const familyName = displayName.includes(',') ? displayName.split(',', 1)[0]! : displayName
  const letter = familyName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toLocaleUpperCase()
  return /^[A-Z]$/.test(letter) ? letter : '#'
}
