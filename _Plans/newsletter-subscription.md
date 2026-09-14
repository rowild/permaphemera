# Newsletter Subscription — Plan

Status: **planned, not implemented.** Nothing in this document has been built.
Target branch: `feature/newsletter-subscription` (to be created off `feature/current-and-upcoming-exhibitions`).
Written: 2026-08-13.

---

## 1. Decisions taken

| Question | Decision |
|---|---|
| Where do subscribers live? | **Brevo** (French provider, EU servers). Brevo is the system of record. |
| How does the form reach Brevo? | Through a small **same-origin PHP endpoint** on the existing ALL-INKL host, which holds the API key. |
| Who sends the mail? | Brevo. Nothing is sent from ALL-INKL or from a self-hosted server. |
| Opt-in model | **Double opt-in**, handled by Brevo's DOI endpoint. |
| Area targeting | Multi-select of archive cities, grouped by Bundesland. |
| Entry points | Permanent link in the footer, permanent link in the header menu popup, plus a one-time timed popup. |
| Open/click tracking | **Off.** See §7. |

Brevo only needs to know *who* to send to: it stores the subscriber's chosen cities as a contact
attribute and filters on them. The archive still assembles *what* the mail says. No second system and
no cross-system join is involved anywhere in this design.

---

## 2. What subscribers of this archive would actually want

Derived from the existing data model (`app/data/*.json`) and from `app/utils/exhibitionSchedule.ts`,
which already computes `current` and `upcoming` groups.

### Candidate topics

| Topic | Backed by | Notes |
|---|---|---|
| Newly archived exhibitions | `exhibitions` + `panoramas` | The core product: a new 360° record went online. |
| Currently on view nearby | `selectExhibitionSchedule().current` + `locations` | Real-world, time-sensitive. |
| Opening soon nearby | `selectExhibitionSchedule().upcoming` | Highest practical value — it lets someone plan a visit. |
| **Last chance to see** | `exhibitions.end_date` | Exhibitions closing within ~2 weeks. The most on-brand topic this archive can offer: the entire premise of PERMAPHEMERA is that these shows disappear. Nobody else is telling people this. |
| New galleries in the archive | `venues` | |
| Newly archived artists | `artists` + `exhibitions_artists` | |
| From the archive | editorial | A rediscovered exhibition, a curatorial note, method writing. |
| Project news | editorial | 360° viewer launch, new sponsors, milestones. |
| "One year ago in the archive" | `exhibitions.start_date` | Cheap to generate, fits the archival identity, good filler for quiet months. |

### What ships in v1

Four checkboxes, not nine. Every additional choice in a signup form costs completions, and a topic
you offer is a promise you have to keep every month.

| Key | Label (EN) | Label (DE) | Bundles |
|---|---|---|---|
| `new_records` | New in the archive | Neu im Archiv | new exhibitions, venues, artists |
| `nearby` | On now & opening soon near me | Aktuell & demnächst in meiner Nähe | current + upcoming, filtered by chosen cities |
| `closing_soon` | Last chance to see | Letzte Gelegenheit | ending within ~2 weeks, filtered by chosen cities |
| `project_news` | Project news & archive notes | Projektnachrichten & Archivnotizen | editorial + project |

All four default to **checked**. The finer-grained split stays available later without a schema
change: `NL_TOPICS` is a multiple-choice attribute, so values can be added in Brevo settings.

### Frequency: do not ask in v1

A frequency selector looks considerate and creates an obligation you must honour on every send.
State the cadence in the form copy instead — *"about once a month, never more"* — and keep the
promise. `NL_FREQUENCY` is listed in §4 as a documented future attribute, not a v1 field.

---

## 3. Architecture

