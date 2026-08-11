# Hero Kaleidoscope Preloader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the blank hero square shown while the kaleidoscope's images load with an archival orbit dial, and make already-loaded images survive component unmount.

**Architecture:** The wheel keeps its blocking `await Promise.all(...)` gate — it must never appear without images. The individual texture promises become observable so a presentational dial component can show which of the twelve gallery slices have arrived. Texture caching moves out of `<script setup>` (per-instance, dies on unmount) into a module-scoped LRU cache whose policy is dependency-injected and therefore testable in plain Node.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, TypeScript, Tailwind CSS v4, GSAP, Three.js, `@nuxtjs/i18n`.

**Spec:** `docs/superpowers/specs/2026-08-11-hero-kaleidoscope-preloader-design.md`

## Global Constraints

- **The wheel must never render without its images.** The `await Promise.all(...)` gate in `onMounted` stays. Do not make the wheel render progressively.
- **Image optimisation is out of scope.** The ~2 MB location PNGs stay exactly as they are, deliberately, so the loading state is long enough to test on localhost. Do not convert, resize, or delete any image.
- **No `<style scoped>` and no CSS Modules.** Tailwind utilities go in templates; any genuinely required custom CSS rule goes in `app/assets/css/main.css`.
- **Structural marker groups require the inner spaces:** `[ kaleidoscope-loader ]` is correct, `[kaleidoscope-loader]` is prohibited. Markers own no CSS declarations and never appear in CSS selectors.
- **Legend copy is fixed:** `landing.hero.loadingLabel` is `Galerie` (de) / `Gallery` (en). `landing.hero.loadingProgress` is `{loaded} von {total} Galerien geladen` (de) / `{loaded} of {total} galleries loaded` (en).
- **LRU capacity is 24 textures.**
- **Timing constants are fixed:** 180 ms grace before the dial appears, 500 ms minimum visible, 120 ms hold after the last slice, 400 ms fade, intro starts 100 ms into the fade (300 ms overlap).
- **Every task must leave `pnpm check:tailwind`, `pnpm check:i18n`, and `pnpm build` passing.**
- **Reduced motion:** under `prefers-reduced-motion: reduce` the sweep does not rotate, ticks snap instead of fading, and the dismissal is instant.
- Run all commands from `frontend/` with pnpm. Work on branch `feature/hero-kaleidoscope-preloader`.
- **Use the pinned Node version.** Run `nvm use` in `frontend/` first; `.nvmrc` selects 24.11.1 and `engines.node` in `package.json` allows `>=24.11.1 <25`. The check scripts rely on Node's native TypeScript type-stripping to import `.ts` utils directly, which is on by default from Node 22.18 onward — verified working on 24.11.1. Do not upgrade the Node line as part of this work.

## File Structure

| File | Status | Responsibility |
| --- | --- | --- |
| `app/utils/romanNumerals.ts` | create | Pure integer → roman numeral conversion. No dependencies. |
| `app/utils/orbitGeometry.ts` | create | Shared orbit maths, moved out of `HeroKaleidoscope.vue`. No dependencies. |
| `app/utils/textureCache.ts` | create | Generic dependency-injected LRU cache with in-flight dedup. No Three.js import, so it is testable in Node. |
| `app/utils/kaleidoscopeTextures.ts` | create | Module-scoped singleton wiring `THREE.TextureLoader` into `textureCache`. Owns `prepareTexture` and the fallback texture. |
| `app/components/KaleidoscopeLoader.vue` | create | Presentational orbit dial. Props only; no Three.js knowledge. |
| `app/components/HeroKaleidoscope.vue` | modify | Orchestrates: tracks arrivals, keeps the gate, dismisses the dial, hands off to the intro. |
| `i18n/locales/en.json`, `i18n/locales/de.json` | modify | Two new keys under `landing.hero`. |
| `public/.htaccess` | modify | `Cache-Control` for `/images/`. |
| `scripts/check-kaleidoscope-preloader.mjs` | create | Executable assertions for the pure utils plus source-contract checks, in this project's existing check-script idiom. |
| `package.json` | modify | Register `check:preloader`. |

**Why `textureCache.ts` is split from `kaleidoscopeTextures.ts`** (a refinement on the spec, which named one file): `THREE.TextureLoader.loadAsync` needs a DOM `Image`, so anything importing Three.js cannot be executed by a Node check script. Splitting the *policy* (dedup, recency, eviction — where the bugs live) from the *Three.js wiring* makes the policy fully testable with an injected fake loader. The spec's public interface (`loadTexture`, `isTextureCached`, `getFallbackTexture`, `releaseTextureCache`) is unchanged and still lives in `kaleidoscopeTextures.ts`.

**Testing idiom:** this project has no test runner. `scripts/check-*.mjs` files build an array of `[label, boolean]` pairs, filter failures, print them, and set `process.exitCode = 1`. Node 26 strips TypeScript types natively, so a `.mjs` script can `import` a `.ts` util directly and assert on real behaviour — verified working. Follow that idiom exactly; do not add vitest or any other framework.

---

### Task 1: Roman numerals and the check-script harness

**Files:**
- Create: `app/utils/romanNumerals.ts`
- Create: `scripts/check-kaleidoscope-preloader.mjs`
- Modify: `package.json` (scripts block)

**Interfaces:**
- Consumes: nothing.
- Produces: `toRomanNumeral(value: number): string` — returns `''` for anything that is not an integer ≥ 1. Used by `KaleidoscopeLoader.vue` in Task 5. Also produces the check script that Tasks 2, 3, 5, and 6 extend.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-kaleidoscope-preloader.mjs`:

```js
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readProjectFile = (path) => readFile(resolve(projectRoot, path), 'utf8')

const { toRomanNumeral } = await import('../app/utils/romanNumerals.ts')

