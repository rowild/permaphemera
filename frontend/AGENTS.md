# Agent Instructions

## Project State

This repository is the PERMAPHEMERA frontend: the first working milestone for a curated archive of temporary exhibitions and spatial memories. It implements the complete landing page, routed gallery and exhibition indexes, and local-data detail routes as a client-rendered static SPA. Publishing to the existing shared host is supported through the guarded SFTP workflow, and exhibition pages open their exported 360° tours in the embedded viewer; backend services and broader provider provisioning remain deferred.

The primary active plan is `../_Plans/exhibitions-plan.md`. Treat `../_Plans/original chat.md` as historical context, not as the current implementation source of truth. This folder is one part of a single repository whose root holds `_Plans/`, `directus/` and this `frontend/`; read the root `AGENTS.md` first.

The `frontend-qa-checklist` skill referenced below lives in `../.claude/skills/` at the repository root, because Claude Code is run from the root workspace directory rather than from `frontend/`. The `fin-patch` skill is installed globally in `~/.claude/skills/fin-patch/` and works in any repository from any directory.

## Design Source Of Truth

Current website design inputs live in `../_Plans/designs/landing-page/`.

Approved design specifications for individual features live in `docs/superpowers/specs/`, named `YYYY-MM-DD-<topic>-design.md`. Read the relevant specification before implementing or revising the feature it covers, and record deferred follow-up work there rather than dropping it.

The reusable visual and implementation rules derived from the landing page live in `docs/STYLE_GUIDE.md`. Read and follow that guide when creating or materially redesigning any frontend page so typography, color, spacing, imagery, components, interactions, accessibility, naming, and responsive behavior remain consistent. How CSS is organised in this repo — the escalation order for custom CSS, token-before-bracket policy, and static class detection in Vue — lives in `docs/CSS_ARCHITECTURE.md`; read it before adding a custom CSS rule or a bracketed utility. For Tailwind's own syntax and utility names, use the current Tailwind documentation via `context7` rather than assuming.

### The three CSS rules that get broken most

These are grouped here because they are violated repeatedly, not because they are the only rules. All three are machine-checkable: run `pnpm check:tailwind` after any change to a `.vue` template or to `main.css`, and fix what it reports rather than explaining it away.

**1. A bracketed arbitrary value is a last resort, never a first draft.** Before writing any class containing `[...]`, check whether a canonical Tailwind utility or an existing `@theme` token already produces that declaration — and use it if so. This is the single most frequent defect in this codebase.

```html
<!-- prohibited: canonical utilities already exist -->
<p class="text-[0.75rem] tracking-[0.1em] z-[1]">
<!-- required -->
<p class="text-xs tracking-widest z-1">
```

Brackets remain valid only for a genuinely exceptional exact value with no canonical equivalent. If the value repeats or carries design meaning, name it in the theme instead of bracketing it twice. The full five-step check order is in `docs/CSS_ARCHITECTURE.md` §6.1.

**Many utilities are composite — changing one property silently drops the others.** `text-base` sets a font-size *and* its paired line-height; `text-[1rem]` sets only the font-size and leaves whatever line-height was inherited. So when a request is phrased as one visual change — "make this text smaller" — never implement it as one property change:

- Move to another **named step**, which brings its correctly paired line-height with it.
- If no step fits, **define a new one** in the `@theme` block of `app/assets/css/main.css` as `--text-<name>` plus `--text-<name>--line-height`.
- **Derive the new line-height; never copy it from the neighbouring size.** Display type ≥2rem tightens to `0.98–1.15` (see `docs/STYLE_GUIDE.md` §6.4); body and UI text at `0.9–1.3rem` sits at `1.45–1.55`; metadata below `0.9rem` needs proportionally more leading at `1.35–1.45`.
- **Font sizes are never bracketed**, not even once — including fluid `clamp()` values, which become named steps too.

Before changing any utility, know what else that utility carries.

