# Rights data in every tour file — handover for the Tour Editor (2026-11-09)

For: the Tour Editor project (`/Users/robertwildling/Desktop/_WWW/_MacAPP TOUR-EDITOR`) and its
session. Written in the website project, where the need came up. The website part (last section)
is done here once the Tour Editor writes the new `tour.json` block.

## Why

PermaPhemera protects its 360° tours from AI training (website plan
`plans/2026-11-04__ai-image-protection.md`): robots.txt, Cloudflare blocks, `noai` headers, the
TDM reservation, the terms. All of that sits around the files. Once a tile is copied, nothing in
the file itself says whose it is or that data mining is reserved. Embedded rights data (XMP)
travels with every copy, and the EU/Austrian law protects it: removing rights management
information is not allowed (§ 90c UrhG; Art. 7 Directive 2001/29/EC). It also is the
machine-readable reservation of text and data mining in the file itself (§ 42h Abs. 6 UrhG).

## Owner's decisions (2026-11-09)

- Only the tour files get the rights data. Images in Directus do not (yet): Directus drops the
  data from every resized copy anyway (tested 2026-11-09).
- The data is entered in the Tour Editor, written into every exported tour file, and travels in
  `tour.json` to the website.

## What the editor offers: Settings → "Rechte" / "Rights" (new tab)

The Settings dialog shows app preferences and tour settings under their own headings
(`src/editor/components/SettingsDialog.vue`). The new tab follows that pattern, in the A–Z order
after "Lines":

- **App preferences (this machine):** the defaults for every new tour.
- **Tour settings (travel with the tour):** the values of this tour, prefilled from the defaults,
  editable per tour (another photographer, a commissioned shoot).

| Field (de / en) | Default | Written as (XMP) |
|---|---|---|
| Fotograf:in / Photographer | `Robert Wildling` | `dc:creator` |
| Rechteinhaber / Copyright | `© {year} Robert Wildling · PermaPhemera` (`{year}` = year of the shoot, from the tour id) | `dc:rights`, and `photoshop:Credit` = `PermaPhemera` |
| Werke / Works | `Die gezeigten Werke: © die Künstler:innen` | added to `dc:rights` as a second sentence |
| Nutzungsbedingungen / Terms | `https://permaphemera.at/terms/` | `xmpRights:WebStatement` |
| Nutzungshinweis / Usage terms | `Text- und Data-Mining, auch für KI-Training, vorbehalten (§ 42h UrhG). Keine Weiterverwendung ohne Erlaubnis.` | `xmpRights:UsageTerms` |
| Data Mining (fixed, shown read-only) | prohibited, except search engine indexing | `plus:DataMining` = `http://ns.useplus.org/ldf/vocab/DMI-PROHIBITED-EXCEPTSEARCHENGINEINDEXING` |
| — | always | `xmpRights:Marked` = `True` |

The data-mining value matches the website's robots.txt: search engines may index, AI training
may not. It is the IPTC "Data Mining" property (IPTC Photo Metadata Standard 2023.1, from the
PLUS coalition vocabulary).

## `tour.json`: an additive `rights` block (schema stays v2)

```jsonc
"rights": {
  "creator": "Robert Wildling",
  "copyright": "© 2026 Robert Wildling · PermaPhemera",
  "works": "Die gezeigten Werke: © die Künstler:innen",
  "credit": "PermaPhemera",
  "webStatement": "https://permaphemera.at/terms/",
  "usageTerms": "Text- und Data-Mining, auch für KI-Training, vorbehalten (§ 42h UrhG). Keine Weiterverwendung ohne Erlaubnis.",
  "dataMining": "DMI-PROHIBITED-EXCEPTSEARCHENGINEINDEXING"
}
```

Add it to `Tour` in `src/schema/types.ts` (optional, like `viewer` and `defaultIcons`), to
`validate.ts` and `serialize.ts`. Absent in an old tour: the export uses the app defaults and
writes them into the exported `tour.json`, so every exported tour carries the block.

