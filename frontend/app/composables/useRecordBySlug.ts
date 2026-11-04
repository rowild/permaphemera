import type { ComputedRef, Ref } from 'vue'

/**
 * The record of a detail page, found by the slug in the address. An unknown slug throws the
 * site's fatal 404 with the page's own message (`notFoundKey`, e.g. 'venue.notFound') during
 * setup; `fatal` lets the browser show the error page, without it the page stayed empty. The
 * page still guards its template with v-if on the record (check:directories).
 */
export const useRecordBySlug = <T extends { slug: string }>(list: Ref<T[]>, notFoundKey: string): { slug: string, record: ComputedRef<T> } => {
  const route = useRoute()
  const { t } = useI18n()
  const slug = String((Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug) ?? '')
  const record = computed(() => {
    const found = list.value.find((item) => item.slug === slug)
    if (!found) throw createError({ statusCode: 404, statusMessage: t(notFoundKey), fatal: true })
    return found
  })
  // Read once here, so an unknown slug throws during setup, before the template reads it.
  void record.value
  return { slug, record }
}
