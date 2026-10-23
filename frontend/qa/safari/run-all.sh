#!/usr/bin/env bash
# The whole Safari review in one go, one run folder:
# static check → Playwright WebKit + Chromium → this Mac's Safari →
# iOS Simulators (one at a time) → summary.md + gallery.html.
#
#   pnpm qa:safari                      (live site)
#   QA_TARGET=http://localhost:3000 pnpm qa:safari   (a local `pnpm preview`)
#   QA_IOS=27 pnpm qa:safari            (only some iOS versions)
set -u
cd "$(dirname "$0")/../.."
export QA_RUN_ID="${QA_RUN_ID:-$(date +%Y-%m-%d-%H%M)-web}"

node qa/safari/server.mjs &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1.5

node qa/safari/audit/fetch.mjs && node qa/safari/audit/css.mjs > /dev/null && node qa/safari/audit/js.mjs > /dev/null
node qa/safari/drivers/webkit.mjs
node qa/safari/drivers/safari.mjs || echo "[run-all] Mac Safari skipped (see the message above)"
node qa/safari/drivers/simulator.mjs --ios "${QA_IOS:-27,26,18}" || echo "[run-all] Simulator skipped"
node qa/safari/report.mjs "$QA_RUN_ID"
