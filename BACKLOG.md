# Backlog

Work that is agreed but parked for later. Newest first.

## 🚨 PRIORITY — Protect the images from AI systems

Added 2026-11-04 by the owner. Priority: very important, at the top of the backlog.

Started 2026-11-04 (`plans/2026-11-04__ai-image-protection.md`): steps 1, 3 and 4 below are in
the repository (robots.txt, TDM reservation, meta tags, terms). Next: nginx headers and the
Cloudflare settings (plan, steps 5 and 6), then steps 5 to 7 below.

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
   data of the images that Directus delivers.
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
