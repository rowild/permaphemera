# CSS Architecture for PERMAPHEMERA

Version: 2.0
Applies to: Tailwind CSS 4.3.x, Nuxt 4, and Vue 3
Project source of truth: `app/assets/css/main.css` and `docs/STYLE_GUIDE.md`

> [!NOTE]
> This document covers how CSS and Tailwind are organised **in this project**. It deliberately does not restate Tailwind's own syntax reference — for utility names, variant notation, and v4 directives, consult the current Tailwind documentation (the `context7` MCP server serves it on demand) rather than a snapshot that silently goes stale.
>
> Section numbers are intentionally non-contiguous. The framework-reference sections (4, 7–12) and the adoption/migration assessment (18–20) were removed in v2.0; the remaining numbers are stable and are referenced from `AGENTS.md`.

## 1. Purpose

This document defines how CSS is organised and authored in PERMAPHEMERA. It is a project rulebook, not a Tailwind tutorial.

Tailwind CSS v4 is installed, active, and adopted: `@tailwindcss/vite` is registered in `nuxt.config.ts`, `@import "tailwindcss"` is present in `app/assets/css/main.css`, archive colors and fonts are exposed through an `@theme` block, and `@tailwindcss/typography` is registered with the CSS-first `@plugin` directive.

Three rules in this document are broken more often than the rest, are restated in `AGENTS.md` so they are always in context, and are checked by `pnpm check:tailwind`:

1. **§6.1** — a canonical utility or `@theme` token before any bracketed arbitrary value.
2. **§2** — no `<style scoped>` and no CSS Modules, ever.
3. **`STYLE_GUIDE.md` §4.1** — structural marker groups keep their mandatory inner spaces.

Run `pnpm check:tailwind` after any change to a `.vue` template or to `main.css`.

## 2. Non-negotiable rule: no scoped styles

> [!IMPORTANT]
> **Never add `<style scoped>` to a Vue component in this project.** Do not use CSS Modules as an alternative form of local scoping. Tailwind utilities belong directly in templates. Every custom CSS rule belongs in the global CSS architecture, where existing rules must be checked before a new rule is created.

This project deliberately rejects component-scoped CSS because it can hide equivalent declarations behind generated scope selectors and encourage repeated local definitions.

Before adding custom CSS:

1. Search `app/assets/css/` for an existing token, utility, component rule, or pattern.
2. Use an existing Tailwind utility when the declaration is ordinary and readable.
3. Reuse or extend an existing global semantic class when the visual pattern already exists.
4. Add a global shared component class when the pattern has a stable reusable meaning.
5. Add a globally namespaced page rule only when it is genuinely page-specific.

The absence of scoped styles does not mean using vague global names. Global custom classes must remain semantic and collision-resistant, following `STYLE_GUIDE.md`.

## 3. Recommended project model

Use a hybrid model:

| Concern | Preferred location |
|---|---|
| Ordinary layout, alignment, spacing, sizing, typography, and responsive changes | Tailwind utilities in the Vue template |
| Design tokens | `@theme` in the main global CSS |
| Base element defaults | global CSS in `app/assets/css/` |
| Reusable branded components | global semantic classes and/or reusable Vue components |
| Complex SVG frames, masks, pseudo-elements, ornamental backgrounds, and coordinated selectors | global CSS |
| A truly one-off CSS value | an arbitrary Tailwind value in brackets |
| A value repeated or carrying design meaning | promote it to `@theme` or a global reusable rule |

Do not force Tailwind into code where CSS expresses the design more clearly. The cut-corner frame, dynamic masks, paper textures, multi-layer backgrounds, and coordinated pseudo-elements are shared visual infrastructure, not collections of disposable utilities.

## 5. Prefer Tailwind's actual vocabulary

Tailwind names utilities after concise concepts, not always after the full CSS property. Use the documented utility instead of inventing a CSS-like class name.

### 5.1 Common shorthand mapping

