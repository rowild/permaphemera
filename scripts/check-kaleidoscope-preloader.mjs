import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readProjectFile = (path) => readFile(resolve(projectRoot, path), 'utf8')

const { toRomanNumeral } = await import('../app/utils/romanNumerals.ts')
const orbitGeometry = await import('../app/utils/orbitGeometry.ts')
const { createTextureCache } = await import('../app/utils/textureCache.ts')
const heroKaleidoscope = await readProjectFile('app/components/HeroKaleidoscope.vue')

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

const checks = [
  ['roman numerals convert the single units', toRomanNumeral(1) === 'I' && toRomanNumeral(4) === 'IV' && toRomanNumeral(5) === 'V' && toRomanNumeral(9) === 'IX'],
  ['roman numerals convert the slice range used by the dial', toRomanNumeral(7) === 'VII' && toRomanNumeral(10) === 'X' && toRomanNumeral(12) === 'XII'],
  ['roman numerals reject zero, negatives, and non-integers', toRomanNumeral(0) === '' && toRomanNumeral(-3) === '' && toRomanNumeral(1.5) === '' && toRomanNumeral(Number.NaN) === ''],
  ['orbit radius matches the hero orbit', orbitGeometry.orbitRadius === 52],
  ['orbit has twelve segments spaced thirty degrees apart', orbitGeometry.orbitSegments.length === 12 && orbitGeometry.orbitSegments[7].rotation === 210 && orbitGeometry.orbitSegments.every(({ id, rotation }) => rotation === id * 30)],
  ['zero degrees sits at the top of the orbit', Math.abs(orbitGeometry.pointOnOrbit(0).x - 50) < 1e-6 && Math.abs(orbitGeometry.pointOnOrbit(0).y - -2) < 1e-6],
  ['ninety degrees sits at the right of the orbit', Math.abs(orbitGeometry.pointOnOrbit(90).x - 102) < 1e-6 && Math.abs(orbitGeometry.pointOnOrbit(90).y - 50) < 1e-6],
  ['a custom radius is honoured', Math.abs(orbitGeometry.pointOnOrbit(0, 10).y - 40) < 1e-6],
  ['the orbit arc is a single short sweep', /^M -?[\d.]+ -?[\d.]+ A 52 52 0 0 1 -?[\d.]+ -?[\d.]+$/.test(orbitGeometry.describeOrbitArc(2, 28))],
  ['the arrow head is a three point polygon', orbitGeometry.describeArrowHead(28).split(' ').length === 3],
  ['the orbit gradient exposes both endpoints as strings', ['x1', 'y1', 'x2', 'y2'].every((key) => typeof orbitGeometry.describeOrbitGradient(2, 28)[key] === 'string')],
  ['HeroKaleidoscope imports the shared orbit geometry instead of defining it', heroKaleidoscope.includes("from '~/utils/orbitGeometry'") && !heroKaleidoscope.includes('function pointOnOrbit') && !heroKaleidoscope.includes('function describeOrbitArc') && !heroKaleidoscope.includes('function describeArrowHead') && !heroKaleidoscope.includes('const orbitRadius =')],
  ['texture cache serves a repeated url without loading twice', cacheProbe.cachesRepeatLoads],
  ['texture cache shares one request between concurrent callers', cacheProbe.dedupesInFlightLoads],
  ['texture cache evicts the least recently used entry and disposes it', cacheProbe.evictsLeastRecentlyUsed],
  ['a failed load is not cached and can be retried', cacheProbe.failedLoadsDoNotPoison],
  ['clearing the cache disposes every retained texture', cacheProbe.clearDisposesEverything]
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Kaleidoscope preloader contract failed:')
  failures.forEach(([label]) => console.error(`  - ${label}`))
  process.exitCode = 1
} else {
  console.log(`Kaleidoscope preloader contract holds (${checks.length} checks).`)
}
