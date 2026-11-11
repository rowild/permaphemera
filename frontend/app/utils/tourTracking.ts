// Counts the opening of a 360° tour as a Umami event (owner, 2026-11-11). Umami is loaded for
// every visitor in nuxt.config.ts and counts only on permaphemera.at; the weekly sums
// (frontend/scripts/stats-weekly.mjs) add the events up per exhibition.

interface UmamiHost {
  umami?: { track: (name: string, data?: Record<string, string>) => unknown }
}

/** The tour id from a tour address (`/media/tours/<id>/…`), or null. */
export const tourIdFromUrl = (url: string): string | null => /\/media\/tours\/([^/?#]+)/.exec(url)?.[1] ?? null

/** Sends one "tour-open" event. Without Umami (blocked, localhost) it does nothing. */
export const trackTourOpen = (url: string, host: UmamiHost = globalThis as UmamiHost): void => {
  const tour = tourIdFromUrl(url)
  if (!tour) return
  try {
    host.umami?.track('tour-open', { tour })
  } catch {
    // Counting must never stop a tour.
  }
}
