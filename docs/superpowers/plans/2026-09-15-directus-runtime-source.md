# Directus as the Live Data Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the content into Directus (records with their UUIDs, 45 files), open public read access, brand the admin, and make the frontend and its check scripts read from Directus at runtime, so the JSON files can leave the repo.

**Architecture:** Directus side: four idempotent scripts (`permissions`, `import`, `export`, branding inside `apply-settings`) and one step-by-step `setup.sh` that reports then asks. Frontend side: one fetch at app start (`useArchiveSource`) into a shared state; `useArchiveData` and `useSiteNavigation` read that state; resolvers and pages unchanged. A shared `scripts/lib/archive-source.mjs` gives the check scripts the same collections from Directus.

**Tech Stack:** Directus 11.17.4 (SQLite, `uploads/`), Node 24 (`fetch`, `FormData`, `Blob`; no dependencies), bash; Nuxt 4 SPA (`ssr: false`), pnpm, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-15-directus-runtime-source-design.md`. Schema reference: `docs/superpowers/specs/2026-09-14-directus-conventions-schema-design.md`.

## Global Constraints

- Branch `feature/directus-runtime`. Commit after every task with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Never commit `directus/.env` or `frontend/.env`. Do not push.
- Directus: work from `directus/`, `node scripts/<name>.mjs`; the instance runs at `http://localhost:8077` (host port; never 8055). Every script is idempotent: existing things are skipped and reported with `=`, created ones with `+`. **Nothing deletes content.** `reset.sh` is removed in Task 5 and must not be run before that.
- Frontend: work from `frontend/`, `source ~/.nvm/nvm.sh && nvm use` first (Node 24). Never `text-[…]`, never `<style scoped>`, marker groups keep inner spaces. Component-facing shapes (`ResolvedVenue`, `ResolvedExhibition`, `DirectoryArtist`, `NavLink`, `NavGroup`) do not change. Pages other than `app.vue` need no edits; if one does, stop and report.
- Record ids are the UUIDs already in the JSON. The import passes them through. Files get fresh UUIDs on upload; a file id is kept on re-import from an export.
- File fields (`pp_venues.image`, `hero_image`; `pp_exhibitions.image`, `source_pdf`; `pp_sponsors.logo`) hold a Directus file id in Directus and a URL string `${directusUrl}/assets/<id>` in the frontend snapshot. `tour` stays a path string.
- Public read: policy named `$t:public_label`; `read` on every `pp_` collection except `pp_meta`, filter `{ status: { _neq: 'archived' } }` where the collection has `status`; `read` on `languages` and `directus_files`.
- The frontend Directus URL comes from `runtimeConfig.public.directusUrl` (env `NUXT_PUBLIC_DIRECTUS_URL`, default `http://localhost:8077`). Check scripts and the tour script read `DIRECTUS_URL` (default the same) and `DIRECTUS_TOKEN` from `frontend/.env`.
- All nine `check:*`, `check:data`, `check:types`, `pnpm test` green before every commit from Task 7 on; Task 6 is green too (it adds code without switching the source). Between Task 7 and Task 8 the check scripts still read JSON, which still exists — green.

---

## File Structure

| Path | Responsibility |
|---|---|
| `directus/scripts/permissions.mjs` | public read rules — **new** |
| `directus/scripts/apply-settings.mjs` | + logo, foreground, note — **modified** |
| `directus/scripts/import.mjs` | records + files from a source dir — **new** |
| `directus/scripts/export.mjs` | records + files to a target dir — **new** |
| `directus/scripts/setup.sh` | step-by-step entry point — **new**; `reset.sh` **deleted** |
| `directus/scripts/check-conventions.mjs` | + public read rule per collection — **modified** |
| `directus/README.md` | commands, backup/restore, no reset — **modified** |
| `frontend/nuxt.config.ts`, `frontend/.env.example` | Directus URL — **modified / new** |
| `frontend/app/utils/directusClient.ts` | `createArchiveClient(baseUrl)` — **new** |
| `frontend/app/utils/loadArchive.ts` | 17 collections → `ArchiveSnapshot` — **new** |
| `frontend/app/types/content.ts` | `ArchiveSnapshot` — **modified** |
| `frontend/app/composables/useArchiveSource.ts` | one fetch, shared state — **new** |
| `frontend/app/app.vue` | await source, loading, error — **modified** |
| `frontend/app/composables/useArchiveData.ts`, `useSiteNavigation.ts` | read the state — **modified** |
| `frontend/test/unit/loadArchive.spec.ts` | — **new** |
| `frontend/scripts/lib/archive-source.mjs` | collections from Directus for scripts — **new** |
| `frontend/scripts/check-data-integrity.mjs`, `check-directory-routes.mjs`, `check-i18n-privacy.mjs`, `check-mobile-density.mjs`, `check-public-namespace.mjs`, `publish-tour.mjs` | read from `archive-source` — **modified** |
| `frontend/AGENTS.md`, `frontend/README.md`, root `README.md` | docs — **modified** |
| `frontend/app/data/` (17 files), record images under `frontend/public/media/images/` | moved to `_BU/` and removed from git — **Task 10** |

---

### Task 1: Public read permissions

**Files:**
- Create: `directus/scripts/permissions.mjs`
- Modify: `directus/scripts/check-conventions.mjs`

**Interfaces:**
- Produces: `node scripts/permissions.mjs` prints `+`/`=` per rule and `done`; `--reset` deletes the public `pp_`/`languages`/`directus_files` read rules first, then recreates them. `check-conventions.mjs` fails when a `pp_` collection (except `pp_meta`) lacks a public read rule.

- [ ] **Step 1: Write the script**

```js
// directus/scripts/permissions.mjs
// Public (no token) read access for the site. Idempotent by (policy, collection, action).
//   node scripts/permissions.mjs [--reset]
import { loadEnv, login } from './lib.mjs'
import { col } from './naming.mjs'
import { entities } from './schema.mjs'

const { api } = await login(loadEnv())
const reset = process.argv.includes('--reset')

const policies = await api('GET', '/policies?filter[name][_eq]=$t:public_label&fields=id')
const publicPolicy = policies[0]?.id
if (!publicPolicy) throw new Error('no public policy ($t:public_label) found')

const collections = (await api('GET', '/collections')).map((c) => c.collection)
const targets = [
  ...collections.filter((n) => n.startsWith('pp_') && n !== col('meta') && n !== col('archive')),
  'languages',
  'directus_files',
]
// Every entity table carries `status`; structural tables (mm__, translations__) do not.
const statusOf = new Set(Object.keys(entities).map((k) => col(k)))

const existing = await api('GET', `/permissions?filter[policy][_eq]=${publicPolicy}&filter[action][_eq]=read&limit=-1&fields=id,collection`)
const byCollection = new Map(existing.map((p) => [p.collection, p.id]))

if (reset) {
  for (const t of targets) {
    if (byCollection.has(t)) { await api('DELETE', `/permissions/${byCollection.get(t)}`); console.log(`- ${t}`); byCollection.delete(t) }
  }
}

for (const t of targets) {
  if (byCollection.has(t)) { console.log(`= ${t}`); continue }
  const permissions = statusOf.has(t) ? { status: { _neq: 'archived' } } : {}
  await api('POST', '/permissions', { policy: publicPolicy, collection: t, action: 'read', fields: ['*'], permissions, validation: null, presets: null })
  console.log(`+ ${t}`)
}
console.log('done')
```

- [ ] **Step 2: Run twice, then prove public access**

