# Tailwind CSS v4 Usage for PERMAPHEMERA

Version: 1.0  
Applies to: Tailwind CSS 4.3.x, Nuxt 4, and Vue 3  
Project source of truth: `app/assets/css/main.css` and `docs/STYLE_GUIDE.md`

## 1. Purpose

This document defines how Tailwind CSS v4 may be used in PERMAPHEMERA. It is both a notation reference and a project-specific architecture rulebook.

The project already has Tailwind CSS v4 installed and active:

- `@tailwindcss/vite` is registered in `nuxt.config.ts`;
- `@import "tailwindcss"` is present in `app/assets/css/main.css`;
- archive colors and fonts are exposed through an `@theme` block;
- the current interface is nevertheless authored almost entirely with semantic classes in the global stylesheet.

Tailwind is therefore available, but adopting it is an authoring decision rather than an installation task.

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

## 4. The basic grammar

A Tailwind class generally has this form:

```text
[variants:]utility[-value][/modifier]
```

Examples:

```html
<div class="flex grow gap-6 p-4 md:grid md:grid-cols-2 hover:text-archive-red">
```

- `flex` is a utility with no value.
- `grow` is the named utility for `flex-grow: 1`.
- `gap-6` combines the `gap` utility with a theme-backed value.
- `md:` is a responsive variant.
- `hover:` is a state variant.
- `text-archive-red` is generated from `--color-archive-red` in `@theme`.

Variants can be stacked:

```html
<a class="md:hover:text-archive-red focus-visible:outline-2">
```

Read stacked variants from left to right: at the `md` breakpoint, while hovered, apply the text color.

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

## 7. Square brackets: arbitrary values

Square brackets supply a value that is not part of the theme:

```html
<div class="top-[7.3rem] w-[14rem] opacity-[0.62]">
<h1 class="text-[clamp(3.35rem,5.35vw,5.85rem)]">
<div class="grid-cols-[minmax(0,1fr)_18rem]">
```

They compile to the normal property represented by the utility:

```text
w-[14rem]                              -> width: 14rem
opacity-[0.62]                         -> opacity: 0.62
grid-cols-[minmax(0,1fr)_18rem]        -> grid-template-columns: minmax(0,1fr) 18rem
```

### 7.1 Spaces become underscores

HTML class tokens cannot contain literal spaces. Within an arbitrary value, use `_` where CSS needs a space:

```html
<div class="grid-cols-[1fr_auto_1fr]">
<div class="shadow-[0_0.5rem_1.5rem_rgba(25,23,20,0.16)]">
```

Tailwind converts the underscores into spaces where appropriate. If an underscore must remain an underscore, escape it with `\_`.

### 7.2 Mathematical functions and punctuation

CSS functions are allowed:

```html
<div class="w-[calc(100%-2rem)]">
<div class="max-w-[min(54rem,100%)]">
<h2 class="text-[clamp(2.25rem,3.65vw,3.85rem)]">
```

Do not insert spaces around operators inside a class token. Prefer compact valid CSS inside the brackets.

### 7.3 Type hints for ambiguous values

Sometimes Tailwind cannot infer which property family a CSS variable represents. Add a data type before the value:

```html
<div class="text-[color:var(--record-label)]">
<div class="text-[length:var(--record-size)]">
```

Use type hints only when inference is genuinely ambiguous.

### 7.4 Negative arbitrary values

Place the minus sign before the utility:

```html
<div class="-top-[0.35rem] -rotate-[2.5deg]">
```

Use the standard negative utility when one exists, such as `-mt-2`.

### 7.5 Arbitrary fractions and slash modifiers

Use standard fraction utilities where available:

```html
<div class="w-1/2">
<div class="basis-2/3">
```

A slash can also be a modifier:

```html
<p class="text-lg/7">                 <!-- font size / line height -->
<div class="bg-archive-ink/10">       <!-- color / opacity -->
```

If a fraction or modifier is not supported, use a bracketed value rather than guessing a class name.

## 8. Parentheses: CSS custom-property shorthand

Tailwind v4 provides parentheses as shorthand when the entire value is a CSS custom property:

```html
<div class="fill-(--icon-color)">
<div class="flex-(--record-flex)">
<div class="w-(--record-width)">
```

This means the same as adding `var()` manually:

```text
fill-(--icon-color)  == fill-[var(--icon-color)]
flex-(--record-flex) == flex-[var(--record-flex)]
```

Use parentheses only for this custom-property shorthand. Use brackets for a larger expression such as `w-[calc(var(--record-width)-2rem)]`.