| CSS | Tailwind |
|---|---|
| `display: flex` | `flex` |
| `display: grid` | `grid` |
| `display: none` | `hidden` |
| `flex-grow: 1` | `grow` |
| `flex-grow: 0` | `grow-0` |
| `flex-shrink: 1` | `shrink` |
| `flex-shrink: 0` | `shrink-0` |
| `flex: 1` | `flex-1` |
| `flex: none` | `flex-none` |
| `flex-direction: column` | `flex-col` |
| `flex-wrap: wrap` | `flex-wrap` |
| `align-items: center` | `items-center` |
| `align-self: center` | `self-center` |
| `align-content: center` | `content-center` |
| `justify-content: space-between` | `justify-between` |
| `justify-items: center` | `justify-items-center` |
| `justify-self: end` | `justify-self-end` |
| `place-items: center` | `place-items-center` |
| `position: absolute` | `absolute` |
| `inset: 0` | `inset-0` |
| `overflow: hidden` | `overflow-hidden` |
| `pointer-events: none` | `pointer-events-none` |
| `width` and `height` with the same value | `size-*` |
| horizontal margin | `mx-*` |
| vertical margin | `my-*` |
| horizontal padding | `px-*` |
| vertical padding | `py-*` |
| `margin-inline-start` | `ms-*` |
| `margin-inline-end` | `me-*` |
| `border-radius` | `rounded-*` |
| `font-size` | `text-*` |
| `font-weight: 500` | `font-medium` |
| `line-height` | `leading-*` or the `text-size/line-height` modifier |
| `letter-spacing` | `tracking-*` |
| `background-color` | `bg-*` |
| `color` | `text-*` |
| `opacity` | `opacity-*` |
| `z-index` | `z-*` |
| visually hide accessible text | `sr-only` |

Do not write classes such as `flex-grow`, `align-items-center`, or `font-weight-500`. Those are CSS property names, not Tailwind utilities.

### 5.2 Related utilities are not interchangeable

- `grow` controls only `flex-grow`.
- `flex-1` sets the complete `flex` shorthand and also affects shrink and basis.
- `items-center` aligns items on the cross axis of a flex/grid container.
- `content-center` aligns multiple rows/tracks and often has no visible effect on a single row.
- `self-center` affects one child.
- `justify-center` affects content on the main axis; `justify-items-center` and `justify-self-center` have different grid roles.

Choose according to the CSS behavior required, not merely because a class sounds similar.

## 6. Theme-backed values before brackets

Use the design scale or a named project token whenever possible:

```html
<section class="bg-archive-paper text-archive-ink">
<p class="text-archive-muted">
<span class="font-display text-archive-red">
<div class="gap-6 p-8">
```

The color and font utilities above exist because `main.css` defines variables such as:

```css
@theme {
  --color-archive-paper: #f2eadc;
  --color-archive-red: #a6523c;
  --font-display: "Cormorant Garamond", serif;
}
```

Theme values are preferable because they:

- preserve the brand system;
- communicate intent;
- are reusable across all relevant utilities;
- remain available as ordinary CSS variables at runtime;
- reduce nearly identical arbitrary values.

Do not use `text-[#a6523c]` when `text-archive-red` exists.

### 6.1 Hard rule: canonical utilities before arbitrary values

Bracket notation is a last resort, never a first draft. Before writing any class containing `[...]`, you **must** check Tailwind's canonical utilities and the project's `@theme` tokens for an exact equivalent. Use the canonical class whenever it produces the required declaration.

This rule applies even when an arbitrary value compiles successfully. Editor or Tailwind IntelliSense canonicalization warnings must be resolved, not ignored.

```html
<!-- prohibited: canonical utilities already exist -->
<p class="tracking-[0.1em] text-[0.75rem] z-[1]">

<!-- required -->
<p class="tracking-widest text-xs z-1">
```

Check in this order:

1. exact core utility, including fractional spacing and named type/tracking classes;
2. existing PERMAPHEMERA theme utility;
3. an existing named project variant or semantic global rule;
4. a new theme token or named variant when the value/state is a repeated design decision;
5. bracket notation only for a genuinely exceptional exact value, calculation, selector, or grid definition with no canonical equivalent.

Do not replace an exact project value with a merely close core value. If no exact class exists and the value is genuinely one-off, brackets remain valid. If it repeats or carries design meaning, name it in the theme or global architecture instead.

### 6.1a Composite utilities: know what else the class carries

Several Tailwind utilities set more than one declaration. `text-base` emits a `font-size` **and** its paired `line-height`; `text-[1rem]` emits only the `font-size` and silently leaves whatever line-height was inherited. A request phrased as one visual change — "make this text smaller" — must therefore never be implemented as one property change.

The order to follow:

