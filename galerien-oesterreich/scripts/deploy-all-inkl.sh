#!/usr/bin/env bash
set -euo pipefail

REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPOSITORY_ROOT"

DEPLOY_USER="${GVOE_DEPLOY_USER:-ssh-w00c8d25}"
DEPLOY_HOST="${GVOE_DEPLOY_HOST:-rowild.at}"
DEPLOY_REMOTE_DIR="${GVOE_DEPLOY_REMOTE_DIR:-/www/htdocs/w00c8d25/gvoe.rowild.at}"
DEPLOY_KEY="${GVOE_DEPLOY_KEY:-$HOME/.ssh/id_ed25519_rowild_openssh}"
LOCAL_DIR="${GVOE_DEPLOY_LOCAL_DIR:-dist}"
DRY_RUN="${GVOE_DEPLOY_DRY_RUN:-0}"
YES="${GVOE_DEPLOY_YES:-0}"
LFTP_SCRIPT=""
SFTP_CONNECT_PROGRAM=""

cleanup() {
  if [[ -n "$LFTP_SCRIPT" && -f "$LFTP_SCRIPT" ]]; then
    rm -f "$LFTP_SCRIPT"
  fi
}
trap cleanup EXIT

usage() {
  cat <<'USAGE'
Usage:
  scripts/deploy-all-inkl.sh [--dry-run] [--yes]

Environment overrides:
  GVOE_DEPLOY_USER        SFTP/SSH user
  GVOE_DEPLOY_HOST        SFTP/SSH host
  GVOE_DEPLOY_REMOTE_DIR  Remote document root
  GVOE_DEPLOY_KEY         OpenSSH private key path
  GVOE_DEPLOY_LOCAL_DIR   Local Vite output directory
  GVOE_DEPLOY_DRY_RUN=1   Print planned changes without uploading
  GVOE_DEPLOY_YES=1       Skip confirmation for a real deploy

Notes:
  - This script runs pnpm build before uploading.
  - Remote files absent from dist/ are deleted to remove stale assets.
  - Password authentication is disabled; the dedicated key must be authorized.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    --yes|-y)
      YES=1
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command pnpm
require_command lftp
require_command ssh

if [[ ! -f "$DEPLOY_KEY" ]]; then
  cat >&2 <<EOF
Dedicated GVOE deploy key not found:
  $DEPLOY_KEY

Create and authorize the project-specific OpenSSH key before deploying.
EOF
  exit 1
fi

if head -n 1 "$DEPLOY_KEY" | grep -q '^PuTTY-User-Key-File-'; then
  echo "The configured key must use OpenSSH format, not PuTTY .ppk: $DEPLOY_KEY" >&2
  exit 1
fi

case "$DEPLOY_KEY" in
  *[[:space:]]*)
    echo "Deploy key path must not contain whitespace: $DEPLOY_KEY" >&2
    exit 1
    ;;
esac

SFTP_CONNECT_PROGRAM="ssh -a -x -i $DEPLOY_KEY -o IdentitiesOnly=yes -o BatchMode=yes -o PreferredAuthentications=publickey -o PasswordAuthentication=no -o AddKeysToAgent=yes -o UseKeychain=yes -o StrictHostKeyChecking=accept-new"

echo "Checking SFTP authentication with the dedicated GVOE key..."
if ! ssh \
  -a \
  -x \
  -i "$DEPLOY_KEY" \
  -o IdentitiesOnly=yes \
  -o BatchMode=yes \
  -o PreferredAuthentications=publickey \
  -o PasswordAuthentication=no \
  -o AddKeysToAgent=yes \
  -o UseKeychain=yes \
  -o StrictHostKeyChecking=accept-new \
  -s "$DEPLOY_USER@$DEPLOY_HOST" sftp \
  </dev/null >/dev/null; then
  cat >&2 <<EOF

SFTP authentication failed before build.

Ensure the dedicated public key is authorized on all-inkl and its passphrase is
available through ssh-agent/macOS Keychain:
  $DEPLOY_KEY
EOF
  exit 1
fi

echo "Building static site..."
pnpm build

if [[ ! -d "$LOCAL_DIR" ]]; then
  echo "Generated output directory not found: $LOCAL_DIR" >&2
  exit 1
fi

case "$LOCAL_DIR" in
  *[[:space:]]*)
    echo "Local deploy directory must not contain whitespace: $LOCAL_DIR" >&2
    exit 1
    ;;
esac

case "$DEPLOY_REMOTE_DIR" in
  *[[:space:]]*)
    echo "Remote deploy directory must not contain whitespace: $DEPLOY_REMOTE_DIR" >&2
    exit 1
    ;;
esac

LOCAL_DIR="${LOCAL_DIR%/}"
DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR%/}"

MIRROR_FLAGS=(
  --reverse
  --delete
  --verbose
  --parallel=2
  --exclude-glob
  .DS_Store
)

if [[ "$DRY_RUN" == "1" ]]; then
  MIRROR_FLAGS+=(--dry-run)
fi

echo
echo "Deploy target:"
echo "  Local:  $LOCAL_DIR/"
echo "  Remote: sftp://$DEPLOY_USER@$DEPLOY_HOST$DEPLOY_REMOTE_DIR/"
echo "  Mode:   $([[ "$DRY_RUN" == "1" ]] && echo "dry run" || echo "upload")"
echo

if [[ "$DRY_RUN" != "1" && "$YES" != "1" ]]; then
  read -r -p "Upload to live all-inkl host and delete stale remote files? [y/N] " answer
  case "$answer" in
    y|Y|yes|YES)
      ;;
    *)
      echo "Deploy cancelled."
      exit 0
      ;;
  esac
fi

LFTP_SCRIPT="$(mktemp)"
cat > "$LFTP_SCRIPT" <<EOF
set sftp:auto-confirm yes
set sftp:connect-program "$SFTP_CONNECT_PROGRAM"
open -u "$DEPLOY_USER," sftp://$DEPLOY_HOST
mirror ${MIRROR_FLAGS[*]} $LOCAL_DIR/ $DEPLOY_REMOTE_DIR/
bye
EOF

if ! lftp -f "$LFTP_SCRIPT"; then
  cat >&2 <<EOF

Deploy failed. Verify that all-inkl accepts the dedicated GVOE key:
  $DEPLOY_KEY
EOF
  exit 1
fi

echo
if [[ "$DRY_RUN" == "1" ]]; then
  echo "Dry run complete. No files were uploaded."
else
  echo "Deploy complete."
fi
