#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FESTIVAL_REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATUS_ENV_FILE="$(mktemp)"
trap 'rm -f "$STATUS_ENV_FILE"' EXIT

cd "$FESTIVAL_REPO_ROOT"
npx supabase db reset
npx supabase status -o env > "$STATUS_ENV_FILE"
set -a
. "$STATUS_ENV_FILE"
set +a

export EXPO_PUBLIC_SUPABASE_URL="${API_URL:-http://127.0.0.1:54321}"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="${ANON_KEY:?Supabase status did not provide ANON_KEY}"
export SUPABASE_SERVICE_ROLE_KEY="${SERVICE_ROLE_KEY:?Supabase status did not provide SERVICE_ROLE_KEY}"

node scripts/demo/seed-demo.mjs
node scripts/demo/verify-seed.mjs
