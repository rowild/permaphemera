# PERMAPHEMERA Web Style Guide

Version: 1.1
Reference implementation: `app/pages/index.vue` and `app/assets/css/main.css`
Design references: `../../_Plans/designs/landing-page/`
Purpose: define the visual, structural, interaction, content, and implementation rules required for new pages to feel native to PERMAPHEMERA.

## 1. How To Use This Guide

This is a normative guide derived from the implemented landing page and its approved mockups. A new page should use these rules before inventing page-specific styling.

When implementation and a design mockup disagree:

1. Preserve the established system described here.
2. Use the current implementation as the technical source of truth for reusable tokens and behavior.
3. Use the mockups as the source of truth for atmosphere, hierarchy, negative space, and composition.
4. Treat deliberate page-specific artwork as an exception, not a new global pattern.

The intended result is visual kinship, not mechanical duplication. New pages may have different information architecture, but they should share the same typographic voice, paper-and-ink palette, measured spacing, archival surfaces, linework, image treatment, and restrained motion.

### 1.1 Critical invariant: the cut-corner frame must never be distorted

> [!IMPORTANT]
> The fine archival SVG frame with its cut-out/concave corners is a signature shape of PERMAPHEMERA. It is used repeatedly around images, cards, buttons, search fields, method panels, sponsor strips, and other framed surfaces. **Its corners MUST retain their original proportions and geometry at every size. The corner shape MUST NEVER be stretched, squashed, widened, narrowed, approximated, clipped incorrectly, or allowed to reveal content outside it. This rule applies everywhere, without exception.**

The frame is not an ordinary scalable rectangle. Stretching the complete SVG with `width: 100%; height: 100%`, using it as a normal background with `background-size: 100% 100%`, or replacing it with an approximate `border-radius`/`clip-path` distorts the corner artwork. That is prohibited.

Use one of the two approved implementations:

1. **CSS nine-slice framing (`border-image`)** for buttons, input fields, panels, and other rectangular surfaces. The source SVG is divided into four fixed corners, four stretchable edges, and a stretchable/fill center. Only the edges and center may stretch; the corners must remain fixed.
2. **Shared dynamic SVG geometry and matching masks** for cards and images whose frame is generated from their live dimensions. The border path and image mask must come from the same functions in `app/utils/venueFrameGeometry.ts` so the image cannot enter or overflow the cut-out corners.

Before considering any framed component complete, test it at its narrowest, widest, shortest, and tallest supported dimensions. Inspect all four corners at desktop and mobile sizes. Any corner distortion or image overflow is a release-blocking defect.

## 2. Brand Character

PERMAPHEMERA is a curated cultural archive, not a generic gallery catalogue or technology product. Its interface should feel like the meeting point of:

- an exhibition catalogue;
- an architectural survey or conservation drawing;
- a box of carefully preserved archival records;
- a contemporary, navigable digital collection.

The key emotional qualities are:

- **scholarly:** precise, structured, credible, and quiet;
- **material:** paper, ink, stamps, clipped documents, fine rules, and photographic records;
- **ephemeral:** asymmetry, cropped traces, rotations, incomplete circles, and layered sheets;
- **permanent:** ordered grids, identifiers, metadata, measurements, and dependable navigation;
- **Austrian and editorial:** culturally grounded, refined, and typographically led;
- **technically contemporary:** smooth, accessible interactions without looking like a dashboard.

Avoid visual language associated with glossy SaaS products: bright gradients, pill-heavy interfaces, glass panels, neon accents, generic cards, thick rounded shadows, geometric sans-serif dominance, and dense control bars.

## 3. Design Principles

### 3.1 Editorial hierarchy before decoration

Typography and whitespace must establish the page before ornaments are added. Decorative drafting marks may frame or connect content, but may never compensate for unclear hierarchy.

### 3.2 Controlled asymmetry

Layouts are balanced rather than perfectly symmetrical. Featured records may occupy more space; sidebars may be narrow; ornaments may sit off-axis; paper stacks may rotate by a few degrees. The underlying grid must remain disciplined.

### 3.3 Physical archive, digitally interpreted

Use clipped corners, fine frames, paper layers, stamps, rulers, crosshairs, dividers, and handwritten-like archival arrangements. Do not imitate physical objects with heavy photorealistic effects. The existing treatment is mostly flat, translucent, and restrained.

### 3.4 Rust is semantic emphasis

The rust accent identifies selected words, active states, navigational signals, section labels, and archival marks. It is not a general background color and should not flood large areas except inside the primary framed button.

### 3.5 Negative space is part of the archive

Empty space suggests a catalogue page and makes fine artifacts legible. Do not fill every region with cards. Desktop sections typically have generous vertical padding and clear breathing room around headings, search controls, and ornamental dividers.

### 3.6 Motion reveals structure

Animation should explain layering, direction, or navigation: a paper stack spreads, an arrow advances, a kaleidoscope rotates, or a mark subtly turns. Avoid decorative bouncing, looping UI motion, parallax overload, or large entrance animations unrelated to meaning.

## 4. Source Architecture

The current visual system lives primarily in:

```text
app/assets/css/main.css       global tokens and page styling
app/pages/index.vue           composition and interaction patterns
app/components/               reusable frames, masks, arrows, kaleidoscope
app/data/                     local content contracts
public/images/landing/        raster compositions and extracted details
public/svg/                   scalable frames, icons, rules, and ornaments
```

New global tokens and truly reusable primitives belong in `main.css` or a future organized design-system layer. Page-only rules should remain page-scoped or use a page namespace. Do not duplicate an existing frame, arrow, heading, search field, or archive-card treatment.

## 5. Color System

### 5.1 Core tokens

Use the existing CSS custom properties:

