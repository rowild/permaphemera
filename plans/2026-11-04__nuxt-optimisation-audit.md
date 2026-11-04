# Nuxt optimisation audit — frontend

Date: 2026-11-04. Status: **in progress** (owner: "Go!", 2026-11-04). Owner decisions:
A = the header stays at the top and shrinks to a slim bar on scroll (smaller text, padding,
margins, graphics); B = one hero type scale; C = `@nuxt/test-utils`. Text findings: see phase 6.
Trigger: the four index heroes were four drifting copies (fixed the same day with
`ArchiveDirectoryHero`). Owner: "check the whole code basis for optimisations that can be made
since we use Nuxt … and make this a rule". The rule is in `frontend/AGENTS.md` ("Build it the
Nuxt way: components first, test first").

Four read-only audits ran in parallel: duplicated markup, Nuxt feature use, data flow and
performance, tests and checks. Measurements were taken live on permaphemera.at (read-only GETs)
and against the build of 2026-11-04 14:16. Line numbers are from the working tree of that day.

Every step below is built test first (superpowers TDD). Every extraction also re-points the
source-text checks (`scripts/check-*.mjs`) or replaces them (phase 5).

---

## Phase 0 — live bugs (S, fix first) — DONE, release 0.0.50

Item 3 was no bug (`newsMarkdown.ts` localizes the links before render). Found on the way: the
404 page had no `lang`; unknown addresses now match `pages/[...slug].vue`.

1. **`/locations/**` redirect is broken.** `nuxt.config.ts:23-24`. With `ssr:false` the route
   rule only runs in the browser and does not fill in `**`: `/locations/galerie-3/` goes to
   `/venues/**` → "Galerie nicht gefunden". Fix: `pages/locations/[...slug].vue` with
   `navigateTo(…, { replace: true })` plus an nginx `rewrite … permanent` (real 301).
2. **404 page is English and links to the German home.** `error.vue:22,24` shows Nuxt's own
   "Page not found: …" and `to="/"`. Fix: text by status code via `t()`,
   `clearError({ redirect: localePath('/') })`.
3. **Links in news texts ignore the language.** `ArchiveRichText.vue:15-20` calls
   `navigateTo(href)` without `localePath`; an English article links to German pages. Check
   against `newsMarkdown.ts` (it localizes at render time) and fix the gap.
4. **Venue state filter accepts any `?state=` on load.** `venues/index.vue:9` (only the watcher
   at :64 validates). Fixed for free by the query composable in phase 2.
5. **Two internal links miss the trailing slash.** `venues/[slug].vue:337`,
   `VenueExhibitionLedgerRow.vue:46`. Fix: `experimental.defaults.nuxtLink.trailingSlash:
   'append'`.

## Phase 1 — load time (biggest gain for visitors) — 1.1, 1.2, 1.3a DONE, release 0.0.51

1.1 note: `@nuxt/image` was tried and removed again: its typings exclude `format` and `quality` for the
Directus provider, and only its address builder was used. `utils/archiveAsset.ts`
(`directusImageUrl`, `directusImageSet`, `IMAGE_WIDTHS`) + `ArchiveImage` do the job; the wheel uses
the same address. Measured: start page 16.4 → 1.3 MB, `/venues/` 18.3 → 0.7 MB.

1. **Images load as full originals.** `shared/archive-schema.mjs:66` builds plain
   `/assets/<id>` URLs; 25 `<img>`, the SVG `<image>` in `VenueMaskedImage`, and the exhibition
   hero background use them unchanged. Measured: start page 16.4 MB of images, `/venues/`
   18.3 MB, `/exhibitions/` 7.9 MB (same on a 390 px phone). One image: 845 KB → 92 KB as
   `?width=800&format=webp`. Only the wheel resizes (`kaleidoscopeTextures.ts:15`), so the start
   page loads each exhibition twice.
   Fix: `@nuxt/image` with its `directus` provider behind one `ArchiveImage` component (srcset +
   sizes, webp, SVG passed through), `useImage()` for the SVG `<image>` and the CSS background;
   the cards use the wheel's URL so the cache is shared. Keep the URL format in
   `archive-schema.mjs` (snapshots and `check:data` use it). Expect ~10–15 MB less on the start
   page.
2. **The archive is deeply reactive.** `useArchiveSource.ts:14,18` puts ~830 KB of JSON into a
   deep `useState`. Measured: all resolvers 16.3 ms deep vs 1.95 ms with `markRaw` (desktop;
   ~60–100 ms on a phone). Nothing writes to the snapshot after loading. Fix: one line,
   `markRaw` (or `shallowRef`).
