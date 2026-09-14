# Migration Plan: Selective Tailwind CSS v4 Adoption

Status: Tailwind implementation and component-ownership audit complete; rendered acceptance pending because no browser backend is available  
Last re-audited: 2026-07-13  
Project: PERMAPHEMERA frontend  
Repository and runnable root: `frontend/`  
Active workflow branch: `refactor/migrate-to-tailwind`  
Target stack: Nuxt 4, Vue 3, TypeScript, Vite, Tailwind CSS 4.3.x, Tailwind Typography 0.5.x  
Primary implementation guide: `frontend/docs/tailwindcss-v4-usage.md`

## 1. Objective

Use Tailwind CSS v4 as the preferred authoring layer for ordinary local composition—layout, alignment, spacing, sizing, basic typography, responsive behavior, and simple states—while preserving PERMAPHEMERA's semantic component contracts, current responsive behavior, archival visual language, and exact cut-corner geometry.

This remains a selective migration. Success is measured by reduced ordinary CSS duplication, clearer component ownership, consistent tokens, and stable rendering. It is not measured by the percentage of `main.css` converted.

The migration must also prepare a single rich-text styling contract for future CMS HTML rendered through Vue's `v-html`. Tailwind Typography now supplies the generated `.prose` descendant system; PERMAPHEMERA owns its project-specific colors, typography, spacing, and safety contract.

## 2. What changed since the first plan

The first plan described one primary route and roughly 2,500 lines of global CSS. That is no longer the application being migrated.

The 2026-07-12 audit found:

- three active page families: the landing page, the Parkschlössl location dossier, and dynamic exhibition-detail routes;
- 12 Vue files across the app shell, three pages, and shared components;
- a 718-line landing page and a 1,065-line Three.js/GSAP hero component;
- 4,044 lines of global CSS before this workflow's Typography preparation;
- 206 unique literal class tokens and 317 literal class occurrences after the first pilot was introduced;
- 12 dynamic `:class` bindings, all of which must continue to use complete static Tailwind tokens whenever utilities are involved;
- seven media-query blocks, with important behavior at `1100px`, `900px`, `700px`, `420px`, and `prefers-reduced-motion`;
- no Vue `<style>` blocks and no CSS Modules;
- a larger shared design system covering routed-page navigation, ledgers, preview states, loaders, exhibition experience panels, related records, and dark-surface content;
- a clean production build before migration, with known non-fatal notices for the Nuxt module-preload sourcemap, root-relative `public/` assets, and a client chunk over 500 kB.

The migration must therefore cover cross-route consumers and must not treat `app/pages/index.vue` as the complete website. The 2026-07-13 route expansion subsequently added the routed artist directory and converted the location dossier to a reusable slug route, bringing the current implementation to four page families and 18 Vue files.

## 3. Binding sources

Read these before every migration slice:

1. `frontend/AGENTS.md`
2. `frontend/docs/STYLE_GUIDE.md`
3. `frontend/docs/tailwindcss-v4-usage.md`
4. `frontend/app/assets/css/main.css`
5. every Vue consumer of the selectors being changed
6. relevant approved mockups under `_Plans/designs/landing-page/`

`STYLE_GUIDE.md` is authoritative for appearance and interaction. `tailwindcss-v4-usage.md` is authoritative for Tailwind notation, CMS prose usage, and project CSS architecture. When framework convenience conflicts with either guide, preserve the guides.

## 4. Current implementation baseline

### 4.1 Tailwind and Typography

Tailwind is installed and compiled through `@tailwindcss/vite`. The global stylesheet imports Tailwind and exposes archive colors and fonts through `@theme`.

This workflow additionally prepares future CMS content by:

- installing `@tailwindcss/typography` as a development dependency;
- registering it with `@plugin "@tailwindcss/typography"` in `main.css`;
- explicitly generating only `prose`, `prose-invert`, and `not-prose` while no current template consumes them;
- retaining the standard generated `.prose` class name;
- overriding Typography's prose variables and key font weights to match the archive palette and the style guide;
- documenting `.prose.prose-invert` for intentional night surfaces and `.not-prose` for embedded interface components;
- deferring actual `v-html` adoption until a trusted rich-text field or explicit local rich-text fixture exists.

Future usage:

```vue
<div class="prose" v-html="sanitizedContent" />
```

Vue's `v-html` does not sanitize markup. `sanitizedContent` is a required contract, not a suggestive variable name. The future content adapter must allowlist approved elements and attributes and reject scripts, event handlers, unsafe URLs, unapproved embeds, and inline styles before rendering.

### 4.2 Runtime routes included in verification

| Route family | Current source | Main styling ownership |
|---|---|---|
| Landing | `app/pages/index.vue` | landing selector families plus shared shell/components |
| Gallery dossier | `app/pages/locations/[slug].vue` | `.location-*`, shared search, records, frames, shell |
| Exhibition record | `app/pages/exhibitions/[slug].vue` | `.exhibition-detail-*`, `.exhibition-experience*`, related records, shared shell |
| Artist directory | `app/pages/artists/index.vue` | shared search/index infrastructure plus Tailwind-owned directory composition |

