// Write the flat room picture (`start-view.jpg`: the view the viewer opens with) into tour
// folders under public/media/tours/. `pnpm tour:publish` does this on every copy; this command
// is for tours that are already here (2026-11-09: the newsletter modal shows the picture).
//
//   pnpm tour:start-view            every tour folder
//   pnpm tour:start-view <id> …     only these tours
//
// The pictures reach the server with the tours: `pnpm deploy:hetzner --tours <ids> --no-site`.

import { readdir, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeStartView } from './lib/tour-start-view.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toursDirectory = join(projectRoot, 'public', 'media', 'tours')
const SAFE_ID = /^[a-z0-9][a-z0-9._-]*$/iu

const hasTour = async (id) => stat(join(toursDirectory, id, 'tour.json')).then(() => true, () => false)

const requested = process.argv.slice(2)
for (const id of requested) {
  if (!SAFE_ID.test(id)) {
    console.error(`[start-view] Not a tour id: ${id}`)
    process.exit(1)
  }
}
const all = (await readdir(toursDirectory)).filter((id) => SAFE_ID.test(id))
const ids = requested.length ? requested : all

let failed = 0
for (const id of ids) {
  if (!(await hasTour(id))) {
    console.error(`[start-view] ${id}: no tour.json under public/media/tours/${id}/`)
    failed++
    continue
  }
  try {
    const file = await writeStartView(join(toursDirectory, id))
    console.log(`[start-view] ${relative(projectRoot, file)}`)
  } catch (error) {
    console.error(`[start-view] ${id}: ${error instanceof Error ? error.message : String(error)}`)
    failed++
  }
}
if (failed) process.exit(1)