**2. Never add `<style scoped>` or CSS Modules to a Vue component.** There is no case in this project where a scoped block is the right answer. Tailwind utilities belong in the template; if a declaration genuinely needs custom CSS, it will be needed in more than one place, so it belongs in the globally imported CSS architecture under `app/assets/css/`. Search for an existing token, utility, semantic component rule, or page namespace before adding a new rule. `docs/CSS_ARCHITECTURE.md` §2 has the five-step escalation order.

**3. Structural marker groups must keep their inner spaces.** Meaningful blocks carry an inert human-readable marker at the start of the `class` attribute — `[ site-shell ]`, `[ section-band ]`, `[ venue-hero ]` — so a human reading rendered HTML can say where a problem is. **The space after `[` and the space before `]` are mandatory and non-negotiable. `[site-shell]` is prohibited — it is not a typo, do not "fix" it.** Marker tokens must never own CSS declarations, appear in project CSS selectors, or replace accessibility attributes. See `docs/STYLE_GUIDE.md` §4.1.

Every repeated content record that can grow from local data or a future CMS must be rendered by a reusable Vue component; pages may loop over those components but must not own duplicate card/row markup. Content-dependent visual variation must also belong to the component — never encode it with `:nth-child()` or `:nth-of-type()`, and never with unseeded `Math.random()`. See `docs/STYLE_GUIDE.md` §21.1 for the seeded pseudo-random pattern.

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

- Global SPA rendering (`ssr: false`) with `pnpm build` generating the shared-host-ready `.output/public/` directory
- Nuxt i18n with German as the unprefixed fallback locale, English under `/en/`, and root-entry browser-language detection
- An orbit-dial preloader for the hero. Three constraints that the code alone will mislead you about: images download through `XMLHttpRequest` and reach Three.js as blob URLs because `ImageLoader` and `TextureLoader` document `onProgress` as unsupported — do not refactor this back onto the Three.js loaders; the texture cache in `app/utils/kaleidoscopeTextures.ts` is module-scoped so it survives component unmount, so never call `releaseTextureCache()` from a lifecycle hook (it is test/teardown only); and the wheel is gated on every image and must never render partially built. Full mechanics in the hero-kaleidoscope-preloader design spec.

Run commands from this repository root with pnpm, on the Node version pinned by `.nvmrc` and `package.json`. Run `nvm use` before working so build output and script behavior stay reproducible; do not silently move to a newer Node line. `pnpm check:tailwind` verifies that bracketed candidates have no canonical Tailwind equivalent and that structural markers remain spaced and CSS-inert; `pnpm check:i18n` verifies message parity, content-overlay coverage, stable content identifiers, locale switching, and privacy-notice wiring. The focused `check:directories`, `check:artists`, `check:links`, `check:venues`, and `check:mobile` scripts protect index/detail routing and shared frames, the artist modal, archive link variants, gallery browser, and compact responsive contracts. `check:public` guards the `public/` root namespace (see Asset Handling below). `pnpm tour:publish <tour id>` copies and links one exported 360° tour (see 360° tours below). `public/.htaccess` supplies the Apache fallback for clean client-side routes. `pnpm deploy:dry-run` regenerates and inspects that output without uploading. `pnpm deploy` uses ignored `.env.deploy.local` credentials to publish to the validated shared-host document root over SFTP and must only be run when deployment is explicitly requested.

## Data Rules

The site reads its content from Directus at app start (`useArchiveSource()` in `app.vue`, URL from `NUXT_PUBLIC_DIRECTUS_URL`, default `http://localhost:8077`), into one shared snapshot in the JSON item shape; `app/data/` no longer exists. Run `bash ../directus/scripts/setup.sh --status` if a page shows the archive-unavailable error. The snapshot mirrors the Directus collections 1:1, one entry per collection, named after the collection: `pp_locations` (towns, with the coordinates radius search needs), `pp_venues` (buildings, each with a `type` and a `location`), `pp_persons` (people and collectives: name, slug, website link, nothing more), `pp_roles` + `pp_mm__persons_roles` (what a person can be), `pp_exhibitions`, `pp_exhibition_participations` (one person in one role on one show), `pp_exhibition_statements`, `pp_sponsors`, `pp_navigations` + `pp_navigation_items` (header and footer menus), and six empty `pp_mm__*` junctions for sponsor, venue and travelling-show links. The schema itself lives in `../directus/scripts/schema.mjs`; `../_Plans/exhibitions-plan.md` §2 describes it. Joins happen in `useArchiveData()` and `useSiteNavigation()`, never in components. When a field is added or removed, change `../directus/scripts/schema.mjs`, `app/types/content.ts` and §2 in the same commit. Every translatable field exists on the record as the English original and in `translations[]` for every language; `pnpm check:data` enforces that they match. Record ids are UUIDs; never refer to a record by id in code, use its `slug` or, for navigations, its `key`.

