// What every driver shares: find (or start) the kit's server, open a job's
// page, answer the probe's checkpoints (screenshot, close-ups, hover series,
// shadow-edge numbers), wait for the report.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { PORT, QA_DIR, ROUTES } from '../config.mjs'
import { crop, readPng, shadowEdges, writePng } from '../png.mjs'

export const BASE = `http://127.0.0.1:${PORT}`
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** CLI: --only start,exhibition   (route keys from config.mjs) */
export function args() {
  const a = process.argv.slice(2)
  const val = (k) => {
    const i = a.indexOf(k)
    return i >= 0 ? a[i + 1] : null
  }
  return { only: val('--only')?.split(','), flags: new Set(a.filter((x) => x.startsWith('--'))), val }
}

export const jobs = ({ only } = {}) => (only ? ROUTES.filter((r) => only.includes(r.key)) : ROUTES)

export function jobUrl(job, runner, { hover = 'forced', markers = false } = {}) {
  const q = new URLSearchParams({ qa_runner: runner, qa_job: job.key, qa_tasks: job.tasks.join(','), qa_hover: hover, qa_driver: '1' })
  if (markers) q.set('qa_markers', '1')
  return `${BASE}${job.path}?${q}`
}

async function getRun() {
  try {
    return await (await fetch(`${BASE}/__qa/api/run`)).json()
  } catch {
    return null
  }
}

const children = new Set()

/** Use a running server, or start one for the lifetime of this process.
 *  Call it again before each job: if the server is gone, a new one starts
 *  and writes into the same run folder. */
export async function ensureServer() {
  let run = await getRun()
  if (!run) {
    const child = spawn(process.execPath, [resolve(QA_DIR, 'server.mjs')], { stdio: 'inherit', env: process.env })
    children.add(child)
    for (let i = 0; i < 50 && !run; i++) {
      await sleep(200)
      run = await getRun()
    }
    if (!run) throw new Error('server did not start')
  }
  process.env.QA_RUN_ID = run.runId
  return { ...run, stop: () => children.forEach((c) => c.kill()) }
}

export function shotDir(runDir, runner, jobKey) {
  const dir = resolve(runDir, runner.replace(/[^a-zA-Z0-9._-]+/g, '_'), 'shots', jobKey)
  mkdirSync(dir, { recursive: true })
  return dir
}

/** Poll the server for this runner's checkpoints; answer each with
 *  `handle(cp) → { files, meta }`. Returns stop(). */
export function answerCheckpoints(runner, handle) {
  let stopped = false
  ;(async () => {
    while (!stopped) {
      try {
        const pending = await (await fetch(`${BASE}/__qa/api/pending?runner=${encodeURIComponent(runner)}`)).json()
        for (const cp of pending) {
          let result = { files: [], meta: null }
          try {
            result = await handle(cp)
          } catch (e) {
            console.error(`[${runner}] checkpoint ${cp.name} failed: ${e.message}`)
            result.meta = { error: e.message }
          }
          await fetch(`${BASE}/__qa/api/ack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cp.id, ...result }) })
        }
      } catch { /* server busy: try again */ }
      await sleep(120)
    }
  })()
  return () => {
    stopped = true
  }
}

export async function waitForReport(runner, job, timeoutMs = 6 * 60 * 1000, since = Date.now()) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    try {
      const s = await (await fetch(`${BASE}/__qa/api/report/status?runner=${encodeURIComponent(runner)}&job=${encodeURIComponent(job)}&since=${since}`)).json()
      if (s.done) return s.file
    } catch { /* keep waiting */ }
    await sleep(1000)
  }
  return null
}

/** Viewport px → image px. Default: the image IS the viewport (Playwright,
 *  safaridriver). The Simulator's screenshot is the whole phone screen, so
 *  its driver passes the mapping it measured from the calibration marks. */
const defaultMapping = (img, cp) => ({ scale: img.width / cp.viewport.width, ox: 0, oy: 0 })

const edgesOf = (part, c, scale, shift = { x: 0, y: 0 }) => {
  const inner = {
    x: Math.round(c.inner.x * scale + shift.x), y: Math.round(c.inner.y * scale + shift.y),
    width: Math.round(c.inner.width * scale), height: Math.round(c.inner.height * scale),
  }
  const reach = Object.fromEntries(Object.entries(c.reach || {}).map(([k, v]) => [k, Math.round(v * scale)]))
  return { scale, ...shadowEdges(part, inner, reach) }
}

/** One checkpoint, the same way for every driver.
 *  io: { screenshot(file), screenshotClip(file, clip) | null, pointer(x, y) | null, mapping(img, cp) | null }
 *  A hover checkpoint with a pointer: rest, then shots at each `series` time
 *  after the pointer arrives, then 300 ms after it leaves. A whole-window
 *  shot can take most of a second, so during the series a driver that can
 *  shoot just the card (`screenshotClip`) does. */
export async function takeCheckpoint(cp, dir, io) {
  const files = []
  const meta = { edges: {}, timing: {} }
  let t0 = Date.now()
  const clips = Object.entries(cp.clips || {})
  const shoot = async (label, { fast = false } = {}) => {
    meta.timing[label] = Date.now() - t0
    if (fast && io.screenshotClip && clips.length === 1) {
      const [key, c] = clips[0]
      const out = resolve(dir, `${label}--${key}.png`)
      await io.screenshotClip(out, c)
      files.push(out)
      if (c.inner) {
        const part = readPng(out)
        meta.edges[`${label}--${key}`] = edgesOf(part, c, part.width / c.width)
      }
      return
    }
    const file = resolve(dir, `${label}.png`)
    await io.screenshot(file)
    files.push(file)
    if (!clips.length) return
    const img = readPng(file)
    const map = (io.mapping || defaultMapping)(img, cp)
    for (const [key, c] of clips) {
      const px = { x: map.ox + c.x * map.scale, y: map.oy + c.y * map.scale, width: c.width * map.scale, height: c.height * map.scale }
      const part = crop(img, px)
      const out = resolve(dir, `${label}--${key}.png`)
      writePng(out, part)
      files.push(out)
      if (c.inner) meta.edges[`${label}--${key}`] = edgesOf(part, c, map.scale, { x: px.x - part.x, y: px.y - part.y })
    }
  }
  if (cp.kind === 'hover' && io.pointer) {
    await shoot(`${cp.name}-rest`)
    await io.pointer(cp.hover.x, cp.hover.y)
    t0 = Date.now()
    const series = cp.series || [300]
    for (const ms of series) {
      const wait = ms - (Date.now() - t0)
      if (wait > 0) await sleep(wait)
      // The last, settled shot is a whole window again, for context.
      await shoot(`${cp.name}-hover-${ms}ms`, { fast: ms !== series[series.length - 1] })
    }
    await io.pointer(2, 2)
    t0 = Date.now()
    await sleep(300)
    await shoot(`${cp.name}-out-300ms`, { fast: true })
  } else {
    await shoot(cp.name)
  }
  return { files, meta }
}
