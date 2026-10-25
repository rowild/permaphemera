// scripts/lib/project-paths.mjs
// Where the three projects live. One file is the source of truth for all of
// them: ~/.config/rowild-skills/paths.env (written by rowild-skills' setup.sh,
// and by the Tour Editor's Settings → Folders tab since 2026-10-25), read here,
// by the tour scripts' run.sh and by the editor. ROWILD_SKILLS_CONFIG points
// at another file. Keys: PANORAMA_PROJECT (tours), TOUR_EDITOR_REPO (editor),
// PERMAPHEMERA_WEBSITE (this repo), ROWILD_SKILLS, BACKUP_TARGET.
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const defaultPathsFile = () =>
  process.env.ROWILD_SKILLS_CONFIG || join(homedir(), '.config', 'rowild-skills', 'paths.env')

/** `KEY="value"` or `KEY=value` per line; comments and blank lines skipped. */
export function parsePathsEnv(text) {
  const values = {}
  for (const line of String(text).split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!match) continue
    const raw = match[2]
    values[match[1]] = raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
  }
  return values
}

/** The file's values, or {} when there is no file. */
export async function readProjectPaths(file = defaultPathsFile()) {
  try {
    return parsePathsEnv(await readFile(file, 'utf8'))
  }
  catch (error) {
    if (error.code === 'ENOENT') return {}
    throw error
  }
}
