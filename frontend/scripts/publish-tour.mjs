// Publish one exported 360° tour into this site: copy the folder under
// public/media/tours/, link it to an exhibition record, and run the public
// namespace check. Stops before deploy on purpose — look at the page first.
//
//   pnpm tour:publish <tour id>                     update an already linked tour
//   pnpm tour:publish <tour id> --exhibition <slug> link a new tour to a record
//   pnpm tour:publish <tour id> --dry-run           show the plan, write nothing
//   pnpm tour:publish <tour id> --from <dir>        read the export from elsewhere
//
// Three non-interactive modes for the Tour Editor's "Publish to website…"
// window (2026-10-25), which uploads BETWEEN copying and linking so that no
// Start button points at files the server does not have yet:
//   --candidates-json      writes nothing; prints one JSON line (linked record,
//                          suggested slug, candidates) and logs to stderr
//   --copy-only            copy + check:public, no Directus
//   --link-only [--exhibition <slug>] [--show-now]
//                          Directus only; the copy must already be here.
//                          --show-now also sets tour_status "available" and
//                          clears tour_available_from
//
// The tour id is the folder the editor wrote on export (Tutorial No. 2). With
// no --exhibition and no existing link, the script lists the records that
// still have no tour, suggests the closest match from tour.json's meta block,
// and asks for a number. The export folder is --from, else TOUR_EXPORT_DIR,
// else $PANORAMA_PROJECT/exported from ~/.config/rowild-skills/paths.env (the
// file the editor's Settings → Folders tab writes), else
// ../_360_GALLERIES_AND_TOURS/exported/ beside this repository.

import { spawn } from 'node:child_process'
import { cp, readdir, readFile, rm, stat } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { directusPatch, directusToken, loadArchiveFromDirectus } from './lib/archive-source.mjs'
import { readProjectPaths } from './lib/project-paths.mjs'
import { parseArguments, recordSummary } from './lib/publish-tour-options.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toursDirectory = join(projectRoot, 'public', 'media', 'tours')
const defaultExportDirectory = resolve(projectRoot, '..', '..', '_360_GALLERIES_AND_TOURS', 'exported')

const SAFE_ID = /^[a-z0-9][a-z0-9._-]*$/iu

// In --candidates-json mode stdout carries the JSON line alone; logs go to stderr.
let quiet = false

function log(message) {
  (quiet ? console.error : console.log)(`[tour] ${message}`)
}

function fail(message) {
  console.error(`[tour] ${message}`)
  process.exit(1)
}

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

// Comparable text: lower-case, no diacritics, ß as ss, letters and digits
// only, and the joining words dropped so "Gehen & Sehen" meets "Gehen und
// Sehen". The tour's meta block is typed by hand in the editor; the record's
// title comes from the archive — the two never agree on every character.
const comparable = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/ß/gu, 'ss')
  .replace(/[^a-z0-9]+/gu, ' ')
  .replace(/\b(?:und|and)\b/gu, ' ')
  .replace(/\s+/gu, ' ')
  .trim()

const displayPersonName = (person) =>
  person.display_name ?? `${person.first_name} ${person.last_name}`.trim()

async function loadCatalogue() {
  const archive = await loadArchiveFromDirectus()
  const { exhibitions, participations, persons, roles } = archive
  const personById = new Map(persons.map((person) => [person.id, person]))
  const artistRoleId = roles.find((role) => role.slug === 'artist')?.id
  if (!artistRoleId) fail('pp_roles in Directus has no role with slug "artist"')
  const artistNames = new Map()

  for (const participation of [...participations].sort((a, b) => a.sort - b.sort)) {
    if (participation.role !== artistRoleId) continue
    const person = personById.get(participation.person)
    if (!person) continue
    const names = artistNames.get(participation.exhibition) ?? []
    names.push(displayPersonName(person))
    artistNames.set(participation.exhibition, names)
  }

  return { exhibitions, artistNames }
}

const recordTitle = (record) => {
  const english = record.translations?.find((entry) => entry.languages_code === 'en')
  return english?.title ?? record.translations?.[0]?.title ?? record.slug
}

const describeRecord = (record, artistNames) =>
  `${recordTitle(record)} · ${(artistNames.get(record.id) ?? []).join(' & ') || '—'} · ${record.start_date}`

// 2 points for a title that matches the tour's meta title, 1 for an artist
// that matches its eyebrow. Only a positive score is offered, and only as
// the default answer — the person still confirms.
function suggestRecord(candidates, meta, artistNames) {
  const title = comparable(meta?.title)
  const eyebrow = comparable(meta?.eyebrow)
  let best = null

  for (const record of candidates) {
    let score = 0
    const titles = (record.translations ?? []).map((entry) => comparable(entry.title))
    if (title && titles.includes(title)) score += 2
    const artists = (artistNames.get(record.id) ?? []).map(comparable)
    if (eyebrow && artists.some((name) => name && (eyebrow.includes(name) || name.includes(eyebrow)))) score += 1
    if (score > 0 && (!best || score > best.score)) best = { record, score }
  }

  return best?.record ?? null
}

