// The probe: runs inside every relayed page, before the app (server.mjs puts
// it first in <head>). Without qa_* parameters it only declines the cookies
// and stays silent. With them it waits for the page, runs its tasks, asks
// the driver for screenshots (checkpoints) and files one report.
//
// Parameters: qa_runner, qa_job, qa_tasks (fonts,gradients,cards,tour),
// qa_hover (real = the driver moves a pointer; forced = the :hover rules are
// copied onto a class; none), qa_driver=1 (a driver answers checkpoints),
// qa_markers=1 (draw calibration marks for the Simulator's screenshots).
//
// Plain ES2017 on purpose: it must run in every Safari under review.
;(function () {
  'use strict'
  var CONFIG = window.__QA_CONFIG__ || {}
  var t0 = performance.now()

  try {
    if (!localStorage.getItem('permaphemera-cookie-consent')) {
      localStorage.setItem('permaphemera-cookie-consent', JSON.stringify({ analytics: 'denied', googleMaps: 'denied', youtube: 'denied', savedAt: Date.now(), version: 2 }))
    }
  } catch (e) { /* private mode: the notice may show */ }

  var params = new URLSearchParams(location.search)
  var runner = params.get('qa_runner')
  if (!runner) return
  var job = params.get('qa_job') || location.pathname
  var tasks = (params.get('qa_tasks') || 'fonts').split(',')
  var hoverMode = params.get('qa_hover') || 'forced'
  var hasDriver = params.get('qa_driver') === '1'
  var markers = params.get('qa_markers') === '1'
  // German is the default locale; a set cookie keeps i18n from redirecting.
  document.cookie = 'permaphemera-locale=' + (location.pathname.indexOf('/en/') === 0 ? 'en' : 'de') + '; path=/'

  var errors = []
  var pushError = function (entry) { if (errors.length < 60) errors.push(entry) }
  window.addEventListener('error', function (e) {
    var t = e.target
    if (t && t !== window && (t.src || t.href)) pushError({ type: 'resource', message: (t.tagName || '') + ' failed: ' + (t.src || t.href) })
    else pushError({ type: 'error', message: String(e.message), at: (e.filename || '') + ':' + (e.lineno || '') })
  }, true)
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason
    pushError({ type: 'rejection', message: String((r && (r.stack || r.message)) || r).slice(0, 400) })
  })
  var consoleError = console.error
  console.error = function () {
    pushError({ type: 'console.error', message: Array.prototype.map.call(arguments, String).join(' ').slice(0, 400) })
    return consoleError.apply(console, arguments)
  }

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms) }) }
  var round = function (n) { return Math.round(n * 10) / 10 }
  var post = function (path, body) {
    return fetch('/__qa/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json() })
  }

  // ---- status badge (for runs by hand on a device) --------------------------
  var badge
  function status(text) {
    if (!badge && document.body) {
      badge = document.createElement('div')
      badge.setAttribute('data-qa', '')
      badge.style.cssText = 'position:fixed;right:4px;top:4px;z-index:2147483647;font:11px/1.3 -apple-system,sans-serif;background:rgba(0,0,0,.6);color:#fff;padding:2px 6px;border-radius:4px;pointer-events:none'
      document.body.appendChild(badge)
    }
    if (badge) badge.textContent = 'QA ' + job + ': ' + text
  }
  function badgeVisible(on) { if (badge) badge.style.display = on ? '' : 'none' }

  // ---- geometry ----------------------------------------------------------------
  function viewport() { return { width: window.innerWidth, height: window.innerHeight, scrollY: Math.round(window.scrollY) } }
  function rectOf(el) { var r = el.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height } }
  function grow(r, pad) { return { x: r.x - pad, y: r.y - pad, width: r.width + 2 * pad, height: r.height + 2 * pad } }
  function clampToViewport(r) {
    var x = Math.max(0, r.x)
    var y = Math.max(0, r.y)
    var right = Math.min(window.innerWidth, r.x + r.width)
    var bottom = Math.min(window.innerHeight, r.y + r.height)
    return right - x > 4 && bottom - y > 4 ? { x: round(x), y: round(y), width: round(right - x), height: round(bottom - y) } : null
  }
  function visible(el) {
    if (!el || !el.isConnected) return false
    var r = el.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) return false
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false
    }
    return true
  }
  function firstVisible(selector) {
    var list = document.querySelectorAll(selector)
    for (var i = 0; i < list.length; i++) if (visible(list[i])) return list[i]
    // A card in a closed slider or below a lazy section: take the first one anyway.
    return list[0] || null
  }
  function describe(el) {
    if (!el) return null
    var cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(function (c) { return c && c !== '[' && c !== ']' && c.indexOf(':') < 0 && c.indexOf('[') < 0 }).slice(0, 3).join('.') : ''
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '')
  }
  async function scrollToCenter(el) {
    el.scrollIntoView({ block: 'center', inline: 'center' })
    await sleep(80)
    // Nested sliders: also bring the element into the window horizontally.
    var r = el.getBoundingClientRect()
    if (r.left < 0 || r.right > window.innerWidth) el.scrollIntoView({ block: 'center', inline: 'nearest' })
    await sleep(450)
  }

  // ---- checkpoints -------------------------------------------------------------
  var shots = []
  var marks = null
  function setMarks(on) {
    if (!markers) return
    if (on && !marks) {
      marks = [['#ff00ff', 20, 140], ['#00ff00', window.innerWidth - 40, 260]].map(function (m) {
        var d = document.createElement('div')
        d.setAttribute('data-qa', '')
        d.style.cssText = 'position:fixed;z-index:2147483647;width:12px;height:12px;pointer-events:none;background:' + m[0] + ';left:' + m[1] + 'px;top:' + m[2] + 'px'
        document.body.appendChild(d)
        return { el: d, color: m[0], x: m[1] + 6, y: m[2] + 6 }
      })
    } else if (!on && marks) {
      marks.forEach(function (m) { m.el.remove() })
      marks = null
    }
  }
  /** Ask the driver for a screenshot. `clips`: { key: viewport rect }, each
   *  optionally with `inner` (the element inside the clip, for edge checks). */
  async function checkpoint(name, opts) {
    opts = opts || {}
    var entry = { name: name, kind: opts.kind || 'shot', viewport: viewport(), clips: opts.clips || {}, files: [] }
    shots.push(entry)
    if (!hasDriver) return entry
    badgeVisible(false)
    if (opts.kind === 'calibrate') setMarks(true)
    await sleep(opts.settleMs || 120)
    var cp = await post('checkpoint', {
      runner: runner, job: job, name: name, kind: entry.kind, viewport: entry.viewport, clips: entry.clips,
      hover: opts.hover || null, series: opts.series || null, dpr: window.devicePixelRatio,
      marks: marks ? marks.map(function (m) { return { color: m.color, x: m.x, y: m.y } }) : null
    })
    var started = Date.now()
    while (Date.now() - started < 60000) {
      await sleep(150)
      var s = await fetch('/__qa/api/checkpoint?id=' + cp.id).then(function (r) { return r.json() })
      if (s.done) { entry.files = s.files; break }
    }
    setMarks(false)
    badgeVisible(true)
    return entry
  }

  // ---- waiting for the page --------------------------------------------------------
  async function quietNetwork(quietMs, maxMs) {
    var start = Date.now()
    var last = performance.getEntriesByType('resource').length
    var since = Date.now()
    while (Date.now() - start < maxMs) {
      await sleep(250)
      var n = performance.getEntriesByType('resource').length
      if (n !== last) { last = n; since = Date.now() } else if (Date.now() - since >= quietMs) return true
    }
    return false
  }
  async function imagesDone(maxMs) {
    var start = Date.now()
    while (Date.now() - start < maxMs) {
      var pending = Array.prototype.filter.call(document.images, function (i) { return !i.complete && i.loading !== 'lazy' })
      if (!pending.length) return true
      await sleep(250)
    }
    return false
  }
  async function walkPage() {
    // The start page builds its sections below the hero step by step, and
    // images load lazily: visit the whole page once, then go back up.
    var y = 0
    for (var i = 0; i < 40; i++) {
      y += Math.round(window.innerHeight * 0.85)
      window.scrollTo(0, y)
      await sleep(260)
      if (y > document.documentElement.scrollHeight) break
    }
    await quietNetwork(800, 8000)
    window.scrollTo(0, 0)
    await sleep(500)
  }
  async function pageReady() {
    while (document.readyState !== 'complete') await sleep(100)
    var start = Date.now()
    while (!document.querySelector('main') && Date.now() - start < 20000) await sleep(150)
    if (document.fonts && document.fonts.ready) await document.fonts.ready
    await quietNetwork(1200, 20000)
    // Smooth scrolling (html) would turn every jump into an animation.
    document.documentElement.style.scrollBehavior = 'auto'
    await walkPage()
    await imagesDone(8000)
    await sleep(400)
  }

  // ---- environment ----------------------------------------------------------------
  function env() {
    var sup = function (p, v) { try { return CSS.supports(p, v) } catch (e) { return null } }
    var supSel = function (s) { try { return CSS.supports('selector(' + s + ')') } catch (e) { return null } }
    var gl = null
    try {
      var c = document.createElement('canvas')
      var ctx = c.getContext('webgl2') || c.getContext('webgl')
      if (ctx) {
        var dbg = ctx.getExtension('WEBGL_debug_renderer_info')
        gl = { version: ctx.getParameter(ctx.VERSION), maxTextureSize: ctx.getParameter(ctx.MAX_TEXTURE_SIZE), renderer: dbg ? ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER) }
        var lose = ctx.getExtension('WEBGL_lose_context')
        if (lose) lose.loseContext()
      }
    } catch (e) { gl = { error: e.message } }
    var mm = function (q) { return window.matchMedia(q).matches }
    return {
      userAgent: navigator.userAgent,
      viewport: [window.innerWidth, window.innerHeight],
      screen: [screen.width, screen.height],
      dpr: window.devicePixelRatio,
      media: { hover: mm('(hover: hover)'), finePointer: mm('(pointer: fine)'), reducedMotion: mm('(prefers-reduced-motion: reduce)'), dark: mm('(prefers-color-scheme: dark)'), p3: mm('(color-gamut: p3)') },
      css: {
        'container-type': sup('container-type', 'inline-size'),
        ':has()': supSel(':has(a)'),
        'backdrop-filter': sup('backdrop-filter', 'blur(2px)'),
        '-webkit-backdrop-filter': sup('-webkit-backdrop-filter', 'blur(2px)'),
        'mask-image': sup('mask-image', 'linear-gradient(black, transparent)'),
        'clip-path: url()': sup('clip-path', 'url(#x)'),
        'text-wrap: balance': sup('text-wrap', 'balance'),
        'scroll-snap-type': sup('scroll-snap-type', 'x mandatory'),
        'lvh/dvh units': sup('height', '100lvh'),
        'color-mix()': sup('color', 'color-mix(in srgb, red, blue)'),
        'font-synthesis-weight': sup('font-synthesis-weight', 'none'),
        'transform-style: preserve-3d': sup('transform-style', 'preserve-3d'),
      },
      js: {
        'Intl.DateTimeFormat#formatRange': typeof Intl.DateTimeFormat.prototype.formatRange === 'function',
        requestFullscreen: typeof document.documentElement.requestFullscreen === 'function',
        webkitRequestFullscreen: typeof document.documentElement.webkitRequestFullscreen === 'function',
      },
      webgl: gl,
    }
  }

  // ---- fonts ------------------------------------------------------------------------
  function textWidth(family, weight, style) {
    var s = document.createElement('span')
    s.setAttribute('data-qa', '')
    s.textContent = 'Hamburgefonstiv QWERTY 0123456789 Ausstellung'
    s.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:nowrap;font-size:40px;font-family:' + family + ';font-weight:' + weight + ';font-style:' + (style || 'normal')
    document.body.appendChild(s)
    var w = s.getBoundingClientRect().width
    s.remove()
    return round(w)
  }
  async function fonts() {
    var faces = []
    if (document.fonts) document.fonts.forEach(function (f) { faces.push({ family: f.family.replace(/["']/g, ''), weight: f.weight, style: f.style, status: f.status, display: f.display, range: (f.unicodeRange || '').slice(0, 30) }) })
    var cormorant = faces.filter(function (f) { return /cormorant/i.test(f.family) })
    var loadedWeights = {}
    cormorant.forEach(function (f) { if (f.status === 'loaded' && f.style === 'normal') loadedWeights[f.weight] = true })
    // Does each weight really draw in Cormorant, not in the fallback?
    var fallback = textWidth('serif', 400)
    var renders = {}
    ;[300, 400, 500].forEach(function (w) {
      var width = textWidth('"Cormorant Garamond", serif', w)
      renders[w] = { width: width, fallbackWidth: fallback, differsFromFallback: Math.abs(width - fallback) > 2 }
    })
    // Every weight/style combination the page really uses, and whether a real
    // face exists for it. No real face = the browser fakes bold or italic
    // ("synthesis"), and Safari fakes them differently from Chrome.
    var combos = {}
    var firstOf = {}
    var all = document.body.getElementsByTagName('*')
    for (var i = 0; i < all.length; i++) {
      var el = all[i]
      if (el.closest('[data-qa]') || el.closest('.exhibition-tour-modal')) continue
      var hasText = false
      for (var k = 0; k < el.childNodes.length; k++) if (el.childNodes[k].nodeType === 3 && el.childNodes[k].textContent.trim()) { hasText = true; break }
      if (!hasText) continue
      var cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      var family = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim()
      var key = family + ' | ' + cs.fontWeight + ' | ' + cs.fontStyle
      if (!combos[key]) {
        var isCormorant = /cormorant/i.test(family)
        var faked = []
        if (isCormorant && !loadedWeights[cs.fontWeight]) faked.push('weight')
        if (isCormorant && cs.fontStyle !== 'normal') faked.push('italic')
        combos[key] = {
          family: family, weight: cs.fontWeight, style: cs.fontStyle, count: 0,
          sample: el.textContent.trim().slice(0, 50), element: describe(el), synthesis: cs.fontSynthesis || null,
          faked: isCormorant ? faked.join(' + ') : null,
        }
      }
      if (!firstOf[key] && visible(el)) firstOf[key] = el
      combos[key].count++
    }
    var root = getComputedStyle(document.documentElement)
    var body = getComputedStyle(document.body)
    var fontFiles = performance.getEntriesByType('resource').filter(function (r) { return /\.(woff2?|ttf|otf)(\?|$)/.test(r.name) }).map(function (r) {
      return { file: r.name.split('/').pop(), startMs: Math.round(r.startTime), endMs: Math.round(r.responseEnd), kB: r.transferSize ? Math.round(r.transferSize / 1024) : null }
    })
    var report = {
      faces: faces, cormorantFaces: cormorant, renders: renders,
      used: Object.keys(combos).map(function (k) { return combos[k] }).sort(function (a, b) { return b.count - a.count }),
      root: {
        webkitFontSmoothing: body.webkitFontSmoothing || body.getPropertyValue('-webkit-font-smoothing') || null,
        textRendering: body.textRendering || null,
        webkitTextSizeAdjust: root.webkitTextSizeAdjust || root.getPropertyValue('-webkit-text-size-adjust') || null,
        fontSynthesis: body.fontSynthesis || null,
        fontOpticalSizing: body.fontOpticalSizing || null,
        fontKerning: body.fontKerning || null,
        fontFeatureSettings: body.fontFeatureSettings || null,
      },
      files: fontFiles,
    }
    // Close-ups: the page's main heading and a run of body text.
    var h1 = firstVisible('main h1')
    var para = Array.prototype.find.call(document.querySelectorAll('main p'), function (p) { return visible(p) && p.textContent.trim().length > 90 })
    if (h1) {
      await scrollToCenter(h1)
      var c1 = clampToViewport(grow(rectOf(h1), 6))
      if (c1) await checkpoint('font-heading', { clips: { heading: c1 } })
    }
    if (para) {
      await scrollToCenter(para)
      var c2 = clampToViewport(grow(rectOf(para), 6))
      if (c2) await checkpoint('font-body', { clips: { body: c2 } })
    }
    // Close-ups of text the browser has to fake (no italic or 600 face).
    var shown = 0
    for (var key in combos) {
      var fakedEl = firstOf[key]
      if (!combos[key].faked || !fakedEl || shown >= 3) continue
      await scrollToCenter(fakedEl)
      var c3 = clampToViewport(grow(rectOf(fakedEl), 14))
      if (c3) {
        await checkpoint('font-faked-' + combos[key].weight + '-' + combos[key].style, { clips: { text: c3 } })
        shown++
      }
    }
    return report
  }

  // ---- gradients with text ------------------------------------------------------
  var STYLE_KEYS = ['backgroundImage', 'backgroundColor', 'opacity', 'filter', 'backdropFilter', 'webkitBackdropFilter', 'mixBlendMode', 'maskImage', 'webkitMaskImage', 'clipPath', 'transform', 'willChange', 'isolation', 'position']
  function styleOf(el, keys) {
    var cs = getComputedStyle(el)
    var out = {}
    ;(keys || STYLE_KEYS).forEach(function (k) {
      var v = cs[k]
      if (v != null && v !== '' && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== 'static' && v !== 'rgba(0, 0, 0, 0)' && v !== '1') out[k] = String(v).slice(0, 260)
    })
    return out
  }
  function textOver(el) {
    var list = []
    var nodes = el.querySelectorAll('h1,h2,h3,p,a,span,strong,time,dd,dt')
    for (var i = 0; i < nodes.length && list.length < 4; i++) {
      var n = nodes[i]
      if (!visible(n) || !n.textContent.trim() || n.children.length > 2) continue
      var cs = getComputedStyle(n)
      list.push({ element: describe(n), text: n.textContent.trim().slice(0, 40), color: cs.color, textShadow: cs.textShadow !== 'none' ? cs.textShadow : null, font: cs.fontWeight + ' ' + cs.fontSize })
    }
    return list
  }
  async function gradients() {
    var out = []
    var targets = CONFIG.gradients || []
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i]
      var el = firstVisible(t.selector)
      if (!el) continue
      if (t.scrollBy) { window.scrollTo(0, t.scrollBy); await sleep(600) } else await scrollToCenter(el)
      var clip = clampToViewport(grow(rectOf(el), 2))
      var entry = { key: t.key, note: t.note, element: describe(el), rect: rectOf(el), style: styleOf(el), text: textOver(el) }
      var pseudo = {}
      ;['::before', '::after'].forEach(function (p) {
        var cs = getComputedStyle(el, p)
        if (cs.content && cs.content !== 'none' && cs.content !== 'normal') pseudo[p] = { backgroundImage: cs.backgroundImage.slice(0, 200), mixBlendMode: cs.mixBlendMode, opacity: cs.opacity, filter: cs.filter }
      })
      entry.pseudo = pseudo
      if (clip) await checkpoint('gradient-' + t.key, { clips: { region: clip } })
      out.push(entry)
    }
    window.scrollTo(0, 0)
    return out
  }

  // ---- card shadows on hover ----------------------------------------------------
  var hoverSheet = null
  /** Copy every :hover rule onto `.qa-hover`, and drop "(hover: hover)" media
   *  guards, so a touch device draws the hover state too. Same specificity,
   *  later in the cascade. */
  function installForcedHover() {
    if (hoverSheet) return
    var texts = []
    var walk = function (rules) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i]
        var txt = r.cssText || ''
        if (txt.indexOf(':hover') >= 0) texts.push(txt.replace(/:hover/g, '.qa-hover').replace(/\(\s*hover\s*:\s*hover\s*\)/g, '(min-width: 0px)'))
      }
    }
    for (var s = 0; s < document.styleSheets.length; s++) {
      try { walk(document.styleSheets[s].cssRules) } catch (e) { /* cross-origin sheet */ }
    }
    var style = document.createElement('style')
    style.setAttribute('data-qa', 'forced-hover')
    document.head.appendChild(style)
    hoverSheet = { sheet: style.sheet, copied: 0, failed: 0 }
    texts.forEach(function (t) {
      try { style.sheet.insertRule(t, style.sheet.cssRules.length); hoverSheet.copied++ } catch (e) { hoverSheet.failed++ }
    })
  }
  function setForcedHover(el, on) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) n.classList.toggle('qa-hover', on)
  }
  function dropShadowExtent(filter) {
    // drop-shadow(rgba(…) 0px 8.8px 9.6px) → how far the shadow visibly
    // reaches, per side: the offset plus 1.5 × the blur (three standard
    // deviations; beyond that it is under 1 % of its strength).
    var ext = { top: 0, bottom: 0, left: 0, right: 0 }
    var re = /drop-shadow\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g
    var m
    while ((m = re.exec(filter || ''))) {
      var nums = (m[1].replace(/rgba?\([^)]*\)|#[0-9a-f]+|[a-z]+\([^)]*\)/gi, '').match(/-?[\d.]+px/g) || []).map(parseFloat)
      var dx = nums[0] || 0
      var dy = nums[1] || 0
      var blur = nums[2] || 0
      ext.bottom = Math.max(ext.bottom, dy + blur * 1.5)
      ext.top = Math.max(ext.top, -dy + blur * 1.5)
      ext.right = Math.max(ext.right, dx + blur * 1.5)
      ext.left = Math.max(ext.left, -dx + blur * 1.5)
    }
    return ext
  }
  /** Ancestors whose overflow clips the card's shadow: the classic cause of a
   *  shadow that ends in a straight line. */
  function clippingAncestors(el, ext) {
    var r = el.getBoundingClientRect()
    var need = { top: r.top - ext.top, bottom: r.bottom + ext.bottom, left: r.left - ext.left, right: r.right + ext.right }
    var hits = []
    for (var n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      var cs = getComputedStyle(n)
      var clipsX = cs.overflowX !== 'visible'
      var clipsY = cs.overflowY !== 'visible'
      var clipPath = cs.clipPath && cs.clipPath !== 'none'
      if (!clipsX && !clipsY && !clipPath) continue
      var a = n.getBoundingClientRect()
      var cut = []
      if ((clipsY || clipPath) && need.top < a.top - 0.5) cut.push('top ' + round(a.top - need.top) + 'px')
      if ((clipsY || clipPath) && need.bottom > a.bottom + 0.5) cut.push('bottom ' + round(need.bottom - a.bottom) + 'px')
      if ((clipsX || clipPath) && need.left < a.left - 0.5) cut.push('left ' + round(a.left - need.left) + 'px')
      if ((clipsX || clipPath) && need.right > a.right + 0.5) cut.push('right ' + round(need.right - a.right) + 'px')
      if (cut.length) hits.push({ element: describe(n), overflow: cs.overflowX + ' / ' + cs.overflowY, clipPath: clipPath ? cs.clipPath.slice(0, 80) : null, cuts: cut.join(', ') })
    }
    return hits
  }
  function layerHints(el) {
    // What makes WebKit give a part its own compositing layer (filter, will-change,
    // 3D or animated transforms, clip-path, isolation) — on the card and inside it.
    var hints = []
    var list = [el].concat(Array.prototype.slice.call(el.querySelectorAll('*'), 0, 400))
    list.forEach(function (n) {
      var cs = getComputedStyle(n)
      var h = []
      if (cs.filter !== 'none') h.push('filter')
      if (cs.willChange && cs.willChange !== 'auto') h.push('will-change: ' + cs.willChange)
      if (cs.clipPath && cs.clipPath !== 'none') h.push('clip-path')
      if (cs.isolation === 'isolate') h.push('isolate')
      if (cs.overflow !== 'visible') h.push('overflow: ' + cs.overflow)
      if (cs.transitionProperty && /transform|translate|scale|filter|all/.test(cs.transitionProperty) && cs.transitionDuration !== '0s') h.push('transition: ' + cs.transitionProperty + ' ' + cs.transitionDuration)
      if (cs.maskImage && cs.maskImage !== 'none') h.push('mask')
      if (h.length) hints.push({ element: describe(n), hints: h })
    })
    return hints.slice(0, 14)
  }
  async function cards() {
    var out = []
    var targets = CONFIG.cards || []
    var series = CONFIG.hoverSeries || [80, 260, 900]
    if (hoverMode === 'forced') installForcedHover()
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i]
      var el = firstVisible(t.selector)
      if (!el) continue
      await scrollToCenter(el)
      var rest = getComputedStyle(el)
      var ext = dropShadowExtent(rest.filter)
      var pad = Math.max(28, Math.ceil(Math.max(ext.top, ext.bottom, ext.left, ext.right) * 1.6) + 8)
      var r = rectOf(el)
      var clip = clampToViewport(grow(r, pad))
      var entry = {
        key: t.key, element: describe(el), rect: r, mode: hoverMode,
        rest: { filter: rest.filter, transform: rest.transform, translate: rest.translate || null, boxShadow: rest.boxShadow },
        clippedBy: clippingAncestors(el, ext), layers: layerHints(el),
      }
      if (clip) {
        clip.inner = { x: round(r.x - clip.x), y: round(r.y - clip.y), width: round(r.width), height: round(r.height) }
        // How far out to look for a hard shadow edge: past the shadow's reach
        // (with room for the bigger hover shadow), but not as far as the
        // neighbours' text.
        clip.reach = {}
        ;['top', 'bottom', 'left', 'right'].forEach(function (side) { clip.reach[side] = Math.round(Math.max(ext[side], 4) * 1.25 + 3) })
        var center = { x: Math.round(r.x + r.width / 2), y: Math.round(Math.min(Math.max(r.y + r.height / 2, 10), window.innerHeight - 10)) }
        if (hoverMode === 'real') {
          // The driver moves the pointer away before the checkpoint returns,
          // so read the hover state while the pointer is still on the card.
          var hovered = null
          var onOver = function () {
            el.removeEventListener('mouseover', onOver)
            setTimeout(function () {
              var hs = getComputedStyle(el)
              hovered = { filter: hs.filter, transform: hs.transform, translate: hs.translate || null, clippedBy: clippingAncestors(el, dropShadowExtent(hs.filter)) }
            }, Math.max(300, series[series.length - 1] - 200))
          }
          el.addEventListener('mouseover', onOver)
          await checkpoint('card-' + t.key, { kind: 'hover', hover: center, series: series, clips: { card: clip } })
          el.removeEventListener('mouseover', onOver)
          entry.pointerReached = !!hovered
        } else {
          await checkpoint('card-' + t.key + '-rest', { clips: { card: clip } })
          if (hoverMode === 'forced') {
            setForcedHover(el, true)
            await checkpoint('card-' + t.key + '-hover-early', { clips: { card: clip }, settleMs: 30 })
            await sleep(900)
            await checkpoint('card-' + t.key + '-hover', { clips: { card: clip } })
          }
        }
        if (hoverMode === 'real') {
          if (hovered) {
            entry.hover = { filter: hovered.filter, transform: hovered.transform, translate: hovered.translate }
            entry.hoverClippedBy = hovered.clippedBy
          }
        } else {
          var hov = getComputedStyle(el)
          entry.hover = { filter: hov.filter, transform: hov.transform, translate: hov.translate || null }
          entry.hoverClippedBy = clippingAncestors(el, dropShadowExtent(hov.filter))
        }
        if (hoverMode === 'forced') setForcedHover(el, false)
      }
      out.push(entry)
      await sleep(300)
    }
    if (hoverSheet) out.push({ key: '_forced-hover-copy', copied: hoverSheet.copied, failed: hoverSheet.failed })
    window.scrollTo(0, 0)
    return out
  }

  // ---- the 360° tour modal (smoke check) ------------------------------------
  async function tour() {
    var button = document.querySelector('.exhibition-hero-actions button')
    if (!button) return { found: false }
    await scrollToCenter(button)
    var t = performance.now()
    // A script click carries no user activation, so fullscreen is refused and
    // the modal covers the page by CSS alone — what an iPhone always does.
    button.click()
    var result = { found: true, opened: false }
    var start = Date.now()
    var modal = null
    var canvas = null
    while (Date.now() - start < 45000) {
      modal = document.querySelector('.exhibition-tour-modal')
      canvas = modal && modal.querySelector('canvas')
      if (canvas && canvas.width > 0) break
      await sleep(200)
    }
    if (!modal) return result
    result.opened = true
    result.msToCanvas = canvas ? Math.round(performance.now() - t) : null
    // Wait until the viewer's loader is gone (or give up after 30 s).
    var s2 = Date.now()
    while (Date.now() - s2 < 30000) {
      var loader = modal.querySelector('.psv-loader-container, .psv-loader')
      if (!loader || !visible(loader)) break
      await sleep(250)
    }
    result.msToReady = Math.round(performance.now() - t)
    result.fullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement)
    result.errorCard = !!modal.querySelector('[class*="error"]')
    await sleep(1500)
    await checkpoint('tour-open', {})
    modal.dispatchEvent(new CustomEvent('tour:close', { bubbles: true }))
    await sleep(1200)
    result.closed = !document.querySelector('.exhibition-tour-modal')
    return result
  }

  // ---- run ------------------------------------------------------------------------
  async function run() {
    var report = { runner: runner, job: job, path: location.pathname, tasks: tasks, hoverMode: hoverMode, startedAt: new Date().toISOString() }
    try {
      status('waiting for the page')
      await pageReady()
      report.readyMs = Math.round(performance.now() - t0)
      report.env = env()
      if (markers) await checkpoint('calibrate', { kind: 'calibrate', settleMs: 250 })
      await checkpoint('top', {})
      if (tasks.indexOf('fonts') >= 0) { status('fonts'); report.fonts = await fonts() }
      if (tasks.indexOf('gradients') >= 0) { status('gradients'); report.gradients = await gradients() }
      if (tasks.indexOf('cards') >= 0) { status('cards'); report.cards = await cards() }
      if (tasks.indexOf('tour') >= 0) { status('tour'); report.tour = await tour() }
    } catch (e) {
      report.probeError = String((e && (e.stack || e.message)) || e)
    }
    report.errors = errors
    report.shots = shots
    report.totalMs = Math.round(performance.now() - t0)
    status('sending')
    await post('report', report).catch(function () {})
    status('done')
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run)
  else run()
})()
