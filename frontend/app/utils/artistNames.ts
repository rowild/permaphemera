// A person's name is inverted to "Family, Given" for the alphabet; a collective
// (pp_persons.is_collective) keeps its name exactly as written, filed under its
// first letter. Associations and institutions are not persons at all: they live
// in pp_organisations and never pass through here.
const displayNameOverrides: Record<string, string> = {
  'nicoline-von-heyl': 'von Heyl, Nicoline'
}

const letterOverrides: Record<string, string> = {
  'nicoline-von-heyl': 'H'
}

export const splitArtistCredit = (value: string) => value
  .split(/\s+(?:&|·)\s+/)
  .map((name) => name.trim())
  .filter(Boolean)

export const formatArtistName = (name: string, slug: string, isCollective = false) => {
  if (displayNameOverrides[slug]) return displayNameOverrides[slug]
  if (isCollective) return name

  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name

  const familyName = parts.pop()!
  return `${familyName}, ${parts.join(' ')}`
}

export const getArtistFamilyLetter = (slug: string, name: string, isCollective = false) => {
  if (letterOverrides[slug]) return letterOverrides[slug]

  const displayName = formatArtistName(name, slug, isCollective)
  const familyName = displayName.includes(',') ? displayName.split(',', 1)[0]! : displayName
  const letter = familyName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toLocaleUpperCase()
  return /^[A-Z]$/.test(letter) ? letter : '#'
}
