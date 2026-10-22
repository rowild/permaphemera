import type { ExhibitionKind } from '~/types/content'
import { resolveTourAccess, type TourReadyExhibition } from '~/utils/tourAccess'

/** i18n keys for one link to an exhibition page. */
export interface ExhibitionLinkLabels {
  /** The action on a card or in a list. */
  open: string
  /** The action on the large highlighted card. */
  enter: string
  /** The short action where the space is tight. */
  short: string
  /** The accessible name, with `{ title }`. */
  openFor: string
}

/**
 * "Visit" promises the 360° tour, so a link says it only while the tour is open
 * today (it switches by itself on the release date). Every other record, and a record
 * without tour fields, gets the neutral "About the exhibition".
 */
export function exhibitionLinkLabels(
  exhibition: Partial<TourReadyExhibition> & { kind?: ExhibitionKind },
  today: string
): ExhibitionLinkLabels {
  const event = exhibition.kind === 'event'
  const tourOpen = exhibition.tour_status !== undefined
    && resolveTourAccess({ tour: exhibition.tour, tour_status: exhibition.tour_status, tour_available_from: exhibition.tour_available_from ?? null }, today).kind === 'open'

  if (tourOpen) {
    return event
      ? { open: 'cards.openEvent', enter: 'cards.enterEvent', short: 'cards.enter', openFor: 'cards.openEventFor' }
      : { open: 'cards.openExhibition', enter: 'cards.enterExhibition', short: 'cards.enter', openFor: 'cards.openExhibitionFor' }
  }
  return event
    ? { open: 'cards.aboutEvent', enter: 'cards.aboutEvent', short: 'cards.aboutShort', openFor: 'cards.aboutEventFor' }
    : { open: 'cards.aboutExhibition', enter: 'cards.aboutExhibition', short: 'cards.aboutShort', openFor: 'cards.aboutExhibitionFor' }
}
