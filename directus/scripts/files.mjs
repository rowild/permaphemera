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