1. **Move to another named step.** `text-base` → `text-sm` carries the correct line-height with it. This is almost always the right answer.
2. **If no step fits, define one.** Add `--text-<name>` and `--text-<name>--line-height` to the `@theme` block in `app/assets/css/main.css`. Tailwind generates the composite utility from the pair. `@theme` is the only mechanism for this — see §6.1b.
3. **Derive the line-height; never copy it from a neighbouring size.** Leading is not constant across the scale — smaller text needs proportionally more of it, display type needs less:

   | Range | Line-height ratio | Basis |
   |---|---|---|
   | Display / headings ≥ `2rem` | `0.98`–`1.15` | `STYLE_GUIDE.md` §6.4 specifies `0.98` for hero and section headings |
   | Body and UI, `0.9`–`1.3rem` | `1.45`–`1.55` | matches `text-base` at `1.5` |
   | Metadata below `0.9rem` | `1.35`–`1.45` | matches `text-xs` at `1.333`, `text-sm` at `1.428` |

4. **Font sizes are never bracketed.** Unlike the general §6.1 rule, `text-*` admits no one-off exception — not even for fluid `clamp()` values, which become named steps like any other. This is stricter on purpose: an unnamed font size is invisible to `check:tailwind`, because Tailwind cannot canonicalise a value that no token defines.

The same "what else does it carry" question applies beyond type. Check the emitted declarations before assuming a utility does one thing.

### 6.1b This project uses Tailwind v4 only

This codebase has never used any earlier Tailwind version — the interface moved from hand-written semantic CSS directly to v4. **Do not apply pre-v4 idioms, and do not assume an answer found online still holds.** Much of the published material about Tailwind predates v4 and describes mechanisms that no longer exist. When unsure, read the current documentation through `context7`, or read what the build actually emits into `.output/public/_nuxt/*.css`.

Two consequences that have already cost this codebase real bugs:

**Transform utilities emit independent CSS properties.** `scale-*`, `translate-*` and `rotate-*` compile to the standalone `scale`, `translate` and `rotate` properties — *not* to `transform`. A hand-written `transition-[…]` list naming only `transform` therefore animates nothing. This fails silently in the worst way: the class is valid, no error is raised, and the end state still looks correct, so only the motion is missing.

```html
<!-- prohibited: the scale change is never animated -->
<span class="scale-x-90 transition-[opacity,transform] group-hover:scale-x-100">
<!-- required: name the longhands -->
<span class="scale-x-90 transition-[opacity,transform,translate,scale,rotate] group-hover:scale-x-100">
```

`transition-transform` already expands to all four properties, so prefer it whenever the transition covers nothing else.

**Theme values are declared in CSS, not JavaScript.** New tokens go in the `@theme` block of `app/assets/css/main.css`. This project has no `tailwind.config.js` and none should be added.

### 6.2 Spaced marker groups are not arbitrary utilities

PERMAPHEMERA keeps meaningful structural names visible in generated markup with spaced visual marker groups:

```html
<main class="[ site-shell ] archive-drafting-canvas relative min-h-screen">
<section class="[ exhibition-detail-body ] [ section-band ] grid ...">
```

The spaces are mandatory. `[ site-shell ]` is tokenized by HTML as `[`, `site-shell`, and `]`; it is not a class whose name contains brackets. The bracket tokens are visual delimiters and `site-shell` is the inert marker name. Tailwind generates no utility for any of them.

- Always write `[ marker-name ]`; the no-space form `[marker-name]` is prohibited.
- Put the complete marker group first in a class attribute.
- Use them for significant regions and stable review/search handles.
- Never reference the enclosed name or delimiter tokens in project CSS or give them declarations.
- Keep all ordinary behavior in the real Tailwind utilities that follow.
- Keep complex global behavior on a separately named, unbracketed semantic class.
- Do not remove the internal spaces in an attempt to make the group resemble a single class.
- Do not add spaces inside valid arbitrary utilities such as `w-[14rem]`, `[mask-type:luminance]`, or `[&>svg]:size-5`; those are deliberately single tokens and the canonical-first rule still governs them.

## 13. Static class detection in Vue

Tailwind does not understand runtime string construction. It only detects complete class tokens present in source files.

Do not do this:

```vue
<div :class="`text-${tone}-500`" />
```

Map states or props to complete static strings:

```ts
const toneClasses = {
  archive: 'text-archive-ink hover:text-archive-red',
  neutral: 'text-archive-muted hover:text-archive-ink',
} as const
```

```vue
<div :class="toneClasses[tone]" />
```

