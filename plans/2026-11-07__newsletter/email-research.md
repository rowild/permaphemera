# Email on permaphemera.at: research of 2026-11-07

Question of the owner: can `newsletter@permaphemera.at` send the newsletter, when the domain
was bought at ALL-INKL, its DNS sits at Cloudflare and the site runs at Hetzner?

**Answer: yes.** The website path (Cloudflare → Hetzner) and the mail path are separate. Mail
needs only DNS records, and every DNS record of the domain is edited in one place: Cloudflare.
Choice: **`newsletter@permaphemera.at`** (not `robertwildling@gmail.com`, see §4).

## 1. What was checked (live, 2026-11-07)

| Check | Result |
|---|---|
| `dig NS permaphemera.at` | `dee.ns.cloudflare.com`, `josh.ns.cloudflare.com`: Cloudflare is the DNS of the domain. |
| `whois permaphemera.at` | Registrar RegistryGate (ALL-INKL's registrar, Neue Medien Münnich GmbH); name servers Cloudflare. |
| `dig A permaphemera.at` | Cloudflare proxy addresses (orange cloud) → Hetzner. |
| `dig MX permaphemera.at` | `10 w00c8d25.kasserver.com`: incoming mail goes to ALL-INKL. |
| `dig TXT permaphemera.at` | SPF `v=spf1 a mx include:spf.kasserver.com ~all`, a Google site verification. |
| `dig TXT _dmarc.permaphemera.at` | `v=DMARC1; p=none;` |
| `*` (wildcard) | A CNAME to `w00c8d25.kasserver.com`, DNS only (`directus/hetzner/README.md`). |
| SMTP test: `RCPT TO:<newsletter@permaphemera.at>` at `w00c8d25.kasserver.com` | **`554 5.7.1 Relay access denied`**, the same for `info@` and a random name. |

The last line matters: **today no address on permaphemera.at can receive mail.** The MX record
points to ALL-INKL, but that ALL-INKL server does not know the domain as a mail domain. Mail to
`…@permaphemera.at` bounces. The monthly news report of the server sends from
`webmaster@rowild.at`, not from permaphemera.at.

## 2. Sending the newsletter (Brevo)

Brevo sends from its own servers. It asks for DNS records that prove the domain is ours
("domain authentication", mandatory since Gmail's and Yahoo's sender rules of February 2024):

| Record | Type | Where | Note |
|---|---|---|---|
| Brevo code | TXT on `permaphemera.at` | Cloudflare | Proves ownership. A second TXT next to SPF and Google is fine. |
| DKIM | 2 × CNAME `brevo1._domainkey`, `brevo2._domainkey` (or 1 TXT, as the Brevo account shows) | Cloudflare | **Proxy status "DNS only" (grey cloud).** A proxied CNAME breaks DKIM. The explicit records win over the `*` wildcard. |
| DMARC | TXT `_dmarc` | exists | Keep the one that exists (`p=none`). **Never a second DMARC record.** Brevo's automatic setup can overwrite it; choose the manual setup or check it afterwards. |
| SPF | — | — | Not needed by Brevo. DMARC passes through DKIM, whose domain matches the sender. Leave SPF as it is. |

Brevo copies the values from its own page ("Senders, domains & dedicated IPs → Domains → Add a
domain"). The exact host names and targets come from the account, not from this file.
Brevo can also write the records itself after a login at the DNS provider (automatic setup);
the manual way is safer here because of the existing DMARC record. Checking can take up to 48 h.

Brevo's API also has an IP lock ("Authorized IPs", Security page). The Hetzner server
(`138.199.205.241`) must be on that list, or the sign-up gets "unauthorised" from Brevo.

## 3. Receiving mail at newsletter@permaphemera.at

Needed for: the Brevo sender check (Brevo may send a code to the address), replies of readers,
and bounces addressed to the sender. Two ways, both free:

| | A: ALL-INKL (recommended) | B: Cloudflare Email Routing |
|---|---|---|
| What | In ALL-INKL's KAS: make permaphemera.at a mail domain of the account, create a forward `newsletter@permaphemera.at → robertwildling@gmail.com` (or a mailbox). | In Cloudflare: Email → Email Routing, rule `newsletter@ → robertwildling@gmail.com`. |
| DNS | Nothing changes: MX, SPF and DMARC already point to ALL-INKL. | Cloudflare replaces the MX records with `route1-3.mx.cloudflare.net` and adds its SPF include. ALL-INKL mail for the domain ends. |
| Extra | A real mailbox is possible, so the owner can also answer as `newsletter@permaphemera.at` (SMTP `w00c8d25.kasserver.com:587`). | Forward only. Answers go out from Gmail. |

Recommendation: **A**. It changes no DNS and keeps the option of a real mailbox. **B** is the
fallback when ALL-INKL cannot take the domain into the account.

## 4. Why not robertwildling@gmail.com as sender

Gmail publishes a strict DMARC policy for `gmail.com`. A mail "from @gmail.com" that comes from
Brevo's servers fails that check, so Brevo does not send it as such: it replaces the sender with
an address of its own (`…@brevosend.com`), and many mails land in spam or show "via". A free mail
address is not a usable newsletter sender since 2024. `robertwildling@gmail.com` stays the place
where the forward of `newsletter@permaphemera.at` arrives.

## 5. Sources

- [Brevo: Authenticate your domain (Brevo code, DKIM, DMARC)](https://help.brevo.com/hc/en-us/articles/12163873383186)
- [Brevo: Authorize and block IP addresses for API security](https://help.brevo.com/hc/en-us/articles/5740111683858)
- [Brevo developers: IP security](https://developers.brevo.com/docs/ip-security)
- [Brevo developers: Create DOI contact](https://developers.brevo.com/reference/createdoicontact)
- [Brevo developers: other common questions (DOI template, `optin` tag, `{{ doubleoptin }}`)](https://developers.brevo.com/docs/other-common-questions)
- [Cloudflare: Email Routing / Email Service domain configuration](https://developers.cloudflare.com/email-service/configuration/domains/)
- [Unspam: Brevo deliverability (sender rewrite to brevosend.com, DMARC overwrite)](https://unspam.email/deliverability/brevo)
- [Suped: DMARC, DKIM, SPF for Brevo](https://www.suped.com/learn/dmarc/how-to-set-up-dmarc-dkim-spf-for-brevo)
- [Prospeo: Cloudflare DKIM setup (DNS only for DKIM CNAMEs)](https://prospeo.io/s/cloudflare-dkim)
- `directus/hetzner/README.md` (mail of the domain stays at ALL-INKL; wildcard CNAME)