| Token | Value | Role |
|---|---:|---|
| `--color-archive-paper` | `#f2eadc` | primary warm parchment canvas |
| `--color-archive-paper-deep` | `#e7d9c4` | deeper paper, secondary surfaces, tonal separation |
| `--color-archive-ink` | `#191714` | primary text and strong marks |
| `--color-archive-muted` | `#786f62` | body copy, metadata, inactive controls |
| `--color-archive-line` | `#c9b9a0` | fine rules, quiet borders, dividers |
| `--color-archive-rust` | `#a6523c` | semantic accent and active state |
| `--color-archive-copper` | `#b87a50` | warmer secondary accent, primarily on dark surfaces |
| `--color-archive-night` | `#17130f` | dark footer and night surface |

### 5.2 Supporting colors already in use

These colors are implementation-specific refinements and should be promoted to tokens if reused on multiple new pages:

| Value | Current role |
|---:|---|
| `#fff7eb` | primary-button text and warm light ink |
| `#f3e6d2` | large headings on the dark footer |
| `#eadcc7` | default footer text |
| `#c7a783` | sponsor names on the dark surface |
| `#5d4a35` | secondary-button text |
| `#493c2f` | expressive quotation text |
| `#5c4b3b` | archive-method facts |
| `#8a725b` | small definition labels |

### 5.3 Color proportions

A typical light page should visually approximate:

- 75–85% parchment and warm neutral space;
- 10–18% black/brown ink, photography, and dark details;
- 3–7% rust/copper emphasis;
- less than 3% fine lines, ornaments, and translucent drafting marks.

Rust should remain scarce enough to retain meaning. On a new page, use it for the strongest phrase within a heading, the current or active state, key icon masks, eyebrow text, and primary interaction frames.

### 5.4 Background construction

The light canvas is not a flat beige. It combines `--color-archive-paper` with low-opacity radial and linear gradients that create uneven illumination and aged tonal variation. Decorative background assets are fixed and faint.

Rules:

- Keep texture contrast low; content must remain more prominent than paper effects.
- Use opacity around `0.15–0.5` for background drafting ornaments.
- Place marks partly outside the content grid to suggest a larger drawing sheet.
- Do not repeat a conspicuous ornament multiple times within the same viewport.
- Decorative layers must use `pointer-events: none` and remain outside the accessibility tree.
- On dark surfaces, recolor archival artwork through controlled opacity/filtering rather than introducing unrelated ornament families.

### 5.5 Contrast

- Use archive ink for primary reading text on parchment.
- Use archive muted only for supporting copy and metadata, never tiny essential text on a low-contrast surface.
- Use `#fff7eb`, `#eadcc7`, or `#f3e6d2` on the night surface.
- Copper and rust on dark backgrounds should be reserved for labels and accents; verify contrast for text smaller than 18px.
- Never rely on rust alone to communicate state: pair it with underline, weight, `aria-current`, shape, or descriptive text.

## 6. Typography

### 6.1 Typeface

The current project uses **Cormorant Garamond** locally through `@fontsource`, with weights 300, 400, and 500.

```css
--font-display: "Cormorant Garamond", "EB Garamond",
  "Adobe Garamond Pro", "Garamond", "Times New Roman", serif;
--font-body: var(--font-display);
```

Both display and body roles currently use the same family. Hierarchy is created through size, weight, line-height, color, case, and spacing rather than typeface mixing.

Do not introduce a sans-serif UI font without a project-level design decision. The serif is foundational to the brand. If Cormorant Garamond is unavailable, preserve the specified Garamond-first fallback order.

### 6.2 Font weights

- `300`: hero-scale statements and the most spacious editorial headings.
- `400`: body text, section headings, navigation, buttons, card titles, and metadata.
- `500`: brand wordmark, eyebrows, active alphabet letters, and controlled emphasis.
- Avoid weights above 500. Bold typography would make the interface feel commercial rather than archival.

### 6.3 Type scale

The system uses fluid `clamp()` sizes for the most important headings and stable `rem` sizes for UI and metadata.

| Role | Desktop/current rule | Mobile behavior |
|---|---|---|
| Hero H1 | `clamp(3.35rem, 5.35vw, 5.85rem)` | `clamp(3.2rem, 13vw, 4.45rem)` |
| Section H2 | `clamp(2.25rem, 3.65vw, 3.85rem)` | fluid rule retained |
| Dark-footer H2 | `clamp(2.6rem, 4.1vw, 4.15rem)` | fluid rule retained |
| Brand | `clamp(1.45rem, 1.8vw, 1.95rem)` | `clamp(1.2rem, 5vw, 1.55rem)`, then `1.08rem` below 420px |
| Hero lede | `clamp(1.1rem, 1.45vw, 1.32rem)` | `1.05rem` |
| Eyebrow | `0.95rem` | generally retained |
| Navigation | `1.12rem` | replaced by mobile menu |
| Button | `1.04rem` | retained with larger full-width target |
| Card/row title | approximately `1.05–1.55rem` | preserve hierarchy, wrap naturally |
| Metadata | approximately `0.72–1rem` | never reduce below readable size |

### 6.4 Heading construction

Hero and section headings use:

- weight 300–400;
- line-height `0.98` for compact editorial stacking;
- no artificial letter spacing;
- sentence case rather than title case;
- one or more rust-colored `<span>` phrases;
- deliberately controlled maximum widths.

Recommended pattern:

```html
<p class="eyebrow">Collection context</p>
<h1 or h2>Primary statement <span>with one archival emphasis.</span></h1 or h2>
<p>One concise explanatory sentence.</p>
```

Do not color isolated random words. The rust phrase should carry the conceptual turn of the heading: ephemeral/permanent, encounter/trace, archive/presence.

### 6.5 Body copy

