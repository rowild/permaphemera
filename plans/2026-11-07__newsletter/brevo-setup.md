# Newsletter: the owner's steps (phase 0) and the launch (phase 8)

Everything here needs the owner's logins (ALL-INKL, Cloudflare, Brevo). The code is ready on
branch `feature/newsletter`. Background: `email-research.md`. Order matters.

## 1. Make newsletter@permaphemera.at receive mail (ALL-INKL, about 10 min)

Today mail to `…@permaphemera.at` bounces: ALL-INKL's server `w00c8d25.kasserver.com` answers
"Relay access denied" (checked 2026-11-07). The DNS already points mail to ALL-INKL; only the
ALL-INKL account must take the domain.

Checked again 2026-11-07 (owner's KAS screenshots + DNS): the domain is in the KAS account
(`w00c8d25`), Cloudflare already has MX `w00c8d25.kasserver.com`, SPF
`include:spf.kasserver.com` and DMARC. Still "Relay access denied": the account has no mailbox
or forward for the domain yet. The KAS warning "not connected to our web space" is about the
website only (it runs on Hetzner); ignore it, change nothing on that page.

**Update 2026-11-07, later:** the owner created the mailbox. The server now knows the domain
("User unknown" for a made-up address instead of "Relay access denied"). KAS DNS list and
Cloudflare compared: Cloudflare has all mail records, the ALL-INKL DKIM key
`kas202609151012._domainkey` included (same value). Steps 1–3 done; step 4 (test) is open.

**Update 2026-11-07, evening:** owner: "mail works" (send and receive). Mailbox login
`m0838e71` or the address itself. Section 1 done. Brevo account opened with the Gmail address
as login; that is fine (login ≠ sender; the sender is set in section 3.5).

1. Log in to the ALL-INKL KAS (`kas.all-inkl.com`).
2. E-Mail → E-Mail-Postfach → "Neues Postfach anlegen": address `newsletter`, domain
   `permaphemera.at`, password "automatisch generieren", XLIST on, save. Write down the login
   name (starts with `m0…`) and the password. Active after 5–15 min.
   (A forward only — E-Mail → Weiterleitung → to `robertwildling@gmail.com` — also works, but
   cannot send.)
3. KAS → Tools → DNS-Einstellungen → `permaphemera.at` → Bearbeiten: compare with Cloudflare.
   If KAS lists a TXT record whose name contains `_domainkey`, copy it to Cloudflare (DNS only).
   MX, SPF and DMARC are already in Cloudflare.
4. Test: send a mail to `newsletter@permaphemera.at` **from another address than the Gmail one**
   (Gmail hides mail it sent itself); read it in `webmail.all-inkl.com`. Then answer it, to test
   sending. Mail programs: server `w00c8d25.kasserver.com`, IMAP 993 SSL/TLS, SMTP 465 SSL/TLS
   (or 587 STARTTLS), login = the mailbox login name.
5. Still "Relay access denied" after 30 min: ALL-INKL support, +49 35872 353-41,
   `support@all-inkl.com` ("Domain permaphemera.at, externe Nameserver bei Cloudflare, MX zeigt
   auf w00c8d25.kasserver.com, Mails an newsletter@permaphemera.at werden mit 554 Relay access
   denied abgelehnt").

If ALL-INKL cannot take the domain: Cloudflare → Email → Email Routing, rule
`newsletter@permaphemera.at` → `robertwildling@gmail.com`. Cloudflare then replaces the MX records
(ALL-INKL mail for the domain ends; today none works anyway).

## 2. Brevo account (about 15 min)

1. Sign up at brevo.com (free plan: 300 mails a day, no card). Company data: PermaPhemera,
   Robert Wildling, Göllnergasse 19/30, 1030 Wien. Brevo prints this address in every mail.
2. Data processing agreement (AV-Vertrag): **nothing to download.** It is Appendix 3 of the
   Brevo Terms of Service (https://www.brevo.com/legal/termsofuse/, version 1 October 2025),
   accepted with the sign-up. Contract partner for users in Germany, Switzerland and Austria:
   **Brevo GmbH, Köpenicker Str. 126, 10179 Berlin** (HRB 133191, Amtsgericht
   Charlottenburg); Brevo SAS, 9-17 rue Salneuve, 75017 Paris, is the parent and a
   sub-processor. The privacy page names Brevo GmbH (read by Claude 2026-11-07).

## 3. Domain authentication (Brevo + Cloudflare, about 15 min, then up to 48 h waiting)

**Done 2026-11-07:** Brevo shows "Domain authenticated and branded" (steps 1–5). The 7
records in Cloudflare, all **DNS only** (grey cloud):

| Name | Type | Value |
|---|---|---|
| `permaphemera.at` | TXT | `brevo-code:25409224c8e5c04f7a7c682ecf36c22a` |
| `brevo1._domainkey` | CNAME | `b1.permaphemera-at.dkim.brevo.com` |
| `brevo2._domainkey` | CNAME | `b2.permaphemera-at.dkim.brevo.com` |
| `em` | CNAME | `em-permaphemera-at.brand.brevosend.com` |
| `r.em` | CNAME | `em-permaphemera-at.r.brand.brevosend.com` |
| `img.em` | CNAME | `em-permaphemera-at.img.brand.brevosend.com` |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` (the old record, edited) |

The `em` CNAMEs must never be "Proxied" (orange cloud): Cloudflare then hides the CNAME, Brevo
finds nothing, and Cloudflare's certificate does not cover `r.em` / `img.em` (two levels deep).
Step 4 below said "DMARC: add nothing"; Brevo asked for `rua=…` in the one existing record,
so it was edited, not added.

**Step 6 done 2026-11-07:** sender `PermaPhemera <newsletter@permaphemera.at>` added. Brevo
marked it "Verified" at once, without a code (the domain is authenticated), DKIM
`permaphemera.at` ✓, "DMARC is configured" ✓. The older sender
`PermaPhemera <robertwildling@gmail.com>` stays in the list (Brevo warns "Freemail domain is
not recommended"); never use it for the newsletter.

1. Brevo → Senders, domains & dedicated IPs → Domains → Add a domain → `permaphemera.at`.
2. "Branded subdomain" (Brevo's new flow, optional on shared IPs): **yes, prefix `em`** →
   `em.permaphemera.at`. Brevo then uses our domain for the return-path (SPF aligned with
   permaphemera.at, so DMARC passes twice) and for image and link addresses. Not `mail`:
   `mail.permaphemera.at` already answers (wildcard to ALL-INKL) and mail programs may use it.
   Its CNAMEs: DNS only (grey cloud), like DKIM.
3. Choose the **manual** way (not "automatic"): the automatic way can overwrite the existing
   DMARC record.
4. Cloudflare → permaphemera.at → DNS → add exactly the records Brevo shows:
   - the TXT record "brevo-code" on `permaphemera.at`;
   - the DKIM records (usually 2 CNAME, `brevo1._domainkey` and `brevo2._domainkey`):
     **Proxy status "DNS only" (grey cloud)**;
   - DMARC: **add nothing.** `_dmarc.permaphemera.at` exists already (`v=DMARC1; p=none;`).
     Never a second DMARC record.
5. Back in Brevo: "Authenticate this email domain". Green check = done (can take up to 48 h).
6. Brevo → Senders → add sender: name `PermaPhemera`, address `newsletter@permaphemera.at`.
   If Brevo sends a code to that address, it arrives in the ALL-INKL mailbox (section 1).

## 4. API key and the setup script (about 10 min)

1. Brevo → SMTP & API → API keys → "Generate a new API key", name `permaphemera-newsletter`,
   expiry "No expiration", access **Restricted** with only: **Contacts: All** (sign-ups, lists,
   attributes), **Transactional email: Read** (template check), **Account: Read** (key check).
   Everything else None. Copy it once (Brevo shows it only once). Brevo may show it in its
   "MCP" form (base64, ends in `==`); the code takes both forms (`brevoApiKey` in the
   extension's `lib.js`). **Done 2026-11-07** (owner: "Restricted · 3 scopes", no fixed date).
   Brevo switches a key off after 90 days without use: `directus/hetzner/brevo-keepalive.sh`
   uses it every Monday 04:23 on the server and mails the owner when it fails (installed by
   `install-extension.sh` at the launch).
2. Put it into `directus/.env.remote` (main checkout, never in git) with the other lines from
   `directus/hetzner/.env.example` (section "Newsletter").
3. On the Mac, in `directus/`:
   `DIRECTUS_ENV_FILE=.env.remote node scripts/brevo-setup.mjs --dry-run`, then without
   `--dry-run`. It creates the folder, the lists "Newsletter DE" / "Newsletter EN" and the
   contact attributes, and prints the lines `NEWSLETTER_BREVO_LIST_DE=…` / `…_EN=…` for `.env.remote`.
   **Done 2026-11-07:** key in `.env.remote` (plain `xkeysib-` form); script run: folder
   PERMAPHEMERA, lists **Newsletter DE = 6**, **Newsletter EN = 7**, the 9 `NL_` attributes.
   `.env.remote` has all `NEWSLETTER_*` lines; the two template ids are still empty.
   Brevo's IP lock was already on: the Mac's address had to be allowed first (owner did it).
4. Brevo → Security → Authorized IPs: add **`138.199.205.241`** (the Hetzner server). Without it
   Brevo refuses the sign-ups once its IP lock is active. Brevo's blue box "Unauthorized IP
   addresses are not blocked" → "Activate for API keys": **only after** `brevo-setup.mjs` has
   run for the last time (step 5.5), because the script runs on the Mac, whose address is not
   on the list. The Directus container reaches Brevo over IPv4 (Docker's default network has no
   IPv6), so the one IPv4 address is enough.

## 5. The two confirmation mails (about 10 min)

A "DOI template" is the short mail Brevo sends after a sign-up: "please confirm, click here"
(DOI = double opt-in: the person says yes twice, in the form and by the click). The texts are
ready: `worktree-newsletter/plans/2026-11-07__newsletter/doi-template-de.html` and `…-en.html`.
Brevo's screens as checked by Claude on 2026-11-07:

1. Brevo, left menu: **Marketing → Templates** → button **"Create template"** (top right).
   A window "What template do you want to create?" opens: click **"Email template"**.
   The page now has two halves: left "Content" with "Add content", right the sender fields.
   Note: opening the code editor (step 2) already creates the template in Brevo's list, even
   without saving. (Claude's test template #1 was deleted on the owner's request.)
2. Left side, **"Add content"** → window "Create an email" → the black button
   **"Create from scratch ⌄"** is a **menu** (small arrow): click it → 3 choices → **"HTML custom
   code"**. A big empty white box opens: that is the code field.
3. In the editor, open `doi-template-de.html`, select all (Cmd+A), copy (Cmd+C). In Brevo click
   into the white box, paste (Cmd+V). Top right: **"Save & Quit"**.
4. Back on the template page, right side (after the content, in case Brevo forgets fields
   filled in before the jump into the code page):
   - **Sender email**: preset is the Gmail address with a red warning; choose
     `newsletter@permaphemera.at` instead.
   - **Sender name**: `PermaPhemera`.
   - **Subject line**: `Anmeldung zum Newsletter bestätigen`.
   - **Show advanced settings** → **Tag**: `optin` (that makes it a confirmation mail).
5. Name (pencil next to "New template"): `Newsletter-Bestätigung DE`.
   Top right: the small arrow on **"Save"** → **"Save & activate"**.
6. The same for English: `doi-template-en.html`, subject `Confirm your newsletter sign-up`,
   name `Newsletter confirmation EN`.
**Done 2026-11-07:** German = **#2** "Newsletter-Bestätigung DE", English = **#3**
"Newsletter confirmation EN", both active, tag `optin`, sender `newsletter@permaphemera.at`;
numbers in `.env.remote`; `brevo-setup.mjs` says "ok" for both. Later the same day Claude put in the
"Sie" texts and the spelling PermaPhemera (code via the "Edit" page, sender name in both
templates and in Senders), checked against the files: identical.

**Replacing the code later** (e.g. after a text change; checked by Claude 2026-11-07):
Marketing → Templates → **pencil icon** at the right end of the template's row → page of the
template → **"Edit"** (top right of the "Content" box) → code page with the old code → click
into the code, Cmd+A, then paste the new code with Cmd+V → **"Save & Quit"** → back on the
template page: small arrow on **"Save"** → **"Save & activate"**.

7. Note both template numbers (the list shows them as `#1`, `#2`), put them into `.env.remote` as
   `NEWSLETTER_BREVO_TEMPLATE_DE` / `_EN`.
5. Run `DIRECTUS_ENV_FILE=.env.remote node scripts/brevo-setup.mjs` again: it now checks both
   templates (active, tag `optin`, `{{ doubleoptin }}` link, sender).

## 6. Settings in Brevo (about 5 min)

1. **Tracking off.** The privacy page says opens and clicks are not measured. Brevo has **no
   plain "tracking off" switch** (checked by Claude 2026-11-07; Brevo staff refuse a full
   switch-off except for Enterprise plans: help.brevo.com "About email tracking pixels and the
   CNIL recommendation"). What works: track only contacts who gave tracking consent, and never
   ask for it. Steps, checked on the real screens:
   1. Left menu, bottom: **"Settings"** (gear icon). → The settings menu opens.
   2. In the settings menu, under "CRM": **"Contacts"**. → A list of contact settings opens.
   3. Click **"Per-contact pixel tracking consent"**. → Page with "Per-contact tracking consent",
      **"Yes" / "No"** (preset "No" = everybody is tracked).
   4. Click **"Yes"**. → A second question appears: **"Track contacts whose consent is unknown"**.
   5. Leave it on **"No"** (preset).
   6. Click the black button **"Save"**.
   **Done 2026-11-07** (owner; Claude checked after a reload: "Yes", unknown "No").
   Not offered there: links in campaigns may still pass through Brevo's link address
   (`r.em.permaphemera.at`) for Brevo's spam protection; without consent nothing is recorded.
   (Settings → Campaigns → "Default Settings" → tab "Tracking and reports" only has
   "Anonymous email tracking": still counts, not per person. Not needed with the step above.)
2. Unsubscribe page: **skipped, owner 2026-11-07.** Unsubscribing always starts in a mail, so
   Brevo's own "Default unsubscribe page" is enough. (A redirect would need one custom
   unsubscribe page per language under Settings → Campaigns → "Unsubscribe Pages", chosen again
   in every campaign; the default page itself cannot be edited, only duplicated.)
   Where the status lives: **only in Brevo.** Directus stores no subscribers; the endpoint
   only reads the published towns and forwards the sign-up to Brevo. An unsubscribe therefore
   needs no message to Directus. The site page `/newsletter/unsubscribed/` is not linked by
   Brevo now.
3. Unconfirmed sign-ups: look whether Brevo keeps addresses that never clicked the confirmation
   link. If yes, delete those older than 30 days once a month (the privacy page and the
   confirmation mail promise it). Tell Claude what Brevo shows; a monthly job can do it later.

## 7. Launch (phase 8): say "Newsletter starten" to Claude

Claude then, in this order:

1. `bash directus/hetzner/install-remote.sh` (copies `.env.remote` with the NEWSLETTER_* lines to
   the server and restarts Directus).
2. `bash directus/hetzner/install-extension.sh` (copies the endpoint, restarts, checks it answers).
3. Merges `feature/newsletter` into `main`, runs the release routine, `pnpm deploy:hetzner`.
4. Publishes the menu item "Newsletter" (Directus, `pp_navigation_items`, key `newsletter`,
   now a draft) and, if wanted, a news article (topic `site`) about the newsletter.
5. A real sign-up with an address of the owner: confirmation mail arrives, link leads to
   `/newsletter/confirmed/`, the contact is in the list with its attributes.

## Later

- Lawyer reads the consent text (`newsletter.form.consent` in the locale files) and the privacy
  section "Newsletter über Brevo" before the first real sign-ups of the public. When the consent
  text changes, raise `NEWSLETTER_CONSENT_VERSION` in `frontend/app/utils/newsletter.ts`.
- First issue: `issue-01-de.md` / `issue-01-en.md` (count the numbers again before sending).
