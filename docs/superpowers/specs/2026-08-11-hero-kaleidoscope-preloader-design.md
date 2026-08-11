# Hero Kaleidoscope Preloader — Design

Date: 2026-08-11
Status: Approved for planning
Scope owner: landing hero (`app/components/HeroKaleidoscope.vue`)

## Problem

Opening the landing page shows an empty hero square for a long time before the
kaleidoscope fan appears. Nothing communicates that work is happening.

Two independent causes:

1. **The render is gated on the full image payload.** `onMounted` runs
   `await Promise.all(...)` over twelve textures before it builds any geometry,
   sizes the renderer, draws a frame, or starts the intro timeline. The twelve
   slices resolve to eleven unique files totalling **≈ 20.5 MB**
   (`parkschloessl.jpg` at 541 KB plus `location_01.png`–`location_10.png` at
   roughly 2 MB each). `.hero-kaleidoscope__arrow { opacity: 0 }` in
   `app/assets/css/main.css` hides the orbit arrows from first paint, so the
   square is genuinely blank for the whole wait.
2. **Nothing survives the wait or the visit.** `textureCache` and
   `texturePromises` are declared inside `<script setup>`, making them
   per-component-instance. `onBeforeUnmount` clears both and disposes every
   texture, so navigating to another route and back re-downloads, re-decodes,
   and re-uploads all of them. `public/.htaccess` sets no `Cache-Control`, so
   repeat visits also pay a revalidation round-trip per file.

## Non-goals

- **Image optimisation is explicitly deferred.** Converting the location PNGs to
  WebP (measured at 2154 KB → 82 KB, a 26× reduction) is a separate follow-up,
  recorded in "Deferred work" below. The large files are retained on purpose so
  the loading state is long enough to develop and test against on localhost.
- The fan must **never** be displayed without its images. The blocking gate in
  `onMounted` is preserved deliberately; this design does not make the wheel
  render progressively.
- No change to the intro, rotation, or replay choreography beyond the handoff.
- No change to the existing background pool preload.

## Architecture

Three units with separate responsibilities.

| Unit | File | Responsibility |
| --- | --- | --- |
| Texture cache | `app/utils/kaleidoscopeTextures.ts` (new) | Module-scoped URL→Texture map surviving component unmount. Owns loading, in-flight dedup, LRU eviction, disposal. |
| Orbit geometry | `app/utils/orbitGeometry.ts` (new) | Shared orbit maths: `orbitRadius`, `pointOnOrbit`, `describeOrbitArc`, `describeArrowHead`, `orbitSegments`. Moved out of `HeroKaleidoscope.vue`. |
| Dial | `app/components/KaleidoscopeLoader.vue` (new) | Presentational progress dial. Props `readySlices` / `total`. No Three.js knowledge. |
| Orchestrator | `app/components/HeroKaleidoscope.vue` (modified) | Tracks arrivals, keeps the gate, hands the dial off to the intro timeline. |

Extracting the cache into a module is what makes caching actually work: a `Map`
in `<script setup>` is per-instance and dies on unmount.

The orbit geometry is extracted because the dial's sweeping arrow must use the
same arc as the intro arrows. The alternative — having the dial `<use>` the
`#hero-orbit-arrow-line` and `#hero-orbit-arrow-head` IDs defined in
`HeroKaleidoscope`'s `<defs>` — would work in the DOM but would couple a
supposedly reusable component to IDs owned by its parent. Sharing the geometry
functions instead gives both components one source of truth through a real
interface, and leaves the dial renderable on its own.

### `kaleidoscopeTextures.ts` interface

```ts
export function loadTexture(url: string): Promise<THREE.Texture>
export function isTextureCached(url: string): boolean
export function getFallbackTexture(): THREE.Texture
export function releaseTextureCache(): void   // test/teardown only
```

Behaviour:

- Returns a cached texture immediately when present.
- Returns the in-flight promise when a load is already pending for that URL,
  so concurrent slices requesting the same URL share one request.