```
┌──────────────────────────┐
│ Nuxt SPA (static)        │
│ exhibition-archiv.rowild │
│                          │
│  ArchiveNewsletterForm   │
│    └ useNewsletter…()    │
└───────────┬──────────────┘
            │ POST (same origin, JSON, no CORS, no third-party JS)
            ▼
┌──────────────────────────┐
│ /api/newsletter-         │   ALL-INKL, PHP 8.3
│   subscribe.php          │   • validates + normalises
│                          │   • honeypot / timing / rate limit
│  requires config from    │   • holds the Brevo API key
│  ABOVE the document root │   • never returns whether an address is known
└───────────┬──────────────┘
            │ POST /v3/contacts/doubleOptinConfirmation
            ▼
┌──────────────────────────┐
│ Brevo (EU)               │   • sends the confirmation mail
│                          │   • owns confirmed / unsubscribed / bounced
│                          │   • hosts the unsubscribe link
│                          │   • sends the campaigns
└──────────────────────────┘
            │ confirmation click → redirectionUrl
            ▼
   /newsletter/confirmed/  (a normal Nuxt route)
```

### Why the PHP endpoint rather than posting to Brevo from the browser

1. **The API key is a secret.** A static build ships its JavaScript to every visitor. A Brevo
   marketing API key in that bundle can be used by anyone to read and modify your entire contact
   list. The PHP file keeps it server-side.
2. **No third-party JavaScript on the site.** Embedding Brevo's own form widget would load foreign
   scripts, which — given the consent manager just built for Matomo in
   `app/composables/useCookieNotice.ts` — would drag the newsletter into the cookie banner as well.
   A same-origin `fetch` avoids that entirely.
3. **The archival design survives.** The form is our own markup under `docs/STYLE_GUIDE.md`, not an
   iframe.
4. **Providers stay swappable.** The frontend contract is our own JSON shape. Moving from Brevo to
   CleverReach later is a change to one PHP file.
5. **Anti-abuse lives somewhere we control** — honeypot, submit timing, per-IP rate limit.

### Why this deploys cleanly onto the existing host

Three properties of the current setup were verified rather than assumed:

- `public/.htaccess` serves real files before the SPA fallback
  (`RewriteCond %{REQUEST_FILENAME} -f` → `RewriteRule ^ - [L]`), so a `.php` file at a real path
  executes normally and never gets rewritten into `index.html`.
- `scripts/deploy.mjs` uploads with `uploadDir` and only ever removes `_nuxt`, and only when
  `--clean` is passed. **A `/api/` directory on the server survives every deploy.**
- ALL-INKL provides PHP 8.1–8.3, MySQL, cron and SSH on the existing tariff. No new hosting is
  needed.

### Where the PHP file lives in the repo

**Not** in `frontend/public/`. `AGENTS.md` restricts `public/` to root-mandated files plus the single
`media/` namespace, and `pnpm check:public` fails on any stray top-level entry. The PHP source lives
at:

```
frontend/server-php/newsletter-subscribe.php
```

Not `frontend/server/` — that name is reserved by Nuxt/Nitro convention and would be misleading in an
`ssr: false` project.

Deployed to `…/exhibition-archiv.rowild.at/api/newsletter-subscribe.php`.

The path is `/api/…`, **not** `/newsletter/…`, deliberately: `/newsletter/` is a Vue route, and
putting a real directory there would shadow it — exactly the failure mode `public/locations/` caused
against the `/locations/**` redirect.

The API key is **not** in that file. It lives one directory above the document root:

```
/www/htdocs/w00c8d25/newsletter-config.php     ← outside the web root
/www/htdocs/w00c8d25/exhibition-archiv.rowild.at/api/newsletter-subscribe.php
```

so that even a misconfigured PHP handler cannot serve the key as plain text.

---

## 4. Data model — Brevo lists and contact attributes

Every field the feature needs, and where it lives. Everything here is created inside Brevo — there is
no database of our own to build or maintain.

### Two lists

| List | Purpose |
|---|---|
| `Newsletter DE` | German-language subscribers |
| `Newsletter EN` | English-language subscribers |

Language is a list rather than an attribute because the double-opt-in **template** must be in the
subscriber's language, and Brevo selects the DOI template per call. Topics and cities are attributes
filtered by segment *within* each list.

### Fields Brevo owns — do not create these

The three states most people expect to model by hand are managed by Brevo itself:

| Concept | Where it lives | Notes |
|---|---|---|
| **Confirmed** | Brevo contact state | Set when the DOI link is clicked. Brevo records the timestamp and IP as opt-in proof. |
| **Unsubscribed** | `emailBlacklisted` | Set by the unsubscribe link in every campaign. Brevo refuses to mail a blacklisted contact even if you try. |
| **Bounced / complained** | Brevo suppression list | Hard bounces and spam complaints suppress automatically. |