async function chooseRecord(candidates, suggestion, artistNames) {
  console.log('')
  console.log('Exhibitions without a tour:')
  candidates.forEach((record, index) => {
    const marker = record === suggestion ? '  ← suggested' : ''
    console.log(`  ${String(index + 1).padStart(2)}  ${record.slug}  —  ${describeRecord(record, artistNames)}${marker}`)
  })
  console.log('')

  if (!process.stdin.isTTY) {
    fail('No terminal to ask in. Re-run with --exhibition <slug> from the list above.')
  }

  const readline = createInterface({ input: process.stdin, output: process.stdout })
  const defaultIndex = suggestion ? candidates.indexOf(suggestion) + 1 : null
  const prompt = defaultIndex ? `Link to which number? [${defaultIndex}] ` : 'Link to which number? (empty to stop) '
  const answer = (await readline.question(prompt)).trim()
  readline.close()

  if (!answer && defaultIndex) return suggestion
  if (!answer) fail('Stopped. Nothing was changed.')
  const number = Number.parseInt(answer, 10)
  if (!Number.isInteger(number) || number < 1 || number > candidates.length) fail(`"${answer}" is not a number from the list.`)
  return candidates[number - 1]
}

async function measure(directory) {
  let files = 0
  let bytes = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      const inner = await measure(path)
      files += inner.files
      bytes += inner.bytes
    }
    else if (entry.isFile()) {
      files += 1
      bytes += (await stat(path)).size
    }
  }
  return { files, bytes }
}

const megabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

async function exists(path) {
  try {
    await stat(path)
    return true
  }
  catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

function runCheck(script) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [join(projectRoot, 'scripts', script)], { stdio: 'inherit' })
    child.on('error', rejectPromise)
    child.on('close', (code) => (code === 0 ? resolvePromise() : rejectPromise(new Error(`${script} failed.`))))
  })
}

async function mirror(source, target) {
  // Mirror, not merge: a panorama the editor dropped must not survive here.
  if (await exists(target)) await rm(target, { recursive: true, force: true })
  await cp(source, target, {
    recursive: true,
    filter: (path) => !basename(path).startsWith('.')
  })
}

async function copyOnly(source, target) {
  if (!(await exists(join(source, 'tour.json')))) {
    fail(`No exported tour at ${source} (no tour.json there). Export it from the editor first, or pass --from <dir>.`)
  }
  const size = await measure(source)
  log(`Copying ${size.files} files (${megabytes(size.bytes)}) from ${source}`)
  log(`to ${relative(projectRoot, target)}/ — nothing is linked in Directus yet.`)
  await mirror(source, target)
  await runCheck('check-public-namespace.mjs')
  log('Copied.')
}

async function linkOnly(options, target, tourPath) {
  if (!(await exists(join(target, 'tour.json')))) {
    fail(`${relative(projectRoot, target)}/ holds no tour.json. Copy the tour first (--copy-only) and upload it.`)
  }
  const { exhibitions } = await loadCatalogue()
  const linked = exhibitions.find((record) => record.tour === tourPath)
  const showNow = options.showNow ? { tour_status: 'available', tour_available_from: null } : {}
  let record = linked
  let patch = showNow

  if (linked) {
    if (options.exhibition && options.exhibition !== linked.slug) {
      fail(`${options.tourId} is already linked to "${linked.slug}", not "${options.exhibition}". Set that record's "tour" to null in Directus first if it should move.`)
    }
    log(`${options.tourId} is already linked to "${linked.slug}".`)
  }
  else {
    if (!options.exhibition) fail('--link-only needs --exhibition <slug> for a tour that is not linked yet.')
    record = exhibitions.find((item) => item.slug === options.exhibition)
    if (!record) fail(`No exhibition has the slug "${options.exhibition}".`)
    if (record.tour) fail(`"${record.slug}" already has the tour ${record.tour}. Unlink it in Directus first if that is intended.`)
    patch = { tour: tourPath, ...showNow }
  }

  if (!Object.keys(patch).length) {
    log('Nothing to change in Directus.')
    return
  }
  if (!directusToken) fail('DIRECTUS_TOKEN is not set in frontend/.env; the tour link needs write access')
  await directusPatch(`/items/pp_exhibitions/${record.id}`, patch, directusToken)
  if (patch.tour) log(`Linked: "${record.slug}" → ${tourPath}`)
  if (options.showNow) log(`Start button on: "${record.slug}" is available now.`)
  await runCheck('check-public-namespace.mjs')
}

