# Unified exhibition card

Date: 2026-09-23. Status: approved by the owner in conversation, implemented the same day.

## Problem

Three components rendered exhibition records: `ExhibitionDirectoryCard` (directory; fixed height, clamped texts, tooltips, static footer), `RelatedExhibitionCard` (exhibition page; a free-growing sheet whose artist list and title pushed the action out of the frame, visible on the DIALOG page of 2026-09-23) and `LandingExhibitionCard` (landing; mockup-driven side and hero layouts with a marquee title). The fix for overflow existed in one of them only.

## Decision

One component, `app/components/ExhibitionCard.vue`, with a `layout` prop:

| layout | used by | behaviour |
|---|---|---|
| `stacked` (default) | exhibition directory (regular records), related records on an exhibition page | image above a fixed-height sheet; title and artist one line with ellipsis; summary gets the lines that fit; footer static; framed tooltips for every clipped text |
| `side` | landing collection (regular records), programme ledger | image beside copy; one-line title with measured marquee and tooltip |
| `hero` | highlighted record on the landing page and in the directory | full-bleed image, dark overlay, primary button |

Other props: `summary` (hide the summary block), `href` (overrides the slug route). Record numbers were removed on the owner's request the same day; the site shows no counting numbers on venues or exhibitions.

Records carry a `kind` (`exhibition` | `event`, Directus dropdown, default exhibition). The card and the detail page word an event as an event ("Visit Event", "Event record", "A brief gathering, noted in the archive.", "no 360° walk-through of this event"); the first event is the BV flea market of September 2026.

Every clipped text opens `ArchiveFloatingTooltip`: the shared archival frame teleported to `<body>` and positioned under the clipped line with fixed coordinates, so the card's clip-path and `overflow-hidden` cannot cut it. It flips above the line when the viewport ends too soon and follows scroll and resize. Pages own only the grid cell (`col-span-2`, `tablet:col-span-full`).

The directory's highlighted record now uses the landing hero (button and metadata lines with icons) instead of its own overlay variant. The landing page is the mockup source of truth, so it is the landing look that survives.

## Related records section

The "Also at this venue" block on an exhibition page fills up with records from other venues when the venue has fewer than three. The owner keeps the fill-up; the heading no longer names the venue ("Other records from the archive." / "Weitere Einträge aus dem Archiv.").

## Deferred

- The venue page's active-preview aside still composes `ExhibitionFrameCard` directly: it is a crossfading preview, not a list card.
- Venue cards (`VenueArchiveCard`, `GalleryDirectoryCard`) render a different record type and stay separate.
