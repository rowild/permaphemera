// The files a server job needs: its entry scripts and every module they import, followed through
// relative imports (`from './x.mjs'`, `import '../y.mjs'`, `import('./z.mjs')`). Paths relative to
// the frontend folder, sorted. scripts/deploy-hetzner.sh copies exactly these to the server for
// the nightly SEO refresh and the monthly news report. Until 2026-11-11 a hand-written list did
// that; it missed shared/countries.mjs and the SEO refresh failed every night after 0.0.74.
//   node scripts/lib/server-bundle.mjs scripts/seo-snapshot.mjs   prints one path per line
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g

/**
 * @param {string} root the frontend folder
 * @param {string[]} entries entry scripts, relative to root
 * @returns {string[]}
 */
export const bundleFiles = (root, entries) => {
  const found = new Set()
  const visit = (file) => {
    if (found.has(file)) return
    const path = join(root, file)
    if (!existsSync(path)) throw new Error(`server bundle: ${file} is missing`)
    found.add(file)
    for (const [, target] of readFileSync(path, 'utf8').matchAll(IMPORT)) {
      visit(relative(root, resolve(dirname(path), target)))
    }
  }
  for (const entry of entries) visit(entry)
  return [...found].sort()
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  console.log(bundleFiles(root, process.argv.slice(2)).join('\n'))
}