- Applies the existing `prepareTexture` settings (sRGB colour space, clamped
  wrapping, mipmaps, linear filters) before caching.
- Evicts least-recently-used entries above a cap of **24 textures** so the
  40-image random pool cannot grow without bound. Eviction disposes only the
  evicted texture. The cap is the one tuning value in this design that depends
  on how people actually browse the site; 24 covers the twelve visible slices
  plus a full replay's worth of replacements.
- `getFallbackTexture()` returns a lazily created 1×1 transparent canvas
  texture used when a URL fails to load.

## Loading gate

`onMounted` keeps its `await Promise.all(...)`, with the individual promises
made observable:

```ts
const readySlices = ref<boolean[]>(Array.from({ length: 12 }, () => false))

const textures = await Promise.all(
  Array.from({ length: 12 }, (_, index) => {
    const url = sourceImages[index % sourceImages.length]
    return loadTexture(url)
      .catch((error) => {
        console.warn(`Could not load kaleidoscope image: ${url}`, error)
        return getFallbackTexture()
      })
      .finally(() => {
        if (!isActive) return
        markSliceReady(index)
      })
  })
)
```

The `.catch` closes a latent failure mode: today a single failed request rejects
the `Promise.all`, `onMounted` throws, and the wheel never appears at all. With
the gate deliberately held closed, that path must resolve rather than hang.

`markSliceReady` replaces the entry by spreading into a new array rather than
calling `Array.prototype.with`. `.with` is unavailable before Safari 16.4, and it
would run inside `.finally()`, which sits after the `.catch()` in the chain — so
a `TypeError` there would reject the whole `Promise.all`, throw out of
`onMounted`, and leave the hero permanently blank. That is the exact failure this
design exists to remove.

`readySlices` is the single source of truth for progress; the loaded count is
derived from it rather than tracked separately. Entries are keyed by **slice
index**, not by completion order, because each tick represents the blade that
will occupy that position. `heroImages` contains eleven unique URLs across
twelve slices, so the duplicate slice resolves together with its twin and ticks
will not light in index order. That is accepted and reads as organic.

## Dial

Rendered inside the existing `.hero-kaleidoscope` container, in the same
`viewBox="0 0 100 100"` space as the orbit SVG, so it occupies exactly the
position the wheel will take. The container is already `aspect-square`, so no
layout shift occurs.

Four elements:

1. **Track circle** — hairline, `r=52` (the existing `orbitRadius`),
   `archive-red` at low opacity. A drafting guide for the ring to come.
2. **Twelve ticks** at the twelve arrow angles (`index * 30°`). Each inks in
   from low to high opacity when its slice arrives. This is the determinate
   indicator: discrete, 1:1 with the blades, archival.
3. **One sweeping arrow** — reuses `#hero-orbit-arrow-line` and
   `#hero-orbit-arrow-head`, the same 2°→28° geometry the twelve intro arrows
   use, rotating continuously (~9 s per turn). This is the indeterminate
   indicator, guaranteeing visible motion while a single large file stalls.
   Narratively it is one of the twelve arrows circling alone, waiting for its
   siblings.
4. **Centre legend** — `font-display`, small letterspaced label above roman
   numerals in `archive-red`.

Legend copy (new i18n keys under `landing.hero`):

| Key | de | en |
| --- | --- | --- |
| `loadingLabel` | `Galerie` | `Gallery` |
| `loadingProgress` | `{loaded} von {total} Galerien geladen` | `{loaded} of {total} galleries loaded` |

`Galerie` / `Gallery` rather than an abstract plate metaphor, because that is
literally what each slice shows: one of the Austrian galleries in
`locations.json`. The singular is used for the standing label; `loadingProgress`
is a sentence and takes the German plural `Galerien`.

The numeral line renders as `VII — XII` from a small integer→roman helper. It is
decorative; the accessible value comes from `aria-valuetext`.

