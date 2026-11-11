"""Builds the PermaPhemera header logo as an outlined SVG (no font needed, scales freely).

Source of truth: the live site header (ArchiveHeader.vue), measured in Chrome at 1264 px width on
2026-11-11 (positions in CSS px, see LAYOUT below). Letters are drawn from the site's own font,
Cormorant Garamond Medium (500), @fontsource latin subset. The temple is
frontend/public/media/svg/brand/archive-temple.svg, placed as on the site (32 px, opacity .82).

Run:  ./venv/bin/python build.py
Out:  permaphemera-logo-v1-de.svg, permaphemera-logo-v1-en.svg (the header until 2026-11-11;
      the current logo is build_v2.py)
"""
import math
import re
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / 'frontend/node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff'
TEMPLE = ROOT / 'frontend/public/media/svg/brand/archive-temple.svg'
OUT = Path(__file__).resolve().parent

INK = '#191714'        # --color-archive-ink (brand text)
RED = '#a6523c'        # --color-archive-red (eyebrow at 82 %, temple at 82 %)
ALPHA = 0.82

BRAND_SIZE = 23.2      # text-brand at 1264 px
TAG_SIZE = 9.6         # text-3xs
TEXT_TOP = 51.1953125  # top of the brand letters' content box
TAG_TOP = 29.6953125   # top of the eyebrow letters' content box
MARK = (63.1953125, 42.6953125, 32)  # x, y, size of the temple
BRAND = [('P', 105.59375), ('E', 123.8359375), ('R', 141.984375), ('M', 163.3515625), ('A', 188.4609375),
         ('P', 210.4140625), ('H', 228.65625), ('E', 251.8828125), ('M', 270.03125), ('E', 295.140625),
         ('R', 313.2890625), ('A', 334.65625)]
# The stuck H (BRAND_STUCK_LETTER: index 6, tilt 10): an inline-block of the H's advance plus
# letter-spacing wide and one line high; origin 20 % 90 %, translateY(14 %) rotate(10deg).
H_BOX = {'w': None, 'h': BRAND_SIZE, 'tilt': 10}
TAGS = {
    'de': [('E', 105.59375), ('i', 111.75), ('n', 115.3046875), ('A', 124.4609375), ('r', 132.203125), ('c', 136.5859375), ('h', 141.53125), ('i', 147.3125), ('v', 150.8671875), ('v', 159.21875), ('o', 164.359375), ('n', 169.9453125), ('A', 179.109375), ('u', 186.84375), ('s', 192.578125), ('s', 196.71875), ('t', 200.9296875), ('e', 205.1328125), ('l', 210.0390625), ('l', 213.5), ('u', 216.96875), ('n', 222.703125), ('g', 228.6484375), ('e', 233.7890625), ('n', 238.6953125), ('i', 247.8515625), ('n', 251.40625), ('Ö', 260.5625), ('s', 268.875), ('t', 273.078125), ('e', 277.2890625), ('r', 282.1875), ('r', 286.6953125), ('e', 291.078125), ('i', 295.984375), ('c', 299.5390625), ('h', 304.484375)],
    'en': [('A', 105.59375), ('n', 113.328125), ('A', 122.484375), ('r', 130.2265625), ('c', 134.609375), ('h', 139.5546875), ('i', 145.3359375), ('v', 148.8828125), ('e', 154.03125), ('o', 162.140625), ('f', 167.734375), ('E', 174.828125), ('x', 180.984375), ('h', 186.1640625), ('i', 191.9453125), ('b', 195.4921875), ('i', 201.3671875), ('t', 204.921875), ('i', 209.125), ('o', 212.6796875), ('n', 218.265625), ('s', 224.21875), ('i', 231.625), ('n', 235.1796875), ('A', 244.3359375), ('u', 252.078125), ('s', 257.8046875), ('t', 262.015625), ('r', 266.21875), ('i', 270.71875), ('a', 274.2734375)],
}
TITLES = {'de': 'PERMAPHEMERA – Ein Archiv von Ausstellungen in Österreich',
          'en': 'PERMAPHEMERA – An Archive of Exhibitions in Austria'}

font = TTFont(str(FONT))
UPM = font['head'].unitsPerEm
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
os2, hhea = font['OS/2'], font['hhea']
use_typo = bool(os2.fsSelection & (1 << 7))
ASC = os2.sTypoAscender if use_typo else hhea.ascent
DESC = -(os2.sTypoDescender if use_typo else hhea.descent)
print(f'UPM {UPM}, ascent {ASC}, descent {DESC}, content box at 23.2 px: {(ASC + DESC) * BRAND_SIZE / UPM:.2f} (Chrome: 28)')


