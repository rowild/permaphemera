# Worklog: away run of 2026-11-07

Task (owner): update the newsletter plan's technical part without PHP; research whether
`newsletter@permaphemera.at` can send; cadence "monthly, but only if there is news"; first issue
about the site being online; lawyer later; then build as much as possible. All rights except
deleting.

## Done and how it was checked

| What | Where | Checked with |
|---|---|---|
| E-mail research | `email-research.md` | `dig`, `whois`, an SMTP `RCPT TO` test against ALL-INKL, Brevo and Cloudflare docs |
| New plan | `../2026-11-07__newsletter.md` | — |
| Directus endpoint (no PHP) | `directus/extensions/permaphemera-newsletter/` | 25 unit tests; loaded in a throwaway Directus 11.17.4 (Docker): checks answer as planned, draft towns skipped, the call reached Brevo (401 for the fake key, logged without the address) |
| Brevo setup script | `directus/scripts/brevo-setup.mjs` | 6 unit tests; runs and stops cleanly without a key and with a fake key (401) |
| Form, pages, invite, privacy texts, SEO | `frontend/…` (see the plan §4) | `pnpm verify` (470 tests, lint, Tailwind, conventions, types); Playwright on the built site: all 167 tests at 1440/1024/390 px, among them 9 new newsletter tests; the SEO snapshot step (sitemap has `/newsletter/`, the two landing pages `noindex`); by hand in Chrome (dev server + throwaway Directus): form → endpoint → Brevo, towns, phone layout, invite timing (start page: after the intro, 15 s) |
| Menu entry | Directus production, `pp_navigation_items` key `newsletter`, **draft** | public API returns nothing for it |
| First issue (draft) | `issue-01-de.md`, `issue-01-en.md` | numbers read from the site's own pages and Directus on 2026-11-07 |
| Confirmation mails | `doi-template-de.html`, `doi-template-en.html` | — (to paste into Brevo) |
| Owner's steps + launch | `brevo-setup.md` | — |
| Server install script | `directus/hetzner/install-extension.sh` | `bash -n` only; **not run** (no deploy without the owner's word) |
| Docs | `AGENTS.md`, `frontend/AGENTS.md`, `directus/README.md`, `directus/hetzner/README.md`, `.env.example` files, `BACKLOG.md`, note in `plans/2026-11-07__newsletter/older-plan-subscription.md` | — |

## Decisions made alone

1. **Directus endpoint extension** as the server part: Directus already runs on Hetzner and is
   same-origin under `/cms/`; no new service, the key stays in the Directus `.env`.
2. **Sender `newsletter@permaphemera.at`**, not the Gmail address: Gmail's DMARC makes a
   `@gmail.com` sender from Brevo unusable (Brevo rewrites it).
3. Receiving mail: **ALL-INKL forward recommended** (no DNS change); Cloudflare Email Routing as
   fallback.
4. **Brevo attributes as text `|a|b|`** instead of multiple-choice: a new town needs no change
   in Brevo. Names with the prefix `NL_`.
5. Towns come from Directus (published `pp_locations`), on the server too; drafts can never be
   chosen.
6. At least one topic must stay checked (`missing_topic`).
7. Bot checks: honeypot and a form sent within 2 s answer "pending" silently; no upper time
   limit (a person may leave the tab open).
8. Rate limit 5 per hour and IP, in memory (a restart forgets it); IP from `CF-Connecting-IP`.
9. The invite is a **non-modal panel** (like the cookie notice): it does not take the focus and
   needs no answer. On phones it only links to `/newsletter/` (the form covered 60 % of the
   screen). The old plan's "focus trap" and "40 % bottom sheet" are replaced by this.
10. The invite waits for the start page's wheel intro, at most 30 s.
11. Privacy page: Brevo named as "Sendinblue SAS (Brevo), Paris, Frankreich" **without street**:
    Brevo's own pages give three different addresses. The exact one comes from the DPA.
    **Resolved later the same day:** the DPA is Appendix 3 of Brevo's Terms of Service; for
    users in Austria the contract partner is Brevo GmbH, Köpenicker Str. 126, 10179 Berlin. The
    privacy page now names it.
12. Privacy page date set to 7 November 2026 (it changes only with the launch merge).
13. Consent text in the first person ("Ich möchte …"): a consent is the visitor's own statement;
    the text rules allow legal texts to address the reader. Lawyer checks it later.
14. Work on **branch `feature/newsletter`** in a worktree: other sessions deploy from `main`,
    and nothing of this may go live before the owner's word.
15. `ArchiveCheckbox` extracted (the cookie notice had the markup three times; owner's rule:
    duplication is a defect).
16. Found on the way and fixed: `ArchiveFloatingTooltip` lost its caller's class (Vue warned
    once per exhibition card); it now passes it to the teleported tooltip, with a test.

## Missing (needs the owner)

- Mail for `newsletter@permaphemera.at` (ALL-INKL) — today mail to the domain bounces.
- Brevo account, domain records in Cloudflare, API key, templates, authorized IP, tracking off,
  unsubscribe redirect: `brevo-setup.md` steps 1–6.
- Brevo's exact company name and address from the DPA (for the privacy page).
- What Brevo does with unconfirmed sign-ups (the texts promise deletion after 30 days).
- The word "Newsletter starten" for the launch; the lawyer later.

## Side effects on this Mac

- Docker Desktop asked for an admin password at start; it was quit. **Colima** (the other
  Docker engine here) was started and became the current Docker context. Switch back with
  `docker context use desktop-linux` (done at the end of the run: Colima stopped, context back on desktop-linux).
- A throwaway container `pp-newsletter-test` and volume `pp-newsletter-test-db` (test data only).
