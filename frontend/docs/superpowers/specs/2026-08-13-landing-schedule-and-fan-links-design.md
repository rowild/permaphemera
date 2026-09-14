# Landing Schedule and Exhibition-linked Fan — Design

Date: 2026-08-13

Status: implemented
Scope owner: landing page and hero kaleidoscope

## Goals

1. Place a conditional “Current / Upcoming exhibitions” section immediately
   after the landing hero.
2. Show at most three current and three upcoming exhibitions.
3. Make every populated fan blade a direct, accessible link to the exhibition
   represented by its image.
4. Keep the local prototype aligned with the future Directus relationship so
   the backend migration remains an adapter change rather than a UI rewrite.

## Data decision

The normalized local data already contains the relationship the feature needs.
Each resolved exhibition exposes its canonical `image`, `start_date`,
`end_date`, translated title, venue relation, and route slug. The fan therefore
uses exhibition records as indivisible `{ image, href, label }` items. It does
not retain the old location-image pool and attach unrelated random links.

When Directus replaces local JSON, `useArchiveData()` will continue returning
the same resolved exhibition shape. No landing component should need to know
whether the record came from JSON or Directus.

## Schedule rules

Dates use local calendar-day keys (`YYYY-MM-DD`) so a visitor sees the schedule
for their own day without UTC boundary drift.

- Current: `start_date <= today <= end_date`.
- Permanent: current after its start date regardless of `end_date`.
- Upcoming: `start_date > today`.
- Past: omitted from this section.
- Current order: soonest closing first, then earliest opening.
- Upcoming order: earliest opening first.
- Limit: each group is independently capped at three.
- Empty state: a missing group is omitted; if both groups are empty, the whole
  section is absent and the hero continuation cue points to Venues instead.
- Long-lived sessions: the local day key refreshes just after midnight.

## Visual and interaction design

The section is a compact programme ledger, not a second selected-exhibitions
showcase. A narrow editorial introduction sits beside two chronological
columns on the landing page's base parchment. The shared divider, Cormorant
Garamond, and the existing cut-corner landing exhibition card carry the archive
language without a separate tonal panel, perimeter rules, or decorative counts.

“Current” is the only strongly accented status; “Upcoming” stays quieter. Each
record is one complete link with documentary imagery, translated date range,
title, artist, venue/city, and a directional arrow. Desktop uses the two-column
ledger; compact layouts stack the groups while retaining horizontal records.

The fan preserves its existing WebGL rendering and motion. A matching SVG
interaction layer places one triangular anchor over each blade. Hover gives
only the corresponding WebGL blade a restrained elastic roll around its own
median axis—counterclockwise, clockwise, then a smaller counterclockwise
rebound. The SVG link never adds a fill, border, browser outline, or tap
highlight; pressing it scales only its WebGL blade to `1.002` before easing it
back. Keyboard focus uses the blade motion rather than an SVG outline. Links
are removed from the tab order while the fan is moving, then synchronized to
the final blade positions before interaction resumes. Image shuffles carry
their exhibition item with them, preventing link/image drift.

Initial construction and replay use the same physical median-axis motion. A
blade begins edge-on and rolls open; a short opacity blend around that edge-on
state hides the residual raster line while leaving the roll as the primary
reveal. Replay reverses that motion, fades only as the blade approaches its
edge, replaces the image set, and then rolls the blades open again with the
same brief edge blend.

The complete WebGL blade wheel is scaled to 96% around its shared circular
origin, giving antialiased outer tips a safe canvas margin without shifting the
fan centre or changing radial relationships. The SVG interaction geometry uses
the same centred scale so every link remains aligned with its visible blade.

Each settled blade exposes a shared cut-corner archival tooltip containing the
exhibition title, artist, venue/city, and translated date range. Pointer hover
tracks the cursor; keyboard focus anchors to the blade sector. The popup is
teleported to `body` as a fixed viewport overlay so its frame, filter, and
transitions cannot change the fan's paint bounds or the page layout. It chooses
above/below placement from the available viewport space and shifts its paper
pointer back toward the cursor even when the frame is clamped against a viewport
edge. Scale and rotation originate at that paper pointer so the frame unfolds
away from the cursor. Entrance and disappearance use a small fade, scale, and
one-degree paper rotation without positional travel. Under reduced motion the
state change is immediate. On coarse/touch
pointers, the first tap previews and a second tap on the same blade opens the
exhibition; tapping elsewhere or waiting dismisses it.

## Implementation process

1. Extend resolved exhibition records with `is_permanent`.
2. Add a pure schedule selector and unit tests for inclusive boundaries,
   ordering, limits, and permanent records.
3. Add a midnight-refreshing local date composable.
4. Add the reusable schedule section and reuse `LandingExhibitionCard` for its
   records.
5. Insert the conditional section as the first sibling after the hero and make
   the continuation cue conditional.
6. Replace the hero’s location-only image arrays with resolved exhibition
   items sourced through `useArchiveData()`.
7. Keep the item relationship intact through initial loading, rotation
   shuffles, replay randomization, and background preloading.
8. Add localized link labels, schedule copy, and accurate exhibition-loading
   copy in English and German.
9. Verify Tailwind conventions, i18n parity, data integrity, unit behavior,
   type safety, production generation, keyboard focus, and responsive layout.

## Deferred Directus work

- Fetch the same exhibition fields and media relation through the future
  Directus adapter.
- If responsive media variants are added, resolve them inside the adapter while
  retaining the component-facing `image` field.
- Editorial control over fan eligibility or ordering may later become explicit
  Directus fields. Until then, the fan orders exhibition records by most recent
  start date and replay uses the available exhibition item pool.
