// The three derived-name rules from _Plans/directus-schema-conventions.md §1.
// Nothing else in the scripts spells a derived name by hand.

export const PREFIX = 'pp_'

export const col = (name) => `${PREFIX}${name}`

export const squash = (name) => name.replace(/_/g, '')

export const translationsTable = (host) => `${PREFIX}translations__${host}`

export const mmTable = (a, b, role) => {
  const [x, y] = [squash(a), squash(b)].sort()
  if (x === y && !role) throw new Error(`mmTable(${a}, ${b}): a self-reference needs a role`)
  return `${PREFIX}mm__${x}_${y}${role ? `__${role}` : ''}`
}

export const fk = (host) => `${host}_id`

// Conventions §1 rule 7, with the prefix replaced.
export const NAME_REGEX = /^pp_(translations__[a-z0-9_]+|mm__[a-z0-9]+_[a-z0-9]+(__[a-z0-9]+)?|m2a__[a-z0-9]+__[a-z0-9]+|(?!mm_|m2a_|translations?_)[a-z][a-z0-9_]*)$/

export const isValidName = (name) => {
  if (!NAME_REGEX.test(name)) return false
  const mm = name.match(/^pp_mm__([a-z0-9]+)_([a-z0-9]+)(?:__([a-z0-9]+))?$/)
  if (mm) {
    const [, a, b, role] = mm
    if (a > b) return false
    if (a === b && !role) return false
  }
  return true
}
