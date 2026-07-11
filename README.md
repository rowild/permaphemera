# PERMAPHEMERA Frontend

Nuxt 4 frontend for the PERMAPHEMERA exhibition archive. The complete responsive landing-page prototype is implemented; archive detail routes and backend integration are not.

This app is intentionally JSON-first. It does not require Directus, PostgreSQL, Docker, Hetzner, or Cloudflare for the current landing-page milestone.

## Commands

Install dependencies:

```bash
pnpm install
```

Start the Vite-powered Nuxt development server:

```bash
pnpm dev
```

The configured local URL is `http://localhost:4991`.

Build for production:

```bash
pnpm build
```

Preview a production build:

```bash
pnpm preview
```

## Current Structure

```text
app/
  assets/css/main.css
  components/
  composables/useArchiveData.ts
  data/
  pages/index.vue
  types/content.ts
public/
  images/landing/
  svg/
```

## Current Data Source

Local JSON files live in `app/data/`. Keep their shape compatible with the future Directus schema documented in `../_Plans/exhibitions-plan.md`.

## Implemented Landing Sections

The single route in `app/pages/index.vue` contains the hero, locations, selected exhibitions, artists, archive method, sponsors, and footer. Search fields filter the local JSON collections. Section navigation works through anchors; the language switcher and archive/detail links are visual placeholders for later milestones.

The hero kaleidoscope uses Three.js, while GSAP drives landing-page interactions. Custom image masks and frames are implemented as Vue/SVG components, and all runtime artwork is served from `public/images/landing/` and `public/svg/`.

## Build Notes

`pnpm build` succeeds. Vite currently emits non-fatal notices for root-relative URLs that are resolved from Nuxt's `public/` directory at runtime, plus a client chunk-size warning for the graphics-heavy bundle.