def baseline(top, size):
    # Chrome rounds the font's ascent to whole CSS px when it places the baseline (measured
    # 2026-11-11: the unrounded value put every letter 0.44 px too low).
    return top + round(ASC * size / UPM)


def glyph_path(ch, x, y, size, bounds):
    name = cmap[ord(ch)]
    s = size / UPM
    pen = SVGPathPen(glyphs, ntos=lambda v: f'{v:.3f}'.rstrip('0').rstrip('.'))
    glyphs[name].draw(TransformPen(pen, (s, 0, 0, -s, x, y)))
    bp = BoundsPen(glyphs)
    glyphs[name].draw(TransformPen(bp, (s, 0, 0, -s, x, y)))
    if bp.bounds:
        bounds.append(bp.bounds)
    return pen.getCommands(), glyphs[name].width * s


def rotate_point(px, py, ox, oy, deg, dy):
    a = math.radians(deg)
    rx = ox + (px - ox) * math.cos(a) - (py - oy) * math.sin(a)
    ry = oy + (px - ox) * math.sin(a) + (py - oy) * math.cos(a) + dy
    return rx, ry


def temple():
    svg = TEMPLE.read_text()
    body = re.search(r'<g .*?</g>', svg, re.S).group(0)
    x, y, size = MARK
    return f'<g transform="translate({x:.3f} {y:.3f}) scale({size / 64:.4f})" opacity="{ALPHA}">{body}</g>', (x, y, x + size, y + size)


def build(lang):
    bounds = []
    brand_base = baseline(TEXT_TOP, BRAND_SIZE)
    tag_base = baseline(TAG_TOP, TAG_SIZE)
    letters = []
    for i, (ch, x) in enumerate(BRAND):
        d, adv = glyph_path(ch, x, brand_base, BRAND_SIZE, [] if i == 6 else bounds)
        if i != 6:
            letters.append(f'<path d="{d}"/>')
            continue
        # The H box: as wide as its advance plus letter-spacing (0.24em), one line high, its text
        # baseline on the brand baseline. Line height = font size (leading-none), so the box top
        # sits half the leading below the content box top.
        w = adv + 0.24 * BRAND_SIZE
        h = BRAND_SIZE
        content = round(ASC * BRAND_SIZE / UPM) + round(DESC * BRAND_SIZE / UPM)
        box_top = TEXT_TOP + (content - h) / 2
        ox, oy, dy = x + 0.2 * w, box_top + 0.9 * h, 0.14 * h
        letters.append(f'<path transform="translate(0 {dy:.4f}) rotate({H_BOX["tilt"]} {ox:.4f} {oy:.4f})" d="{d}"/>')
        hb = []
        glyph_path(ch, x, brand_base, BRAND_SIZE, hb)
        x0, y0, x1, y1 = hb[0]
        corners = [rotate_point(px, py, ox, oy, H_BOX['tilt'], dy) for px in (x0, x1) for py in (y0, y1)]
        bounds.append((min(c[0] for c in corners), min(c[1] for c in corners), max(c[0] for c in corners), max(c[1] for c in corners)))
    tag = [f'<path d="{glyph_path(ch, x, tag_base, TAG_SIZE, bounds)[0]}"/>' for ch, x in TAGS[lang]]
    mark, mark_bounds = temple()
    bounds.append(mark_bounds)
    pad = 2
    minx = min(b[0] for b in bounds) - pad
    miny = min(b[1] for b in bounds) - pad
    maxx = max(b[2] for b in bounds) + pad
    maxy = max(b[3] for b in bounds) + pad
    w, h = maxx - minx, maxy - miny
    scale = 4  # default display size: 4 × the site header
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{minx:.3f} {miny:.3f} {w:.3f} {h:.3f}" width="{w * scale:.0f}" height="{h * scale:.0f}" role="img" aria-labelledby="title">
  <title id="title">{TITLES[lang]}</title>
  {mark}
  <g fill="{RED}" fill-opacity="{ALPHA}">{''.join(tag)}</g>
  <g fill="{INK}">{''.join(letters)}</g>
</svg>
'''
    path = OUT / f'permaphemera-logo-v1-{lang}.svg'
    path.write_text(svg)
    print(f'{path.name}: {w:.1f} × {h:.1f} (CSS px of the header), {len(svg) / 1024:.1f} KB')


if __name__ == '__main__':
    for lang in TAGS:
        build(lang)
