# Changelog

## 0.0.40 - 2026-10-25 16:24:08 CET

- New start page texts, decided section by section with the owner. The hero line "Vergängliche Welten. Dauerhaft bewahrt." stays; below it: "PERMAPHEMERA dokumentiert Ausstellungen in österreichischen Galerien als digitale 360°-Rundgänge, die ab dem letzten Tag der Laufzeit online verfügbar sind." The sections are called "Galerien in Österreich" (above it "Räume" instead of "Orte", which are the towns), "Zuletzt eröffnet", "Von A bis Z" and "So entsteht ein 360°-Rundgang". The invitations below the headers ("Entdecken Sie …") are gone; the method section explains why a 360° tour shows more than photos that frame a single view, and its three steps say what really happens. The side column says "Ausstellungen im Archiv", "Galerien" and "Städte und Orte". No "ausgewählt" or "Kuration" any more: the scope is "Galerien und Ausstellungsorte in ganz Österreich".
- The start page has no search fields any more (galleries, exhibitions, artists); the index pages keep theirs, and the artists' alphabet stays.
- The first hero button says "Alle Ausstellungen" and opens the exhibitions page; "Einen Rundgang öffnen" in the method section opens a random open 360° tour; "Alle Galerien" in the side column opens the galleries page.
- The quote in the method section comes from Directus now (new collection "Quotes"): one of 15 quotes at random on every visit, weighted, hidden when draft or archived, optionally limited to dates and with a source line. New quotes can be added in Directus at any time.

## 0.0.39 - 2026-10-25 11:20:00 CET

- No visible change on the site. `pnpm tour:publish --candidates-json` also says whether a Directus key is set (`writable`), so the Tour Editor's publish window stops before the upload instead of after it when the tour could not be linked.

## 0.0.38 - 2026-10-25 10:40:00 CET

- No visible change on the site. `pnpm tour:publish` can now be driven by the Tour Editor's new "Publish to website…" window: `--candidates-json` lists the exhibitions without a tour (and the linked one) as one JSON line and writes nothing; `--copy-only` copies the export without touching Directus; `--link-only [--exhibition <slug>] [--show-now]` only links, after the upload, and can switch the Start button on. The interactive routine in the terminal works as before.
- `pnpm tour:publish` and `pnpm viewer:update` find the tours folder and the editor project through `~/.config/rowild-skills/paths.env`, the file the Tour Editor's Settings → Folders tab edits. A moved project is re-pointed there once, instead of in every script.

## 0.0.37 - 2026-10-25 06:26:02 CET

- No visible change on the site. The backlog now records the owner's rules for the coming text work (explanations instead of instructions, no "Sie"/"you" where possible).

## 0.0.36 - 2026-10-25 06:10:46 CET

- Start page: the section with the newest exhibitions is called "Zuletzt eröffnet" / "Recently opened" instead of "Temporäre Begegnungen. Bleibende Spuren." / "Temporary encounters. Lasting traces.". The text below it says what the section holds and that a 360° tour keeps an exhibition visible room by room after it has closed, instead of "Ausgewählte Ausstellungen, bewahrt als räumliche Dokumente."
- Exhibitions page: the header says "Ausstellungen, die festgehalten werden" / "Exhibitions that are captured" instead of "Die Ausstellungen, die wir festhalten." / "The exhibitions we hold on to." (the site no longer speaks as "wir"/"we" there).

## 0.0.35 - 2026-10-25 05:51:43 CET

- Cards have more room inside on screens wider than 700 px: the text sits 24 px from the paper edge on all four sides, also below or beside the picture (before: 16 px). This holds for exhibition and gallery cards alike; phones keep 16 px, and the large highlighted exhibition keeps 32 px.
- Start page: the wheel now waits until the page below the hero is built, and only then starts. Before, both started in the same moment, and the faded loading arrows could stutter once.
- When one request to the archive fails (for example on a weak phone connection), the site asks again twice, after 0.6 and 1.5 seconds, before it shows "The archive could not be loaded".
- From the Safari review (the same in every browser, most visible on the iPhone):
  - The card shadows in the phone sliders no longer end in a straight line.
  - The small icon tiles on the cards have the same soft shadow in Safari as in Chrome.
  - Italic text (quotes, picture captions, the artist letter tiles) uses the real Cormorant italic instead of a slanted copy of the upright letters.
  - Bold words on the About page and in biographies use weight 500. Before, the browser faked a heavier bold, and Safari set it wider, so lines could break differently.
  - The gallery page on phones no longer measures its featured picture in an endless loop (60+ errors per visit, and needless work).

## 0.0.34 - 2026-10-24 18:56:22 CEST

- The note on exhibitions and events whose tour may not be shown no longer says "wir"/"we": "Aus urheberrechtlichen Gründen darf von dieser Ausstellung kein 360°-Rundgang gezeigt werden." / "For copyright reasons, no 360° tour of this exhibition may be shown."

## 0.0.33 - 2026-10-24 16:17:58 CEST

- The sentence about an exhibition's 360° tour in its search description now writes itself from the tour fields: "360°-Rundgang ab 29. Oktober." before the day, "… in Vorbereitung." until the tour is published, "… online." after. The server updates the pages every night at 00:15, so nobody has to change these texts or deploy for it. The 15 stored texts lost their old tour sentence.
- Directus: the old, unused "status" column of four linking tables is gone (no visible change).
- A deploy says so when the last nightly update failed (it only writes a log on the server).

## 0.0.32 - 2026-10-24 15:45:30 CEST

- The picture texts of the galleries exist in German and English now. The German gallery pages, the gallery cards and the link previews use the German text (12 galleries, written by hand).