The original three route families returned HTTP 200 during the pre-migration runtime check using valid local-data slugs. Current verification additionally includes `/artists/` and at least one non-Parkschlössl gallery slug.

### 4.3 Selector ownership and risk inventory

| Area | Consumers | Migration risk | Decision |
|---|---|---:|---|
| Archive language switch | header and footer | low | first pilot; extract one Vue component and move ordinary rules to static utilities |
| Basic routed-page ledgers and action wrappers | location and exhibition pages | low-medium | early slices after pilot review |
| Related-record grid and ordinary copy wrappers | exhibition detail | medium | migrate bounded layout/type rules; retain branded surfaces globally |
| Footer copyright/link layout | shared across every route | medium | migrate after shared responsive states are baselined |
| Landing artist/method ordinary copy layout | landing only | medium | migrate while retaining paper stacks, stamps, dividers, and pseudo-elements globally |
| Header shell and mobile navigation | every route | medium-high | defer until sticky, menu, focus, and breakpoint states have screenshots |
| Search fields and buttons | landing shared families | high | keep frame and interaction contracts global; utilities only around them |
| Location selectable ledger/preview | location route | high | preserve active/loading/error states and sticky behavior |
| Cut-corner frames and masks | multiple routes/components | critical | never translate geometry to utilities; keep shared SVG and global CSS infrastructure |
| Hero kaleidoscope and controls | landing/Three.js/GSAP | critical | explicitly deferred unless a separate defect or redesign requires it |
| Paper stacks, sponsor strip, ornaments, dark footer artwork | landing/shared footer | high-critical | retain global semantic CSS and coordinated pseudo-elements |

## 5. Target architecture

### 5.1 Vue templates

Use static Tailwind utilities for:

- flex/grid composition and alignment;
- ordinary gaps, padding, and margins;
- straightforward dimensions, overflow, and positioning;
- basic type, color, opacity, and simple transitions using project tokens;
- simple responsive changes and native state variants;
- readable one-off exact values when a style-guide value has no suitable token.

Use reusable Vue components when markup, accessibility, behavior, or a stable utility bundle forms a real contract. Do not copy the same long utility string across callers.

### 5.2 Global CSS

Retain global CSS for:

- theme variables and element defaults;
- Tailwind Typography's project-level `.prose` customization;
- buttons, search controls, archive links/arrows, and other semantic brand components;
- `border-image`, SVG geometry, masks, pseudo-elements, and coordinated child selectors;
- paper backgrounds, stacks, rulers, crosshairs, stamps, and ornaments;
- tuned keyframes, reduced-motion overrides, and complex interaction systems;
- globally namespaced page exceptions.

Vue `<style scoped>` and CSS Modules remain prohibited.

### 5.3 Exact frame invariant

The cut-corner frame is release-critical and is not a Tailwind migration target.

Allowed implementations remain:

1. nine-slice CSS `border-image` for rectangular controls and panels;
2. shared dynamic SVG paths and matching masks from `app/utils/venueFrameGeometry.ts` for live-size cards and images.

Never stretch a full frame SVG, approximate it with a polygon or radius, allow content outside its mask, or duplicate the geometry as arbitrary utility values. Every slice touching a framed area requires minimum/maximum desktop/mobile corner inspection.

### 5.4 Tokens

Add an `@theme` token only when the audit proves it is a repeated design decision and a generated utility is useful. Keep asset URLs, geometry, and implementation-only values in `:root`.

Do not reset Tailwind's entire default theme and do not change an approved value merely to use a default utility.

## 6. Migration rules

For each slice:

1. identify every Vue consumer and every responsive/state override;
2. capture or confirm the rendered baseline at all affected breakpoints;
3. before writing any bracket notation, check for an exact canonical Tailwind utility and existing project theme utility; canonical equivalents are mandatory and editor canonicalization warnings are defects;
4. classify each declaration as utility, token, semantic global CSS, complex global infrastructure, or dead code;
5. move only ordinary local composition into complete static utilities;
6. promote repeated raw values, colors, breakpoints, and state selectors to named tokens, variants, components, or global rules;
7. reuse or extract a Vue component when the utility bundle has a stable semantic contract;
8. remove an old declaration only after all consumers are accounted for;
9. inspect hover, focus-visible, keyboard, disabled, ARIA/data states, wrapping, overflow, and reduced motion;
10. run `pnpm build` and route-level checks before expanding the scope.

Dynamic Tailwind fragments remain prohibited:

```vue
<!-- prohibited -->
<div :class="`text-${tone}-500`" />
```

Use literal maps or Vue object/array bindings in which every possible utility token appears complete in source.

## 7. Execution plan and progress

### Preparation: re-audit and CMS rich-text foundation

Status: completed in this workflow, except fresh screenshot capture.

Completed:

- confirmed the active Git root and branch;
- re-read `AGENTS.md`, `STYLE_GUIDE.md`, Tailwind guidance, all route/component names, and the global stylesheet structure;
- inventoried routes, Vue files, global CSS size, class usage, dynamic bindings, responsive boundaries, shared consumers, and critical systems;
- ran a successful pre-change production build and recorded its existing notices;
- started the Nuxt app and confirmed valid landing, location, and exhibition routes return HTTP 200;
- installed and configured Tailwind Typography;
- prepared the project `.prose` contract and documented future sanitized `v-html` usage.

Pending environmental item:

- capture fresh rendered desktop/mobile screenshots. No controllable browser session was available during this audit. This must be completed before a slice with non-trivial visual or responsive risk is accepted.
- browser availability was rechecked on 2026-07-13; the configured browser runtime exposed no usable browser backend, so the acceptance matrix could not be executed in this environment.

### Step 1: low-risk shared pilot — language switch

Status: code and build verification completed on 2026-07-12; rendered visual review remains pending because no controllable browser session was available.

Scope:

- extract the duplicated header/footer EN/DE markup into `ArchiveLanguageSwitch.vue`;
- move only its inline-flex, gap, font, color, breakpoint, and `aria-current` declarations to static Tailwind utilities;
- retain surrounding header/footer layout and all branded link/frame rules unchanged;
- remove only the now-unconsumed `.language-switch` rules and their `700px`/`420px` overrides.

Why this is the first slice:

- the markup is duplicated and has a stable semantic/accessibility contract;
- it has no pseudo-elements, geometry, animation, or asset dependencies;
- its complete responsive state is small enough to compare precisely;
- it tests Tailwind token utilities, arbitrary breakpoint values, an ARIA state variant, component reuse, and conservative CSS deletion without touching a major layout.

Exit criteria:

- header and footer instances render identically at desktop, `700px`, and `420px` boundaries;
- EN retains the archive-red current state and DE retains archive-muted;
- accessible naming is present in both placements;
- generated CSS contains the expected utilities;
- production build and all three route checks pass;
- no `.language-switch` consumer or rule remains.

The Step 1 diff must be reviewed before Step 2. If no controllable browser is available, continue bounded low/medium-risk slices using exact declaration equivalence, generated-CSS inspection, production builds, and route checks, while keeping rendered visual acceptance explicitly pending. Browser unavailability must not halt the entire migration; it remains a release/acceptance gate for affected slices and a hard stop for critical geometry or interaction work.

### Step 2: routed-page ordinary primitives

Status: all four candidate slices have code, generated-CSS, production-build, and route verification completed on 2026-07-12; rendered visual review remains pending because no controllable browser session was available.

Completed in the first candidate slice:

- moved the exhibition-detail action wrapper's ordinary flex, wrapping, alignment, gap, margin, and `700px` stacking behavior into static Tailwind utilities;
- moved the exhibition metadata list's ordinary margin, rule, grid, spacing, type, color, and `700px` stacking behavior into static Tailwind utilities;
- retained the branded `.button`, `.button-secondary`, and `.exhibition-back-link` contracts in global CSS;
- removed only the now-unconsumed `.exhibition-detail-actions` and `.exhibition-detail-meta` declarations and their shared responsive selector entries;
- confirmed Tailwind generated the expected arbitrary breakpoint, grid-template, color, spacing, border, and width utilities;
- confirmed the landing, Parkschlössl location, and `all-the-magic` exhibition routes return HTTP 200 and completed a successful production build with only the recorded baseline notices.

Completed in the second candidate slice:

- moved the related-record section's heading margin, three-column grid, `700px` single-column behavior, card rows, image sizing, ordinary copy layout, spacing, type, and color into static Tailwind utilities;
- retained the related-record card's branded red rule, translucent paper surface, drop shadow, and shared focus-visible treatment in global CSS;
- expanded the compact card markup so the new utility ownership remains readable;
- confirmed the new grid, row, image, spacing, type, tracking, line-height, and arbitrary breakpoint utilities in generated CSS;
- reran the production build and confirmed the landing, location, and exhibition route families return HTTP 200.

Completed in the third candidate slice:

- moved the Parkschlössl contact rows and season-fact ledger's ordinary grids, spacing, rules, alignment, type, color, and `700px` stacking into static Tailwind utilities;
- removed the fully unconsumed `.location-contact-list` and `.location-season-facts` selector families and responsive overrides;
- confirmed their exact column templates, border colors, type values, and responsive border resets in generated CSS;
- reran the production build and route-family checks successfully.

Completed in the fourth candidate slice:

- extracted the duplicated routed-page breadcrumb shell into `ArchiveBreadcrumb.vue` with its accessible label and complete static layout utilities;
- retained only the branded breadcrumb link color, underline, and underline offset under the global `.archive-breadcrumb a` rule;
- removed the former global breadcrumb layout and `700px` margin override;
- confirmed both routed consumers render the shared breadcrumb in SSR output and reran the production build and route-family checks successfully.

Rendered visual acceptance backlog:

