#!/usr/bin/env bash
# Stop local PartyKit (:1999) and Next.js (:3000) dev servers.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCK_FILE="$ROOT/.next/dev/lock"
stopped=0

for port in 1999 3000; do
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  if [ -z "$pids" ]; then
    continue
  fi
  echo "Stopping port $port (PID $pids)..."
  kill $pids 2>/dev/null || true
  stopped=1
done

if [ "$stopped" -eq 1 ]; then
  sleep 1
fi

# Next.js 16 refuses a second dev instance while this lock exists.
if [ -f "$LOCK_FILE" ]; then
  lock_pid=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$LOCK_FILE','utf8')).pid||'')}catch(e){}" 2>/dev/null || true)
  if [ -n "$lock_pid" ] && ! kill -0 "$lock_pid" 2>/dev/null; then
    rm -f "$LOCK_FILE"
    echo "Removed stale Next.js dev lock (dead PID $lock_pid)."
    stopped=1
  elif [ -z "$(lsof -ti :3000 2>/dev/null || true)" ]; then
    rm -f "$LOCK_FILE"
    echo "Removed Next.js dev lock (nothing on :3000)."
    stopped=1
  fi
fi

if [ "$stopped" -eq 0 ]; then
  echo "Nothing listening on :1999 or :3000."
else
  echo "Done. Run: npm run dev:local  (Next + PartyKit)"
  echo "  or:  npm run dev           (Next only, no multiplayer)"
fi
