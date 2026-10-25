// The kit's server, Node built-ins only. Two jobs:
//
// 1. Relay the site under test (TARGET) and put the probe into every page.
//    Pages then come from http://127.0.0.1:PORT/…, so the app's Directus URL
//    is pointed back through this relay too (the API answers no CORS for a
//    foreign origin). Each visit stores "all cookies declined", so no cookie
//    notice covers a screenshot and no test visit reaches the statistics.
// 2. Collect: the probe asks for screenshots (checkpoints) that a driver
//    answers, and files its report into results/<run>/<runner>/<job>.json.
//
//   node qa/safari/server.mjs [--lan]     --lan: reachable from phones on the Wi-Fi
import { createServer } from 'node:http'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { resolve } from 'node:path'
import { DIRECTUS, PORT, QA_DIR, RESULTS_DIR, ROUTES, TARGET, probeConfig } from './config.mjs'

const lan = process.argv.includes('--lan')
const runId = process.env.QA_RUN_ID || new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
const runDir = resolve(RESULTS_DIR, runId)
mkdirSync(runDir, { recursive: true })

const safe = (s) => String(s || 'unknown').replace(/[^a-zA-Z0-9._-]+/g, '_')
const checkpoints = new Map()
let nextId = 1
const reports = new Map() // `${runner}|${job}` → { file, at }

const readBody = (req) => new Promise((ok, fail) => {
  const parts = []
  req.on('data', (c) => parts.push(c))
  req.on('end', () => ok(Buffer.concat(parts)))
  req.on('error', fail)
})
const json = (res, value, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(value))
}

function lanAddress() {
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) return a.address
  }
  return '127.0.0.1'
}

