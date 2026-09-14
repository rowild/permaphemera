---
target: exhibition detail page
total_score: 16
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 2
target_identity: "file:/Volumes/Work/__MY_WWW/_WEBSITE PERMAPHEMERA/frontend/app/pages/exhibitions/[slug].vue"
target_fingerprint: "sha256:1289010b35dcb8e9c814a9d42a4d70a849dcaca01f49c12561ca5d4efca84361"
target_path: /Volumes/Work/__MY_WWW/_WEBSITE PERMAPHEMERA/frontend/app/pages/exhibitions/[slug].vue
timestamp: 2026-09-14T13-59-20Z
slug: app-pages-exhibitions-slug-vue
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score (Experience mode; 7 and 10 n/a)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 1 | No loading state on "Start experience"; "in preparation" note is 12px at 72% opacity |
| 2 | Match system / real world | 2 | Three names for one thing: spatial record, experience, 360° |
| 3 | User control and freedom | 3 | Modal close is solid; focus not returned to button |
| 4 | Consistency and standards | 2 | Two metadata grammars; venue page puts real CTA in hero, this page does not |
| 5 | Error prevention | 1 | Dead PDF button when source_pdf is null; "Free" hard-coded; disabled primary button |
| 6 | Recognition over recall | 2 | Hero gives no sign a tour exists |
| 7 | Flexibility and efficiency | n/a | Experience surface |
| 8 | Aesthetic and minimalist design | 2 | ~40% of page content is repetition |
| 9 | Error recovery | 1 | Tour load failure: black flash, no message |
| 10 | Help and documentation | n/a | Experience surface |
| **Total** | | **16/32** | Needs work |

## Measured (real page on :4991)
Desktop 1440×900: page 3509px tall; PDF button at 719px; "Start experience" at 1714px (~2 screens down); first mention of "360°" at 1359px.
Phone 500×844: page 3557px; "Start experience" at 1863px (~2.2 screens down).

## Duplication inventory
- Venue name: 5 times (breadcrumb, Location row, Back link, Related eyebrow, Related h2)
- Summary text: twice for 9 of 13 records (hero + About fallback)
- Artist: hero + About ledger
- Hero image: framed hero + darkened background of the 360° band
- "record" concept: 6 restatements (caption, eyebrow, roundel, scroll cue, About h2, 360° eyebrow)
- Same eyebrow + "headline, red accent" h2 opener: 3–4 sections in a row
- Back to venue: breadcrumb + text link, same URL

## Priority issues
- P0 Primary action ("Start experience") is in section 3, ~2 screens down; hero offers only PDF + back link.
- P0 No-tour records (6 of 13) promise "this is where the record opens" then show a disabled button.
- P1 About section repeats the summary for 9 of 13 records under a 62px headline.
- P1 Empty records: dead PDF button, empty dd rows, "Admission: Free" asserted for Belvedere 21 etc.
- P2 Venue ×5, "record" ×6, identical section openers collapse hierarchy; post-close has no landing and no focus return.

## Detector
CLI: 0 findings. Browser overlay: 15 (all-the-magic) / 16 (gehen-und-sehen): 9.6px header eyebrow (tiny-text, undersized-ui-text, wide-tracking), low-contrast #a6523c on #eee5d6 at 4.3:1 on eyebrows/breadcrumbs/meta labels and #786f62 on cream at 4.0–4.3:1, marquee without pause control, scroll-cue bounce, overflow-hidden on main. False positives: low-contrast on 69px h1 and 36px roundel (large text passes at 3:1); cream-palette and radial-glow are style heuristics.

## Recommendation
Do the minimal move first (tour button into hero, v-if the About section and the 360° band, v-if empty rows and the PDF button, no disabled button). Then a real redesign: "the record is the hero" (image opens the tour; facts merged into one dl) or "night hero" (dark 360° band becomes section 1 for tour records only).
