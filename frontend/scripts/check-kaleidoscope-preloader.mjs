import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readProjectFile = (path) => readFile(resolve(projectRoot, path), 'utf8')

// Extracts a top-level function's full source (brace-matched, not regex-truncated) so
// checks can assert on what a function actually does rather than on stray text anywhere
// in the file.
function extractFunctionSource(source, functionName) {
  const marker = `function ${functionName}(`
  const start = source.indexOf(marker)
  if (start === -1) return ''

  const braceStart = source.indexOf('{', start)
  if (braceStart === -1) return ''

  let depth = 0
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    else if (source[index] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }

  return source.slice(start)
}

const heroKaleidoscope = await readProjectFile('app/components/HeroKaleidoscope.vue')
const kaleidoscopeTextures = await readProjectFile('app/utils/kaleidoscopeTextures.ts')
const kaleidoscopeLoader = await readProjectFile('app/components/KaleidoscopeLoader.vue')
const preloadTexturePoolSource = extractFunctionSource(heroKaleidoscope, 'preloadTexturePool')
const rotateBySource = extractFunctionSource(heroKaleidoscope, 'rotateBy')
const restartIntroSource = extractFunctionSource(heroKaleidoscope, 'restartIntroWithNewImages')

// The wheel's load-bearing rules (frontend/AGENTS.md "Current Frontend Implementation"): what the
// code alone would mislead a refactor about. Behaviour of the helpers: test/unit/{romanNumerals,
// orbitGeometry,textureCache}.spec.ts; the loading dial: test/nuxt/KaleidoscopeLoader.spec.ts.
const checks = [
  ['the texture cache lives at module scope and is built from the shared policy', kaleidoscopeTextures.includes("from '~/utils/textureCache'") && /createTextureCache<THREE\.Texture>\(/.test(kaleidoscopeTextures) && /const TEXTURE_CAPACITY = 24\b/.test(kaleidoscopeTextures) && kaleidoscopeTextures.includes('capacity: TEXTURE_CAPACITY')],
  ['the texture module exposes the loading interface the hero needs', ['export function loadTexture', 'export function isTextureCached', 'export function getFallbackTexture', 'export function releaseTextureCache'].every((signature) => kaleidoscopeTextures.includes(signature))],
  ['cached textures keep the hero colour space and filtering', ['SRGBColorSpace', 'ClampToEdgeWrapping', 'LinearMipmapLinearFilter', 'LinearFilter'].every((setting) => kaleidoscopeTextures.includes(setting))],
  ['HeroKaleidoscope still disposes the geometries and materials it does own', heroKaleidoscope.includes('disposableGeometries.forEach((geometry) => geometry.dispose())') && heroKaleidoscope.includes('disposableMaterials.forEach((material) => material.dispose())')],
  ['the loading sprite texture is disposed with the component that created it', heroKaleidoscope.includes('loadingIconTexture?.dispose()')],
  ['background preload is capped to one rotation instead of walking the whole pool', /const preloadBatchSize = 12\b/.test(heroKaleidoscope) && /if\s*\([^)]*(>=|>)\s*preloadBatchSize[^)]*\)\s*return/.test(preloadTexturePoolSource)],
  ['the dial honours reduced motion on every transition it runs', (kaleidoscopeLoader.match(/transition-/g) ?? []).length === (kaleidoscopeLoader.match(/motion-reduce:transition-none/g) ?? []).length * 2],
  ['fan previews support cursor tracking, focus, dismissal, and two-tap touch activation', ['@pointerenter="handleBladePointerEnter', '@pointermove="handleBladePointerMove', '@focus="handleBladeFocus', '@blur="handleBladeBlur', '@click="handleBladeClick', 'touchPreviewIndex.value === index', 'event.preventDefault()', 'handleDocumentPointerDown'].every((contract) => heroKaleidoscope.includes(contract))],
  ['fan previews render as a body-level fixed overlay', heroKaleidoscope.includes('<Teleport to="body">') && heroKaleidoscope.includes('hero-fan-tooltip pointer-events-none fixed') && !heroKaleidoscope.includes('hero-fan-tooltip pointer-events-none absolute')],
  ['the rotate controls reshuffle what is on screen instead of fetching', rotateBySource.includes('shuffleSliceTextures()') && !rotateBySource.includes('randomizeSliceTextures')],
  ['the middle replay control still fetches fresh imagery', restartIntroSource.includes('randomizeSliceTextures(')],
  ['the hero downloads its images one at a time', /for \(let index = 0; index < sliceCount; index \+= 1\)/.test(heroKaleidoscope) && !heroKaleidoscope.includes('const textures = await Promise.all(')],
  ['the hero still gates the wheel on every texture', /const textures: THREE\.Texture\[\] = \[\]/.test(heroKaleidoscope) && heroKaleidoscope.indexOf('textures.push(await loadTexture(') < heroKaleidoscope.indexOf('scene.add(wheel)')],
  ['byte progress from the active download reaches the dial', heroKaleidoscope.includes('loadingFraction.value = fraction') && heroKaleidoscope.includes(':fraction="loadingFraction"') && kaleidoscopeTextures.includes('request.responseType = \'blob\'') && kaleidoscopeTextures.includes('event.loaded / event.total')],
  ['a failed image resolves to the fallback so the gate cannot hang', /catch \(error\) \{[\s\S]*?textures\.push\(getFallbackTexture\(\)\)/.test(heroKaleidoscope)],
  ['each texture marks its own slice ready as it settles', heroKaleidoscope.includes('markSliceReady(index)')],
  ['late promise callbacks cannot write to an unmounted component', heroKaleidoscope.includes('let isActive = true') && heroKaleidoscope.includes('isActive = false') && /if \(!isActive\) return/.test(heroKaleidoscope)],
  ['the dial is rendered while loading and receives the slice state', heroKaleidoscope.includes('<KaleidoscopeLoader') && heroKaleidoscope.includes('v-if="isLoaderVisible"') && heroKaleidoscope.includes(':ready-slices="readySlices"') && heroKaleidoscope.includes(':dismissing="isLoaderDismissing"')],
  ['the dial waits out a grace period and a minimum visible time', heroKaleidoscope.includes('LOADER_GRACE_MS = 180') && heroKaleidoscope.includes('LOADER_MIN_VISIBLE_MS = 500') && heroKaleidoscope.includes('LOADER_HOLD_MS = 120') && heroKaleidoscope.includes('LOADER_FADE_MS = 400')],
  ['the intro overlaps the dial fade rather than following it (unless the hero text still holds it)', heroKaleidoscope.includes('startIntroWhenReleased(LOADER_INTRO_OVERLAP_SECONDS)') && /function startIntroWhenReleased\(delay: number\)[\s\S]*?createIntroTimeline\(delay\)/.test(heroKaleidoscope)],
  ['the grace timer is cleared on unmount', heroKaleidoscope.includes('window.clearTimeout(loaderGraceTimer)')]
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Kaleidoscope preloader contract failed:')
  failures.forEach(([label]) => console.error(`  - ${label}`))
  process.exitCode = 1
} else {
  console.log(`Kaleidoscope preloader contract holds (${checks.length} checks).`)
}
