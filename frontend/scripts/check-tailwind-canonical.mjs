import { readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const projectRoot = resolve(import.meta.dirname, '..')
const vitePackageRoot = dirname(dirname(require.resolve('@tailwindcss/vite')))
const dependencyRoot = resolve(vitePackageRoot, '..')
const [{ __unstable__loadDesignSystem: loadDesignSystem }, { Scanner }] = await Promise.all([
  import(pathToFileURL(resolve(dependencyRoot, 'node/dist/index.mjs')).href),
  import(pathToFileURL(resolve(dependencyRoot, 'oxide/index.js')).href)
])

const css = await readFile(resolve(projectRoot, 'app/assets/css/main.css'), 'utf8')
const designSystem = await loadDesignSystem(css, { base: projectRoot })
const scanner = new Scanner({
  sources: [{ base: projectRoot, pattern: 'app/**/*.{vue,ts}', negated: false }]
})

const findings = []

for (const candidate of scanner.scan()) {
  if (!candidate.includes('[')) continue

  const [canonical] = designSystem.canonicalizeCandidates([candidate], { rem: 16 })
  if (canonical && canonical !== candidate) findings.push({ candidate, canonical })
}

const collectVueFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return collectVueFiles(path)
    return entry.name.endsWith('.vue') ? [path] : []
  }))

  return files.flat()
}

const markerCollisions = []
const invalidMarkers = []
const pointerStateConflicts = []
const componentStyleBlocks = []

for (const file of await collectVueFiles(resolve(projectRoot, 'app'))) {
  const source = await readFile(file, 'utf8')

  for (const block of source.matchAll(/<style\b([^>]*)>/g)) {
    const attributes = block[1].trim()
    componentStyleBlocks.push({ file, attributes: attributes || '(unscoped)' })
  }

  for (const match of source.matchAll(/\[ ([a-z0-9-]+) \]/g)) {
    const marker = match[1]
    if (new RegExp(`\\.${marker}(?![A-Za-z0-9_-])`).test(css)) markerCollisions.push({ file, marker })
  }

  for (const classAttribute of source.matchAll(/(?:^|[<\s])class\s*=\s*"([^"]*)"/gm)) {
    for (const marker of classAttribute[1].matchAll(/\[([a-z][a-z0-9-]*)\]/g)) {
      invalidMarkers.push({ file, marker: marker[1] })
    }
  }

  for (const tag of source.matchAll(/<[^>]+>/gs)) {
    const staticClass = tag[0].match(/(?:^|\s)class\s*=\s*"([^"]*)"/)
    const dynamicClass = tag[0].match(/(?:^|\s):class\s*=\s*"([^"]*)"/)
    if (!staticClass || !dynamicClass) continue

    if (/\bpointer-events-none\b/.test(staticClass[1]) && /\bpointer-events-auto\b/.test(dynamicClass[1])) {
      pointerStateConflicts.push({ file, tag: tag[0].split(/\s+/)[0].slice(1) })
    }
  }
}

if (findings.length || markerCollisions.length || invalidMarkers.length || pointerStateConflicts.length || componentStyleBlocks.length) {
  if (componentStyleBlocks.length) console.error('Component <style> blocks are prohibited — move these rules into app/assets/css/:')
  for (const { file, attributes } of componentStyleBlocks) console.error(`  ${file}: <style ${attributes}>`)
  if (findings.length) console.error('Non-canonical Tailwind candidates found:')
  for (const { candidate, canonical } of findings) console.error(`  ${candidate} -> ${canonical}`)
  if (invalidMarkers.length) console.error('Structural markers missing mandatory spaces:')
  for (const { file, marker } of invalidMarkers) console.error(`  ${file}: [${marker}] -> [ ${marker} ]`)
  if (markerCollisions.length) console.error('Inert structural markers used as CSS selectors:')
  for (const { file, marker } of markerCollisions) console.error(`  ${file}: ${marker}`)
  if (pointerStateConflicts.length) console.error('Permanent pointer-events-none conflicts with conditional pointer-events-auto:')
  for (const { file, tag } of pointerStateConflicts) console.error(`  ${file}: <${tag}>`)
  process.exitCode = 1
} else {
  console.log('Tailwind candidates, structural markers, and interaction states are canonical.')
}
