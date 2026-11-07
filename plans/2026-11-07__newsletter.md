# Newsletter: plan of 2026-11-07

Status: **in work on branch `feature/newsletter`** (worktree folder `worktree-newsletter/` in the project root; moved there from the hidden `.claude/worktrees/newsletter` on 2026-11-07 at the owner's request: project work stays visible in the project folder).
Replaces the technical parts of `_Plans/newsletter-subscription.md` (2026-08-13). That plan
stays as background for the reasons behind the topics (§2), the legal rules (§7) and the
choice of Brevo (§8). Where the two disagree, this plan wins.

Files of this plan: `plans/2026-11-07__newsletter/`

- `email-research.md`: can `newsletter@permaphemera.at` send mail? (yes; how)
- `brevo-setup.md`: the owner's steps in Brevo, ALL-INKL and Cloudflare, in order
- `doi-template-de.html`, `doi-template-en.html`: the confirmation mails, to paste into Brevo
- `issue-01-de.md`, `issue-01-en.md`: draft of the first newsletter
- `worklog.md`: what was done in the away run of 2026-11-07, with every decision

## 1. Decisions

| Question | Decision | By |
|---|---|---|
| Provider | Brevo (France, EU servers). Brevo holds the subscribers. | owner, 2026-08 |
| Server part | **No PHP.** A Directus endpoint extension: `directus/extensions/permaphemera-newsletter/`. Directus already runs on Hetzner and is reached same-origin at `https://permaphemera.at/cms/`, so the form posts to `https://permaphemera.at/cms/newsletter/subscribe`. The Brevo API key stays in the server's Directus `.env`. | owner (no PHP), Claude (Directus) |
| Sender | `newsletter@permaphemera.at`. Possible: see `email-research.md`. | owner |
| Cadence | "Monthly, but only if there is news." Form text: "Einmal im Monat, nur wenn es Neues gibt." / "Once a month, only when there is news." | owner, 2026-11-07 |
| First mail | The site's presence online: what the archive holds (galleries, exhibitions, artists, 360° tours, in numbers). Draft in `issue-01-*.md`. | owner, 2026-11-07 |
| Lawyer | Later, before the first real sign-up. Not now. | owner, 2026-11-07 |
| Opt-in | Double opt-in through Brevo (`POST /v3/contacts/doubleOptinConfirmation`). | 2026-08 |
| Tracking | Open and click tracking off in Brevo. | 2026-08 |
| Topics | The 4 of the old plan, all checked by default: `new_records`, `nearby`, `closing_soon`, `project_news`. At least one must stay checked. | 2026-08 |
| Towns | Optional. The list comes from Directus (`pp_locations`, published), grouped by federal state. No list in code, so a new town needs no work. None chosen = all of Austria. | 2026-08, Claude (from Directus) |
| Entry points | Footer and header menu (one Directus navigation item, draft until launch), the page `/newsletter/`, a small invite after 10 s (30 days quiet after "no", never again after a sign-up; on phones only a link to the page). | 2026-08 |
| Launch switch | Nothing goes live before the owner's word. The branch is merged on launch day; the menu items are published that day. | Claude |

## 2. How it works

```
Browser (static Nuxt site, permaphemera.at)
  ArchiveNewsletterForm → useNewsletterSubscription
    │ POST /cms/newsletter/subscribe  (same origin, JSON)
    ▼
nginx (/cms/ → Directus container, prefix removed)
    ▼
Directus endpoint extension "newsletter"   (directus/extensions/permaphemera-newsletter)
  • checks the request (honeypot, time, origin, consent, e-mail, rate limit)
  • keeps only known topics, and towns that are published in pp_locations
  • adds the federal states of the towns
  • holds the Brevo key (env NEWSLETTER_BREVO_API_KEY)
  • answers the same for a new and a known address
    │ POST https://api.brevo.com/v3/contacts/doubleOptinConfirmation
    ▼
Brevo: sends the confirmation mail; after the click the contact joins the list
    │ click → redirectionUrl
    ▼
/newsletter/confirmed/  (or /en/newsletter/confirmed/)
```

Unsubscribe: the link in every Brevo mail leads to Brevo's own unsubscribe page; the status lives
only in Brevo (owner, 2026-11-07: no page of our own, no redirect).

## 3. The endpoint

`POST /newsletter/subscribe` (Directus; public URL `https://permaphemera.at/cms/newsletter/subscribe`)

Request (JSON):

```json
{
  "email": "person@example.at",
  "name": "Maria Beispiel",
  "language": "de",
  "towns": ["wien", "graz"],
  "topics": ["new_records", "nearby", "closing_soon", "project_news"],
  "consent": true,
  "consentVersion": "2026-11-nl-v1",
  "source": "page",
  "pageUrl": "https://permaphemera.at/newsletter/",
  "website": "",
  "startedAt": 1762473600000
}
```

Answer: always HTTP 200 with `{ "ok": true, "state": "pending" }` or
`{ "ok": false, "error": "<code>" }`. Codes: `invalid_request`, `invalid_email`,
`missing_consent`, `missing_topic`, `rate_limited`, `unavailable` (not configured yet),
`upstream_error`. A known address gets the same `pending` as a new one.

Checks, in order: configured → origin allowed → body is an object → honeypot `website` empty
(else silent `pending`) → `startedAt` at least 2 s ago (else silent `pending`) → rate limit
(5 per hour and IP; IP from `CF-Connecting-IP`, else `req.ip`) → `consent === true` →
e-mail (trimmed, lower case, ≤ 254, simple form check) → topics (known keys, ≥ 1) → towns
(published slugs only) → language `de` | `en`.

Environment (Directus `.env`, production: `directus/.env.remote`, never in git):

| Variable | Example | Note |
|---|---|---|
| `NEWSLETTER_BREVO_API_KEY` | `xkeysib-…` | Without it every request answers `unavailable`. |
| `NEWSLETTER_BREVO_LIST_DE`, `NEWSLETTER_BREVO_LIST_EN` | `3`, `4` | Brevo list ids (`directus/scripts/brevo-setup.mjs` prints them). |
| `NEWSLETTER_BREVO_TEMPLATE_DE`, `NEWSLETTER_BREVO_TEMPLATE_EN` | `5`, `6` | Ids of the two DOI templates. |
| `NEWSLETTER_BREVO_SITE_URL` | `https://permaphemera.at` | Base of the redirect after the confirmation. |
| `NEWSLETTER_BREVO_ALLOWED_ORIGINS` | `https://permaphemera.at,http://localhost:4991` | Comma list. |

Brevo contact attributes (all text, except the date; created by `brevo-setup.mjs`):
`NL_NAME`, `NL_LANGUAGE`, `NL_TOPICS`, `NL_TOWNS`, `NL_REGIONS`, `NL_SOURCE`, `NL_SIGNUP_URL`,
`NL_CONSENT_VERSION`, `NL_SIGNUP_DATE` (date). Lists of values are written as `|a|b|`, so a
Brevo segment can ask "`NL_TOWNS` contains `|graz|`" and a new town needs no change in Brevo.
(The old plan's multiple-choice attributes needed every town typed into Brevo by hand.)

## 4. Frontend

| Piece | What |
|---|---|
| `app/utils/newsletter.ts` | Pure logic: topics, towns grouped by state, the request body, the invite rule. Unit tests. |
| `app/composables/useNewsletterSubscription.ts` | The POST and its state (`idle`, `sending`, `pending`, `error`). |
| `app/composables/useNewsletterInvite.ts` | Shows the invite or not; stores `permaphemera-newsletter-invite` in localStorage. |
| `ArchiveCheckbox.vue` | One checkbox row (box, title, note). Also used by the cookie notice, which had the same markup three times. |
| `ArchiveNewsletterForm.vue` | The form, `variant: 'page' | 'compact'`. |
| `ArchiveTownSelect.vue` | Towns grouped by federal state. |
| `ArchiveNewsletterInvite.vue` | The small invite (bottom panel, `archive-modal-frame`). |
| `pages/newsletter/index.vue`, `confirmed.vue` | The two routes (de unprefixed, en under `/en/`). The page `unsubscribed.vue` was removed 2026-11-07. |
| `i18n/locales/*.json` | `newsletter.*` keys; privacy: the "planned" section becomes the Brevo section. |
| `shared/seo.mjs` | `/newsletter/` in the sitemap; the two other pages `noindex`. |

Invite rules: not before the cookie notice is answered; on the start page not before the intro
has finished; never on the legal pages and on `/newsletter/…`; after "close" quiet for 30 days;
after a sign-up never again; on phones a bottom panel, never the full screen.

## 5. Phases

| # | Phase | Who | State |
|---|---|---|---|
| 0 | Brevo account, domain, mail address, lists, templates, key | owner (`brevo-setup.md`) | open |
| 1 | Directus endpoint extension + tests | Claude | done 2026-11-07 |
| 2 | `brevo-setup.mjs` (lists, attributes, template check) | Claude | done 2026-11-07 |
| 3 | Form, page, confirmed page (unsubscribed page removed later) | Claude | done 2026-11-07 |
| 4 | Menu item (Directus, draft, footer group information = also the header popup) | Claude | done 2026-11-07 |
| 5 | Invite | Claude | done 2026-11-07 |
| 6 | Privacy texts, SEO, checks, QA | Claude | done 2026-11-07 |
| 7 | First newsletter (draft) | Claude | done 2026-11-07 |
| 8 | Launch: env on the server, extension on the server, merge, deploy, publish menu items, test with a real address | owner's word, then Claude | open |
| 9 | Lawyer reads consent and privacy text | owner | later |