Vue object and array syntax is safe when every possible class exists literally:

```vue
<button
  class="transition-colors"
  :class="{
    'text-archive-red underline': active,
    'text-archive-muted': !active,
  }"
>
```

Do not generate positional classes such as ``archive-venue-stack-frame-${index + 1}``. Position-based class families hide content/layout data in CSS and fail as soon as a CMS changes the record count or order. A paper-stack component must derive stable runtime transforms from its item IDs and apply those transforms through Vue styles.

## 14. Reuse without scoped CSS

Tailwind reuse comes from components and tokens, not from repeating long class lists everywhere.

### 14.1 Extract a Vue component when it owns a contract

A reusable button should be a component when it owns shared semantics, accessibility, frame geometry, icon placement, or variants. It may contain Tailwind utilities internally, and callers should not need to reproduce them.

This is mandatory for repeated data-backed content. Pages may `v-for` over `VenueArchiveCard`, `LandingExhibitionCard`, `LocationExhibitionLedgerRow`, or equivalent semantic components; they must not reproduce the card/row template inline. The same rule applies before Directus is connected—the local JSON already represents the future collection boundary.

### 14.2 Runtime visual variation belongs to the component

Do not use `:nth-child()` or `:nth-of-type()` to assign content-specific rotation, offset, stacking, ornament placement, or featured treatment. Those selectors describe DOM position, not the content record, and become incorrect when sorting, filtering, pagination, or CMS additions change the order.

For deliberately irregular paper/card layouts:

1. seed a deterministic pseudo-random generator with a stable content ID;
2. compute the visual values inside the reusable component or a shared runtime utility;
3. apply them through Vue `:style` or typed props;
4. keep only asset/mask/pseudo-element infrastructure in global CSS.

The generator must be deterministic across SSR and hydration. Unseeded `Math.random()` in render-time code is prohibited.

### 14.3 Keep a global semantic CSS class for complex branded patterns

Good candidates include:

- frame-asset hooks such as `.archive-button-primary-frame` and `.archive-search-field-frame`;
- frame-owned SVG/mask hooks;
- `.archive-crosshair-ornament` for its asset only, with placement supplied by the owning component;
- ornamental pseudo-elements;
- mask and `border-image` systems.

These hooks must contain only the part Tailwind cannot express cleanly. Ordinary size, layout, spacing, type, state, and responsive behavior remains in the Vue component's utilities.

Horizontally draggable rails follow the same boundary. Use Tailwind utilities in the component for the one-line flex layout, overflow, cursor, spacing, and responsive behavior. A narrowly named global hook may hide the native scrollbar because the required vendor pseudo-element is selector infrastructure; it must not take ownership of the rail's ordinary layout. Pointer, touch, click-suppression, and keyboard behavior belong in one reusable Vue component rather than being repeated on pages.

Remember that grid items stretch across their grid area by default. A framed button placed directly in a compact grid can therefore look full-width even when the component itself has no width rule. Use intrinsic sizing such as `w-fit` together with `justify-self-center`, or use a centered `flex` row with non-growing children, when the frame must encompass only its content. Do not compensate with arbitrary fixed widths.

When a desktop-only ornamental pseudo-element needs a simpler compact replacement, keep the coordinated pseudo-element rule global and hide only that pseudo-element at the compact breakpoint. Render the compact separator explicitly inside the reusable component and size it with canonical Tailwind utilities. This keeps responsive layout in the component without translating asset-oriented pseudo-element CSS into bracket-heavy selectors.

### 14.4 Do not overuse `@apply`

`@apply` can inline utilities into global CSS, but it often recreates a semantic stylesheet through indirection. Prefer either:

- utilities directly in a reusable Vue component; or
- clear ordinary global CSS using project variables.

Use `@apply` only when it makes a global rule materially clearer. Never put it in a component `<style>` block.

### 14.5 Promote repetition deliberately

Use this decision order:

1. Is there already a shared Vue component or global class? Reuse it.
2. Is this an ordinary one-off declaration? Use a built-in utility.
3. Is the value part of the design language? Add/reuse a theme token.
4. Is the same utility bundle repeated with the same semantic purpose? Extract a component.
5. Does the pattern require pseudo-elements, complex selectors, masks, or coordinated geometry? Create or extend one global semantic rule.

