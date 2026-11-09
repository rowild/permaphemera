// frontend/shared/tour-access.d.mts
// Type declarations for tour-access.mjs (plain JS, shared with the Node scripts).

export type TourAccessKind = 'open' | 'scheduled' | 'preparing' | 'restricted' | 'unavailable'

export declare function tourAccess(
  exhibition: { tour?: string | null, tour_status: string, tour_available_from: string | null },
  today: string
): { kind: 'open', url: string } | { kind: 'scheduled', date: string } | { kind: 'preparing' } | { kind: 'restricted' } | { kind: 'unavailable' }

export declare const TOUR_START_VIEW_FILE: 'start-view.jpg'
export declare function tourStartViewUrl(tour: string): string
