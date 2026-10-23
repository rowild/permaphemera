---
name: rowild-checklist-qa-for-permaphemera-frontend
description: Pre-ship visual and interaction verification checklist for the PERMAPHEMERA frontend. Use before shipping or after materially changing any page, layout, or interaction, to confirm desktop and mobile behavior against the approved mockups.
---

# Frontend Quality Bar — route verification

Match the mockups closely across desktop and mobile before expanding scope.

**First run the mechanical checks**, which catch what a human eye will not:

```
pnpm check:tailwind   # canonical utilities, marker spacing, component <style> blocks
pnpm check:i18n       # message parity, overlay coverage, locale switching
```

**Then apply the general per-page bar** in `docs/STYLE_GUIDE.md` §26 — 44 checkboxes covering brand, layout, components, images, responsive behavior, accessibility, and performance. That section is the source of truth for anything that applies to *every* page; do not duplicate it here.

**Finally verify these built routes specifically.** This list is what §26 does not cover — the concrete surfaces of this build:

- Desktop landing layout
- Mobile hero layout
- Header navigation and language switcher behavior
- Search and archive section responsiveness
- Footer sponsor strip behavior
- Text fit inside buttons, cards, and navigation elements
- Dynamic gallery layout, search, and compact preview interaction on desktop and mobile
- Gallery and exhibition index search, URL-backed filters, empty states, and dense mobile card grids
- Artist directory search, five-name alphabet previews, history-backed full-letter routes, and focus-managed exhibition modals across breakpoints
- Landing and gallery scroll cues fading when their target section enters the viewport, with routed-page dividers following that target section
- Exhibition detail: dark 360° hero first with "Start experience" and "See details" (the latter scrolls to and focuses the details section), one facts list with empty rows hidden, the experience action repeated after the facts, the PDF link only when a source exists, related records, and the scheduled / preparing / restricted / unavailable tour states as status sentences, never a disabled button

**Safari.** Every check above runs in Chrome. Before shipping anything that touches gradients, shadows, filters, hover, fonts or the tour modal, run the Safari kit (`frontend/qa/safari/README.md`): `pnpm qa:safari` against a local `pnpm preview` (`QA_TARGET=http://localhost:3000`) or the live site, then read `summary.md` and compare each Safari row in `gallery.html` with its Chromium control. It covers Safari 27 and 26 in the iOS Simulator, this Mac's Safari, Playwright WebKit, and Safari 18 by the static check.
