# PERMAPHEMERA Frontend

Nuxt 4 frontend for the PERMAPHEMERA exhibition archive.

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
