# Changelog

## 0.0.10 - 2026-08-11 21:42:52 CEST

- Added an archival orbit-dial preloader to the hero kaleidoscope: the ring spans all twelve galleries with each one owning a twelfth that fills with its own download, while the centre reports the image currently in flight as a localized title, a roman-numeral counter, and its byte percentage.
- Replaced the blocking parallel texture load with a sequential one-image-at-a-time download, fetched through `XMLHttpRequest` and handed to Three.js as a blob URL, because `ImageLoader` and `TextureLoader` both document `onProgress` as unsupported and can therefore report no per-file byte progress.
- Fixed a latent failure in which a single unreachable image rejected the gating `Promise.all`, threw out of `onMounted`, and left the hero permanently blank; a failed image now resolves to a transparent fallback and the wheel still appears.
- Stopped the hero canvas flashing white on reload by sizing and clearing the drawing buffer immediately after the renderer is created, instead of leaving an unsized default buffer stretched across the hero square until every image had loaded.
- Moved texture caching into a module-scoped LRU cache sized to the twelve displayed images plus the next twelve, so imagery survives component unmount and client-side navigation, and bounded the idle background preload to one rotation's worth instead of the entire pool.
- Changed the left and right wheel controls to reshuffle the images already on screen rather than fetching new ones, so they respond instantly with no loading state, while the middle replay control still rebuilds the wheel with fresh imagery.
- Extracted the shared orbit geometry and a roman-numeral helper into `app/utils/`, added a dependency-injected LRU cache with in-flight request sharing, and added `check:preloader` with fifty-three assertions covering all of it.
- Recompressed the forty location images with TinyPNG in place, taking the pool from 86 MB to 28 MB at unchanged 1672x941 dimensions and unchanged filenames.
- Added a thirty-day `Cache-Control` header for `/images/` in `public/.htaccess`, and pinned Node to 24.11.1 with `.nvmrc`, `engines.node`, and a `packageManager` entry so builds stay reproducible.

## 0.0.9 - 2026-08-11 12:27:24 CEST

- Added the approved design specification for the hero kaleidoscope preloader under the new `docs/superpowers/specs/` location, covering the orbit-dial loading state, a module-scoped texture cache that survives component unmount, shared orbit geometry, error handling for failed image loads, and the accessibility and reduced-motion contracts.
- Recorded the measured cause of the slow hero entrance in that specification: `onMounted` gates the whole wheel on `await Promise.all(...)` over roughly 20.5 MB of imagery, and the twelve orbit arrows are hidden from first paint, so the hero square stays blank for the entire wait.
- Documented the deferred image-optimization work with measurements, including the alpha-free location PNGs converting to WebP at roughly 26× smaller, so the blocking payload and the full randomized pool can be reduced after the preloader ships and is tested.
- Established `docs/superpowers/specs/` as the home for design specifications in `AGENTS.md`.
- Added the unused `public/svg/clarity--video-camera-line.svg` working asset so the tracked worktree matches the checkout.

## 0.0.8 - 2026-07-15 12:25:24 CEST

- Completed the Tailwind CSS v4 migration across the landing page, routed gallery and exhibition records, shared navigation, footer, cards, controls, and responsive layouts; reduced the global stylesheet from 4,044 to 883 lines while retaining masks, frame assets, gradients, pseudo-elements, animation systems, and prepared Typography infrastructure globally.
- Extracted the repeated archive interface into reusable buttons, text links, search fields, metadata and fact ledgers, framed images, dividers, page chrome, paper stacks, venue/exhibition cards, and method/sponsor/footer components; added spaced structural marker rules, canonical-utility enforcement, and stable ID-seeded layout variation without SSR randomness or positional selectors.
- Added complete Nuxt i18n routing with unprefixed German, English under `/en/`, root-only browser-language detection, route-preserving language controls, localized document metadata, English source records, German ID-keyed content overlays, and parity checks for every UI message and translated collection.
- Added a site-styled privacy notice for the necessary locale cookie, local dismissal persistence, and cookie-settings actions in the header and responsive footer navigation without introducing analytics, advertising, or live-backend dependencies.
- Built the routed artist directory with an expanded A–Z dataset, surname-aware display rules, URL-backed search and letter filters, five-name group previews, draggable/keyboard-operable alphabet rails, real exhibition associations, and an accessible focus-trapped exhibition modal for artists with routed records.
- Generalized the Parkschlössl page into the dynamic `locations/[slug]` gallery route, moved venue dossier fields into local data, localized gallery and exhibition records, persisted gallery search in the URL, refined the selectable preview ledger, and rebuilt exhibition detail pages from shared responsive components.
- Reworked header and footer navigation for dense tablet/mobile layouts, including an always-available information/legal/language menu, a focus-managed footer drawer, reusable archive link states, compact buttons and metadata, responsive sponsor controls, and shared scroll cues that disappear when their destination enters view.
- Refined the kaleidoscope entrance and replay fold/fade timing, replaced two Parkschlössl preview artworks, updated the exhibition divider, and added focused checks for Tailwind markers, mobile density, localization/privacy, artist modals, gallery browsing, and archive text-link behavior.
- Updated `AGENTS.md`, `README.md`, the web style guide, and Tailwind usage guidance with the implemented route architecture, localization model, responsive contracts, component boundaries, CMS-rich-text preparation, and release verification workflow.

