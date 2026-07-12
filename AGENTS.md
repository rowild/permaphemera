# Agent Instructions

## Project State

This repository is the PERMAPHEMERA frontend: the first working milestone for a curated archive of temporary exhibitions and spatial memories. It implements the complete landing page plus the first local-data location and exhibition detail routes; backend, 360-viewer, and deployment work remain deferred.

The primary active plan is `../_Plans/exhibitions-plan.md`. Treat `../_Plans/original chat.md` as historical context, not as the current implementation source of truth. These files are adjacent workspace references outside this Git repository.

## Design Source Of Truth

Current website design inputs live in `../_Plans/designs/landing-page/`.

The reusable visual and implementation rules derived from the landing page live in `docs/STYLE_GUIDE.md`. Read and follow that guide when creating or materially redesigning any frontend page so typography, color, spacing, imagery, components, interactions, accessibility, naming, and responsive behavior remain consistent. Tailwind CSS v4 notation and architecture rules live in `docs/tailwindcss-v4-usage.md`; read that guide before adding or migrating Tailwind classes.

Vue `<style scoped>` blocks and CSS Modules are prohibited. Tailwind utilities belong in templates, while every custom CSS rule belongs in the globally imported CSS architecture. Search for and reuse an existing token, utility, semantic component rule, or page namespace before adding a new rule.

The first implemented page must follow these mockups:

1. `landing-page-01-hero-section.png`
2. `landing-page-01-hero-section_mobile-version.png`
3. `landing-page-02-locations v2.png`
4. `landing-page-03-selected-exhibitions v2.png`
5. `landing-page-04-artists.png`
6. `landing-page-05-how-to-navigate.png`
7. `landing-page-06-sponsors-and-footer-dark.png`

Use `landing-page-06-sponsors-and-footer.png` only as the light footer alternative unless the user explicitly switches direction.

The visual language is archival and editorial: warm parchment background, serif display typography, black ink text, muted red/ochre accents, fine linework, compass/measurement motifs, restrained paper/card edges, and subtle shadows.

Logo and wordmark lockups must never be underlined. Navigation/footer text links use the fading archival-rule underline defined in `docs/STYLE_GUIDE.md`, with quick animated color changes rather than browser-default underline behavior.

## Current Frontend Implementation

The frontend foundation is complete:

- Nuxt 4, Vue 3, TypeScript, Vite, and Tailwind CSS v4
- Local JSON data exposed through `app/composables/useArchiveData.ts`
- The landing route in `app/pages/index.vue`
- A Parkschlössl location dossier in `app/pages/locations/parkschloessl-spittal-drau.vue`
- Dynamic exhibition records in `app/pages/exhibitions/[slug].vue`
- Reusable Vue components for shared header/footer navigation, hero kaleidoscope, venue masks/frames, exhibition cards, and archive arrows
- Responsive hero, locations, selected exhibitions, artists, archive-method, sponsors, and dark-footer sections
- Seven 2026 Parkschlössl records with PDF-derived local metadata and optimized runtime artwork
- A compact selectable exhibition ledger with preloaded active preview, loading/error states, and responsive mobile composition
- GSAP interactions and a perspective-projected Three.js hero kaleidoscope with coordinated orbit arrows, replay choreography, randomized preloaded image swaps, and explicit loading/disabled states
- A responsive archival-temple identity with browser/touch/web-app icons and a documented two-accent red/ochre color system
- Runtime images and SVGs under `public/`

Run commands from this repository root with pnpm. `pnpm build` is the primary release verification command. The build currently succeeds; Vite reports non-fatal resolution notices for root-relative `public/` asset URLs and a client chunk-size warning.

## Data Rules

The first frontend build must not require Directus, PostgreSQL, Docker, Hetzner, Cloudflare, or any live backend.

Use local JSON source files under:

```text
app/data/
```

Recommended initial files:

```text
app/data/locations.json
app/data/venues.json
app/data/artists.json
app/data/exhibitions.json
app/data/location-exhibitions.json
app/data/sponsors.json
```

Keep the local JSON shape compatible with the future Directus schema in `../_Plans/exhibitions-plan.md` so the data adapter can later be swapped without rewriting components.

## Current Scope And Deferred Work

The current site is a visual prototype: landing search filters local data, language controls remain presentational, and the 360-degree exhibition experience is not yet connected. Location and exhibition actions now use real Nuxt routes backed by local JSON. Directus remains part of the future production architecture, but it is not part of the current frontend milestone.

Defer these until after the Nuxt frontend basis and landing page are working:

- Directus SDK integration
- Directus collection creation
- Directus translations setup
- Directus calibration extension
- Cloudflare asset bridge wiring
- Hetzner deployment configuration
- PostgreSQL/Docker infrastructure

## Asset Handling

Planning design files stay in `../_Plans/designs/landing-page/`.

When assets are needed by the running Nuxt prototype, copy or export only the needed files into:

```text
public/images/landing/
public/images/locations/
```

Local source ornaments may be available under `../_Material/`, but `_Material/` and `_BU/` working directories must not be treated as checkout dependencies. Copy every asset required at runtime into `public/` or import it from `app/assets/`.

Hand-drawn archival ornaments use transparent PNGs reconstructed from the approved landing-page mockups. Their canonical runtime files remain in the normal section folders below `public/images/landing/`; matching `_recreated_anew/` folders preserve the reconstructed source set for comparison and refinement. Use the mockups—not older extracted PNGs—as the visual source when recreating an ornament. Do not regenerate photographic location images or photographic archive-method compositions as line-art assets.

## Frontend Quality Bar

Match the mockups closely across desktop and mobile before expanding scope.

Verify at least:

- Desktop landing layout
- Mobile hero layout
- Header navigation and language switcher behavior
- Search and archive section responsiveness
- Footer sponsor strip behavior
- Text fit inside buttons, cards, and navigation elements
- Parkschlössl location layout and compact preview interaction on desktop and mobile
- Exhibition detail layout, source links, related records, and unavailable 360 state

Avoid backend plumbing, admin tooling, or deployment work until the frontend basis has been created and the landing page is visually aligned with the mockups.

## `fin-patch` Closeout Rule

When the user writes exactly `fin-patch`, perform the full patch closeout:

1. Increase the patch version in the active `package.json` version tag.
2. Add a new entry to `changelog.md` using the package version and the current datetime as the heading.
3. Summarize the important completed changes in that changelog entry.
4. Update `AGENTS.md` and/or `README.md` if the work introduced significant new workflow, architecture, setup, or project knowledge.
5. Review the complete worktree and include all changed and untracked files, even if they were not part of the most recent task.
6. Run feasible verification commands before committing.
7. Create one or more Git commits as appropriate for the content, committing all relevant files.
