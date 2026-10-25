// Real Safari on this Mac, through Apple's safaridriver (WebDriver): real
// screenshots and a real mouse pointer for the hover series.
//
// One-time setup, by a person (a security setting):
//   Safari → Settings → Advanced → "Show features for web developers"
//   Safari → Settings → Developer → "Allow remote automation"
//
//   node qa/safari/drivers/safari.mjs [--only start,venue]
import { execFileSync, spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { answerCheckpoints, args, ensureServer, jobUrl, jobs, shotDir, sleep, takeCheckpoint, waitForReport } from './lib.mjs'

const { only } = args()
const version = execFileSync('defaults', ['read', '/Applications/Safari.app/Contents/Info.plist', 'CFBundleShortVersionString'], { encoding: 'utf8' }).trim()
const runner = `mac-safari-${version}`
const server = await ensureServer()

const PORT = 4801
const driver = spawn('safaridriver', ['-p', String(PORT)], { stdio: 'ignore' })
await sleep(1500)
const wd = async (method, path, body) => {
  const r = await fetch(`http://127.0.0.1:${PORT}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  const json = await r.json()
  if (json.value?.error) throw new Error(`${json.value.error}: ${json.value.message}`)
  return json.value
}

let session
try {
  session = (await wd('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'safari' } } })).sessionId
} catch (e) {
  console.error(`[${runner}] could not start a session: ${e.message}`)
  console.error('Enable it once: Safari → Settings → Developer → "Allow remote automation".')
  driver.kill()
  server.stop()
  process.exit(2)
}
const S = `/session/${session}`
await wd('POST', `${S}/window/rect`, { x: 0, y: 0, width: 1440, height: 980 })
// Safari hands the driver's mouse moves to the page only while its window
// has focus; with another app in front, hover never happens.
const focusSafari = () => {
  try {
    execFileSync('osascript', ['-e', 'tell application "Safari" to activate'])
  } catch { /* no permission to script Safari: hover may not happen */ }
}
const pointer = (x, y) => {
  focusSafari()
  return wd('POST', `${S}/actions`, {
    actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 60, x: Math.round(x), y: Math.round(y), origin: 'viewport' }] }],
  })
}

try {
  for (const job of jobs({ only })) {
    await ensureServer()
    const dir = shotDir(server.runDir, runner, job.key)
    const stop = answerCheckpoints(runner, (cp) => takeCheckpoint(cp, dir, {
      screenshot: async (file) => writeFileSync(file, Buffer.from(await wd('GET', `${S}/screenshot`), 'base64')),
      pointer,
    }))
    console.log(`[${runner}] ${job.key}`)
    const t0 = Date.now()
    focusSafari()
    await wd('POST', `${S}/url`, { url: jobUrl(job, runner, { hover: 'real' }) })
    const file = await waitForReport(runner, job.key, 6 * 60 * 1000, t0)
    stop()
    console.log(`[${runner}] ${job.key} ${file ? 'done' : 'NO REPORT'} in ${Math.round((Date.now() - t0) / 1000)} s`)
  }
} finally {
  await wd('DELETE', S).catch(() => {})
  driver.kill()
  server.stop()
}
