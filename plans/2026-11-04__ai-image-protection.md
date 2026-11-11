# AI protection for the images (2026-11-04)

Owner's ask: AI systems must not take the images of the website. Priority. "Add the AI
protection now." Background and the full list: `BACKLOG.md`, "Protect the images from AI
systems".

## Limit

A public website cannot stop every copy. These steps say "no" in every machine-readable form
that AI companies and dataset tools read, which in the EU is the legal reservation for text and
data mining (§ 42h Abs. 6 UrhG; Art. 4 Abs. 3 Directive (EU) 2019/790), and block the known
crawlers.

## Done in this step (repository, needs a deploy)

1. `frontend/public/robots.txt`
   - AI training and dataset crawlers: `Disallow: /`.
   - AI search and answer agents (they fetch a page when a person asks an AI): pages allowed,
     images and tours not (`/cms/assets/`, `/media/`). So PERMAPHEMERA can still be found and
     cited, but the images are not taken.
   - Search engines (Googlebot, Bingbot, …): unchanged. `Google-Extended` (Gemini training) is
     blocked; Google search is not affected by it.
2. `frontend/public/.well-known/tdmrep.json`: TDM reservation for the whole site (TDMRep, W3C
   community group). `check-public-namespace.mjs` allows `.well-known`.
3. `frontend/nuxt.config.ts`, head of every page: `tdm-reservation: 1` and
   `robots: noai, noimageai`. The SEO snapshots inherit the shell head.
   Also: the old default description ("A curated Austrian archive of 360 degree exhibition
   documentation") broke `docs/text-rules.md` §1.1 and §1.7; it is now the approved
   `site.seoDescription` (EN).
4. Terms of use (`legal.terms.sections.use`): new item `noAi` (DE + EN): text and data mining,
   also for training AI systems, is reserved. `noReuse` no longer says "360°-Dokumentationen" /
   "360° documentation" (text rules §1.1).

## Outside the repository (done 2026-11-04 unless marked)

5. **Done 2026-11-04.** nginx on the Hetzner host (`/etc/nginx/sites-available/permaphemera.at`, server block of
   `permaphemera.at`): two response headers for every page, image and tour tile:

   ```nginx
   add_header X-Robots-Tag "noai, noimageai" always;
   add_header tdm-reservation "1" always;
   ```

   Put them in `location /cms/` and `location /` (nginx does not inherit server-level
   `add_header` into a location that has its own, like `/_nuxt/`; `/_nuxt/` holds only code and
   needs none). Why it matters: img2dataset, the tool that built the large image sets for AI
   training, skips images whose response carries `X-Robots-Tag: noai` or `noimageai`.
   Then `nginx -t`, reload, and purge the Cloudflare cache (`pnpm cache:purge`), because
   Cloudflare keeps cached images with their old headers.
6. Cloudflare. **Done 2026-11-04** with the token `permaphemera-settings`
   (`CLOUDFLARE_SETTINGS_TOKEN` in `frontend/.env.deploy.local`; Zone: Bot Management, Zone
   Settings, Zone WAF edit, Zone read; only permaphemera.at): `ai_training: block` (AI search
   and user agents stay allowed, like robots.txt 1b) and Hotlink Protection on. Checked live:
   GPTBot 403, Googlebot 200, foreign referer on an image 403, own and empty referer 200.
   Original idea:
   - Security → Bots: turn on "Block AI bots" (AI Crawl Control). This also stops crawlers
     that ignore robots.txt.
   - Turn on "Bot Fight Mode" only after a test: it can block the Tour Editor's uploads.
   - Scrape Shield → Hotlink Protection: on (other sites cannot embed the images).
7. Later (backlog): no original-size images through `/cms/assets/`, rate limits on
   `/cms/assets/` and `/media/tours/`, IPTC/XMP rights data in the images.

## 2026-11-09: hotlink gap closed, rights data tested

- **Hotlink gap.** Cloudflare's Hotlink Protection covers only `.jpg/.jpeg/.png/.gif/.ico`:
  Directus images (`/cms/assets/<id>`, no ending) and the tour tiles (`.webp`) could be embedded by
  other sites. Closed with a custom firewall rule (`2026-11-04__ai-image-protection/hotlink-rule.mjs`,
  token `CLOUDFLARE_SETTINGS_TOKEN`): `/cms/assets/` and `/media/` are blocked when the referer is
  another site; an empty referer and our own hosts pass. Checked live: foreign referer 403 for a
  Directus image, a `.webp` tile and a `.jpg`; own pages 200 with every image loaded.
- **Rights data in images (step 5 of the backlog), tested with a temporary upload:** Directus
  keeps IPTC/XMP in the original, but every resized copy loses it (`?width=…`, any format), and
  `transforms=[["withMetadata"]]` is refused (400). The site only shows resized copies, so rights
  data written into uploads never reaches a visitor. Static files (tours, `start-view.jpg`) are
  served unchanged, so data written into them stays. Next: the Tour Editor writes the rights data
  into every exported tour file (owner's idea, 2026-11-09); Directus images need their own way.

## 2026-11-11: report renewed

`docs/legal/2026-11-11__ki-schutz-massnahmen.pdf` replaces the 2026-11-04 report (layout of the
letter "Partner der ersten Stunde"; facts checked live, read-only, on 2026-11-11). New in it:
Cloudflare's own robots.txt section (Content-Signal `ai-train=no`, 32 ids), the 2026-11-09 hotlink
rule, the current terms quote. See `plans/2026-11-11__ki-schutz-pdf-layout.md`.
