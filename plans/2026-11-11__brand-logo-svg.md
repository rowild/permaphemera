# Brand logo as a scalable SVG (2026-11-11)

Owner's request: one logo file from the site header: the temple mark, the eyebrow line and the
word PERMAPHEMERA with the leaning H, as an SVG that scales without loss.

## Result

- `plans/2026-11-11__brand-logo-svg/permaphemera-logo-de.svg` (eyebrow "Ein Archiv von
  Ausstellungen in Österreich")
- `plans/2026-11-11__brand-logo-svg/permaphemera-logo-en.svg` (eyebrow "An Archive of
  Exhibitions in Austria")

All letters are outlines (paths) drawn from the site's font, Cormorant Garamond Medium 500
(@fontsource, SIL Open Font License); no font is needed to show the file. Transparent background.
Colours as on the site: word `#191714`, eyebrow and temple `#a6523c` at 82 % opacity.

## How

`build.py` (fontTools, in `venv/`) places every letter at the position Chrome measured in the
live header (1264 px wide, 2026-11-11), with the H turned 10° and lowered 14 % as
`ArchiveLetters.vue` does (`BRAND_STUCK_LETTER`). The temple is
`frontend/public/media/svg/brand/archive-temple.svg`. Chrome rounds the font ascent to whole
pixels; the script does the same.

Check: the SVG laid 1:1 over the live header (`scripts/overlay.js`) and compared pixel by pixel
(`scripts/compare.py`): for eyebrow, word, H and temple no shift of even one device pixel gives
a better match; what remains is edge smoothing (text versus drawn shapes).

Spelling: the file shows PERMAPHEMERA as the site does today. The planned site spelling
"PermaPhemera" (memory, 2026-11) is not applied to the website yet.

## v2: new logo geometry, file and site (owner, 2026-11-11)

Owner's rules, confirmed on the proposal with helper lines:

1. The temple's lowest step and the word share one baseline.
2. The P reaches from that baseline to the underside of the roof's base line (the roof is the
   triangle with its base line). Word size = (58.9 − 23.9) / 64 / 0.628 = 0.87082 × the mark.
   Fractional px values are fine: browsers place text and SVG at sub-pixel precision.
3. The eyebrow stands on the roof peak (its baseline at the peak's top) and starts above the P.

Files: `permaphemera-logo-de.svg`, `permaphemera-logo-en.svg` (built by `build_v2.py`; the
`-guides` copies show the three helper lines). The v1 files are the header before this change.

Site: `main.css` `.archive-brand-mark`, `.archive-brand-word`, `.archive-brand-eyebrow`; the
templates set only `--brand-mark` per state (`ArchiveHeader.vue`, `ArchiveFooterIdentity.vue`).
The eyebrow uses `text-box: trim-end cap alphabetic` so its box ends on its baseline (fallback
for browsers without it: 0.22 em). The start page intro fades the eyebrow with `fromTo` and
`clearProps` (`index.vue`). Rules in `frontend/docs/STYLE_GUIDE.md` §6.8; browser test
`frontend/test/e2e/layout.spec.ts` "logo geometry" (header, slim header, footer; three widths).

Checks: `pnpm verify` green; logo tests green on desktop, tablet, phone; overlay of the final SVG
on the new header: eyebrow and temple match to the device pixel, the word within half a CSS
pixel (the browser snaps drawn text to the pixel grid; layout baseline gap 0.000003 px).
