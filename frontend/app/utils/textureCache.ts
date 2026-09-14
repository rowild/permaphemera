export type TextureCacheOptions<T> = {
  /** Fetches a value that is not cached yet. */
  load: (url: string) => Promise<T>
  /** Releases a value the cache is dropping. */
  dispose: (value: T) => void
  /** Maximum retained entries. In-flight requests are not counted. */
  capacity: number
}

export type TextureCache<T> = {
  get: (url: string) => Promise<T>
  has: (url: string) => boolean
  size: () => number
  clear: () => void
}

/**
 * A least-recently-used cache with in-flight request sharing.
 *
 * Loading and disposal are injected so the policy carries no renderer
 * dependency and can be exercised outside a browser.
 */
export function createTextureCache<T>({ load, dispose, capacity }: TextureCacheOptions<T>): TextureCache<T> {
  // Map preserves insertion order, so the first key is always the least
  // recently used once reads re-insert their entry.
  const entries = new Map<string, T>()
  const pending = new Map<string, Promise<T>>()

  function evictOverflow() {
    while (entries.size > capacity) {
      const oldest = entries.keys().next()
      if (oldest.done) return

      const value = entries.get(oldest.value) as T
      entries.delete(oldest.value)
      dispose(value)
    }
  }

  return {
    get(url) {
      if (entries.has(url)) {
        const value = entries.get(url) as T
        entries.delete(url)
        entries.set(url, value)
        return Promise.resolve(value)
      }

      const inFlight = pending.get(url)
      if (inFlight) return inFlight

      const request = load(url)
        .then((value) => {
          pending.delete(url)
          entries.set(url, value)
          evictOverflow()
          return value
        })
        .catch((error) => {
          pending.delete(url)
          throw error
        })

      pending.set(url, request)
      return request
    },
    has: (url) => entries.has(url),
    size: () => entries.size,
    clear() {
      entries.forEach((value) => dispose(value))
      entries.clear()
      pending.clear()
    }
  }
}
