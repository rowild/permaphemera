# Backlog

Work that is agreed but parked for later. Newest first.

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
