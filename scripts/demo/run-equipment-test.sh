#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FESTIVAL_REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATUS_ENV_FILE="$(mktemp)"
trap 'rm -f "$STATUS_ENV_FILE"' EXIT

cd "$FESTIVAL_REPO_ROOT"
npx supabase status -o env > "$STATUS_ENV_FILE"
set -a
. "$STATUS_ENV_FILE"
set +a

export EXPO_PUBLIC_SUPABASE_URL="${API_URL:-http://127.0.0.1:54321}"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="${ANON_KEY:?Supabase status did not provide ANON_KEY}"
export QA_API_BASE_URL="${QA_API_BASE_URL:-http://127.0.0.1:8080}"

npx playwright test --config playwright.demo.config.ts
