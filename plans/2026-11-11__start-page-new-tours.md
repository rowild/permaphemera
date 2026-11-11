# Start page: new 360° tours first (2026-11-11)

Owner's request (2026-11-11), answers included:

- The site is about 360° tours that come online on a certain day. The announcement of coming
  exhibitions is a secondary feature.
- **Rule: "360° tours are published on the last day of an exhibition. Exceptions apply."**
  An empty `tour_available_from` therefore means the last day (`end_date`); a date is set only
  for an exception (earlier or later). The three tours online before their last day today
  (Walther Preiml – Sehnsucht, Wagner reloaded, Das große Welttheater) stay online: their
  `tour_available_from` becomes the day their tour went online (Directus history).
- "Jetzt und demnächst" becomes the section of the newest tours online (new title), left 2/3,
  "Aktuelles" stays in the right 1/3, unchanged in place, and gets the section line graphic.
  "Alle Ausstellungen ansehen" moves to the right end of the 2/3 area, same row.
- Current and announced exhibitions follow as two small rows (max 5 each, scroll sideways when
  there is no room), full width, below.
- "Ausstellungen" moves before "Räume" and continues with the next-older tours.

## Work

1. `shared/tour-access.mjs`: no date → `end_date`; new `tourOnlineDate()`. Callers pass
   `end_date`; `publish-tour --show-now` writes today's date instead of clearing it; news report
   reads the date from the access result. Unit tests first.
2. Directus: field note of `tour_available_from` (schema.mjs); the three exceptions get their
   date. `pnpm check:data`.
3. Start page: `selectOnlineTours()` (unit test), `LandingExhibitionSchedule` → newest tours +
   news + small rows; `index.vue` order Ausstellungen → Räume, Ausstellungen = next tours;
   texts de/en. Browser test for the layout points.
4. Docs: the rule in `PROJECT_INFO.md`, `docs/how-to-gallery-and-exhibition.md` (tour fields),
   root `AGENTS.md`; memory.
5. Then, as a plan only: pilot partnerships and sponsors (`plans/2026-11-11__pilot-partners.md`).