const checks = [
  ['roman numerals convert the single units', toRomanNumeral(1) === 'I' && toRomanNumeral(4) === 'IV' && toRomanNumeral(5) === 'V' && toRomanNumeral(9) === 'IX'],
  ['roman numerals convert the slice range used by the dial', toRomanNumeral(7) === 'VII' && toRomanNumeral(10) === 'X' && toRomanNumeral(12) === 'XII'],
  ['roman numerals reject zero, negatives, and non-integers', toRomanNumeral(0) === '' && toRomanNumeral(-3) === '' && toRomanNumeral(1.5) === '' && toRomanNumeral(Number.NaN) === '']
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Kaleidoscope preloader contract failed:')
  failures.forEach(([label]) => console.error(`  - ${label}`))
  process.exitCode = 1
} else {
  console.log(`Kaleidoscope preloader contract holds (${checks.length} checks).`)
}
```

Register it in `package.json` immediately after the `check:mobile` line:

```json
    "check:preloader": "node scripts/check-kaleidoscope-preloader.mjs",
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm check:preloader`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `app/utils/romanNumerals.ts`, because the file does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `app/utils/romanNumerals.ts`:

```ts
const ROMAN_UNITS: ReadonlyArray<readonly [number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
]

/**
 * Converts a positive integer to its roman numeral. Returns an empty string for
 * anything else, so callers can render a placeholder without guarding first.
 */
export function toRomanNumeral(value: number): string {
  if (!Number.isInteger(value) || value < 1) return ''

  let remaining = value
  let numeral = ''

  for (const [amount, symbol] of ROMAN_UNITS) {
    while (remaining >= amount) {
      numeral += symbol
      remaining -= amount
    }
  }

  return numeral
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm check:preloader`
Expected: PASS — `Kaleidoscope preloader contract holds (3 checks).`

- [ ] **Step 5: Commit**

```bash
git add app/utils/romanNumerals.ts scripts/check-kaleidoscope-preloader.mjs package.json
git commit -m "feat: add roman numeral helper and preloader check harness"
```

---

### Task 2: Extract orbit geometry

Moves the orbit maths out of `HeroKaleidoscope.vue` so the dial can draw the same arc without reaching into its parent's SVG `<defs>` by id. Pure refactor — the rendered hero must look identical afterwards.

**Files:**
- Create: `app/utils/orbitGeometry.ts`
- Modify: `app/components/HeroKaleidoscope.vue:17-36,117-166`
- Modify: `scripts/check-kaleidoscope-preloader.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces, all used by `KaleidoscopeLoader.vue` in Task 5:
  - `orbitRadius: number` (52)
  - `orbitStartAngle: number` (2), `orbitEndAngle: number` (28)
  - `orbitSegments: Array<{ id: number, rotation: number }>` (12 entries, rotation `index * 30`)
  - `pointOnOrbit(angleDegrees: number, radius?: number): { x: number, y: number }`
  - `describeOrbitArc(startAngle: number, endAngle: number): string`
  - `describeOrbitGradient(startAngle: number, endAngle: number): { x1: string, y1: string, x2: string, y2: string }`
  - `describeArrowHead(angleDegrees: number): string`

- [ ] **Step 1: Write the failing test**

In `scripts/check-kaleidoscope-preloader.mjs`, add the import below the existing one:

```js
const orbitGeometry = await import('../app/utils/orbitGeometry.ts')
const heroKaleidoscope = await readProjectFile('app/components/HeroKaleidoscope.vue')
```

Add these entries to the `checks` array:

```js
  ['orbit radius matches the hero orbit', orbitGeometry.orbitRadius === 52],
  ['orbit has twelve segments spaced thirty degrees apart', orbitGeometry.orbitSegments.length === 12 && orbitGeometry.orbitSegments[7].rotation === 210 && orbitGeometry.orbitSegments.every(({ id, rotation }) => rotation === id * 30)],
  ['zero degrees sits at the top of the orbit', Math.abs(orbitGeometry.pointOnOrbit(0).x - 50) < 1e-6 && Math.abs(orbitGeometry.pointOnOrbit(0).y - -2) < 1e-6],
  ['ninety degrees sits at the right of the orbit', Math.abs(orbitGeometry.pointOnOrbit(90).x - 102) < 1e-6 && Math.abs(orbitGeometry.pointOnOrbit(90).y - 50) < 1e-6],
  ['a custom radius is honoured', Math.abs(orbitGeometry.pointOnOrbit(0, 10).y - 40) < 1e-6],
  ['the orbit arc is a single short sweep', /^M [\d.]+ [\d.]+ A 52 52 0 0 1 [\d.]+ [\d.]+$/.test(orbitGeometry.describeOrbitArc(2, 28))],
  ['the arrow head is a three point polygon', orbitGeometry.describeArrowHead(28).split(' ').length === 3],
  ['the orbit gradient exposes both endpoints as strings', ['x1', 'y1', 'x2', 'y2'].every((key) => typeof orbitGeometry.describeOrbitGradient(2, 28)[key] === 'string')],
  ['HeroKaleidoscope imports the shared orbit geometry instead of defining it', heroKaleidoscope.includes("from '~/utils/orbitGeometry'") && !heroKaleidoscope.includes('function pointOnOrbit') && !heroKaleidoscope.includes('function describeOrbitArc') && !heroKaleidoscope.includes('function describeArrowHead') && !heroKaleidoscope.includes('const orbitRadius =')]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm check:preloader`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `app/utils/orbitGeometry.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `app/utils/orbitGeometry.ts`. This is a verbatim move of the existing functions from `HeroKaleidoscope.vue`; do not change any number or formula.

```ts
export const orbitRadius = 52
export const orbitStartAngle = 2
export const orbitEndAngle = 28
export const orbitSegments = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  rotation: index * 30
}))

export function pointOnOrbit(angleDegrees: number, radius = orbitRadius) {
  const radians = (angleDegrees - 90) * (Math.PI / 180)

  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians)
  }
}