async function main() {
  let options
  try {
    options = parseArguments(process.argv.slice(2))
  }
  catch (error) {
    fail(error.message)
  }
  quiet = options.mode === 'candidates'
  if (!options.tourId) fail('Usage: pnpm tour:publish <tour id> [--exhibition <slug>] [--from <dir>] [--dry-run] [--candidates-json | --copy-only | --link-only [--show-now]]')
  if (!SAFE_ID.test(options.tourId)) fail(`"${options.tourId}" is not a tour id: letters, digits, dot, dash and underscore only, no slashes.`)

  const projectPaths = await readProjectPaths()
  const configuredExports = projectPaths.PANORAMA_PROJECT ? join(projectPaths.PANORAMA_PROJECT, 'exported') : null
  const exportDirectory = resolve(options.from ?? process.env.TOUR_EXPORT_DIR ?? configuredExports ?? defaultExportDirectory)
  const source = join(exportDirectory, options.tourId)
  const target = join(toursDirectory, options.tourId)
  const tourPath = `/media/tours/${options.tourId}/`

  if (options.mode === 'copy') return copyOnly(source, target)
  if (options.mode === 'link') return linkOnly(options, target, tourPath)

  if (!(await exists(join(source, 'tour.json')))) {
    fail(`No exported tour at ${source} (no tour.json there). Export it from the editor first, or pass --from <dir>.`)
  }
  const tour = await readJson(join(source, 'tour.json'))
  if (tour.id && tour.id !== options.tourId) {
    log(`Note: tour.json says id "${tour.id}" but the folder is "${options.tourId}". The folder name is what the site links.`)
  }

  const { exhibitions, artistNames } = await loadCatalogue()
  const linked = exhibitions.find((record) => record.tour === tourPath)
  let record = linked

  if (options.mode === 'candidates') {
    const candidates = linked ? [] : exhibitions.filter((item) => !item.tour)
    const suggestion = linked ? null : suggestRecord(candidates, tour.meta, artistNames)
    const summary = (item) => recordSummary(item, recordTitle(item))
    console.log(JSON.stringify({
      linked: linked ? summary(linked) : null,
      suggested: suggestion?.slug ?? null,
      candidates: candidates.map(summary),
    }))
    return
  }

  if (linked) {
    if (options.exhibition && options.exhibition !== linked.slug) {
      fail(`${options.tourId} is already linked to "${linked.slug}", not "${options.exhibition}". Set that record's "tour" to null in Directus first if it should move.`)
    }
    log(`${options.tourId} is already linked to "${linked.slug}". Replacing the copy only.`)
  }
  else {
    const candidates = exhibitions.filter((item) => !item.tour)
    if (options.exhibition) {
      record = exhibitions.find((item) => item.slug === options.exhibition)
      if (!record) fail(`No exhibition has the slug "${options.exhibition}".`)
      if (record.tour) fail(`"${record.slug}" already has the tour ${record.tour}. Unlink it in Directus first if that is intended.`)
    }
    else {
      if (!candidates.length) fail('Every exhibition already has a tour. Pass --exhibition <slug> to replace one deliberately.')
      const suggestion = suggestRecord(candidates, tour.meta, artistNames)
      log(`Tour "${tour.meta?.title ?? tour.name ?? options.tourId}"${tour.meta?.eyebrow ? ` by ${tour.meta.eyebrow}` : ''} is not linked yet.`)
      record = await chooseRecord(candidates, suggestion, artistNames)
    }
    log(`Will link ${options.tourId} to "${record.slug}" (${describeRecord(record, artistNames)}).`)
  }

  const size = await measure(source)
  const replacing = await exists(target)
  log(`${options.dryRun ? 'Would copy' : 'Copying'} ${size.files} files (${megabytes(size.bytes)}) from ${source}`)
  log(`${replacing ? 'over the existing copy at' : 'to'} ${relative(projectRoot, target)}/`)

  if (options.dryRun) {
    if (!linked) log(`Would set "tour" on "${record.slug}" in Directus.`)
    log('Would run pnpm check:public.')
    log('Dry run complete. Nothing was written.')
    return
  }

  // Check credentials before spending any time copying a multi-hundred-megabyte tour: a
  // missing token would otherwise only surface from directusPatch() after the copy below.
  if (!linked && !directusToken) fail('DIRECTUS_TOKEN is not set in frontend/.env; the tour link needs write access')

  await mirror(source, target)

  if (!linked) {
    await directusPatch(`/items/pp_exhibitions/${record.id}`, { tour: tourPath }, directusToken)
    log(`Linked: "${record.slug}" → ${tourPath}`)
  }

  await runCheck('check-public-namespace.mjs')

  console.log('')
  log('Published locally. Next:')
  log(`  1. pnpm dev  →  open /exhibitions/${record.slug}/ (German) or /en/exhibitions/${record.slug}/ and click Start experience.`)
  log('  2. In Directus, check tour_status (available) and tour_available_from: the button shows only when both allow it.')
  log('  3. pnpm deploy:hetzner. The tour folder itself must still be deployed; it is not tracked in git.')
  log('     The search text says "360° tour online." by itself once the tour is linked and its day has come.')
}

await main()