```bash
node scripts/permissions.mjs | tail -3
node scripts/permissions.mjs | grep -c '^+'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8077/items/pp_roles
curl -s http://localhost:8077/items/pp_roles?fields=slug | head -c 120; echo
```
Expected: first run ends with `done` after `+` lines (24 `pp_` + languages + files = 26); second run `0`; then `200` and `{"data":[{"slug":"artist"},{"slug":"curator"}]}`.

- [ ] **Step 3: Extend `check-conventions.mjs`**

After the relations loop, add:

```js
// Public read rule on every pp_ table except the folder and pp_meta.
const publicPolicy = (await api('GET', '/policies?filter[name][_eq]=$t:public_label&fields=id'))[0]?.id
const publicReads = new Set((await api('GET', `/permissions?filter[policy][_eq]=${publicPolicy}&filter[action][_eq]=read&limit=-1&fields=collection`)).map((p) => p.collection))
for (const c of collections) {
  if (isFolder(c) || c.collection === 'pp_meta') continue
  check(publicReads.has(c.collection), `no public read rule: ${c.collection}`)
}
```

Run: `node scripts/check-conventions.mjs` → `Conventions OK: …`.

- [ ] **Step 4: Commit**

```bash
git add directus/scripts/permissions.mjs directus/scripts/check-conventions.mjs
git commit -m "Open public read access to the pp_ collections and files

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Branding in the settings script

**Files:**
- Modify: `directus/scripts/apply-settings.mjs`

**Interfaces:**
- Produces: `uploadFile(api, base, token, { path, folderName, title })` helper exported from a new `directus/scripts/files.mjs` (Task 3 reuses it): ensures the folder, uploads once (idempotent by `title` inside the folder), returns the file id.

- [ ] **Step 1: Write `files.mjs`**

```js
// directus/scripts/files.mjs
// Upload helpers shared by apply-settings.mjs and import.mjs. Node 24 FormData/Blob, no deps.
import { readFileSync } from 'node:fs'
import { basename, extname } from 'node:path'

const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.gif': 'image/gif' }

/** Folder path like "media/images/locations" → id of the last folder, creating what is missing. */
export async function ensureFolder(api, folderPath) {
  let parent = null
  for (const name of folderPath.split('/').filter(Boolean)) {
    const q = `filter[name][_eq]=${encodeURIComponent(name)}&filter[parent][_${parent ? 'eq' : 'null'}]=${parent ?? 'true'}&limit=1&fields=id`
    const found = (await api('GET', `/folders?${q}`))[0]
    parent = found ? found.id : (await api('POST', '/folders', { name, parent })).id
  }
  return parent
}

