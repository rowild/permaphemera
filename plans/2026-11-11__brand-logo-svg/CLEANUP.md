# Cleanup list

Keep the two logo SVGs and `build.py` (they are the result and how to rebuild it).

| Path | What | When it can go |
|---|---|---|
| `plans/2026-11-11__brand-logo-svg/venv/` | Python environment with fontTools and Pillow (about 60 MB) | when no rebuild is planned (recreate: `python3 -m venv venv && ./venv/bin/pip install fonttools pillow`) |
| `plans/2026-11-11__brand-logo-svg/screenshots/` | header screenshots and the pixel compare | now (check done) |
| `plans/2026-11-11__brand-logo-svg/scripts/` | overlay and compare helpers for the check | now, unless the logo is rebuilt and checked again |
| `plans/2026-11-11__brand-logo-svg/permaphemera-logo-v2-*.svg` | the proposal files, same content as the final `permaphemera-logo-de/en(-guides).svg` | now |
| `plans/2026-11-11__brand-logo-svg/logs/` | output of `pnpm verify` and the layout browser tests | now |
| `plans/2026-11-11__brand-logo-svg/scripts/make_overlay_v2.py`, `scripts/overlay_v2.js` | overlay check of the final SVG on the new header | now, unless the logo changes again |
