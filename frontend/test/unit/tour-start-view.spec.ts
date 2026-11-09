import { describe, expect, it } from 'vitest'
import { START_VIEW_FILE, projectStartView, startPanorama, vFovForZoom } from '../../scripts/lib/tour-start-view.mjs'

// The flat room picture of a tour (2026-11-09): what the viewer shows first, cut out of the
// start panorama, for the newsletter modal.

const tour = {
  start: { room: 'building_01/floor_01/room_01', position: '02', height: 'high' },
  buildings: [{
    id: 'building_01',
    floors: [{
      id: 'building_01/floor_01',
      rooms: [{
        id: 'building_01/floor_01/room_01',
        positions: [
          { id: '01', heights: { normal: { image: 'r1/normal/01.webp', startView: { yaw: 1, pitch: 0 } } } },
          {
            id: '02',
            heights: {
              normal: { image: 'r1/normal/02.webp', startView: { yaw: 2, pitch: 0.1 }, startZoom: 40 },
              high: { image: 'r1/high/02.webp', tiles: { folder: 'r1/high/02.tiles', fallback: '8192.webp' } }
            }
          }
        ]
      }]
    }]
  }]
}

describe('startPanorama', () => {
  it('finds the start position and height, its full panorama and the view the viewer opens with', () => {
    // `high` has no start view or zoom of its own: the viewer takes those of `normal`.
    expect(startPanorama(tour)).toEqual({ file: 'r1/high/02.tiles/8192.webp', yaw: 2, pitch: 0.1, zoom: 40 })
  })

  it('uses the plain image when the panorama has no tiles, and zoom 50 by default', () => {
    const plain = { ...tour, start: { room: 'building_01/floor_01/room_01', position: '01', height: 'normal' } }
    expect(startPanorama(plain)).toEqual({ file: 'r1/normal/01.webp', yaw: 1, pitch: 0, zoom: 50 })
  })

  it('names the file the site reads', () => {
    expect(START_VIEW_FILE).toBe('start-view.jpg')
  })
})

describe('vFovForZoom', () => {
  it('follows the viewer: 90° at zoom 0, 60° at 50, 30° at 100', () => {
    expect(vFovForZoom(0)).toBe(90)
    expect(vFovForZoom(50)).toBe(60)
    expect(vFovForZoom(100)).toBe(30)
  })
})

describe('projectStartView', () => {
  // A panorama 360 px wide: the red channel is the column (one per degree of longitude),
  // the green channel the row.
  const W = 360
  const H = 180
  const panorama = { data: new Uint8Array(W * H * 3), width: W, height: H, channels: 3 }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3
      panorama.data[i] = Math.round(x * 255 / (W - 1))
      panorama.data[i + 1] = Math.round(y * 255 / (H - 1))
    }
  }
  const centre = (out: Uint8Array, width: number, height: number) => {
    const i = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 3
    return { column: out[i]! * (W - 1) / 255, row: out[i + 1]! * (H - 1) / 255 }
  }

  it('looks at the middle of the panorama at yaw 0, pitch 0', () => {
    const out = projectStartView(panorama, { yaw: 0, pitch: 0, vFov: 60, width: 40, height: 30 })
    expect(out).toHaveLength(40 * 30 * 3)
    const { column, row } = centre(out, 40, 30)
    expect(column).toBeCloseTo(W / 2, -1)
    expect(row).toBeCloseTo(H / 2, -1)
  })

  it('turns right with a growing yaw and up with a growing pitch', () => {
    const out = projectStartView(panorama, { yaw: Math.PI / 2, pitch: 0.5, vFov: 60, width: 40, height: 30 })
    const { column, row } = centre(out, 40, 30)
    expect(column).toBeCloseTo(W * 0.75, -1)
    expect(row).toBeCloseTo(H / 2 - 0.5 * 180 / Math.PI, -1)
  })

  it('keeps straight lines upright: the left and right edges of the middle row are mirror images', () => {
    const out = projectStartView(panorama, { yaw: 0, pitch: 0, vFov: 60, width: 41, height: 31 })
    const at = (x: number) => out[(15 * 41 + x) * 3]! * (W - 1) / 255
    expect(at(0) + at(40)).toBeCloseTo(W, -1)
  })
})
