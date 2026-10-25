# Backlog

Work that is agreed but parked for later. Newest first.

## 🚨 URGENT — Improve the site texts: no metaphors, no AI slop

Added 2026-10-25. Priority: urgent, before the newsletter.

Rewrite the site's texts so that they inform. Remove the metaphors and the empty, AI-sounding
phrases. Example from the start page (`landing` texts in `frontend/i18n/locales/de.json`, line
99 and 101, and the same in `en.json`):

> Temporäre Begegnungen. Bleibende Spuren.
> Ausgewählte Ausstellungen, bewahrt als räumliche Dokumente.

Another example: `fallbackLede` in `en.json` ("temporary encounters gathered within a
remembered architectural shell"). A heading says what the section shows; the text below it
says what a visitor can do or find there. Go through every page, German and English, the
locale files and the fixed texts in Directus, and the SEO texts (`*.seoTitle`,
`*.seoDescription`).

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