## 0.0.31 - 2026-10-24 15:08:40 CEST

- Every page now has a search description. Where no text was written, it is built from the record: title, artists, dates, gallery and town. Events are called events.
- Link previews: a page without its own picture names "PERMAPHEMERA" as the image text; gallery and organisation previews describe the photo or logo they actually show; SVG logos are never used as preview pictures.
- Characters like the gender star (Künstler*innen) or "#3" stay in titles and descriptions.
- Four files in Directus had no file type (two Europahaus photos, the BV Galerie photo, the BV flea-market invitation). They have it now, so Directus scales them: smaller pages and working link previews. `pnpm check:data` now fails on such files and on unsuitable share pictures.
- A deploy without a new build removes the pages of records that were taken offline.
- The deploy, `pnpm check:data` and `pnpm tour:publish` warn when an exhibition's search text still says "360° tour in preparation" or "from <date>" after that has changed.

## 0.0.30 - 2026-10-24 13:45:20 CEST

- Every page has its own search-engine and link-preview information: title, description, share image, canonical address, links between the German and English version, and structured data for Google (exhibitions as events with gallery, dates and organisers; persons; organisations; galleries; breadcrumbs).
- The texts are edited in Directus with the Directus Labs SEO plugin (Google and social preview, length bars, "hide from search engines", sitemap settings), in German and English. All 121 published exhibitions, galleries, persons and organisations got a hand-checked title and description; the fixed pages got new, plain texts.
- Every deploy writes a static HTML file per page with these tags, so search engines and link previews (Facebook, WhatsApp, LinkedIn) see them without running JavaScript, plus `sitemap.xml`, which `robots.txt` now names. A default share image shows the start-page wheel.

## 0.0.29 - 2026-10-24 12:24:00 CEST

- The privacy policy states how long Umami keeps visit data: 36 months. A nightly job on the server deletes older PERMAPHEMERA data (only this website; the other sites on the same Umami are not touched).

## 0.0.28 - 2026-10-24 11:33:31 CEST

- On an exhibition page the artists now follow the organisers: Kurator:innen, Organisator:in, Veranstaltet von, then Künstler:innen.
- The privacy policy names the real hosting: a Hetzner cloud server in Nuremberg (Germany) for the site, Directus and Umami, with Cloudflare in front for delivery and protection (EU–US Data Privacy Framework for possible transfers to the USA). Server logs are deleted after 14 days. ALL-INKL is gone from the page.

## 0.0.27 - 2026-10-24 11:00:36 CEST

- The main menu reads Exhibitions · Artists · Galleries · Organisations. "About the Project" moved into the menu behind the star, as the first link under "Information".
- The Organisations page lists who organises the exhibitions, in three blocks with one search box: the organisations that run a gallery, organise exhibitions or are a group (association, initiative, federation, collective); the people, split into organisers (including board members) and curators; and the sponsors, a block that appears once a sponsor is published. Every row opens the organisation, person or sponsor page. The header says plainly what the page lists ("Wer die Ausstellungen organisiert." / "Who organises the exhibitions."); on phones its facts form one line above the title.
- A person can have the new role "Organiser" ("Organisator:in"). The exhibition page names such a person in its own row after the curators, and the person's page labels the exhibition "Organiser". Gerhard Lepicnik is the first, for Trigeniale 26.
- The exhibition page has the temple divider before "Weitere Einträge aus dem Archiv", as on gallery, person and organisation pages.
- Visits are counted with Umami, self-hosted at umami.project-backends.info, without cookies and only on permaphemera.at. Matomo is gone: the cookie settings no longer offer it, and the privacy policy describes Umami instead (dated 24 October 2026).

## 0.0.26 - 2026-10-22 18:23:41 CEST

- The "Cities" list beside the artist directory on the start page shows the towns that really have galleries in the archive, taken from Directus: Klagenfurt am Wörthersee, Spittal an der Drau, Kötschach-Mauthen and Seeboden am Millstätter See. The town with the most galleries comes first; at most five are shown. Before, it was a fixed list of cities without galleries in the archive (Vienna, Graz, Linz, Salzburg, Innsbruck).

## 0.0.25 - 2026-10-22 17:12:26 CEST

- The thin line above a card's icons now shows on desktop too, on every exhibition card, not only on phones.
- The English site says "tour" instead of "walk-through" everywhere: "Start the 360° tour", "360° tour in preparation", "360° tour available from …", "Opening the tour…", the exhibition page and the About page. The German texts already said "Rundgang".

## 0.0.24 - 2026-10-22 17:01:28 CEST

- The start page appears at once, before the archive has arrived. The header and the hero text come in letter by letter: the logo first, the headline a moment later, then the menu, the language switch and the menu star, which turns in. The image wheel follows when both are done; while it waits for its images, faded arrows circle where it will be. The page below the hero builds after the text, or at once when you scroll, tap or press a key.
- The logo has a broken letter: the H of PERMAPHEMERA leans, in the header and in the footer. On the start page it falls crooked together with a few letters of the headline, once the wheel is built.
- The wheel loads smaller WebP images (about a quarter of the data) and no longer freezes the text while it prepares them. Its loading legend keeps the title, the "III of XII" counter and the percentage, without the ring. A short star-shaped flash before the blades appeared is gone.
- The paper-coloured background no longer moves while the page grows; it stays fixed to the window. On phones the drawn background graphics (caption, diagram, column, ruler, crosshairs) are 15% smaller.
- Scrollbars are thin, with a red thumb and no visible track. The page scrollbar is there from the start, so nothing shifts sideways when the content arrives.
- Under each mobile exhibition slider, the "1 / 5" counter and the "All …" link share one row.
- Exhibition and gallery cards have the same space on all four sides, 16 px from the paper edge, on phones and on desktop; on phones the text no longer sits 4 px from the edge.
- The card icons are smaller (30 px) and read as buttons: a light shadow, a fine arrow out of the top right corner, and a lift on hover. Hovering or focusing one shows the site's tooltip ("About the Exhibition", "Start the 360° walk-through"). On phones a thin line separates them from the place and date.
- A card whose tour is not ready says "360° tour in preparation" / "360°-Rundgang in Vorbereitung" instead of "Online in preparation".

