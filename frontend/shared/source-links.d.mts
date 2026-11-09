// frontend/shared/source-links.d.mts
// Type declarations for source-links.mjs (plain JS, shared with the Node scripts).

export declare function unlinkedSources (html: string | null | undefined): string[]
export declare function unlinkedSourceLeaks (
  records: Array<{ slug: string, status?: string, translations?: Array<Record<string, unknown> & { languages_code: string }> }>,
  field: string
): string[]
