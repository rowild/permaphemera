// The deploy writes each route's head tags into a static snapshot (scripts/seo-snapshot.mjs) for
// crawlers and link previews that do not run JavaScript. Once the app runs, usePageSeo() owns the
// head, so the snapshot copies go before they could double up.
import { removeSnapshotTags } from '../../shared/seo.mjs'

export default defineNuxtPlugin({
  name: 'seo-snapshot-cleanup',
  enforce: 'pre',
  setup() {
    removeSnapshotTags(document)
  }
})