Run `pnpm check:tailwind` after changing template classes. It loads this project's Tailwind design system and fails if any bracketed candidate has a canonical equivalent, if a structural marker omits its mandatory spaces, or if an inert marker is used as a CSS selector.

## 15. CMS rich text and Tailwind Typography

Content delivered as HTML by the future CMS must be rendered inside the Typography plugin's generated `.prose` class:

```vue
<div class="prose" v-html="sanitizedContent" />
```

The project-level `.prose` rules in `app/assets/css/main.css` customize the plugin's color variables, typeface, heading weights, link treatment, readable width, tables, quotations, code, and dark-surface values to match `STYLE_GUIDE.md`. Do not reproduce descendant selectors such as `h2`, `p`, `ul`, or `blockquote` on every CMS field. Use `prose-invert` in addition to `prose` when a rich-text block is intentionally placed on the night surface.

Because no current Vue template consumes CMS rich text, `main.css` uses `@source inline("prose prose-invert not-prose")` to generate this deliberately small prepared class set before its first runtime consumer exists. Do not expand that inline source into a general safelist. Once real static consumers exist, this explicit preparation may be removed if the build still contains all three required classes.

Use `not-prose` for an embedded application control or branded component that must not inherit article typography. Do not nest another `.prose` instance inside that `not-prose` subtree.

`v-html` does not sanitize HTML. The value passed to it must already have crossed an explicit sanitization boundary using an allowlist appropriate to the CMS schema. Treat sanitization as part of the content adapter contract, not as a CSS concern. Event-handler attributes, scripts, unsafe URLs, inline styles, and unapproved embeds must never reach the render tree.

The prepared `.prose` layer is infrastructure only. Existing local-data prose should not be mechanically changed to `v-html`; adopt it when the first trusted CMS rich-text field is connected or when a deliberately bounded local rich-text fixture is introduced for verification.

## 16. Project examples

### 16.1 Good utility candidate

Ordinary structure can be legible inline:

```vue
<div class="flex items-center justify-between gap-6 py-4">
```

### 16.2 Good token use

```vue
<p class="font-display text-base leading-normal text-archive-muted">
```

### 16.3 Acceptable one-off arbitrary value

```vue
<h2 class="max-w-[42rem] text-[clamp(2.25rem,3.65vw,3.85rem)] leading-[0.98]">
```

If that heading treatment repeats, it should remain or become a shared global heading rule rather than being copied.

### 16.4 Keep complex visual infrastructure global

Do not translate a multi-layer paper background like this into a long bracket-heavy class string:

```css
background:
  radial-gradient(...),
  radial-gradient(...),
  linear-gradient(...),
  var(--color-archive-paper);
```

Likewise, keep `border-image`, mask paths, `::before`/`::after`, and cut-corner geometry in shared global CSS and shared components.

## 17. Code-style rules

- Use complete static Tailwind class names.
- Prefer documented shorthand utilities such as `grow`, `shrink-0`, `size-6`, and `place-items-center`.
- Before adding any bracket notation, search for an exact canonical utility; canonicalization warnings are defects.
- Prefer project theme tokens over raw colors and repeated arbitrary values.
- Use arbitrary values for genuine exceptions, not as the default notation.
- Promote a repeated arbitrary value to the theme or global CSS.
- Keep class order consistent: layout, position, box model, typography, visual treatment, interaction, then responsive/state variants.
- Format very long Vue class attributes over multiple lines using the project's formatter; do not hide them in computed strings merely for appearance.
- Never generate Tailwind class fragments dynamically.
- Never add `<style scoped>` or CSS Modules.
- Before creating custom CSS, search the global styles for an existing implementation.
- Preserve the style guide's frame, typography, color, accessibility, and responsive constraints even when a shorter utility exists.

## 21. Official references

- [Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes)
- [Adding custom styles and arbitrary values](https://tailwindcss.com/docs/adding-custom-styles)
- [Hover, focus, and other variants](https://tailwindcss.com/docs/hover-focus-and-other-states)
- [Responsive design and container queries](https://tailwindcss.com/docs/responsive-design)
- [Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Functions and directives](https://tailwindcss.com/docs/functions-and-directives)
- [Theme variables](https://tailwindcss.com/docs/theme)
- [Flex utilities](https://tailwindcss.com/docs/flex)
- [Tailwind CSS v4 compatibility](https://tailwindcss.com/docs/compatibility)

These references are the authority for framework syntax. This document is the authority for how that syntax is permitted within PERMAPHEMERA.
