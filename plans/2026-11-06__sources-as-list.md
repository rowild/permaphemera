# Sources as a list at the end of every text

Date: 2026-11-06. Owner's rule (for ALL texts): sources stand at the end, in a new paragraph,
as an unordered list. The bullet is the diamond of the language menu (its pointer: a square turned
45°, record-paper fill, 1px archive-red border at 32 %).

## Today

`Source: a, b.` / `Quelle: a, b.` closes the last paragraph. Found by a scan of every text field
in production (2026-11-06):

| Field | Kind | Records |
|---|---|---|
| `pp_persons.about_html` + translations | HTML (WYSIWYG) | 101 + 202 |
| `pp_organisations.about_html` + translations | HTML (WYSIWYG) | 9 + 18 |
| `pp_exhibitions.description` + translations | Markdown field, shown as plain text | 23 + 46 |

No other field holds a source line (venues, events, news, sponsors: none).

## New form

HTML:

```html
<p>… last sentence.</p><p>Quellen</p><ul><li>kuenstlerstadt-gmuend.at</li><li>meinbezirk.at</li></ul>
```

Markdown (exhibition description):

```md
… last sentence.

Quellen

- kuenstlerstadt-gmuend.at
- meinbezirk.at
```

Label: `Quelle` / `Source` for one item, `Quellen` / `Sources` for more; English on the record and
in `en`, German in `de`. Items split at top-level commas (a comma inside brackets stays).

## Frontend

1. `app/utils/richText.ts`: `markSources(safeHtml)` gives the closing label paragraph + list the
   classes `archive-sources-label` / `archive-sources` (only a paragraph whose
   whole text is the label, followed by the last list). Unit test first.
2. `ArchiveRichText.vue`: runs `markSources` after sanitising; new prop `size: 'body' | 'lead'`
   (lead = the exhibition description's current size). Component test first.
3. `main.css`: every rich-text `ul` gets the diamond bullet; the source block is smaller and quieter,
   with space above it.
4. `app/utils/newsMarkdown.ts`: `markdownToHtml(markdown, { localize, links })`; news keeps links,
   the exhibition description gets none. The exhibition page renders its description through it and
   `ArchiveRichText size="lead"`.
5. `shared/seo.mjs`: a fallback description (from `about_html` / `description`) leaves the source
   block out. Unit test first.

## Data

`plans/2026-11-06__sources-as-list/migrate-sources.mjs`: backup of every touched field first
(`backup.json`), `--dry-run` prints each change, then writes. Records whose source line is not at the
very end are listed, not changed. Order: persons and organisations at once (they read well on the
current site too), exhibitions only after the frontend is live (the current site shows the
description as plain text).

## Docs and rules

`docs/how-to-gallery-and-exhibition.md` §7 and §8, `docs/text-rules.md`, `frontend/docs/STYLE_GUIDE.md`
(CMS rich text), the two PERMAPHEMERA data skills, and a feedback memory.

## Change of plan (owner, 2026-11-06): the exhibition description becomes WYSIWYG

The owner asked why the exhibition description was Markdown: it was set so when the schema was
first written (2026-09-14); the WYSIWYG fields came on 2026-10-15 for the about texts only, and the
site always printed the description as plain text. All 93 texts were one plain paragraph, without
Markdown. So the field becomes `input-rich-text-html` like every other long text:

- `directus/scripts/schema.mjs`: `richText('description', …)` on exhibitions; `_Plans/exhibitions-plan.md` §2.
- `resolveExhibitions`: `descriptionHtml` (safe HTML for the page) and `description` (plain text, search).
  The exhibition page renders `descriptionHtml` through `ArchiveRichText size="lead"`.
  The interim `markdownToHtml` step is gone; news stays Markdown.
- `markdown-to-wysiwyg.mjs` (with the news text, see `plans/2026-11-06__no-markdown-fields.md`): switches the field meta, turns each text into `<p>` paragraphs with
  the source list (`sources.mjs`). Dry run 2026-11-06: 93 texts, 69 with sources, no problems.
  Run it only after the new site is live (the current site prints the description as text).
