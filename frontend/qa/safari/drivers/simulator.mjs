// Real Mobile Safari in the iOS Simulator: the exact WebKit of each iOS
// release (the same engine as the Mac Safari of that number), on this Mac's
// GPU. One simulator at a time, booted headless (no Simulator window), shut
// down when its jobs are done. Devices are created once and reused; this
// script never deletes one.
//
//   node qa/safari/drivers/simulator.mjs [--ios 27,26,18] [--only start,venue]
//
// iOS has no hover: cards are shown in their hover state by copying the
// :hover rules onto a class (probe.js, "forced"). That checks how the engine
// DRAWS the hover state, which is what a Mac or an iPad with a trackpad shows.
// The screenshot is the whole phone screen; two coloured marks drawn by the
// probe tell where the page sits in it, so close-ups can be cut.
import { execFileSync } from 'node:child_process'
import { answerCheckpoints, args, ensureServer, jobUrl, jobs, shotDir, sleep, takeCheckpoint, waitForReport } from './lib.mjs'
import { findMark, readPng } from '../png.mjs'

const DEVICE_TYPE = 'com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro'
const simctl = (...a) => execFileSync('xcrun', ['simctl', ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

const { only, val } = args()
const majors = (val('--ios') || '27,26,18').split(',')
const runtimes = JSON.parse(simctl('list', 'runtimes', '-j')).runtimes
  .filter((r) => r.platform === 'iOS' && r.isAvailable && majors.includes(r.version.split('.')[0]))
  .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
if (!runtimes.length) {
  console.error(`[sim] no iOS runtime for ${majors.join(', ')} installed.`)
  process.exit(2)
}

// P3 screenshots shift pure colours a little, so the tests are loose.
const MAGENTA = (r, g, b) => r > 200 && g < 100 && b > 200
const GREEN = (r, g, b) => g > 200 && r < 160 && b < 140

const server = await ensureServer()

for (const rt of runtimes) {
  const name = `QA Web Safari iPhone 16 Pro (iOS ${rt.version})`
  const devices = JSON.parse(simctl('list', 'devices', '-j')).devices[rt.identifier] || []
  let udid = devices.find((d) => d.name === name)?.udid
  if (!udid) udid = simctl('create', name, DEVICE_TYPE, rt.identifier).trim()
  console.log(`[sim] iOS ${rt.version} → ${udid}`)
  try {
    simctl('boot', udid)
  } catch (e) {
    if (!/current state: Booted/.test(e.stderr)) throw e
  }
  simctl('bootstatus', udid, '-b')
  try {
    simctl('status_bar', udid, 'override', '--time', '9:41', '--batteryState', 'charged', '--batteryLevel', '100')
  } catch { /* cosmetic */ }
  await sleep(3000)

  const runner = `ios-sim-${rt.version}`
  try {
    for (const job of jobs({ only })) {
      await ensureServer()
      const dir = shotDir(server.runDir, runner, job.key)
      let mapping = null
      const stop = answerCheckpoints(runner, async (cp) => {
        const result = await takeCheckpoint(cp, dir, {
          screenshot: async (file) => simctl('io', udid, 'screenshot', '--type=png', file),
          pointer: null,
          mapping: mapping ? () => mapping : null,
        })
        if (cp.kind === 'calibrate' && cp.marks?.length === 2) {
          const img = readPng(result.files[0])
          const [m1, m2] = cp.marks
          const a = findMark(img, MAGENTA)
          // The green mark sits lower on the page; above it the status bar's
          // battery icon is green too.
          const b = a && findMark(img, GREEN, a.y + 20)
          if (a && b) {
            const scale = (b.x - a.x) / (m2.x - m1.x)
            mapping = { scale, ox: a.x - m1.x * scale, oy: a.y - m1.y * scale, scaleY: (b.y - a.y) / (m2.y - m1.y) }
          }
          result.meta.calibration = mapping || { failed: true, a, b }
          console.log(`[${runner}] calibration ${mapping ? `scale ${mapping.scale.toFixed(3)} (y ${mapping.scaleY.toFixed(3)}), page at ${Math.round(mapping.ox)},${Math.round(mapping.oy)} px` : 'FAILED'}`)
        }
        return result
      })
      console.log(`[${runner}] ${job.key}`)
      const t0 = Date.now()
      simctl('openurl', udid, jobUrl(job, runner, { hover: 'forced', markers: true }))
      const file = await waitForReport(runner, job.key, 6 * 60 * 1000, t0)
      stop()
      if (!file) {
        // No report: the tab crashed or hung. Keep a picture of the screen.
        try {
          simctl('io', udid, 'screenshot', '--type=png', `${dir}/no-report.png`)
        } catch { /* ignore */ }
      }
      console.log(`[${runner}] ${job.key} ${file ? 'done' : 'NO REPORT (crash, hang or timeout)'} in ${Math.round((Date.now() - t0) / 1000)} s`)
      try {
        simctl('terminate', udid, 'com.apple.mobilesafari')
      } catch { /* not running */ }
      await sleep(1500)
    }
  } finally {
    simctl('shutdown', udid)
    console.log(`[sim] iOS ${rt.version} shut down`)
  }
}
server.stop()