## 9. Arbitrary CSS properties

When Tailwind has no suitable utility, brackets can contain a complete CSS declaration:

```html
<div class="[mask-type:luminance]">
<div class="[--frame-opacity:0.72] lg:[--frame-opacity:0.9]">
```

Variants still work:

```html
<div class="[mask-type:luminance] hover:[mask-type:alpha]">
```

Project rule: use arbitrary properties sparingly. If the property is repeated, is a branded visual primitive, or requires coordinated child/pseudo-element rules, define it once in global CSS.

## 10. Variants and their notation

Variants are prefixes ending in `:`.

### 10.1 Interaction and state

```html
<a class="text-archive-ink hover:text-archive-red focus-visible:outline-2 active:opacity-80">
<input class="disabled:cursor-not-allowed disabled:opacity-50">
```

Prefer `focus-visible:` for keyboard focus indicators. Never remove focus indication without replacing it with a visible project-consistent treatment.

### 10.2 Responsive variants are mobile-first

```html
<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
```

Unprefixed utilities apply at all sizes. `md:` applies from the medium breakpoint upward; it does not mean “medium device only.”

Target a range by stacking `md:` and `max-lg:`:

```html
<div class="md:max-lg:grid-cols-2">
```

For a one-off breakpoint:

```html
<div class="max-[600px]:hidden min-[80rem]:grid-cols-4">
```

Repeated breakpoints belong in `@theme` as named `--breakpoint-*` tokens instead of being copied as arbitrary variants.

### 10.3 Parent state with `group`

```html
<a class="group">
  <span class="text-archive-ink group-hover:text-archive-red">Open archive</span>
</a>
```

Name groups when nested groups could be ambiguous:

```html
<article class="group/card">
  <a class="group/action group-hover/card:text-archive-red">
```

### 10.4 Sibling state with `peer`

```html
<input class="peer" type="checkbox">
<span class="hidden peer-checked:block">Selected</span>
```

The peer must be a previous sibling because of how the CSS sibling selector works.

### 10.5 Data and ARIA state

```html
<button class="aria-expanded:text-archive-red">
<li class="data-[active=true]:underline">
```

Use native states and meaningful attributes before introducing JS-only styling flags.

### 10.6 Direct children and descendants

```html
<ul class="*:border-b *:border-archive-line">
<div class="**:focus-visible:outline-2">
```

`*:` targets direct children; `**:` targets descendants. Do not use broad descendant variants when explicit component markup or one global semantic rule is safer.

## 11. Arbitrary variants: selectors in brackets

An arbitrary variant is a selector or at-rule in brackets before the utility:

```html
<li class="[&.is-active]:text-archive-red">
<div class="[&_p]:mt-4">
<div class="[&>svg]:size-5">
<div class="[@supports(display:grid)]:grid">
```

`&` marks the element receiving the class. Underscores represent spaces in a selector:

```text
[&_p]:mt-4     -> descendant p elements
[&>svg]:size-5 -> direct svg children
```

If the same arbitrary selector appears more than once, replace it with an explicit global component rule or a registered `@custom-variant`. Dense bracket selectors in templates are harder to audit for accidental duplication than named shared CSS.

## 12. Important v4 directives

Tailwind v4 configuration is CSS-first.

### 12.1 `@import`

```css
@import "tailwindcss";
```

This imports Tailwind's theme, base/preflight, and utilities. Keep this in the main global stylesheet.

### 12.2 `@theme`

Use `@theme` for tokens that must generate utilities:

```css
@theme {
  --color-archive-red: #a6523c;
  --font-display: "Cormorant Garamond", serif;
  --breakpoint-wide: 80rem;
}
```

Theme namespaces determine which utilities are created. A normal `:root` custom property remains available to CSS but does not automatically generate Tailwind utilities.

PERMAPHEMERA convention:

- use `@theme` for reusable colors, fonts, spacing, breakpoints, shadows, and animation values that should be addressable as utilities;
- use `:root` for implementation variables such as asset URLs or geometry that do not need utility classes.

### 12.3 `@utility`

Register a custom reusable utility globally:

```css
@utility content-auto {
  content-visibility: auto;
}
```

It can then take variants such as `lg:content-auto`. Do not create a custom utility that merely duplicates a built-in utility.

### 12.4 `@custom-variant`

Register a repeated project state globally:

```css
@custom-variant current (&[aria-current="page"]);
```

Then use `current:text-archive-red`. Prefer standard variants such as `aria-*` when they already express the state.

### 12.5 `@variant`