- compare the exhibition metadata and action area above and below `700px` in a rendered browser, including the secondary button's cut-corner frame at mobile and desktop widths.
- compare the related-record grid above and below `700px`, including card height, image crop, copy spacing, focus outline, and surface treatment.
- compare the Parkschlössl contact rows and season facts above and below `700px`, including row rules and stacked borders.
- compare both routed breadcrumbs above and below `700px`, including wrapping, spacing, and link focus treatment.

Candidate slices, one at a time:

1. exhibition-detail action wrapper and ordinary metadata alignment — code/build/route verified, visual acceptance pending;
2. exhibition-related ordinary grid/copy wrappers, excluding surfaces and embellishments — code/build/route verified, visual acceptance pending;
3. location contact/season fact wrappers — code/build/route verified, visual acceptance pending;
4. breadcrumb layout while retaining its branded hover/focus rule globally — code/build/route verified, visual acceptance pending.

Prefer these routed areas over the landing page because their ownership is narrower and their complex decorative systems are easier to exclude.

### Step 3: shared footer ordinary layout

Status: code, generated-CSS, production-build, SSR, and route verification completed on 2026-07-12; rendered visual acceptance remains pending.

Completed:

- extracted the three repeated footer navigation stacks into `ArchiveFooterNav.vue`, which owns their accessible label, title, ordinary grid, spacing, and link typography utilities;
- moved the footer copyright row's flex alignment, exact three-way basis, spacing, type, color, and `700px` stacking into static Tailwind utilities;
- retained sponsor scrolling, masks, seal, column dividers, link pseudo-elements, dark-surface artwork, and copyright ornaments globally;
- confirmed Tailwind generated the exact footer basis, spacing, child-link, and breakpoint rules;
- confirmed all three footer navigation labels and copyright content in SSR output, completed a successful production build, and confirmed all route families return HTTP 200.

Rendered visual acceptance backlog:

- compare footer navigation and copyright alignment at desktop, both sides of `1100px`, both sides of `700px`, and `420px`;
- inspect the preserved column dividers, link underlines/focus states, seal, and copyright masks alongside the migrated layout.

### Step 4: landing-page ordinary sections

Status: all five candidate slices have code, generated-CSS, production-build, SSR, and route verification completed on 2026-07-12; rendered visual acceptance remains pending.

Completed in the first candidate slice:

- moved the method copy wrapper's local position/z-index and primary-action width/margin into static Tailwind utilities;
- moved the method step number's ordinary margin/type/color and the step title/body's local size, overflow, and color into static Tailwind utilities;
- retained the method frame, stamp, image composition, step grid, dividers, number-rule pseudo-element, facts separators, and shared heading/eyebrow contracts globally;
- confirmed the migrated method utilities in generated CSS and SSR output, completed a successful production build, and confirmed all route families return HTTP 200.

Completed in the second candidate slice:

- moved the artist alphabet filter, responsive text columns, group spacing, row composition, record-count text, and compact arrow visibility into canonical-first Tailwind utilities;
- replaced the visual-only dynamic `active` class with semantic `aria-pressed` state and standard `aria-pressed:` variants;
- retained the framed artist search contract, alphabet rule semantics, group heading ornament, sidebar, and paper stack globally;
- added a named `tablet:` variant for the repeated `1100px` boundary and a reusable warm-brown rule token;
- confirmed the generated column, breakpoint, ARIA-state, color, and visibility utilities, completed a successful production build, and confirmed all route families return HTTP 200.

Completed in the third candidate slice:

- moved every shared section-heading wrapper's ordinary position, z-index, and margin into canonical utilities, including the related-record heading's distinct `2.5rem` margin;
- moved the locations venue-grid and selected-exhibition outer-grid composition and responsive column changes into static Tailwind utilities;
- removed the now-unconsumed `.venue-grid`, `.exhibition-layout`, and base `.section-heading` wrapper declarations while retaining heading typography, cards, frames, masks, and interaction systems globally;
- confirmed the generated grid and breakpoint utilities, completed a successful production build, and confirmed all route families return HTTP 200.

Completed in the fourth candidate slice:

- extracted the three identical landing search shells into `ArchiveSearchForm.vue` with canonical-first position, sizing, alignment, spacing, and compact wrapping utilities;
- retained search-field and button frames, input styling, button interaction, and artist-button sizing globally;
- confirmed all three SSR search landmarks and generated utilities, completed a successful production build, and confirmed all route families return HTTP 200.

Completed in the fifth candidate slice:

- moved the hero copy wrapper, heading, accent spans, lede, action row, secondary minimum width, and compact responsive changes into canonical-first Tailwind utilities;
- retained the hero section grid, kaleidoscope, wheel controls, scroll cue, loading states, and animation choreography globally and unchanged;
- removed the now-unconsumed landing `.hero-copy`, `.hero-lede`, and `.hero-actions` selectors;
- confirmed the generated type, layout, direct-child, and breakpoint utilities, completed a successful production build, and confirmed all route families return HTTP 200.