## 0.0.7 - 2026-07-12 19:38:13 CEST

- Rebuilt the hero kaleidoscope around perspective-projected, dual-layer Three.js slices that unfold around their own median axes with elastic settling, directional ritardando, stronger spatial tilt, coordinated clockwise/counterclockwise orbit-arrow choreography, and clean SVG hydration attributes.
- Added a forty-image randomized location pool—including thirty new generated archive-location scenes—with idle background preloading, cached selection, overlapping one-second scale/fade swaps, retained old imagery during loading, and per-triangle loading indicators.
- Upgraded the three wheel controls with shared 3D perspective, consistent hit targets, transparent idle states, directional hover/press feedback, explicit animation-disabled states, a staggered elastic entrance overlapping the hero finish, and a replay action that exits then rebuilds the kaleidoscope with fresh imagery.
- Added the post-intro archival scroll cue, subtle card lift/image-zoom feedback, animated location-list arrows, conditional sponsor scrolling guidance, and refined footer navigation with fading archival-rule underlines that never decorate logo lockups.
- Established the archive-temple identity across header, footer, browser favicon, Apple touch icon, and installable web-app icon variants; added the web manifest, theme color, normalized footer ornament masks, and equalized sponsor/menu/copyright ornament intensity.
- Consolidated the interface into archive red `#a6523c` for semantic and interactive emphasis and archive ochre `#ca9e51` for static decoration, replacing near-duplicate colors and filter-based approximations across CSS, buttons, SVG ornaments, routed dark panels, and footer assets.
- Updated the project instructions, README, style guide, and Tailwind guidance with the new hero architecture, identity assets, semantic color roles, animated underline system, logo invariants, divider treatment, and verification expectations; added Vite dependency pre-bundling for Lucide, GSAP, and Three.js.

## 0.0.6 - 2026-07-11 19:24:54 CEST

- Added the first routed location dossier for Parkschlössl in Spittal an der Drau, combining the verified Bahnhofstraße 1a address and map coordinates with the established parchment, archival-frame, measurement, typography, and responsive design system.
- Added seven real 2026 Parkschlössl exhibition records from the supplied invitations, including typed local JSON metadata, optimized WebP artwork extracted from the PDFs, direct source-invitation links, and reusable location/exhibition data access through `useArchiveData`.
- Reworked the location exhibition index into compact single-column records with hover, focus, and click selection, a sticky active preview, preloaded image swaps, visible loading and failure states, keyboard-accessible preview controls, and responsive preview-first mobile composition.
- Added a dynamic exhibition-detail route with curatorial summary, dates, venue, hours, vernissage, source PDF, related records, and an explicitly unavailable future 360-degree experience entry point.
- Extracted the landing page header and footer into shared routed components, added real active navigation and an accessible mobile menu, and upgraded the sponsor strip with keyboard-operable scroll controls while preserving pointer dragging.
- Extended the global archival CSS architecture with namespaced location and exhibition layouts, responsive rules, focus and reduced-motion states, reusable frame geometry, corrected venue-section spacing, and the architectural preservation stamp.
- Updated the frontend data contracts with location-exhibition records and venue coordinates, retained the backend-free JSON-first architecture, and verified the complete release with a successful Nuxt production build.

## 0.0.5 - 2026-07-11 17:55:55 CEST

- Refactored the hero orbit from twelve independently generated SVG paths into one canonical curved-arrow geometry reused at twelve rotated positions, then added staggered GSAP path drawing, arrowhead fades, clockwise/counterclockwise sequencing, and a progressively slowing ritardando.
- Rebuilt the Three.js kaleidoscope entrance around per-slice radial pivots so textured triangles unfold visibly from edge-on to face-on with configurable clockwise staggering, increasing start gaps and durations, elastic overshoot, reduced-motion handling, and an overlap beginning at arrow twelve.
- Turned the three kaleidoscope controls into distinct interactions: counterclockwise and clockwise one-slice rotations now travel through the triangles as lagged seven-step damped ripples, while the centre control resets and replays the complete entrance animation for rapid testing.

