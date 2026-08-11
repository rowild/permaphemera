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
