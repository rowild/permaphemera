// directus/scripts/stats-job-access.mjs
// The Directus user of the weekly Umami sums (plans/2026-11-11__umami-weekly-sums.md): a policy
// "Statistics job" (create + read on pp_stats_weekly, read on the record collections, no admin
// app), a role with it, and a user with a static token. The token is written only to the server
// file the job reads (/srv/sites/permaphemera.at/stats-weekly-data/directus.env, mode 600); it is
// never printed. Idempotent: an existing policy, role and user are kept; a token is only set when
// the server file is missing, or with --rotate.
//
//   DIRECTUS_ENV_FILE=.env.remote node scripts/stats-job-access.mjs [--rotate]
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { homedir } from 'node:os'
import { loadEnv, login } from './lib.mjs'

const NAME = 'Statistics job'
const HOST = process.env.HETZNER_HOST || 'rowild@138.199.205.241'
const KEY = process.env.HETZNER_KEY || `${homedir()}/.ssh/id_hetzner`
const DATA = '/srv/sites/permaphemera.at/stats-weekly-data'
const READ = ['pp_locations', 'pp_venues', 'pp_exhibitions', 'pp_persons', 'pp_organisations', 'pp_events', 'pp_news', 'pp_sponsors', 'pp_stats_weekly']

const { api } = await login(loadEnv())
const ssh = (command, input) => execFileSync('ssh', ['-i', KEY, '-o', 'BatchMode=yes', HOST, command], { input, encoding: 'utf8' })

let [policy] = await api('GET', `/policies?filter[name][_eq]=${encodeURIComponent(NAME)}&fields=id`)
if (!policy) {
  policy = await api('POST', '/policies', { name: NAME, icon: 'monitoring', description: 'Weekly Umami sums: writes pp_stats_weekly, reads the records it counts.', admin_access: false, app_access: false })
  console.log(`+ policy ${NAME}`)
}
const rules = await api('GET', `/permissions?filter[policy][_eq]=${policy.id}&limit=-1&fields=collection,action`)
const has = new Set(rules.map((r) => `${r.collection}:${r.action}`))
for (const [collection, action] of [...READ.map((c) => [c, 'read']), ['pp_stats_weekly', 'create']]) {
  if (has.has(`${collection}:${action}`)) continue
  await api('POST', '/permissions', { policy: policy.id, collection, action, fields: ['*'], permissions: {}, validation: {}, presets: null })
  console.log(`+ ${action} ${collection}`)
}

let [role] = await api('GET', `/roles?filter[name][_eq]=${encodeURIComponent(NAME)}&fields=id`)
if (!role) {
  role = await api('POST', '/roles', { name: NAME, icon: 'monitoring', description: 'Only for the weekly statistics job (no login).', policies: [{ policy: policy.id }] })
  console.log(`+ role ${NAME}`)
}

let [user] = await api('GET', `/users?filter[title][_eq]=stats-weekly&fields=id`)
if (!user) {
  user = await api('POST', '/users', { first_name: 'Statistics', last_name: 'job', title: 'stats-weekly', role: role.id, status: 'active' })
  console.log('+ user Statistics job')
}

const hasFile = ssh(`test -s ${DATA}/directus.env && echo yes || echo no`).trim() === 'yes'
if (hasFile && !process.argv.includes('--rotate')) {
  console.log(`= token: ${DATA}/directus.env exists (use --rotate for a new one)`)
} else {
  const token = randomBytes(32).toString('base64url')
  await api('PATCH', `/users/${user.id}`, { token })
  ssh(`umask 077 && mkdir -p ${DATA} && chmod 700 ${DATA} && cat > ${DATA}/directus.env && chmod 600 ${DATA}/directus.env`, `DIRECTUS_TOKEN=${token}\n`)
  console.log(`~ token set and written to ${DATA}/directus.env`)
}