`status` (`draft` | `published`) records provenance, not visibility. Draft records render; the gate is the single `VISIBLE_STATUSES` constant in `app/utils/contentStatus.ts`. Never add a status conditional to a component.

Each record carries a `translations[]` array of `{ languages_code, … }` entries. In the frontend all languages are equal: the active locale is selected by `pickTranslation`, which falls back `locale → en → first available`. In the backend English is first — it is the language entered into Directus, and every other translation is derived from it. That is an authoring convention, not a privileged field in the data shape. Keep IDs, slugs, dates used for sorting, media paths, URLs, and relations in the canonical records. UI and accessibility messages live in the locale files under `i18n/locales/`. Do not move these records into `public/` or fetch them over HTTP unless a future runtime content source genuinely requires it.

Exhibitions do not carry a manual `featured` field. Their highlighted presentation is derived from the visitor's local day: a running exhibition first, otherwise the nearest upcoming record, otherwise the first exhibition in the reverse-chronological directory. This does not change the separate, deliberately curated `featured` field on venue records.

## Current Scope And Deferred Work

The current site is a visual prototype: landing search filters local data, the first post-hero section conditionally lists current/upcoming exhibitions from local dates, and each hero blade keeps one resolved exhibition's image, metadata, and route together. English/German language controls switch locale-aware routes and content. The 360-degree exhibition experience is connected: see "360° tours" below. Venue and exhibition actions use real Nuxt routes backed by local JSON. Cookie settings expose necessary storage plus separate optional choices for Matomo, Google Maps, and YouTube; only Matomo is currently integrated, and it must remain unloaded until its own affirmative consent. Maps and YouTube choices are stored for future integrations but must not contact those services. Directus remains part of the future production architecture, but it is not part of the current frontend milestone.

Defer these until after the Nuxt frontend basis and landing page are working:

- Directus SDK integration
- Directus collection creation
- Directus-backed translations setup
- Directus calibration extension
- Cloudflare asset bridge wiring
- Hetzner deployment configuration
- PostgreSQL/Docker infrastructure

## 360° tours

The exhibition page's `#spatial-record` band opens a 360° tour produced by the separate editor project (`_MacAPP TOUR-VIEWER`). Its user-facing routine — export, copy, link, check, deploy — is that project's Handbook Tutorial No. 3; the viewer's integration contract is its `docs/embedding.md`. What this repository holds:

