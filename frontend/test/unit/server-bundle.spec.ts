import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { bundleFiles } from '../../scripts/lib/server-bundle.mjs'

const root = resolve(__dirname, '../..')
const copies: string[] = []
afterEach(async () => { await Promise.all(copies.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))) })

// Copies the bundle alone into an empty folder, as the deploy does for the server.
const copyBundle = async (files: string[]) => {
  const dir = await mkdtemp(join(tmpdir(), 'pp-bundle-'))
  copies.push(dir)
  for (const file of files) await cp(join(root, file), join(dir, file), { recursive: true })
  return dir
}

// The nightly SEO refresh and the monthly news report run on the server with only the files the
// deploy copies there. A hand-written list missed shared/countries.mjs (0.0.74) and the refresh
// failed every night (found 2026-11-11). The list now follows the imports.
describe('bundleFiles', () => {
  it('follows every relative import, also shared/countries.mjs behind shared/seo.mjs', () => {
    const files = bundleFiles(root, ['scripts/seo-snapshot.mjs'])
    expect(files).toEqual(expect.arrayContaining([
      'scripts/seo-snapshot.mjs', 'scripts/lib/seo-snapshot.mjs', 'scripts/lib/archive-source.mjs',
      'shared/seo.mjs', 'shared/archive-schema.mjs', 'shared/tour-access.mjs', 'shared/countries.mjs'
    ]))
  })

  it.each([
    ['the SEO refresh', 'scripts/seo-snapshot.mjs', ['scripts/lib/seo-snapshot.mjs', 'shared/seo.mjs', 'scripts/lib/archive-source.mjs']],
    ['the news report', 'scripts/news-report.mjs', ['scripts/lib/news-report.mjs', 'shared/seo.mjs', 'scripts/lib/archive-source.mjs']]
  ])('gives %s every module it needs on its own', async (_name, entry, modules) => {
    const dir = await copyBundle(bundleFiles(root, [entry]))
    for (const module of modules) await expect(import(pathToFileURL(join(dir, module)).href)).resolves.toBeTruthy()
  })
})
