// Downloads the CSS and JS the site under test really ships: every page's
// <link>/<script> files under /_nuxt/, then every chunk those files name.
// The static checks read them from results/<run>/build/.
//
//   node qa/safari/audit/fetch.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RESULTS_DIR, ROUTES, TARGET } from '../config.mjs'

export const buildDir = (runId) => resolve(RESULTS_DIR, runId, 'build')

export async function fetchBuild(runId) {
  const dir = buildDir(runId)
  mkdirSync(dir, { recursive: true })
  const queue = new Set()
  for (const route of ROUTES) {
    const html = await (await fetch(TARGET + route.path)).text()
    for (const m of html.matchAll(/\/_nuxt\/([\w.-]+\.(?:css|js))/g)) queue.add(m[1])
  }
  const done = new Set()
  while (queue.size) {
    const [name] = queue
    queue.delete(name)
    if (done.has(name)) continue
    done.add(name)
    const r = await fetch(`${TARGET}/_nuxt/${name}`)
    if (!r.ok) continue
    const text = await r.text()
    writeFileSync(resolve(dir, name), text)
    // Vite chunks name each other as "./X.js", "_nuxt/X.css" or "/_nuxt/X.js".
    if (name.endsWith('.js')) for (const m of text.matchAll(/(?:\.\/|_nuxt\/)([\w.-]+\.(?:css|js))/g)) if (!done.has(m[1])) queue.add(m[1])
  }
  return { dir, files: [...done] }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const runId = process.env.QA_RUN_ID || 'audit'
  const { dir, files } = await fetchBuild(runId)
  console.log(`${files.length} files from ${TARGET} → ${dir}`)
}
