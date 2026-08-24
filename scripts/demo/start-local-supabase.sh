#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FESTIVAL_REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$FESTIVAL_REPO_ROOT"

npx supabase start
npx supabase status
