# Backlog

Work that is agreed but parked for later. Newest first.

## 🚨 PRIORITY — Protect the images from AI systems

Added 2026-11-04 by the owner. Priority: very important, at the top of the backlog.

Started 2026-11-04 (`plans/2026-11-04__ai-image-protection.md`, release 0.0.47, report for
contracts `docs/legal/2026-11-04__ki-schutz-massnahmen.pdf`): done are steps 1 to 4 and 7 below
(robots.txt, Cloudflare AI training block, TDM reservation, meta tags and nginx headers, terms,
hotlink protection; its gap for Directus images and `.webp` tour tiles closed 2026-11-09).
Open: steps 5, 6 and 8. Renew the report after each change.

Goal: AI systems must not take the images of this website (exhibition photos, artworks, the
360° tours) to train models or to copy them.

Honest limit: a public website cannot stop every copy. What can be done is: say "no" in every
form that the AI companies read, block the crawlers that ignore it, and make mass download
hard. In the EU, a machine-readable "no" counts in law: text and data mining for commercial use
is allowed only when the rights holder has not reserved it in a machine-readable form (DSM
directive 2019/790, art. 4; in Austria § 42h UrhG). The EU AI Act requires model providers to
respect this reservation.

Today: `frontend/public/robots.txt` allows every crawler (`Disallow:` empty). Nothing is blocked.

Steps (ideas, cheapest first):

1. **robots.txt:** disallow the known AI crawlers (for example GPTBot, ClaudeBot, anthropic-ai,
   CCBot, Google-Extended, Applebot-Extended, PerplexityBot, Bytespider, meta-externalagent),
   but keep Googlebot and Bingbot, so search still works. The list changes; check it again
   before building.
2. **Cloudflare:** the site already runs through Cloudflare. Turn on its AI crawler blocking
   (the "block AI bots" setting / AI crawl control) and its bot rules. This also stops crawlers
   that ignore robots.txt.
3. **Machine-readable reservation (TDM):** the `tdm-reservation` header or meta tag (TDMRep) on
   every page and image, and a `/.well-known/tdmrep.json`. Optional: the `noai, noimageai`
   robots meta tag (not a standard, but some services read it).
4. **Terms of use:** a clear sentence that text and data mining and AI training are reserved
   (§ 42h UrhG). The terms already forbid "automatisierte Massenauslese"
   (`legal.terms…noReuse`). The same sentence says "360°-Dokumentationen", which breaks
   `docs/text-rules.md` §1.1; fix it in the same change.
