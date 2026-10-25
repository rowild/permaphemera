# Safari review kit (website)

A test pipeline for the website in Safari — the last three generations,
**Safari 27, 26 and 18**, on macOS and iOS (as of October 2026). It checks
the points that differ between Safari and Chrome on this site:

- **Gradients with text on them** — sticky header, exhibition hero, featured
  exhibition overlay, venue preview shade, selected ledger row, hero wheel buttons.
- **Card shadows on hover** — `filter: drop-shadow()` plus a lift on the
  exhibition, venue and gallery cards and the icon tiles; the classic Safari
  fault is a shadow that ends in a hard, straight line.
- **Fonts** — Cormorant Garamond 300/400/500: loaded, really drawn, and
  whether a page asks for a weight or italic that does not exist (the browser
  then fakes it, and Safari fakes it differently from Chrome).
- **The 360° tour modal** opens and closes from the exhibition page (smoke
  check only). Travel between panoramas and large images are the tour
  viewer's own review: `_MacAPP TOUR-VIEWER`, `qa/safari/`.

Dev tool only: nothing in `app/` imports it; the site stays a static build.

## Which Safari runs where

macOS and iOS ship the same WebKit for each Safari version. So an iOS
Simulator run also tells how that engine draws CSS on the Mac. It cannot
show the Mac's own GPU path, a real hover, or a real iPhone's memory limits.

| Generation | iOS | macOS |
|---|---|---|
| Safari 27 | **iOS 27 Simulator** | Update this Mac's Safari to 27, then `qa:safari:mac`; or a cloud Mac |
| Safari 26 | **iOS 26 Simulator** | **This Mac's Safari 26.6** (`qa:safari:mac`) |
| Safari 18 | iOS 18 Simulator: Xcode 27 no longer downloads it (needs the runtime `.dmg` from developer.apple.com, then `xcrun simctl runtime add <dmg>`) | **Static check** (`qa:safari:audit`); a real Safari 18 needs a macOS 15 VM or a cloud Mac |

Real devices: any iPhone or iPad on the same Wi-Fi (`qa:safari:serve --lan`),
or a cloud device farm (BrowserStack, LambdaTest, Sauce Labs) for real
iPhones on iOS 18/26/27 and real Macs with Safari 18/26/27.

## How it works

`server.mjs` relays the site under test (default `https://permaphemera.at`)
at `http://127.0.0.1:4800/` and puts `probe.js` first into every page. The
probe declines all cookies (no notice in the pictures, no visit in the
statistics), waits for the page, runs its checks, and asks for screenshots
("checkpoints"). A driver per browser answers them and cuts close-ups.
Results land in `qa/safari/results/<run>/` (git-ignored).

| Layer | Command | What it is |
|---|---|---|
| 1. Static check | `pnpm qa:safari:audit` | The shipped CSS and JS, every feature looked up in MDN's browser-compat-data for Safari 18 / 26 / 27, Mac and iOS apart |
| 2. Playwright | `pnpm qa:safari:webkit` | WebKit (the engine, not Safari) at 1440 px and iPhone size, with a real mouse; Chromium at the same sizes as the control |
| 3. Mac Safari | `pnpm qa:safari:mac` | This Mac's real Safari through `safaridriver`, real mouse |
| 4. iOS Simulator | `pnpm qa:safari:sim` (`--ios 27,26`) | Real Mobile Safari, one simulator at a time, headless, shut down afterwards |
| 5. By hand | `pnpm qa:safari:serve --lan` | Open the printed address on a phone or tablet, tap each page |
| All | `pnpm qa:safari` | 1–4 into one run folder, then the report |
| Report | `pnpm qa:safari:report [run]` | `summary.md` + `gallery.html` |

Every driver takes `--only start,venue` (route keys in `config.mjs`). Test a
local build instead of the live site: `pnpm generate && pnpm preview`, then
`QA_TARGET=http://localhost:3000 QA_DIRECTUS=https://permaphemera.project-backends.info pnpm qa:safari`.
A local build reads the hosted Directus directly, and Directus answers CORS only
for the site's own origin; `QA_DIRECTUS` lets the relay serve it as `/cms`, as the
live site does. Without it every page of a local run stays empty.

### Hover

Mac Safari and Playwright move a real pointer: one picture at rest, then at
80 ms and 260 ms (mid-transition, only the card area so the shot is quick),
at 900 ms (settled) and 300 ms after the pointer leaves. iOS has no hover,
and Tailwind wraps `hover:` in `@media (hover: hover)`, so on a phone the
probe copies every `:hover` rule onto a `.qa-hover` class ("forced"). That
shows how the engine *draws* the hover state.

### Shadow edges

For every card picture the driver measures the biggest brightness step
between two neighbouring pixel lines in the shadow zone, per side. A soft
shadow fades in steps under ~3 (of 255); a cut-off one jumps. The probe also
names any ancestor whose `overflow` or `clip-path` cuts the shadow. Always
compare a Safari row with its Chromium control.

### The Simulator's close-ups

`simctl` screenshots the whole phone screen. The probe draws a magenta and a
green square at known page positions once per page; the driver finds them
and from that knows where the page sits in the screenshot.

## One-time setup

- Mac Safari: Safari → Settings → Advanced → "Show features for web
  developers", then Settings → Developer → "Allow remote automation".
  Safari passes the driver's mouse moves to the page only while its window
  has focus, so the driver brings Safari to the front before each move. Do
  not work in another app while `qa:safari:mac` runs.
- Simulator: Xcode with the iOS runtimes (`xcrun simctl list runtimes`).
  The devices are named `QA Web Safari iPhone 16 Pro (iOS x)`; the tour
  viewer's kit uses `QA Safari …`. Run only one simulator at a time.

## Files

| File | Role |
|---|---|
| `config.mjs` | Target site, pages, gradient and card selectors, hover timing |
| `server.mjs` | Relay + probe injection + result collector (Node built-ins only) |
| `probe.js` | The checks; plain ES2017 so it runs in every Safari under review |
| `drivers/*.mjs` | Playwright, Mac Safari, Simulator; `lib.mjs` shares the checkpoint logic |
| `png.mjs` | PNG read/write, crops, calibration marks, shadow-edge measure |
| `audit/*.mjs` | Static CSS and JS check |
| `report.mjs` | `summary.md` and `gallery.html` |
