#!/usr/bin/env bash
set -euo pipefail

WORKER_NAME="${CF_WORKER_NAME:-mpsajmer-connect}"
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
# Append /api only when the origin has no explicit path segment.
if [[ "$ORIGIN" =~ ^https?://[^/]+/?$ ]]; then
  ORIGIN="$ORIGIN/api"
fi

if [[ "$ORIGIN" == *".trycloudflare.com"* && "${ALLOW_TRYCLOUDFLARE_ORIGIN:-0}" != "1" ]]; then
  cat <<'EOF'
ERROR: API_PROXY_ORIGIN points to a temporary trycloudflare tunnel URL.
These tunnel hostnames are ephemeral and will eventually break production API routes.

Use a stable backend URL instead, for example:
  export API_PROXY_ORIGIN="https://api.example.com/api"

If you intentionally need a temporary tunnel, set:
  export ALLOW_TRYCLOUDFLARE_ORIGIN=1
EOF
  exit 1
fi

echo "Setting API_PROXY_ORIGIN for Worker: $WORKER_NAME"
printf "%s" "$ORIGIN" | npx wrangler secret put API_PROXY_ORIGIN --name "$WORKER_NAME"
echo "API_PROXY_ORIGIN secret updated successfully."
