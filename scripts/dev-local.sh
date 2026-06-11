#!/usr/bin/env bash
# Next.js + PartyKit for local multiplayer / NPC chatter.
set -euo pipefail
trap 'kill 0 2>/dev/null || true' EXIT INT TERM

echo "Starting PartyKit on :1999..."
set -a
[ -f .env.local ] && . ./.env.local
set +a
export PARTYKIT_DEV=true
export CHATTER_API_URL="${CHATTER_API_URL:-http://127.0.0.1:3000/api/npc-chatter}"
npm run party:dev &
sleep 2
echo "Starting Next.js on :3000..."
npm run dev