- Base size: `16px`.
- Base line-height: `1.5`.
- Introductory and heading-support copy usually uses `1.04rem` with a maximum width near `54rem`.
- Hero ledes use a tighter `1.25` line-height and a maximum width near `29rem`.
- Use short paragraphs. The interface is designed for concise curatorial copy, not long uninterrupted essays.
- For long-form future pages, target a reading measure of `38–45rem` or roughly `55–75` characters per line and increase line-height to `1.55–1.7`.

### 6.6 Eyebrows and labels

Eyebrows are rust, uppercase, `0.95rem`, weight 500, with `0.06em` tracking. They frequently pair with a horizontal ornamental mark.

Definition labels and archival microcopy may use:

- `0.72–0.95rem`;
- uppercase;
- tracking between `0.06em` and `0.1em`;
- muted brown, copper, or rust;
- short phrases only.

Avoid setting full paragraphs in uppercase or widely tracked type.

### 6.7 Brand wordmark

`PERMAPHEMERA` is rendered as text, not a raster logo:

- uppercase;
- weight 500;
- desktop tracking `0.24em`;
- mobile tracking `0.13em`;
- single line at every breakpoint.

The footer wordmark uses `1.7rem` and `0.16em` tracking. Do not distort, italicize, outline, or place the name inside a badge.

### 6.8 Links

- In navigation and footer contexts, hover uses rust plus a 1px underline.
- Underline offset is generous (`0.28em`) so the line feels editorial.
- Artist names are underlined by default with a smaller `0.16em` offset.
- Do not remove focus indication.
- Do not use default browser blue.

## 7. Spacing And Negative Space

### 7.1 Base unit

The implementation does not yet expose spacing tokens, but it repeatedly uses a practical quarter-rem rhythm. New work should use multiples of `0.25rem` and favor the following semantic scale:

| Suggested token | Value | Typical use |
|---|---:|---|
| `--space-1` | `0.25rem` | micro alignment |
| `--space-2` | `0.5rem` | icon/text adjustments |
| `--space-3` | `0.75rem` | compact list gaps |
| `--space-4` | `1rem` | default internal gap |
| `--space-5` | `1.25rem` | mobile page gutter, row padding |
| `--space-6` | `1.5rem` | common component spacing |
| `--space-8` | `2rem` | heading groups, section internals |
| `--space-10` | `2.5rem` | major column gaps |
| `--space-12` | `3rem` | mobile section padding |
| `--space-16` | `4rem` | major desktop intervals |
| `--space-20` | `5rem` | desktop section padding |

Add these as real tokens only when the refactor can be applied consistently; do not create parallel tokens while leaving most rules hard-coded.

### 7.2 Global content width

Standard light sections use:

```css
max-width: 105rem;
margin-inline: auto;
padding: clamp(3rem, 5vw, 5rem) clamp(1.4rem, 5vw, 5.2rem);
```

This creates generous desktop gutters without making large screens feel empty. The mobile gutter becomes `1.25rem` at 700px and below.

New standard pages should reuse `.section-band`. Full-bleed elements may escape the content width only when they are primarily atmospheric or navigational, such as the sponsor frame or footer background.

### 7.3 Vertical rhythm

A standard section follows this sequence:

1. top breathing space;
2. eyebrow;
3. heading directly beneath it;
4. optional lede, about `0.85rem` below the heading;
5. primary control or content beginning around `2rem` later;
6. major content grid;
7. optional quiet divider before the next section.

Do not place major cards immediately against an H2. Preserve at least `2rem` unless a deliberately overlapping composition is part of the design.

### 7.4 Negative-space rules

- Leave more space around major editorial statements than around utilitarian controls.
- Allow ornaments to occupy otherwise empty margins; never squeeze content to make room for them.
- Keep card grids compact relative to section margins: current venue gaps are `1.4rem`.
- Use wide column gaps (`2.5–6rem`) for editorial split layouts.
- Do not center every content block. Left-aligned text against asymmetrical imagery is a core pattern.
- On mobile, preserve breathing room through vertical stacking rather than shrinking everything.

### 7.5 Intentional overlaps and negative offsets

Small negative positioning is permitted when it reinforces physical layering:

- archive-method step frame: `translateY(-13px)`;
- section dividers may use a negative lower margin;
- paperclips begin above their paper stack;
- ornaments may extend beyond a card edge;
- full-bleed sponsor frame is centered with `left: 50%` and `translateX(-50%)`.

Do not use negative margins as a routine layout fix. Every overlap should have a physical or compositional explanation.

## 8. Grid And Responsive Layout

### 8.1 Breakpoints

The current system has three meaningful thresholds:

- **Above 1100px:** full desktop navigation and multi-column editorial layouts.
- **701–1100px:** tablet/intermediate layout; mobile menu appears and major compositions become one column while some internal grids remain two columns.
- **421–700px:** mobile layout; one-column content, full-width actions, stacked search, simplified records and footer.
- **420px and below:** compact header refinements.

Use these breakpoints for new pages unless content evidence requires an additional component-level breakpoint.

### 8.2 Desktop composition

Preferred desktop patterns:

- hero: two columns, approximately 41% copy / 59% visual;
- featured collection grid: one dominant item plus three smaller columns;
- editorial explanation: approximately 29% copy / 71% visual;
- archive index: main content plus an `18rem` sidebar;
- footer: brand, three navigation groups, and a seal.

Use `minmax()` so content controls minimum viability. Do not use rigid pixel column widths for primary content except narrow functional sidebars.

### 8.3 Tablet behavior

At 1100px:

- hide desktop navigation and compass;
- show the mobile menu control;
- stack hero, method, artists, and exhibition layouts;
- place the hero visual before its copy;
- use a two-column venue grid;
- move sidebars below main content with a top rule;
- reduce artist columns from three to two;
- reduce the footer to two columns.

### 8.4 Mobile behavior

At 700px:

- use a `1.25rem` page gutter;
- place the kaleidoscope before the hero statement;
- make hero actions full width;
- make buttons distribute label and arrow across the available width;
- wrap search controls into a full-width field and button;
- use single-column card, method-step, fact, artist, and footer layouts;
- convert horizontal dividers between grid items into full-width horizontal separators;
- simplify record cards from side-by-side image/copy to stacked image/copy;
- hide nonessential row arrows where width is limited;
- retain generous type rather than compressing the editorial character.

Mobile is a recomposition, not a scaled desktop page.

## 9. Header And Navigation

### 9.1 Header

The header is sticky with z-index 30. Desktop minimum height is approximately `6.4rem`; mobile is `5.25rem`.

Its surface is a translucent warm vertical fade into the page, without blur. A custom fine SVG divider replaces a conventional border.

Desktop structure:

```text
brand | centered primary navigation | language + compass
```

Mobile structure:

```text
brand | language + menu
```

Rules:

- Keep the brand at the left edge and on one line.
- Keep primary navigation concise: one-word or short labels.
- Use section anchors only on single-page contexts; new routed pages should use real Nuxt links and accurate active state.
- The language switch is `EN / DE`, with the active language in rust and `aria-current`.
- A mobile-menu button must open a real, keyboard-accessible menu before production. The current landing control is presentational and should not be copied without behavior.
- The compass/menu icon is a mask using `currentColor`, allowing semantic recoloring.

### 9.2 Navigation state

- Default: archive ink.
- Hover: rust plus underline.
- Current page/section: rust and an accessible state attribute.
- Focus: visible outline or equivalent high-contrast focus ring.
- Never indicate navigation state through motion alone.

## 10. Section Headers

Every major page section should begin with a consistent heading block:

- optional eyebrow plus an ornamental trailing rule;
- concise H1 or H2;
- rust emphasis within the title;
- one supporting sentence;
- maximum title width around `58rem` and support width around `54rem`.

Use one H1 per route. Landing subsections use H2. Card names use H3. Do not select heading levels based on visual size.

The eyebrow ornament is decorative and should be implemented through a pseudo-element or an `aria-hidden` image.

## 11. Buttons And Calls To Action

### 11.1 Shape

Buttons use custom SVG `border-image` frames rather than ordinary rounded rectangles:

- primary frame: `/svg/frames/button-primary-frame.svg`;
- secondary frame: `/svg/frames/button-secondary-frame.svg`;
- border-image slice: `20 fill stretch` with a `12px` transparent border;
- no conventional shadow;
- visually square/engraved edges rather than pills.

This is a nine-slice treatment. Do not replace `border-image` with a stretched background SVG. The slice and transparent border must preserve the original corner size; if a new frame asset uses different source geometry, determine and test its correct slice value instead of assuming `20`.

### 11.2 Primary button

- warm rust-filled framed surface;
- light text `#fff7eb`;
- icon or directional arrow where meaningful;
- height generally `4rem` or `3.55rem` in compact search/section controls;
- horizontal padding around `1.45–1.75rem`.

### 11.3 Secondary button

- pale paper framed surface;
- dark brown text `#5d4a35`;
- identical geometry to the primary button;
- use for explanatory or lower-priority paths.

### 11.4 States

- Hover: subtle brightness/contrast/saturation change.
- Active: `scale(0.97)` plus a 1px downward shift.
- Arrow: translate roughly `0.32rem` in the direction of travel.
- Transition: about `140ms` for press geometry and `320–380ms` for directional or tonal refinement.
- Focus-visible: must be explicitly visible; add a consistent rust/ink outline to all framed buttons when expanding the component system.
- Disabled: reduce contrast and prevent motion, but keep text readable. Do not use opacity below roughly 0.5 for required information.

### 11.5 Button copy

Use direct verbs:

- Explore the archive
- Open archive
- Enter 360 record
- View all locations
- Explore a sample record

Avoid generic `Click here`, vague `Learn more` when a specific destination exists, or overly promotional language.

## 12. Icons And Directional Marks

The icon system mixes:

- custom archival SVG masks for brand-specific marks;
- Lucide icons for simple semantic symbols;
- an in-house `ArchiveArrow` component for directional action.

Rules:

- Prefer custom icons for archive, compass, measurement, location, and calendar motifs already present.
- Use Lucide only when a custom archival equivalent does not exist.
- Standard action icon sizes are approximately `1.45–1.65rem`.
- Keep strokes fine and colors inherited through `currentColor`.
- Directional arrows should animate only in the direction they imply.
- Decorative icons use empty alt text and `aria-hidden`; functional icon-only buttons require an `aria-label`.
- Do not mix filled modern app icons with the existing fine-line system.

## 13. Forms And Search

Search controls use a framed field plus a separate framed primary button.

Field characteristics:

- custom `search-field-frame.svg` border image;
- transparent center over the page paper;
- minimum height `4rem`;
- inset padding around `1.15rem`;
- rust search icon;
- serif input text at `1rem`;
- no browser-default border or background.

The field frame uses the same nine-slice requirement as buttons. Horizontal growth may lengthen the edges but must not widen the corner cut-outs; vertical changes may lengthen the sides but must not flatten or elongate the corners.

Layout:

- desktop: field grows, button remains `11.5rem` wide;
- mobile: field and button stack and each occupies full width;
- gap: approximately `0.65rem`.

UX requirements for future pages:

- Search should update results immediately or the button should perform a meaningful submit; do not retain a nonfunctional search button.
- Provide a visible no-results state.
- Preserve the query in the URL for routed archive pages when useful.
- Add a clear-search control when queries can become long-lived.
- Keep labels in the DOM even when visually hidden.
- Use descriptive placeholders as examples, not substitutes for labels.
- Provide correct autocomplete and input type where relevant.

## 14. Cards And Archival Surfaces

### 14.1 General character

