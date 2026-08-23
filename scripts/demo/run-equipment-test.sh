#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FESTIVAL_REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATUS_ENV_FILE="$(mktemp)"
PROXY_PID=""

cleanup() {
  if [[ -n "$PROXY_PID" ]] && kill -0 "$PROXY_PID" 2>/dev/null; then
    kill -TERM "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
  rm -f "$STATUS_ENV_FILE"
}
trap cleanup EXIT

cd "$FESTIVAL_REPO_ROOT"
npx supabase status >/dev/null || {
  echo "Local Supabase is not running. Start it with scripts/demo/start-local-supabase.sh." >&2
  exit 1
}
npx supabase status -o env > "$STATUS_ENV_FILE"
set -a
. "$STATUS_ENV_FILE"
set +a

UPSTREAM_SUPABASE_URL="${API_URL:-http://127.0.0.1:54321}"
UPSTREAM_HOST="$(node -e 'process.stdout.write(new URL(process.argv[1]).hostname)' "$UPSTREAM_SUPABASE_URL")"
UPSTREAM_PORT="$(node -e 'const u=new URL(process.argv[1]);process.stdout.write(u.port||(u.protocol==="https:"?"443":"80"))' "$UPSTREAM_SUPABASE_URL")"
case "$UPSTREAM_HOST" in
  127.0.0.1|localhost|::1|'[::1]') ;;
  *) echo "Refusing to run the demo test against non-loopback Supabase host: $UPSTREAM_HOST" >&2; exit 1 ;;
esac

export EXPO_PUBLIC_SUPABASE_ANON_KEY="${ANON_KEY:?Supabase status did not provide ANON_KEY}"
export QA_API_BASE_URL="${QA_API_BASE_URL:-http://127.0.0.1:8080}"
: "${QA_AGENT_API_TOKEN:?QA_AGENT_API_TOKEN is required}"

# Gate 3: the live two-session equipment test must run through the stale-response
# proxy, not straight at Supabase. The proxy is the only component that can arm the
# controlled stale condition, so composing it here is what makes the scenario's
# "packed during a controlled stale condition" step real rather than documented.
export FESTNEST_DEMO_MANIFEST="${FESTNEST_DEMO_MANIFEST:-$FESTIVAL_REPO_ROOT/demo/.generated/manifest.json}"
if [[ ! -f "$FESTNEST_DEMO_MANIFEST" ]]; then
  echo "Demo manifest $FESTNEST_DEMO_MANIFEST is missing. Run scripts/demo/reset-demo.sh first." >&2
  exit 1
fi
export FESTNEST_DEMO_BUILD_ID="${FESTNEST_DEMO_BUILD_ID:-festnest-demo-001}"
export FESTNEST_STALE_PROXY_PORT="${FESTNEST_STALE_PROXY_PORT:-54331}"
export FESTNEST_STALE_PROXY_TARGET_PORT="${FESTNEST_STALE_PROXY_TARGET_PORT:-$UPSTREAM_PORT}"
export FESTNEST_STALE_PROXY_LOG="${FESTNEST_STALE_PROXY_LOG:-${TMPDIR:-/tmp}/festnest-stale-proxy-$$.jsonl}"
export FESTNEST_STALE_PROXY_TTL_MS="${FESTNEST_STALE_PROXY_TTL_MS:-30000}"
: > "$FESTNEST_STALE_PROXY_LOG"

node scripts/demo/stale-proxy.mjs &
PROXY_PID=$!

node -e '
const net = require("node:net");
const port = Number(process.argv[1]);
const deadline = Date.now() + 15000;
(function attempt() {
  const socket = net.connect(port, "127.0.0.1");
  socket.once("connect", () => { socket.destroy(); process.exit(0); });
  socket.once("error", () => {
    socket.destroy();
    if (Date.now() > deadline) { console.error(`stale proxy never listened on ${port}`); process.exit(1); }
    setTimeout(attempt, 100);
  });
})();
' "$FESTNEST_STALE_PROXY_PORT"

# Every request in the live test now traverses the proxy. Non-armed traffic is
# forwarded untouched, so this does not weaken RLS or any authorization check.
export FESTNEST_SUPABASE_DIRECT_URL="$UPSTREAM_SUPABASE_URL"
export EXPO_PUBLIC_SUPABASE_URL="http://127.0.0.1:${FESTNEST_STALE_PROXY_PORT}"

npx playwright test --config playwright.demo.config.ts
