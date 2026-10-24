// frontend/shared/tour-access.mjs
// Which 360° tour state an exhibition is in on a given day. Plain JS so the SEO module and the
// Node scripts share it with the site (app/utils/tourAccess.ts adds the types and today's date).
//
// - `restricted` / `unavailable`: the editors' decision, no tour.
// - `scheduled`: `tour_available_from` lies after `today` (YYYY-MM-DD).
// - `open`: the date is reached (or unset) and the tour folder is linked (`tour`).
// - `preparing`: the date is reached, but no tour is published yet.

export const tourAccess = (exhibition, today) => {
  if (exhibition.tour_status === 'restricted') return { kind: 'restricted' }
  if (exhibition.tour_status === 'unavailable') return { kind: 'unavailable' }

  const releaseDate = exhibition.tour_available_from
  if (releaseDate && releaseDate > today) return { kind: 'scheduled', date: releaseDate }
  if (exhibition.tour) return { kind: 'open', url: exhibition.tour }
  return { kind: 'preparing' }
}