Creating your own `confirmed` or `unsubscribe` fields alongside these would produce two sources of
truth and, eventually, mail sent to someone who unsubscribed. Do not do it.

### Custom contact attributes to create

Brevo supports seven attribute types: text, date, number, category (single value from a set),
multiple-choice (several values from a set), boolean, user. Create these under
**Settings → Contacts → Contact attributes**.

#### Shipping in v1

| Attribute | Type | Required | Purpose |
|---|---|---|---|
| `VORNAME` | text | no | Name as entered. One field, not first/last — this is a newsletter, not a CRM, and split name fields measurably reduce completion. Used for salutation. |
| `SPRACHE` | category (`de`, `en`) | yes | Duplicates the list assignment, but makes segments and template logic readable. Set from the active locale. |
| `NL_TOPICS` | multiple-choice | yes | `new_records`, `nearby`, `closing_soon`, `project_news` |
| `NL_CITIES` | multiple-choice | no | The 17 archive city slugs (see below). Empty means "all of Austria". |
| `NL_REGIONS` | multiple-choice | no | The 9 Bundesländer. Written automatically by the endpoint from the chosen cities, so a segment can target a whole state without listing its cities. |
| `SIGNUP_SOURCE` | category | yes | `popup`, `footer`, `menu`, `page`. Tells you which entry point actually works. |
| `SIGNUP_URL` | text | yes | Page the signup happened on. Part of the consent record. |
| `CONSENT_VERSION` | text | yes | Identifier of the exact consent wording shown, e.g. `2026-08-nl-v1`. **This is the field that makes the consent defensible.** Without it you can prove *that* someone consented but not *to what*. |
| `SIGNUP_DATE` | date | yes | Redundant with Brevo's own timestamp; kept because it survives an export/migration. |

#### Documented for later, not created now

| Attribute | Type | Purpose |
|---|---|---|
| `NL_FREQUENCY` | category (`monthly`, `quarterly`, `major_only`) | If a cadence choice is ever offered. |
| `NL_RADIUS_KM` | number | If postal-code + radius targeting replaces city selection. |
| `NL_LAT` / `NL_LON` | number | Coordinates, only if a radius search is built. Precise location is sensitive personal data — do not collect it speculatively. |
| `NL_POSTAL_CODE` | text | Lighter-weight alternative to coordinates. |

### City values

The 17 city slugs currently in `app/data/locations.json`, grouped by state:

| Bundesland | Cities |
|---|---|
| Burgenland | `eisenstadt` |
| Kärnten | `spittal-an-der-drau`, `klagenfurt-am-worthersee`, `villach`, `bad-eisenkappel` |
| Niederösterreich | `baden`, `krems-an-der-donau` |
| Oberösterreich | `linz` |
| Salzburg | `salzburg`, `hallein` |
| Steiermark | `graz` |
| Tirol | `innsbruck` |
| Vorarlberg | `bregenz`, `bludenz`, `lustenau`, `schruns` |
| Wien | `vienna` |

**Known maintenance cost, flagged rather than hidden:** Brevo multiple-choice values are defined by
hand in Brevo settings. Every city added to `locations.json` in future must also be added in Brevo
and in the form's option list, or subscribers silently cannot select it.

Mitigation, in the style the repo already uses for this class of problem: a new guard script
`scripts/check-newsletter-cities.mjs`, wired as `pnpm check:newsletter`, which fails if
`locations.json` contains a city slug missing from the form's option list. It cannot check Brevo's
side, so the Brevo step goes in the runbook (§9).

`NL_REGIONS` exists precisely to soften this: the 9 Bundesländer have been stable since 1922, so a
state-level segment keeps working even when a new city has not yet been added everywhere.

---

## 5. The PHP endpoint contract

### Request

`POST /api/newsletter-subscribe.php`, `Content-Type: application/json`

