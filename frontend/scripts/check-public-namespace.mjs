import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadArchiveFromDirectus, runCheck } from './lib/archive-source.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(projectRoot, 'public')

// public/ is served from the URL root, so any top-level directory there
// shadows a route of the same name (public/locations/ once intercepted the
// /locations/** -> /venues/** redirect this way). These are the only files
// browsers or hosting require at the root; every other asset must live
// under the single reserved public/media/ namespace.
const ROOT_ALLOWED_FILES = new Set([
  'favicon.ico',
  'favicon-32x32.png',
  'favicon-archive-temple.ico',
  'favicon-archive-temple.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'site.webmanifest',
  'robots.txt',
  '.htaccess'
])

// macOS Finder metadata. Gitignored and outside anyone's control, so it
// must not be able to fail this check on a developer's own machine.
const IGNORED_ENTRIES = new Set(['.DS_Store'])

async function run() {
  const rootEntries = (await readdir(publicDir, { withFileTypes: true }))
    .filter((entry) => !IGNORED_ENTRIES.has(entry.name))

  const rootDirectories = rootEntries.filter((entry) => entry.isDirectory())
  const rootFiles = rootEntries.filter((entry) => entry.isFile())

  const strayDirectories = rootDirectories.filter((entry) => entry.name !== 'media').map((entry) => entry.name)
  const strayFiles = rootFiles.filter((entry) => !ROOT_ALLOWED_FILES.has(entry.name)).map((entry) => entry.name)

  // A tour path names a folder, not a file: the viewer fetches `<tour>tour.json`
  // from it, so that file is what proves the folder is a real exported tour.
  // The tour path itself still lives on the exhibition record in Directus; only
  // the exported folder it points at is a public/ concern.
  const archive = await loadArchiveFromDirectus()
  const tourReferences = archive.exhibitions
    .filter((exhibition) => typeof exhibition.tour === 'string' && exhibition.tour.length > 0)
    .map((exhibition) => ({ id: exhibition.id, value: exhibition.tour, target: `${exhibition.tour}tour.json` }))

  const brokenTourReferences = tourReferences.filter(({ value, target }) =>
    !value.startsWith('/')
    || !value.endsWith('/')
    || !existsSync(resolve(publicDir, `.${target}`)))

  const checks = [
    ['public/ contains exactly one directory, named media', rootDirectories.length === 1 && rootDirectories[0]?.name === 'media'],
    ['public/ root has no stray directories', strayDirectories.length === 0],
    ['every public/ root file is on the allowlist', strayFiles.length === 0],
    [`every tour path in Directus resolves under public/ (${tourReferences.length} checked)`, brokenTourReferences.length === 0]
  ]

  const failures = checks.filter(([, passed]) => !passed)

  if (failures.length) {
    console.error('Public namespace check failed:')
    for (const [label] of failures) console.error(`  - ${label}`)

    if (strayDirectories.length) {
      console.error(`    Stray root directories: ${strayDirectories.join(', ')}.`)
      console.error('    Only public/media/ may sit alongside the root-mandated files: new asset folders belong under public/media/, not the public/ root, or they will shadow a route of the same name.')
    }

    if (strayFiles.length) {
      console.error(`    Stray root files: ${strayFiles.join(', ')}.`)
      console.error('    Assets belong in public/media/, not the public/ root.')
    }

    if (brokenTourReferences.length) {
      for (const { id, value } of brokenTourReferences) {
        console.error(`    exhibition ${id ?? '?'} field tour references a missing asset: ${value}`)
      }
      console.error('    A tour path must start and end with a slash and name a folder under public/media/tours/ that holds a tour.json.')
    }

    process.exitCode = 1
  } else {
    console.log(`Public namespace OK: public/ root holds only media/ plus root-mandated files, and ${tourReferences.length} tour paths resolve.`)
  }
}

await runCheck(run)
