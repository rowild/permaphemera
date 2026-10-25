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
  the team speaks on purpose ("about us", imprint). Important. Whether "Sie" / "you" is also
  meant is not clarified yet.
- An exhibition is an exhibition, a 360° tour is a 360° tour: never a "document",
  "Dokument", "Dokumentation", "spatial record" or similar.
- Say "exhibition" / "Ausstellung", never "show".
- An eyebrow and a title never say the same thing.
- A header is one word or one short phrase, like a chapter title. Avoid the two-part slogan
  pattern ("Zuletzt eröffnet, jetzt im Archiv.", "Temporäre Begegnungen. Bleibende
  Spuren."): it reads as AI text and gets boring when every header has it. This is a hint,
  not a law: a comma is fine where the phrase needs it. The goal is a good, natural text.

Done on 2026-10-25, as the first example: the start page section above the selected
exhibitions (`landing.exhibitions`). It said "Temporäre Begegnungen. Bleibende Spuren.
Ausgewählte Ausstellungen, bewahrt als räumliche Dokumente." The header is now "Zuletzt
eröffnet", and the text below says what the 360° tours offer.

Interim: the header of /exhibitions/ said "Die Ausstellungen, die wir festhalten." / "The
exhibitions we hold on to."; since 2026-10-25 it says "Ausstellungen, die festgehalten werden"
/ "Exhibitions that are captured". Better than before, not yet the best.

Known next: the locale files still hold "wir/uns/unser…" 10 times (de) and "we/us/our" 12
times (en); keep them only on pages where a person speaks on purpose. Then
`fallbackLede` ("temporäre Begegnungen, versammelt in einer erinnerten
architektonischen Hülle"), the footer tagline ("360°-Ausstellungsdokumentationen"), the "How it
works" page ("ergänzen das räumliche Dokument"), the contact page ("räumliche Dokumentationen"). The
locale files hold "Dokument…" 37 times (de) and "document…" 30 times (en); check each one
(a PDF invitation may stay a document).

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