```json
{
  "email":        "person@example.at",
  "name":         "Maria Beispiel",
  "language":     "de",
  "cities":       ["vienna", "graz"],
  "topics":       ["new_records", "nearby", "closing_soon"],
  "consent":      true,
  "consentVersion": "2026-08-nl-v1",
  "source":       "popup",
  "pageUrl":      "https://exhibition-archiv.rowild.at/exhibitions/",
  "website":      "",
  "startedAt":    1755082800000
}
```

`website` is a honeypot: a visually hidden field that real users never fill in.
`startedAt` is set when the form renders.

### Response

Always `200` with a JSON body. Never a different status for "already subscribed".

```json
{ "ok": true, "state": "pending" }
```

```json
{ "ok": false, "error": "invalid_email" }
```

Errors: `invalid_email`, `missing_consent`, `rate_limited`, `rejected`, `upstream_error`.

### Validation, in order

1. `Origin`/`Referer` host matches the site host — a cheap bot filter, not a security boundary.
2. `website` must be empty, else return `{ ok: true, state: "pending" }` and do nothing. Silently
   accepting is better than rejecting: it tells the bot nothing.
3. `startedAt` must be between 3 seconds and 2 hours ago. Humans do not submit in under 3 seconds.
4. `consent === true`, else `missing_consent`.
5. `filter_var($email, FILTER_VALIDATE_EMAIL)`, length ≤ 254, lowercased and trimmed.
6. `cities` and `topics` filtered against a server-side allowlist. Never forward client strings
   into Brevo unchecked.
7. Rate limit per IP — 5 attempts per hour, counted in a flat file above the document root.

### Enumeration protection

If Brevo reports the contact already exists, still return `{ ok: true, state: "pending" }`. The UI
message is always *"Please check your inbox and confirm."* Otherwise the form becomes a tool for
testing whether a given address is subscribed.

### The Brevo call

```
POST https://api.brevo.com/v3/contacts/doubleOptinConfirmation
api-key: <from newsletter-config.php>
content-type: application/json
```

```json
{
  "email": "person@example.at",
  "includeListIds": [ <DE or EN list id> ],
  "templateId": <DOI template id for that language>,
  "redirectionUrl": "https://exhibition-archiv.rowild.at/newsletter/confirmed/",
  "attributes": {
    "VORNAME": "Maria Beispiel",
    "SPRACHE": "de",
    "NL_TOPICS": "new_records,nearby,closing_soon",
    "NL_CITIES": "vienna,graz",
    "NL_REGIONS": "wien,steiermark",
    "SIGNUP_SOURCE": "popup",
    "SIGNUP_URL": "https://exhibition-archiv.rowild.at/exhibitions/",
    "CONSENT_VERSION": "2026-08-nl-v1",
    "SIGNUP_DATE": "2026-08-13"
  }
}
```

A `201` is success. `redirectionUrl` must be the **localised** confirmation route —
`/newsletter/confirmed/` for German, `/en/newsletter/confirmed/` for English.

Brevo sends the confirmation mail, records the confirmation timestamp and IP, and adds the contact
to the list only after the link is clicked. No token generation, expiry handling or confirm route
logic is written by us.

---

## 6. Frontend work

### New routes

| Route | Purpose |
|---|---|
| `/newsletter/` | The full form, the cadence promise, what each topic means, the privacy explanation. Linkable and indexable. |
| `/newsletter/confirmed/` | Landing page after the DOI click. Confirms success and offers a link to choose cities/topics if they subscribed via the popup's short form. |
| `/newsletter/unsubscribed/` | Optional courtesy landing page if Brevo's unsubscribe redirect is pointed here. |

German is unprefixed, English lives under `/en/`, per the existing `prefix_except_default` strategy.

### New components

| Component | Notes |
|---|---|
| `ArchiveNewsletterForm.vue` | One component, two densities via a `variant: 'page' \| 'compact'` prop — the same pattern `ArchiveFooterMenu.vue` already uses for `desktop \| drawer`. |
| `ArchiveNewsletterPopup.vue` | Teleported dialog. Focus trap, Esc, backdrop click, focus restoration — copy the mechanics from `ArchiveFooter.vue:32-101`, which already implements all of this correctly. |
| `ArchiveCitySelect.vue` | City checkboxes grouped under Bundesland headings, each heading selecting its whole group. |

### New composables

