# Linked sources (2026-11-09)

Owner's request: every source under a text links to the exact page it came from (the article
with its full address, never the bare domain). "meinbezirk.at" under Séverin Krön is useless:
it must lead to the meinbezirk.at article that was used. Applies to all texts.

## State on 2026-11-09

144 texts end with a sources list (107 persons, 26 exhibitions, 10 organisations, 1 gallery),
222 sources in all, none linked: each is a bare domain. And the site dropped every link from
these texts (`sanitizeRichText`, links only in news articles).

## Decisions (owner, 2026-11-09)

- **Link text: title + site (+ date).** The page's own headline, then the site, then the date
  when known: „Neuer Leiter der Galerie im Schloss Porcia“, meinbezirk.at, 12. 1. 2022. The whole
  line is the link (opens in a new tab).
- **All 144 texts in one run, drafts included.** A source whose exact page cannot be found
  stays unlinked and goes on a list for the owner.

## Work

1. Site: links stay inside the sources block of every text (`app/utils/richText.ts`), also where
   the body keeps no links. Style for the links in `.archive-sources`.
2. Directus: the WYSIWYG fields with sources get the link button; field notes say "links only in
   the sources list".
3. Research (6 helper agents in parallel): `inventory.mjs` → `inventory/group-N.json`; results
   in `research/group-N.json` (url, title, site, date, language, what the page supports). Local
   notes first (plans, sources.txt), then the web; every URL checked (HTTP 200, holds the facts).
4. Write (`write-sources.mjs`): backup of every touched text, then the new sources block in
   both languages (de/en) per record. Status unchanged.
5. Rules: `docs/text-rules.md` §1.9, `docs/how-to-gallery-and-exhibition.md` §7a, the skills that
   write texts, memory `sources-as-list`; `pnpm check:data` fails on a published text with an
   unlinked source.
6. Deploy the site (links show only with the new code).

## Result (2026-11-09)

- 144 texts, 222 sources: 203 sources linked to the exact page (136 records written by
  `write-sources.mjs --apply`; backup `backup-2026-11-09T15-50-28-110Z.json`), 18 printed sources
  (artist sheets, flyers, posters, invitations without an online copy) stay plain text, listed
  in `open-sources.md`. `pnpm check:data` passes.
- One-page sites keep their start page as the link (the facts are on it). Pages titled only
  "About", "Vita", "Home" read "site – Biografie" / "site – Über" / "site – Startseite".
- http allowed in the sources list only: bv-kaernten.at, sogx.net, zesi.at, karstenkkrebs.de have
  no working https.
- kultur-im-puls (owner, 2026-11-09): impulscenter.at blocks every visit (403); its source became
  two kultur-impuls.com pages, and "Impuls Center" / "owner of the Impuls Center" left the text
  (de + en). Backup `backup-kultur-im-puls.json`.
- Open for the owner: `research-notes.md` (facts the linked page does not hold, pages that will
  change), and two drafts with an unreachable web source: dialog-ars-carinthia-kunst-und-handwerk
  (stadtgalerie.net page now 404) and andreas-kuchler (vhsktn.at page gone).
