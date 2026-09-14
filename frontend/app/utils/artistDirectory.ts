import type { ArtistRecord, ArtistRecordLink, DirectoryArtist, ExhibitionArtistLink } from '~/types/content'
import type { ResolvedExhibition } from '~/utils/resolveExhibitions'
import { displayArtistName } from '~/utils/resolveExhibitions'
import { formatArtistName, getArtistFamilyLetter } from '~/utils/artistNames'

export const buildArtistDirectory = (
  artists: ArtistRecord[],
  exhibitions: ResolvedExhibition[],
  junction: ExhibitionArtistLink[]
): DirectoryArtist[] => {
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]))

  const recordsByArtist = new Map<string, ArtistRecordLink[]>()
  const yearsByArtist = new Map<string, Set<string>>()

  for (const link of junction) {
    const exhibition = exhibitionById.get(link.exhibition_id)
    if (!exhibition) continue

    const records = recordsByArtist.get(link.artist_id) ?? []
    if (!records.some((record) => record.id === exhibition.id)) {
      records.push({
        id: exhibition.id,
        title: exhibition.title,
        venue: exhibition.venue,
        city: exhibition.city,
        href: `/exhibitions/${exhibition.slug}/`
      })
    }
    recordsByArtist.set(link.artist_id, records)

    const years = yearsByArtist.get(link.artist_id) ?? new Set<string>()
    years.add(exhibition.start_date.slice(0, 4))
    yearsByArtist.set(link.artist_id, years)
  }

  return artists.map((artist) => {
    const records = recordsByArtist.get(artist.id) ?? []
    const name = displayArtistName(artist)

    return {
      id: artist.id,
      slug: artist.slug,
      name,
      location: [...new Set(records.map((record) => record.city))].join(' · '),
      years: [...(yearsByArtist.get(artist.id) ?? [])].sort().join(' · '),
      record_count: records.length,
      displayName: formatArtistName(name, artist.slug),
      records,
      letter: getArtistFamilyLetter(artist.slug, name)
    }
  }).sort((left, right) => {
    if (left.letter !== right.letter) return left.letter.localeCompare(right.letter)
    return left.displayName.localeCompare(right.displayName)
  })
}
