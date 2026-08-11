# PERMAPHEMERA

PERMAPHEMERA is a curated digital archive for temporary exhibitions and spatial memories. This repository contains a frontend-only archive prototype based on the supplied editorial mockups and locally sourced exhibition material.

## Status

The first Nuxt frontend milestone is implemented. It includes:

- responsive header and hero with an interactive, replayable kaleidoscope and randomized preloaded image pool;
- searchable locations, exhibitions, and artist archive sections;
- framed venue and exhibition cards backed by local JSON, with single-line overflow-aware titles and custom full-title tooltips;
- a searchable, URL-filterable gallery atlas with 26 small Austrian galleries across all nine federal states;
- a searchable exhibition index with reusable framed record cards and direct detail routes;
- an illustrated explanation of the archive method;
- a horizontally draggable sponsor strip and dark editorial footer;
- dynamic gallery dossiers with location-specific record search, currently led by Parkschlössl;
- seven real 2026 Parkschlössl exhibition records derived from local source PDFs;
- a compact selectable exhibition ledger with a preloaded, responsive active preview;
- dynamic exhibition-detail pages with baseline-aligned location, date, and opening-hours metadata, source invitations, and related records;
- a routed, URL-filterable artist directory with history-aware alphabet routes, compact groups, and on-demand record details;
- shared hero scroll cues on the landing, gallery, and exhibition routes that fade away when their destination section enters the viewport;
- shared routed header/footer components, a functional mobile navigation menu, and overflow-aware sponsor controls;
- complete English/German UI and local content translations with locale-aware routes and a working language switch;
- a site-styled privacy notice for the necessary language-preference cookie, dismissible and reopenable from the footer;
- a responsive temple-mark identity with browser, Apple touch, and installable web-app icons;
- a two-accent design system using one semantic archive red and one decorative archive ochre across light and dark surfaces.

The prototype does not connect to Directus or another live backend. It uses local English source records, local German translation overlays, and bundled UI locale files. Production is configured as a client-rendered SPA for static shared hosting; provider-specific infrastructure and the interactive 360-degree exhibition viewer remain future work. The exhibition pages deliberately show the 360 entry point as unavailable until a real spatial record is connected.

The active architecture plan is `../_Plans/exhibitions-plan.md`; the design references are under `../_Plans/designs/landing-page/`. These planning files are adjacent workspace material and are not part of this frontend Git repository.

## Requirements

- Node.js 24.11.1, selected through `.nvmrc`
- pnpm 11 or newer

## Commands

Run all commands from this directory:

```bash
source "$NVM_DIR/nvm.sh"
nvm use
pnpm install
pnpm dev
```

The configured development URL is `http://localhost:4991`.

Build and preview production output:

```bash
pnpm check:tailwind
pnpm check:i18n
pnpm check:artists
pnpm check:directories
pnpm check:links
pnpm check:locations
pnpm check:mobile
pnpm build
pnpm generate
pnpm preview
```

`pnpm build` and `pnpm generate` both generate the client-rendered SPA and write the complete deployable website to `.output/public/`; neither produces or requires a Node server bundle. `pnpm preview` serves that directory locally for production-output checks. The bundled `public/.htaccess` preserves clean client-side routes on Apache-compatible hosting by sending unmatched requests to `index.html`. Hosting under a subdirectory instead of the domain root requires a matching Nuxt `app.baseURL` and asset-path audit.

The guarded SFTP publisher uses local credentials from the ignored `.env.deploy.local` file. Copy `.env.deploy.example`, fill in the existing shared-host target and OpenSSH private-key path, then verify the full generation/output inspection without uploading:

```bash
pnpm deploy:dry-run
```

Publish only when that succeeds:

```bash
pnpm deploy
```

The deploy command regenerates the SPA, requires `index.html` and `.htaccess`, validates that the remote path is an account document root under `/www/htdocs/`, uploads `.output/public/` over SFTP, publishes entry documents after hashed assets, and confirms that the remote `.htaccess` exists. It does not provision hosting, databases, SSL, or backend services.

`pnpm check:tailwind` loads the project Tailwind design system and fails when bracket notation has an exact canonical utility equivalent or when a human-readable structural marker is unspaced or CSS-active. `pnpm check:i18n` verifies UI message parity, translated record coverage, stable content identifiers, localized route switching, and global privacy-notice wiring. `pnpm check:directories` protects gallery coverage, canonical index/detail routing, search contracts, and shared frame usage. The remaining focused checks protect artist modal routing and accessibility, archive text-link variants, the location exhibition browser, and compact responsive-density contracts.

The static SPA build succeeds. It currently emits non-fatal Vite notices for root-relative assets served from `public/` and a client chunk-size warning caused by the graphics-heavy landing experience.

## Repository Map

```text
app/components/                reusable visual components
app/composables/               local archive data adapter
app/data/                      JSON content source
app/data/translations/de/      German record-field translation overlays
i18n/locales/                  English and German UI/accessibility messages
app/pages/index.vue            landing page composition and interactions
app/pages/locations/index.vue  searchable Austrian gallery atlas
app/pages/locations/[slug].vue dynamic gallery dossiers
app/pages/exhibitions/index.vue searchable exhibition archive
app/pages/exhibitions/[slug].vue dynamic exhibition records
app/pages/artists/index.vue    searchable artist directory
app/assets/css/main.css        theme, base rules, and branded visual infrastructure
public/images/landing/         raster assets used by the site
public/images/locations/       optimized location/exhibition artwork
public/svg/                    frames, icons, and ornaments
docs/STYLE_GUIDE.md            reusable frontend design system and page rules
docs/tailwindcss-v4-usage.md   Tailwind v4 notation and project architecture rules
AGENTS.md                      repository instructions for coding agents
changelog.md                   version history
```

