import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(projectRoot, 'public')
const dataDir = resolve(projectRoot, 'app/data')
const readJson = async (path) => JSON.parse(await readFile(resolve(projectRoot, path), 'utf8'))

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

const rootEntries = (await readdir(publicDir, { withFileTypes: true }))
  .filter((entry) => !IGNORED_ENTRIES.has(entry.name))

const rootDirectories = rootEntries.filter((entry) => entry.isDirectory())
const rootFiles = rootEntries.filter((entry) => entry.isFile())

const strayDirectories = rootDirectories.filter((entry) => entry.name !== 'media').map((entry) => entry.name)
const strayFiles = rootFiles.filter((entry) => !ROOT_ALLOWED_FILES.has(entry.name)).map((entry) => entry.name)

// Every asset path an app/data/*.json record points at must resolve to a
// real file under public/, so a move or an edit can never leave a link
// broken without this check catching it.
const dataFiles = (await readdir(dataDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => entry.name)

const ASSET_FIELDS = ['image', 'hero_image', 'source_pdf']

// A tour path names a folder, not a file: the viewer fetches `<tour>tour.json`
// from it, so that file is what proves the folder is a real exported tour.
const FOLDER_FIELDS = { tour: 'tour.json' }

const assetReferences = []
for (const fileName of dataFiles) {
  const records = await readJson(`app/data/${fileName}`)
  if (!Array.isArray(records)) continue

  for (const record of records) {
    for (const field of ASSET_FIELDS) {
      const value = record[field]
      if (typeof value === 'string' && value.length > 0) {
        assetReferences.push({ fileName, id: record.id, field, value, target: value })
      }
    }
    for (const [field, markerFile] of Object.entries(FOLDER_FIELDS)) {
      const value = record[field]
      if (typeof value === 'string' && value.length > 0) {
        assetReferences.push({ fileName, id: record.id, field, value, target: `${value}${markerFile}` })
      }
    }
  }
}

const brokenReferences = assetReferences.filter(({ field, value, target }) =>
  !value.startsWith('/')
  || (field in FOLDER_FIELDS && !value.endsWith('/'))
  || !existsSync(resolve(publicDir, `.${target}`)))

const checks = [
  ['public/ contains exactly one directory, named media', rootDirectories.length === 1 && rootDirectories[0]?.name === 'media'],
  ['public/ root has no stray directories', strayDirectories.length === 0],
  ['every public/ root file is on the allowlist', strayFiles.length === 0],
  [`every image/hero_image/source_pdf/tour path in app/data/*.json resolves under public/ (${assetReferences.length} checked)`, brokenReferences.length === 0]
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

  if (brokenReferences.length) {
    for (const { fileName, id, field, value } of brokenReferences) {
      console.error(`    ${fileName} record ${id ?? '?'} field ${field} references a missing asset: ${value}`)
    }
    if (brokenReferences.some(({ field }) => field in FOLDER_FIELDS)) {
      console.error('    A tour path must start and end with a slash and name a folder under public/media/tours/ that holds a tour.json.')
    }
  }

  process.exitCode = 1
} else {
  console.log(`Public namespace OK: public/ root holds only media/ plus root-mandated files, and ${assetReferences.length} asset paths across ${dataFiles.length} data files resolve.`)
}