## 0.0.23 - 2026-10-22 09:24:32 CEST

- The exhibitions and galleries pages have one header each instead of two: a plain title ("Die Ausstellungen, die wir festhalten." / "Wo die Ausstellungen stattfinden."), a line on what you can search for, and the facts table beside it. The decorative image and the second, poetic headline are gone. On phones the table becomes one line above the title, for example "21 Ausstellungen · 10 Galerien".
- A blade of the start page wheel opens the exhibition's 360° tour directly. On touch, the first tap shows what the blade is and the second starts the tour; a Cmd/Ctrl click still opens the exhibition page.
- On phones, current, upcoming and past exhibitions are horizontal sliders, one per group, each with a "1 / 5" counter below. Current exhibitions get larger cards (4/5 of the screen wide), the others are 2/3 wide; a slider holds up to 5 current, 5 upcoming or 10 past exhibitions.
- Exhibition cards follow one set of rules: every card has the same rows (a title of up to two lines, artist, place, date), so cards side by side line up; text sizes follow the card's width; the date sits with the place; a long title wraps instead of being cut on one line; a cut title or artist list shows in full on hover.
- A card is no longer one big link. Two icons sit below the text: the Tour Editor icon starts the 360° tour (only while it is open) and the site icon opens the exhibition page. While a tour is still to come, the card says "Online verfügbar ab <date>" in its place.
- The 360° tour of an exhibition now opens on the exhibition's last day, not the day after. Fifteen exhibitions and the texts of three announcements were changed to match.
- Less space between sections on phones, on every page.

## 0.0.22 - 2026-10-19 19:11:44 CEST

- An exhibition without a real image (no image, or only the placeholder) no longer shows anywhere on the site: not in the exhibition lists, not on gallery, person, sponsor or organisation pages, not in the artist directory. Its own page answers "not found". It appears as soon as it gets a real image.
- The exhibitions page is ordered by time: current exhibitions first (three per row), then upcoming and past side by side in two columns of smaller cards. Each group shows up to ten; a larger group links to its own page at `/exhibitions/current/`, `/exhibitions/upcoming/` or `/exhibitions/past/`.
- A search on the exhibitions page shows one list of every match, newest first. Search results and the group pages show twenty exhibitions per page with numbered pages; the page number is part of the address.
- Exhibition links say "Visit Exhibition" / "Ausstellung besuchen" only while the 360° tour is open. All other exhibitions say "About the Exhibition" / "Zur Ausstellung", events "About the Event" / "Zur Veranstaltung". The label changes by itself on the day a tour opens. This applies to every exhibition card, the gallery list rows and the gallery preview.
- A card title cut off with "…" by only a pixel or two now shows its full title on hover; before, the tooltip was missing (for example "Blinddate der Perspektiven" on wide screens).

## 0.0.21 - 2026-10-15 06:15:08 CEST

- The "About" texts of galleries, organisations and persons are written in the Directus WYSIWYG editor instead of a JSON code field (new field `about_html`, all texts carried over). The site shows them in the archive typography and keeps only paragraphs, bold, italic and lists; links stay link records.
- Exhibitions have a real admission field. An empty field shows "Free admission" / "Eintritt frei"; until now every exhibition said "Free".
- Previews show only records with a real image: the start page hero fan, the current/upcoming programme, the selected exhibitions and the gallery cards, as well as the related exhibitions under an exhibition, leave out anything whose image is missing or a placeholder. A person without a photo no longer borrows a placeholder exhibition image.
- New gallery: the Galerie im Stiegenhaus in the Impuls Center, Seeboden am Millstätter See, run by the association kultur.im.puls, with its current exhibition "Blinddate der Perspektiven" (Inés Urach, Nicoline von Heyl, Roswitha Bucher-Sakowski) and the announced "Klaus Zlattinger & Friends".
- New exhibition in the Living Studio: "Biodiversität entdecken" by school classes from 17 Carinthian primary schools, with kärnten.museum, Universität Klagenfurt and Climate Fund Klagenfurt as cooperation partners (Volkskino Klagenfurt and JUMP DOME Klagenfurt as supporters, still drafts).
- Small cards on the start page: the date icon sits on the first line of a wrapping date, and titles keep the descenders of letters like g and p.
- The "FIG. I" label under a photo stays on one line next to long captions, and disappears when a photo has no caption.

## 0.0.20 - 2026-10-14 21:20:13 CEST

