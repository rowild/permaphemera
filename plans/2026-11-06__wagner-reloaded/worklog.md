# Wagner reloaded (Theatergalerie, 2026) — worklog, 2026-11-06

The Tour Editor could not publish the tour `2026-04-13-wagner-reloaded`: Directus held no
exhibition for it, so Publish offered 13 other exhibitions and not this one.

## Sources

- The owner's source: stadtgalerie.net/theatergalerie/theatergalerie-information (the venue
  and the permanent Burgis Paier exhibition; no word of "Wagner reloaded").
- stadtgalerie.net/theatergalerie/aktuelle-ausstellung (the exhibition, images, 3 PDFs).
- The 3 PDFs, saved by the owner in the tour's `_MATERIAL/wagner-reloaded/`: invitation,
  artist biographies, wall texts.
- mohorjeva.com (Günter Schmidauer), en.wikipedia.org (Stadttheater Klagenfurt), Wikimedia
  Commons (its photo).

## Decisions (owner, AskUserQuestion)

- End date 28 February 2027 (invitation and biographies) over 31 January 2027 (web page).
- Tour button at once: `tour_available_from` empty.
- Stadttheater Klagenfurt as a new organisation, role `cooperation`.

## Written (all drafts)

- `pp_exhibitions/wagner-reloaded` — curator Günter Schmidauer, artists Bettina Breitenecker
  and Arnold Pöschl (existing), organiser row Stadttheater Klagenfurt (cooperation).
- `pp_organisations/stadttheater-klagenfurt` — Commons photo (Johann Jaritz, CC BY-SA 4.0), link
  stadttheater-klagenfurt.at.
- `pp_persons/guenter-schmidauer` — no photo (the publisher's portrait has no credit).
- `pp_persons/bettina-breitenecker` — press photo © STG, cropped to her half.
- SEO texts: `directus/seo/2026-11-06-wagner-reloaded.json`.
- `pnpm check:data`: OK, 103 assertions.

## Open

- Renate Wutte (head of make-up) is named on the web page and in the text, not as a person.
- The exhibition has no link record: the Stadtgalerie's page is "Aktuelle Ausstellung" and moves
  to the archive later.
- Title spelling: invitation "WAGNER RELOADED", wall text "WAGNER Reloaded", tour "Wagner
  reloaded"; recorded as "Wagner reloaded".
- Publish offers only published exhibitions: the owner publishes the four drafts first.

## Second part: Burgis Paier, "Das große Welttheater" (same day)

The owner splits the shoot into two tours (one per exhibition), linked by a marker that loads
the other tour at the same spot. Written (drafts, `write-records-paier.mjs`):

- `pp_persons/burgis-paier` — artist, 1949–2022, no portrait (the stadtgalerie.net picture named
  "Burgis Paier" shows her figures, not her).
- `pp_exhibitions/das-grosse-welttheater` — permanent (`is_permanent`), since 2022-12-14,
  vernissage 13 December 2022; `end_date` 2099-12-31 only because the field is required; tour
  `available`, no date (the tour follows). Image © Gerhard Maurer; invitation 2022 (Paier and
  Günter Brus) as source PDF.
- SEO: `directus/seo/2026-11-06-das-grosse-welttheater.json`. `pnpm check:data`: OK.
- Not recorded: Roman Grabner (Universalmuseum Joanneum) spoke "on both exhibitions" at the
  2022 opening; no source calls him the curator.
