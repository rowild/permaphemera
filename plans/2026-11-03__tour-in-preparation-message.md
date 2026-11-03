# Tour "in preparation" message (2026-11-03, /away run)

Owner's ask: when the tour date (usually the last day of the exhibition) has come but the tour is
not ready, show a separate message such as "Tour still in preparation". Local and remote.

## Finding

The message already exists, in code and live (since release 0.0.33):

- Rule: `frontend/shared/tour-access.mjs` → kind `preparing` when `tour_status` is `available`,
  `tour_available_from` has passed (or is empty) and `tour` is still empty.
- Exhibition page (`app/pages/exhibitions/[slug].vue`): hourglass + "360° tour in preparation" /
  "360°-Rundgang in Vorbereitung" (`exhibition.inPreparation`), at the top and at the end.
- Cards (`app/components/ExhibitionCard.vue`): `cards.onlinePreparing`.
- SEO description (`shared/seo.mjs`): `exhibition.seoTourPreparing`, rewritten nightly at 00:15.
- Local and remote use the same Directus (production); the local Docker Directus is not running.
  So there is nothing to add to a second instance.

Checked live on https://permaphemera.at/exhibitions/epische-gemaelde/ (date 24 Oct passed, no tour):
the line "360°-Rundgang in Vorbereitung" shows.

## The real defect

Some records still had a hand-written tour sentence with a date in `summary` and `description`
("Die 360°-Tour ist ab 24. Oktober 2026 hier zu sehen."). On Epische Gemälde this sentence
contradicted the "in preparation" line right below it. The how-to
(`docs/how-to-gallery-and-exhibition.md`, Tour fields) already says: no tour sentence in the
summary, a written date goes stale. `docs/text-rules.md` also asks for "360°-Rundgang", not "Tour".

## Decision (made alone)

Remove the dated tour sentence from `summary` and `description` (record, `en`, `de`) of:

- `epische-gemaelde` (published, date passed: the contradiction)
- `aus-der-asche-empor` (published, 19 Dec)
- `bv-art-ex-26` (published, 24 Nov)
- `dialog-ars-carinthia-kunst-und-handwerk` (draft, 31 Oct passed)

The status line on the page now says the date or "in preparation" by itself.
Not touched: `bv-flohmarkt-2026` ("no 360° tour will be made", no date, status `unavailable`).

## Checks

- `pnpm check:data`, unit tests for tour access.
- Local dev server and live page show the line, and no dated sentence.
