#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${PARTYKIT_DOMAIN:-partykit.whichstage.com}"
MANAGED_HOST="${PARTYKIT_MANAGED_HOST:-whichstage.katysovas.partykit.dev}"

if [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" && -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Attempting cloud-prem deploy to https://${DOMAIN}..."
  if npx partykit deploy --domain "$DOMAIN"; then
    echo "Cloud-prem deploy succeeded."
    exit 0
  fi
  echo ""
  echo "Cloud-prem deploy failed (common on Workers Free — Durable Objects need SQLite migration)."
  echo "Falling back to managed PartyKit + Cloudflare DNS CNAME..."
  echo ""
fi

echo "Deploying to managed PartyKit at https://${MANAGED_HOST}..."
npx partykit deploy

echo ""
echo "Set NEXT_PUBLIC_PARTYKIT_HOST=${MANAGED_HOST} in Vercel and redeploy Next.js."
