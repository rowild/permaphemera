# Exhibition card rules — design

Status: **built** (2026-10-22) for all four layouts, `stacked`, `side`, `slide` and `hero`. The owner's decisions are in §5. One rule is a trial: the title weight (§5.4). When the rules have held for a while, this file becomes `docs/STYLE_GUIDE.md` §14.3a.

Source: an impeccable layout + typography assessment of the live site (390 px and 1440 px, measured with computed styles), 2026-10-21.

## 1. What the cards do today

One component, `ExhibitionCard.vue`, with four layouts. The cut-corner frame clips 8 px on every side. Each corner has a concave cut, radius 16 px, centred 4 px in from both edges.

| Layout, width | Image | Title | Artist | Date and place | Action |
|---|---|---|---|---|---|
| stacked, desktop 411 | 256 px row (1.61:1) | 38.2 px, 400, 1 line + "…" | 16.8 px red | date at the top in red caps 12 px; place in the footer under a rule, 14 px, 2 lines | "Zur Ausstellung →" |
| stacked, mobile 178 (2 columns) | 136 px (1.31:1) | 18 px, 1 line + "…" | 14 px | date 9.6 px caps, 1–2 lines; footer 12 px, 2–3 lines | an arrow on its own |
| side, desktop 426–611 | 49 % of the width | 18 px, 500, hard clip | 16 px | 14 px with 16 px icons | paper button on the image |
| side, mobile 178 | 112 px | 14 px, 500, hard clip | 14 px | 12 px, line 1.05 | button covers 78 % of the image |
| hero, desktop 766 | full card | 38.2 px, 500, 3 lines | 18 px ochre | 16 px light | primary button |

Across these cards there are 9 font sizes and 9 line heights for only 6 text roles.

## 2. Defects, most severe first

1. **Titles are cut almost everywhere.** About 44–49 % of a title is visible. `side` clips mid-letter. The full title only appears on hover, so a touch user cannot read it on the card.
2. **Sibling cards do not line up.** When the date takes 1 line in one card and 2 in the next, the titles start 13.7 px apart. When the artist is missing, the whole line disappears and everything below moves up by about 20–25 px.
3. **Large empty areas.** A one-column stacked card on mobile has a 46 px empty band. A desktop `side` card leaves 37 % of its text column empty.
4. **Text is below the guide's own minimum.** The stacked date on mobile is 9.6 px; the guide's floor is 11.5 px. The tour note is 10.8 px at a contrast of 3.86:1, which fails WCAG AA. The label on the image button is scaled down to 10.2 px.
5. **No shared scale.** Title weight is 400 in stacked and 500 in the others. The artist is 14, 16, 16.8 or 18 px depending on the layout. The date has two different treatments. The place is separated by "," in some layouts and by " · " in others.
6. **Facts are split.** In `stacked`, "when" is at the top and "where" is at the bottom, under a rule.
7. **Spacing is off the 4 px grid.** Values such as 17.6, 21.6, 13.6, 2.88, 1.28 and 7.68 px appear. A meta line height of 1.05 makes a wrapped date touch itself.
8. **The button on the `side` image** hides the artwork. When you squint, it is the first thing you see, before the title.
9. **Content sits inside the corner cuts.** With 12 px side padding and 10 px bottom padding, the bottom row lands inside the cut.
10. **Image proportions are random.** They come out as 1.31, 2.63, 1.61, 1.87 or 1.38:1, depending on where the card sits.

## 3. Rules

### 3.1 Size classes

The size class comes from the width of the text block, not from the layout name. The text block becomes a container. Add `--container-card-m: 13rem` and `--container-card-l: 24rem` to `@theme`; they give the variants `@card-m:` and `@card-l:`.

- **S**: under 13rem (208 px). The slider card is always S.
- **M**: 13–24rem.
- **L**: 24rem and wider.
- The hero card has its own display set.

### 3.2 Text roles

Every line box is 16, 20, 24 or 32 px, so every slot height stays on the 4 px grid.

| Role | S | M | L | Colour, weight | Lines |
|---|---|---|---|---|---|
| Title | `text-base leading-5` | `text-xl leading-6` | `text-title-lg leading-8` | ink, 400 (trial, §5.4) | 2, clamped, height reserved |
| Artist | `text-sm leading-5` | `text-base leading-6` | `text-lg leading-6` | red, 400 | 1 with "…", full text in the tooltip; reserved even when empty |
| Place | `text-meta leading-5` (venue only) | `text-sm leading-5` (venue · city) | same as M | `archive-record-meta` | 1 |
| Date | as Place, short months | as Place, short months | as Place, the record's own wording | as Place | 1, never cut |
| Summary | none | none | `text-base leading-6` | `archive-body` | 2, clamped, reserved |
| Tour note | `text-xs` | same | same | `archive-copy-warm` | 2 at most, in the tour tile's place |

