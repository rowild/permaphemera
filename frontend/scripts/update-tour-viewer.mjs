// pnpm viewer:update — bring the 360° tour viewer up to date in one step:
// build it in the editor project (`pnpm build:all`), copy tour-viewer.js and
// tour-viewer.css into public/media/tour-viewer/, and record their fingerprint
// in app/utils/tourViewerBuild.ts so their URLs change (scripts/lib/tour-viewer-build.mjs).
//
//   pnpm viewer:update                 build, copy, fingerprint
//   pnpm viewer:update -- --no-build   copy the editor's existing dist/ only
//   pnpm viewer:update -- --from <dir> the editor project lives elsewhere
//
// The editor project is --from, else TOUR_EDITOR_REPO, else TOUR_EDITOR_REPO
// in ~/.config/rowild-skills/paths.env (the Tour Editor's Settings → Folders
// tab writes it), else ../../_MacAPP TOUR-VIEWER beside this repository.
//
// It stops before commit and deploy on purpose.
import { spawnSync } from 'node:child_process'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readProjectPaths } from './lib/project-paths.mjs'
import { buildModuleSource, viewerBuildId } from './lib/tour-viewer-build.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const fromIndex = args.indexOf('--from')
const configuredEditor = process.env.TOUR_EDITOR_REPO || (await readProjectPaths()).TOUR_EDITOR_REPO
const editorRoot = fromIndex >= 0 && args[fromIndex + 1]
  ? resolve(args[fromIndex + 1])
  : resolve(configuredEditor || resolve(projectRoot, '../../_MacAPP TOUR-VIEWER'))
const targetDir = join(projectRoot, 'public', 'media', 'tour-viewer')
const files = ['tour-viewer.js', 'tour-viewer.css']

if (!args.includes('--no-build')) {
  console.log(`[viewer] building in ${editorRoot}`)
  const build = spawnSync('pnpm', ['build:all'], { cwd: editorRoot, stdio: 'inherit' })
  if (build.status !== 0) {
    console.error('[viewer] the editor build failed; nothing was copied')
    process.exit(1)
  }
}

const contents = {}
for (const name of files) {
  try {
    contents[name] = await readFile(join(editorRoot, 'dist', name))
  }
  catch {
    console.error(`[viewer] ${join(editorRoot, 'dist', name)} is missing — run \`pnpm build:all\` in the editor project, or drop --no-build`)
    process.exit(1)
  }
}
for (const name of files) {
  await copyFile(join(editorRoot, 'dist', name), join(targetDir, name))
}
const id = viewerBuildId(contents['tour-viewer.js'], contents['tour-viewer.css'])
await writeFile(join(projectRoot, 'app', 'utils', 'tourViewerBuild.ts'), buildModuleSource(id))
console.log(`[viewer] tour-viewer.js + .css copied, fingerprint ${id}`)
console.log('[viewer] next: commit, then pnpm deploy:hetzner')
