# Changelog

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