Within global custom CSS, apply a Tailwind variant:

```css
.archive-link {
  color: var(--color-archive-ink);

  @variant hover {
    color: var(--color-archive-red);
  }
}
```

This remains global CSS and complies with the no-scoped-style rule.

### 12.6 `@source`

Tailwind scans source files as plain text. Explicitly register an otherwise ignored external source with `@source`, or set a base path with `source()` on the import. The current Nuxt app should normally be detected automatically.

Do not add safelists as a substitute for correctly authored static classes.

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

The current pattern ``:class="`venue-stack-frame-${index + 1}`"`` works for existing global CSS, but the equivalent must not be used to construct Tailwind utilities.

## 14. Reuse without scoped CSS

Tailwind reuse comes from components and tokens, not from repeating long class lists everywhere.

### 14.1 Extract a Vue component when it owns a contract

A reusable button should be a component when it owns shared semantics, accessibility, frame geometry, icon placement, or variants. It may contain Tailwind utilities internally, and callers should not need to reproduce them.

### 14.2 Keep a global semantic CSS class for complex branded patterns

Good candidates include:

- `.button` and `.button-primary`;
- `.search-field-frame`;
- `.venue-card-frame`;
- `.archive-arrow`;
- ornamental pseudo-elements;
- mask and `border-image` systems.

These patterns are more than a handful of declarations. Their shared class names make reuse and auditing easier.

### 14.3 Do not overuse `@apply`

`@apply` can inline utilities into global CSS, but it often recreates a semantic stylesheet through indirection. Prefer either:

- utilities directly in a reusable Vue component; or
- clear ordinary global CSS using project variables.

Use `@apply` only when it makes a global rule materially clearer. Never put it in a component `<style>` block.

### 14.4 Promote repetition deliberately

Use this decision order:

1. Is there already a shared Vue component or global class? Reuse it.
2. Is this an ordinary one-off declaration? Use a built-in utility.
3. Is the value part of the design language? Add/reuse a theme token.
4. Is the same utility bundle repeated with the same semantic purpose? Extract a component.
5. Does the pattern require pseudo-elements, complex selectors, masks, or coordinated geometry? Create or extend one global semantic rule.

## 15. Project examples

### 15.1 Good utility candidate

Ordinary structure can be legible inline:

```vue
<div class="flex items-center justify-between gap-6 py-4">
```

### 15.2 Good token use

```vue
<p class="font-display text-base leading-normal text-archive-muted">
```

### 15.3 Acceptable one-off arbitrary value

```vue
<h2 class="max-w-[42rem] text-[clamp(2.25rem,3.65vw,3.85rem)] leading-[0.98]">
```

If that heading treatment repeats, it should remain or become a shared global heading rule rather than being copied.

### 15.4 Keep complex visual infrastructure global

Do not translate a multi-layer paper background like this into a long bracket-heavy class string:

```css
background:
  radial-gradient(...),
  radial-gradient(...),
  linear-gradient(...),
  var(--color-archive-paper);
```

Likewise, keep `border-image`, mask paths, `::before`/`::after`, and cut-corner geometry in shared global CSS and shared components.

## 16. Code-style rules

- Use complete static Tailwind class names.
- Prefer documented shorthand utilities such as `grow`, `shrink-0`, `size-6`, and `place-items-center`.
- Prefer project theme tokens over raw colors and repeated arbitrary values.
- Use arbitrary values for genuine exceptions, not as the default notation.
- Promote a repeated arbitrary value to the theme or global CSS.
- Keep class order consistent: layout, position, box model, typography, visual treatment, interaction, then responsive/state variants.
- Format very long Vue class attributes over multiple lines using the project's formatter; do not hide them in computed strings merely for appearance.
- Never generate Tailwind class fragments dynamically.
- Never add `<style scoped>` or CSS Modules.
- Before creating custom CSS, search the global styles for an existing implementation.
- Preserve the style guide's frame, typography, color, accessibility, and responsive constraints even when a shorter utility exists.

## 17. Would Tailwind benefit this project?

### 17.1 Advantages

Tailwind would provide moderate benefits for future work:

- **Faster ordinary component construction:** flex/grid layout, spacing, sizing, typography, breakpoints, and states can be expressed without adding a new selector for every wrapper.
- **Visible local composition:** a developer can understand an element's ordinary layout without jumping between a Vue file and a large stylesheet.
- **Token enforcement:** the existing archive colors and fonts already create utilities through `@theme`; a fuller spacing, breakpoint, and type token layer could reduce value drift.
- **Responsive consistency:** mobile-first variants make normal component-level adaptations concise.
- **Less growth of one-off global selectors:** simple wrappers need not add more names to the already large global stylesheet.
- **Reusable component internals:** a Vue component can own a stable utility bundle while callers reuse the component rather than duplicate CSS.