/** Upload one local file into a folder. Idempotent by (folder, filename_download). Returns the file id. */
export async function uploadFile({ api, base, token }, { localPath, folderPath, title, id }) {
  const folder = await ensureFolder(api, folderPath)
  const filename = basename(localPath)
  const existing = (await api('GET', `/files?filter[folder][_eq]=${folder}&filter[filename_download][_eq]=${encodeURIComponent(filename)}&limit=1&fields=id`))[0]
  if (existing) return { id: existing.id, created: false }
  const fd = new FormData()
  if (id) fd.append('id', id)
  fd.append('folder', folder)
  fd.append('title', title ?? filename)
  fd.append('file', new Blob([readFileSync(localPath)], { type: MIME[extname(localPath).toLowerCase()] ?? 'application/octet-stream' }), filename)
  const res = await fetch(`${base}/files`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
  const json = await res.json()
  if (!res.ok) throw new Error(`upload ${localPath}: ${res.status} ${json?.errors?.[0]?.message ?? ''}`)
  return { id: json.data.id, created: true }
}
```

- [ ] **Step 2: Extend `apply-settings.mjs`**

Replace its body with:

```js
import { resolve } from 'node:path'
import { loadEnv, login } from './lib.mjs'
import { COLOR } from './schema.mjs'
import { uploadFile } from './files.mjs'

const env = loadEnv()
const session = await login(env)
const { api } = session
const brand = (file) => resolve(import.meta.dirname, '..', '..', 'frontend', 'public', 'media', 'svg', 'brand', file)

const logo = await uploadFile(session, { localPath: brand('archive-temple.svg'), folderPath: 'branding', title: 'PERMAPHEMERA temple mark' })
const seal = await uploadFile(session, { localPath: brand('permaphemera_seal.svg'), folderPath: 'branding', title: 'PERMAPHEMERA seal' })
console.log(`${logo.created ? '+' : '='} logo ${logo.id}`)
console.log(`${seal.created ? '+' : '='} seal ${seal.id}`)

const settings = await api('PATCH', '/settings', {
  project_name: env.PROJECT_NAME || 'PERMAPHEMERA',
  project_descriptor: 'Exhibition archive',
  project_color: COLOR,
  default_language: 'en-US',
  project_url: 'http://localhost:4991',
  project_logo: logo.id,
  public_foreground: seal.id,
  public_note: 'PERMAPHEMERA exhibition archive',
})
console.log(`settings: ${settings.project_name} · ${settings.project_color} · ${settings.default_language} · logo ${settings.project_logo ? 'set' : 'missing'}`)
```

- [ ] **Step 3: Run twice**

Run: `node scripts/apply-settings.mjs` twice.
Expected: first `+ logo …`, `+ seal …`; second `= logo …`, `= seal …`; both end with `logo set`. Open `http://localhost:8077/admin/login` in a browser if available: the seal shows on the login screen; the temple mark shows in the top-left of the admin app. If no browser: `curl -s http://localhost:8077/server/info | grep -o '"project_logo":"[^"]*"'` prints the id.

- [ ] **Step 4: Commit**

```bash
git add directus/scripts/files.mjs directus/scripts/apply-settings.mjs
git commit -m "Brand the Directus admin with the temple mark and the seal

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Import records and files

**Files:**
- Create: `directus/scripts/import.mjs`

**Interfaces:**
- `node scripts/import.mjs [--from <dir>]` — default `../frontend/app/data`. Source layout: `pp_<name>.json` files in the JSON item shape. A file field value that starts with `/` is a path under `<dir>/../public` (frontend layout) or `<dir>/public` (export layout, Task 4), uploaded into a folder mirroring its directory; a value that is a UUID is a file id restored from `<dir>/files/<id>.<ext>` with the same id (export layout, Task 4). Records keep their `id`. Prints `+ pp_x <id>` / `= pp_x <id>` and a final count line per collection.

- [ ] **Step 1: Write the script**

```js
// directus/scripts/import.mjs
// Loads records and files into Directus from a directory of pp_*.json files.
// Idempotent: existing records (by id) and files (by folder + filename) are skipped.
//   node scripts/import.mjs [--from <dir>]
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { loadEnv, login } from './lib.mjs'
import { uploadFile } from './files.mjs'

const args = process.argv.slice(2)
const fromIndex = args.indexOf('--from')
const source = resolve(fromIndex >= 0 ? args[fromIndex + 1] : join(import.meta.dirname, '..', '..', 'frontend', 'app', 'data'))
const publicDir = existsSync(join(source, 'public')) ? join(source, 'public') : resolve(source, '..', '..', 'public')
const filesDir = join(source, 'files')

const session = await login(loadEnv())
const { api } = session
const read = (name) => JSON.parse(readFileSync(join(source, `${name}.json`), 'utf8'))
const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

const FILE_FIELDS = { pp_venues: ['image', 'hero_image'], pp_exhibitions: ['image', 'source_pdf'], pp_sponsors: ['logo'] }

// Dependency order. Entities first, then junctions.
const ORDER = ['pp_locations', 'pp_venues', 'pp_persons', 'pp_roles', 'pp_mm__persons_roles', 'pp_exhibitions',
  'pp_exhibition_participations', 'pp_exhibition_statements', 'pp_sponsors', 'pp_navigations', 'pp_navigation_items',
  'pp_mm__exhibitions_venues', 'pp_mm__exhibitions_sponsors', 'pp_mm__persons_venues', 'pp_mm__persons_sponsors',
  'pp_mm__locations_sponsors', 'pp_mm__sponsors_venues']

const uploaded = new Map() // path or id → file id
async function fileIdFor(value) {
  if (!value) return null
  if (uploaded.has(value)) return uploaded.get(value)
  let result
  if (value.startsWith('/')) {
    const localPath = join(publicDir, decodeURI(value))
    if (!existsSync(localPath)) throw new Error(`missing file for ${value}: ${localPath}`)
    result = await uploadFile(session, { localPath, folderPath: dirname(value).replace(/^\//, ''), title: value.split('/').pop() })
  } else if (isUuid(value)) {
    const match = existsSync(filesDir) ? readdirSync(filesDir).find((f) => f.startsWith(value)) : null
    if (!match) throw new Error(`file ${value} not found under ${filesDir}`)
    const index = JSON.parse(readFileSync(join(source, 'files.json'), 'utf8'))
    const meta = index.find((f) => f.id === value) ?? {}
    result = await uploadFile(session, { localPath: join(filesDir, match), folderPath: meta.folder ?? 'imported', title: meta.title, id: value })
  } else {
    throw new Error(`unrecognised file reference ${value}`)
  }
  console.log(`${result.created ? '+' : '='} file ${value} → ${result.id}`)
  uploaded.set(value, result.id)
  return result.id
}

async function exists(collection, record) {
  if (typeof record.id === 'string') {
    try { await api('GET', `/items/${collection}/${record.id}?fields=id`); return true } catch (e) { if (e.status === 403 || e.status === 404) return false; throw e }
  }
  // Junction rows: match on the two FK columns.
  const fks = Object.keys(record).filter((k) => k.endsWith('_id'))
  const q = fks.map((k) => `filter[${k}][_eq]=${record[k]}`).join('&')
  return (await api('GET', `/items/${collection}?${q}&limit=1&fields=id`)).length > 0
}

const totals = {}
for (const collection of ORDER) {
  const path = join(source, `${collection}.json`)
  if (!existsSync(path)) { console.log(`- ${collection} (no file)`); continue }
  const rows = read(collection)
  let created = 0
  for (const row of rows) {
    if (await exists(collection, row)) { console.log(`= ${collection} ${row.id}`); continue }
    const payload = { ...row }
    for (const f of FILE_FIELDS[collection] ?? []) payload[f] = await fileIdFor(row[f])
    if (typeof payload.id === 'number') delete payload.id // junction ids are autoincrement
    await api('POST', `/items/${collection}`, payload)
    console.log(`+ ${collection} ${row.id}`)
    created += 1
  }
  totals[collection] = `${created} created / ${rows.length} in source`
}
console.table(totals)
console.log('done')
```

- [ ] **Step 2: Run against the live instance, twice**

```bash
node scripts/import.mjs | tail -22
node scripts/import.mjs | grep -c '^+'
```
Expected: the table shows created = source for every collection (17, 36, 73, 2, 73, 13, 15, 0, 8, 2 existing menus → `0 created / 2`, 18 existing items → `0 / 18`, six junctions `0 / 0`), 45 `+ file` lines; second run prints `0`.

Watch for: a `POST /items/pp_navigations` skip — the two menus and 18 items were seeded on 2026-09-14 with Directus-generated UUIDs, while the JSON carries other UUIDs for them. **Ruling for this task:** the JSON navigation ids are the truth (the frontend was verified against them). Before importing, delete the seeded menus so they are re-created with the JSON ids: `DELETE /items/pp_navigation_items` (all) then `DELETE /items/pp_navigations` (all) through `api()` in a one-off Node one-liner, and record it in the report. `seed.mjs` will then report `=` for them by `key` on later runs.

- [ ] **Step 3: Prove public access to a record and a file**

```bash
curl -s "http://localhost:8077/items/pp_venues?filter[slug][_eq]=parkschloessl-spittal-drau&fields=title,image,translations.lede" | head -c 300; echo
ID=$(curl -s "http://localhost:8077/items/pp_venues?filter[slug][_eq]=parkschloessl-spittal-drau&fields=image" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data[0].image))")
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "http://localhost:8077/assets/$ID"
```
Expected: the venue with its `lede`; then `200 image/png` (or webp/jpeg).

- [ ] **Step 4: Commit**

```bash
git add directus/scripts/import.mjs
git commit -m "Import the archive records and files into Directus, keeping their ids

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Export for backup and restore

**Files:**
- Create: `directus/scripts/export.mjs`

**Interfaces:**
- `node scripts/export.mjs [--to <dir>]` — default `../_BU/directus-data`. Writes `pp_<name>.json` per collection (item shape, translations inline, file fields as ids), `files.json` (id, folder path, title, filename_download, type) and `files/<id>.<ext>` for every file in a `pp_`-referenced folder or the `branding` folder. `import.mjs --from <that dir>` restores it with the same ids.

- [ ] **Step 1: Write the script**

```js
// directus/scripts/export.mjs
// Backup: every pp_ collection and every referenced file into one directory.
//   node scripts/export.mjs [--to <dir>]
import { mkdirSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { loadEnv, login } from './lib.mjs'

const args = process.argv.slice(2)
const toIndex = args.indexOf('--to')
const target = resolve(toIndex >= 0 ? args[toIndex + 1] : join(import.meta.dirname, '..', '..', '_BU', 'directus-data'))
mkdirSync(join(target, 'files'), { recursive: true })

const { api, base, token } = await login(loadEnv())
const collections = (await api('GET', '/collections')).map((c) => c.collection)
  .filter((n) => n.startsWith('pp_') && n !== 'pp_meta' && n !== 'pp_archive' && !n.startsWith('pp_translations__'))

const FILE_FIELDS = { pp_venues: ['image', 'hero_image'], pp_exhibitions: ['image', 'source_pdf'], pp_sponsors: ['logo'] }
const fileIds = new Set()
const counts = {}
for (const c of collections) {
  const fields = await api('GET', `/fields/${c}`)
  const hasTranslations = fields.some((f) => f.field === 'translations')
  const rows = await api('GET', `/items/${c}?limit=-1&sort=sort&fields=*${hasTranslations ? ',translations.*' : ''}`)
  for (const row of rows) {
    if (hasTranslations) row.translations = row.translations.map(({ id, [`${c.replace(/^pp_/, '')}_id`]: _h, ...rest }) => rest)
    for (const k of ['user_created', 'user_updated', 'date_created', 'date_updated']) delete row[k]
    for (const f of FILE_FIELDS[c] ?? []) if (row[f]) fileIds.add(row[f])
  }
  writeFileSync(join(target, `${c}.json`), JSON.stringify(rows, null, 2) + '\n')
  counts[c] = rows.length
}

// Branding files too, so a restore can re-run apply-settings without the frontend checkout.
const brandingFolder = (await api('GET', '/folders?filter[name][_eq]=branding&limit=1&fields=id'))[0]?.id
if (brandingFolder) for (const f of await api('GET', `/files?filter[folder][_eq]=${brandingFolder}&limit=-1&fields=id`)) fileIds.add(f.id)

const folderPath = new Map()
const folders = await api('GET', '/folders?limit=-1&fields=id,name,parent')
const pathOf = (id) => { if (!id) return ''; if (folderPath.has(id)) return folderPath.get(id); const f = folders.find((x) => x.id === id); const p = f ? [pathOf(f.parent), f.name].filter(Boolean).join('/') : ''; folderPath.set(id, p); return p }

const index = []
for (const id of fileIds) {
  const meta = await api('GET', `/files/${id}?fields=id,title,filename_download,type,folder`)
  const res = await fetch(`${base}/assets/${id}?download`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`download ${id}: ${res.status}`)
  const ext = extname(meta.filename_download) || ''
  writeFileSync(join(target, 'files', `${id}${ext}`), Buffer.from(await res.arrayBuffer()))
  index.push({ id, folder: pathOf(meta.folder), title: meta.title, filename_download: meta.filename_download, type: meta.type })
}
writeFileSync(join(target, 'files.json'), JSON.stringify(index, null, 2) + '\n')
console.table(counts)
console.log(`${index.length} files → ${target}`)
```

- [ ] **Step 2: Export, then prove the export is a valid restore source**

```bash
node scripts/export.mjs | tail -20
node scripts/import.mjs --from ../_BU/directus-data | grep -c '^+'
ls ../_BU/directus-data | head; ls ../_BU/directus-data/files | wc -l
```
Expected: counts 17/36/73/2/73/13/15/0/8/2/18 and six `0`; `47 files → …` (45 + 2 branding); the import from the export prints `0` new (every record and file already exists); 47 files on disk.

Note `import.mjs` restores a file by id only when the file is missing in Directus; the `uploadFile` idempotency key is folder + filename, and `files.json` carries the folder, so the check is exact.

- [ ] **Step 3: Commit**

```bash
git add directus/scripts/export.mjs
git commit -m "Export the archive records and files for backup and restore

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: `setup.sh` replaces `reset.sh`; README

**Files:**
- Create: `directus/scripts/setup.sh`; Delete: `directus/scripts/reset.sh`
- Modify: `directus/README.md`

- [ ] **Step 1: Write `setup.sh`**

```bash
#!/usr/bin/env bash
# The one entry point. Reports what exists, asks before each step, never deletes content.
#   bash scripts/setup.sh                # step by step, with questions
#   bash scripts/setup.sh --yes          # every step, no questions
#   bash scripts/setup.sh --status       # report only
#   bash scripts/setup.sh --from <dir>   # also import content from <dir> (an export, or frontend/app/data)
#   bash scripts/setup.sh --reset-permissions   # delete and recreate the public read rules (configuration, not content)
set -euo pipefail
cd "$(dirname "$0")/.."

YES=false; STATUS=false; FROM=""; RESET_PERMS=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) YES=true ;;
    --status) STATUS=true ;;
    --from) FROM="$2"; shift ;;
    --reset-permissions) RESET_PERMS=true ;;
    *) echo "unknown option $1"; exit 1 ;;
  esac
  shift
