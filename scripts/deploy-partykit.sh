#!/usr/bin/env bash
# Deploy PartyKit + push NPC chatter secrets from .env.local.
# Pair convos run LLM calls on PartyKit — OPENROUTER_API_KEY must be here, not just Vercel.
set -euo pipefail

DOMAIN="${PARTYKIT_DOMAIN:-partykit.whichstage.com}"
MANAGED_HOST="${PARTYKIT_MANAGED_HOST:-whichstage.katysovas.partykit.dev}"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

DEPLOY_VARS=()
for key in OPENROUTER_API_KEY NPC_CHATTER_SECRET NEXT_PUBLIC_SITE_URL CHATTER_API_URL YOUTUBE_API_KEY; do
  val="${!key:-}"
  if [[ -n "$val" ]]; then
    DEPLOY_VARS+=(--var "${key}=${val}")
  fi
done

if [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
  echo "WARNING: OPENROUTER_API_KEY is not set — NPC pair chatter will not run on PartyKit."
  echo "Add it to .env.local, then re-run: npm run party:deploy"
fi

deploy_partykit() {
  if ((${#DEPLOY_VARS[@]} > 0)); then
    npx partykit deploy "${DEPLOY_VARS[@]}" "$@"
  else
    npx partykit deploy "$@"
  fi
}

if [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" && -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Attempting cloud-prem deploy to https://${DOMAIN}..."
  if deploy_partykit --domain "$DOMAIN"; then
    echo "Cloud-prem deploy succeeded."
    exit 0
  fi
  echo ""
  echo "Cloud-prem deploy failed (common on Workers Free — Durable Objects need SQLite migration)."
  echo "Falling back to managed PartyKit + Cloudflare DNS CNAME..."
  echo ""
fi

echo "Deploying to managed PartyKit at https://${MANAGED_HOST}..."
deploy_partykit

echo ""
echo "Deployed vars: OPENROUTER_API_KEY, NPC_CHATTER_SECRET, NEXT_PUBLIC_SITE_URL (if set in .env.local)"
echo "Verify with: npx partykit env list"
echo "Set NEXT_PUBLIC_PARTYKIT_HOST=${MANAGED_HOST} in Vercel and redeploy Next.js."