Cards are sheets or records, not floating app panels. They use:

- custom Vue/SVG perimeter frames;
- clipped-corner media geometry;
- transparent or warm paper surfaces;
- very light drop shadows;
- fine decorative crosshairs;
- typography and metadata aligned like catalogue records.

Avoid generic `border-radius: 12px` cards, heavy box shadows, and uniform thumbnail grids.

### 14.2 Venue cards

Venue cards use:

- `VenueMaskedImage` for the clipped image;
- `VenueCardFrame` for paper and line geometry;
- a flexible column body;
- H3 venue name, muted city, and an `Open archive` action;
- a low-opacity crosshair in one corner;
- subtle drop-shadow increase and rotating ornament on hover.

The featured venue spans two rows and uses a much taller image (`25–31rem` desktop). Featured content should be selected semantically in data, not through `:nth-child()` alone.

### 14.3 Exhibition records

Use `ExhibitionFrameCard` for record surfaces. The featured record combines a large image with an inset dark overlay and primary action. Secondary records place image and structured metadata side by side on desktop and stack them on mobile.

Metadata order should remain stable:

1. exhibition title;
2. artist;
3. venue and city;
4. date range;
5. record action.

Use semantic `<time>` elements for real dates in future routed pages.

### 14.4 Paper stacks

Paper stacks represent additional records or expansion. The current location stack uses four slightly translated and rotated sheets plus a two-layer paperclip.

Resting rotations stay within roughly ±5°. Hover spreads the stack by no more than about 24px and ±7°. The animation uses GSAP `power2.out`, around `280–360ms`, with a very small stagger.

Use a paper stack only for aggregation, overflow, or a collection—not as decoration around a single item.

### 14.5 Frames and masks

The cut-corner frame is a primary brand component. Its geometry must be treated as shared infrastructure, not page decoration.

#### Approved technique A: CSS nine-slice SVG frames

Use CSS `border-image` when a rectangular control or panel needs fixed decorative corners with stretchable edges:

```css
.framed-surface {
  border: 12px solid transparent;
  border-image: url("/svg/frames/example-frame.svg") 20 fill stretch;
}
```

This technique is commonly called **nine-slice scaling** or a **9-slice border**. The SVG is divided into:

```text
fixed corner | stretchable top edge    | fixed corner
stretch side | stretchable/fill center | stretch side
fixed corner | stretchable bottom edge | fixed corner
```

Current nine-slice uses include:

- primary and secondary buttons;
- search/input fields;
- archive-method steps panel;
- sponsor strip frame.

Rules:

- Preserve the transparent border width expected by the asset.
- Preserve the correct `border-image-slice` value for that specific SVG.
- Stretch edges and center only; corners must remain optically unchanged.
- Do not use a single full SVG as `background-size: 100% 100%`.
- Do not apply non-uniform CSS `scaleX()`/`scaleY()` to the framed element or its frame layer.
- Do not assume every frame asset has the same slice value; inspect and test new assets.

#### Approved technique B: generated paths with identical image masks

Venue and exhibition cards use responsive SVG paths generated from `venueFrameGeometry.ts`:

- `createVenueFramePath()` creates the outer perimeter;
- `createVenueInnerFramePath()` creates the inset four-corner frame and full-card image mask;
- `createVenueMediaPath()` creates the media shape used when only the upper image corners meet the frame;
- `VenueCardFrame` renders the paper and border;
- `VenueMaskedImage` clips photography to the corresponding geometry;
- `ExhibitionFrameCard` uses the shared inner geometry for its surface.

The frame and its content mask must use the same geometry source and the same live width/height. An approximate CSS polygon is not an acceptable substitute. If a photograph is inside a full framed sheet, use the full four-corner frame mask (`shape="frame"`); if the photograph occupies only the top media region of a larger card, use the media mask.

#### Absolute rules for every framed surface

- Reuse existing frame components instead of recreating the silhouette.
- Never let images, backgrounds, hover layers, or overlays overflow into a cut-out corner.
- Never conceal overflow by adding an unrelated rectangular crop outside the shared mask.
- Never use ordinary `border-radius` as a substitute for the concave corner geometry.
- Never distort the frame to make it fit content; change the layout or implement correct nine-slicing/dynamic geometry.
- Dynamic SVG geometry must bind real SVG attributes (`:viewBox.attr`, `:width.attr`, etc.) where Vue attribute handling requires it.
- Repeated masks must have unique SVG IDs so instances cannot reference one another accidentally.
- Keep frame artwork pointer-inert and `aria-hidden`.
- Keep media masks stable across loading states to prevent layout shift.
- Define a sensible aspect ratio or height before images load.

#### Required corner verification

For every new or changed framed component:

1. Check top-left, top-right, bottom-right, and bottom-left separately.
2. Check the smallest and largest supported width.
3. Check the smallest and largest supported height.
4. Check desktop, tablet, and mobile layouts.
5. Check default, hover, active, focused, animated, and loading states.
6. Confirm photography and colored fills stop exactly at the intended inner boundary.
7. Confirm the corner line weight and cut-out dimensions remain visually identical.

If any corner changes shape or any content becomes visible beyond the matching mask, the component must not ship.

## 15. Images And Art Direction

### 15.1 Image roles

The project uses several distinct image categories:

- documentary exhibition and venue photography;
- kaleidoscope fragments;
- precomposed archival collages;
- extracted ornamental details;
- sponsor marks;
- background drafting and measurement artifacts.

Do not treat all image files the same. Each category has a different crop, contrast, accessibility, and loading requirement.

### 15.2 Documentary photography

- Favor architectural views, installation context, sightlines, and spatial relationships.
- Use `object-fit: cover` in cards, with a deliberate focal point.
- Preserve natural, slightly warm color. Avoid aggressive filters, high saturation, or trendy color grading.
- Use descriptive alt text based on the meaningful subject, not filenames.
- For linked cards, avoid duplicating the exact title in both alt text and link label when it creates repetitive screen-reader output.