| Composable | Notes |
|---|---|
| `useNewsletterSubscription.ts` | Owns the POST, the loading/success/error state and the endpoint URL, read from runtime config so it can be repointed without touching components. |
| `useNewsletterInvite.ts` | Owns the popup's should-I-appear decision and its stored record. |

### Form fields

**On `/newsletter/` (full):** email (required), name (optional), cities (optional, grouped),
topics (four checkboxes, all pre-checked), consent checkbox (required, **never pre-checked**).

**In the popup (compact):** email, consent checkbox, and a link to the full page for topics and
cities. Every extra field in a popup costs signups. Cities can be collected afterwards on the
confirmation page, once the person has already committed.

### Footer and menu links

- **Footer:** add to the `Explore` or `Information` group in `ArchiveFooterMenu.vue`. It renders in
  both the desktop grid and the mobile drawer from the same markup, so one line covers both.
- **Header menu popup:** add to the `mobile-nav-information` group in `ArchiveHeader.vue`. Note that
  despite the `mobile-nav` class name, this menu is the top-right popup on **desktop as well** — the
  desktop nav and this menu coexist, so a single entry there satisfies "permanent link in the menu
  popup".

Both use `localePath('/newsletter/')`, and the header link must set `menuOpen = false` on click like
its neighbours.

### Popup policy

| Rule | Value |
|---|---|
| Delay | 10 seconds |
| Timer start | On the landing page, **after the hero preloader finishes** — not on page load. The kaleidoscope loader gates first paint there, so a naive timer fires while the visitor is still watching the loading animation. On every other route there is no preloader, so the timer starts on mount. |
| Consent banner | Must be resolved first. Otherwise a first-time visitor gets two overlays stacked at the bottom of the viewport. |
| Suppressed on | `/privacy`, `/imprint`, `/terms`, `/accessibility` and their `/en/` twins, plus `/newsletter/*`. Interrupting someone reading the privacy policy with a data-collection prompt is indefensible. |
| After subscribing | Never again, permanently. |
| After dismissing | Silent for **30 days**, then it may appear once more. Most people swat a popup reflexively within a second without reading it, so a repeat recovers real signups. Note this is a monthly re-ask for a returning visitor who never subscribes; it is one constant (`INVITE_COOLDOWN_DAYS`) if it ever needs lengthening. |
| Mobile | A bottom sheet capped at ~40% of viewport height. Never a full-screen takeover — Google treats intrusive mobile interstitials as a ranking negative, and on a 360px screen it is simply hostile. |
| Dismissal | × button, `Esc`, and backdrop click. Focus trapped while open, restored on close. `prefers-reduced-motion` honoured via the existing `motion-reduce:transition-none` pattern. |

### Stored record

Mirror the shape the consent manager just introduced in `useCookieNotice.ts` — a versioned,
timestamped object rather than a bare boolean, so the policy can change later without stranding
existing visitors:

```ts
const NEWSLETTER_INVITE_STORAGE_KEY = 'permaphemera-newsletter-invite'

interface StoredInvite {
  state: 'dismissed' | 'subscribed'
  savedAt: number
  version: 1
}
```

`localStorage`, matching the existing pattern. Not a cookie: this is a pure UI preference with no
server involvement, and keeping it out of cookies keeps it out of the cookie-consent conversation.
Clearing browser data resets it — accepted.

### i18n

New keys under a `newsletter.*` namespace in **both** `i18n/locales/en.json` and `de.json`.
`scripts/check-i18n-privacy.mjs` asserts exact key parity between the two files and will fail the
build on any missing German key.

Needed: form labels and placeholders, the four topic labels and descriptions, the nine Bundesland
names, the consent sentence, the cadence promise, success/error messages for each error code, popup
title and body, dismissal aria-labels, and the copy for all three new routes.

### Privacy page

`app/pages/privacy.vue` currently enumerates every storage key by name. Two additions are required,
not optional:

1. `permaphemera-newsletter-invite` in the `local-storage` section's `details` list.
2. A new `newsletter` section naming Brevo as processor — see §7.

### Style constraints

From `AGENTS.md` and `docs/CSS_ARCHITECTURE.md`, the three rules broken most often:

