export interface ArchiveClient {
  baseUrl: string
  items<T>(collection: string, query?: Record<string, string>): Promise<T[]>
}

/** Minimal read-only Directus client: GET /items/<collection>. No SDK, no auth (public read). */
export const createArchiveClient = (baseUrl: string): ArchiveClient => {
  const root = baseUrl.replace(/\/$/, '')
  return {
    baseUrl: root,
    async items<T>(collection: string, query: Record<string, string> = {}) {
      const url = `${root}/items/${collection}?${new URLSearchParams(query).toString()}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${collection}: ${response.status} ${response.statusText}`)
      const body = (await response.json()) as { data: T[] }
      return body.data
    }
  }
}
