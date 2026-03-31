#!/usr/bin/env bash
set -euo pipefail

WORKER_NAME="${CF_WORKER_NAME:-alumni-portal}"
ORIGIN="${API_PROXY_ORIGIN:-}"

if [[ -z "$ORIGIN" ]]; then
  cat <<'EOF'
ERROR: API_PROXY_ORIGIN is required for Cloudflare Worker deploys while API routes are still proxied.
Set it to your legacy backend base URL, for example:
  export API_PROXY_ORIGIN="https://api.example.com/api"

Then run deploy again.
EOF
  exit 1
fi

if [[ ! "$ORIGIN" =~ ^https?:// ]]; then
  echo "ERROR: API_PROXY_ORIGIN must start with http:// or https://"
  exit 1
fi

ORIGIN="${ORIGIN%/}"
if [[ "$ORIGIN" != */api ]]; then
  ORIGIN="$ORIGIN/api"
fi

echo "Setting API_PROXY_ORIGIN for Worker: $WORKER_NAME"
printf "%s" "$ORIGIN" | npx wrangler secret put API_PROXY_ORIGIN --name "$WORKER_NAME"
echo "API_PROXY_ORIGIN secret updated successfully."
