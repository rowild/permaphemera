// frontend/shared/museum-drafts.d.mts
// Type declarations for museum-drafts.mjs (plain JS, shared with the Node scripts).

interface Row { id: string, slug?: string, status?: string }

export declare const MUSEUMS_RELEASED: string[]

export declare function museumLeaks (input: {
  venues: Array<Row & { type?: string }>
  exhibitions: Array<Row & { primary_venue?: string | null }>
  persons: Row[]
  personsVenues: Array<{ persons_id: string, venues_id: string }>
  participations: Array<{ exhibition: string, person: string }>
  released?: string[]
}): string[]