## Data Source

Local JSON files live in `app/data/`. English is the canonical record language; ID-keyed German field overlays live in `app/data/translations/de/`, while `locations.json` retains its Directus-style per-record translation array for gallery descriptions. `app/composables/useArchiveData.ts` combines both forms reactively for the active locale while stable IDs, slugs, media paths, relations, and sorting dates remain in the canonical records. UI, navigation, SEO, accessibility, and privacy-notice messages live in `i18n/locales/en.json` and `i18n/locales/de.json`.

The content stays inside the application bundle instead of `public/`: the existing data adapter uses static local imports, so locale changes require neither a remote server nor client-side HTTP requests. This keeps the current frontend-only architecture intact while leaving the adapter boundary available for a future Directus migration.

## Implemented Routes And Sections

The landing route in `app/pages/index.vue` contains the hero, locations, selected exhibitions, artists, archive method, sponsors, and footer. Search fields filter the locale-reactive local JSON collections. Its shared header and footer provide localized navigation, active states, an always-available header menu, a tablet/mobile footer drawer, sponsor-strip controls, and an English/German switch that preserves the equivalent route (`/` for German and `/en/` for English). German remains the configured fallback locale, while first entry at the root detects the browser language and may redirect English-language browsers to `/en/`; the necessary `permaphemera-locale` cookie remembers detection and explicit choices. Landing-page alphabet links open the full artist directory at the selected letter and preserve an active artist-search term; the alphabet rail also supports dragging, keyboard scrolling, and explicit left/right controls.

The site-styled privacy notice explains that language-preference cookie without claiming consent for analytics or advertising that the app does not use. Dismissal is remembered locally under `permaphemera-cookie-notice-dismissed`; the footer's cookie-settings action reopens the notice.

`app/pages/locations/index.vue` is the canonical gallery atlas. It reads all 26 gallery profiles from `locations.json`, searches names, towns, states, addresses, and descriptions immediately, preserves search/state filters in the URL, and exposes all nine federal states on a draggable filter rail. The landing-page gallery selection now derives from that same source and links its paper stack to the complete atlas.

`app/pages/locations/[slug].vue` resolves every gallery from `locations.json`, then layers optional richer dossier fields from `venues.json`. Every gallery route therefore works even before exhibition records exist. Parkschlössl retains its seven 2026 exhibitions as compact, keyboard-accessible records. Search filters immediately across artist, title, date, medium, and record copy while preserving `q` in the route. Hover, focus, or click selects a sticky preview; images are preloaded before the active preview changes and a visible archival loader or error state covers the transition.

`app/pages/exhibitions/index.vue` searches every routed local exhibition across title, artist, gallery, city, date, medium, and record text while preserving `q` in the URL. `app/pages/exhibitions/[slug].vue` resolves the same data into individual records with dates, opening hours, vernissage, source PDF, gallery-aware breadcrumbs and return paths, related exhibitions, and a prepared—but disabled—360-degree experience section.

`app/pages/artists/index.vue` expands the landing-page artist preview into a text-led directory. It combines the artist and exhibition datasets, splits multi-artist credits into individual entries, presents personal names in `Family, Given` form, and exposes URL-backed name/location/year search and alphabet filters. Each available alphabet item and each longer-group action is a real Nuxt link to `/artists/?letter=<letter>`, preserves an active search query, and creates an ordinary browser-history entry. Organization names retain their natural order. The all-letters view shows at most five names per letter through the single `artistsPerLetterPreview` setting; longer groups link into their complete letter view. Artists with routed records open a focus-trapped exhibition modal from either the name or information control; artists without records remain visibly muted non-interactive text.

The hero kaleidoscope uses perspective-projected Three.js triangles with GSAP-driven unfolding around each blade's own median axis, directional ritardando, elastic settling, coordinated orbit-arrow rotation, and damped per-slice rotations. Its forty-image location pool preloads after the page becomes idle; directional controls select randomized cached imagery through overlapping one-second dual-layer swaps, with per-slice loading indicators retained as a fallback. The centre control runs a staggered exit and restarts the complete entrance with new images, while all controls expose accurate animated/disabled states. A shared archival scroll cue reveals the continuation of the landing, gallery, and exhibition heroes, then observes its target and fades out as soon as that next section enters the viewport. Routed gallery and exhibition dividers follow the destination content section rather than appearing directly below the cue.

Header and footer wordmarks share the uncircled archival temple mark; favicon, Apple touch, and web-app variants place it on a parchment field for reliable contrast. Navigation links use a fading archival-rule underline, logo lockups never underline, and the visual system resolves semantic interaction states to archive red `#a6523c` while static ornaments on dark surfaces use archive ochre `#ca9e51`.

Custom image masks and frames are implemented as Vue/SVG components, and runtime artwork is served from `public/images/landing/`, `public/images/locations/`, and `public/svg/`.

## Design Guidance

Read `docs/STYLE_GUIDE.md` before designing or implementing a new page. Read `docs/tailwindcss-v4-usage.md` before adding or migrating Tailwind classes. Vue scoped styles and CSS Modules are prohibited: custom rules belong in the globally imported CSS architecture and must reuse existing tokens and component rules wherever possible.

The hand-drawn archival ornaments are transparent PNGs reconstructed from the landing-page mockups. Canonical runtime files live in their normal section folders under `public/images/landing/`; matching `_recreated_anew/` folders preserve the reconstructed versions for comparison and future refinement. Photographic venue and archive-method compositions are intentionally separate and must not be regenerated as ornaments.

Local design-source and backup folders named `_Material/` and `_BU/` are intentionally ignored. Runtime assets required by the application must live under `public/` or `app/assets/`.