3. **The archive fetch starts late.** It starts in `app.vue` setup after the locale chunk
   (first request at 753 ms, entry done at 374 ms) and is 33 requests (8 return empty). Fix (a):
   start `loadArchive` in a `.client` plugin with `enforce: 'pre'` and keep the promise
   (~350 ms earlier on desktop, untested). Fix (b), later: one request (Directus endpoint or one
   GraphQL query from `schema.mjs`) plus `<link rel="preload" as="fetch">`. Also drop unused
   `user_*` fields from `fieldsQuery` (`archive-schema.mjs:79`, ~7%); keep `date_*` (sitemap).
4. **Three.js sits in the start-page chunk.** `BsZfzi2H.js` 656 KB / 178 KB gz, from static
   imports in `HeroKaleidoscope.vue:5` and `kaleidoscopeTextures.ts:1`. Fix: keep the component
   synchronous (the faded arrows must appear at once), `await import('three')` in `onMounted`
   before the WebGL setup. The wheel already waits for `heroTextDone && belowHeroBuilt`.
   **Needs a frame-by-frame intro check (no-flash rule).**
5. **The wheel renders every frame forever.** `HeroKaleidoscope.vue:200-208`. Fix: pause with an
   IntersectionObserver when off screen; better, render only while a timeline is active.
6. **Page chunks are discovered late.** `seo-snapshot.mjs` could write `modulepreload` links per
   route from the build manifest (~one round trip on mobile).
7. **Fonts:** `@nuxt/fonts` for metric-matched fallbacks (less shift when Cormorant swaps in).
   Small; check the intro frames.

## Phase 2 — one shared piece per job (components, layout, composables)

Ranked by copies × drift. Every new piece gets a test in the component test base (phase 5).

1. **DONE 0.0.53** **`layouts/default.vue`: the page frame, 16 copies** (`<main class="[ site-shell ] …">` +
   `ArchivePageChrome` + `ArchiveHeader` + `#main-content` + `ArchiveFooter`; e.g. `about.vue:64`,
   `venues/index.vue:86`, all detail pages, `ExhibitionGroupPage`, `ArchiveLegalPage`). Drift:
   `active` missing on contact, how-it-works, news, sponsors, legal. Live side effects of today's
   frame: `<header>`/`<footer>` sit inside `<main>` (no banner/contentinfo landmark), and the
   header's `sticky top-0` does nothing (inside `overflow:hidden`). `navActive` via
   `definePageMeta`; start page `layout: false` (intro, `belowHeroStep`). **Owner decision A.**
2. **DONE (d6fbcea)** **Search ↔ URL query, 5 copies** (`exhibitions/index.vue:51-64`, `venues/index.vue:62-80`,
   `organisations/index.vue:74-87`, `artists/index.vue:81-102`, `venues/[slug].vue:145-158`;
   `normalize` 5×). → `useQueryParam(name, { validate })` + `utils/search.ts`
   (`normalize`, `matchesQuery`).
3. **DONE** **Record lookup by slug + 404, 6 copies, two styles** (`exhibitions/[slug].vue:12-19` throws
   inside a computed, others `if (!x) throw`). → `useRecordBySlug(list, notFoundKey)`. Also drop
   the duplicate `venueDossier` lookup (`venues/[slug].vue:23-27`, dead fallbacks).
4. **`ArchiveBreadcrumb` with `items`**, 16 hand-written crumb lines. Drift: the root crumb is
   missing on venue, organisation and exhibition detail pages; no `aria-current`.
5. **`ArchiveEyebrow`** (~35 copies, 5 variants) and **`ArchiveSectionHeading`** (eyebrow + h2 +
   accent + intro, ~18 copies, high drift in leading, size and margins).
6. **`ArchiveRecordHero` + `ArchiveRecordFigure`**: the detail-page hero of venue, organisation,
   person, sponsor (4 copies, high drift in grid and padding; figure 3 copies).
7. **`ArchiveEditorialHero`** (about, how-it-works, contact, legal; 4 copies) and
   **`ArchiveActionBand`** (3 copies). Today there are three hero type scales (directory,
   editorial, news). **Owner decision B.**
8. **Directory body:** `ArchiveDirectoryStatus` (5), `ArchiveEmptyState` (8; some buttons miss
   `p-0`), `ArchiveDirectoryBody` (controls → divider → results, 5; divider margin and gutter
   drift). `news/index.vue:32-39` hand-rolls `ArchiveDirectoryHero` → ledger optional, use it.
   The hero `facts` joiner (3 copies, one with a literal NBSP) moves into the hero.
