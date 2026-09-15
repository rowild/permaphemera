#!/usr/bin/env node
// Reconciles the Carinthian gallery directory (src/data.ts) against the
// 2026 Excel contact sheet, the older HTML "explorer" data set and a plain
// text note, then writes a Markdown report of what matched, what was
// filled in, what conflicts, and what got added.
//
// Usage: node scripts/reconcile.mjs [--sources <dir>] [--apply]
//   --sources <dir>  Folder holding the three source files (default: the
//                     "_Material/_Galerien Verzeichnis" folder next to the
//                     repo root, two levels up from this project).
//   --apply           Actually write src/data.ts (and src/austriaData.json
//                     if ids need renumbering). Without --apply the script
//                     only reads sources + data.ts and writes the report;
//                     nothing under src/ is touched.
//
// Re-run after --apply: the report's "missing on site" section should be
// empty except the documented conflicts.

import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const repoRoot = resolve(projectRoot, "..");

const DEFAULT_SOURCES_DIR = join(repoRoot, "_Material", "_Galerien Verzeichnis");

function parseArgs(argv) {
  const args = { sources: DEFAULT_SOURCES_DIR, apply: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--sources") args.sources = resolve(argv[++i]);
    else if (argv[i] === "--apply") args.apply = true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

const XLSX_NAME = "Galerien_Kaernten_Kontakte_2026.xlsx";
const EXPLORER_NAME = "kaerntner_kunstgalerien_explorer.html";
const TXT_NAME = "Galerien Adressen und Namen.txt";

const xlsxPath = join(args.sources, XLSX_NAME);
const explorerPath = join(args.sources, EXPLORER_NAME);
const txtPath = join(args.sources, TXT_NAME);

// ---------------------------------------------------------------------------
// Normalisation helpers (shared for names and cities)
// ---------------------------------------------------------------------------

const STOPWORDS = /\b(galerie|galerija|kunstverein|verein)\b/g;

function stripDiacritics(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normName(raw) {
  if (!raw) return "";
  let s = stripDiacritics(String(raw).toLowerCase());
  s = s.replace(STOPWORDS, " ");
  s = s.replace(/[^a-z0-9\s]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function normCity(raw) {
  if (!raw) return "";
  let s = String(raw).split(" / ")[0].split("(")[0];
  return normName(s);
}

function matchKey(city, name) {
  return `${normCity(city)}|${normName(name)}`;
}

// ---------------------------------------------------------------------------
// Value-type helpers
// ---------------------------------------------------------------------------

const EMAIL_PART_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const URL_RE = /^(https?:\/\/|www\.)/i;

function isEmailLike(value) {
  if (!value) return false;
  return value.split(/;\s*/).every((part) => EMAIL_PART_RE.test(part.trim()));
}

function isUrlLike(value) {
  return !!value && URL_RE.test(value.trim());
}

function normalizeWebsite(raw) {
  if (!raw) return null;
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    // Only force a trailing slash for bare-domain roots; leave any real
    // path (e.g. "/kulturorte/foo" or "/programm03.htm") untouched so we
    // don't manufacture a spurious mismatch against the site's stored URL.
    if (u.pathname === "") u.pathname = "/";
    return u.toString();
  } catch {
    return s;
  }
}

// ---------------------------------------------------------------------------
// 1. Parse the Excel workbook via a spawned python3 helper (zipfile + regex,
//    no openpyxl dependency; cells are matched by their explicit r="C4"
//    attribute, never by position, so leftward-compacted empty cells in the
//    sparse writer output cannot misalign columns).
// ---------------------------------------------------------------------------

const PYTHON_HELPER = String.raw`
import sys, json, re, zipfile, html

def read_zip_text(zf, name):
    return zf.read(name).decode("utf-8")

def resolve_sheet_targets(zf):
    wb = read_zip_text(zf, "xl/workbook.xml")
    rels = read_zip_text(zf, "xl/_rels/workbook.xml.rels")
    sheet_entries = re.findall(r'<x:sheet\s+name="([^"]*)"[^>]*r:id="([^"]*)"', wb)
    rel_map = {rid: target for target, rid in re.findall(r'Target="([^"]*)"[^>]*Id="([^"]*)"', rels)}
    if not rel_map:
        rel_map = {rid: target for rid, target in re.findall(r'Id="([^"]*)"[^>]*Target="([^"]*)"', rels)}
    name_to_path = {}
    for sheet_name, rid in sheet_entries:
        target = rel_map.get(rid)
        if not target:
            continue
        target = target.lstrip("/")
        if not target.startswith("xl/"):
            target = "xl/" + target
        name_to_path[html.unescape(sheet_name)] = target
    return name_to_path

CELL_RE = re.compile(
    r'<x:c r="([A-Z]+)(\d+)"[^>]*?(?:/>|>(?:<x:is><x:t[^>]*>(.*?)</x:t></x:is>|<x:v>(.*?)</x:v>)?</x:c>)',
    re.DOTALL,
)
ROW_RE = re.compile(r'<x:row r="(\d+)"[^>]*>(.*?)</x:row>', re.DOTALL)

def parse_sheet(xml_text, header_row=4, first_data_row=5):
    rows = {}
    for row_num_str, row_body in ROW_RE.findall(xml_text):
        row_num = int(row_num_str)
        cells = {}
        for col, _r, is_text, v_text in CELL_RE.findall(row_body):
            raw = is_text if is_text else v_text
            cells[col] = html.unescape(raw) if raw else ""
        rows[row_num] = cells
    header_cells = rows.get(header_row, {})
    header = {col: text.strip() for col, text in header_cells.items() if text.strip()}
    records = []
    max_row = max(rows.keys()) if rows else header_row
    for row_num in range(first_data_row, max_row + 1):
        cells = rows.get(row_num)
        if cells is None:
            continue
        if not any(v.strip() for v in cells.values()):
            continue
        record = {"_row": row_num}
        for col, field_name in header.items():
            record[field_name] = cells.get(col, "").strip()
        records.append(record)
    return records

def main():
    xlsx_path = sys.argv[1]
    sheet_names = sys.argv[2:]
    with zipfile.ZipFile(xlsx_path) as zf:
        name_to_path = resolve_sheet_targets(zf)
        out = {}
        for sheet_name in sheet_names:
            path = name_to_path.get(sheet_name)
            if not path:
                out[sheet_name] = {"error": "sheet not found; available: " + repr(list(name_to_path))}
                continue
            xml_text = read_zip_text(zf, path)
            out[sheet_name] = parse_sheet(xml_text)
    print(json.dumps(out, ensure_ascii=False))

if __name__ == "__main__":
    main()
`;

function dumpXlsx(path) {
  const tmpDir = mkdtempSync(join(tmpdir(), "gvoe-reconcile-"));
  const helperPath = join(tmpDir, "xlsx_dump.py");
  writeFileSync(helperPath, PYTHON_HELPER, "utf8");
  const out = execFileSync(
    "python3",
    [helperPath, path, "Aktive Galerien", "Weitere & Prüffälle"],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 32 },
  );
  return JSON.parse(out);
}

// ---------------------------------------------------------------------------
// 2. Parse the HTML explorer's `const galleriesData = [...]` JS literal.
// ---------------------------------------------------------------------------

function parseExplorer(path) {
  const src = readFileSync(path, "utf8");
  const marker = "const galleriesData = [";
  const markerStart = src.indexOf(marker);
  if (markerStart === -1) throw new Error(`galleriesData literal not found in ${path}`);
  const arrStart = markerStart + marker.length - 1;
  const arrEnd = src.indexOf("\n    ];", arrStart);
  if (arrEnd === -1) throw new Error(`could not find end of galleriesData literal in ${path}`);
  const code = src.slice(arrStart, arrEnd + 6);
  // eslint-disable-next-line no-new-func -- trusted local project source, plain JS array literal
  return new Function(`return ${code}`)();
}

// ---------------------------------------------------------------------------
// 3. Parse the free-form text note.
// ---------------------------------------------------------------------------

function parseTxt(path) {
  const raw = readFileSync(path, "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// 4. Load src/data.ts: carve out the carinthiaGalleries JSON array so we can
//    edit it programmatically and re-serialise it back into the file.
// ---------------------------------------------------------------------------

const dataTsPath = join(projectRoot, "src", "data.ts");
const austriaJsonPath = join(projectRoot, "src", "austriaData.json");

function loadDataTs() {
  const src = readFileSync(dataTsPath, "utf8");
  const marker = "const carinthiaGalleries: Gallery[] = [";
  const markerStart = src.indexOf(marker);
  if (markerStart === -1) throw new Error("carinthiaGalleries literal not found in data.ts");
  const arrStart = markerStart + marker.length - 1;
  const arrEnd = src.indexOf("\n];", arrStart);
  if (arrEnd === -1) throw new Error("could not find end of carinthiaGalleries literal in data.ts");
  const jsonText = src.slice(arrStart, arrEnd + 2);
  const galleries = JSON.parse(jsonText);
  const prefix = src.slice(0, arrStart);
  const suffix = src.slice(arrEnd + 2);
  return { galleries, prefix, suffix };
}

function serializeGalleries(galleries) {
  // Keep the same key order the file already uses per entry.
  const KEY_ORDER = [
    "id", "city", "name", "category", "address", "email", "moreEmail",
    "contacts", "role", "phone", "status", "confidence", "website",
    "source", "note", "salutation", "active", "sourceType",
  ];
  const lines = galleries.map((gallery) => {
    const keys = [...KEY_ORDER.filter((k) => k in gallery), ...Object.keys(gallery).filter((k) => !KEY_ORDER.includes(k))];
    const body = keys
      .map((key) => `    ${JSON.stringify(key)}: ${JSON.stringify(gallery[key])}`)
      .join(",\n");
    return `  {\n${body}\n  }`;
  });
  return `[\n${lines.join(",\n")}\n]`;
}

function loadCityCoordinates(src) {
  const marker = "export const cityCoordinates: Record<string, { lat: number; lon: number }> = {";
  const start = src.indexOf(marker);
  const objStart = start + marker.length - 1;
  const objEnd = src.indexOf("\n};", objStart);
  const body = src.slice(objStart, objEnd + 2);
  const cities = {};
  const re = /"([^"]+)":\s*\{\s*lat:\s*([\d.\-]+),\s*lon:\s*([\d.\-]+)\s*\}/g;
  let m;
  while ((m = re.exec(body))) cities[m[1]] = { lat: Number(m[2]), lon: Number(m[3]) };
  return cities;
}

// ---------------------------------------------------------------------------
// Main reconciliation
// ---------------------------------------------------------------------------

function main() {
  const dataTsSrc = readFileSync(dataTsPath, "utf8");
  const { galleries, prefix, suffix } = loadDataTs();
  const cityCoordinates = loadCityCoordinates(dataTsSrc);

  const xlsxDump = dumpXlsx(xlsxPath);
  const excelActive = xlsxDump["Aktive Galerien"];
  const excelOther = xlsxDump["Weitere & Prüffälle"];
  const explorerRows = parseExplorer(explorerPath);
  const txtLines = parseTxt(txtPath);

  const byKey = new Map();
  for (const gallery of galleries) byKey.set(matchKey(gallery.city, gallery.name), gallery);

  // The explorer file spells bilingual cities "X (Y)" while the site (and
  // the Excel sheet) use "X / Y". Canonicalise any new entry's city to the
  // spelling already used on the site (by normalised city), so a brand-new
  // gallery in an existing city still finds its cityCoordinates row and
  // groups correctly in the directory instead of creating a second,
  // differently-spelled city.
  const canonicalCityByNorm = new Map();
  for (const gallery of galleries) {
    const key = normCity(gallery.city);
    if (!canonicalCityByNorm.has(key)) canonicalCityByNorm.set(key, gallery.city);
  }
  function canonicalCity(raw) {
    const trimmed = String(raw).trim();
    const key = normCity(trimmed);
    if (canonicalCityByNorm.has(key)) return canonicalCityByNorm.get(key);
    const m = /^(.+?)\s*\(([^)]+)\)\s*$/.exec(trimmed);
    return m ? `${m[1].trim()} / ${m[2].trim()}` : trimmed;
  }

  const report = {
    counts: {
      excelActive: excelActive.length,
      excelOther: excelOther.length,
      explorer: explorerRows.length,
      siteEntries: galleries.length,
    },
    matched: [],
    unmatchedSource: [],
    filled: [],
    conflicts: [],
    added: [],
    salutationsSet: [],
    unplaceable: [],
    missingCoordinates: [],
    unmatchedSiteEntries: new Set(galleries.map((g) => matchKey(g.city, g.name))),
  };

  let nextId = Math.max(0, ...galleries.map((g) => g.id)) + 1;

  function fillField(gallery, field, sourceValue, sourceLabel) {
    if (sourceValue === undefined || sourceValue === null || sourceValue === "") return;
    const current = gallery[field];
    if (current === null || current === undefined || current === "") {
      gallery[field] = sourceValue;
      report.filled.push({ id: gallery.id, name: gallery.name, city: gallery.city, field, value: sourceValue, source: sourceLabel });
    } else if (String(current).trim() !== String(sourceValue).trim()) {
      report.conflicts.push({ id: gallery.id, name: gallery.name, city: gallery.city, field, site: current, source: sourceValue, sourceLabel });
    }
  }

  // --- Excel rows (both sheets) -------------------------------------------
  function processExcelRow(row, sheetLabel) {
    const city = row["Stadt / Ort"] || "";
    const name = row["Galerie / Kunstort"] || "";
    const key = matchKey(city, name);
    const gallery = byKey.get(key);
    const sourceLabel = `Excel 25.08.2026 (${sheetLabel}, Zeile ${row._row})`;

    if (gallery) {
      report.unmatchedSiteEntries.delete(key);
      report.matched.push({ source: sourceLabel, city, name, siteId: gallery.id });
      fillField(gallery, "email", row["E-Mail"] || null, sourceLabel);
      fillField(gallery, "moreEmail", row["Weitere E-Mail"] || null, sourceLabel);
      fillField(gallery, "phone", row["Telefon"] || null, sourceLabel);
      fillField(gallery, "website", row["Website"] ? normalizeWebsite(row["Website"]) : null, sourceLabel);
      fillField(gallery, "contacts", row["Ansprechperson(en)"] || null, sourceLabel);
      fillField(gallery, "role", row["Funktion"] || null, sourceLabel);
    } else {
      report.unmatchedSource.push({ source: sourceLabel, city, name });
      const displayCity = canonicalCity(city);
      const coords = cityCoordinates[displayCity];
      if (!coords) report.missingCoordinates.push(displayCity);
      const newGallery = {
        id: nextId++,
        city: displayCity,
        name,
        category: row["Kategorie"] || "Weitere",
        address: row["Adresse"] || displayCity,
        email: row["E-Mail"] || null,
        moreEmail: row["Weitere E-Mail"] || null,
        contacts: row["Ansprechperson(en)"] || null,
        role: row["Funktion"] || null,
        phone: row["Telefon"] || null,
        status: row["Status 2026"] || "ungeklärt",
        confidence: "mittel",
        website: row["Website"] ? normalizeWebsite(row["Website"]) : null,
        source: row["Quelle 1"] || row["Quelle 2"] || null,
        note: row["Hinweise"] || null,
        sourceType: "Excel 25.08.2026",
      };
      galleries.push(newGallery);
      byKey.set(key, newGallery);
      report.added.push({ id: newGallery.id, city: displayCity, name, source: sourceLabel });
    }
  }

  for (const row of excelActive) processExcelRow(row, "Aktive Galerien");
  for (const row of excelOther) processExcelRow(row, "Weitere & Prüffälle");

  // --- Explorer rows (also carries `salutation`) ---------------------------
  for (const row of explorerRows) {
    const key = matchKey(row.city, row.name);
    const gallery = byKey.get(key);
    const sourceLabel = `Explorer (${row.city} · ${row.name})`;

    if (gallery) {
      report.unmatchedSiteEntries.delete(key);
      report.matched.push({ source: sourceLabel, city: row.city, name: row.name, siteId: gallery.id });
      fillField(gallery, "email", row.email || null, sourceLabel);
      fillField(gallery, "website", row.website ? normalizeWebsite(row.website) : null, sourceLabel);
      fillField(gallery, "contacts", row.contact || null, sourceLabel);
      if (row.salutation) {
        if (gallery.salutation !== row.salutation) {
          gallery.salutation = row.salutation;
          report.salutationsSet.push({ id: gallery.id, name: gallery.name, salutation: row.salutation });
        }
      }
    } else {
      report.unmatchedSource.push({ source: sourceLabel, city: row.city, name: row.name });
      const displayCity = canonicalCity(row.city);
      const coords = cityCoordinates[displayCity];
      if (!coords) report.missingCoordinates.push(displayCity);
      const newGallery = {
        id: nextId++,
        city: displayCity,
        name: row.name,
        category: row.type || "Weitere",
        address: row.address || displayCity,
        email: row.email || null,
        moreEmail: null,
        contacts: row.contact || null,
        role: null,
        phone: null,
        status: "ungeklärt (Explorer)",
        confidence: "mittel",
        website: row.website ? normalizeWebsite(row.website) : null,
        source: null,
        note: null,
        salutation: row.salutation || null,
        sourceType: "Explorer",
      };
      galleries.push(newGallery);
      byKey.set(key, newGallery);
      report.added.push({ id: newGallery.id, city: displayCity, name: row.name, source: sourceLabel });
    }
  }

  // --- Text note: Julia Schuster (unplaceable) + Kunsthaus Gmünd / Emily Gfrerer
  const gmuend = galleries.find((g) => normName(g.name).includes("kunsthaus gmund"));
  if (gmuend) {
    if (!/emily gfrerer/i.test(gmuend.contacts || "")) {
      gmuend.contacts = gmuend.contacts ? `${gmuend.contacts}; Emily Gfrerer` : "Emily Gfrerer";
      report.filled.push({ id: gmuend.id, name: gmuend.name, city: gmuend.city, field: "contacts", value: "Emily Gfrerer", source: "Galerien Adressen und Namen.txt" });
    }
  } else {
    report.unplaceable.push({ person: "Emily Gfrerer", reason: "Kein 'Kunsthaus Gmünd'-Eintrag im Verzeichnis gefunden." });
  }
  const juliaKnown = galleries.some((g) => /julia schuster/i.test(g.contacts || ""));
  if (!juliaKnown) {
    report.unplaceable.push({ person: "Julia Schuster", reason: "Keine Quelle nennt ihre Galerie/Institution; nicht zuordenbar." });
  }

  // --- Kunstverein Velden (flyer) ------------------------------------------
  // Note: normName() strips the word "kunstverein" as a stopword (it's part
  // of the name-matching normalisation used for source rows), so it cannot
  // be used to *find* an entry named "Kunstverein Velden" — check the raw
  // name instead.
  let velden = galleries.find((g) => normCity(g.city) === normCity("Velden am Wörthersee") && /kunstverein/i.test(g.name) && /velden/i.test(g.name));
  if (!velden) {
    velden = {
      id: nextId++,
      city: "Velden am Wörthersee",
      name: "Kunstverein Velden",
      category: "Kunstverein",
      address: "9220 Velden am Wörthersee",
      email: null,
      moreEmail: null,
      contacts: null,
      role: null,
      phone: null,
      status: "aktiv 2026",
      confidence: "mittel",
      website: null,
      source: null,
      note: null,
      sourceType: "Flyer (Lange Nacht der Museen 2026)",
    };
    galleries.push(velden);
    report.added.push({ id: velden.id, city: velden.city, name: velden.name, source: "Flyer: Lange Nacht der Museen 2026" });
    if (!cityCoordinates[velden.city]) report.missingCoordinates.push(velden.city);
  }
  fillField(velden, "website", "https://www.kunstverein-velden.at/", "Flyer: Lange Nacht der Museen 2026");
  fillField(velden, "phone", "+43 699 11030543", "Flyer: Lange Nacht der Museen 2026");
  if (!/barbara scheikl/i.test(velden.contacts || "")) {
    velden.contacts = velden.contacts ? `${velden.contacts}; Barbara Scheikl` : "Barbara Scheikl";
    if (!velden.role) velden.role = "Kontakt / Kartenverkauf";
    report.filled.push({ id: velden.id, name: velden.name, city: velden.city, field: "contacts", value: "Barbara Scheikl", source: "Flyer" });
  }
  const veldenNote = "Lange Nacht der Museen 2026 im Europahaus Klagenfurt, 3. Oktober 2026 (Flyer)";
  if (!velden.note) {
    velden.note = veldenNote;
  } else if (!velden.note.includes(veldenNote)) {
    velden.note = `${velden.note} ${veldenNote}`;
  }

  // --- Assign ids/coordinates check for anything added -------------------
  report.unmatchedSiteEntriesList = [...report.unmatchedSiteEntries].map((key) => {
    const [cityKey, nameKey] = key.split("|");
    const gallery = galleries.find((g) => matchKey(g.city, g.name) === key);
    return gallery ? { id: gallery.id, city: gallery.city, name: gallery.name } : { key };
  });

  // ---------------------------------------------------------------------
  // Apply to disk (only with --apply)
  // ---------------------------------------------------------------------
  const addedCount = report.added.length;
  if (args.apply && addedCount > 0) {
    // austriaData.json ids continue right after carinthiaGalleries; keep the
    // whole `galleries` export contiguous & unique by shifting them up by
    // however many entries we just appended to carinthiaGalleries.
    const austriaData = JSON.parse(readFileSync(austriaJsonPath, "utf8"));
    for (const entry of austriaData) entry.id += addedCount;
    writeFileSync(austriaJsonPath, `${JSON.stringify(austriaData, null, 2)}\n`, "utf8");
  }
  if (args.apply) {
    const newSrc = `${prefix}${serializeGalleries(galleries)}${suffix}`;
    writeFileSync(dataTsPath, newSrc, "utf8");
  }

  writeReport(report, addedCount);
  console.log(`Reconcile ${args.apply ? "(applied)" : "(dry run)"}: matched=${report.matched.length} added=${report.added.length} filled=${report.filled.length} conflicts=${report.conflicts.length} unplaceable=${report.unplaceable.length}`);
}

function writeReport(report, addedCount) {
  const lines = [];
  lines.push("# Reconcile report — 2026-09-15");
  lines.push("");
  lines.push("Sources: `Galerien_Kaernten_Kontakte_2026.xlsx` (Aktive Galerien + Weitere & Prüffälle), `kaerntner_kunstgalerien_explorer.html`, `Galerien Adressen und Namen.txt`, and the Kunstverein Velden flyer.");
  lines.push("");
  lines.push("## Source counts");
  lines.push("");
  lines.push(`- Excel · Aktive Galerien: ${report.counts.excelActive}`);
  lines.push(`- Excel · Weitere & Prüffälle: ${report.counts.excelOther}`);
  lines.push(`- Explorer HTML entries: ${report.counts.explorer}`);
  lines.push(`- Site (\`carinthiaGalleries\`) entries at start: ${report.counts.siteEntries}`);
  lines.push("");
  lines.push(`## Summary: matched=${report.matched.length} added=${report.added.length} filled=${report.filled.length} conflicts=${report.conflicts.length} unplaceable=${report.unplaceable.length}`);
  lines.push("");

  lines.push("## Matches (source row → site id)");
  lines.push("");
  for (const m of report.matched) lines.push(`- ${m.source} → id ${m.siteId} (${m.name}, ${m.city})`);
  lines.push("");

  lines.push("## Unmatched source rows (added as new site entries)");
  lines.push("");
  if (!report.unmatchedSource.length) lines.push("_None._");
  for (const u of report.unmatchedSource) lines.push(`- ${u.source}: **${u.name}** (${u.city})`);
  lines.push("");

  lines.push("## Filled fields (site was null, source had a value)");
  lines.push("");
  if (!report.filled.length) lines.push("_None._");
  for (const f of report.filled) lines.push(`- id ${f.id} (${f.name}, ${f.city}) · **${f.field}** ← \`${f.value}\` — ${f.source}`);
  lines.push("");

  lines.push("## Conflicts (site and source disagree — left as-is for the owner)");
  lines.push("");
  if (!report.conflicts.length) lines.push("_None._");
  for (const c of report.conflicts) lines.push(`- id ${c.id} (${c.name}, ${c.city}) · **${c.field}**: site=\`${c.site}\` vs. source=\`${c.source}\` (${c.sourceLabel})`);
  lines.push("");

  lines.push("## Salutations set");
  lines.push("");
  if (!report.salutationsSet.length) lines.push("_None (already set, or run after apply)._");
  for (const s of report.salutationsSet) lines.push(`- id ${s.id} (${s.name}): "${s.salutation}"`);
  lines.push("");

  lines.push("## New entries added");
  lines.push("");
  if (!report.added.length) lines.push("_None._");
  for (const a of report.added) lines.push(`- id ${a.id}: **${a.name}** (${a.city}) — ${a.source}`);
  lines.push("");

  lines.push("## Unplaceable people (named in a source, no gallery identified)");
  lines.push("");
  if (!report.unplaceable.length) lines.push("_None._");
  for (const p of report.unplaceable) lines.push(`- ${p.person}: ${p.reason}`);
  lines.push("");

  lines.push("## New entries without a `cityCoordinates` lookup (lat/lon left undefined)");
  lines.push("");
  const uniqueMissing = [...new Set(report.missingCoordinates)];
  if (!uniqueMissing.length) lines.push("_None._");
  for (const c of uniqueMissing) lines.push(`- ${c}`);
  lines.push("");

  lines.push("## Site Carinthian entries no source in this run knows about");
  lines.push("");
  if (!report.unmatchedSiteEntriesList.length) lines.push("_None._");
  for (const e of report.unmatchedSiteEntriesList) lines.push(`- id ${e.id ?? "?"}: ${e.name ?? e.key} (${e.city ?? ""})`);
  lines.push("");

  lines.push(`_Entries appended this run: ${addedCount}. If > 0 and \`--apply\` was passed, \`austriaData.json\` ids were shifted up by ${addedCount} to stay unique/contiguous._`);
  lines.push("");

  const reportPath = join(projectRoot, "docs", "reconcile-2026-09-15.md");
  writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log(`Report written to ${reportPath}`);
}

main();
