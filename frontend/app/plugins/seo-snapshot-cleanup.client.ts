// The deploy writes each route's head tags into a static snapshot (scripts/seo-snapshot.mjs) for
// crawlers and link previews that do not run JavaScript. Once the app runs, usePageSeo() owns the
// head, so the snapshot copies go before they could double up.
export default defineNuxtPlugin({
  name: 'seo-snapshot-cleanup',
  enforce: 'pre',
  setup() {
    for (const element of document.querySelectorAll('[data-seo-snapshot]')) element.remove()
  }
})