done

[[ -f .env ]] || { echo "directus/.env is missing. cp .env.example .env and fill in the values."; exit 1; }

ask() { # ask "question" → 0 = yes
  $STATUS && return 1
  $YES && return 0
  read -r -p "$1 [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]]
}

health() { curl -fsS -o /dev/null http://localhost:8077/server/health; }

# 1. Directus
if health; then
  echo "Directus: running on http://localhost:8077"
else
  echo "Directus: not running$( [[ -f database/data.db ]] && echo ' (database exists)' || echo ' (no database yet: first start creates it from .env)')"
  if ask "Start it with docker compose?"; then
    docker compose up -d
    for _ in $(seq 1 60); do health && break; sleep 2; done
    health || { echo "Directus did not come up"; exit 1; }
    echo "Directus: running"
  else
    exit 0
  fi
fi

# 2. Schema
echo; echo "Schema:"; node scripts/check-conventions.mjs 2>/dev/null | tail -1 || echo "  conventions check failed or collections missing"
node -e "
import('./scripts/build.mjs').then(async ({ buildAll }) => {
  const { loadEnv, login } = await import('./scripts/lib.mjs')
  const { api } = await login(loadEnv())
  const live = new Set((await api('GET', '/collections')).map((c) => c.collection))
  const want = buildAll().collections.map((c) => c.collection)
  const missing = want.filter((n) => !live.has(n))
  console.log('  ' + (want.length - missing.length) + ' of ' + want.length + ' collections exist' + (missing.length ? ', missing: ' + missing.join(', ') : ''))
  process.exit(missing.length ? 10 : 0)
})" || { [[ $? -eq 10 ]] && ask "Add the missing collections?" && node scripts/create-schema.mjs; }

# 3. Seeds
echo; echo "Seeds:"; node scripts/seed.mjs --status 2>/dev/null || true
ask "Add missing languages, roles and menus?" && node scripts/seed.mjs

# 4. Permissions
echo; echo "Permissions:"
node --input-type=module -e "
import { loadEnv, login } from './scripts/lib.mjs'
const { api } = await login(loadEnv())
const p = (await api('GET', '/policies?filter[name][_eq]=\$t:public_label&fields=id'))[0]?.id
const rules = await api('GET', '/permissions?filter[policy][_eq]=' + p + '&filter[action][_eq]=read&limit=-1&fields=collection')
console.log('  ' + rules.length + ' public read rules')"
if $RESET_PERMS; then ask "Delete and recreate the public read rules?" && node scripts/permissions.mjs --reset
else ask "Add missing public read rules?" && node scripts/permissions.mjs; fi

# 5. Settings
echo; echo "Settings:"
curl -s http://localhost:8077/server/info | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const p=JSON.parse(d).data.project;console.log('  name: '+p.project_name+' · colour: '+p.project_color+' · logo: '+(p.project_logo?'set':'missing'))})"
ask "Apply project settings and branding?" && node scripts/apply-settings.mjs

# 6. Content
echo; echo "Content:"
node --input-type=module -e "
import { loadEnv, login } from './scripts/lib.mjs'
const { api } = await login(loadEnv())
for (const c of ['pp_locations','pp_venues','pp_persons','pp_exhibitions','pp_sponsors','pp_navigation_items']) {
  const n = (await api('GET', '/items/' + c + '?aggregate[count]=id'))[0].count.id
  console.log('  ' + c + ': ' + n)
}"
if [[ -n "$FROM" ]]; then ask "Import content from $FROM?" && node scripts/import.mjs --from "$FROM"; fi

echo; echo "setup finished"
```

`seed.mjs --status`: add to `seed.mjs` a `--status` flag that only counts languages, roles, navigations and items and prints them, then exits without creating anything.

- [ ] **Step 2: Run it**

```bash
bash scripts/setup.sh --status
bash scripts/setup.sh --yes | tail -12
git rm -q scripts/reset.sh
```
Expected: `--status` reports running, 26 of 26, seeds present, 26 public read rules, logo set, record counts 17/36/73/13/8/18 and finishes without changing anything; `--yes` prints only `=` lines and `setup finished`.

- [ ] **Step 3: README**

Replace the "Schema scripts" section of `directus/README.md` with:

```markdown
## Scripts

`bash scripts/setup.sh` is the entry point on any machine. It reports what exists, asks before each step and never deletes content:

```bash
bash scripts/setup.sh                 # step by step
bash scripts/setup.sh --yes           # all steps, no questions
bash scripts/setup.sh --status        # report only
bash scripts/setup.sh --from <dir>    # plus content import
```

Single scripts, all safe to run twice:

```bash
node --test scripts/*.test.mjs        # unit tests for naming and the builder
node scripts/create-schema.mjs        # add missing collections, fields, relations
node scripts/seed.mjs                 # languages, roles, menus
node scripts/permissions.mjs          # public read rules (--reset recreates them)
node scripts/apply-settings.mjs       # name, colour, logo, login seal
node scripts/check-conventions.mjs    # assert the live schema follows the rules
node scripts/export.mjs               # backup records + files to ../_BU/directus-data
node scripts/import.mjs --from <dir>  # restore, or first load from ../frontend/app/data
node scripts/snapshot.mjs             # export schema/snapshot.yaml
```

**Schema changes are additive.** Edit `scripts/schema.mjs`, run `create-schema.mjs`; it adds what is missing and touches nothing else. Removing or renaming a field: do it in the admin app, then `snapshot.mjs`. There is no reset; content is never wiped by a script.

**Backup before anything risky:** `node scripts/export.mjs`. The `_BU/` folder is not in git.

**CORS:** `.env` allows `http://localhost:4991`. On a remote host add the site's domain to `CORS_ORIGIN`.
```

- [ ] **Step 4: Commit**

```bash
git add directus/scripts/setup.sh directus/scripts/seed.mjs directus/README.md
git commit -m "Replace the reset script with a step-by-step setup that never deletes content

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
(`git rm scripts/reset.sh` from Step 2 is already staged.)

---

### Task 6: Frontend client and loader, with tests

**Files:**
- Modify: `frontend/nuxt.config.ts`; Create: `frontend/.env.example`
- Create: `frontend/app/utils/directusClient.ts`, `frontend/app/utils/loadArchive.ts`
- Modify: `frontend/app/types/content.ts` (add `ArchiveSnapshot`)
- Create: `frontend/test/unit/loadArchive.spec.ts`

**Interfaces:**
- `createArchiveClient(baseUrl: string): ArchiveClient` where `ArchiveClient = { baseUrl: string; items<T>(collection: string, query?: Record<string, string>): Promise<T[]> }`.
- `loadArchive(client: ArchiveClient): Promise<ArchiveSnapshot>`.
- `ArchiveSnapshot` = `{ locations, venues, persons, roles, personRoles, exhibitions, participations, statements, sponsors, navigations, navigationItems, exhibitionsVenues, exhibitionsSponsors, personsVenues, personsSponsors, locationsSponsors, sponsorsVenues }` with the existing record types (junction rows typed `{ id: number; [k: string]: string | number }`).

- [ ] **Step 1: Config and env**

In `nuxt.config.ts` add at the top level of `defineNuxtConfig`:

```ts
  runtimeConfig: {
    public: {
      directusUrl: 'http://localhost:8077'
    }
  },
```

Create `frontend/.env.example`:

```
# Directus the site reads from. Local today; the remote host later.
NUXT_PUBLIC_DIRECTUS_URL=http://localhost:8077
# Static admin token, used only by scripts (check:*, tour:publish). Never shipped to the browser.
DIRECTUS_TOKEN=
```
`.env` is already git-ignored (`.env.*` with the two example negations); add `!.env.example` to `.gitignore` if the pattern would ignore it (`git check-ignore .env.example` must print nothing).

- [ ] **Step 2: Add `ArchiveSnapshot` to `content.ts`**

```ts
/** One junction row: integer id plus the two FK columns named <parent>_id and a sort. */
export interface JunctionRow {
  id: number
  sort: number
  [column: string]: string | number
}

/** Everything the site reads, fetched once from Directus in the JSON item shape. */
export interface ArchiveSnapshot {
  locations: LocationRecord[]
  venues: VenueRecord[]
  persons: PersonRecord[]
  roles: RoleRecord[]
  personRoles: PersonRoleLink[]
  exhibitions: ExhibitionRecord[]
  participations: ParticipationRecord[]
  statements: ExhibitionStatement[]
  sponsors: SponsorRecord[]
  navigations: NavigationRecord[]
  navigationItems: NavigationItemRecord[]
  exhibitionsVenues: JunctionRow[]
  exhibitionsSponsors: JunctionRow[]
  personsVenues: JunctionRow[]
  personsSponsors: JunctionRow[]
  locationsSponsors: JunctionRow[]
  sponsorsVenues: JunctionRow[]
}
```

- [ ] **Step 3: Write the failing test**

```ts
// test/unit/loadArchive.spec.ts
import { describe, expect, it } from 'vitest'
import { loadArchive } from '~/utils/loadArchive'
import type { ArchiveClient } from '~/utils/directusClient'

const fake = (tables: Record<string, unknown[]>, calls: string[] = []): ArchiveClient => ({
  baseUrl: 'http://cms.test',
  async items(collection, query) {
    calls.push(`${collection}?${new URLSearchParams(query ?? {}).toString()}`)
    if (!(collection in tables)) throw new Error(`${collection}: 404 not found`)
    return tables[collection] as never[]
  }
})

const minimal = {
  pp_locations: [], pp_venues: [{ id: 'v1', slug: 'v', image: 'f1', hero_image: null, translations: [] }],
  pp_persons: [], pp_roles: [], pp_mm__persons_roles: [], pp_exhibitions: [{ id: 'e1', image: 'f2', source_pdf: 'f3', tour: '/media/tours/x/', translations: [] }],
  pp_exhibition_participations: [], pp_exhibition_statements: [], pp_sponsors: [{ id: 's1', logo: null }],
  pp_navigations: [], pp_navigation_items: [], pp_mm__exhibitions_venues: [], pp_mm__exhibitions_sponsors: [],
  pp_mm__persons_venues: [], pp_mm__persons_sponsors: [], pp_mm__locations_sponsors: [], pp_mm__sponsors_venues: []
}

describe('loadArchive', () => {
  it('fetches all 17 collections with translations where they exist and no limit', async () => {
    const calls: string[] = []
    await loadArchive(fake(minimal, calls))
    expect(calls).toHaveLength(17)
    expect(calls).toContain('pp_venues?fields=%2A%2Ctranslations.%2A&limit=-1&sort=sort')
    expect(calls).toContain('pp_mm__persons_roles?fields=%2A&limit=-1&sort=sort')
    expect(calls).toContain('pp_persons?fields=%2A&limit=-1&sort=sort')
  })

  it('turns file ids into asset URLs and leaves nulls and tour paths alone', async () => {
    const snapshot = await loadArchive(fake(minimal))
    expect(snapshot.venues[0].image).toBe('http://cms.test/assets/f1')
    expect(snapshot.venues[0].hero_image).toBeNull()
    expect(snapshot.exhibitions[0].source_pdf).toBe('http://cms.test/assets/f3')
    expect(snapshot.exhibitions[0].tour).toBe('/media/tours/x/')
    expect(snapshot.sponsors[0].logo).toBeNull()
  })

  it('names the collection when a request fails', async () => {
    const { pp_roles: _drop, ...broken } = minimal
    await expect(loadArchive(fake(broken))).rejects.toThrow(/pp_roles: 404/)
  })
})
```

Run: `pnpm test -- loadArchive` → FAIL, module not found.

- [ ] **Step 4: Write the client and the loader**

```ts
// app/utils/directusClient.ts
export interface ArchiveClient {
  baseUrl: string
  items<T>(collection: string, query?: Record<string, string>): Promise<T[]>
}

/** Minimal read-only Directus client: GET /items/<collection>. No SDK, no auth (public read). */
export const createArchiveClient = (baseUrl: string): ArchiveClient => {
  const root = baseUrl.replace(/\/$/, '')
  return {
    baseUrl: root,
    async items<T>(collection: string, query: Record<string, string> = {}) {
      const url = `${root}/items/${collection}?${new URLSearchParams(query).toString()}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${collection}: ${response.status} ${response.statusText}`)
      const body = (await response.json()) as { data: T[] }
      return body.data
    }
  }
}
```

```ts
// app/utils/loadArchive.ts
import type { ArchiveSnapshot } from '~/types/content'
import type { ArchiveClient } from '~/utils/directusClient'

/** Collections with a translations table get `translations.*`; the rest only `*`. */
const TRANSLATED = new Set(['pp_locations', 'pp_venues', 'pp_roles', 'pp_exhibitions', 'pp_exhibition_statements', 'pp_sponsors', 'pp_navigation_items'])

/** File fields per collection: Directus returns file ids; the site needs URLs. */
const FILE_FIELDS: Record<string, string[]> = {
  pp_venues: ['image', 'hero_image'],
  pp_exhibitions: ['image', 'source_pdf'],
  pp_sponsors: ['logo']
}

const COLLECTIONS: Record<keyof ArchiveSnapshot, string> = {
  locations: 'pp_locations',
  venues: 'pp_venues',
  persons: 'pp_persons',
  roles: 'pp_roles',
  personRoles: 'pp_mm__persons_roles',
  exhibitions: 'pp_exhibitions',
  participations: 'pp_exhibition_participations',
  statements: 'pp_exhibition_statements',
  sponsors: 'pp_sponsors',
  navigations: 'pp_navigations',
  navigationItems: 'pp_navigation_items',
  exhibitionsVenues: 'pp_mm__exhibitions_venues',
  exhibitionsSponsors: 'pp_mm__exhibitions_sponsors',
  personsVenues: 'pp_mm__persons_venues',
  personsSponsors: 'pp_mm__persons_sponsors',
  locationsSponsors: 'pp_mm__locations_sponsors',
  sponsorsVenues: 'pp_mm__sponsors_venues'
}

const assetUrl = (baseUrl: string, id: unknown) => (typeof id === 'string' && id ? `${baseUrl}/assets/${id}` : null)

/** Fetch every collection the site reads, in the JSON item shape, with file ids turned into asset URLs. */
export const loadArchive = async (client: ArchiveClient): Promise<ArchiveSnapshot> => {
  const entries = await Promise.all(Object.entries(COLLECTIONS).map(async ([key, collection]) => {
    const fields = TRANSLATED.has(collection) ? '*,translations.*' : '*'
    let rows: Record<string, unknown>[]
    try {
      rows = await client.items<Record<string, unknown>>(collection, { fields, limit: '-1', sort: 'sort' })
    } catch (error) {
      throw new Error(`${collection}: ${(error as Error).message.replace(new RegExp(`^${collection}: `), '')}`)
    }
    for (const field of FILE_FIELDS[collection] ?? []) {
      for (const row of rows) row[field] = assetUrl(client.baseUrl, row[field])
    }
    return [key, rows] as const
  }))
  return Object.fromEntries(entries) as unknown as ArchiveSnapshot
}
```

Run: `pnpm test -- loadArchive` → PASS. Then `pnpm test` and `pnpm check:types` → green (nothing uses the new code yet).

- [ ] **Step 5: Commit**

```bash
git add nuxt.config.ts .env.example .gitignore app/utils/directusClient.ts app/utils/loadArchive.ts app/types/content.ts test/unit/loadArchive.spec.ts
git commit -m "Add a read-only Directus client and the archive loader

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: The site reads from Directus

**Files:**
- Create: `frontend/app/composables/useArchiveSource.ts`
- Modify: `frontend/app/app.vue`, `frontend/app/composables/useArchiveData.ts`, `frontend/app/composables/useSiteNavigation.ts`

**Interfaces:**
- `useArchiveSource()` → `Promise<{ archive: Ref<ArchiveSnapshot | null>; error: Ref<Error | null>; refresh: () => Promise<void> }>`; stores the snapshot in `useState<ArchiveSnapshot | null>('archive', () => null)`.
- `useArchiveData()` and `useSiteNavigation()` keep their return shapes and read `useState('archive')`; they throw `new Error('archive not loaded: call useArchiveSource() in app.vue first')` if the state is null.

- [ ] **Step 1: The source composable**

```ts
// app/composables/useArchiveSource.ts
import type { ArchiveSnapshot } from '~/types/content'
import { createArchiveClient } from '~/utils/directusClient'
import { loadArchive } from '~/utils/loadArchive'

/**
 * Loads the whole archive from Directus once per page load and shares it through
 * useState('archive'). Called (awaited) in app.vue before any page renders, so
 * every page and composable can read the data synchronously, as it did with JSON.
 */
export async function useArchiveSource() {
  const config = useRuntimeConfig()
  const archive = useState<ArchiveSnapshot | null>('archive', () => null)
  const client = createArchiveClient(config.public.directusUrl)

  const { error, refresh } = await useAsyncData('archive', async () => {
    const snapshot = await loadArchive(client)
    archive.value = snapshot
    return snapshot
  })

  return { archive, error, refresh, directusUrl: client.baseUrl }
}

export const useArchive = (): ArchiveSnapshot => {
  const archive = useState<ArchiveSnapshot | null>('archive')
  if (!archive.value) throw new Error('archive not loaded: call useArchiveSource() in app.vue first')
  return archive.value
}
```

- [ ] **Step 2: `app.vue`**

Replace the script and template with:

```vue
<script setup lang="ts">
const { localeProperties, t } = useI18n()
const route = useRoute()
const { trackPageView } = useMatomo()

const { archive, error, directusUrl } = await useArchiveSource()
if (error.value) {
  throw createError({ statusCode: 503, statusMessage: t('site.archiveUnavailable', { url: directusUrl }), fatal: true })
}

watch(() => route.fullPath, async (nextPath, previousPath) => {
  if (!previousPath || nextPath === previousPath) return
  await nextTick()
  trackPageView()
})

useHead(() => ({
  htmlAttrs: {
    lang: localeProperties.value.language ?? localeProperties.value.code,
    dir: localeProperties.value.dir ?? 'ltr'
  }
}))
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage v-if="archive" />
  <p v-else class="[ archive-loading ] m-0 grid min-h-dvh place-items-center font-display text-lg text-archive-muted">{{ $t('site.archiveLoading') }}</p>
  <ArchiveCookieNotice />
</template>
```

Add to `i18n/locales/en.json` under `site`: `"archiveLoading": "Loading the archive…"`, `"archiveUnavailable": "The archive could not be loaded from {url}."`; to `de.json`: `"archiveLoading": "Das Archiv wird geladen …"`, `"archiveUnavailable": "Das Archiv konnte nicht von {url} geladen werden."`.

Check `pnpm check:tailwind` after adding the class string: `min-h-dvh`, `place-items-center`, `text-lg`, `text-archive-muted` and `font-display` are canonical; if the check flags anything, use the nearest named step from `main.css`.

- [ ] **Step 3: Switch the two composables**

`useArchiveData.ts`: delete the nine JSON imports; at the top of the function add `const archive = useArchive()`; replace each `locations as LocationRecord[]` etc. with `archive.locations`, `archive.venues`, `archive.persons`, `archive.roles`, `archive.personRoles`, `archive.exhibitions`, `archive.participations`, `archive.statements`, `archive.sponsors` (the type casts go away).

`useSiteNavigation.ts`: delete the two JSON imports; inside the computed use `const archive = useArchive()` and pass `archive.navigations`, `archive.navigationItems`.

- [ ] **Step 4: Verify with Directus running**

```bash
pnpm check:types && pnpm test
pnpm dev &   # or use the already running dev server on :4991
```
Open `http://localhost:4991/`, `/en/`, `/artists/`, `/venues/parkschloessl-spittal-drau/`, `/exhibitions/all-the-magic/`. In the browser network tab: 17 requests to `localhost:8077/items/…` on load, images from `localhost:8077/assets/…`, no request to `/media/images/`. Pages look as before. Then stop Directus (`docker compose stop` in `directus/`), reload: the error page shows the URL; start it again (`docker compose start`).

If the visual pass cannot use a browser, script it the way the QA of 2026-09-14 did (headless Chrome over CDP; see `.superpowers/sdd/2026-09-14-frontend-pp-rename-and-navigation/qa/` for what was captured) and additionally assert with `Runtime.evaluate` that `performance.getEntriesByType('resource').some(r => r.name.includes(':8077/assets/'))` is true and `.some(r => r.name.includes('/media/images/'))` is false.

Run the check scripts too: they still read the JSON files (unchanged until Task 8) and stay green.

- [ ] **Step 5: Commit**

```bash
git add app/composables/useArchiveSource.ts app/app.vue app/composables/useArchiveData.ts app/composables/useSiteNavigation.ts i18n
git commit -m "Read the archive from Directus at app start instead of from JSON

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Check scripts and the tour script read from Directus

**Files:**
- Create: `frontend/scripts/lib/archive-source.mjs`
- Modify: `frontend/scripts/check-data-integrity.mjs`, `check-directory-routes.mjs`, `check-i18n-privacy.mjs`, `check-mobile-density.mjs`, `check-public-namespace.mjs`, `publish-tour.mjs`
- Modify: `frontend/package.json` (`check:data` unchanged name)

**Interfaces:**
- `archive-source.mjs` exports `loadArchiveFromDirectus()` → the same 17-key snapshot as the frontend loader, plus `directusUrl`, `directusToken` (from `frontend/.env`, keys `DIRECTUS_URL`, `NUXT_PUBLIC_DIRECTUS_URL`, `DIRECTUS_TOKEN`), and `readEnv()`. File fields come back as URLs like in the frontend. It throws `Directus not reachable at <url>: <reason>` when the first request fails.

- [ ] **Step 1: Write the shared source**

```js
// scripts/lib/archive-source.mjs
// The check scripts' view of the archive: fetched from Directus, same shape as the site's loader.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..', '..')

export const readEnv = () => {
  const env = { ...process.env }
  const file = resolve(projectRoot, '.env')
  if (existsSync(file)) for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in env)) env[m[1]] = m[2]
  }
  return env
}

