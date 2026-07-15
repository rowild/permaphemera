import type { Artist, ArtistRecordLink, DirectoryArtist, LocationExhibition } from '~/types/content'
import { formatArtistName, getArtistFamilyLetter, splitArtistCredit } from '~/utils/artistNames'

const normalizeArtistName = (value: string) => value.trim().toLocaleLowerCase()

const slugifyArtistName = (value: string) => normalizeArtistName(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

export const buildArtistDirectory = (
  artists: Artist[],
  exhibitions: LocationExhibition[]
): DirectoryArtist[] => {
  const recordsByArtist = new Map<string, ArtistRecordLink[]>()
  const yearsByArtist = new Map<string, Set<string>>()

  for (const exhibition of exhibitions) {
    for (const artistName of splitArtistCredit(exhibition.artist)) {
      const key = normalizeArtistName(artistName)
      const records = recordsByArtist.get(key) ?? []

      if (!records.some((record) => record.id === exhibition.id)) {
        records.push({
          id: exhibition.id,
          title: exhibition.title,
          venue: exhibition.venue,
          city: exhibition.city,
          href: `/exhibitions/${exhibition.slug}/`
        })
      }
      recordsByArtist.set(key, records)

      const years = yearsByArtist.get(key) ?? new Set<string>()
      years.add(exhibition.start_date.slice(0, 4))
      yearsByArtist.set(key, years)
    }
  }

  const directoryArtistMap = new Map<string, DirectoryArtist>()

  for (const artist of artists) {
    const key = normalizeArtistName(artist.name)
    const records = recordsByArtist.get(key) ?? []

    directoryArtistMap.set(key, {
      ...artist,
      record_count: records.length,
      displayName: formatArtistName(artist.name, artist.slug),
      records,
      letter: getArtistFamilyLetter(artist.slug, artist.name)
    })
  }

  for (const exhibition of exhibitions) {
    for (const artistName of splitArtistCredit(exhibition.artist)) {
      const key = normalizeArtistName(artistName)
      if (directoryArtistMap.has(key)) continue

      const records = recordsByArtist.get(key) ?? []
      const slug = slugifyArtistName(artistName)

      directoryArtistMap.set(key, {
        id: `artist-${slug}`,
        slug,
        name: artistName,
        displayName: formatArtistName(artistName, slug),
        location: [...new Set(records.map((record) => record.city))].join(' · '),
        years: [...(yearsByArtist.get(key) ?? [])].join(' · '),
        record_count: records.length,
        records,
        letter: getArtistFamilyLetter(slug, artistName)
      })
    }
  }

  return [...directoryArtistMap.values()].sort((left, right) => {
    if (left.letter !== right.letter) return left.letter.localeCompare(right.letter)
    return left.displayName.localeCompare(right.displayName)
  })
}
