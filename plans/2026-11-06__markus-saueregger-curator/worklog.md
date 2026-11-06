# Worklog: Markus Saueregger (2026-11-06)

## Search before anything else

- `pp_persons`: no Saueregger (searched `sauer`, `saue`, first name `markus`). New record.
- `pp_venues`: stARTup gallery exists, published, id `eb6323b2-3d44-45af-b637-7d511c1d1ddc`,
  `persons: []`. Its `about_html` already says "run by Markus Saueregger".
- Exhibitions at the venue: only "Walther Preiml – Sehnsucht" (published), one artist row, no curator.
- Folder `_360_GALLERIES_AND_TOURS/collection/_galleries/startup_galerie/sources.txt`: no page about
  Saueregger himself.

## Sources read

| Source | What it gives |
|---|---|
| osttirolerbote.at, *Volltreffer Oberkärnten*, 26 Aug 2024, p. 6, "Kunst(meile) in Kötschach", Karl Brunner (PDF) | "Galerist Markus Saueregger"; initiated a one-day Kunstmeile, 17 artists in shops and cafés up to the Protestant church; gallery at Kötschach Nr. 5 since May 2023; earlier two exhibitions in Kötschach-Mauthen (Biachakastl, Café Zuckereck); "von Beruf Fachkraft im Pflegedienst"; "stammt aus Afritz im Gegendtal und lebt mit seiner Familie seit knapp 20 Jahren in Dellach/Gail" |
| claudiaim.net, Doku Kunstmeile Kötschach 2024 | "Unter der Regie von Markus Saueregger (stARTup gallery)"; the idea came from local small businesses hit by the closure of the Plöcken Pass |
| meinbezirk.at, 28 Feb 2018, "Markus Saueregger: Ich bin gerne in der Natur unterwegs" | born 4 January 1974 (profile box); lives in Dellach im Gailtal; head of care at a senior home; Green lead candidate, district Hermagor, Landtagswahl 2018; portrait "KK/tine" |
| langenacht.orf.at, stARTup gallery | "privat geführte Galerie, die seit 2020 betrieben wird"; his name only in the contact e-mail |
| gailtal-journal.at, 12 Feb 2026 | Brigitte Bock, "verschiedenARTig", 24 Jan–8 Apr 2026 at the gallery |
| meinbezirk.at, 30 Jul 2026 | Claudia Unterluggauer, endangered flowers of the Alps, at the gallery |

Not usable: gailtalnetz.wordpress.com (no entry for the gallery in the part read); saueregger.com
(an unrelated earthworks company).

## Decisions

- Role `curator` only. The owner says he is not an artist; no source shows own works.
- Venue relation `curator` (owner's words). He also runs the gallery ("Galerist"); `head` would fit
  too, but one row has one relation, and the owner asked for curator.
- `born: "1974"` without a place. Conflict: the 2018 profile box gives 4 January 1974, the same
  article calls him 43 in February 2018 (that fits 1974 only before his birthday, so 1973/1974).
  The box is the more exact source. "Stammt aus Afritz" means he comes from there, not that he was
  born there, so no birth place.
- `based_in`: Dellach im Gailtal (2018 and 2024 agree).
- Left out of the biography, on purpose: the Green candidacy of 2018 (political opinion of a private
  person, not tied to the gallery), the employer's name, the number of children. The profession
  ("works in nursing care") stays: the 2024 art article states it.
- Kunstmeile: the 2024 article says he "initiated" it, claudiaim.net says the idea came from small
  businesses and he directed it. The bio says he led it and names where the idea came from.
- No participation row in "Walther Preiml – Sehnsucht": no source names him as curator of that
  exhibition.
- No portrait. Found only a group photo (Gerngross, Saueregger, Profunser; K. Brunner, 2024) and a
  2018 election photo ("KK/tine"). A group photo is no portrait; the election photo has no clear
  holder. The person page shows the newest exhibition image instead.
- No links: no own website or public profile found.

## Gaps

- Portrait.
- Exact birth year (1973 or 1974) and birth place.

## Done

- Person created: `pp_persons/09260344-e97d-4976-ab03-30b066f22c97` (draft), role curator,
  venue row `relation: curator` to the stARTup gallery. SEO written (en + de).
- Side fix, live: `pnpm check:data` failed on "Walther Preiml – Sehnsucht". Its SEO description
  (written 2026-10-24, before the tour) had 157 characters; with a tour the limit is 128. Shortened
  in en and de (`directus/seo/2026-11-06-walther-preiml-sehnsucht-tour-length.json`). Check now OK.
