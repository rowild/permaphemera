// frontend/shared/archive-schema.d.ts
// Type declarations for archive-schema.mjs, which is written in plain JS so
// directus/scripts/*.mjs can import it without a build step.

export declare const COLLECTIONS: Record<string, string>
export declare const TRANSLATED: Set<string>
export declare const FILE_FIELDS: Record<string, string[]>
export declare function assetUrl(baseUrl: string, id: unknown): string | null
/** True when an expanded file object `{ id, filename_download }` is a placeholder (`placeholder-…`). */
export declare function isPlaceholderFile(value: unknown): boolean
/** The MIME type of an expanded file object, or null. */
export declare function fileType(value: unknown): string | null
/** The `fields` query of a collection: all fields, translations, and id, name and type of each file field. */
export declare function fieldsQuery(collection: string): string
/** The row with file fields as asset URLs plus `<field>_placeholder` and `<field>_type`. */
export declare function withFileUrls<T extends Record<string, unknown>>(baseUrl: string, collection: string, row: T): T & Record<string, unknown>
