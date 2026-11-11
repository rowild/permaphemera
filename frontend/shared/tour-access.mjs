// frontend/shared/tour-access.mjs
// Which 360° tour state an exhibition is in on a given day. Plain JS so the SEO module and the
// Node scripts share it with the site (app/utils/tourAccess.ts adds the types and today's date).
//
// Owner's rule (2026-11-11): "360° tours are published on the last day of an exhibition.
// Exceptions apply." So the tour's day is `tour_available_from` when set (the exception, earlier
// or later), else the exhibition's `end_date`; without both (permanent) it opens at once.
//
// - `restricted` / `unavailable`: the editors' decision, no tour.
// - `scheduled`: the tour's day lies after `today` (YYYY-MM-DD).
// - `open`: the day is reached and the tour folder is linked (`tour`).
// - `preparing`: the day is reached, but no tour is published yet.

/** The day a tour comes online: its exception date, else the exhibition's last day, else null. */
export const tourOnlineDate = (exhibition) => exhibition.tour_available_from || exhibition.end_date || null

export const tourAccess = (exhibition, today) => {
  if (exhibition.tour_status === 'restricted') return { kind: 'restricted' }
  if (exhibition.tour_status === 'unavailable') return { kind: 'unavailable' }

  const releaseDate = tourOnlineDate(exhibition)
  if (releaseDate && releaseDate > today) return { kind: 'scheduled', date: releaseDate }
  if (exhibition.tour) return { kind: 'open', url: exhibition.tour }
  return { kind: 'preparing' }
}

// The flat room picture in every tour folder: the view the viewer opens with, cut out of the
// start panorama by `pnpm tour:publish` / `pnpm tour:start-view` (scripts/lib/tour-start-view.mjs).
export const TOUR_START_VIEW_FILE = 'start-view.jpg'

/** Address of a tour's room picture, from its folder (`/media/tours/<id>/`). */
export const tourStartViewUrl = (tour) => `${tour}${TOUR_START_VIEW_FILE}`
