import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readProjectFile = (path) => readFile(resolve(projectRoot, path), 'utf8')

const [ledgerRow, locationPage] = await Promise.all([
  readProjectFile('app/components/LocationExhibitionLedgerRow.vue'),
  readProjectFile('app/pages/venues/[slug].vue')
])

const checks = [
  [
    'hovering an exhibition row moves its action arrow',
    ledgerRow.includes('group-hover/location-record:translate-x-[0.32rem]')
  ],
  [
    'the location introduction aligns both columns from the top',
    /location-exhibitions-intro[^"\n]*items-start/.test(locationPage)
      && !/location-exhibitions-intro[^"\n]*items-end/.test(locationPage)
  ],
  [
    'the facts ledger aligns with the heading rather than the eyebrow',
    /<ArchiveFactLedger class="[^"]*mt-9[^"]*tablet:mt-0/.test(locationPage)
  ]
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length) {
  console.error('Location exhibition-browser contract failed:')
  failures.forEach(([label]) => console.error(`  - ${label}`))
  process.exitCode = 1
} else {
  console.log('Location exhibition hover motion and introduction alignment are valid.')
}
