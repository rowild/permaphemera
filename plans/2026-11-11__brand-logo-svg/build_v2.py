"""Proposal v2 of the logo (owner, 2026-11-11):
1. the temple's lowest step and the word share one baseline;
2. the P reaches from that baseline up to the underside of the roof's base line;
3. the eyebrow sits on the roof peak (its baseline at the peak's top), starting above the P.
Geometry in px for an icon of 32 px (the desktop header). Letter positions: the measured site
layout (build.py) scaled to the new size, so spacing and kerning stay as on the site.
Out: permaphemera-logo-<lang>.svg (the logo since 2026-11-11) and permaphemera-logo-<lang>-guides.svg."""
import sys
import build as b   # reuses font, glyph drawing, measured positions (runs build.py once)

ICON = 32.0
U = ICON / 64                          # temple units -> px
BASE_Y = 58.9 * U                      # bottom of the lowest step (line y=58, stroke 1.8)
P_TOP_Y = 23.9 * U                     # underside of the roof's base line (y=23, stroke 1.8)
PEAK_Y = 6.8 * U                       # top of the roof peak (y=8, stroke 2.4)
P_UNITS = 628                          # height of the P in the font (glyph bounds, UPM 1000)
SIZE = (BASE_Y - P_TOP_Y) / (P_UNITS / b.UPM)   # 27.866 px at icon 32
GAP = 105.59375 - (63.1953125 + 32)     # icon to text, as on the site (gap 0.65rem)
X0 = ICON + GAP                         # x of the first letter's origin
TAG = b.TAG_SIZE
K = SIZE / b.BRAND_SIZE

def build(lang, guides=False):
    bounds, parts = [], []
    x_first = b.BRAND[0][1]
    for i, (ch, x) in enumerate(b.BRAND):
        nx = X0 + (x - x_first) * K
        d, adv = b.glyph_path(ch, nx, BASE_Y, SIZE, [] if i == 6 else bounds)
        if i != 6:
            parts.append(f'<path d="{d}"/>'); continue
        w, h = adv + 0.24 * SIZE, SIZE
        content = round(b.ASC * SIZE / b.UPM) + round(b.DESC * SIZE / b.UPM)
        box_top = BASE_Y - round(b.ASC * SIZE / b.UPM) + (content - h) / 2
        ox, oy, dy = nx + 0.2 * w, box_top + 0.9 * h, 0.14 * h
        parts.append(f'<path transform="translate(0 {dy:.4f}) rotate(10 {ox:.4f} {oy:.4f})" d="{d}"/>')
        hb = []; b.glyph_path(ch, nx, BASE_Y, SIZE, hb)
        x0, y0, x1, y1 = hb[0]
        c = [b.rotate_point(px, py, ox, oy, 10, dy) for px in (x0, x1) for py in (y0, y1)]
        bounds.append((min(p[0] for p in c), min(p[1] for p in c), max(p[0] for p in c), max(p[1] for p in c)))
    t0 = b.TAGS[lang][0][1]
    tag = [f'<path d="{b.glyph_path(ch, X0 + (x - t0), PEAK_Y, TAG, bounds)[0]}"/>' for ch, x in b.TAGS[lang]]
    body = b.re.search(r'<g .*?</g>', b.TEMPLE.read_text(), b.re.S).group(0)
    mark = f'<g transform="scale({U})" opacity="{b.ALPHA}">{body}</g>'
    bounds.append((0, PEAK_Y - 1, ICON, BASE_Y))
    pad = 2
    minx, miny = min(v[0] for v in bounds) - pad, min(v[1] for v in bounds) - pad
    maxx, maxy = max(v[2] for v in bounds) + pad, max(v[3] for v in bounds) + pad
    w, h = maxx - minx, maxy - miny
    guide = ''
    if guides:
        g = lambda y, c, label: f'<line x1="{minx}" x2="{maxx}" y1="{y:.3f}" y2="{y:.3f}" stroke="{c}" stroke-width="0.15"/><text x="{maxx - 1}" y="{y - 0.6:.3f}" font-size="2.2" text-anchor="end" fill="{c}" font-family="sans-serif">{label}</text>'
        guide = g(BASE_Y, '#0a7', 'baseline: lowest step = text') + g(P_TOP_Y, '#06c', 'top of P = underside of roof line') + g(PEAK_Y, '#c0c', 'eyebrow baseline = roof peak') + \
            f'<line x1="{X0:.3f}" x2="{X0:.3f}" y1="{miny}" y2="{maxy}" stroke="#999" stroke-width="0.15" stroke-dasharray="0.6 0.6"/>'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{minx:.3f} {miny:.3f} {w:.3f} {h:.3f}" width="{w * 4:.0f}" height="{h * 4:.0f}" role="img" aria-labelledby="title">
  <title id="title">{b.TITLES[lang]}</title>
  {mark}
  <g fill="{b.RED}" fill-opacity="{b.ALPHA}">{''.join(tag)}</g>
  <g fill="{b.INK}">{''.join(parts)}</g>{guide}
</svg>
'''
    name = f'permaphemera-logo-{lang}{"-guides" if guides else ""}.svg'
    (b.OUT / name).write_text(svg)
    print(f'{name}: text {SIZE:.3f} px (icon {ICON:.0f} px), {w:.1f} x {h:.1f}')

for lang in b.TAGS:
    build(lang); build(lang, guides=True)