- No `<style scoped>` and no CSS Modules in any of the new components.
- No bracketed arbitrary values where a canonical Tailwind utility or an existing `@theme` token
  exists. Never bracket a font size.
- Structural markers keep their inner spaces: `[ newsletter-form ]`, `[ newsletter-popup ]`.

Run `pnpm check:tailwind` after any template work. The dialog should reuse `archive-modal-frame`,
already defined in `main.css:513` and used by both `ArchiveCookieNotice.vue` and
`ArtistExhibitionModal.vue`.

### Tests and checks

- Unit tests for the invite-policy decision function (dismissed within 30 days, dismissed longer
  ago, subscribed, no record, suppressed route, consent unresolved) — pure logic, no DOM, matching
  the existing `test/unit/` style.
- Unit tests for city → region derivation.
- `scripts/check-newsletter-cities.mjs` as described in §4.
- Extend `scripts/check-i18n-privacy.mjs` to assert the new storage key appears on the privacy page,
  the way it already asserts the cookie-notice wiring.

---

## 7. Legal — DSGVO / GDPR

Austria applies the GDPR plus §107 TKG for unsolicited electronic mail. In practice:

### Non-negotiable

1. **Double opt-in.** Not merely best practice — in Austria and Germany it is the only reliably
   defensible proof that the address owner consented. Brevo's DOI endpoint handles it.
2. **No pre-ticked consent box.** Art. 4(11) and the CJEU *Planet49* ruling. The four topic
   checkboxes may be pre-checked (they are preferences, not the consent itself); the consent
   checkbox must not be.
3. **Consent must be documented** — Art. 7(1) puts the burden of proof on you. Brevo stores the
   confirmation timestamp and IP; `CONSENT_VERSION` and `SIGNUP_URL` record what was agreed to.
4. **No coupling.** The newsletter must not be a precondition for anything else on the site.
5. **Every mail carries** sender identity, a working unsubscribe link, and the imprint (§5 ECG,
   §24 MedienG). Link to `/imprint/` rather than repeating the address.
6. **One-click unsubscribe** — `List-Unsubscribe` and `List-Unsubscribe-Post` headers (RFC 8058),
   required by Gmail and Yahoo for bulk senders since February 2024. Brevo sets these.
7. **A DPA / Auftragsverarbeitungsvertrag with Brevo** must be concluded before the first real
   signup. It is available in the Brevo account settings.
8. **Privacy policy must name Brevo**: identity, purpose, data categories, legal basis
   (Art. 6(1)(a) consent), retention, the right to withdraw at any time, and the fact that mail
   delivery involves a processor.

### Tracking — decided: off

Brevo tracks opens and clicks **by default**, per individual recipient. In Austria and Germany,
individual-level tracking of this kind needs its own consent; it is not covered by consent to
receive the newsletter.

**Open and click tracking is switched off in Brevo** (Phase 0, step 6). The cost is that open rates
are unavailable. The benefit is that the consent sentence stays short, the privacy policy stays
simple, and no one has to reason about whether a tracking pixel is lawful. An open rate would not
have changed what this archive publishes.

The consequence for the rest of the plan: no tracking clause is needed in the §7 consent wording, and
the privacy policy's newsletter section states that delivery is not individually measured.

### Retention

Contacts that never confirm are deleted after **30 days**. An unconfirmed address is personal data
there is no legal basis to keep. Set this up as a scheduled cleanup in Brevo during Phase 0; if Brevo
cannot schedule it on the free tier, it goes on the maintenance runbook as a monthly manual step.

### Consent wording (draft, needs a legal read before going live)

> Ich möchte den PERMAPHEMERA-Newsletter erhalten und bin damit einverstanden, dass meine E-Mail-Adresse
> und meine Auswahl dafür gespeichert und über unseren Dienstleister Brevo (EU) versendet werden.
> Die Einwilligung kann ich jederzeit über den Abmeldelink in jeder E-Mail widerrufen.
> Mehr dazu in der [Datenschutzerklärung](/privacy/).

> I would like to receive the PERMAPHEMERA newsletter and agree that my email address and selections
> are stored and delivered via our processor Brevo (EU). I can withdraw this consent at any time via
> the unsubscribe link in every email. More in the [privacy policy](/privacy/).