### Timing

- **Grace period:** the dial mounts but stays invisible for 180 ms. On a warm
  cache where loading finishes inside that window it never appears.
- **Minimum display:** once visible it remains for at least 500 ms, preventing a
  strobe when the cache is partially warm — the common case with a random pool.
- **Handoff:** when the last slice settles, the twelfth tick inks in, the dial
  holds ~120 ms, then fades over 0.4 s while `createIntroTimeline()` starts with
  ~0.3 s of overlap. The intro's arrow strokes draw over the same orbit path, so
  the dial's ring becomes the wheel's arrows rather than being replaced.

### Accessibility

- `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="12"`,
  `aria-valuenow="{loaded}"`, and `aria-valuetext` from `loadingProgress`.
- The dial is a live region for the value only; it does not steal focus.
- Roman numerals are decorative and are not the accessible value.
- Under `prefers-reduced-motion: reduce` the sweep does not rotate, ticks snap
  instead of fading, and the exit is an instant hide rather than a fade.

## Caching

- `textureCache` and `texturePromises` move to `kaleidoscopeTextures.ts` at
  module scope, surviving unmount for the browser session.
- `onBeforeUnmount` stops disposing cached textures. It continues to dispose
  per-instance geometries, slice materials, sprite materials, and the canvas
  loading-icon texture, and continues to kill timelines, cancel the animation
  frame, disconnect the `ResizeObserver`, and cancel the background preload.
- `public/.htaccess` gains `Cache-Control: public, max-age=2592000` for
  `/images/`. Thirty days rather than a year because `public/` filenames are not
  content-hashed by `nuxt generate`.

## Error handling

| Failure | Behaviour |
| --- | --- |
| One image 404s or times out | That slice uses the transparent fallback texture; its tick still inks in; the gate resolves; the wheel appears. Warning logged. |
| All images fail | Twelve fallback textures; wheel appears empty but functional; arrows and controls still work. |
| WebGL context unavailable | Out of scope — unchanged from current behaviour. |
| Component unmounts mid-load | In-flight promises are not cancellable; their `.finally` writes to refs on an unmounted component, so writes are guarded by an `isActive` flag set false in `onBeforeUnmount`. |

## Verification

- `pnpm check:tailwind` — bracketed candidates and spaced structural markers.
- `pnpm check:i18n` — message parity for the two new keys across `de` and `en`.
- `pnpm build` — static SPA generation still succeeds.
- Manual, with the large PNGs retained: dial appears on a cold load, ticks ink
  in as galleries land, handoff to the intro is continuous, wheel never shows
  without images.
- Manual: navigate away to `/locations/` and back; the cache holds and the dial
  does not reappear.
- Manual: `prefers-reduced-motion: reduce` — no sweep rotation, no fades.
- Manual: DevTools offline for one image URL — wheel still appears.

## Project conventions

- No `<style scoped>` and no CSS Modules. Tailwind utilities in the template;
  any genuinely required CSS rule goes in `app/assets/css/main.css`.
- Structural marker groups use the mandatory inner spaces, e.g.
  `[ kaleidoscope-loader ]`, and own no CSS declarations.
- The dial is a reusable component, not markup inlined into the hero.
- No unseeded `Math.random()` during render.

## Deferred work

Recorded here so it is not lost. To be done after the preloader is implemented
and tested:

1. Convert `public/images/landing/locations/*.png` and `parkschloessl.jpg` to
   WebP at 1024 px wide, q80, via a repeatable `scripts/` script using `cwebp`.
   Measured: 2154 KB → 82 KB at 1200 px q82; blocking payload 20.5 MB → ≈ 0.7 MB
   and the full 40-image pool 86 MB → ≈ 2.4 MB. The PNGs carry no alpha channel
   (`magick identify` reports `srgb`, 3 channels), so the lossless format buys
   nothing.
2. Decide whether the original PNGs should remain in `public/` once unused, as
   they are deployed with the build.
