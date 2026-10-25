// Just enough PNG for the kit, on Node built-ins: decode a screenshot, cut a
// part out, find the Simulator's calibration marks, and measure how hard a
// card's shadow ends.
import { readFileSync, writeFileSync } from 'node:fs'
import { deflateSync, inflateSync } from 'node:zlib'

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

/** → { width, height, data: RGBA bytes }. 8- and 16-bit RGB(A), grey(A),
 *  no interlacing — what Playwright, safaridriver and simctl write. */
export function readPng(file) {
  const buf = readFileSync(file)
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error(`${file}: not a PNG`)
  let pos = 8
  let width, height, depth, type, interlace
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const name = buf.toString('ascii', pos + 4, pos + 8)
    const body = buf.subarray(pos + 8, pos + 8 + len)
    if (name === 'IHDR') {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      depth = body[8]
      type = body[9]
      interlace = body[12]
    } else if (name === 'IDAT') idat.push(body)
    else if (name === 'IEND') break
    pos += 12 + len
  }
  if (interlace) throw new Error(`${file}: interlaced PNG`)
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[type]
  if (!channels || (depth !== 8 && depth !== 16)) throw new Error(`${file}: PNG type ${type}/${depth} not handled`)
  const bpp = channels * (depth / 8)
  const stride = width * bpp
  const raw = inflateSync(Buffer.concat(idat))
  const rows = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const out = rows.subarray(y * stride, (y + 1) * stride)
    const prev = y ? rows.subarray((y - 1) * stride, y * stride) : null
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0
      const b = prev ? prev[i] : 0
      const c = prev && i >= bpp ? prev[i - bpp] : 0
      let v = src[i]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      out[i] = v & 255
    }
  }
  const data = Buffer.alloc(width * height * 4)
  const step = depth / 8
  for (let p = 0; p < width * height; p++) {
    const at = (ch) => rows[p * bpp + ch * step]
    const grey = channels <= 2
    data[p * 4] = at(0)
    data[p * 4 + 1] = grey ? at(0) : at(1)
    data[p * 4 + 2] = grey ? at(0) : at(2)
    data[p * 4 + 3] = channels === 4 ? at(3) : channels === 2 ? at(1) : 255
  }
  return { width, height, data }
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (name, body) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(body.length)
  const nameBody = Buffer.concat([Buffer.from(name, 'ascii'), body])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(nameBody))
  return Buffer.concat([len, nameBody, crc])
}

export function writePng(file, { width, height, data }) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  // Filter "Up" on every row (each byte minus the one above): screenshots
  // compress several times better than unfiltered.
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    const out = y * (stride + 1)
    raw[out] = y ? 2 : 0
    for (let i = 0; i < stride; i++) raw[out + 1 + i] = (data[y * stride + i] - (y ? data[(y - 1) * stride + i] : 0)) & 255
  }
  writeFileSync(file, Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]))
}

/** A rectangle in pixels, clamped to the image. */
export function crop(img, { x, y, width, height }) {
  const x0 = Math.max(0, Math.round(x))
  const y0 = Math.max(0, Math.round(y))
  const w = Math.max(1, Math.min(img.width - x0, Math.round(width)))
  const h = Math.max(1, Math.min(img.height - y0, Math.round(height)))
  const data = Buffer.alloc(w * h * 4)
  for (let row = 0; row < h; row++) img.data.copy(data, row * w * 4, ((y0 + row) * img.width + x0) * 4, ((y0 + row) * img.width + x0 + w) * 4)
  return { width: w, height: h, data, x: x0, y: y0 }
}

/** Centre of the pixels that pass `test(r, g, b)` at or below row `fromY`, or null. */
export function findMark(img, test, fromY = 0) {
  let sx = 0
  let sy = 0
  let n = 0
  for (let y = Math.max(0, Math.round(fromY)); y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4
      if (test(img.data[i], img.data[i + 1], img.data[i + 2])) { sx += x; sy += y; n++ }
    }
  }
  return n > 20 ? { x: sx / n, y: sy / n, n } : null
}

const lum = (img, x, y) => {
  const i = (y * img.width + x) * 4
  return 0.2126 * img.data[i] + 0.7152 * img.data[i + 1] + 0.0722 * img.data[i + 2]
}

/** How hard the shadow ends on each side of a card. `inner` is the card's box
 *  inside the crop, in pixels. For each side it walks outward from the card
 *  edge, averages the brightness of every line parallel to that edge (the
 *  middle 70 % of it), and keeps the biggest step between two neighbouring
 *  lines, past the first 2 px and up to `reach[side]` px out. A soft shadow
 *  fades in steps of well under 1 level; a clipped one jumps by several
 *  levels at one line.
 *  → { bottom, top, left, right }: { jump, at } (jump in 0–255 levels, at = px from the edge) */
export function shadowEdges(img, inner, reach = {}) {
  const out = {}
  const sides = {
    bottom: { from: inner.y + inner.height, to: img.height - 1, dir: 1, along: [inner.x, inner.x + inner.width], horizontal: true },
    top: { from: inner.y - 1, to: 0, dir: -1, along: [inner.x, inner.x + inner.width], horizontal: true },
    right: { from: inner.x + inner.width, to: img.width - 1, dir: 1, along: [inner.y, inner.y + inner.height], horizontal: false },
    left: { from: inner.x - 1, to: 0, dir: -1, along: [inner.y, inner.y + inner.height], horizontal: false },
  }
  for (const [side, s] of Object.entries(sides)) {
    const span = s.along[1] - s.along[0]
    const a0 = Math.round(s.along[0] + span * 0.15)
    const a1 = Math.round(s.along[1] - span * 0.15)
    const steps = Math.min(Math.abs(s.to - s.from), reach[side] ?? Infinity)
    if (steps < 6 || a1 - a0 < 4) { out[side] = null; continue }
    const profile = []
    for (let k = 0; k <= steps; k++) {
      const line = s.from + k * s.dir
      let sum = 0
      for (let a = a0; a < a1; a++) sum += s.horizontal ? lum(img, a, line) : lum(img, line, a)
      profile.push(sum / (a1 - a0))
    }
    let jump = 0
    let at = null
    for (let k = 3; k < profile.length; k++) {
      const d = Math.abs(profile[k] - profile[k - 1])
      if (d > jump) { jump = d; at = k }
    }
    out[side] = { jump: Math.round(jump * 10) / 10, at }
  }
  return out
}