- Every published person has a page at `/persons/<slug>/` (English `/en/persons/<slug>/`): photo with credit line (or the image of the person's newest exhibition), intro line, biography, born, lives in, memberships, galleries and links (main link first, further links on the next line), then all exhibitions with the person's role and their statements. On desktop the biography sits under the facts, beside the photo; a portrait keeps its upright frame on tablets and phones. Curators and board members get the page without the "Artists" breadcrumb.
- Person names link to these pages: the artists and the new curators row on exhibition pages, statement authors, names in the artist directory and on the landing page, the heading of the artist window and the member list of an organisation. In the artist directory the name opens the person page and the "i" button opens the exhibitions window; the intro text says so.
- Sponsor pages at `/sponsors/<slug>/` list what a sponsor supports; they appear once a sponsor is published.
- Organisations (associations, federations, institutions) have their own register and pages, run venues and present exhibitions; officers carry board and press roles. Organisation pages now show a photo.
- Researched content: press photos and German/English biographies for 72 persons, photos for 5 organisations and 51 new links; the source list is `docs/content/2026-10-person-organisation-sources.md`.
- New galleries and exhibitions: Europahaus Klagenfurt, Galerie im Schloss Porcia, Galerie Palais Fugger and the stARTup gallery, plus the current exhibitions of the Stadtgalerie Klagenfurt, the Alpen-Adria-Galerie and the Living Studio.
- The start page fan shows only exhibitions whose 360° tour is open, filled up to twelve with galleries; the selected exhibitions are current or past ones only. The related cards under an exhibition show only past exhibitions with an open tour.
- Gallery pages show up to three external links (own website first) under the eyebrow "Exhibition venue"; the artist window shows the artist's own link under the name. All external links open in a new tab.
- The Artists page opens with a descriptive intro and goes straight into the search, without header, eyebrow or divider.
- In the fact tables of gallery, organisation, person and sponsor pages the label sits on the baseline of the first value line.
- Only published records reach the site: the public API no longer delivers drafts, and relation rows (participations, organisers, memberships, venue relations) have no status of their own; they show when every record they connect is published.

## 0.0.19 - 2026-09-23 20:53:00 CEST

- Replaced the three exhibition card components with one `ExhibitionCard` in three layouts (stacked, side, hero). The related records under an exhibition no longer grow with their content: title, artists and summary are clipped with an ellipsis, and the footer with the "Visit Exhibition" action stays in place. The highlighted directory record now uses the landing hero look.
- Tooltips for clipped card texts (full title, all artists, full summary) are teleported to `<body>`, so the card's cut-corner clip and overflow can no longer cut them off; they flip above the line when the viewport ends and follow scroll and resize.
- Removed every counting number from the site: the venue archive number on gallery cards and venue pages (with its round plate), the exhibition record numbers on cards and detail pages, and the position numbers in a venue's record list.
- The galleries directory no longer carries fixed counts in its copy ("Twenty-six addresses", "nine states"); the heading, the atlas caption and the SEO description read their numbers from the data.
- The "Also in the archive" block under an exhibition no longer names the venue, because it fills up with records from other venues.
- Exhibition records carry a new `kind` (exhibition or event) in Directus. An event is worded as an event: "Event record", "A brief gathering, noted in the archive.", "Visit Event", and "There is no 360° walk-through of this event." The BV Kärnten flea market of September 2026 is the first event; venue ledgers count events and records accordingly.
- The footer hides the placeholder sponsors (now drafts in Directus) and shows an invitation to future supporters with a link to the contact page until a real sponsor is published.
- The coordinates row on a venue page has a compass icon like its neighbours.
- "BV Kärnten" is kept verbatim in the artist directory instead of being inverted to "Kärnten, BV" (stopgap until organisations get their own collection; see `docs/superpowers/specs/2026-09-23-organisations-design.md`).

## 0.0.18 - 2026-08-23 12:24:05 CEST

- Connected the 360-degree exhibition experience. The "Start experience" button on an exhibition page now opens the exhibition's exported tour in a full-viewport modal, asks the browser for fullscreen where it is supported, and returns to the page when the tour's close control is used or fullscreen ends. Records without a published tour keep the disabled button and the "Spatial record in preparation" line.
- Published tours for the seven Parkschlössl 2026 exhibitions from Adi Schmölzer through Birgit Mörtl; the Peter Kohlweiss and Santino Solace records remain in preparation.
- Replaced the English and German intro copy of the spatial-record section, which no longer announces the viewer as unconnected.
- Added the `tour` field to exhibition records and extended `pnpm check:public` so every tour path must be a slash-wrapped folder holding a real `tour.json`.

## 0.0.17 - 2026-08-13 20:02:25 CEST

- Replaced the exhibition-level `featured` content flag with one shared date-derived selector used by both the landing collection and the complete exhibition directory: prefer a currently running exhibition, otherwise the nearest upcoming exhibition, otherwise the first record in the reverse-chronological list.
- Removed the obsolete flag from all exhibition JSON records, TypeScript contracts, resolution output, fixtures, and future Directus schema guidance while preserving the independent curated featured-venue behavior.
- Added unit and repository-level regression coverage for current, upcoming, fallback, empty-collection, data-integrity, directory-card, and landing-composition behavior; reconciled the README, agent instructions, style guide, and historical migration documentation with the automatic highlighting contract.

## 0.0.16 - 2026-08-13 18:49:35 CEST

- Changed the complete exhibition directory to a deterministic reverse chronology: records now sort by newest start date first, then end date and title for ties, while search preserves that order and featured status affects presentation without overriding chronology. The season ledger is likewise ordered newest year first.
- Replaced the remaining generic “Open” action on exhibition-directory cards with the shared “Visit Exhibition” / “Ausstellung besuchen” label, added regression checks for both ordering and copy, and reconciled the README and style guide with the directory contract.

## 0.0.15 - 2026-08-13 18:15:18 CEST

- Added complete bilingual How It Works and Contact routes, connected the header and footer information links to their localized destinations, and reused the archive's quiet asymmetrical editorial layout across the project pages.
- Explained the curatorial selection, spatial capture, linked viewpoints, contextual enrichment, and lasting archive workflow through the established documentary collage and three-stage method sequence.
- Published the private project owner's direct contact record with guidance for exhibition proposals, corrections, collaborations, accessibility feedback, and useful first messages, deliberately avoiding an undefined form backend.
- Added compact cut-corner hints to the email and telephone actions. They identify the external system application on hover and keyboard focus, point to their trigger, remain outside document flow, expose `aria-describedby`, and respect reduced-motion preferences without adding a touch confirmation step.
- Generalized the About-specific editorial section into `ArchiveEditorialSection`, added a reusable borderless contact record, and reconciled the README, style guide, and route specification with the completed information architecture.

## 0.0.14 - 2026-08-13 17:18:21 CEST

- Added the date-aware “Current / Upcoming exhibitions” programme as the first landing section after the hero. It appears only when relevant records exist, independently caps current and upcoming groups at three, handles inclusive and permanent date ranges, refreshes the visitor's local day after midnight, and reuses the established framed exhibition card with the “Visit Exhibition” action.
- Replaced the hero's unrelated location-image links with complete resolved exhibition items, keeping image, route, title, artist, venue, and date together through initial loading, rotation, replay, and background preloading. Each blade is now an accessible route with coordinated pointer, keyboard, and two-tap touch behavior.
- Rebuilt blade motion around each triangle's median axis: hover uses a restrained elastic roll, press gives a `1.002` scale response without browser outlines, initial construction and replay share the median-roll reveal, opacity suppresses the edge-on line, and the complete fan scales around its common centre to protect outer tips from clipping.
- Added a body-teleported, fixed exhibition tooltip that follows the cursor without entering the fan layout, chooses its pointer direction from available viewport space, clamps safely at screen edges, and uses subtle transform/fade entrance and disappearance motion with reduced-motion and keyboard-focus fallbacks.
- Added the bilingual About the Project route with the complete supplied German essay, an English editorial translation, the final Parkschlössl origin and acknowledgements section, and emphasized Adi Schmölzer and Monika Gaberscek. Promoted About to the permanent desktop navigation and clarified Home/breadcrumb/eyebrow vocabulary.
- Made the brand tagline visible at every breakpoint and rebuilt the language control as a compact framed dropdown beside the menu button, using archival-filtered Austrian and British flags from `flag-icons`, full keyboard navigation, a playful two-degree hinged opening/hover tilt, and no row dividers or hover fills.
- Restyled the header menu with the shared reverse-corner parchment frame and a calm fade/vertical entrance, removed its inner border, inner background, row dividers, and embedded language selector, and connected all contact/legal destinations to their real routes.
- Added shared bilingual Imprint, Privacy Policy, Terms of Use, and Accessibility pages for the private project operator, with responsive editorial sections, accountable document records, authoritative source links, borderless baseline-aligned definition rows, economical dividers, and honest current limitations rather than generic template claims.
- Integrated consent-gated self-hosted Matomo at `matomo.rowild.at` with site ID `9`, SPA page-view and link tracking, withdrawal handling, and cookie deletion. Replaced the old two-button notice with versioned granular checkboxes for necessary storage, Matomo, Google Maps, and YouTube; Maps and YouTube remain explicitly inactive future categories and load no external resources.
- Expanded the English/German copy, accessibility labels, SEO metadata, privacy disclosures, interaction checks, mobile checks, and schedule unit coverage; added shared tooltip, legal-page, schedule, date, Matomo, and type modules to keep repeatable content and behavior out of page-local markup.
- Tightened the exhibition-detail route's computed record guard so Vue's template type analysis understands that every rendered detail has a resolved exhibition, clearing the pre-existing strict-null typecheck failures without weakening its 404 behavior.
- Reconciled the README, agent guidance, style guide, and feature specifications with the delivered routing, header, fan, schedule, legal, consent, baseline, descender-clearance, and deliberately economical divider rules. The style guide is now version 1.27.

## 0.0.13 - 2026-08-12 12:38:30 CEST

- Replaced every bracketed font size with a named `@theme` type scale: 23 tokens now cover 172 previously arbitrary values across 31 files, so `check:tailwind` can finally detect a non-canonical text size. Static sizes were consolidated where they had drifted — `1.02`, `1.04`, `1.05`, `1.06` and `1.08rem` all collapse into one `text-button` step — while every fluid `clamp()` curve was preserved one-per-role, because their `vw` slopes are deliberate responses to viewport rather than accidental duplication.
- Gave each type step its own paired line-height instead of leaving it inherited, tightening display type toward `0.98` and holding body and UI text near `1.5`; explicit `leading-*` utilities still win through Tailwind's `--tw-leading` fallback, so deliberate overrides are untouched.
- Fixed a silent animation failure in ten transition declarations across nine components. Tailwind v4 compiles `scale-*`, `translate-*` and `rotate-*` to the independent `scale`, `translate` and `rotate` properties, but each declaration named only `transform`, so hover lifts, press feedback, ledger expansion and the editorial link underline all snapped to their end state with no interpolation. The class was valid and the end state correct, so nothing ever errored.
- Replaced four hardcoded hex text colours with their existing archive tokens, closing the last bypass of the two-accent colour system.
- Added a global component `<style>` check to `check-tailwind-canonical.mjs`, so the no-scoped-CSS rule is now mechanically enforced across every `.vue` file rather than only inside the kaleidoscope loader.
- Restated the three most-broken CSS rules — canonical utility before any bracketed value, no scoped styles, mandatory inner spaces in `[ marker ]` groups — at the top of the agent guidance, where they are always in context, together with a new rule covering composite utilities that carry more than one declaration.
- Reworked `docs/tailwindcss-v4-usage.md` into `docs/CSS_ARCHITECTURE.md`, roughly halving it by removing the generic Tailwind syntax reference and the adoption assessment for a migration long since completed, and added sections on composite utilities and on this project using Tailwind v4 exclusively.
- Trimmed `AGENTS.md` by a third, cutting content a session can reconstruct from the codebase and moving the pre-ship verification checklist and the `fin-patch` closeout into skills, while keeping every gotcha, prohibition and non-guessable command description.
- Renamed the exhibition action from "Open Exhibition" to "Visit Exhibition" with the matching German "Ausstellung besuchen", across the label, its accessible name and the location variant.
- Added the eighth and ninth Parkschlössl 2026 exhibitions from their source PDFs: Peter Kohlweiß's *Gehen & Sehen* and Santino Solace's *Das, was entsteht*, each with its extracted 1600x1000 artwork, English record and German translation.
- Moved the gallery-detail city subtitle down from a bracketed `0.35rem` to the canonical `mt-3`.
- Added a design spec for aligning the local JSON layer with the documented Directus schema, covering the `locations`/`venues` split, an `exhibitions_artists` junction, inline translations, a `status` provenance marker and city-level geo data.

## 0.0.12 - 2026-08-12 00:48:27 CEST

- Standardized every comparable exhibition-detail split on the hero's 60/40 column ratio, reused its contained-section gap, and made the hero, About, and spatial-record sections collapse together at the tablet breakpoint so the right field no longer narrows down the page.
- Replaced the finite sponsor carousel with a slow right-to-left 72-second marquee that uses two equal sequences for a seamless infinite loop, pauses on hover or keyboard focus, and becomes a native static scroller for reduced-motion users.
- Made the sponsor marquee genuinely content-responsive with `ResizeObserver`: when the natural logo sequence fits, the footer renders one centered, unfocusable sequence with no duplicate, transform, overflow, or animation; resizing or future logo-count changes activate and deactivate the loop automatically.
- Removed the obsolete sponsor drag state, resize bookkeeping, arrow controls, and their translations, while keeping distinct localized accessibility labels for the static and animated states.
- Extended the responsive regression checks to protect the exhibition-detail ratios, shared breakpoint, measured sponsor-overflow gate, conditional duplicate, marquee motion, interaction pause, and reduced-motion fallback; reconciled the README, agent guidance, and style guide with the resulting layout and footer behavior.

## 0.0.11 - 2026-08-12 00:14:46 CEST

- Kept secondary landing-page exhibition titles on one clipped line, measured real overflow with `ResizeObserver`, and added a right-to-left hover/focus marquee plus a custom framed full-title tooltip with reduced-motion handling.
- Reduced the over-image “Open Exhibition” frame to a genuinely inset `9.75rem × 2.75rem` control without shrinking its label, retained the animated archive-red hover/focus state, and protected the dimensions with directory checks.
- Tightened the landing exhibition artist, location, and date rhythm so wrapped metadata remains inside its card at narrow widths.
- Renamed the featured action from “Enter 360 record” to “Enter Exhibition” with the equivalent German translation, while preserving the shorter compact label.
- Reordered exhibition-detail facts to Location, Dates, then Opening Hours and rebuilt their shared row component around a text-owned baseline, isolated icon cell, and equal `1.25rem` label/value line-height so wrapped rows align consistently.
- Extended the responsive, route, localization, and Tailwind contract checks for the new action copy, title-overflow behavior, compact frame dimensions, metadata order, and baseline structure; reconciled the style guide with each updated interaction and typography rule.
- Documented the existing static generation and guarded SFTP deployment workflow, including the pinned Node version, local credential file, dry-run command, generated-output validation, and remote `.htaccess` check.

## 0.0.10 - 2026-08-11 21:42:52 CEST

- Added an archival orbit-dial preloader to the hero kaleidoscope: the ring spans all twelve galleries with each one owning a twelfth that fills with its own download, while the centre reports the image currently in flight as a localized title, a roman-numeral counter, and its byte percentage.
- Replaced the blocking parallel texture load with a sequential one-image-at-a-time download, fetched through `XMLHttpRequest` and handed to Three.js as a blob URL, because `ImageLoader` and `TextureLoader` both document `onProgress` as unsupported and can therefore report no per-file byte progress.
- Fixed a latent failure in which a single unreachable image rejected the gating `Promise.all`, threw out of `onMounted`, and left the hero permanently blank; a failed image now resolves to a transparent fallback and the wheel still appears.
- Stopped the hero canvas flashing white on reload by sizing and clearing the drawing buffer immediately after the renderer is created, instead of leaving an unsized default buffer stretched across the hero square until every image had loaded.
- Moved texture caching into a module-scoped LRU cache sized to the twelve displayed images plus the next twelve, so imagery survives component unmount and client-side navigation, and bounded the idle background preload to one rotation's worth instead of the entire pool.
- Changed the left and right wheel controls to reshuffle the images already on screen rather than fetching new ones, so they respond instantly with no loading state, while the middle replay control still rebuilds the wheel with fresh imagery.
- Extracted the shared orbit geometry and a roman-numeral helper into `app/utils/`, added a dependency-injected LRU cache with in-flight request sharing, and added `check:preloader` with fifty-three assertions covering all of it.
- Recompressed the forty location images with TinyPNG in place, taking the pool from 86 MB to 28 MB at unchanged 1672x941 dimensions and unchanged filenames.
- Added a thirty-day `Cache-Control` header for `/images/` in `public/.htaccess`, and pinned Node to 24.11.1 with `.nvmrc`, `engines.node`, and a `packageManager` entry so builds stay reproducible.

## 0.0.9 - 2026-08-11 12:27:24 CEST

- Added the approved design specification for the hero kaleidoscope preloader under the new `docs/superpowers/specs/` location, covering the orbit-dial loading state, a module-scoped texture cache that survives component unmount, shared orbit geometry, error handling for failed image loads, and the accessibility and reduced-motion contracts.
- Recorded the measured cause of the slow hero entrance in that specification: `onMounted` gates the whole wheel on `await Promise.all(...)` over roughly 20.5 MB of imagery, and the twelve orbit arrows are hidden from first paint, so the hero square stays blank for the entire wait.
- Documented the deferred image-optimization work with measurements, including the alpha-free location PNGs converting to WebP at roughly 26× smaller, so the blocking payload and the full randomized pool can be reduced after the preloader ships and is tested.
- Established `docs/superpowers/specs/` as the home for design specifications in `AGENTS.md`.
- Added the unused `public/svg/clarity--video-camera-line.svg` working asset so the tracked worktree matches the checkout.

## 0.0.8 - 2026-07-15 12:25:24 CEST

- Completed the Tailwind CSS v4 migration across the landing page, routed gallery and exhibition records, shared navigation, footer, cards, controls, and responsive layouts; reduced the global stylesheet from 4,044 to 883 lines while retaining masks, frame assets, gradients, pseudo-elements, animation systems, and prepared Typography infrastructure globally.
- Extracted the repeated archive interface into reusable buttons, text links, search fields, metadata and fact ledgers, framed images, dividers, page chrome, paper stacks, venue/exhibition cards, and method/sponsor/footer components; added spaced structural marker rules, canonical-utility enforcement, and stable ID-seeded layout variation without SSR randomness or positional selectors.
- Added complete Nuxt i18n routing with unprefixed German, English under `/en/`, root-only browser-language detection, route-preserving language controls, localized document metadata, English source records, German ID-keyed content overlays, and parity checks for every UI message and translated collection.
- Added a site-styled privacy notice for the necessary locale cookie, local dismissal persistence, and cookie-settings actions in the header and responsive footer navigation without introducing analytics, advertising, or live-backend dependencies.
- Built the routed artist directory with an expanded A–Z dataset, surname-aware display rules, URL-backed search and letter filters, five-name group previews, draggable/keyboard-operable alphabet rails, real exhibition associations, and an accessible focus-trapped exhibition modal for artists with routed records.
- Generalized the Parkschlössl page into the dynamic `locations/[slug]` gallery route, moved venue dossier fields into local data, localized gallery and exhibition records, persisted gallery search in the URL, refined the selectable preview ledger, and rebuilt exhibition detail pages from shared responsive components.
- Reworked header and footer navigation for dense tablet/mobile layouts, including an always-available information/legal/language menu, a focus-managed footer drawer, reusable archive link states, compact buttons and metadata, responsive sponsor controls, and shared scroll cues that disappear when their destination enters view.
- Refined the kaleidoscope entrance and replay fold/fade timing, replaced two Parkschlössl preview artworks, updated the exhibition divider, and added focused checks for Tailwind markers, mobile density, localization/privacy, artist modals, gallery browsing, and archive text-link behavior.
- Updated `AGENTS.md`, `README.md`, the web style guide, and Tailwind usage guidance with the implemented route architecture, localization model, responsive contracts, component boundaries, CMS-rich-text preparation, and release verification workflow.

## 0.0.7 - 2026-07-12 19:38:13 CEST

- Rebuilt the hero kaleidoscope around perspective-projected, dual-layer Three.js slices that unfold around their own median axes with elastic settling, directional ritardando, stronger spatial tilt, coordinated clockwise/counterclockwise orbit-arrow choreography, and clean SVG hydration attributes.
- Added a forty-image randomized location pool—including thirty new generated archive-location scenes—with idle background preloading, cached selection, overlapping one-second scale/fade swaps, retained old imagery during loading, and per-triangle loading indicators.
- Upgraded the three wheel controls with shared 3D perspective, consistent hit targets, transparent idle states, directional hover/press feedback, explicit animation-disabled states, a staggered elastic entrance overlapping the hero finish, and a replay action that exits then rebuilds the kaleidoscope with fresh imagery.
- Added the post-intro archival scroll cue, subtle card lift/image-zoom feedback, animated location-list arrows, conditional sponsor scrolling guidance, and refined footer navigation with fading archival-rule underlines that never decorate logo lockups.
- Established the archive-temple identity across header, footer, browser favicon, Apple touch icon, and installable web-app icon variants; added the web manifest, theme color, normalized footer ornament masks, and equalized sponsor/menu/copyright ornament intensity.
- Consolidated the interface into archive red `#a6523c` for semantic and interactive emphasis and archive ochre `#ca9e51` for static decoration, replacing near-duplicate colors and filter-based approximations across CSS, buttons, SVG ornaments, routed dark panels, and footer assets.
- Updated the project instructions, README, style guide, and Tailwind guidance with the new hero architecture, identity assets, semantic color roles, animated underline system, logo invariants, divider treatment, and verification expectations; added Vite dependency pre-bundling for Lucide, GSAP, and Three.js.

## 0.0.6 - 2026-07-11 19:24:54 CEST

- Added the first routed location dossier for Parkschlössl in Spittal an der Drau, combining the verified Bahnhofstraße 1a address and map coordinates with the established parchment, archival-frame, measurement, typography, and responsive design system.
- Added seven real 2026 Parkschlössl exhibition records from the supplied invitations, including typed local JSON metadata, optimized WebP artwork extracted from the PDFs, direct source-invitation links, and reusable location/exhibition data access through `useArchiveData`.
- Reworked the location exhibition index into compact single-column records with hover, focus, and click selection, a sticky active preview, preloaded image swaps, visible loading and failure states, keyboard-accessible preview controls, and responsive preview-first mobile composition.
- Added a dynamic exhibition-detail route with curatorial summary, dates, venue, hours, vernissage, source PDF, related records, and an explicitly unavailable future 360-degree experience entry point.
- Extracted the landing page header and footer into shared routed components, added real active navigation and an accessible mobile menu, and upgraded the sponsor strip with keyboard-operable scroll controls while preserving pointer dragging.
- Extended the global archival CSS architecture with namespaced location and exhibition layouts, responsive rules, focus and reduced-motion states, reusable frame geometry, corrected venue-section spacing, and the architectural preservation stamp.
- Updated the frontend data contracts with location-exhibition records and venue coordinates, retained the backend-free JSON-first architecture, and verified the complete release with a successful Nuxt production build.

## 0.0.5 - 2026-07-11 17:55:55 CEST

- Refactored the hero orbit from twelve independently generated SVG paths into one canonical curved-arrow geometry reused at twelve rotated positions, then added staggered GSAP path drawing, arrowhead fades, clockwise/counterclockwise sequencing, and a progressively slowing ritardando.
- Rebuilt the Three.js kaleidoscope entrance around per-slice radial pivots so textured triangles unfold visibly from edge-on to face-on with configurable clockwise staggering, increasing start gaps and durations, elastic overshoot, reduced-motion handling, and an overlap beginning at arrow twelve.
- Turned the three kaleidoscope controls into distinct interactions: counterclockwise and clockwise one-slice rotations now travel through the triangles as lagged seven-step damped ripples, while the centre control resets and replays the complete entrance animation for rapid testing.

## 0.0.4 - 2026-07-11 16:42:27 CEST

- Added a detailed Tailwind CSS v4 usage guide covering utility shorthand, arbitrary values and properties, variants, CSS-first directives, static Vue class detection, token strategy, reusable-component boundaries, and a selective migration assessment.
- Established a strict project-wide prohibition on Vue scoped styles and CSS Modules; all custom CSS must remain globally imported, searched for existing equivalents, and namespaced when page-specific.
- Recreated the landing page's sponsor, archive-method, exhibition, artist, and footer ornaments as clean transparent raster artwork derived from the supplied landing-page mockups while preserving the archival, hand-drawn drafting character.
- Replaced 34 canonical runtime PNG ornaments with the new versions while retaining matching `_recreated_anew` source copies for comparison and future refinement; photographic location and method-composition assets remain unchanged.
- Removed the additional CSS opacity reduction from the centered and terminal copyright-row ornaments so their native PNG color and alpha render without browser-side darkening.

## 0.0.3 - 2026-07-11 08:21:47 CEST

- Added a comprehensive PERMAPHEMERA web style guide covering the implemented visual system, responsive layouts, typography, color, spacing, imagery, UI/UX, accessibility, content voice, and frontend naming conventions.
- Established the cut-corner archival frame as a non-negotiable design invariant, documenting approved nine-slice SVG borders and shared dynamic SVG masks so corners never distort and images never overflow them.
- Corrected the locations "Show more" paper stack to use the same four-corner SVG mask geometry as its frames, assigned unique mask identifiers, and populated its four sheets with distinct existing kaleidoscope images.
- Configured Nuxt to use dedicated development port `4991` by default and updated the local run documentation accordingly.
- Added a project-level `.gitignore` for Nuxt, Node, test, environment, log, editor, and operating-system artifacts, with local `_Material/` and `_BU/` design-working directories explicitly excluded from version control.
- Updated project and agent documentation so the style guide is the required reference for new or materially redesigned frontend pages.
- Made `frontend/` the standalone Git repository and project root, consolidating `AGENTS.md`, `README.md`, `changelog.md`, `.gitignore`, and the style guide there so all future commits and release closeouts are strictly limited to the frontend application.

## 0.0.2 - 2026-07-11 07:50:55 CEST

- Completed and refined the full landing-page flow across the hero, locations, selected exhibitions, artists, archive-method, sponsor, and footer sections, including responsive layouts and tighter alignment with the supplied mockups.
- Rebuilt the archive-method presentation with exported composition artwork, illustrated step markers, archival facts, framing, quote, and stamp details.
- Replaced the static sponsor artwork with a data-driven, horizontally draggable sponsor strip, individual local sponsor marks, separators, and responsive framing.
- Improved venue and exhibition artwork with refined masks, optimized decorative images, a section divider, and safer Vue bindings for dynamic SVG attributes.
- Added the remaining landing, footer, sponsor, and method assets alongside the latest design working files so the implementation and its source material remain together.
- Updated the root and frontend documentation to reflect the implemented frontend architecture, current prototype limitations, local workflow, and successful production-build status.

## 0.0.1 - 2026-07-09 15:52:05 CEST

- Created the Nuxt 4 frontend foundation in `frontend/` using the Vite-based Nuxt setup, TypeScript, Tailwind CSS v4, and local JSON data sources.
- Built the first PERMAPHEMERA landing-page prototype from the planning mockups, including the editorial parchment visual language, serif typography, rust/copper accents, decorative SVG motifs, and responsive page structure.
- Added local content data under `frontend/app/data/` for venues, locations, artists, exhibitions, and sponsors so the first milestone remains backend-free and compatible with a future Directus adapter.
- Implemented the hero area with a Three.js kaleidoscope wheel, local landing imagery, orbit arrows, CTA styling, and responsive navigation/header behavior.
- Implemented the locations section with framed search controls, archive cards, shaped image frames, local location imagery, archive arrows, and the stacked-card "Show more" treatment.
- Copied and wired runtime assets into `frontend/public/`, including landing images, frame SVGs, background ornaments, icons, and the layered paperclip SVG assets used by the stacked-card treatment.
- Added project guidance in `AGENTS.md` for the `fin-patch` closeout workflow.
