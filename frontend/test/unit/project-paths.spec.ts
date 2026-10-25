import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parsePathsEnv, readProjectPaths } from '../../scripts/lib/project-paths.mjs'

// The three projects (tours, editor, website) find each other through ONE
// file, ~/.config/rowild-skills/paths.env, which the Tour Editor's Settings →
// Folders tab also writes (2026-10-25). Moving a project means changing it there.
describe('parsePathsEnv', () => {
  it('reads quoted and plain values and skips comments and blank lines', () => {
    expect(parsePathsEnv([
      '# rowild-skills paths',
      '',
      'PANORAMA_PROJECT="/Users/x/_360 GALLERIES"',
      'TOUR_EDITOR_REPO=/Users/x/app',
      '  PERMAPHEMERA_WEBSITE = "/Users/x/web"  ',
    ].join('\n'))).toEqual({
      PANORAMA_PROJECT: '/Users/x/_360 GALLERIES',
      TOUR_EDITOR_REPO: '/Users/x/app',
      PERMAPHEMERA_WEBSITE: '/Users/x/web',
    })
  })
})

describe('readProjectPaths', () => {
  it('reads a file, and answers {} when there is none', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'paths-'))
    const file = join(dir, 'paths.env')
    writeFileSync(file, 'PANORAMA_PROJECT="/p"\n')
    expect(await readProjectPaths(file)).toEqual({ PANORAMA_PROJECT: '/p' })
    expect(await readProjectPaths(join(dir, 'missing.env'))).toEqual({})
  })
})
