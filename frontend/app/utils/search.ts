/** A search text as the index pages compare it: no outer spaces, lower case. */
export const normalizeSearch = (value: string) => value.trim().toLocaleLowerCase()

/** True when one of the values contains the query; an empty query matches everything. */
export const matchesSearch = (query: string, values: ReadonlyArray<string | null | undefined>) => {
  const needle = normalizeSearch(query)
  return !needle || values.some((value) => value && normalizeSearch(value).includes(needle))
}