### 15.3 Hero imagery

The hero kaleidoscope is a signature component. It is large, circular, visually dominant, and surrounded by fine directional orbit marks. On mobile it appears before the headline.

Do not reuse the kaleidoscope on ordinary pages. It belongs to high-level orientation or a similarly important collection entry point.

### 15.4 Archival compositions

Precomposed images such as the archive-method collage may be used when the relationship between layers is too intricate for normal responsive layout. They must:

- be exported at sufficient resolution;
- retain transparent edges where required;
- use meaningful alt text when the composition communicates content;
- be paired with real HTML text for essential labels and facts;
- not contain the only accessible instance of important copy.

### 15.5 Decorative imagery

- Use `alt=""` and `aria-hidden="true"`.
- Keep opacity low.
- Do not allow ornamental PNGs to intercept pointer input.
- Prefer SVG for scalable rules, frames, icons, and measurement motifs.
- Prefer optimized PNG/WebP/AVIF for textured transparent artwork depending on fidelity needs.

### 15.6 Asset naming

Use lowercase kebab-case for all new assets:

```text
archive-method-composition.webp
location-card-frame.svg
copyright-center.png
```

Avoid spaces, uppercase letters, diacritics, version suffixes like `final-v2-new`, and generic names such as `image1.png`. Organize by semantic area:

```text
public/images/<page>/<section>/<asset-name>.<ext>
public/svg/<category>/<asset-name>.svg
```

### 15.7 Performance

- Supply explicit dimensions or aspect ratios.
- Lazy-load below-the-fold documentary images.
- Keep the hero/first meaningful image eager where it affects LCP.
- Use responsive image sources for large photography.
- Optimize transparent PNGs and consider WebP/AVIF where transparency and texture remain acceptable.
- Do not load Three.js or similarly large page-specific libraries globally on pages that do not use them.

## 16. Lists, Indexes, And Metadata

### 16.1 Artist index

The artist archive behaves like an editorial index:

- three columns on desktop, two on tablet, one on mobile;
- dashed column rules;
- letter groups that avoid column breaks;
- rust letter heading plus ornamental horizontal rule;
- each row contains name, location/years, record count, and arrow;
- names are visibly linked.

### 16.2 Alphabet filters

- Use a wrapping horizontal list.
- Default letters are muted.
- Available/active letters are rust and medium weight.
- Disabled letters should use actual disabled semantics when they cannot be selected.
- Selected filter state must use `aria-pressed`, `aria-current`, or an equivalent programmatic state.
- Keep the control a real list or grouped set of buttons; do not use plain spans.

### 16.3 Plain lists

Sidebar location lists remove bullets and use a compact vertical gap around `0.45rem`. This is appropriate for short archive facets. Long or instructional lists should retain markers or use custom archival numbering to preserve scanability.

### 16.4 Definition lists

Use `<dl>`, `<dt>`, and `<dd>` for labelled facts such as technology, curation, and status. Labels are small, uppercase, tracked, and muted; values are larger and darker.

On desktop, facts may appear in three columns separated by ornamental vertical rules. On mobile, stack them and rotate the separator logic into horizontal rules.

### 16.5 Metadata formatting

- Use middle dots for compact secondary combinations: `Vienna · 2022–2024`.
- Use en dashes for ranges.
- Use consistent title casing based on language rather than arbitrary uppercase.
- Use singular/plural correctly (`1 record`, `2 records`).
- Keep labels concise and content-driven.

## 17. Dividers, Rules, And Ornaments

The project uses fine ornamental image rules instead of standard borders in prominent places.

Common assets include:

- `header-divider.svg` for header and group rules;
- section divider artwork for major transitions;
- crosshairs for card corners and page fields;
- ruler/measurement imagery at viewport edges;
- compass/radial diagrams for spatial context;
- column-divider imagery in the footer.

Rules:

- Use plain 1px translucent borders for quiet structural separation.
- Use ornamental dividers for important editorial transitions.
- Keep ornamental divider opacity around `0.34–0.72`.
- Avoid placing an ornamental divider after every paragraph or card.
- Rotate a directional divider only when its geometry remains visually convincing.
- Never encode essential meaning solely in decoration.

## 18. Motion And Interaction

### 18.1 Timing language

The established motion range is:

- press feedback: about `140ms`;
- arrow and paper settling: `280–360ms`;
- tonal hover change: `360–380ms`;
- easing: `cubic-bezier(0.22, 1, 0.36, 1)`, standard material-like press easing, or GSAP `power2.out`.

### 18.2 Interaction patterns

- arrows translate in their indicated direction;
- paper stacks spread and clips lift;
- card ornaments rotate slightly;
- buttons brighten subtly and compress on press;
- sponsor strip uses direct pointer dragging with grab/grabbing cursor;
- kaleidoscope controls rotate a spatial composition.

### 18.3 Motion constraints

- Keep travel distances short.
- Avoid continuous motion except when a user explicitly controls it.
- Avoid animating large layout dimensions when transforms can express the same action.
- Use `will-change` narrowly and only on known animated layers.
- Implement `prefers-reduced-motion: reduce` before production: remove smooth scrolling, stack spreading, ornament rotation, and nonessential transitions while preserving state change.
- Do not hide content until animation completes.

## 19. Footer And Dark Surfaces

The footer is a deliberate tonal conclusion, not a generic utility bar.

### 19.1 Surface

- Base: archive night around `#17130f`.
- Layer subtle warm radial and linear variation.
- Reuse column and ruler ornaments with low opacity and screen-like blending.
- Main text: warm parchment values, never pure white.

### 19.2 Sponsor band

