# First news articles (2026-11-04, owner away)

Owner's ask: analyse since when the project runs, then write 5 to 10 news articles (origin;
Spittal an der Drau and Monika Gaberscek as the first supporter; the first artists of the
Parkschlössl; the first other galleries; the Tour Editor software; newer galleries; the name
PERMAPHEMERA), friendly, informative, the tone of an art critic and a news reporter, with
images and links, in German and English, as news entries.

## Findings (sources)

- Start: 2 June 2026, Adi Schmölzer's "All the magic" opens the summer season at the
  Parkschlössl, Spittal an der Drau (vernissage 1 June); he gave the impetus and the contact to
  Monika Gaberscek (About page, `about.body.p10`; the original planning chat, `_Plans/original chat.md`).
- Website code from 9 July 2026 (first commit), Tour Editor from 13 July 2026 (first commit,
  761 commits by 4 Nov, version 0.25.x, Photo Sphere Viewer 5.14), live on permaphemera.at since
  16 September 2026 (`frontend/AGENTS.md`).
- Parkschlössl 2026: nine exhibitions, all with a 360° tour (Directus).
- Klagenfurt venues added 15 Sept (Stadtgalerie, Alpen-Adria-Galerie, Living Studio,
  Theatergalerie); Europahaus and BV Galerie 23 Sept; Lange Nacht der Museen 3 Oct (two tours,
  Europahaus); Schloss Porcia, Palais Fugger, stARTup gallery, Galerie im Stiegenhaus 14 Oct;
  Studiogalerie 23 Oct (Directus `date_created`).

## Decisions (made alone)

- 9 articles, dated by their event (`published_on`), from 2 June to 4 November: a chronicle.
  Each text says only what was known on its date.
- All as **drafts**: the owner reads and publishes (`docs/how-to-news.md`, `/away` rule).
- Links inside the article text: added to the site (release 0.0.49), only site paths and
  https, tested against injection.
- Images: a screenshot of the "All the magic" tour, a screenshot of the Tour Editor and the
  site's share image (wheel of rooms), uploaded to Directus folder `media/news`; the other
  articles show the image of their first linked exhibition.
- Text rules (`docs/text-rules.md`): no "wir"/"Sie", value-free, "Ausstellung", "360°-Rundgang".

Texts: `2026-11-04__first-news-articles/articles.json`.