Fill in Brevo's **exact legal entity name and address** from the signed DPA before this goes live —
the company has been renamed (Sendinblue → Brevo) and operates through more than one entity, so the
name must be copied from the contract rather than assumed. The same string then goes into the
privacy policy's processor list.

Give it a `CONSENT_VERSION` string (`2026-08-nl-v1`) and bump the version whenever the wording
changes.

---

## 8. Service comparison

Prices as of August 2026 — verify at signup, these move.

| | Country / servers | Free tier | Paid entry | Pricing model | Editor | Notes |
|---|---|---|---|---|---|---|
| **Brevo** ← chosen | France, EU | **300 emails/day, contacts effectively unlimited** (~100k stored), 1 seat | ~€9/mo (5,000 emails) → ~€18 (20k) → ~€29 (40k) | **Per email sent** | Drag-and-drop, HTML import, decent | German UI and support. Full API incl. DOI. Free-tier mails carry a Brevo footer credit. Business plan retired Oct 2025. |
| **MailerLite** | Lithuania, EU | 250 subscribers, 2,500 emails/mo, MailerLite logo | ~$12/mo (Comfort), ~$25 (Power) | Per subscriber | **Best of the group** | Cleanest editor and automation builder. The 250-subscriber ceiling is a hard wall on list growth regardless of send volume. |
| **CleverReach** | **Germany, servers in Oldenburg only** | 250 contacts, 1,000 emails/mo | €15 (Basic), €18 (Pro) | Per contact | Solid, German | The strictest DSGVO story available: German company, German servers, ready-made AV-Vertrag and data-protection checklists. Gets expensive past ~5,000 contacts. Phone support only at Enterprise. |
| **rapidmail** | Germany | none | €15/mo at 500 contacts, **or ~€20 per send** | Subscription or pay-per-send | Good, German | Pay-per-send is genuinely attractive for a newsletter that goes out 2–4× a year. Phone support in every plan. |
| **Mailjet** | France (Sinch), EU | 6,000/mo, 200/day, unlimited contacts | ~€17 (Essential), ~€27 (Premium) | Per email sent | Functional | Strong API, marketing + transactional in one. Similar model to Brevo, smaller free allowance. |
| **listmonk** | self-hosted | free software | Hetzner VPS ~€5–16/mo | — | Basic | Runs on the cheapest VPS to ~100k subscribers. **Still needs an external SMTP relay** — deliverability from your own IP is the hard part, not the software. Rejected: explicitly not the direction wanted. |

### Why Brevo for this project

The free tiers differ in *kind*, not degree. MailerLite and CleverReach cap the **list**; Brevo and
Mailjet cap the **sending**.

An archive accumulates subscribers slowly and mails them rarely. Under MailerLite, subscriber 251
is refused and you start paying whether or not you ever send anything. Under Brevo, 2,000 subscribers
cost nothing; a monthly send to them takes seven days at 300/day, or ~€18/month to send in one go.
That is the right shape for this project.

Brevo also has the API needed for the PHP endpoint, a German-language interface, and EU data
processing.

**CleverReach is the documented fallback**, not a pending decision. If the German-servers argument
ever outweighs the free-tier shape — German jurisdiction, paperwork provided — it costs €15/month
from the 251st contact and has a less pleasant editor. Because the PHP endpoint isolates the
provider, switching is a change to one file and needs no replanning.

### Designing the mail itself

All of these accept custom HTML, so the archival identity can carry into the newsletter — but email
HTML is not web HTML, and two things in this project's visual language do not survive:

- **`border-image` does not work in email clients.** The archival frames throughout this site
  (`archive-modal-frame`, `archive-button-primary-frame`, the sponsor and search frames) are all
  SVG `border-image`. In email they must be rebuilt as sliced PNG/JPG images or as plain borders.
- **Webfonts are stripped by most clients**, Gmail included. Cormorant Garamond will not load.
  Specify `Cormorant Garamond, Georgia, 'Times New Roman', serif` and design against **Georgia**,
  because that is what most recipients will actually see.

Also: table-based layout, inline CSS, ~600px maximum width, no JavaScript, dark-mode inversion tested
in Apple Mail and Outlook.

