// scripts/lib/publish-tour-options.mjs
// The command line of `pnpm tour:publish`, apart from the script so it can be
// tested. Besides the interactive routine (Handbook Tutorial No. 4) there are
// three non-interactive modes for the Tour Editor's "Publish to website…"
// window (2026-10-25): it reads the candidates as JSON, copies before the
// upload, and links only after the upload succeeded — so no Start button ever
// points at files that are not on the server yet.

/** @typedef {{ tourId: string|null, exhibition: string|null, from: string|null, dryRun: boolean,
 *   mode: 'publish'|'candidates'|'copy'|'link', showNow: boolean }} Options */

const MODES = { '--candidates-json': 'candidates', '--copy-only': 'copy', '--link-only': 'link' }

/** @param {string[]} argv @returns {Options} Throws an Error with the reason. */
export function parseArguments(argv) {
  /** @type {Options} */
  const options = { tourId: null, exhibition: null, from: null, dryRun: false, mode: 'publish', showNow: false }
  const modes = []

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--dry-run') options.dryRun = true
    else if (argument === '--show-now') options.showNow = true
    else if (argument in MODES) modes.push(argument)
    else if (argument === '--exhibition' || argument === '--from') {
      const value = argv[index + 1]
      if (!value || value.startsWith('--')) throw new Error(`${argument} needs a value.`)
      options[argument.slice(2)] = value
      index += 1
    }
    else if (argument.startsWith('--')) throw new Error(`Unknown option ${argument}.`)
    else if (options.tourId) throw new Error(`Only one tour id can be published at a time (got ${options.tourId} and ${argument}).`)
    else options.tourId = argument
  }

  if (modes.length > 1) throw new Error(`Use only one of ${Object.keys(MODES).join(', ')}.`)
  if (modes.length) options.mode = MODES[modes[0]]
  if (options.showNow && options.mode !== 'link') throw new Error('--show-now works only with --link-only.')
  if (options.exhibition && (options.mode === 'copy' || options.mode === 'candidates')) {
    throw new Error(`--exhibition does not go with ${modes[0]}: ${options.mode === 'copy' ? 'a copy links nothing' : 'the candidates are listed, not chosen'}.`)
  }
  if (options.dryRun && options.mode !== 'publish') throw new Error(`--dry-run goes with the plain routine; ${modes[0]} is already safe to try.`)
  return options
}

/** What the editor's window needs of an exhibition record. */
export const recordSummary = (record, title) => ({
  slug: record.slug,
  title,
  start_date: record.start_date,
  tour_status: record.tour_status,
  tour_available_from: record.tour_available_from ?? null,
})
