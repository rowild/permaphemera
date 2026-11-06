# Museum der Stadt Villach: "Wie Kriege enden / How wars end"

Date: 2026-11-05. Skill: `rowild-new-gallery-creation` (how-to `docs/how-to-gallery-and-exhibition.md`).
Files of this plan: `plans/2026-11-05__museum-villach-wie-kriege-enden/` (worklog, sources,
images, upload manifest, file ids, record script, straight-view script).

## Goal

Production Directus gets an exhibition record for the special exhibition "Wie Kriege enden /
How wars end" at the Museum der Stadt Villach, with its venue. Drafts only; nothing published,
nothing deleted. Tour fields: `tour_status: available`, `tour_available_from` empty, `tour` empty
(set at publish time).

## Jobs

1. New venue Museum der Stadt Villach (did not exist; archive number 44).
2. New person Andreas Kuchler (director; led the curator's tour) with role curator and the
   venue relation `head`.
3. New exhibition `wie-kriege-enden`: one record for both runs (2025 and the extended 2026 run).
4. SEO texts: `directus/seo/2026-11-05-museum-villach-wie-kriege-enden.json`.
5. Copy of the poster to the tour folder as `poster.pdf`.

## Status

Done 2026-11-05. See `worklog.md` for decisions, conflicts and gaps.

## Origin and status (added 2026-11-06)

- Made by the 360 session of 2026-11-05 (`_360_GALLERIES_AND_TOURS/plans/2026-11-05__four-tours.md`,
  owner away, "drafts only where a record is missing"). Input: the owner's 203 photos of
  26 October 2026 and `sources.txt` in the tour folder `_Material/`.
- The exhibition is a history exhibition (six wars, from Napoleon to Ukraine), not an art exhibition.
- Owner, 2026-11-06: keep the museum records, but they stay `draft` until the owner releases the
  museum by name (rule in `AGENTS.md`, check in `frontend/shared/museum-drafts.mjs`).