## 0.0.4 - 2026-07-11 16:42:27 CEST

- Added a detailed Tailwind CSS v4 usage guide covering utility shorthand, arbitrary values and properties, variants, CSS-first directives, static Vue class detection, token strategy, reusable-component boundaries, and a selective migration assessment.
- Established a strict project-wide prohibition on Vue scoped styles and CSS Modules; all custom CSS must remain globally imported, searched for existing equivalents, and namespaced when page-specific.
- Recreated the landing page's sponsor, archive-method, exhibition, artist, and footer ornaments as clean transparent raster artwork derived from the supplied landing-page mockups while preserving the archival, hand-drawn drafting character.
- Replaced 34 canonical runtime PNG ornaments with the new versions while retaining matching `_recreated_anew` source copies for comparison and future refinement; photographic location and method-composition assets remain unchanged.
- Removed the additional CSS opacity reduction from the centered and terminal copyright-row ornaments so their native PNG color and alpha render without browser-side darkening.

## 0.0.3 - 2026-07-11 08:21:47 CEST

- Added a comprehensive PERMAPHEMERA web style guide covering the implemented visual system, responsive layouts, typography, color, spacing, imagery, UI/UX, accessibility, content voice, and frontend naming conventions.
- Established the cut-corner archival frame as a non-negotiable design invariant, documenting approved nine-slice SVG borders and shared dynamic SVG masks so corners never distort and images never overflow them.
- Corrected the locations "Show more" paper stack to use the same four-corner SVG mask geometry as its frames, assigned unique mask identifiers, and populated its four sheets with distinct existing kaleidoscope images.
- Configured Nuxt to use dedicated development port `4991` by default and updated the local run documentation accordingly.
- Added a project-level `.gitignore` for Nuxt, Node, test, environment, log, editor, and operating-system artifacts, with local `_Material/` and `_BU/` design-working directories explicitly excluded from version control.
- Updated project and agent documentation so the style guide is the required reference for new or materially redesigned frontend pages.
- Made `frontend/` the standalone Git repository and project root, consolidating `AGENTS.md`, `README.md`, `changelog.md`, `.gitignore`, and the style guide there so all future commits and release closeouts are strictly limited to the frontend application.

## 0.0.2 - 2026-07-11 07:50:55 CEST

- Completed and refined the full landing-page flow across the hero, locations, selected exhibitions, artists, archive-method, sponsor, and footer sections, including responsive layouts and tighter alignment with the supplied mockups.
- Rebuilt the archive-method presentation with exported composition artwork, illustrated step markers, archival facts, framing, quote, and stamp details.
- Replaced the static sponsor artwork with a data-driven, horizontally draggable sponsor strip, individual local sponsor marks, separators, and responsive framing.
- Improved venue and exhibition artwork with refined masks, optimized decorative images, a section divider, and safer Vue bindings for dynamic SVG attributes.
- Added the remaining landing, footer, sponsor, and method assets alongside the latest design working files so the implementation and its source material remain together.
- Updated the root and frontend documentation to reflect the implemented frontend architecture, current prototype limitations, local workflow, and successful production-build status.

## 0.0.1 - 2026-07-09 15:52:05 CEST

- Created the Nuxt 4 frontend foundation in `frontend/` using the Vite-based Nuxt setup, TypeScript, Tailwind CSS v4, and local JSON data sources.
- Built the first PERMAPHEMERA landing-page prototype from the planning mockups, including the editorial parchment visual language, serif typography, rust/copper accents, decorative SVG motifs, and responsive page structure.
- Added local content data under `frontend/app/data/` for venues, locations, artists, exhibitions, and sponsors so the first milestone remains backend-free and compatible with a future Directus adapter.
- Implemented the hero area with a Three.js kaleidoscope wheel, local landing imagery, orbit arrows, CTA styling, and responsive navigation/header behavior.
- Implemented the locations section with framed search controls, archive cards, shaped image frames, local location imagery, archive arrows, and the stacked-card "Show more" treatment.
- Copied and wired runtime assets into `frontend/public/`, including landing images, frame SVGs, background ornaments, icons, and the layered paperclip SVG assets used by the stacked-card treatment.
- Added project guidance in `AGENTS.md` for the `fin-patch` closeout workflow.