9. **Smaller extractions:** `ArchiveLinkList` (comma-joined links, 17), `ExhibitionCardGrid` (5),
   `ArchiveRailItem` + shared `ALPHABET`/`artistLetterRoute` (artists letters lack the landing
   page's 44 px tap target), `ArchiveStatement` (2), `ArchiveGroupLabel` (8),
   `ExhibitionTourStatus` (2 in one page), `ArchiveMethodSteps` (2), merge `LandingArtistGroup`
   into `ArtistDirectoryGroup`, merge `LegalEditorialSection` into `ArchiveEditorialSection`,
   `ArchiveLegalPage` aside → `ArchiveContactRecord`, venue `ArchiveExhibitionsDivider` reuse,
   `useHoverActive`/`useSeededOrnament` (2 cards), `utils/siteOwner.ts` (owner address 4×), one
   date formatter util, `EditorialSection` type exported once, `ArchiveTextLink as="button"`
   (10 hand-styled "clear search" buttons).
10. **Section container tokens:** `mx-auto max-w-[105rem] px-[clamp(1.4rem,5vw,5.2rem)]` ~50×,
    `py-[clamp(3rem,5vw,5rem)]` 21× → `@theme` tokens (AGENTS.md CSS rule 1) and optionally
    `ArchiveBand`. Compact gutter drifts `px-3`/`px-4`.

## Phase 3 — data layer

1. **One `useArchiveData()` instance per app** (today 13 callers each build all computeds; the
   start page runs all seven resolvers): detached `effectScope` on `nuxtApp`.
2. **`indexArchive(snapshot)`** once: id maps and junction rows grouped by owner, passed to every
   resolver (today maps are rebuilt 4–6× per pass; per-record junction scans in
   `resolvePersons.ts:68-96`, `resolveOrganisations.ts:93-121`, `resolveVenues.ts:103`,
   `resolveNews.ts:50`). Small gain today, scales with the data.
3. **Shared resolver helpers:** `linksThrough` (4 copies incl. `seo.mjs:208`), `linked` (2),
   translated-field `text()` (~40 inline copies), `groupBy` (4), `hostnameOf` (2),
   `displayPersonName`, one image-fallback rule.
4. **Rich text sanitised twice** (`richText.ts:56-61`): once.
5. **Per-card composables and observers** (`useArchiveToday` timer, ResizeObserver, formatters
   per card) → shared instance, one observer, cached formatters. Small.
6. **Language switch** (`ArchiveLanguageSwitch.vue:17-20,113-115`) writes the cookie i18n
   already writes and navigates twice. `i18n.config.ts` `locale: 'en'` vs `defaultLocale: 'de'`.
7. **Artist modal**: one `ArtistExhibitionModal` + Teleport per artist and a no-op
   `<ClientOnly>` → `LazyArtistExhibitionModal v-if="open"` or one modal per page.
8. Auto-import consistency: 12 components import `ref`/`computed` from `'vue'`.

## Phase 4 — gates (nothing runs the checks today) — DONE 2026-11-04 (`verify`, `verify:live`, deploy gate, `.githooks/pre-commit`, `@nuxt/eslint`: 90 findings fixed, among them two pages with a comment as a second template root, a computed without return, four errors without `cause`, a prop `ariaLabel` the type check could not see)

No CI, no git hooks; `deploy-hetzner.sh` runs `nuxt generate` with no test or check.
1. `pnpm verify` = vitest + `check:conventions` + `check:tailwind` + `check:types` (offline).
   `pnpm verify:live` = `check:data` + `check:public`.
2. `verify` at the start of `deploy:hetzner`; a pre-commit hook (lefthook) running
   `vitest related --run` and `check:tailwind`.
3. `@nuxt/eslint` (understands auto-imports; can take over "never `useSeoMeta`").

## Phase 5 — test architecture (base DONE 2026-11-04: `@nuxt/test-utils`, `test/nuxt/`)

Target:
1. `test/unit` (node): pure utils and resolvers, logic pulled out of pages (search, wheel preload
   sequence), locale key parity, the `nuxt.config` object.
2. `test/nuxt` (`@nuxt/test-utils`, `mountSuspended`): components, composables, pages; assert
   rendered text, aria, emits, focus, route changes. Class assertions only for prop-toggled
   classes. **Owner decision C.**
3. `test/e2e` (Playwright on `pnpm preview`, reuse `qa/safari/drivers`): ~10 geometry rules at
   390/1024/1440 (search one row on mobile, tap targets ≥ 44 px, breadcrumb at one height on the
   four index pages, hero ≥ 480 px, header popup, footer drawer focus).
4. `check:conventions` (static, offline): Tailwind rules, markers, no `<style>`, `usePageSeo`,
   fatal 404 + `v-if` guard.
5. `check:data` + `check:public` (live Directus): all data integrity in one place, naming the
   failing records (today slug/translation checks are duplicated in `check-directory-routes`
   and `check-i18n-privacy`; one pins Parkschlössl as featured).
6. Drop pure class-string pins and "removed code stays removed" fossils in
   `check-mobile-density.mjs` (83 checks), `check-archive-text-links.mjs`,
   `check-venue-exhibition-browser.mjs`, `check-kaleidoscope-preloader.mjs`.
7. Move the real unit tests hidden in `check-kaleidoscope-preloader.mjs:48-128`
   (`romanNumerals`, `orbitGeometry`, `textureCache`) into `test/unit`.

Untested logic, by risk: **high** `useTourViewer` (fullscreen before any await, close once),
`useCookieNotice` (consent storage, legal), the index-page search, the wheel preload;
**medium-high** `ArtistExhibitionModal`, `ArchiveFooter` drawer, `ArchiveLanguageSwitch`;
**medium** `useArchiveData`/`useArchiveSource`, `ExhibitionCard`, `ArchiveAlphabetRail`;
**low** `externalLinks`, `venueFrameGeometry`, `seededLayout`.

## Phase 6 — repeated text and text-rule breaks (owner, 2026-11-04) — DONE, release 0.0.52 (`ArchiveDirectoryStatus` for the status lines; also About p3/p6/p8 and the contact selection section, same rule)

Rule: a number shows once per page; a "x von y" status line shows only while a search or a
filter is active. **Exceptions the owner keeps:** the gallery state filter (more states will
come), the artists status line (the number stays), the "9 von 9 Einträgen" line on a gallery
page (a pager will come).
1. Exhibitions index: "22 Ausstellungseinträge im Archiv." only during a search.
2. Galleries index: "12 von 12 Galerien werden angezeigt." only during a search or filter.
3. Organisations index: "19 von 19 Einträgen." only during a search; the word "Einträge" means
   exhibitions in the ledger and list rows in the status — the status uses another word.
4. Gallery page: the year twice ("Archivverzeichnis · 2026" + ledger "Saison 2026"): once.
5. Exhibition page: the short description twice (hero and "Eine temporäre Begegnung …"): once;
   "Von dieser Ausstellung gibt es keinen 360°-Rundgang." twice: once; "Künstler:innen /
   Beteiligte" and "Websites der Künstler:innen" list the same names: one row.
6. Start page: "Aktuelle / kommende Ausstellungen" above "Aktuelle Ausstellungen" and
   "Kommende Ausstellungen": no repeated heading.
7. "Im Archiv" + "… im Archiv" and "Ebenfalls im Archiv" + "Weitere Einträge aus dem Archiv":
   "Archiv" once per pair.
8. Text rules (`docs/text-rules.md`): no "Sie" (search intros, contact), no "Dokument" for an
   exhibition or tour (how-it-works ×4), no value words ("bewusste Auswahl", "kuratorischen
   Zusammenhängen", "Kurator:innen wählen Ausstellungen aus").

## Owner decisions (answered 2026-11-04)

- **A. Sticky header.** With a real layout the header leaves the `overflow:hidden` and its
  `sticky top-0` starts working: it would stay at the top while scrolling. (1) keep it scrolling
  away as today (remove `sticky`), or (2) let it stick.
- **B. One hero type scale?** Directory, editorial and news heroes use three slightly different
  title leadings and intro widths. (1) unify into one `ArchivePageIntro` scale, or (2) keep the
  three.
- **C. Test base.** (1) `@nuxt/test-utils` (real auto-imports, i18n, router; a few seconds
  slower), recommended; or (2) grow the hand-made `test/components/setup.ts`. With (1) the one
  existing component spec moves over and `frontend/AGENTS.md` changes its test sentence.

## Already good (keep)

`usePageSeo` + `shared/seo.mjs` as one SEO source; lazy locale chunks; `useRuntimeConfig` for
the Directus URL; `useState` for archive and consent; `error.vue` with `createError({ fatal })`;
the tour viewer's dynamic import and module state; `NuxtLink` via `ArchiveTextLink`/
`ArchiveButton`; `NuxtRouteAnnouncer`; Three.js objects never in refs; GSAP teardown; no deep
watchers; Lucide tree-shaken; CSS 25.6 KB gz.

## Order

Phase 5 base (decision C, so every later step is built test first) → Phase 0 → Phase 4 (gates) → Phase 1.1,
1.2, 1.3a → Phase 6 (texts) → Phase 2.1 (layout + shrinking sticky header) → 2.2–2.4 → Phase 3.1–3.3 → the rest of Phase 2 → Phase 1.4–1.7.
One release per phase or sub-phase; every step verified in the browser at 390/1024/1440 in DE
and EN.
