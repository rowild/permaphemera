// Lookups into MDN's browser-compat-data for the three Safari generations.
// (The same lookups as the tour viewer's kit, qa/safari/audit/bcd.mjs there.)
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
export const bcd = require('@mdn/browser-compat-data')

/** The generations under review. macOS and iOS ship the same WebKit per
 *  version; each target checks both and reports them apart when they differ. */
export const TARGETS = [
  { label: 'Safari 18', version: '18.0' },
  { label: 'Safari 26', version: '26.0' },
  { label: 'Safari 27', version: '27.0' },
]
const BROWSERS = ['safari', 'safari_ios']

const num = (v) => {
  if (v === true) return 0 // "supported, version unknown": treat as old
  if (typeof v !== 'string') return null
  const m = v.replace(/^[≤<]/, '').match(/^(\d+)(?:\.(\d+))?/)
  return m ? Number(m[1]) + Number(m[2] || 0) / 100 : null
}

export function getCompat(path) {
  let node = bcd
  for (const part of path.split('.')) {
    node = node?.[part]
    if (!node) return null
  }
  return node.__compat || null
}

/** 'yes' | 'partial' | 'flag' | 'no' | 'unknown' for one browser at one
 *  version, for the given vendor prefix ('' = unprefixed). */
function supportOne(compat, browser, version, prefix = '') {
  let statements = compat?.support?.[browser]
  if (statements == null || statements === 'mirror') return 'unknown'
  if (!Array.isArray(statements)) statements = [statements]
  const v = num(version)
  let best = 'no'
  for (const s of statements) {
    if ((s.prefix || '') !== prefix || s.alternative_name) continue
    const added = num(s.version_added)
    if (added == null || added > v) continue
    const removed = num(s.version_removed)
    if (removed != null && removed <= v) continue
    if (s.flags) {
      if (best === 'no') best = 'flag'
      continue
    }
    if (s.partial_implementation) {
      if (best !== 'yes') best = 'partial'
      continue
    }
    return 'yes'
  }
  return best
}

export const supportPair = (compat, version, prefix = '') => ({
  safari: supportOne(compat, 'safari', version, prefix),
  safari_ios: supportOne(compat, 'safari_ios', version, prefix),
})

export const MARK = { yes: 'yes', partial: 'partial', flag: 'flag only', no: '**NO**', unknown: '?', na: 'n/a' }

/** One table cell: a single word when Mac and iOS agree. */
export const cell = (pair) => (pair.safari === pair.safari_ios ? MARK[pair.safari] : `mac ${MARK[pair.safari]} · iOS ${MARK[pair.safari_ios]}`)

export function firstVersion(compat, prefix = '') {
  const out = {}
  for (const b of BROWSERS) {
    let st = compat?.support?.[b]
    if (!st) {
      out[b] = '?'
      continue
    }
    if (!Array.isArray(st)) st = [st]
    const s = st.find((x) => (x.prefix || '') === prefix && !x.alternative_name && !x.flags)
    out[b] = s ? String(s.version_added) : st.some((x) => x.flags) ? 'flag only' : 'never'
  }
  return out
}
