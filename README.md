# PERMAPHEMERA

PERMAPHEMERA is a curated digital archive for temporary exhibitions and spatial memories. This repository contains a frontend-only archive prototype based on the supplied editorial mockups and locally sourced exhibition material.

## Status

The first Nuxt frontend milestone is implemented. It includes:

- responsive header and hero with an interactive, replayable kaleidoscope and randomized preloaded image pool;
- searchable locations, exhibitions, and artist archive sections;
- framed venue and exhibition cards backed by local JSON;
- an illustrated explanation of the archive method;
- a horizontally draggable sponsor strip and dark editorial footer.
- a routed Parkschlössl location dossier with verified venue metadata;
- seven real 2026 Parkschlössl exhibition records derived from local source PDFs;
- a compact selectable exhibition ledger with a preloaded, responsive active preview;
- dynamic exhibition-detail pages with practical metadata, source invitations, and related records;
- shared routed header/footer components, a functional mobile navigation menu, and overflow-aware sponsor controls;
- a responsive temple-mark identity with browser, Apple touch, and installable web-app icons;
- a two-accent design system using one semantic archive red and one decorative archive ochre across light and dark surfaces.

The prototype does not connect to Directus or another live backend. Real language switching, deployment infrastructure, and the interactive 360-degree exhibition viewer remain future work. The exhibition pages deliberately show the 360 entry point as unavailable until a real spatial record is connected.

The active architecture plan is `../_Plans/exhibitions-plan.md`; the design references are under `../_Plans/designs/landing-page/`. These planning files are adjacent workspace material and are not part of this frontend Git repository.

## Requirements

- A current Node.js release
- pnpm

## Commands

Run all commands from this directory:

```bash
pnpm install
pnpm dev
```

The configured development URL is `http://localhost:4991`.

Build and preview production output:

```bash
pnpm build
pnpm preview
```

The production build succeeds. It currently emits non-fatal Vite notices for root-relative assets served from `public/` and a client chunk-size warning caused by the graphics-heavy landing experience.

## Repository Map

```text
app/components/                reusable visual components
app/composables/               local archive data adapter
app/data/                      JSON content source
app/pages/index.vue            landing page composition and interactions
app/pages/locations/           location dossiers
app/pages/exhibitions/         dynamic exhibition records
app/assets/css/main.css        visual system and responsive layout
public/images/landing/         raster assets used by the site
public/images/locations/       optimized location/exhibition artwork
public/svg/                    frames, icons, and ornaments
docs/STYLE_GUIDE.md            reusable frontend design system and page rules
docs/tailwindcss-v4-usage.md   Tailwind v4 notation and project architecture rules
AGENTS.md                      repository instructions for coding agents
changelog.md                   version history
```

## Data Source

Local JSON files live in `app/data/`. Keep their shape compatible with the future Directus schema documented in `../_Plans/exhibitions-plan.md` so the adapter can later change without rewriting components.

## Implemented Routes And Sections

The landing route in `app/pages/index.vue` contains the hero, locations, selected exhibitions, artists, archive method, sponsors, and footer. Search fields filter the local JSON collections. Its shared header and footer provide routed navigation, active states, an accessible mobile menu, and sponsor-strip controls; the language switcher remains presentational.

`app/pages/locations/parkschloessl-spittal-drau.vue` presents the verified Parkschlössl venue details and seven 2026 exhibitions as compact, keyboard-accessible records. Hover, focus, or click selects a sticky preview; images are preloaded before the active preview changes and a visible archival loader or error state covers the transition.

`app/pages/exhibitions/[slug].vue` resolves the same local exhibition data into individual records with dates, opening hours, vernissage, source PDF, related exhibitions, and a prepared—but disabled—360-degree experience section.

The hero kaleidoscope uses perspective-projected Three.js triangles with GSAP-driven unfolding around each blade's own median axis, directional ritardando, elastic settling, coordinated orbit-arrow rotation, and damped per-slice rotations. Its forty-image location pool preloads after the page becomes idle; directional controls select randomized cached imagery through overlapping one-second dual-layer swaps, with per-slice loading indicators retained as a fallback. The centre control runs a staggered exit and restarts the complete entrance with new images, while all controls expose accurate animated/disabled states. A post-intro archival scroll cue reveals the continuation of the page.

Header and footer wordmarks share the uncircled archival temple mark; favicon, Apple touch, and web-app variants place it on a parchment field for reliable contrast. Navigation links use a fading archival-rule underline, logo lockups never underline, and the visual system resolves semantic interaction states to archive red `#a6523c` while static ornaments on dark surfaces use archive ochre `#ca9e51`.

Custom image masks and frames are implemented as Vue/SVG components, and runtime artwork is served from `public/images/landing/`, `public/images/locations/`, and `public/svg/`.

## Design Guidance

Read `docs/STYLE_GUIDE.md` before designing or implementing a new page. Read `docs/tailwindcss-v4-usage.md` before adding or migrating Tailwind classes. Vue scoped styles and CSS Modules are prohibited: custom rules belong in the globally imported CSS architecture and must reuse existing tokens and component rules wherever possible.

The hand-drawn archival ornaments are transparent PNGs reconstructed from the landing-page mockups. Canonical runtime files live in their normal section folders under `public/images/landing/`; matching `_recreated_anew/` folders preserve the reconstructed versions for comparison and future refinement. Photographic venue and archive-method compositions are intentionally separate and must not be regenerated as ornaments.

Local design-source and backup folders named `_Material/` and `_BU/` are intentionally ignored. Runtime assets required by the application must live under `public/` or `app/assets/`.