Canonical-utility audit completed in this slice:

- replaced `tracking-[0.1em]`, `text-[0.75rem]`, `z-[1]`, and `flex-[0_0_auto]` with exact canonical utilities;
- replaced repeated arbitrary media/state variants with `tablet:`, `compact:`, `narrow:`, and `current-page:` variants;
- replaced repeated raw copy, rule, and footer colors with named `@theme` utilities;
- confirmed every remaining bracketed template token represents an exact value, calculation, or grid definition with no canonical equivalent.

Rendered visual acceptance backlog:

- compare method copy/action placement and all three step text blocks at desktop, `1100px`, and mobile widths while inspecting the untouched frame and dividers.
- compare the alphabet filter, three/two/one-column artist transitions, row wrapping, counts, and compact arrow visibility while ensuring the paper stack remains unchanged.
- compare section-heading spacing and the locations/exhibition outer grids at desktop, `1100px`, and `700px`, including all framed-card corners.
- compare all three search shells at desktop and compact widths, including focus, wrapping, framed fields, and button sizing.
- compare hero copy, lede, action wrapping, and secondary minimum width at desktop and compact widths while ensuring the kaleidoscope and controls remain unchanged.

Suggested order:

1. method copy and basic step text alignment, excluding frame/stamp/dividers — code/build/route verified, visual acceptance pending;
2. artist text columns and basic filters, excluding paper stack — code/build/route verified, visual acceptance pending;
3. locations/exhibitions heading and ordinary wrappers — code/build/route verified, visual acceptance pending;
4. search-form outer composition while retaining framed field/button rules — code/build/route verified, visual acceptance pending;
5. hero copy layout only, excluding kaleidoscope and controls — code/build/route verified, visual acceptance pending.

Convert one bounded section per review/build cycle.

### Step 5: optional global CSS organization

Status: not performed. The selective migration has reduced `main.css` from 4,044 to 2,403 lines and clarified the remaining selector ownership sufficiently for the current workflow. A file split remains optional and must be a separate mechanical change if chosen later.

Only split `main.css` if the selective migration still leaves ownership difficult to audit. Use one global entry point and preserve source order explicitly. A reasonable destination is:

```text
app/assets/css/
  main.css
  theme.css
  base.css
  typography.css
  components/
    buttons.css
    frames.css
    forms.css
    archive-cards.css
  pages/
    landing.css
    location.css
    exhibition.css
```

Do not combine file splitting with behavioral conversion. Move rules mechanically, verify cascade, then migrate later.

### Step 6: final audit

Status: initial final static/code audit completed on 2026-07-13 and superseded by the deeper structural-marker audit in Step 8; rendered visual acceptance and the future CMS prose fixture remain pending.

Completed:

- confirmed there are no Vue style blocks or CSS Modules;
- confirmed all dynamic class bindings construct only existing semantic application classes, never Tailwind fragments;
- re-audited every remaining bracketed template token and confirmed each represents an exact value, calculation, or grid definition without a canonical equivalent;
- confirmed prohibited canonical-equivalent arbitrary values and repeated arbitrary media/state variants are absent;
- confirmed the migrated selector families are removed and branded semantic infrastructure remains global;
- extracted the repeated location/exhibition definition row into `ArchiveMetadataRow.vue`, using complete literal utility maps for its two exact variants;
- removed the confirmed-unused `.round-control` selector without touching the shared `.icon-button` contract;
- promoted the repeated night-surface light ink and heading colors to theme tokens and replaced their raw duplicates, including the Typography variables;
- updated the style and Tailwind guides with the migration-backed color tokens and current three-route architecture;
- completed `git diff --check`, a successful production build, generated-CSS inspection, SSR checks, and HTTP 200 checks for all route families.

### Step 7: extended routed-page ordinary primitives

Status: two bounded slices have code, generated-CSS, production-build, SSR, and route verification completed on 2026-07-12; rendered visual acceptance remains pending.

Completed in the exhibition body/ledger slice:

- moved the ordinary two-column section grid, exact responsive collapse, gap, top rule, body-copy width/type/color, and ledger spacing/rules into static Tailwind utilities;
- retained the semantic `.exhibition-detail-body` and `.exhibition-detail-ledger` hooks only where shared branded heading and definition typography still consume them globally;
- introduced the repeated archive body-copy color as an `@theme` token instead of duplicating raw or arbitrary color values;
- used canonical `max-w-3xl` for the exact `48rem` body-copy measure after the bracket-notation audit identified it as an existing utility;
- removed the fully replaced global layout, body-copy, ledger-shell, and ledger-row declarations.

Completed in the location about slice:

- moved the ordinary three-column section grid, `1100px` collapse, copy width/type/color, blockquote rule/type, citation type, and `700px` adjustments into static Tailwind utilities;
- retained the semantic `.location-about` and `.location-about-copy` hooks for the shared branded heading/eyebrow contracts and retained the rotated archival ornament globally;
- used canonical `mt-8`, `pl-8`, `max-w-2xl`, and `mt-4` utilities wherever exact equivalents exist;
- retained bracket notation only for the exact grid, fluid gap, one-off rule color, non-scale type/leading/spacing values, and compact padding for which no canonical or project utility is equivalent;
- promoted the repeated warm copy color to `--color-archive-copy-warm` and reused it from both utilities and remaining semantic CSS;
- removed the fully replaced global section layout, copy, blockquote, citation, and responsive declarations.

Rendered visual acceptance backlog:

- compare the exhibition body columns and ledger above and below `1100px`, including exact rules, row spacing, heading rhythm, and body-copy measure;
- compare the location about section above and below `1100px` and `700px`, including ornament visibility, blockquote width, copy measure, and citation rhythm.

Continue only with similarly bounded ordinary wrappers. Step 8 subsequently migrated the ordinary outer composition of the dark exhibition experience, location record browser, and header/mobile navigation while retaining their gradients, pseudo-elements, active/loading/error behavior, and interaction systems as global infrastructure. Frame geometry remains deferred without exception.

### Step 8: deep semantic-selector and structural-marker audit

Status: code, canonicalization, production-build, SSR, and route verification completed on 2026-07-13; screenshot-led rendered acceptance is in progress.

Completed:

- established the inert spaced-marker convention in `AGENTS.md`, `STYLE_GUIDE.md`, and the Tailwind usage guide: groups such as `[ site-shell ]`, `[ section-band ]`, and `[ location-hero ]` use mandatory internal spaces; the brackets are separate visual-delimiter class tokens, the enclosed name is the DOM/source marker, and none may own or receive CSS rules;
- added 125 unique structural markers across 170 spaced marker-group occurrences in the current Vue source for the shared shell, landing page, dynamic gallery dossier, exhibition detail, artist directory, header, footer, venue/record cards, artist archive, and method section;
- ran a collision audit over every marker and confirmed that no matching class selector exists anywhere under `app/assets/css/`;
- migrated the ordinary layout, spacing, sizing, typography, color, responsive, and simple-state declarations formerly owned by the site/page shells, section bands, shared header/footer wrappers, venue-card bodies, exhibition record list, artist sidebar, archive method, routed hero imagery, location browser outer grid/preview composition, and dark exhibition-experience outer composition;
- retained only coordinated gradients, masks, frame surfaces, pseudo-elements, active/loading/error systems, dividers, and interaction behavior under explicit unbracketed `archive-*` infrastructure classes;
- registered the repeated `900px` location-browser boundary as the named `medium:` custom variant instead of repeating an arbitrary media selector;
- removed the redundant global `.sr-only` implementation so Tailwind's canonical accessibility utility is the sole owner;
- rechecked every remaining arbitrary-value candidate with Tailwind 4's loaded project design system and `canonicalizeCandidates`; the audit reports zero canonical replacements;
- additionally replaced exact bracketed maximum widths, opacity values, filter saturation, spacing, translation, tracking, type-size, z-index, and flex values whenever Tailwind exposed a canonical class;
- reduced `main.css` from the 4,044-line pre-migration baseline to 2,367 lines without changing the protected frame geometry;
- used the first screenshot-led acceptance pass to find and remove two late global cascade overrides: `.icon-button` had defeated the desktop `hidden` utility on the mobile-menu control, while global desktop and compact `.venue-card-image` heights had defeated `size-full` on routed framed images; the mobile-menu behavior and landing-only image heights now live in explicit Tailwind utilities at their actual call sites;
- routed the shared header's Exhibitions item to the implemented `/exhibitions/all-the-magic/` record instead of the landing-page section anchor;
- completed `git diff --check`, a successful production build, SSR marker checks, and HTTP 200 checks for `/`, `/locations/parkschloessl-spittal-drau/`, and `/exhibitions/all-the-magic/`.

### Step 9: routed discovery expansion

Status: implementation, final Tailwind canonicalization, production build, SSR content checks, query-filter checks, and route/404 verification completed on 2026-07-13; manual screenshot-led rendered acceptance remains because no controllable browser was connected during this pass.

Completed:

- extracted the landing hero's bottom-centre continuation control into `ArchiveScrollCue`, reused the identical markup, motion, and accessibility contract on the dynamic gallery and exhibition heroes, and made the shared cue fade away when its destination section enters the viewport;
- converted the Parkschlössl-specific location filename into `app/pages/locations/[slug].vue`, resolved gallery content from `venues.json`, added real 404 handling, and linked landing gallery cards to their slug routes;
- added the existing nine-slice `ArchiveSearchForm` to every gallery dossier, with immediate title/artist/date/medium/copy filtering, URL-backed `q` state, live result counts, clear actions, and visible empty states;
- added `/artists/` as a text-forward, Craigslist-influenced archive directory using the established three/two/one-column index system, real history-backed alphabet routes, URL-backed search, configurable five-name letter previews, and anchored height-limited information dropdowns instead of permanently expanded record links;
- moved the gallery and exhibition ornamental dividers from directly below their hero cues to the end of each cue's destination content section;
- updated header, mobile navigation, footer, landing artist links, local venue metadata, `AGENTS.md`, and `README.md` for the new routes without changing protected frame geometry.

