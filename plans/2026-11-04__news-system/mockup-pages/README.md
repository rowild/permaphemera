# News mockup pages (throwaway, approved 2026-11-04)

Dev-only Nuxt pages that rendered the mockups in `../mockups/`. The owner approved them on
2026-11-04, with one change that is already in these files: fewer divider lines (only a line
between list items, no extra lines above or below a list).

To look at them again: copy `news-*.vue` to `frontend/app/pages/mockups/` and `newsSample.ts` to
`frontend/app/mockups/`, then open http://localhost:4991/mockups/news-start (add `?split=third`
for 2/3 + 1/3), `/mockups/news-index`, `/mockups/news-article?slug=neue-galerien`.
Never deploy them; remove them again before a build.
