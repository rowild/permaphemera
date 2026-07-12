# Changelog

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