The remaining stylesheet is intentionally concentrated around:

- frame/mask geometry and frame-owned card surfaces;
- hero kaleidoscope, wheel controls, and scroll choreography;
- venue-card paper stacks, paperclips, ornaments, and hover transforms;
- the location ledger's per-row active state, loader/error state, and image-preview transitions;
- sponsor drag/overflow behavior, masks, footer artwork, and coordinated column dividers;
- shared buttons, search frames, archive arrows/icons, rich-text `.prose` customization, base elements, and reduced-motion overrides.

Rendered visual acceptance backlog added by this step:

- header grid, brand sizing, mobile-menu opening/focus, and ornamental divider at both sides of `1100px`, `700px`, and `420px`;
- exhibition record list sizing/crops and the method frame/dividers at desktop, tablet, and compact widths;
- Parkschlössl hero image/plate, `900px` browser stacking, selected preview, loader/error overlays, and compact action sizing;
- exhibition dark experience grid at desktop and compact widths;
- footer link grid/dividers at desktop, tablet, and compact widths;
- minimum/maximum framed-card corner inspection wherever the surrounding layout changed.

### Step 10: completion pass

Status: code migration, consumer audit, Tailwind canonicalization, production build, SSR checks, and route verification completed on 2026-07-13. Rendered acceptance remains the only open gate because the configured browser runtime reports no available browser backend.

Completed:

- removed the two competing `.venue-card` rule blocks instead of consolidating them, then moved venue-card layout, sizing, stacking placement, responsive behavior, focus/hover states, media clipping wrappers, image zoom, and featured-card composition into static Tailwind utilities at their owning call sites;
- kept only the venue stack's GSAP transform coordinates, SVG-mask configuration, paperclip masks, crosshair pseudo-elements, and divider asset under explicit `archive-*` infrastructure hooks;
- moved the ordinary structure and interaction of `ExhibitionFrameCard`, its surface wrappers, landing record surfaces, routed related cards, and location preview imagery into the component/caller utility contract without changing shared frame or mask geometry;
- completed the location ledger migration, including row layout, compact behavior, focus treatment, preview loading/error composition, and reduced-motion ownership, while retaining the coordinated selected-row pseudo-element, preview fade, and loader animation globally;
- completed the ordinary artist paper-stack, mobile navigation, sponsor strip, footer brand, footer ornament sizing, and shared scroll-cue migration while retaining their masks, border images, gradients, pseudo-elements, and GSAP/drag behavior globally;
- converted the remaining record-divider and record-icon composition to utilities, removed dead selector families, and confirmed that every spaced structural marker remains inert and collision-free;
- reran Tailwind 4's loaded project design system over every arbitrary-value candidate with `canonicalizeCandidates`; zero canonical replacements remain;
- reduced `main.css` from the 4,044-line pre-migration baseline to 1,471 lines. The retained stylesheet now consists of project theme/base rules, Typography, shared branded control contracts, SVG/mask/border-image assets, pseudo-elements, gradients, keyframes, and coordinated Three.js/GSAP/interactive systems;
- completed `git diff --check`, a successful production build with only the recorded baseline notices, and HTTP checks for `/`, `/artists/`, `/locations/parkschloessl-spittal-drau/`, `/locations/kuenstlerhaus-wien/`, and `/exhibitions/all-the-magic/`.

This conclusion was superseded by the user's repeated-content and positional-variation audit in Step 11. The only outstanding acceptance work after Step 11 is the viewport/state matrix and protected frame-corner inspection listed below; it requires a controllable browser.

### Step 11: repeated-content ownership and positional-variation correction

Status: component extraction, runtime seeded layout, stylesheet audit, Tailwind canonicalization, production build, SSR checks, and route verification completed on 2026-07-13. Rendered acceptance remains pending because the configured browser runtime exposes no usable backend.

Completed:

- extracted all repeated data-backed landing venue cards, landing exhibition cards, artist rows, artist-directory entries, location-ledger rows, related exhibition cards, method steps, method facts, framed hero images, page chrome, and kaleidoscope controls into semantic Vue components;
- replaced both artist and venue paper-stack page markup with `ArchivePaperStack`, which accepts an arbitrary item collection and owns the sheet/paperclip behavior;
- removed every `:nth-child()` and `:nth-of-type()` rule from project CSS;
- replaced positional stack transforms and card/record ornament variants with deterministic pseudo-random runtime values seeded from stable content IDs, preserving SSR/hydration stability while allowing any future CMS record count or order;
- migrated the remaining ordinary button/search, stack, venue-card, record-card, location-ledger, method, hero-control, breadcrumb, mobile-navigation, framed-image, page-ruler, sponsor-frame, and scroll-cue declarations into Tailwind utilities at their component owners;
- reduced `main.css` from the 4,044-line pre-migration baseline to 852 lines; the retained rules are theme/base and Typography configuration, asset/mask/`border-image` hooks, gradients, pseudo-elements, keyframes, and coordinated visual effects;
- added `pnpm check:tailwind`, backed by Tailwind 4's loaded project design system and `canonicalizeCandidates`, and corrected every reported non-canonical bracketed candidate; the checker now reports zero canonical replacements and also enforces spaced, CSS-inert structural markers;
- documented mandatory reusable components for repeated CMS-capable content and prohibited positional content variation and unseeded SSR randomness in `AGENTS.md`, `STYLE_GUIDE.md`, and the Tailwind guide.

