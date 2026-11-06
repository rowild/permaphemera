# No Markdown fields: every long text is WYSIWYG

Date: 2026-11-06. Owner: "Nothing is markdown! Every markdown field must be converted to WYSIWYG",
and from now on a new text field is never Markdown, always WYSIWYG. Follows
`plans/2026-11-06__sources-as-list.md` (which already prepared the exhibition description).

## Analysis (production, 2026-11-06)

| Field | Interface now | Records | Content | Action |
|---|---|---|---|---|
| `pp_exhibitions.description` + `pp_translations__exhibitions.description` | Markdown | 93 texts | one plain paragraph each, no Markdown; 69 end with "Source: …" | → WYSIWYG, `<p>` + source list |
| `pp_news.description` + `pp_translations__news.description` | Markdown | 9 articles × 3 = 27 texts | paragraphs, `**bold**`, lists, links to site pages and https | → WYSIWYG **with the link button** (news keep links, 2026-11-04) |

Not Markdown, unchanged: the plain multi-line one-liners (`description` of locations, venues,
organisations, events, sponsors; `statement` of exhibition statements). They hold one plain
sentence for cards and search snippets, have no formatting and are shown as text.

Nothing outside the website reads these fields (360 pipeline and Tour Editor checked).

## Rule (from now on)

- `directus/scripts/fields.mjs` loses the `markdown` helper; long text uses `richText`
  (`richText(field, { links: true })` adds the link button where the site keeps links).
- `directus/scripts/build.test.mjs`: no field may use `input-rich-text-md`.
- Root `AGENTS.md` (Data model) states the rule; memory `no-markdown-fields`.

## Frontend

1. `sanitizeRichText(html, { links, localize })`: a site link (`/…`) gets the language prefix.
   `ArchiveRichText` passes `useLocalePath()` when `links` is set. Test first.
2. News page: `ArchiveRichText :html="article.description" links`; `newsMarkdown.ts` and its tests go.
3. Exhibition page: `descriptionHtml` (done in the sources plan).
4. Types/comments: `content.ts` says WYSIWYG.

## Data (after the new site is live; the current one prints both fields as text/Markdown)

`plans/2026-11-06__sources-as-list/markdown-to-wysiwyg.mjs` (replaces `exhibitions-to-wysiwyg.mjs`):
backup of field meta and texts, field meta from `schema.mjs`, then
- exhibitions: plain text → `<p>` + source list (`sources.mjs`),
- news: Markdown → HTML (paragraphs, `<br>`, bold, italic, lists, links).
`--dry-run` first. Then `scripts/snapshot.mjs` for `directus/schema/snapshot.yaml`, `pnpm check:data`,
a look at one live exhibition and one live news article.

## Docs

`docs/how-to-news.md` (writing an article in the editor), `docs/how-to-gallery-and-exhibition.md`,
`_Plans/exhibitions-plan.md` §2 (news line), `frontend/docs/STYLE_GUIDE.md`.
