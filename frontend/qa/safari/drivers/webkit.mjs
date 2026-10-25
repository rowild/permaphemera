// Playwright's WebKit build: the Safari ENGINE, not Safari. It runs headless
// and fully scripted, with a real pointer for the hover series. Chromium runs
// the same jobs as the control: a difference that shows there too is not a
// Safari problem.
//
//   node qa/safari/drivers/webkit.mjs [--only start,venue] [--profiles webkit-desktop] [--headed]
import { chromium, devices, webkit } from 'playwright'
import { answerCheckpoints, args, ensureServer, jobUrl, jobs, shotDir, takeCheckpoint, waitForReport } from './lib.mjs'

const PROFILES = {
  'webkit-desktop': { engine: webkit, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  // iPhone size, touch and UA on the macOS engine: layout only. iOS GPU and
  // memory limits need the Simulator or a phone.
  'webkit-iphone': { engine: webkit, ...devices['iPhone 15 Pro'] },
  'chromium-desktop': { engine: chromium, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  'chromium-iphone': { engine: chromium, ...devices['iPhone 15 Pro'] },
}

const { only, flags, val } = args()
const pick = val('--profiles')?.split(',')
const server = await ensureServer()
const browsers = new Map()

for (const [runner, { engine, defaultBrowserType, ...profile }] of Object.entries(PROFILES)) {
  if (pick && !pick.includes(runner)) continue
  if (!browsers.has(engine)) {
    const b = await engine.launch({ headless: !flags.has('--headed') })
    console.log(`[${engine.name()}] engine ${b.version()}`)
    browsers.set(engine, b)
  }
  const browser = browsers.get(engine)
  const touch = profile.hasTouch === true
  for (const job of jobs({ only })) {
    await ensureServer()
    const context = await browser.newContext({ ...profile, locale: 'de-AT' })
    await context.route(/matomo\.rowild\.at/, (route) => route.abort())
    const page = await context.newPage()
    const dir = shotDir(server.runDir, runner, job.key)
    page.on('pageerror', (e) => console.error(`[${runner}] pageerror: ${e.message}`))
    const stop = answerCheckpoints(runner, (cp) => takeCheckpoint(cp, dir, {
      screenshot: (file) => page.screenshot({ path: file }),
      screenshotClip: (file, c) => page.screenshot({ path: file, clip: { x: c.x, y: c.y, width: c.width, height: c.height } }),
      pointer: touch ? null : (x, y) => page.mouse.move(x, y, { steps: 3 }),
    }))
    console.log(`[${runner}] ${job.key}`)
    const t0 = Date.now()
    await page.goto(jobUrl(job, runner, { hover: touch ? 'forced' : 'real' }))
    const file = await Promise.race([
      waitForReport(runner, job.key, 6 * 60 * 1000, t0),
      new Promise((r) => page.on('crash', () => r(null))),
    ])
    stop()
    console.log(`[${runner}] ${job.key} ${file ? 'done' : 'NO REPORT (crash or timeout)'} in ${Math.round((Date.now() - t0) / 1000)} s`)
    await context.close()
  }
}
for (const b of browsers.values()) await b.close()
server.stop()