No additional code-migration step remains. Future feature work must preserve these component and canonicalization gates.

## 8. Verification matrix

### 8.1 Required commands

```sh
pnpm check:tailwind
pnpm build
```

There are currently no project lint, typecheck, or test scripts in `package.json`; do not claim those gates ran. `check:tailwind` is a focused canonical-candidate check, not a general linter. Add other gates only as a separate tooling decision.

### 8.2 Required routes

- `/`
- `/locations/parkschloessl-spittal-drau/`
- one valid `/exhibitions/<location-exhibition-slug>` route
- `/artists/`
- one additional valid `/locations/<gallery-slug>/` route

### 8.3 Viewports and states

At minimum test:

- wide desktop around `1440px`;
- both sides of `1100px`;
- both sides of `900px` for the location browser;
- both sides of `700px`;
- both sides of `420px`;
- keyboard focus-visible states;
- hover/active/disabled/ARIA states touched by the slice;
- reduced-motion behavior when related transitions are changed.

### 8.4 CMS prose fixture before first production use

Before the first CMS field ships, render a sanitized fixture containing:

- `h1`–`h4`, several paragraphs, and inline emphasis;
- ordered and unordered lists, including nesting;
- internal and external links;
- blockquote and captioned media;
- table, inline code, and code block if the CMS schema permits them;
- a `.not-prose` embedded control;
- very long words/URLs and empty optional elements;
- light `.prose` and intentional night `.prose.prose-invert` variants.

Verify reading width, hierarchy, link/focus treatment, overflow, and mobile wrapping. Do not use unsanitized CMS output as the fixture.

## 9. Explicitly deferred systems

Unless a separate defect or redesign provides a reason, do not migrate:

- `venueFrameGeometry.ts` or any generated frame/mask path;
- `VenueCardFrame`, `VenueMaskedImage`, or `ExhibitionFrameCard` geometry;
- the hero kaleidoscope renderer, orbit SVG choreography, or Three.js/GSAP timelines;
- paperclip mask assets or cut-corner frame geometry;
- sponsor drag behavior and scrolling ornaments;
- global paper/background construction, rulers, crosshairs, and fixed drafting marks;
- coordinated pseudo-element and keyframe systems.

## 10. Risk register

| Risk | Impact | Mitigation |
|---|---:|---|
| Shared selector removed while another route still consumes it | high | complete consumer search before deletion; route matrix after each slice |
| Responsive cascade changes during mobile-first translation | high | verify both sides of every affected boundary; preserve exact values |
| Cut-corner frame or matching mask changes | critical | keep geometry out of migration; mandatory corner checks if nearby layout changes |
| Typography plugin introduces generic heavy headings | high | project `.prose` overrides cap headings at 400 and strong/table headings at 500 |
| Unsafe CMS markup reaches `v-html` | critical | sanitizer/allowlist contract before render; CSS is never treated as security |
| Dynamic utility fragments are missed by Tailwind detection | medium | complete literal tokens and state maps only |
| Templates become less readable than semantic CSS | medium | keep complex rules global; extract real component contracts |
| Arbitrary values proliferate | medium | promote only proven repeated decisions; keep genuine one-offs local |
| Visual regressions go unnoticed without screenshots | high | do not accept medium/high-risk slices until fresh browser baselines are available |
| Existing build notices are mistaken for new failures | low | compare against the recorded pre-migration warning set |

## 11. Definition of done

The migration is complete when:

- Tailwind is consistently used for suitable new and selected existing ordinary UI;
- every migrated selector has accounted-for consumers and conservative deletion evidence;
- reusable components own repeated semantic markup/behavior;
- branded frames, masks, ornaments, and motion remain shared and exact;
- no scoped styles, CSS Modules, or dynamic utility fragments exist;
- repeated CMS-capable content is rendered by semantic Vue components, not repeated page markup;
- content-specific visual variation is stable-ID-seeded runtime data, never positional CSS;
- `pnpm check:tailwind` reports no canonical replacement for any bracketed candidate;
- the prepared `.prose` system is verified with sanitized representative rich text before CMS launch;
- desktop, mobile, accessibility, reduced-motion, route, frame, and production-build verification pass;
- the global stylesheet is easier to audit, even if substantial complex CSS remains;
- `STYLE_GUIDE.md`, Tailwind guidance, and this plan describe the resulting architecture accurately.