- Normal-case text gets no letter spacing.
- All-caps text is at least 12 px, uses 0.1em tracking and lining numerals.
- `archive-muted` is not used for card text: on the card gradient it reaches only 4.17:1.

### 3.3 Spacing (4 px base)

- **Padding (top / sides / bottom):** S 12/12/20, M 12/16/16, L 20/24/24.
- **Corner rule:** for the bottom row, (side − 4)² + (bottom − 4)² must be at least 16². Valid pairs are 12/20, 16/16 and 24/12.
- **Gaps:**
  - title → artist: 4
  - artist → facts: 8 (S), 12 (M), 16 (L)
  - between fact lines: 0 (the line height gives the air)
  - facts → summary: 12
  - content → action: `mt-auto`, at least 8 (S), 12 (M), 16 (L)
- No other values are allowed.

### 3.4 Alignment between sibling cards

- Every card has the same slots: title (2 lines), artist (1), place (1), date (1), summary (2, L only), action row.
- A slot keeps its height when its data is missing.
- **Test:** in any row or slider, the top of each role differs by at most 1 px between cards.
- Images get a fixed aspect ratio per size class: S `aspect-4/3`, M `aspect-video`, L `aspect-16/10`. A card with a fixed height uses a fixed image row instead.

### 3.5 Truncation

- **Title:** clamp to 2 lines with "…", with `wrap-break-word hyphens-auto` so a single long word cannot overflow. Never one line with "…", never a hard clip, no marquee.
- **Place:** "…" at the end.
- **Date:** never cut. At S it uses short months and has no spaces around the dash ("12. Sept.–24. Okt. 2026"). A range across a year end uses digits ("30.12.26–15.01.27").
- The full text is on the linked page. The link's accessible name carries the full title. A tooltip is an extra and never the only way to read the text.

### 3.6 Meta lines

- Order: place, then date. One line each. Separator " · ".
- Icons only at M and L: 14 px, `currentColor`, `gap-2`. No icons at S.
- No rule between the facts.

### 3.7 Actions

- The card is never a link: no card-wide link, no link on the image. Only the two icon tiles are links.
- The tiles sit in the action row below the text, with space between them:
  - **left**: the 360° tour, a button with the Tour Editor icon (`public/media/svg/icons/tour-tile.svg`). It shows only while the tour is open. Otherwise the tour note ("Online verfügbar ab 24. Okt. 2026", "Online in Vorbereitung") takes its place, or nothing when no tour is planned;
  - **right**: the exhibition page, a link with the site icon (`public/media/svg/icons/exhibition-tile.svg`).
- Both icons sit on the site's inset-corner frame (the shape of `button-secondary-frame.svg`), and the corners are transparent.
- A tile shows 36 × 36 px. Its `::before` widens the hit area to 44 × 44 px.
- Each tile has an accessible name and a `title`: "360°-Rundgang starten: {title}", "Zur Ausstellung: {title}".
- Component: `ExhibitionActionTile.vue`.

## 4. Mobile sliders

- Below 700 px, each time group is its own slider, with its own heading and a "current / total" counter. There are no tabs.
- The row (`ExhibitionSlideTrack`) runs from screen edge to screen edge. A trailing spacer lets the last card snap to the start.

| Group | Card width | Card height | Image | At most |
|---|---|---|---|---|
| Aktuelle | 4/5 of the screen (`w-slide-feature`) | 376 px (`h-94`), 1/5 taller | 172 px at 390 | 5 |
| Kommende, Vergangene | 2/3 of the screen (`w-slide`) | 312 px (`h-78`) | 108 px at 390 | 5 / 10 |

- The image takes the height the text leaves (`flex-1`), so every card in a row has the same image height.
- Measured at 390 px: in every slider, each role sits at the same height in every card.

## 5. Decisions (owner, 2026-10-22)

1. **Date:** in the meta lines (place, then date), not in a red caps line at the top.
2. **Long artist lists:** cut with "…"; the full list shows in the tooltip, like the title.
3. **Actions:** two icon tiles below the text (§3.7); no button on the image, no card-wide link.
4. **Title weight:** 400 as a trial. Check it again and maybe go back to 500.
5. **"(Lange Nacht der Museen)":** still part of the date text in Directus. Moving it into its own field is open (a data change). Until then, cards below L show the short date without it.
