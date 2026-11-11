# KI-Schutz report in the letter layout (2026-11-11)

Owner's request (2026-11-11): give `docs/legal/2026-11-04__ki-schutz-massnahmen.pdf` the layout, logo,
colours, sender address and date (today) of the letter "Partner der ersten Stunde"
(`~/Desktop/PermaPhemera verträge u.a./PermaPhemera_Partner-der-ersten-Stunde.pdf`). No server changes.

- Source: `docs/legal/2026-11-11__ki-schutz-massnahmen.html` (logo: `docs/legal/assets/permaphemera-logo-v2-de.svg`).
- PDF: `docs/legal/2026-11-11__ki-schutz-massnahmen.pdf`, rendered with
  `node plans/2026-11-11__ki-schutz-pdf-layout/scripts/render-pdf.cjs` (headless Chromium).
- Layout from the letter: Cormorant Garamond (titles, labels, numbers) + EB Garamond (text); ink #191714,
  accent #843f2e (measured), muted #5d5852, address #57524c; A4; footer "PermaPhemera · KI-Schutz 2026" + page n / N.
- Text: the 2026-11-04 report, brought to the state checked live on 2026-11-11 (read-only checks,
  `plans/2026-11-11__ki-schutz-pdf-layout/logs/live-check-2026-11-11.txt`): Cloudflare's own robots.txt section
  (Content-Signal ai-train=no, 32 ids), hotlink rule of 2026-11-09, terms quote as live, CCBot check,
  spelling PermaPhemera. The 2026-11-04 files stay unchanged.
- Status: done, released as 0.0.81 (2026-11-11). The owner keeps a copy as
  `~/Desktop/PermaPhemera verträge u.a./PermaPhemera_KI-Schutzmassnahmen.pdf`.
