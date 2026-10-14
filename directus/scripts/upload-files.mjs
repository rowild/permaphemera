// directus/scripts/upload-files.mjs
// Uploads images and PDFs for venue and exhibition records from a JSON manifest,
// then sets each file's title and description (the credit line). Prints { key: fileId }.
// Idempotent: a file with the same folder + filename is reused, not uploaded twice.
// Unlike the MCP `files import`, this keeps the MIME type and image size.
//   DIRECTUS_ENV_FILE=.env.remote node scripts/upload-files.mjs <manifest.json>
// Manifest: [{ key, url | localPath, filename, folderPath, title, description }]
//   url        downloaded first (Wikimedia needs a User-Agent; sent below)
//   localPath  used as is; copied under `filename` when the names differ
//   filename   the download name in Directus, lowercase-hyphen, e.g. ingrid-proeller-endzeit-2022.jpg
//   folderPath e.g. media/<venue-slug>; missing folders are created
// See docs/how-to-gallery-and-exhibition.md for the title and description conventions.
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { loadEnv, login } from './lib.mjs'
import { uploadFile } from './files.mjs'

const manifestPath = process.argv[2]
if (!manifestPath) throw new Error('usage: node scripts/upload-files.mjs <manifest.json>')

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const work = mkdtempSync(join(tmpdir(), 'pp-upload-'))
const session = await login(loadEnv())
const ids = {}

for (const entry of manifest) {
  let localPath = entry.localPath
  if (!localPath) {
    localPath = join(work, entry.filename)
    const res = await fetch(entry.url, { headers: { 'User-Agent': 'PERMAPHEMERA-archive/1.0 (https://permaphemera.at)' } })
    if (!res.ok) throw new Error(`download ${entry.url}: ${res.status}`)
    writeFileSync(localPath, Buffer.from(await res.arrayBuffer()))
  } else if (entry.filename && basename(localPath) !== entry.filename) {
    // uploadFile names the file after the local basename.
    const target = join(work, entry.filename)
    copyFileSync(localPath, target)
    localPath = target
  }
  const { id, created } = await uploadFile(session, { localPath, folderPath: entry.folderPath, title: entry.title })
  await session.api('PATCH', `/files/${id}`, { title: entry.title, description: entry.description ?? null })
  ids[entry.key] = id
  console.error(`${created ? 'uploaded' : 'reused  '} ${entry.key} -> ${id}`)
}

console.log(JSON.stringify(ids, null, 2))