5. **Image metadata:** write the rights holder and "data mining: prohibited" into the IPTC/XMP
   data of the images that Directus delivers. Tested 2026-11-09: Directus drops this data from
   every resized copy (the only copies the site shows) and refuses to keep it; tour files keep
   it. Tours: the Tour Editor writes it on export (owner's idea). Directus images: own solution
   needed (`plans/2026-11-04__ai-image-protection.md`, 2026-11-09).
6. **Smaller images, no originals:** the public site gets only the sizes it shows, never the
   original file (Directus asset transformations; block `/cms/assets/<id>` without a size
   preset). Rate limits on `/cms/assets/` and `/media/tours/` against mass download.
7. **Hotlink protection** for images and tour tiles (Cloudflare), so other sites cannot embed
   them.
8. Later, to weigh: a visible watermark on download sizes; tools like Glaze or Nightshade for
   artworks (they change the image for AI models; they can also change how it looks, and they
   are the artists' decision, not the archive's).

Open questions for the owner: which images matter most (artworks, exhibition photos, tours)?
Is a watermark acceptable? Do galleries and artists need to know about these rules (for
example on `/how-it-works/` or in the terms)?

## Pilot partners and sponsors (plan ready, waiting for the owner's answers)

Added 2026-11-11. Plan: `plans/2026-11-11__pilot-partners.md` (data model `pp_partnerships`,
page `/partners/`, logo band on the start page, badges on gallery pages; sponsors later in the
same model). Six questions in its §5 need the owner's answers before building.

## Open points from 2026-11-11 (Galerie im Stiegenhaus, kultur.im.puls, Zlattinger)

Added 2026-11-11. Each needs the owner's word or material from outside.

1. **Publish the drafts:** the 11 new members of kultur.im.puls (`plans/2026-11-11__kultur-im-puls.md`)
   and Gustav Januš (`plans/2026-11-11__klaus-zlattinger-und-friends.md`). Their memberships and
   the participation appear as soon as they are published.
2. **Poster of "Klaus Zlattinger & Friends":** none is online. The exhibition shows the small
   image "Wie eine Landschaft" (468 px, artist not named). Ask Wolfgang Daborer for the poster
   or invitation PDF; then replace `image` and set `source_pdf`.
3. **Organisation logos:** `pp_organisations.logo` is filled for kultur.im.puls, but no page
   shows organisation logos. Owner to decide whether the organisation page should (design
   change, test first).
4. **Photographer of the Stiegenhaus photos:** both photos credit only "© kultur.im.puls"; ask
   Wolfgang Daborer who took them.
5. **Unused file:** the old Hauptplatz photo of Seeboden (`hauptplatz-seeboden.jpg`) is no longer
   used by any record; delete it in the admin app if wanted.
6. **Browser tests against the dev server:** run with `E2E_BASE_URL=http://localhost:4991`, the
   dev build asks `permaphemera.project-backends.info` directly, which the paced helper in
   `test/e2e/fixtures.ts` does not cover; several test browsers then get "429" and pages fail to
   load (seen 2026-11-11). Against the built site (`pnpm deploy:hetzner`) all is paced. Either
   route the dev URL through the helper too, or document that e2e runs on the built site only.
7. **Logo spelling:** the logo files and the site still show PERMAPHEMERA; the planned spelling
   "PermaPhemera" is open (see "The name on the website"). The logo SVGs are rebuilt with
   `plans/2026-11-11__brand-logo-svg/build_v2.py`.

## Open points from 2026-11-09 (newsletter modal, linked sources)

Added 2026-11-09. Small, but each needs the owner's word or a later moment.

1. **Upload the tours with their room pictures.** Every tour folder has a new `start-view.jpg`
   (the newsletter modal shows the newest one; until the upload it shows the Parkschlössl).
   Tours go up apart from the site (owner): `pnpm deploy:hetzner -- --tours <ids> --no-site` in
   `frontend/`, or the Tour Editor's upload list.
2. **Read the research notes on the sources:** `plans/2026-11-09__linked-sources/research-notes.md`
   lists facts in the texts that the linked page does not hold (e.g. Universität Klagenfurt:
   the text says 13,300 students, aau.at now more than 13,700), pages that will change ("current
   exhibition" pages), and second pages of the same site. No text was changed for them.
3. **Two drafts with a web source that cannot be reached:** `dialog-ars-carinthia-kunst-und-handwerk`
   (the stadtgalerie.net page now answers 404) and `andreas-kuchler` (the vhsktn.at course page
   is gone). Find a source before publishing; `pnpm check:data` blocks them once published.
4. **herbert-de-colle:** the CV link `https://herbertdecolle.com/CV` blocks scripts; it was
   confirmed only through search results. Open it once in a browser.
5. ~~Stadttheater Klagenfurt draft~~ and ~~Trigeniale Brda 26 drafts~~: published 2026-11-09
   (owner). Still open for Trigeniale Brda 26: admission is empty, so the site shows "free
   admission"; the spring exhibition of the same name is not recorded.
6. **Scope words on the site (owner to decide):** galleries abroad tied to Austria are in the
   archive since 2026-11-09 (`docs/text-rules.md` §5a); /venues/ counts each country, the
   overview pages show Austria only. About 15 visible texts still say only "in Österreich" /
   "Austrian galleries" (tagline, start page heading, About p6, footer line, newsletter intro).
   Proposal first, then change. Optional: a click on a country name in the /venues/ filter
   could show all galleries of that country.

## Events: a new collection for festivals and similar events

Added 2026-11-04 by the owner. **Done 2026-11-04, release 0.0.65** (`plans/2026-11-04__events-collection.md`). Kept below as the record of the decisions.

**Why.** Some records are neither a gallery nor an organisation, but an event: something that
takes place at a set time, often every year, and shows one or more exhibitions. The archive has
no place for them, so they were entered as organisations. The owner's words: "Austriatoon
organises a festival that is called 'Comicfestival', but that is neither an organisation nor a
gallery. It is an event, and for events we do not have a table yet."

**Today (2026-11-04).**

- `pp_organisations` "Spittaler Comicfestival" (`spittaler-comicfestival`, id `185a515d-…`,
  kind `initiative`): the owner sets it to draft. Its texts (lede, description, `about_html`,
  SEO, de and en) are the event's texts and must move, not get lost.
- Rows that point to it (they stay; a draft end is hidden on the site, and since 0.0.63
  `check:data` accepts a link row to a draft):
  - `pp_exhibition_organisers`: "Auf Linien zum Leben" (`auf-linien-zum-leben`), role
    `organiser`. Austriatoon stays on it as `presenter`.
  - `pp_organisation_venue_relations`: `exhibits_at` Parkschlössl.
  - `pp_mm__news_organisations`: two news articles ("Spittal an der Drau, the first partner",
    "The summer at the Parkschlössl").
- The news text "Der Sommer im Parkschlössl" linked `/organisations/spittaler-comicfestival/`;
  the link was removed on 2026-11-04 (the words stay). Link it to the event page again.
- The 360° tour of "Auf Linien zum Leben" is in `media/tours/2026-06-15-parkschloessl-spittal-comic-festival/`.
- A second case: the **ORF Lange Nacht der Museen** (3 October 2026). Four exhibitions name it
  only as text in `date_range` or `vernissage` (`mediterraneo-harald-scheicher-2026`,
  `schwach-unperfekt-ausgefranst-echt-2026`, `spannungsfelder-und-perspektiven-2026`,
  `walther-preiml-sehnsucht`), and the texts of the Kunstverein Velden, the Europahaus Klagenfurt
  and the stARTup gallery mention it. The skill for new data already knows "a Lange Nacht der
  Museen presentation".
- Maybe also: the pop-up gallery in Knittelfeld where the art calendar "Hoffnung und Frieden"
  was presented (owner to decide; it may simply be a place).

**Proposal (to agree with the owner before building).**

1. **Schema** (`directus/scripts/schema.mjs` and every file root `AGENTS.md` lists for a schema
   change; never only in the admin app):
   - `pp_events`: `status`, `title`, `slug`, `kind` (`festival`, `long_night`, `presentation`,
     `fair`, …), `location` (M2O `pp_locations`, the town; empty for a nation-wide event like the
     Lange Nacht), `recurring` (yearly or once), `lede`, `description`, `about_html`, `image` +
     `image_alt` + `image_caption`, `website_url`, `seo`, `translations` (de/en, the English
     mirrored on the record, as on every collection).
   - `pp_event_editions` (one row per year or edition): `event` (M2O), `edition_number` (the
     "seventh" Comicfestival), `year`, `start_date`, `end_date`, `title_suffix` or theme,
     `translations`. Alternative: no editions table, one `pp_events` record per year; simpler,
     but the yearly series then has no page of its own. Owner decides.
   - Exhibitions belong to an edition: `pp_exhibitions.event_edition` (M2O; an exhibition is part
     of at most one event) or a junction `pp_mm__exhibitions_events` if one exhibition can be
     part of two events. Proposal: the M2O.
   - `pp_event_organisers` like `pp_exhibition_organisers`: `event`, `organisation`, `role`
     (`organiser`, `presenter`, `cooperation`, `supporter`), `sort`. Austriatoon becomes the
     organiser of the Comicfestival here.
   - Junctions like the others: `pp_mm__events_venues` (places of an edition without an
     exhibition record), `pp_mm__events_websites`, `pp_mm__news_events`, maybe
     `pp_mm__events_sponsors`.
   - No status on the junction rows (owner rule: status on records, not relations).
2. **Data move** (production Directus, as drafts first, the owner publishes):
   - New event "Spittaler Comicfestival" with the texts of the organisation record; edition 7
     (2026) with "Auf Linien zum Leben"; organiser Austriatoon; place Parkschlössl; the two news
     links. Link the news text to `/events/spittaler-comicfestival/` again.
   - Then the old organisation record: delete it, or keep it as draft (owner decides; nothing
     may point to it then).
   - New event "ORF Lange Nacht der Museen", edition 2026 (3 October) with the four exhibitions.
3. **Website** (frontend; components first, test first, as `frontend/AGENTS.md` says):
   - Data: `COLLECTIONS` and `fieldsQuery` in `shared/archive-schema.mjs`, the loader, a
     `resolveEvents` util with unit tests; drafts drop out as everywhere.
   - Page `/events/<slug>/` (and `/en/events/<slug>/`): hero with the shared hero components,
     the text, the editions newest first, each with its exhibition cards (`ExhibitionCardGrid`),
     the organisers, places and links. SEO in `shared/seo.mjs`, sitemap, SEO snapshot.
   - Where events show up: on an exhibition page ("Teil des Spittaler Comicfestivals 2026" /
     "Part of …", linked); on an organisation page (the events it organises); on a gallery page
     (the events held there); news link chips; the search on the exhibitions page can also find
     the event name.
   - An index page `/events/` and a menu item: only if the owner wants them (few events now).
   - Texts follow `docs/text-rules.md` (value-free, no "wir", no "Sie").
4. **Checks:** `check:data` gets the event rules (slugs unique, en translation, every edition
   resolves its event, edition dates inside each other, organiser rows resolve); e2e test for
   the event page and the "part of" link on an exhibition page.
5. **Skills and docs:** the two data skills (`rowild-new-gallery-creation`,
   `rowild-create-or-update-gallery-or-exhibition-in-permaphemera`) and
   `docs/how-to-gallery-and-exhibition.md` learn to create an event instead of an organisation
   for a festival; `PROJECT_INFO.md` if the workflow changes.

**Questions for the owner (before building).**

- Editions table, or one record per year?
- An events index page and a menu item, or only event pages linked from exhibitions?
- Is the Lange Nacht der Museen an event in this sense (one night, many places, nation-wide)?
- The pop-up gallery in Knittelfeld: an event or a place?
- The old organisation record "Spittaler Comicfestival": delete or keep as draft?

## Question: does PERMAPHEMERA need visitor accounts?

Added 2026-11-04 by the owner, as a question only. Not started.

Open question for the owner: is there a task that only an account can do? Possible uses, to
weigh against the cost (passwords, password reset, GDPR requests, deletion, support, a new
privacy section):

- Favourites or a "visited" list of exhibitions and galleries.
- Ratings that count once per person (see "Ratings" below).
- Newsletter settings (a newsletter provider usually handles this without a site account).
- A different kind of account: a login for galleries, so a gallery can send its own exhibitions
  as drafts. This could be worth more than visitor accounts.

Until a task needs it: no accounts.

## Ratings for exhibitions (5 stars)

Added 2026-11-04 by the owner. Not started.

Idea: visitors rate exhibitions with 1 to 5 stars, so there is a statistic of the most liked
exhibitions. Visitors are very welcome to rate (owner).

No conflict with "value-free" (owner, 2026-11-04): `docs/text-rules.md` §1.7 means that the
archive itself does not judge which gallery or exhibition belongs (only the usual limits:
human rights, religion, politics). A rating is the visitors' voice, not the archive's. The
archive's own texts stay value-free; the stars are shown as what visitors gave.

To work out in detail before building (owner): protection against bullies, fake votes and
attacks.

Bullies and unfair votes (ideas):

- Stars only, no free-text comments. No text means no insults to moderate.
- Show an average only after a minimum number of votes (for example 10), so two angry votes
  cannot pull an exhibition down.
- Watch for bursts: many low votes for one exhibition in a short time are held back and shown
  to the owner, not counted at once.
- The owner can remove votes or reset an exhibition's rating in Directus.
- Optional: votes only for exhibitions whose 360° tour is online, so the voter could see it.

Also useful: Umami already counts page views and time on page per exhibition and tour
(cookieless). It shows interest without any rating function and can sit next to the stars in
the statistic.

Protection without accounts (good enough, not perfect):

- One vote per exhibition per browser (a flag in the browser's storage). Easy to get round,
  but stops most double votes.
- Votes go to a small endpoint on the Hetzner server, not to the public Directus API (which
  must stay read-only for the public).
- The server keeps no raw IP address. It keeps a hash of IP + exhibition with a salt that
  changes every day, and allows one vote per hash per day.
- Rate limit per IP at nginx and at Cloudflare, so a script cannot send thousands of votes.
- Cloudflare Turnstile (a check without cookies and without puzzles) on the vote.

Only accounts stop double votes for sure (see "visitor accounts"). Privacy policy needs a new
section either way.

## Geo search: exhibitions and galleries near the visitor

Added 2026-11-04 by the owner. Not started.

Idea: the site finds where the visitor is and lists the galleries and the current exhibitions
nearby, nearest first.

What exists: every town (`pp_locations`) has `latitude` and `longitude` (town centre), and every
gallery has a town. So a radius search by town works without new data. For more precise
distances, galleries could get their own coordinates later.

How (sketch):

- The browser asks the visitor for permission (Geolocation API). The position stays in the
  browser; the site computes the distances there and sends the position to no server. Then the
  privacy policy needs only a short note.
- Without permission: the visitor picks a town or a federal state, or types a postcode.
- List: galleries within a radius (for example 25, 50, 100 km, selectable) and their current
  and upcoming exhibitions, nearest first. Optional: a map.
- Place: a filter on /venues/ and /exhibitions/current/, or a button "In der Nähe" / "Nearby".

## Tags: what kind of exhibition it was

Added 2026-11-03 by the owner. Not started.

Each exhibition gets tags that say what kind of exhibition it was, so visitors can filter the
archive (for example all sculpture, all photography). Tags describe; they never rate (value-free,
`docs/text-rules.md` §1.7). German and English for every tag.

Ideas for the first tag list (owner to choose, add, remove):

- **Medium / technique:** Malerei / painting · Zeichnung / drawing · Grafik, Druckgrafik /
  printmaking · Fotografie / photography · Skulptur, Plastik / sculpture · Installation /
  installation · Objektkunst / objects · Textilkunst / textile art · Keramik / ceramics ·
  Video, Medienkunst / video and media art · Digitale Kunst / digital art · Mischtechnik /
  mixed media · Kunsthandwerk, Design / craft and design · Architektur / architecture ·
  Comic, Illustration / comics and illustration · Künstlerbuch / artists' books ·
  Street Art / street art
- **Theme:** Natur, Umwelt / nature and environment · Landschaft / landscape · Mensch, Porträt /
  people and portraits · Körper / the body · Abstraktion / abstraction · Mythos, Religion /
  myth and religion · Geschichte, Erinnerung / history and memory · Gesellschaft, Politik /
  society and politics · Stadt, Raum / city and space · Wissenschaft, Kosmos / science and
  the cosmos
- **Format:** Einzelausstellung / solo exhibition · Gruppenausstellung / group exhibition ·
  Retrospektive / retrospective · Mitgliederausstellung / members' exhibition ·
  Grenzüberschreitend, Alpe-Adria / cross-border · Inklusive Kunst / inclusive art ·
  Kinder und Jugend / children and young people · Lange Nacht der Museen · Kunstpreis,
  Wettbewerb / award and competition

Open questions for the owner: one flat list or groups (medium, theme, format)? Who sets the
tags (owner only, or from the invitation by an AI, then checked)? How does it relate to the
existing free-text `medium` field and to `kind` (exhibition / event)?

Technical sketch: a `pp_tags` collection (name and slug, `translations`, a `group`), many-to-many
with `pp_exhibitions`; filter chips on /exhibitions/, a tag line on the exhibition page and the
cards. Schema change by the root `AGENTS.md` rule (`schema.mjs`, `archive-schema.mjs`,
`content.ts`, `_Plans/exhibitions-plan.md` §2).

## 🚨 URGENT — Improve the site texts: no metaphors, no AI slop

Added 2026-10-25. Priority: urgent, before the newsletter.

Rewrite the site's texts so that they inform. Remove the metaphors and the empty, AI-sounding
phrases. A heading says what the section shows; the text below it says what a visitor can do
or find there. Go through every page, German and English, the locale files and the fixed texts
in Directus, and the SEO texts (`*.seoTitle`, `*.seoDescription`).

Rules (owner):

- It is a website, not a story book: people must find content and know what it is about.
- No personal pronouns ("wir", "uns", "unser" / "we", "us", "our"), except where a person or
  the team speaks on purpose ("about us", imprint). Important.
- Explanations, not instructions. Avoid "Sie" / "you" wherever possible: "Suchen Sie nach
  Titel, Künstler:in, …" becomes "Nach Titel, Künstler:in, … suchen". Buttons and field labels
  ("Suchen", "Search") stay as they are.
- An exhibition is an exhibition, a 360° tour is a 360° tour: never a "document",
  "Dokument", "Dokumentation", "spatial record" or similar.
- Say "exhibition" / "Ausstellung", never "show".
- An eyebrow and a title never say the same thing.
- A header is one word or one short phrase, like a chapter title. Avoid the two-part slogan
  pattern ("Zuletzt eröffnet, jetzt im Archiv.", "Temporäre Begegnungen. Bleibende
  Spuren."): it reads as AI text and gets boring when every header has it. This is a hint,
  not a law: a comma is fine where the phrase needs it. The goal is a good, natural text.

Done on 2026-10-25: the whole start page, section by section with the owner
(`docs/text-audit/start-page.md`). Done on 2026-10-26: the header and footer of every page,
and the error page (`docs/text-audit/header-footer.md`). The rules now live in `docs/text-rules.md` (the owner's
rules, a word list, the method after impeccable "clarify", the audit workflow). Next pages:
About, How it works, the index pages, contact.

Interim: the header of /exhibitions/ said "Die Ausstellungen, die wir festhalten." / "The
exhibitions we hold on to."; since 2026-10-25 it says "Ausstellungen, die festgehalten werden"
/ "Exhibitions that are captured". Better than before, not yet the best.

Value-free (owner, 2026-10-25): no "kuratiert", "ausgewählt", "Kuration" / "curated",
"selected", "curation" about exhibitions, galleries or the archive. Still found in: the header
line on every page (`site.headerTagline` "Ein kuratiertes Archiv von Ausstellungen"), the
footer (`footer.tagline`, `footer.curated`), About (`about.body.p3`, `p6`), How it works
(`howItWorksPage.intro`, `sections.selection` "Das 360°-Archiv ist kuratiert."), contact
(`contactPage.sections.selection`). The selection section of How it works describes a
selection that the owner does not make; it needs new content, not new words.

Known next: the locale files still hold "wir/uns/unser…" 10 times (de) and "we/us/our" 12
times (en); keep them only on pages where a person speaks on purpose. "Sie/Ihr/Ihnen" appears
about 49 times (de, on 14 pages, some of them "sie" = "they" at a sentence start) and
"you/your" 32 times (en, mostly privacy, legal and contact). Ask the owner before changing the
privacy and legal texts. Then
`fallbackLede` ("temporäre Begegnungen, versammelt in einer erinnerten
architektonischen Hülle"), the footer tagline ("360°-Ausstellungsdokumentationen"), the "How it
works" page ("ergänzen das räumliche Dokument"), the contact page ("räumliche Dokumentationen"). The
locale files hold "Dokument…" 37 times (de) and "document…" 30 times (en); check each one
(a PDF invitation may stay a document).

## Safari kit run (separate task)

Added 2026-10-25. Run only when the owner asks; never part of a release or a deploy.

The full kit (`pnpm qa:safari`, see `frontend/qa/safari/README.md`) takes about an hour and
boots iOS Simulators. Run it on the live site (default target). Changes shipped since the last
run (2026-10-23, release 0.0.26) that it should cover:

- 0.0.35: card inset 24 px above 700 px; shadow room in the phone sliders; tile shadow
  `0 1px 2px`; the real Cormorant 400 italic; bold at 500; the ResizeObserver fix on /venues/.
  Checked on 2026-10-24 with Playwright WebKit and Chromium only (no Simulator, no Mac Safari).

## Footer: what support is for (December 2026 / January 2027)

Added 2026-10-26. The owner decides in December or January what support pays for and how it
works. Then revisit the supporters part of the footer (`footer.callTitle`, `footer.callText`,
`footer.callLink`; `docs/text-audit/header-footer.md`) and say it there. Until then the text
stays as it is: "Diese Zeile ist für die Namen von Fördernden, Sponsor:innen und
Partnerinstitutionen reserviert. Der erste Platz ist noch frei."

## ❗ IMPORTANT — Newsletter implementation (after the texts)

Added 2026-10-24. Priority: important. Next after the texts.

Build the newsletter sign-up. The plan of 2026-08-13 is `_Plans/newsletter-subscription.md`
(Brevo, double opt-in, towns to choose, links in footer and menu, no open or click tracking).
Parts of it are out of date: it names the old ALL-INKL host and the JSON files in `app/data/`;
the site now runs on Hetzner and reads Directus. Check the plan with the owner before the work
starts. The privacy page already says that a newsletter is planned and not active
(`privacy` texts in `frontend/i18n/locales/`); change those texts in the same release.

**State 2026-11-07, evening: live (release 0.0.67).** Brevo is set up (domain, sender,
lists 6/7, templates #2/#3, tracking off via consent, logs 1 month), the endpoint and the weekly
key check run on the server. Open: the owner's test sign-up, publishing the menu item
(Directus `pp_navigation_items` key `newsletter`), the lawyer, the first issue.
Earlier state: **built, waiting for the owner's Brevo setup.** The owner decided: no PHP,
sender `newsletter@permaphemera.at`, "monthly, but only if there is news", first issue about the
site going online, lawyer later. New plan `plans/2026-11-07__newsletter.md`; code on branch
`feature/newsletter` (Directus endpoint, form, pages, invite, privacy texts, tests); the menu
item is a draft in Directus. Open: the owner's steps in
`plans/2026-11-07__newsletter/brevo-setup.md` (mail address at ALL-INKL, Brevo account, domain
records in Cloudflare, API key, templates), then the launch (step 7 there), then the lawyer.

## The name on the website: PermaPhemera instead of PERMAPHEMERA (parked)

Added 2026-11-07 during the newsletter work. The owner: the name is written PermaPhemera
(newsletter, mails and Brevo already do). The website still writes PERMAPHEMERA in about 174
places (texts, the `· PERMAPHEMERA` title suffix, legal pages). **The logo stays as it is**
(owner: "leave the logo untouched, it is good as it is"). Parked to finish the newsletter first;
ask the owner before starting.

## Safari: real devices and other Safari versions (not important, later)

Added 2026-10-22 as an emergency; since 2026-10-25 not important, for later.

The Safari kit is on `main` since 2026-10-25 (`frontend/qa/safari/`, `pnpm qa:safari`; the
QA checklist skill has its Safari step). Its review of 2026-10-23
(`frontend/qa/safari/FINDINGS-2026-10-23.md`) found no Safari bug; its 4 cross-browser
findings were fixed on 2026-10-24. Two checks were not possible with the kit alone:

1. Real devices: `pnpm qa:safari:serve --lan`, then open the printed address on a real iPhone
   and on an iPad with a trackpad (only there do hover effects work on iOS).
2. Safari 18 and Mac Safari 27 at runtime: the iOS 18 Simulator (a download from
   developer.apple.com), this Mac's Safari updated to 27, or a cloud browser service.
