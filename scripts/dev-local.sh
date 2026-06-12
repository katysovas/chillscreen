#!/usr/bin/env bash
# Next.js + PartyKit for local multiplayer / NPC chatter.
set -euo pipefail
trap 'kill 0 2>/dev/null || true' EXIT INT TERM

port_pids() {
  lsof -ti ":$1" 2>/dev/null || true
}

PARTY_PIDS=$(port_pids 1999)
NEXT_PIDS=$(port_pids 3000)

if [ -n "$PARTY_PIDS" ] && [ -n "$NEXT_PIDS" ]; then
  echo "Local stack already running:"
  echo "  PartyKit  → http://127.0.0.1:1999  (PID $PARTY_PIDS)"
  echo "  Next.js   → http://127.0.0.1:3000  (PID $NEXT_PIDS)"
  echo ""
  echo "Open http://localhost:3000 — no need to start again."
  echo "To restart clean: npm run dev:stop && npm run dev:local"
  exit 0
fi

if [ -n "$PARTY_PIDS" ]; then
  echo "Port 1999 in use (PartyKit PID $PARTY_PIDS)."
  echo "Stop it first: npm run dev:stop"
  echo "Or kill manually: kill $PARTY_PIDS"
  exit 1
fi

if [ -n "$NEXT_PIDS" ]; then
  echo "Port 3000 in use (Next.js PID $NEXT_PIDS)."
  echo "Stop it first: npm run dev:stop"
  echo "Or kill manually: kill $NEXT_PIDS"
  exit 1
fi

echo "Starting PartyKit on :1999..."
set -a
[ -f .env.local ] && . ./.env.local
set +a
export PARTYKIT_DEV=true
export CHATTER_API_URL="${CHATTER_API_URL:-http://127.0.0.1:3000/api/npc-chatter}"
npm run party:dev &
sleep 2

if [ -z "$(port_pids 1999)" ]; then
  echo "PartyKit failed to bind :1999. Check output above."
  exit 1
fi

echo "Starting Next.js on :3000..."
npm run dev