const env = readEnv()
export const directusUrl = (env.DIRECTUS_URL || env.NUXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8077').replace(/\/$/, '')
export const directusToken = env.DIRECTUS_TOKEN || ''

const TRANSLATED = new Set(['pp_locations', 'pp_venues', 'pp_roles', 'pp_exhibitions', 'pp_exhibition_statements', 'pp_sponsors', 'pp_navigation_items'])
const FILE_FIELDS = { pp_venues: ['image', 'hero_image'], pp_exhibitions: ['image', 'source_pdf'], pp_sponsors: ['logo'] }
export const COLLECTIONS = {
  locations: 'pp_locations', venues: 'pp_venues', persons: 'pp_persons', roles: 'pp_roles', personRoles: 'pp_mm__persons_roles',
  exhibitions: 'pp_exhibitions', participations: 'pp_exhibition_participations', statements: 'pp_exhibition_statements',
  sponsors: 'pp_sponsors', navigations: 'pp_navigations', navigationItems: 'pp_navigation_items',
  exhibitionsVenues: 'pp_mm__exhibitions_venues', exhibitionsSponsors: 'pp_mm__exhibitions_sponsors', personsVenues: 'pp_mm__persons_venues',
  personsSponsors: 'pp_mm__persons_sponsors', locationsSponsors: 'pp_mm__locations_sponsors', sponsorsVenues: 'pp_mm__sponsors_venues'
}

export async function directusGet(path, { token = '' } = {}) {
  let response
  try {
    response = await fetch(`${directusUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch (error) {
    throw new Error(`Directus not reachable at ${directusUrl}: ${error.message}`)
  }
  if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`)
  return (await response.json()).data
}

export async function loadArchiveFromDirectus() {
  const snapshot = {}
  for (const [key, collection] of Object.entries(COLLECTIONS)) {
    const fields = TRANSLATED.has(collection) ? '*,translations.*' : '*'
    const rows = await directusGet(`/items/${collection}?fields=${encodeURIComponent(fields)}&limit=-1&sort=sort`)
    for (const field of FILE_FIELDS[collection] ?? []) for (const row of rows) row[field] = row[field] ? `${directusUrl}/assets/${row[field]}` : null
    snapshot[key] = rows
  }
  return snapshot
}
```

- [ ] **Step 2: Switch each script**

- `check-data-integrity.mjs`: replace the `readJson`/`data()` block with `const { loadArchiveFromDirectus, directusGet } = await import('./lib/archive-source.mjs')` and `const a = await loadArchiveFromDirectus()`, then `const locations = a.locations` etc. and `const junctions = [a.exhibitionsVenues, a.exhibitionsSponsors, a.personsVenues, a.personsSponsors, a.locationsSponsors, a.sponsorsVenues]`. Keep every assertion. Add: `['every file field points at a file Directus serves', …]` — collect every `image`/`hero_image`/`source_pdf`/`logo` URL, take the id after `/assets/`, and `HEAD`-request `${directusUrl}/assets/<id>` (public, no token); all must be 200. Wrap the whole script so that a `Directus not reachable` error prints that one line and exits 1. Update the final line to `… across 17 collections from ${directusUrl}.`
- `check-directory-routes.mjs`: replace the three `readJson('app/data/…')` with the snapshot's `locations`, `venues`, `exhibitions`; `navigationItems`/`navigations` likewise; the `image` assertion (`gallery.image` truthy) stays and now sees a URL.
- `check-i18n-privacy.mjs`: the loop over `['pp_exhibitions', 'pp_venues', 'pp_locations']` reads `a.exhibitions`, `a.venues`, `a.locations`; the navigation assertions read `a.navigations`/`a.navigationItems`.
- `check-mobile-density.mjs`: `navigationItems`/`navigations` from the snapshot instead of `readProjectFile('app/data/…')`.
- `check-public-namespace.mjs`: delete the `dataDir`/`dataFiles`/`ASSET_FIELDS` image checks; keep the root-namespace checks; the tour-folder check reads `a.exhibitions` and asserts every non-null `tour` resolves to `public<tour>tour.json`. Label: `every tour path in Directus resolves under public/ (<n> checked)`.
- `publish-tour.mjs`: `loadCatalogue()` reads `exhibitions`, `participations`, `persons`, `roles` from the snapshot; the "already linked" and `--exhibition` messages say "in Directus" instead of naming the JSON file; linking becomes `await directusGet(...)`-style `PATCH` — add to `archive-source.mjs`:

```js
export async function directusPatch(path, body, token) {
  if (!token) throw new Error('DIRECTUS_TOKEN is not set in frontend/.env; the tour link needs write access')
  const response = await fetch(`${directusUrl}${path}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`)
  return (await response.json()).data
}
```
and in `publish-tour.mjs` replace the `writeFile(exhibitionsFile, …)` block with `await directusPatch(\`/items/pp_exhibitions/${record.id}\`, { tour: tourPath }, directusToken)`; the dry-run line says `Would set "tour" on "<slug>" in Directus.`; the closing hint drops "Commit app/data/pp_exhibitions.json" and says the tour folder must still be deployed.

Put the admin token into `frontend/.env` for local use: `DIRECTUS_TOKEN=` the value of `ADMIN_TOKEN` from `directus/.env` (copy it by hand; never print it).

- [ ] **Step 3: Run**

```bash
pnpm check:data && pnpm check:directories && pnpm check:i18n && pnpm check:mobile && pnpm check:public
pnpm tour:publish 2026-06-01-parkschloessl-spittal-adi-schmoelzer --dry-run | tail -5
cd ../directus && docker compose stop && cd ../frontend && pnpm check:data; cd ../directus && docker compose start && cd ../frontend
```
Expected: five green checks; the dry run reports the tour as already linked in Directus and would replace the copy; with Directus stopped `check:data` prints `Directus not reachable at http://localhost:8077: …` and exits 1; after start it is green again. Then the full list: `pnpm check:types && pnpm test && pnpm check:tailwind && pnpm check:artists && pnpm check:venues && pnpm check:links && pnpm check:preloader` green.

- [ ] **Step 4: Commit**

```bash
git add scripts package.json
git commit -m "Point the check scripts and the tour script at Directus

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: QA and docs

**Files:**
- Modify: `frontend/AGENTS.md`, `frontend/README.md`, root `README.md`, `_Plans/exhibitions-plan.md` (Phase 4 tracker)

- [ ] **Step 1: QA walk on the Directus-backed site**

Same walk as 2026-09-14 (landing de/en desktop, footer, cookie notice, mobile menu, footer drawer, artists, venue, exhibition), with Directus running, plus: edit the Parkschlössl `lede` in the admin app (append " (test)"), reload the venue page, see the change, then revert the edit in the admin app and reload again. Screenshots under `.superpowers/sdd/2026-09-15-directus-runtime-source/qa/`. Use the headless-Chrome script if the shared browser is locked.

- [ ] **Step 2: Docs**

`frontend/AGENTS.md`: replace the data paragraph's first sentence with: "The site reads its content from Directus at app start (`useArchiveSource()` in `app.vue`, URL from `NUXT_PUBLIC_DIRECTUS_URL`, default `http://localhost:8077`), into one shared snapshot in the JSON item shape; `app/data/` no longer exists. Run `bash ../directus/scripts/setup.sh --status` if a page shows the archive-unavailable error." Keep the rest (joins in the composables, translations rule) and replace every remaining `pp_*.json` mention with the collection name. Under 360° tours, say the link is written to Directus by `pnpm tour:publish` (needs `DIRECTUS_TOKEN` in `.env`).

`frontend/README.md`: Requirements gain "a running Directus (see `../directus/README.md`)"; the Data Source section describes the runtime fetch; the "prototype does not connect to Directus" sentence goes.

Root `README.md`: the "Where we are" paragraph says the site reads from the local Directus; next step is hosting Directus.

`_Plans/exhibitions-plan.md` Phase 4: tick "Introduce Directus SDK data adapter…" as "[x] Frontend reads from Directus at runtime (`useArchiveSource`), no SDK dependency — 2026-09-15", and "Test data query payload outputs…" as "[x] covered by `check:data` against the live instance — 2026-09-15"; add "[x] Content imported: 17/36/73/13/8 records, 45 files — 2026-09-15".

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md README.md ../README.md ../_Plans/exhibitions-plan.md
git commit -m "Document the Directus-backed frontend

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: The JSON files and record images leave the repo

**Files:**
- Move: `frontend/app/data/` → `_BU/frontend-app-data-2026-09-15/`; record images → `_BU/frontend-public-media-images-2026-09-15/`
- Modify: `frontend/scripts/check-public-namespace.mjs` if it still references `app/data`; `directus/scripts/import.mjs` default `--from`.

- [ ] **Step 1: Which images go**

Only files that records referenced and code does not. From `frontend/`:

```bash
node -e "
const fs=require('fs');const {execSync}=require('child_process');
const refs=new Set();const d=(n)=>require('./app/data/'+n+'.json');
for(const v of d('pp_venues')) for(const f of ['image','hero_image']) if(v[f]) refs.add(v[f]);
for(const e of d('pp_exhibitions')) for(const f of ['image','source_pdf']) if(e[f]) refs.add(e[f]);
for(const s of d('pp_sponsors')) if(s.logo) refs.add(s.logo);
const keep=[],go=[];
for(const r of refs){const hit=execSync('grep -rl --include=*.vue --include=*.ts --include=*.css --include=*.mjs '+JSON.stringify(r)+' app scripts || true').toString().trim(); (hit?keep:go).push(r)}
console.log('referenced by code, stay:',keep);console.log('record-only, move:',go.length);fs.writeFileSync('/tmp/record-only-assets.txt',go.join('\n')+'\n')"
```
Expected: a short "stay" list (landing hero art used by `index.vue`/`HeroKaleidoscope.vue`, if any) and the rest to move. Read the list before moving.

- [ ] **Step 2: Move and remove**

```bash
mkdir -p ../_BU/frontend-app-data-2026-09-15 ../_BU/frontend-public-media-images-2026-09-15
cp -R app/data/. ../_BU/frontend-app-data-2026-09-15/
git rm -r -q app/data
while read -r p; do mkdir -p "../_BU/frontend-public-media-images-2026-09-15$(dirname "$p")"; git mv -k "public$p" "../_BU/frontend-public-media-images-2026-09-15$p" 2>/dev/null || { cp "public$p" "../_BU/frontend-public-media-images-2026-09-15$p" && git rm -q "public$p"; }; done < /tmp/record-only-assets.txt
```
Then in `directus/scripts/import.mjs` change the default source to `join(import.meta.dirname, '..', '..', '_BU', 'directus-data')`, and in `directus/README.md` say the first load came from the frontend JSON on 2026-09-15 and later loads come from an export.

- [ ] **Step 3: Verify nothing references the removed files**

```bash
grep -rn "app/data\|~/data/" app scripts test | grep -v "_BU" ; echo "refs exit=$?"
pnpm check:types && pnpm test && pnpm check:data && pnpm check:i18n && pnpm check:directories && pnpm check:mobile && pnpm check:tailwind && pnpm check:artists && pnpm check:venues && pnpm check:links && pnpm check:public && pnpm check:preloader && pnpm build
```
Expected: the grep prints nothing (exit 1); everything green; the build succeeds. Reload the site: identical.

- [ ] **Step 4: Commit**

```bash
git add -A app public scripts ../directus/scripts/import.mjs ../directus/README.md
git commit -m "Move the JSON files and record images out of the repo; Directus is the source

The copies live in _BU/ (not tracked) as the 2026-09-15 backup.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review notes

- Spec coverage: import (T3), export (T4), permissions (T1), branding (T2), setup/no reset (T5), CORS note (T5 README), runtime config + client + loader (T6), app-start fetch + composables (T7), check scripts + tour (T8), QA + docs (T9), JSON and images to `_BU` (T10). Verification 1–7 map to T1–T4, T7–T10.
- Type consistency: `ArchiveClient`, `ArchiveSnapshot` (T6) are what T7 and T8 use; `useArchive()` (T7) is the synchronous accessor for the two composables; `archive-source.mjs` (T8) mirrors `loadArchive` key for key.
- Known coupling: `seed.mjs --status` (T5) is a small addition to an existing script; the navigation re-id in T3 is a one-off ruled in the task.