## Where the data goes: every image file the export writes

- every tile of every level, `full`, the 8192 fallback and `base` (`*.tiles/…`);
- the plain panoramas (`…/normal/01.webp` etc.) where a tour is not tiled;
- any preview or thumbnail the export writes.

Both engines write these files and must write the same bytes:
`src-tauri/src/tiles.rs` (`encode_webp`, libwebp through the `webp` crate) and
`src/editor/tiles/tile.worker.js` (`@jsquash/webp`). The test fixture
`tests/fixtures/tiles/expected-files-2048.json` pins the names for both; pin the rights block the
same way.

## How: wrap the encoded WebP, no extra tool

libwebp writes a "simple" WebP (`RIFF` + one `VP8 ` or `VP8L` chunk). XMP needs the "extended"
format, which every browser and the viewer already read:

1. `RIFF` size, `WEBP`;
2. a `VP8X` chunk (10 bytes): flags byte with the XMP bit (`0x04`), then canvas width − 1 and
   height − 1, each 24-bit little-endian;
3. the original `VP8 `/`VP8L` chunk, unchanged;
4. an `XMP ` chunk holding the XMP packet (UTF-8), padded to an even length;
5. the RIFF size updated.

One small pure function per engine, `addXmp(webpBytes, xmpPacket) → webpBytes`, applied after
encoding and before writing. No exiftool or other binary in the app. Build the packet once per
export job (the same for every file of the tour), compact, without the usual padding whitespace:
about 700 bytes per file, about 0.8 MB for a tour of 1,100 files.

Minimal packet (fill in from `tour.rights`, escape XML):

```xml
<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/" xmpRights:Marked="True" xmpRights:WebStatement="https://permaphemera.at/terms/" photoshop:Credit="PermaPhemera" plus:DataMining="http://ns.useplus.org/ldf/vocab/DMI-PROHIBITED-EXCEPTSEARCHENGINEINDEXING"><dc:creator><rdf:Seq><rdf:li>Robert Wildling</rdf:li></rdf:Seq></dc:creator><dc:rights><rdf:Alt><rdf:li xml:lang="x-default">© 2026 Robert Wildling · PermaPhemera. Die gezeigten Werke: © die Künstler:innen</rdf:li></rdf:Alt></dc:rights><xmpRights:UsageTerms><rdf:Alt><rdf:li xml:lang="x-default">Text- und Data-Mining, auch für KI-Training, vorbehalten (§ 42h UrhG). Keine Weiterverwendung ohne Erlaubnis.</rdf:li></rdf:Alt></xmpRights:UsageTerms></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="r"?>
```

## Done when

- `exiftool -XMP:all <tile>.webp` shows creator, rights, credit, web statement, usage terms,
  data mining and `Marked = True`, for a tile, `full`, the fallback, `base` and a plain panorama.
- Both engines write byte-identical files for the fixture panorama.
- The viewer and Safari, Chrome and Firefox show the tiles as before (the e2e and Safari review kit).
- `tour.json` carries `rights`; an old tour without it exports with the defaults.
- The tour's fingerprint changes with the new files, so the upload list shows the re-exported tours
  as `changed` (the website's `pnpm tour:status`). Re-export and upload the 18 tours once.

## Website part (this project, after the Tour Editor ships)

- `pnpm tour:publish` / `pnpm tour:start-view`: write the same packet into `start-view.jpg` from
  `tour.json` → `rights` (sharp `withXmp`, checked available in sharp 0.35.5).
- `pnpm check:public` or a test: every tour's `tour.json` has `rights`.
- The terms already name the embedded rights data (2026-11-09).

## Not in scope

Directus images (exhibition, venue and person photos): Directus removes embedded data from every
resized copy, the only copies the site shows. A later step, if the owner wants it.
