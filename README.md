# PERMAPHEMERA

PERMAPHEMERA is a curated digital archive for temporary exhibitions and spatial memories. This repository currently contains a frontend-only landing-page prototype based on the supplied editorial mockups.

## Status

The first Nuxt frontend milestone is implemented. The landing page includes:

- responsive header and hero with an interactive kaleidoscope;
- searchable locations, exhibitions, and artist archive sections;
- framed venue and exhibition cards backed by local JSON;
- an illustrated explanation of the archive method;
- a horizontally draggable sponsor strip and dark editorial footer.

The prototype does not connect to Directus or another live backend. Detail pages, real language switching, deployment infrastructure, and the interactive 360-degree exhibition viewer remain future work.

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
app/assets/css/main.css        visual system and responsive layout
public/images/landing/         raster assets used by the site
public/svg/                    frames, icons, and ornaments
docs/STYLE_GUIDE.md            reusable frontend design system and page rules
AGENTS.md                      repository instructions for coding agents
changelog.md                   version history
```

## Data Source

Local JSON files live in `app/data/`. Keep their shape compatible with the future Directus schema documented in `../_Plans/exhibitions-plan.md` so the adapter can later change without rewriting components.

## Implemented Landing Sections

The single route in `app/pages/index.vue` contains the hero, locations, selected exhibitions, artists, archive method, sponsors, and footer. Search fields filter the local JSON collections. Section navigation works through anchors; the language switcher and archive/detail links are visual placeholders for later milestones.

The hero kaleidoscope uses Three.js, while GSAP drives landing-page interactions. Custom image masks and frames are implemented as Vue/SVG components, and runtime artwork is served from `public/images/landing/` and `public/svg/`.

## Design Guidance

Read `docs/STYLE_GUIDE.md` before designing or implementing a new page. `AGENTS.md` instructs coding agents to load the guide only for design-related work, avoiding unnecessary context use during unrelated tasks.

Local design-source and backup folders named `_Material/` and `_BU/` are intentionally ignored. Runtime assets required by the application must live under `public/` or `app/assets/`.