- Full-viewport-width framed strip within the footer.
- Marks are vertically centered in fixed-width cells.
- Names are uppercase, copper-beige, tracked, and centered.
- Dividers are narrow and translucent.
- Strip supports horizontal scrolling and pointer dragging.
- A centered directional instruction explains interaction.

For production, add keyboard-accessible horizontal scrolling controls or ensure natural focus/scroll behavior; pointer dragging alone is insufficient.

### 19.3 Footer navigation

Desktop columns:

1. brand statement and language;
2. Explore;
3. Information;
4. Legal;
5. archival seal.

Column labels use copper uppercase text. Links use warm light text and rust/underline hover behavior. Decorative vertical separators disappear when the footer collapses.

### 19.4 Copyright line

Use three balanced groups on desktop and a vertical stack on mobile. Maintain subdued text and ornamental center/end details. Do not overcrowd this area with secondary navigation already present above.

## 20. Content Voice

The writing style is concise, curatorial, and evocative without becoming vague.

### 20.1 Headlines

Use a conceptual contrast or transformation:

- Ephemeral worlds. Permanently preserved.
- Temporary encounters. Lasting traces.
- An exhibition, retained in space.

Prefer short declarative fragments. Avoid marketing superlatives such as “revolutionary,” “ultimate,” or “world-class.”

### 20.2 Supporting copy

Explain what the archive preserves and how the visitor can engage with it. Use concrete cultural language: exhibition, space, record, arrangement, atmosphere, trace, presence, archive, location.

### 20.3 Labels and actions

Use exact nouns and verbs. `Open record` is better than `Discover more`. `Locations` is better than an abstract label like `Places` when the underlying data model is locations.

### 20.4 Naming consistency

The current interface uses both “Galleries” and “Locations,” and both “record” and “archive.” New pages should use these distinctions consistently:

- **Location:** geographic place or city/town facet.
- **Venue/Gallery:** institution or exhibition space.
- **Exhibition:** temporary cultural event.
- **Record:** preserved navigable documentation of one exhibition.
- **Archive:** the complete collection and its browsing surface.
- **Artist:** creator or participating practice connected to records.

Do not interchange these terms casually in routes, components, data, or visible copy.

## 21. Code And Naming Conventions

### 21.1 Vue components

- Use PascalCase filenames and component names: `VenueCardFrame.vue`, `ArchiveArrow.vue`.
- Name a component by its semantic responsibility, not its appearance alone.
- Extract a component when it owns reusable geometry, behavior, accessibility, or data presentation.
- Keep one-off section composition in the page until a reusable contract is clear.

### 21.2 CSS classes

The current code uses descriptive kebab-case classes:

```text
section-heading
venue-card-featured
record-meta-line
method-archive-stamp
footer-bottom-right
```

Continue this convention:

- block/area first, modifier last;
- use `is-*` for transient state (`is-dragging`);
- use semantic names rather than visual names (`record-meta-line`, not `small-gray-row`);
- avoid page-global generic names like `.left`, `.red`, or `.box`;
- avoid binding behavior solely to `:nth-child()` when data can provide a semantic modifier class.

For larger new routes, prefix page-specific blocks with a route/domain namespace to prevent global collisions.

### 21.3 TypeScript and data

- Use typed local data contracts from `app/types/content.ts`.
- Use snake_case only where matching the future Directus schema is intentional (`date_range`, `record_count`).
- Use camelCase for local variables, computed values, and functions.
- Use kebab-case stable slugs and asset IDs.
- Derive featured/active behavior from data fields rather than array position.
- Keep the UI data adapter in `useArchiveData` so Directus can replace JSON without rewriting components.

### 21.4 IDs and anchors

- Use lowercase kebab-case IDs.
- Match labels and anchor destinations accurately.
- Do not point multiple semantically different links to the same placeholder anchor in production.
- Use route names and real `NuxtLink` destinations once detail pages exist.

### 21.5 CSS values

- Use `rem` for typography, spacing, and component dimensions.
- Use `clamp()` for major fluid type and section padding.
- Use percentages/fr units for layout.
- Use pixels only for hairline borders, exact SVG border slices, and unavoidable graphic alignment.
- Reuse color and font tokens; promote repeated spacing or surface values into tokens during a focused refactor.

## 22. Accessibility Requirements

The existing implementation provides a useful baseline but not a complete production standard.

Every new page must include:

- one logical H1 and correctly nested headings;
- semantic landmarks (`header`, `nav`, `main`, `section`, `aside`, `footer`);
- unique accessible navigation labels where multiple nav elements exist;
- visible keyboard focus for every interactive element;
- adequate text contrast;
- meaningful image alt text and empty alt text for decoration;
- real labels for all inputs;
- programmatic state for filters, menus, tabs, and language selection;
- minimum practical touch targets around 44×44px;
- keyboard-equivalent behavior for drag, hover, and pointer interactions;
- reduced-motion behavior;
- no essential text embedded only in images;
- no interaction triggered only by hover;
- skip navigation on multi-section and routed pages;
- clear errors, empty states, and loading states.

Specific current patterns that require completion before reuse:

- the mobile menu button needs an implemented menu and expanded state;
- alphabet buttons need actual filter behavior and selected/disabled semantics;
- sponsor dragging needs keyboard-accessible alternatives;
- placeholder links must become accurate destinations;
- search submit behavior and no-results feedback must be explicit;
- focus styling should be standardized beyond venue-card focus.

## 23. Page States

New pages must design states in the same visual language.

### 23.1 Loading

- Reserve final layout dimensions to prevent shifts.
- Use warm paper blocks, fine frame outlines, or low-contrast line placeholders.
- Avoid modern shimmering gradient skeletons unless restyled very subtly.
- Keep the page heading and navigation available while records load.

### 23.2 Empty results

