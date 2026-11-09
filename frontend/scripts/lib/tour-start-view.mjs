// The flat room picture of a 360° tour (2026-11-09): the view the viewer opens with, cut out of
// the start panorama and saved as `start-view.jpg` beside `tour.json`. The newsletter modal shows
// it (app/components/ArchiveNewsletterInvite.vue). `pnpm tour:publish` writes it on every copy;
// `pnpm tour:start-view` writes it for tours that are already here.
//
// The viewer is Photo Sphere Viewer 5: yaw 0 looks at the middle of the equirectangular image
// and grows to the right, pitch grows upwards, and zoom z shows 90° - 0.6·z degrees of height
// (minFov 30, maxFov 90). A height without a start view or zoom of its own takes those of `normal`.

import { join } from 'node:path'
import { TOUR_START_VIEW_FILE } from '../../shared/tour-access.mjs'

export const START_VIEW_FILE = TOUR_START_VIEW_FILE
export const START_VIEW_WIDTH = 1600
export const START_VIEW_HEIGHT = 1100
const DEFAULT_ZOOM = 50

/** Vertical field of view in degrees for a viewer zoom level (0–100). */
export const vFovForZoom = (zoom) => 90 + (zoom / 100) * (30 - 90)

/** The start position's full panorama (relative to the tour folder) and the view it opens with. */
export function startPanorama(tour) {
  const { room, position, height } = tour.start ?? {}
  const rooms = (tour.buildings ?? []).flatMap((building) => building.floors ?? []).flatMap((floor) => floor.rooms ?? [])
  const spot = rooms.find((item) => item.id === room)?.positions?.find((item) => item.id === position)
  const heights = spot?.heights ?? {}
  const panorama = heights[height]
  if (!panorama) throw new Error(`tour.json: no start panorama at ${room} / ${position} / ${height}`)

  const view = panorama.startView ?? heights.normal?.startView ?? { yaw: 0, pitch: 0 }
  const file = panorama.tiles?.folder && panorama.tiles?.fallback
    ? `${panorama.tiles.folder}/${panorama.tiles.fallback}`
    : panorama.image
  return { file, yaw: view.yaw, pitch: view.pitch, zoom: panorama.startZoom ?? heights.normal?.startZoom ?? DEFAULT_ZOOM }
}

/**
 * A straight (rectilinear) view out of an equirectangular panorama, as the viewer draws it.
 * `panorama`: raw pixels { data, width, height, channels }. Returns RGB bytes, width × height × 3.
 */
export function projectStartView(panorama, { yaw, pitch, vFov, width, height }) {
  const { data, width: W, height: H, channels } = panorama
  const out = new Uint8Array(width * height * 3)
  const tanV = Math.tan((vFov * Math.PI) / 360)
  const tanH = tanV * (width / height)

  // Camera axes: forward f (yaw, pitch), right r (level), up u = f × r.
  const cp = Math.cos(pitch)
  const f = [cp * Math.sin(yaw), Math.sin(pitch), cp * Math.cos(yaw)]
  const r = [Math.cos(yaw), 0, -Math.sin(yaw)]
  const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]]

  const sample = (px, py, channel) => {
    const x0 = Math.floor(px)
    const y0 = Math.max(0, Math.min(H - 1, Math.floor(py)))
    const y1 = Math.min(H - 1, y0 + 1)
    const fx = px - x0
    const fy = Math.max(0, Math.min(1, py - y0))
    const xa = ((x0 % W) + W) % W
    const xb = (xa + 1) % W
    const at = (x, y) => data[(y * W + x) * channels + channel]
    const top = at(xa, y0) * (1 - fx) + at(xb, y0) * fx
    const bottom = at(xa, y1) * (1 - fx) + at(xb, y1) * fx
    return top * (1 - fy) + bottom * fy
  }

  for (let j = 0; j < height; j++) {
    const sy = (1 - ((j + 0.5) / height) * 2) * tanV
    for (let i = 0; i < width; i++) {
      const sx = (((i + 0.5) / width) * 2 - 1) * tanH
      const dx = f[0] + sx * r[0] + sy * u[0]
      const dy = f[1] + sx * r[1] + sy * u[1]
      const dz = f[2] + sx * r[2] + sy * u[2]
      const lon = Math.atan2(dx, dz)
      const lat = Math.atan2(dy, Math.hypot(dx, dz))
      const px = (lon / (2 * Math.PI) + 0.5) * W - 0.5
      const py = (0.5 - lat / Math.PI) * H - 0.5
      const o = (j * width + i) * 3
      out[o] = Math.round(sample(px, py, 0))
      out[o + 1] = Math.round(sample(px, py, 1))
      out[o + 2] = Math.round(sample(px, py, 2))
    }
  }
  return out
}

/** Write `start-view.jpg` into a tour folder (the folder that holds `tour.json`). */
export async function writeStartView(tourDirectory) {
  const { readFile } = await import('node:fs/promises')
  const { default: sharp } = await import('sharp')
  const tour = JSON.parse(await readFile(join(tourDirectory, 'tour.json'), 'utf8'))
  const start = startPanorama(tour)
  const { data, info } = await sharp(join(tourDirectory, start.file)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const pixels = projectStartView(
    { data, width: info.width, height: info.height, channels: info.channels },
    { yaw: start.yaw, pitch: start.pitch, vFov: vFovForZoom(start.zoom), width: START_VIEW_WIDTH, height: START_VIEW_HEIGHT }
  )
  const target = join(tourDirectory, START_VIEW_FILE)
  await sharp(Buffer.from(pixels), { raw: { width: START_VIEW_WIDTH, height: START_VIEW_HEIGHT, channels: 3 } })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(target)
  return target
}