- `public/media/tour-viewer/tour-viewer.js` + `tour-viewer.css` — the embeddable viewer, copied from the editor's `pnpm build:all` output and deployed with the site. Updating the viewer means copying the two files again; tours are data and need no change.
- `public/media/tours/<tour id>/` — one exported tour folder per exhibition (`tour.json` plus its panoramas). The folder name is the tour id and becomes part of the public URL, so it is decided before the first upload and never renamed. The folder is ignored by Git (`.gitignore`, `public/media/tours/`) because the panoramas weigh hundreds of megabytes; it exists only in the local working copy and on the server, so a fresh clone fails `pnpm check:public` until the tours are copied in again.
- The `pp_exhibitions` collection's `tour` field holds `"/media/tours/<tour id>/" | null` (leading and trailing slash), typed in `app/types/content.ts`, passed through `resolveExhibitions.ts` as `tour?: string`. `null` keeps the button disabled with the "in preparation" line.
- `app/components/ExhibitionExperience.vue` owns the button and the modal. The order inside its click handler is load-bearing: append the modal, call `requestFullscreen()` synchronously (any `await` first spends the click's user activation and the browser refuses), then dynamically `import()` the viewer and the stylesheet, then `mountTour`. Fullscreen is an enhancement — the modal covers the page by CSS alone, iPhone Safari has no element fullscreen. `close()` is guarded to run once because `tour:close` and `fullscreenchange` both fire, and it must always call `destroy()` or every open leaks a WebGL context until the tour goes black. The stylesheet `<link>` promise is cached: a link fires `load` once, so a second listener would wait forever.
- `pnpm tour:publish <tour id>` (`scripts/publish-tour.mjs`) is the per-tour routine in one command: it reads the export from the editor project's `_tours/exported/` beside this repository (`--from <dir>` or `TOUR_EXPORT_DIR` override it), mirrors the folder into `public/media/tours/<tour id>/` (replacing an older copy — that is how a re-exported tour goes live), links a new tour to an exhibition record (`--exhibition <slug>`, or an interactive pick from the records whose `tour` is `null` with the closest match from `tour.json`'s `meta` suggested), writes the link to Directus (needs `DIRECTUS_TOKEN` in `.env`), and runs `check:public`. It stops before deploy on purpose. `--dry-run` prints the plan. It refuses to move a tour that is already linked elsewhere and to overwrite a record's existing link — both are deliberate hand edits.
- `public/media/tours/` is gitignored: tours are operational content, like the editor's `_tours/`. Directus holds only the link (`pp_exhibitions.tour`); the server gets the folders from `pnpm deploy`, which uploads all of `.output/public` every time. Panorama images fall under `.htaccess`'s 30-day image cache; `tour.json` does not.

## Asset Handling

Planning design files stay in `../_Plans/designs/landing-page/`.

When assets are needed by the running Nuxt prototype, copy or export only the needed files into:

```text
public/media/images/landing/
public/media/images/locations/
```

Local source ornaments may be available under `../_Material/`, but `_Material/` and `_BU/` working directories must not be treated as checkout dependencies. Copy every asset required at runtime into `public/` or import it from `app/assets/`.

Hand-drawn archival ornaments use transparent PNGs reconstructed from the approved landing-page mockups. Their canonical runtime files remain in the normal section folders below `public/media/images/landing/`; matching `_recreated_anew/` folders preserve the reconstructed source set for comparison and refinement. Use the mockups—not older extracted PNGs—as the visual source when recreating an ornament. Do not regenerate photographic location images or photographic archive-method compositions as line-art assets.

**`public/` holds only root-mandated files plus one reserved namespace.** Everything in `public/` is served from the URL root, so any top-level directory there shadows a route of the same name (this is exactly how `public/locations/` once collided with the `/locations/** → /venues/**` redirect). To make that impossible going forward, `public/` may contain only files that browsers or hosting require at the root (favicons, `site.webmanifest`, `robots.txt`, `.htaccess`) plus exactly one directory, `public/media/`, which holds every asset (`media/images/`, `media/svg/`, `media/documents/`, `media/tour-viewer/`, `media/tours/`). Never add a new top-level directory under `public/`; put new asset categories under `public/media/` instead. `pnpm check:public` enforces this — it fails on any stray root file or directory, on any `image`/`hero_image`/`source_pdf` path in `app/data/*.json` that does not resolve to a real file, and on any `tour` path that is not a slash-wrapped folder holding a `tour.json`.

## Frontend Quality Bar

Match the mockups closely across desktop and mobile before expanding scope.

The full pre-ship verification checklist lives in the `frontend-qa-checklist` skill.

Do not broaden the existing static SFTP publishing workflow into backend, admin, or provider-provisioning work until that scope is explicitly requested.

## `fin-patch` Closeout Rule

When the user writes `fin-patch`, or asks to wrap up or close out finished work, run the global `fin-patch` skill, which performs the full closeout. It discovers this repository's conventions on its own — the lowercase `changelog.md`, its datetime headings, and the prose entry style — so nothing needs to be declared here. It stops at the commit; it never pushes or deploys.
