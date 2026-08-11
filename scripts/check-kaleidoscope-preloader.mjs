import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readProjectFile = (path) => readFile(resolve(projectRoot, path), 'utf8')

const { toRomanNumeral } = await import('../app/utils/romanNumerals.ts')
const orbitGeometry = await import('../app/utils/orbitGeometry.ts')
const heroKaleidoscope = await readProjectFile('app/components/HeroKaleidoscope.vue')

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
  ['HeroKaleidoscope imports the shared orbit geometry instead of defining it', heroKaleidoscope.includes("from '~/utils/orbitGeometry'") && !heroKaleidoscope.includes('function pointOnOrbit') && !heroKaleidoscope.includes('function describeOrbitArc') && !heroKaleidoscope.includes('function describeArrowHead') && !heroKaleidoscope.includes('const orbitRadius =')]
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Kaleidoscope preloader contract failed:')
  failures.forEach(([label]) => console.error(`  - ${label}`))
  process.exitCode = 1
} else {
  console.log(`Kaleidoscope preloader contract holds (${checks.length} checks).`)
}