---

## 9. Implementation phases

Branch: `feature/newsletter-subscription`.

### Phase 0 — Brevo account (manual, no code)

1. Create the Brevo account, confirm the sender domain.
2. Set up **SPF, DKIM and DMARC** for `rowild.at`. Skipping this is the single biggest cause of
   newsletters landing in spam.
3. Create the `Newsletter DE` and `Newsletter EN` lists; note the list IDs.
4. Create the custom attributes from §4.
5. Create the two DOI templates (DE, EN); note the template IDs.
6. **Turn off open and click tracking** (§7).
7. Conclude the DPA / AV-Vertrag.
8. Generate an API key with the narrowest scope Brevo allows.

### Phase 1 — PHP endpoint

Build `frontend/server-php/newsletter-subscribe.php` against the §5 contract. Test with `curl`
before any frontend exists. Place `newsletter-config.php` above the document root. Verify the key is
not reachable over HTTP.

### Phase 2 — Form and page

`ArchiveNewsletterForm.vue`, `ArchiveCitySelect.vue`, `useNewsletterSubscription.ts`, the
`/newsletter/` route, and the i18n keys. Full-page variant first — it is the one that has to work
without any popup logic.

### Phase 3 — Permanent links

Footer entry in `ArchiveFooterMenu.vue`, header entry in `ArchiveHeader.vue`.

### Phase 4 — Confirmation and unsubscribe routes

`/newsletter/confirmed/` and `/newsletter/unsubscribed/`. Point Brevo's `redirectionUrl` at the
former. Verify the full loop end to end with a real address.

### Phase 5 — Popup

`ArchiveNewsletterPopup.vue`, `useNewsletterInvite.ts`, mounted in `app.vue` beside
`ArchiveCookieNotice`. Unit tests for the policy function.

### Phase 6 — Privacy, checks, QA

Privacy page additions, `check-newsletter-cities.mjs`, extended `check-i18n-privacy.mjs`, and the
`frontend-qa-checklist` skill across desktop and mobile.

### Phase 7 — Deploy

`pnpm deploy` for the static build; upload `server-php/` to `/api/` once, by hand or by extending
`deploy.mjs` with an optional step. Confirm the PHP file survives a subsequent `pnpm deploy --clean`.

---

## 10. Open questions

These need a human decision and cannot be resolved from the codebase.

1. **Sender address.** `newsletter@rowild.at`, or a dedicated domain? Affects SPF/DKIM setup in
   Phase 0.
2. **Cadence.** The form promises something specific. Monthly is a real commitment; "when there is
   something to report" is honest but converts worse.
3. **First mail.** What does issue #1 contain, and does enough archive content exist yet to justify
   collecting addresses now rather than after the 360° viewer ships?
4. **Legal review** of the §7 consent wording before the first real signup.

Not open: the provider is Brevo, tracking is off, and the popup cooldown is 30 days. §8 documents
CleverReach only as the fallback if the German-servers argument ever outweighs the free-tier shape —
switching is a change to one PHP file, so it needs no decision now.

---

## 11. Sources

- [MailerLite pricing](https://www.mailerlite.com/pricing)
- [Brevo pricing 2026 — EmailTooltester](https://www.emailtooltester.com/en/reviews/brevo/pricing/)
- [Brevo API — Create Contact via DOI](https://developers.brevo.com/reference/create-doi-contact)
- [Brevo — About contact attributes](https://help.brevo.com/hc/en-us/articles/10582214160274-About-contact-attributes)
- [CleverReach Preise 2026](https://www.simon-erklaert.com/email-marketing/cleverreach-preise/)
- [CleverReach vs rapidmail 2026](https://newsletter-tools.de/vergleiche/cleverreach-vs-rapidmail.html)
- [Mailjet review 2026 — EuropeanPurpose](https://europeanpurpose.com/tool/mailjet)
- [Best GDPR-compliant EU email marketing tools](https://europeanmartech.eu/best/gdpr-compliant-email-marketing-software)
- [listmonk](https://listmonk.app/)
- [ALL-INKL Privat Plus tariff](https://all-inkl.com/en/webhosting/privatplus/)
