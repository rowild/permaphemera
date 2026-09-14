import type { ArtistRecordLink, DirectoryArtist, ParticipationRecord, PersonRecord, PersonRoleLink, RoleRecord } from '~/types/content'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { displayPersonName } from '~/utils/resolveExhibitions'
import { formatArtistName, getArtistFamilyLetter } from '~/utils/artistNames'

/** Persons who hold the `artist` role, with their artist-role participations as records. */
export const buildArtistDirectory = (
  persons: PersonRecord[],
  exhibitions: ResolvedExhibition[],
  participations: ParticipationRecord[],
  personRoles: PersonRoleLink[],
  roles: RoleRecord[]
): DirectoryArtist[] => {
  const artistRole = roles.find((role) => role.slug === 'artist')?.id
  if (!artistRole) throw new Error('pp_roles.json: no role with slug "artist"')
  const artistIds = new Set(personRoles.filter((row) => row.roles_id === artistRole).map((row) => row.persons_id))
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]))

  const recordsByPerson = new Map<string, ArtistRecordLink[]>()
  const yearsByPerson = new Map<string, Set<string>>()

  for (const row of participations) {
    if (row.role !== artistRole) continue
    const exhibition = exhibitionById.get(row.exhibition)
    if (!exhibition) continue

    const records = recordsByPerson.get(row.person) ?? []
    if (!records.some((record) => record.id === exhibition.id)) {
      records.push({
        id: exhibition.id,
        title: exhibition.title,
        venue: exhibition.venue,
        city: exhibition.city,
        href: `/exhibitions/${exhibition.slug}/`
      })
    }
    recordsByPerson.set(row.person, records)

    const years = yearsByPerson.get(row.person) ?? new Set<string>()
    years.add(exhibition.start_date.slice(0, 4))
    yearsByPerson.set(row.person, years)
  }

  return persons.filter((person) => artistIds.has(person.id)).map((person) => {
    const records = recordsByPerson.get(person.id) ?? []
    const name = displayPersonName(person)

    return {
      id: person.id,
      slug: person.slug,
      name,
      location: [...new Set(records.map((record) => record.city))].join(' · '),
      years: [...(yearsByPerson.get(person.id) ?? [])].sort().join(' · '),
      record_count: records.length,
      displayName: formatArtistName(name, person.slug),
      records,
      letter: getArtistFamilyLetter(person.slug, name)
    }
  }).sort((left, right) => {
    if (left.letter !== right.letter) return left.letter.localeCompare(right.letter)
    return left.displayName.localeCompare(right.displayName)
  })
}
