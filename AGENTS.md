# Agent Instructions

## Project State

This repository is the PERMAPHEMERA frontend: the first working milestone for a curated archive of temporary exhibitions and spatial memories. It implements the complete landing page, routed gallery and exhibition indexes, and local-data detail routes as a client-rendered static SPA. Publishing to the existing shared host is supported through the guarded SFTP workflow; backend services, the 360 viewer, and broader provider provisioning remain deferred.

The primary active plan is `../_Plans/exhibitions-plan.md`. Treat `../_Plans/original chat.md` as historical context, not as the current implementation source of truth. These files are adjacent workspace references outside this Git repository.

The `fin-patch` and `frontend-qa-checklist` skills referenced below live in `../.claude/skills/`, also outside this repository, because Claude Code is run from the parent workspace directory rather than from `frontend/`. They are therefore not available to a clone of this repository alone.

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

**3. Structural marker groups must keep their inner spaces.** Meaningful blocks carry an inert human-readable marker at the start of the `class` attribute — `[ site-shell ]`, `[ section-band ]`, `[ location-hero ]` — so a human reading rendered HTML can say where a problem is. **The space after `[` and the space before `]` are mandatory and non-negotiable. `[site-shell]` is prohibited — it is not a typo, do not "fix" it.** Marker tokens must never own CSS declarations, appear in project CSS selectors, or replace accessibility attributes. See `docs/STYLE_GUIDE.md` §4.1.

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

Run commands from this repository root with pnpm, on the Node version pinned by `.nvmrc` and `package.json`. Run `nvm use` before working so build output and script behavior stay reproducible; do not silently move to a newer Node line. `pnpm check:tailwind` verifies that bracketed candidates have no canonical Tailwind equivalent and that structural markers remain spaced and CSS-inert; `pnpm check:i18n` verifies message parity, content-overlay coverage, stable content identifiers, locale switching, and privacy-notice wiring. The focused `check:directories`, `check:artists`, `check:links`, `check:locations`, and `check:mobile` scripts protect index/detail routing and shared frames, the artist modal, archive link variants, gallery browser, and compact responsive contracts. `public/.htaccess` supplies the Apache fallback for clean client-side routes. `pnpm deploy:dry-run` regenerates and inspects that output without uploading. `pnpm deploy` uses ignored `.env.deploy.local` credentials to publish to the validated shared-host document root over SFTP and must only be run when deployment is explicitly requested.

## Data Rules

The first frontend build must not require Directus, PostgreSQL, Docker, Hetzner, Cloudflare, or any live backend.

Use local JSON source files under:

```text
app/data/
```

Keep the local JSON shape compatible with the future Directus schema in `../_Plans/exhibitions-plan.md` so the data adapter can later be swapped without rewriting components.

English is the canonical content source. Store German translations for record fields in ID-keyed overlay files under `app/data/translations/de/`; `locations.json` is the existing exception and keeps gallery descriptions in its Directus-style translation array. Keep IDs, slugs, dates used for sorting, media paths, URLs, and relations in the canonical records. UI and accessibility messages live in the locale files under `i18n/locales/`. Do not move these records into `public/` or fetch them over HTTP unless a future runtime content source genuinely requires it.

## Current Scope And Deferred Work

The current site is a visual prototype: landing search filters local data, English/German language controls switch locale-aware routes and content, and the 360-degree exhibition experience is not yet connected. Location and exhibition actions use real Nuxt routes backed by local JSON. The privacy notice documents the necessary language-preference cookie and can be reopened from the footer. Directus remains part of the future production architecture, but it is not part of the current frontend milestone.

Defer these until after the Nuxt frontend basis and landing page are working:

- Directus SDK integration
- Directus collection creation
- Directus-backed translations setup
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

The full pre-ship verification checklist lives in the `frontend-qa-checklist` skill.

Do not broaden the existing static SFTP publishing workflow into backend, admin, or provider-provisioning work until that scope is explicitly requested.

## `fin-patch` Closeout Rule

When the user writes exactly `fin-patch`, run the `fin-patch` skill, which performs the full patch closeout.