/** A page of links for a phone or tablet by hand (no driver, no screenshots). */
function indexPage(host) {
  const runner = 'device'
  const rows = ROUTES.map((r) => {
    const q = new URLSearchParams({ qa_runner: runner, qa_job: r.key, qa_tasks: r.tasks.join(','), qa_hover: 'forced' })
    return `<li><a href="${r.path}?${q}">${r.key}</a> <small>${r.path}</small></li>`
  }).join('')
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Safari review</title>
<body style="font:17px/1.5 -apple-system,sans-serif;margin:24px"><h1 style="font-size:22px">Safari review — run ${runId}</h1>
<p>Tap one page. It runs its checks by itself and shows "done" in the top corner. Then come back and tap the next.</p>
<ol>${rows}</ol><p><small>Target: ${TARGET} · via ${host}</small></p>`
}

async function relay(req, res) {
  const host = req.headers.host
  const local = `http://${host}`
  // /cms/… is the Directus the pages read (DIRECTUS); everything else is the site.
  const url = req.url === '/cms' || req.url.startsWith('/cms/')
    ? new URL(`${DIRECTUS}${req.url.slice('/cms'.length)}`)
    : new URL(req.url, TARGET)
  const headers = {}
  for (const [k, v] of Object.entries(req.headers)) {
    if (!['host', 'connection', 'accept-encoding', 'origin', 'referer'].includes(k)) headers[k] = v
  }
  if (req.headers.referer) headers.referer = req.headers.referer.replace(local, TARGET)
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req)
  let upstream
  try {
    upstream = await fetch(url, { method: req.method, headers, body, redirect: 'manual' })
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end(`relay: ${e.message}`)
    return
  }
  const out = {}
  upstream.headers.forEach((v, k) => {
    if (['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive', 'strict-transport-security', 'alt-svc', 'content-security-policy', 'set-cookie'].includes(k)) return
    out[k] = k === 'location' ? v.replace(TARGET, local) : v
  })
  const cookies = upstream.headers.getSetCookie?.() || []
  if (cookies.length) out['set-cookie'] = cookies.map((c) => c.replace(/;\s*secure/gi, '').replace(/;\s*domain=[^;]*/gi, '').replace(/samesite=none/gi, 'SameSite=Lax'))
  let buf = Buffer.from(await upstream.arrayBuffer())
  if ((upstream.headers.get('content-type') || '').includes('text/html')) {
    const html = buf.toString('utf8')
      .split(DIRECTUS).join(`${local}/cms`)
      .replace(/<head>/i, '<head><script src="/__qa/probe.js"></script>')
    buf = Buffer.from(html)
    out['cache-control'] = 'no-store'
  }
  res.writeHead(upstream.status, out)
  res.end(req.method === 'HEAD' ? undefined : buf)
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const p = url.pathname
  try {
    if (p === '/__qa/probe.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' })
      res.end(`window.__QA_CONFIG__ = ${JSON.stringify(probeConfig())};\n${readFileSync(resolve(QA_DIR, 'probe.js'), 'utf8')}`)
    } else if (p === '/__qa/' || p === '/__qa') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(indexPage(req.headers.host))
    } else if (p === '/__qa/api/run') {
      json(res, { runId, runDir, target: TARGET })
    } else if (p === '/__qa/api/checkpoint' && req.method === 'POST') {
      const cp = JSON.parse(await readBody(req))
      const id = String(nextId++)
      checkpoints.set(id, { ...cp, id, at: Date.now(), taken: false, done: false })
      json(res, { id })
    } else if (p === '/__qa/api/checkpoint') {
      const cp = checkpoints.get(url.searchParams.get('id'))
      json(res, cp ? { done: cp.done, files: cp.files || [] } : { done: true, missing: true })
    } else if (p === '/__qa/api/pending') {
      const runner = url.searchParams.get('runner')
      const list = [...checkpoints.values()].filter((c) => c.runner === runner && !c.taken)
      for (const c of list) c.taken = true
      json(res, list)
    } else if (p === '/__qa/api/ack' && req.method === 'POST') {
      const { id, files, meta } = JSON.parse(await readBody(req))
      const cp = checkpoints.get(id)
      if (cp) {
        Object.assign(cp, { done: true, files: files || [], meta: meta || null })
        const dir = resolve(runDir, safe(cp.runner))
        mkdirSync(dir, { recursive: true })
        const { runner, job, name, kind, clips, viewport } = cp
        appendFileSync(resolve(dir, 'checkpoints.jsonl'), `${JSON.stringify({ runner, job, name, kind, clips, viewport, files: cp.files, meta: cp.meta })}\n`)
      }
      json(res, { ok: true })
    } else if (p === '/__qa/api/report' && req.method === 'POST') {
      const report = JSON.parse(await readBody(req))
      const dir = resolve(runDir, safe(report.runner))
      mkdirSync(dir, { recursive: true })
      const file = resolve(dir, `${safe(report.job)}.json`)
      writeFileSync(file, JSON.stringify({ ...report, receivedAt: new Date().toISOString(), userAgentHeader: req.headers['user-agent'] }, null, 2))
      reports.set(`${report.runner}|${report.job}`, { file, at: Date.now() })
      console.log(`[server] report ${report.runner} / ${report.job}`)
      json(res, { file })
    } else if (p === '/__qa/api/report/status') {
      const r = reports.get(`${url.searchParams.get('runner')}|${url.searchParams.get('job')}`)
      const since = Number(url.searchParams.get('since') || 0)
      json(res, r && r.at >= since ? { done: true, file: r.file } : { done: false })
    } else {
      await relay(req, res)
    }
  } catch (e) {
    console.error('[server]', req.method, req.url, e)
    if (!res.headersSent) json(res, { error: e.message }, 500)
    else res.end()
  }
})

// A browser that drops a connection (a closed tab, a crashed WebContent
// process) must not take the server down with it.
server.on('clientError', (e, socket) => socket.destroy())
process.on('uncaughtException', (e) => console.error('[server] uncaught:', e))
process.on('unhandledRejection', (e) => console.error('[server] unhandled:', e))
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(sig, () => {
    console.log(`[server] stopped by ${sig}`)
    process.exit(0)
  })
}

server.listen(PORT, lan ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`[server] run ${runId} → ${runDir}`)
  console.log(`[server] relaying ${TARGET} at http://127.0.0.1:${PORT}/`)
  if (lan) console.log(`[server] on a phone or tablet (same Wi-Fi), open: http://${lanAddress()}:${PORT}/__qa/`)
})