### 17.2 Limits and disadvantages

Tailwind does not solve all of this project's styling needs:

- **The current visual language is CSS-heavy:** SVG nine-slice frames, masks, generated geometry, pseudo-elements, multi-layer paper backgrounds, ornamental assets, and tightly coordinated selectors are clearer in global CSS.
- **Existing reuse is semantic:** `.button`, `.search-bar`, frame classes, and card patterns already provide shared behavior. Replacing their internals with utilities does not inherently improve reuse.
- **The current page is large and visually tuned:** converting working rules creates regression risk without changing user-visible behavior.
- **Bracket-heavy translation can be worse:** expressing every bespoke value and selector as an arbitrary utility would move complex CSS into markup without simplifying it.
- **Global auditability matters here:** the no-scoped-style policy favors a visible global design-system layer for repeated branded patterns.
- **Long templates can become noisy:** the landing page already has substantial composition and Vue logic; indiscriminate utility strings would make it harder to scan.

### 17.3 Conclusion

Tailwind is advantageous **as a selective authoring layer for new and refactored ordinary UI**, not as a goal of replacing all CSS.

The recommended architecture is:

- keep one global design-system stylesheet (it may later be split into globally imported files by tokens, base, components, and pages);
- retain semantic global rules for branded and complex patterns;
- use Tailwind utilities for straightforward layout and local composition;
- expand `@theme` only with proven reusable tokens;
- extract reusable Vue components when markup, behavior, or accessibility repeats;
- prohibit all scoped styles.

## 18. Migration difficulty and estimate

The active implementation currently consists of one large landing route, several reusable visual components, and roughly 2,500 lines of global CSS. It has no active scoped component styles, so no cleanup is required there.

### 18.1 Recommended incremental adoption: easy to moderate

Estimated effort: **1–3 focused developer days** for the foundation and a representative pilot, followed by ordinary incremental adoption during feature work.

Scope:

1. Reconcile the global CSS architecture and document the no-scoped rule.
2. Add only proven spacing, breakpoint, type, shadow, and motion tokens to `@theme`.
3. Convert one low-risk, ordinary area such as a navigation group, simple metadata row, or new component.
4. Establish class-order and static-mapping conventions.
5. Verify desktop and mobile rendering.

This produces most of Tailwind's practical benefit without destabilizing the landing page.

### 18.2 Selective conversion of ordinary existing layout: moderate

Estimated effort: **4–8 focused developer days**, including visual regression work.

Scope:

- convert simple display, grid/flex, gap, padding, margin, typography, sizing, and common responsive declarations;
- keep semantic complex component rules global;
- remove obsolete global declarations carefully;
- test all landing sections at the style guide's breakpoints and frame extremes.

The difficulty is not typing the new classes; it is proving that cascade, source order, media-query behavior, and exact visual tuning remain unchanged.

### 18.3 Near-total utility rewrite: difficult and not recommended

Estimated effort: **2–4 developer weeks**, potentially more if pixel-level browser comparison and cleanup expose cascade dependencies.

This would require translating or restructuring thousands of lines, designing exceptions for pseudo-elements and complex visual infrastructure, and thoroughly checking the complete landing page. The result would still need substantial global CSS. The cost and regression risk are disproportionate to the architectural gain.

### 18.4 Migration rule

Do not measure success by the percentage of CSS converted. Measure it by:

- fewer duplicated ordinary declarations;
- consistent token use;
- reusable Vue component contracts;
- no new scoped styles;
- stable branded geometry and responsive rendering;
- a global CSS layer that becomes easier, not harder, to audit.

## 19. Safe adoption sequence

1. Preserve the current rendered page as the visual baseline.
2. Organize global CSS by responsibility if its size becomes an obstacle; every file must still be imported globally.
3. Define a minimal Tailwind theme aligned with `STYLE_GUIDE.md`.
4. Pilot utilities on one simple component or on new work.
5. Keep complex brand rules untouched.
6. Extract reusable components based on stable behavior and semantics, not merely repeated class strings.
7. Convert existing rules only when the touched area benefits from the change.
8. Remove an old global declaration only after confirming that no other element relies on it.
9. Run the production build and visually verify desktop and mobile after each bounded conversion.

## 20. Official references

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