- Keep the current query visible.
- Present a concise editorial message in the normal serif.
- Offer a framed action to clear filters or return to the archive.
- A quiet crosshair or divider may support the state; do not use cartoon illustrations.

### 23.3 Error

- State what could not be loaded.
- Preserve the parchment canvas and page structure.
- Use rust for the key status phrase, not a bright red alert panel.
- Provide a concrete retry or navigation path.

### 23.4 Success or confirmation

- Use restrained inline copy and a small archival mark.
- Avoid toast-heavy interaction unless the action is transient and cannot be acknowledged in context.

## 24. Recommended New-Page Template

A standard new archive page should follow this composition:

```html
<main class="site-shell">
  <SiteHeader />

  <header class="section-band page-hero">
    <div class="section-heading">
      <p class="eyebrow">Archive category</p>
      <h1>Clear page purpose <span>with one meaningful emphasis.</span></h1>
      <p>One concise curatorial explanation.</p>
    </div>
    <!-- Optional page-specific image, record summary, or primary action -->
  </header>

  <section class="section-band" aria-labelledby="collection-title">
    <!-- Search/filter controls -->
    <!-- Semantically structured record grid or index -->
  </section>

  <!-- Optional method/facts/related-record section -->
  <SiteFooter />
</main>
```

The first viewport should establish page identity through type and one strong spatial or documentary visual. Do not repeat the landing kaleidoscope unless the new route genuinely needs it.

## 25. Do And Do Not

### Do

- lead with serif typography and curatorial copy;
- use warm paper and ink as the dominant visual field;
- highlight conceptually meaningful words in rust;
- preserve generous margins and maximum reading widths;
- mix disciplined grids with small archival irregularities;
- reuse custom SVG frames and linework;
- treat venue/exhibition imagery as spatial documentation;
- use metadata structures consistently;
- make mobile layouts deliberate vertical compositions;
- make interactions directional and physically intelligible;
- verify keyboard, contrast, alt text, and reduced motion.

### Do not

- introduce a generic UI kit appearance;
- use pills, large corner radii, glassmorphism, or loud gradients;
- use pure white backgrounds or pure black footer text without warm toning;
- saturate the page with rust;
- center all text and cards;
- compress section spacing to fit more content above the fold;
- add ornaments without hierarchy or spatial purpose;
- use paper stacks for ordinary single cards;
- hide essential information in raster artwork;
- shrink editorial headings excessively on mobile;
- copy presentational placeholder behavior into production routes;
- add unrelated icon styles or animation languages.

## 26. Quality Checklist For Every New Page

### Brand and hierarchy

- [ ] The page reads as PERMAPHEMERA without relying on the logo alone.
- [ ] One H1 clearly states the page purpose.
- [ ] Heading emphasis uses rust intentionally.
- [ ] Eyebrows, labels, and body copy follow the established type roles.
- [ ] Terminology matches the domain definitions in this guide.

### Layout and spacing

- [ ] Standard content uses the `105rem` section width and fluid gutters.
- [ ] Major sections have sufficient vertical breathing room.
- [ ] Long text uses a readable measure.
- [ ] Decorative assets occupy margins without constraining content.
- [ ] Negative offsets represent real layering rather than layout repair.

### Components

- [ ] Existing buttons, arrows, frames, masks, search fields, and card patterns are reused.
- [ ] Every cut-corner frame uses approved nine-slice scaling or shared dynamic SVG geometry; no complete frame SVG is stretched.
- [ ] All four corners retain their original proportions at minimum and maximum component dimensions.
- [ ] Images, fills, overlays, and animated layers remain inside the matching cut-corner mask in every state.
- [ ] New components have semantic PascalCase names.
- [ ] Modifier and state classes use consistent kebab-case naming.
- [ ] Data contracts remain compatible with the archive adapter and future Directus schema.

### Images

- [ ] Documentary imagery has deliberate crop and focal point.
- [ ] Dimensions/aspect ratios prevent layout shift.
- [ ] Below-the-fold images are lazy-loaded where appropriate.
- [ ] Decorative images are hidden from assistive technology.
- [ ] Asset filenames and folder placement follow the naming rules.

### Responsive behavior

- [ ] Desktop composition is verified above 1100px.
- [ ] Tablet composition is verified between 701px and 1100px.
- [ ] Mobile composition is verified at 700px and below.
- [ ] Compact header is verified at 420px and below.
- [ ] Controls remain readable and at least approximately 44px high.
- [ ] No meaningful content depends on hover.

### Interaction and accessibility

- [ ] Keyboard order follows visual order.
- [ ] Focus is visible on every control.
- [ ] Active states are programmatically exposed.
- [ ] Search, filtering, menus, and links perform their stated action.
- [ ] Drag interactions have keyboard alternatives.
- [ ] Reduced-motion behavior is implemented.
- [ ] Heading, landmark, label, and alt-text semantics are correct.

### Performance and verification

- [ ] Page-specific heavy libraries are loaded only where used.
- [ ] Images are optimized and responsive.
- [ ] No avoidable oversized client bundle is introduced.
- [ ] Production build passes.
- [ ] The page is visually checked at desktop and mobile sizes.
- [ ] Console, keyboard navigation, overflow, and text wrapping are checked.

## 27. Current Implementation Notes

This guide reflects the code and approved landing-page references as of its creation. The source implementation currently succeeds in production builds, with non-fatal Vite notices for root-relative public assets and a client chunk-size warning associated with the graphics-heavy landing experience.

Live browser rendering was unavailable during this guide's creation. Exact CSS geometry, component behavior, source assets, and desktop/mobile mockups were reviewed; future visual changes should still be verified in the running Nuxt application before this document is treated as evidence of pixel-level runtime behavior.

When the design system evolves, update this guide in the same patch that introduces a new global token, shared component, breakpoint, interaction pattern, or domain term.
