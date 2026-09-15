// frontend/shared/archive-schema.d.ts
// Type declarations for archive-schema.mjs, which is written in plain JS so
// directus/scripts/*.mjs can import it without a build step.

export declare const COLLECTIONS: Record<string, string>
export declare const TRANSLATED: Set<string>
export declare const FILE_FIELDS: Record<string, string[]>
export declare function assetUrl(baseUrl: string, id: unknown): string | null
