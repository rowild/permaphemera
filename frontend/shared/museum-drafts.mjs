// frontend/shared/museum-drafts.mjs
// Owner rule, 2026-11-06: a museum (venue type `museum`), every exhibition at it and every person
// who appears only there stay draft until the owner releases that museum by name. A released
// museum's slug goes into MUSEUMS_RELEASED, with the date of the owner's word in a comment.
// `pnpm check:data` fails on any published record that breaks the rule.

/** Museum venue slugs the owner has released for publishing. */
export const MUSEUMS_RELEASED = []

/**
 * Published records that the museum rule keeps as drafts, as "venue|exhibition|person <slug>".
 * `venues` must include draft museums (read with the token), or their exhibitions go unseen.
 */
export function museumLeaks ({ venues, exhibitions, persons, personsVenues, participations, released = MUSEUMS_RELEASED }) {
  const held = new Set(venues.filter((venue) => venue.type === 'museum' && !released.includes(venue.slug)).map((venue) => venue.id))
  const known = new Set(venues.map((venue) => venue.id))
  const heldExhibitions = new Set(exhibitions.filter((exhibition) => held.has(exhibition.primary_venue)).map((exhibition) => exhibition.id))
  const venueOf = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition.primary_venue]))

  // A person is held when every venue they link to, directly or through an exhibition, is a held museum.
  const onlyAtHeldMuseums = (person) => {
    const places = [
      ...personsVenues.filter((row) => row.persons_id === person.id).map((row) => row.venues_id),
      ...participations.filter((row) => row.person === person.id).map((row) => venueOf.get(row.exhibition))
    ].filter((id) => id && known.has(id))
    return places.length > 0 && places.every((id) => held.has(id))
  }

  return [
    ...venues.filter((venue) => held.has(venue.id) && venue.status === 'published').map((venue) => `venue ${venue.slug}`),
    ...exhibitions.filter((exhibition) => heldExhibitions.has(exhibition.id) && exhibition.status === 'published').map((exhibition) => `exhibition ${exhibition.slug}`),
    ...persons.filter((person) => person.status === 'published' && onlyAtHeldMuseums(person)).map((person) => `person ${person.slug}`)
  ]
}
