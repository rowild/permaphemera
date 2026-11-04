# How to write a news article ("Aktuelles")

Since 2026-11-04. Plan and design: `plans/2026-11-04__news-system.md`.

## The routine

1. On the 1st of each month at 08:00 the owner gets the **news report** by e-mail (from
   `webmaster@rowild.at` to `robertwildling@gmail.com`). It lists: exhibitions that close within
   3 weeks, 360° tours that went online or go online within 3 weeks, new galleries, persons,
   organisations and sponsors since the last report, exhibitions that open within 3 weeks, and
   the days since the last article. By hand: `cd frontend && pnpm news:report` (prints it, changes
   nothing).
2. The owner decides whether something is worth an article, and when. No article only to fill a
   month.
3. The owner says "News: …". Claude writes the article (below) as a **draft**.
4. The owner reads it in Directus and publishes it. Drafts stay drafts, also under `/away`.
5. The first published article: also publish the menu entry `news` (`pp_navigation_items`,
   footer → Information; a draft until then). The header's menu popup and the footer then link
   to `/news/`.

## Writing it in Directus (`pp_news`)

| Field | What goes in |
|---|---|
| `title` | English on the record and the `en` translation, German in `de`. Short, says what happened: "Stadtgalerie Klagenfurt und Alpen-Adria-Galerie", "„Hydrotopia“ schließt am 15. November". |
| `slug` | lower case, words with `-`, from the German title. |
| `published_on` | The date the site shows. Usually the day it is published. It publishes nothing by itself. |
| `topic` | `welcome` new galleries, organisers, artists (**never exhibitions**) · `support` sponsors and similar supporters · `opening` an exhibition opens soon · `closing` an exhibition closes soon, the 360° tour follows · `site` news about the website (new functions such as the geo search or the exhibition tags, the newsletter, …). |
| `summary` | One line, the fact. Shown in the lists, on the start page and as the SEO description. |
| `description` | The article. Markdown: an empty line starts a paragraph; `**bold**`, `*italic*`, lists with `- ` or `1. `. No links in the text: the records go into the link fields. |
| `image`, `image_alt` | Optional. Without it the article shows the image of its first linked exhibition, else of its first gallery. Rights checked as for every image. |
| `exhibitions`, `venues`, `persons`, `organisations`, `sponsors` | Every record the article is about. They appear under the article ("Im Artikel"). Only published records show. |
| `seo` | Like the other collections: title ≤ 60 characters, description 130–160. Empty: the site uses title and summary. |

## Texts

Every text follows `docs/text-rules.md`: no "wir" / "we", no "Sie", value-free (never
"kuratiert", "ausgewählt", "herausragend"), an exhibition and a tour are never a "document", the
eyebrow (date · topic) and the title never say the same. An article may name a date ("schließt am
19. Dezember"), because it carries its own date. What PERMAPHEMERA is: rooms of exhibitions as
360° tours, recorded with consent (the contract report `docs/legal/` §1 has the wording).
