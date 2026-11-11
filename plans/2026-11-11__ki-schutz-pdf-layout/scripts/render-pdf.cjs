// Renders docs/legal/2026-11-11__ki-schutz-massnahmen.html to a PDF (A4) with headless Chromium,
// then writes PNG previews of every page for the visual check.
// Run from the project's top folder:
//   node plans/2026-11-11__ki-schutz-pdf-layout/scripts/render-pdf.cjs
const path = require('node:path')
const { chromium } = require(path.resolve('frontend/node_modules/playwright'))

const src = path.resolve('docs/legal/2026-11-11__ki-schutz-massnahmen.html')
const out = path.resolve('docs/legal/2026-11-11__ki-schutz-massnahmen.pdf')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('file://' + src, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const missing = await page.evaluate(() =>
    ['300 12px "Cormorant Garamond"', 'italic 400 12px "Cormorant Garamond"', '500 12px "Cormorant Garamond"',
      '400 12px "EB Garamond"', 'italic 400 12px "EB Garamond"', '500 12px "EB Garamond"']
      .filter((f) => !document.fonts.check(f)))
  if (missing.length) { console.error('Fonts not loaded:', missing); process.exit(1) }
  await page.pdf({ path: out, format: 'A4', preferCSSPageSize: true, printBackground: true })
  await browser.close()
  console.log('PDF:', out)
})()