export function describeOrbitArc(startAngle: number, endAngle: number) {
  const start = pointOnOrbit(startAngle)
  const end = pointOnOrbit(endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

  return [
    `M ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${orbitRadius} ${orbitRadius} 0 ${largeArcFlag} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`
  ].join(' ')
}

export function describeOrbitGradient(startAngle: number, endAngle: number) {
  const start = pointOnOrbit(startAngle)
  const end = pointOnOrbit(endAngle)

  return {
    x1: start.x.toFixed(3),
    y1: start.y.toFixed(3),
    x2: end.x.toFixed(3),
    y2: end.y.toFixed(3)
  }
}

export function describeArrowHead(angleDegrees: number) {
  const tip = pointOnOrbit(angleDegrees)
  const angle = angleDegrees * (Math.PI / 180)
  const tangent = { x: Math.cos(angle), y: Math.sin(angle) }
  const normal = { x: -tangent.y, y: tangent.x }
  const length = 0.78
  const halfWidth = 0.34
  const base = {
    x: tip.x - tangent.x * length,
    y: tip.y - tangent.y * length
  }

  return [
    `${tip.x.toFixed(3)},${tip.y.toFixed(3)}`,
    `${(base.x + normal.x * halfWidth).toFixed(3)},${(base.y + normal.y * halfWidth).toFixed(3)}`,
    `${(base.x - normal.x * halfWidth).toFixed(3)},${(base.y - normal.y * halfWidth).toFixed(3)}`
  ].join(' ')
}
```

In `app/components/HeroKaleidoscope.vue`, add the import beside the existing `three` import. Import exactly these six symbols and no more — `orbitRadius` and `pointOnOrbit` were only ever used by the functions being moved out, so importing them back would leave two unused bindings:

```ts
import {
  describeArrowHead,
  describeOrbitArc,
  describeOrbitGradient,
  orbitEndAngle,
  orbitSegments,
  orbitStartAngle
} from '~/utils/orbitGeometry'
```

Then delete these now-duplicated declarations from the component:
- `const orbitRadius = 52` (line 18)
- `const orbitStartAngle = 2` and `const orbitEndAngle = 28` (lines 32-33)
- `const orbitSegments = ...` (line 37)
- the whole `function pointOnOrbit`, `function describeOrbitArc`, `function describeOrbitGradient`, and `function describeArrowHead` bodies (lines 117-166)

Keep `const orbitArrowPath`, `const orbitArrowGradient`, `const orbitArrowHead`, and `const arrowRotationValues` exactly as they are — they now call the imported functions.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm check:preloader`
Expected: PASS — 12 checks.

Run: `pnpm build`
Expected: exit 0, `✔ Generated public .output/public`.

Run: `pnpm dev`, open `http://localhost:4991/`, wait for the wheel.
Expected: the hero looks exactly as before this task — twelve arrows draw in, twelve triangles unfold. This is a pure refactor. Stop the dev server afterwards.

- [ ] **Step 5: Commit**

```bash
git add app/utils/orbitGeometry.ts app/components/HeroKaleidoscope.vue scripts/check-kaleidoscope-preloader.mjs
git commit -m "refactor: extract shared orbit geometry from HeroKaleidoscope"
```

---

### Task 3: Dependency-injected texture cache

**Files:**
- Create: `app/utils/textureCache.ts`
- Modify: `scripts/check-kaleidoscope-preloader.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces `createTextureCache<T>(options): TextureCache<T>`, used by `kaleidoscopeTextures.ts` in Task 4.
  - `options: { load: (url: string) => Promise<T>, dispose: (value: T) => void, capacity: number }`
  - returns `{ get(url: string): Promise<T>, has(url: string): boolean, size(): number, clear(): void }`

- [ ] **Step 1: Write the failing test**

In `scripts/check-kaleidoscope-preloader.mjs`, add the import:

```js
const { createTextureCache } = await import('../app/utils/textureCache.ts')
```

Add this block above the `checks` array — it exercises the cache asynchronously, so it must run before the array is built:

```js
const cacheProbe = await (async () => {
  const calls = []
  const disposed = []
  const deferred = new Map()

  const instant = createTextureCache({
    capacity: 2,
    load: (url) => { calls.push(url); return Promise.resolve(`texture:${url}`) },
    dispose: (value) => disposed.push(value)
  })

  const first = await instant.get('a')
  const second = await instant.get('a')
  const cachesRepeatLoads = calls.length === 1 && first === 'texture:a' && second === 'texture:a'

  const gated = createTextureCache({
    capacity: 8,
    load: (url) => new Promise((resolvePromise) => deferred.set(url, resolvePromise)),
    dispose: () => {}
  })
  const concurrent = Promise.all([gated.get('b'), gated.get('b')])
  const pendingCount = deferred.size
  deferred.get('b')('texture:b')
  const [left, right] = await concurrent
  const dedupesInFlightLoads = pendingCount === 1 && left === 'texture:b' && right === 'texture:b'

  await instant.get('b')
  await instant.get('a')
  await instant.get('c')
  const evictsLeastRecentlyUsed = disposed.length === 1 && disposed[0] === 'texture:b'
    && instant.has('a') && instant.has('c') && !instant.has('b') && instant.size() === 2

  let attempts = 0
  const flaky = createTextureCache({
    capacity: 4,
    load: () => {
      attempts += 1
      return attempts === 1 ? Promise.reject(new Error('boom')) : Promise.resolve('texture:d')
    },
    dispose: () => {}
  })
  await flaky.get('d').catch(() => {})
  const recovered = await flaky.get('d')
  const failedLoadsDoNotPoison = attempts === 2 && recovered === 'texture:d'

  const clearing = createTextureCache({
    capacity: 4,
    load: (url) => Promise.resolve(`texture:${url}`),
    dispose: (value) => disposed.push(value)
  })
  await clearing.get('e')
  clearing.clear()
  const clearDisposesEverything = disposed.includes('texture:e') && clearing.size() === 0 && !clearing.has('e')

  return {
    cachesRepeatLoads,
    dedupesInFlightLoads,
    evictsLeastRecentlyUsed,
    failedLoadsDoNotPoison,
    clearDisposesEverything
  }
})()
```

Add these entries to the `checks` array:

```js
  ['texture cache serves a repeated url without loading twice', cacheProbe.cachesRepeatLoads],
  ['texture cache shares one request between concurrent callers', cacheProbe.dedupesInFlightLoads],
  ['texture cache evicts the least recently used entry and disposes it', cacheProbe.evictsLeastRecentlyUsed],
  ['a failed load is not cached and can be retried', cacheProbe.failedLoadsDoNotPoison],
  ['clearing the cache disposes every retained texture', cacheProbe.clearDisposesEverything]
```

The eviction check is the important one: it reads `b`, then re-reads `a` to make `a` the most recent, then adds `c`. With capacity 2 the entry evicted must be `b`. If the implementation ignores recency on read, `a` gets evicted instead and this fails.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm check:preloader`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `app/utils/textureCache.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `app/utils/textureCache.ts`:

```ts
export type TextureCacheOptions<T> = {
  /** Fetches a value that is not cached yet. */
  load: (url: string) => Promise<T>
  /** Releases a value the cache is dropping. */
  dispose: (value: T) => void
  /** Maximum retained entries. In-flight requests are not counted. */
  capacity: number
}

export type TextureCache<T> = {
  get: (url: string) => Promise<T>
  has: (url: string) => boolean
  size: () => number
  clear: () => void
}

/**
 * A least-recently-used cache with in-flight request sharing.
 *
 * Loading and disposal are injected so the policy carries no renderer
 * dependency and can be exercised outside a browser.
 */
export function createTextureCache<T>({ load, dispose, capacity }: TextureCacheOptions<T>): TextureCache<T> {
  // Map preserves insertion order, so the first key is always the least
  // recently used once reads re-insert their entry.
  const entries = new Map<string, T>()
  const pending = new Map<string, Promise<T>>()

  function evictOverflow() {
    while (entries.size > capacity) {
      const oldest = entries.keys().next()
      if (oldest.done) return

      const value = entries.get(oldest.value) as T
      entries.delete(oldest.value)
      dispose(value)
    }
  }

  return {
    get(url) {
      if (entries.has(url)) {
        const value = entries.get(url) as T
        entries.delete(url)
        entries.set(url, value)
        return Promise.resolve(value)
      }

      const inFlight = pending.get(url)
      if (inFlight) return inFlight

      const request = load(url)
        .then((value) => {
          pending.delete(url)
          entries.set(url, value)
          evictOverflow()
          return value
        })
        .catch((error) => {
          pending.delete(url)
          throw error
        })

      pending.set(url, request)
      return request
    },
    has: (url) => entries.has(url),
    size: () => entries.size,
    clear() {
      entries.forEach((value) => dispose(value))
      entries.clear()
      pending.clear()
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm check:preloader`
Expected: PASS — 17 checks.

- [ ] **Step 5: Commit**

```bash
git add app/utils/textureCache.ts scripts/check-kaleidoscope-preloader.mjs
git commit -m "feat: add dependency-injected LRU texture cache"
```

---

### Task 4: Module-scoped texture cache in the hero, plus HTTP caching

Makes loaded images survive component unmount, which is the caching half of the request.

**Files:**
- Create: `app/utils/kaleidoscopeTextures.ts`
- Modify: `app/components/HeroKaleidoscope.vue:93,106-107,201-234,418,476-492,1016-1027`
- Modify: `public/.htaccess`
- Modify: `scripts/check-kaleidoscope-preloader.mjs`

**Interfaces:**
- Consumes: `createTextureCache` from Task 3.
- Produces, used by `HeroKaleidoscope.vue` in this task and Task 6:
  - `loadTexture(url: string): Promise<THREE.Texture>`
  - `isTextureCached(url: string): boolean`
  - `getFallbackTexture(): THREE.Texture`
  - `releaseTextureCache(): void`

- [ ] **Step 1: Write the failing test**

In `scripts/check-kaleidoscope-preloader.mjs`, add:

```js
const kaleidoscopeTextures = await readProjectFile('app/utils/kaleidoscopeTextures.ts')
const htaccess = await readProjectFile('public/.htaccess')
```

Add these entries to the `checks` array:

```js
  ['the texture cache lives at module scope and is built from the shared policy', kaleidoscopeTextures.includes("from '~/utils/textureCache'") && /createTextureCache<THREE\.Texture>\(/.test(kaleidoscopeTextures) && kaleidoscopeTextures.includes('capacity: 24')],
  ['the texture module exposes the loading interface the hero needs', ['export function loadTexture', 'export function isTextureCached', 'export function getFallbackTexture', 'export function releaseTextureCache'].every((signature) => kaleidoscopeTextures.includes(signature))],
  ['cached textures keep the hero colour space and filtering', ['SRGBColorSpace', 'ClampToEdgeWrapping', 'LinearMipmapLinearFilter', 'LinearFilter'].every((setting) => kaleidoscopeTextures.includes(setting))],
  ['HeroKaleidoscope no longer owns a per-instance texture cache', heroKaleidoscope.includes("from '~/utils/kaleidoscopeTextures'") && !heroKaleidoscope.includes('const textureCache = new Map') && !heroKaleidoscope.includes('const texturePromises = new Map') && !heroKaleidoscope.includes('textureCache.clear()')],
  ['HeroKaleidoscope stops disposing textures it no longer owns', !heroKaleidoscope.includes('disposableTextures.forEach') && !heroKaleidoscope.includes('const disposableTextures')],
  ['HeroKaleidoscope still disposes the geometries and materials it does own', heroKaleidoscope.includes('disposableGeometries.forEach((geometry) => geometry.dispose())') && heroKaleidoscope.includes('disposableMaterials.forEach((material) => material.dispose())')],
  ['the loading sprite texture is disposed with the component that created it', heroKaleidoscope.includes('loadingIconTexture?.dispose()')],
  ['images are served with a long lived cache header', /Cache-Control.*max-age=2592000/.test(htaccess) && htaccess.includes('mod_headers')]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm check:preloader`
Expected: FAIL — `ENOENT` for `app/utils/kaleidoscopeTextures.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `app/utils/kaleidoscopeTextures.ts`:

```ts
import * as THREE from 'three'
import { createTextureCache } from '~/utils/textureCache'

// Twelve visible slices plus a full replay's worth of replacements.
const TEXTURE_CAPACITY = 24

let textureLoader: THREE.TextureLoader | null = null
let fallbackTexture: THREE.Texture | null = null

function prepareTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter

  return texture
}

const cache = createTextureCache<THREE.Texture>({
  capacity: TEXTURE_CAPACITY,
  load: (url) => {
    textureLoader ??= new THREE.TextureLoader()
    return textureLoader.loadAsync(url).then(prepareTexture)
  },
  dispose: (texture) => texture.dispose()
})

/**
 * Resolves a prepared texture, reusing the module-scoped cache so images
 * survive hero unmount and remounts across client-side navigation.
 */
export function loadTexture(url: string) {
  return cache.get(url)
}

export function isTextureCached(url: string) {
  return cache.has(url)
}

/** A transparent stand-in so one failed image cannot stall the wheel. */
export function getFallbackTexture(): THREE.Texture {
  if (fallbackTexture) return fallbackTexture

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  fallbackTexture = new THREE.CanvasTexture(canvas)
  fallbackTexture.colorSpace = THREE.SRGBColorSpace

  return fallbackTexture
}

/** Test and teardown hook. Production code should let the cache persist. */
export function releaseTextureCache() {
  cache.clear()
  fallbackTexture?.dispose()
  fallbackTexture = null
  textureLoader = null
}
```

In `app/components/HeroKaleidoscope.vue`:

1. Add the import beside the others. `getFallbackTexture` is deliberately not imported yet — Task 6 adds it, at the point where it is first used:

```ts
import { isTextureCached, loadTexture } from '~/utils/kaleidoscopeTextures'
```

2. Delete `let textureLoader: THREE.TextureLoader | null = null` (line 93), `const disposableTextures: THREE.Texture[] = []` (line 105), `const texturePromises = new Map<string, Promise<THREE.Texture>>()` (line 106) and `const textureCache = new Map<string, THREE.Texture>()` (line 107).

3. Delete the local `function prepareTexture` and `function loadTexture` entirely (lines 201-234). The imported `loadTexture` replaces them.

4. In `createLoadingIconTexture`, remove the `disposableTextures.push(texture)` line and keep the rest. Store the result so it can be disposed: change the `onMounted` line `const loadingIconTexture = createLoadingIconTexture()` to assign to a module-level `let loadingIconTexture: THREE.CanvasTexture | null = null` declared beside the other `let` bindings, i.e. `loadingIconTexture = createLoadingIconTexture()`.

5. In `assignSliceTexture` (line 418), replace `const cachedTexture = textureCache.get(url)` / `if (cachedTexture)` with:

```ts
  if (isTextureCached(url)) {
    const cachedTexture = await loadTexture(url)
    if (sliceLoadingTokens[index] !== token) return

    animateTextureSwap(index, cachedTexture, url, token, shouldAnimate)
    return
  }
```

This keeps the fast path for an already-cached image while going through one interface.

6. In `randomizeSliceTextures` (line 442), replace `textureCache.has(url)` with `isTextureCached(url)`.

7. Delete `textureLoader = new THREE.TextureLoader()` from `onMounted`.

8. In `onBeforeUnmount`, delete `disposableTextures.forEach((texture) => texture.dispose())`, `texturePromises.clear()`, `textureCache.clear()`, and `textureLoader = null`. Add `loadingIconTexture?.dispose()` and `loadingIconTexture = null`. Everything else there stays.

In `public/.htaccess`, add above the existing `<IfModule mod_rewrite.c>` block:

```apache
<IfModule mod_headers.c>
  # public/ filenames are not content hashed by nuxt generate, so this is a
  # deliberate month rather than a year. Rename an image to bust it sooner.
  <FilesMatch "\.(?:avif|gif|ico|jpe?g|png|svg|webp)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
</IfModule>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm check:preloader`
Expected: PASS — 25 checks.

Run: `pnpm build`
Expected: exit 0.

Run: `pnpm dev` and open `http://localhost:4991/`. Wait for the wheel, then navigate to Locations and back to the landing page.
Expected: on returning, the wheel appears far faster than on first load, because the textures were retained. Watch the Network tab — the location images should not be re-requested. Stop the dev server afterwards.

- [ ] **Step 5: Commit**

```bash
git add app/utils/kaleidoscopeTextures.ts app/components/HeroKaleidoscope.vue public/.htaccess scripts/check-kaleidoscope-preloader.mjs
git commit -m "feat: cache kaleidoscope textures beyond component lifetime"
```

---

### Task 5: The orbit dial component

**Files:**
- Create: `app/components/KaleidoscopeLoader.vue`
- Modify: `i18n/locales/en.json`, `i18n/locales/de.json`
- Modify: `scripts/check-kaleidoscope-preloader.mjs`

**Interfaces:**
- Consumes: `toRomanNumeral` from Task 1; `describeArrowHead`, `describeOrbitArc`, `orbitEndAngle`, `orbitRadius`, `orbitSegments`, `orbitStartAngle`, `pointOnOrbit` from Task 2.
- Produces the component used by `HeroKaleidoscope.vue` in Task 6, with props:
  - `readySlices: boolean[]` — one entry per wheel position, `true` once that slice's texture has settled
  - `total: number` — slice count, 12
  - `dismissing?: boolean` — when true the dial fades out

- [ ] **Step 1: Write the failing test**

In `scripts/check-kaleidoscope-preloader.mjs`, add:

```js
const kaleidoscopeLoader = await readProjectFile('app/components/KaleidoscopeLoader.vue')
const enMessages = JSON.parse(await readProjectFile('i18n/locales/en.json'))
const deMessages = JSON.parse(await readProjectFile('i18n/locales/de.json'))
```

Add these entries to the `checks` array:

```js
  ['the dial reports progress to assistive technology', kaleidoscopeLoader.includes('role="progressbar"') && kaleidoscopeLoader.includes(':aria-valuenow="loadedCount"') && kaleidoscopeLoader.includes(':aria-valuemax="props.total"') && kaleidoscopeLoader.includes(':aria-valuetext="progressText"')],
  ['the dial derives its count from the ready slices rather than a second counter', kaleidoscopeLoader.includes('props.readySlices.filter(Boolean).length') && !kaleidoscopeLoader.includes('loadedCount.value =')],
  ['the dial reuses the shared orbit geometry and roman numerals', kaleidoscopeLoader.includes("from '~/utils/orbitGeometry'") && kaleidoscopeLoader.includes("from '~/utils/romanNumerals'")],
  ['the dial does not reach into the hero SVG defs by id', !kaleidoscopeLoader.includes('#hero-orbit-arrow-line') && !kaleidoscopeLoader.includes('#hero-orbit-arrow-head')],
  ['the dial draws one tick per wheel position', kaleidoscopeLoader.includes('v-for="tick in ticks"') && kaleidoscopeLoader.includes('orbitSegments.map')],
  ['ticks ink in for slices that have arrived', /props\.readySlices\[tick\.id\]\s*\?\s*'opacity-70'\s*:\s*'opacity-15'/.test(kaleidoscopeLoader)],
  ['the dial honours reduced motion for the sweep and the ticks', kaleidoscopeLoader.includes("matchMedia('(prefers-reduced-motion: reduce)')") && kaleidoscopeLoader.includes('motion-reduce:transition-none')],
  ['the dial kills its sweep on unmount', kaleidoscopeLoader.includes('onBeforeUnmount') && kaleidoscopeLoader.includes('sweepTween?.kill()')],
  ['the dial uses a spaced structural marker and no scoped styles', kaleidoscopeLoader.includes('[ kaleidoscope-loader ]') && !kaleidoscopeLoader.includes('[kaleidoscope-loader]') && !kaleidoscopeLoader.includes('<style')],
  ['the dial is inert to pointer input', kaleidoscopeLoader.includes('pointer-events-none')],
  ['loading copy names galleries in both locales', enMessages.landing.hero.loadingLabel === 'Gallery' && deMessages.landing.hero.loadingLabel === 'Galerie'],
  ['loading progress copy interpolates both counts in both locales', ['{loaded}', '{total}'].every((token) => enMessages.landing.hero.loadingProgress.includes(token) && deMessages.landing.hero.loadingProgress.includes(token))]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm check:preloader`
Expected: FAIL — `ENOENT` for `app/components/KaleidoscopeLoader.vue`.

- [ ] **Step 3: Write minimal implementation**

Add to `i18n/locales/en.json`, inside `landing.hero`, after `"wheelAria"`:

```json
      "loadingLabel": "Gallery",
      "loadingProgress": "{loaded} of {total} galleries loaded",
```

Add to `i18n/locales/de.json`, inside `landing.hero`, in the same position:

```json
      "loadingLabel": "Galerie",
      "loadingProgress": "{loaded} von {total} Galerien geladen",
```

Create `app/components/KaleidoscopeLoader.vue`:

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import {
  describeArrowHead,
  describeOrbitArc,
  orbitEndAngle,
  orbitRadius,
  orbitSegments,
  orbitStartAngle,
  pointOnOrbit
} from '~/utils/orbitGeometry'
import { toRomanNumeral } from '~/utils/romanNumerals'

const props = defineProps<{
  readySlices: boolean[]
  total: number
  dismissing?: boolean
}>()
const { t } = useI18n()

const sweepRef = ref<SVGGElement | null>(null)
const loadedCount = computed(() => props.readySlices.filter(Boolean).length)
const progressText = computed(() => t('landing.hero.loadingProgress', {
  loaded: loadedCount.value,
  total: props.total
}))
// An em dash stands in until the first gallery lands, so the legend never
// collapses to an empty line.
const loadedNumeral = computed(() => toRomanNumeral(loadedCount.value) || '—')
const totalNumeral = computed(() => toRomanNumeral(props.total))
const sweepArc = describeOrbitArc(orbitStartAngle, orbitEndAngle)
const sweepHead = describeArrowHead(orbitEndAngle)
const tickReach = 2.6
const ticks = orbitSegments.map((segment) => {
  const inner = pointOnOrbit(segment.rotation, orbitRadius - tickReach)
  const outer = pointOnOrbit(segment.rotation, orbitRadius + tickReach)

  return {
    id: segment.id,
    x1: inner.x.toFixed(3),
    y1: inner.y.toFixed(3),
    x2: outer.x.toFixed(3),
    y2: outer.y.toFixed(3)
  }
})

let sweepTween: gsap.core.Tween | null = null

onMounted(() => {
  const sweep = sweepRef.value
  if (!sweep) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const rotation = { value: 0 }

  // The lone arrow keeps the dial alive while a single large image stalls, so
  // the discrete ticks can stay honest about actual progress.
  sweepTween = gsap.to(rotation, {
    value: 360,
    duration: 9,
    ease: 'none',
    repeat: -1,
    onUpdate: () => sweep.setAttribute('transform', `rotate(${rotation.value} 50 50)`)
  })
})

onBeforeUnmount(() => {
  sweepTween?.kill()
  sweepTween = null
})
</script>

<template>
  <div
    class="[ kaleidoscope-loader ] pointer-events-none absolute inset-0 z-4 grid place-items-center transition-opacity duration-400 ease-out motion-reduce:transition-none"
    :class="props.dismissing ? 'opacity-0' : 'opacity-100'"
    role="progressbar"
    :aria-label="t('landing.hero.loadingLabel')"
    :aria-valuemin="0"
    :aria-valuemax="props.total"
    :aria-valuenow="loadedCount"
    :aria-valuetext="progressText"
  >
    <svg
      class="absolute inset-[-2%] size-[104%] overflow-visible text-archive-red"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <circle
        class="fill-none stroke-current opacity-15"
        cx="50"
        cy="50"
        :r.attr="orbitRadius"
        stroke-width="0.18"
      />
      <line
        v-for="tick in ticks"
        :key="tick.id"
        class="stroke-current transition-opacity duration-500 ease-out motion-reduce:transition-none"
        :class="props.readySlices[tick.id] ? 'opacity-70' : 'opacity-15'"
        :x1.attr="tick.x1"
        :y1.attr="tick.y1"
        :x2.attr="tick.x2"
        :y2.attr="tick.y2"
        stroke-width="0.42"
        stroke-linecap="round"
      />
      <g ref="sweepRef" class="opacity-60">
        <path
          class="fill-none stroke-current"
          :d="sweepArc"
          stroke-width="0.18"
          stroke-linecap="round"
        />
        <polygon class="fill-current" :points.attr="sweepHead" />
      </g>
    </svg>

    <p class="relative grid justify-items-center gap-[0.4rem] text-center font-display">
      <span class="text-[0.68rem] tracking-[0.34em] text-archive-muted uppercase compact:text-[0.6rem]">{{ t('landing.hero.loadingLabel') }}</span>
      <span class="text-[1.35rem] tracking-[0.16em] text-archive-red compact:text-lg">{{ loadedNumeral }}<span class="text-archive-muted"> — </span>{{ totalNumeral }}</span>
    </p>
  </div>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm check:preloader`
Expected: PASS — 37 checks.

Run: `pnpm check:i18n`
Expected: PASS. This verifies the two new keys exist in both locales with matching structure.

Run: `pnpm check:tailwind`
Expected: PASS. If it reports a bracketed candidate with a canonical equivalent, replace that class with the canonical form it names and re-run.

Run: `pnpm build`
Expected: exit 0. The component is not yet rendered anywhere, so the hero is unchanged.

- [ ] **Step 5: Commit**

```bash
git add app/components/KaleidoscopeLoader.vue i18n/locales/en.json i18n/locales/de.json scripts/check-kaleidoscope-preloader.mjs
git commit -m "feat: add archival orbit dial for the hero loading state"
```

---

### Task 6: Wire the dial into the hero

**Files:**
- Modify: `app/components/HeroKaleidoscope.vue` (script setup and template)
- Modify: `scripts/check-kaleidoscope-preloader.mjs`

**Interfaces:**
- Consumes: `KaleidoscopeLoader` from Task 5 (auto-imported by Nuxt, no import statement needed); `getFallbackTexture` and `loadTexture` from Task 4.
- Produces: no new public interface. The component's existing `defineExpose({ rotateBy, replayIntro })` and its two emits are unchanged.

- [ ] **Step 1: Write the failing test**

Add these entries to the `checks` array in `scripts/check-kaleidoscope-preloader.mjs`:

```js
  ['the hero still gates the wheel on every texture', /const textures = await Promise\.all\(/.test(heroKaleidoscope)],
  ['a failed image resolves to the fallback so the gate cannot hang', heroKaleidoscope.includes('getFallbackTexture()') && /\.catch\(\(error\) => \{[\s\S]*?return getFallbackTexture\(\)/.test(heroKaleidoscope)],
  ['each texture marks its own slice ready as it settles', heroKaleidoscope.includes('.finally(') && heroKaleidoscope.includes('markSliceReady(index)')],
  ['marking a slice ready avoids Array.prototype.with', heroKaleidoscope.includes('function markSliceReady') && !heroKaleidoscope.includes('.with(index, true)')],
  ['slice readiness is the single source of progress truth', heroKaleidoscope.includes('const readySlices = ref<boolean[]>') && !heroKaleidoscope.includes('const loadedCount = ref')],
  ['late promise callbacks cannot write to an unmounted component', heroKaleidoscope.includes('let isActive = true') && heroKaleidoscope.includes('isActive = false') && /if \(!isActive\) return/.test(heroKaleidoscope)],
  ['the dial is rendered while loading and receives the slice state', heroKaleidoscope.includes('<KaleidoscopeLoader') && heroKaleidoscope.includes('v-if="isLoaderVisible"') && heroKaleidoscope.includes(':ready-slices="readySlices"') && heroKaleidoscope.includes(':dismissing="isLoaderDismissing"')],
  ['the dial waits out a grace period and a minimum visible time', heroKaleidoscope.includes('LOADER_GRACE_MS = 180') && heroKaleidoscope.includes('LOADER_MIN_VISIBLE_MS = 500') && heroKaleidoscope.includes('LOADER_HOLD_MS = 120') && heroKaleidoscope.includes('LOADER_FADE_MS = 400')],
  ['the intro overlaps the dial fade rather than following it', heroKaleidoscope.includes('createIntroTimeline(LOADER_INTRO_OVERLAP_SECONDS)')],
  ['the grace timer is cleared on unmount', heroKaleidoscope.includes('window.clearTimeout(loaderGraceTimer)')]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm check:preloader`
Expected: FAIL with ten failures listed, all about `HeroKaleidoscope.vue`.

- [ ] **Step 3: Write minimal implementation**

In `app/components/HeroKaleidoscope.vue`, add `getFallbackTexture` to the `~/utils/kaleidoscopeTextures` import.

Add these constants beside the other config objects near the top of the script:

```ts
const sliceCount = 12
const LOADER_GRACE_MS = 180
const LOADER_MIN_VISIBLE_MS = 500
const LOADER_HOLD_MS = 120
const LOADER_FADE_MS = 400
// The intro begins 100ms into the 400ms fade, leaving 300ms of overlap so the
// dial's ring dissolves into the arrows drawing along the same orbit.
const LOADER_INTRO_OVERLAP_SECONDS = 0.1
```

Add these reactive bindings beside `containerRef` and `canvasRef`:

```ts
const readySlices = ref<boolean[]>(Array.from({ length: sliceCount }, () => false))
const isLoaderVisible = ref(false)
const isLoaderDismissing = ref(false)
```

Add these mutable bindings beside the other `let` declarations:

```ts
let isActive = true
let loaderShownAt = 0
let loaderGraceTimer = 0
```

Add these functions above `onMounted`. `markSliceReady` deliberately builds a new array by spreading rather than calling `Array.prototype.with`: `.with` is unavailable before Safari 16.4, and because it runs inside `.finally()` — which sits *after* the `.catch()` in the chain — a `TypeError` there would reject the whole `Promise.all`, throw out of `onMounted`, and leave the hero permanently blank. That is precisely the failure this work exists to eliminate, so it must not be reintroduced by a syntax convenience:

```ts
function markSliceReady(index: number) {
  const next = [...readySlices.value]
  next[index] = true
  readySlices.value = next
}

function dismissLoader() {
  window.clearTimeout(loaderGraceTimer)

  if (!isLoaderVisible.value) {
    createIntroTimeline(LOADER_INTRO_OVERLAP_SECONDS)
    return
  }

  const visibleFor = performance.now() - loaderShownAt
  const wait = Math.max(0, LOADER_MIN_VISIBLE_MS - visibleFor) + LOADER_HOLD_MS

  window.setTimeout(() => {
    if (!isActive) return

    isLoaderDismissing.value = true
    createIntroTimeline(LOADER_INTRO_OVERLAP_SECONDS)

    window.setTimeout(() => {
      if (!isActive) return
      isLoaderVisible.value = false
    }, LOADER_FADE_MS)
  }, wait)
}
```

In `onMounted`, immediately after `setAnimationActive(true)`, start the grace timer:

```ts
  loaderGraceTimer = window.setTimeout(() => {
    if (!isActive) return

    isLoaderVisible.value = true
    loaderShownAt = performance.now()
  }, LOADER_GRACE_MS)
```

Replace the texture loading block with:

```ts
  const sourceImages = props.images.length ? props.images : ['/images/landing/parkschloessl.jpg']
  const textures = await Promise.all(
    Array.from({ length: sliceCount }, (_, index) => {
      const url = sourceImages[index % sourceImages.length]!

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

Replace the final `createIntroTimeline()` call at the end of `onMounted` with `dismissLoader()`. Leave `scheduleBackgroundPreload()` after it, unchanged.

In `onBeforeUnmount`, add as the first two statements:

```ts
  isActive = false
  window.clearTimeout(loaderGraceTimer)
```

In the template, add the dial as the last child of the `.hero-kaleidoscope` container, after the orbit `<svg>`:

```vue
    <KaleidoscopeLoader
      v-if="isLoaderVisible"
      :ready-slices="readySlices"
      :total="sliceCount"
      :dismissing="isLoaderDismissing"
    />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm check:preloader`
Expected: PASS — 47 checks.

Run: `pnpm check:tailwind && pnpm check:i18n && pnpm check:mobile`
Expected: all PASS.

Run: `pnpm build`
Expected: exit 0.

Run: `pnpm dev` and open `http://localhost:4991/` with an empty cache (DevTools → Network → Disable cache, then hard reload).
Expected, in order: the square stays empty for a beat, the dial fades in with twelve faint ticks and one arrow sweeping, ticks ink in one by one as the ~2 MB PNGs land, the count climbs `I — XII` … `XII — XII`, then the dial fades as the arrows draw over the same ring and the triangles unfold. The wheel is never visible without its images at any point. Stop the dev server afterwards.

- [ ] **Step 5: Commit**

```bash
git add app/components/HeroKaleidoscope.vue scripts/check-kaleidoscope-preloader.mjs
git commit -m "feat: show the orbit dial while hero galleries load"
```

---

### Task 7: Full manual verification

No code changes unless a check fails. This task exists because the states that matter most — reduced motion, a failed image, a warm cache — cannot be asserted by a static check script.

**Files:**
- Modify: only files needed to fix a defect found here.

**Interfaces:**
- Consumes: everything from Tasks 1-6.
- Produces: nothing.

- [ ] **Step 1: Run the whole automated suite**

```bash
pnpm check:preloader && pnpm check:tailwind && pnpm check:i18n && pnpm check:directories && pnpm check:artists && pnpm check:links && pnpm check:locations && pnpm check:mobile && pnpm build
```

Expected: every command exits 0.

- [ ] **Step 2: Verify the cold load**

Run `pnpm dev`. In DevTools, tick Network → Disable cache, then hard reload `http://localhost:4991/`.

Expected:
- nothing appears for roughly 180 ms, then the dial fades in;
- twelve ticks sit on the ring, faint, with one arrow sweeping continuously;
- ticks ink in as galleries land, not all at once;
- the numeral line climbs and reaches `XII — XII`;
- the dial fades while the intro arrows draw along the same ring;
- **the wheel never appears without images.**

- [ ] **Step 3: Verify the warm cache and the anti-flash rule**

With the dev server still running and Disable cache switched **off**, navigate to Locations, then back to the landing page. Repeat twice.

Expected: the wheel returns quickly and the dial either does not appear at all or appears for a clearly deliberate moment — never a single-frame flash. Confirm in the Network tab that the location images are not re-requested.

- [ ] **Step 4: Verify reduced motion**

In DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion`, select `reduce`. Hard reload with cache disabled.

Expected: the dial appears, the arrow does **not** rotate, ticks snap on rather than fading, and the dial disappears without a fade. The wheel still appears only once loading completes.

- [ ] **Step 5: Verify a failed image**

In DevTools → Network → add a request blocking pattern for `*location_03*`, then hard reload with cache disabled.

Expected: a console warning naming the blocked URL; that slice's tick still inks in; the count still reaches `XII — XII`; **the wheel still appears** with one transparent slice. Before this work the same condition left the hero blank forever. Remove the blocking rule afterwards.

- [ ] **Step 6: Verify accessibility**

With the dial visible, inspect its root element.

Expected: `role="progressbar"` with `aria-valuenow` incrementing, `aria-valuemax="12"`, and `aria-valuetext` reading `7 of 12 galleries loaded`. Switch to `/en/` and back to `/` and confirm the German text reads `7 von 12 Galerien geladen`.

- [ ] **Step 7: Commit any fixes**

If Steps 1-6 required no changes, skip this step. Otherwise:

```bash
git add -A
git commit -m "fix: address preloader verification findings"
```

---

## Deferred to a follow-up

Recorded in the spec, out of scope here: converting the location PNGs to WebP (measured 2154 KB → 82 KB, blocking payload 20.5 MB → ~0.7 MB), and deciding whether the originals should remain in `public/`.

## Closeout

The `fin-patch` rule in `AGENTS.md` owns version bumps, the changelog entry, and release commits. Do not bump the version or write a changelog entry as part of these tasks — wait for the user to ask.
