import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildModuleSource, viewerBuildId } from '../../scripts/lib/tour-viewer-build.mjs'
import { TOUR_VIEWER_BUILD } from '../../app/utils/tourViewerBuild'

// The viewer files keep their names, so browsers and Cloudflare kept an old
// copy for up to 4 hours after an update (2026-10-22). Their URLs therefore
// carry a fingerprint of the files: a new viewer is a new address.
describe('viewerBuildId', () => {
  it('is a short hex fingerprint that changes with either file', () => {
    const id = viewerBuildId(Buffer.from('js'), Buffer.from('css'))
    expect(id).toMatch(/^[0-9a-f]{10}$/)
    expect(viewerBuildId(Buffer.from('js'), Buffer.from('css'))).toBe(id)
    expect(viewerBuildId(Buffer.from('js2'), Buffer.from('css'))).not.toBe(id)
    expect(viewerBuildId(Buffer.from('js'), Buffer.from('css2'))).not.toBe(id)
  })
})

describe('buildModuleSource', () => {
  it('writes the fingerprint as the module the app imports', () => {
    expect(buildModuleSource('0123456789')).toContain('export const TOUR_VIEWER_BUILD = \'0123456789\'')
  })
})

describe('the copied viewer and its fingerprint', () => {
  const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url))

  it('matches the files in public/ — a copy by hand without pnpm viewer:update fails here', () => {
    const id = viewerBuildId(read('public/media/tour-viewer/tour-viewer.js'), read('public/media/tour-viewer/tour-viewer.css'))
    expect(TOUR_VIEWER_BUILD).toBe(id)
  })

  it('puts the fingerprint into both viewer URLs', () => {
    const loader = read('app/composables/useTourViewer.ts').toString()
    expect(loader).toContain('/media/tour-viewer/tour-viewer.js?v=${TOUR_VIEWER_BUILD}')
    expect(loader).toContain('/media/tour-viewer/tour-viewer.css?v=${TOUR_VIEWER_BUILD}')
  })
})
