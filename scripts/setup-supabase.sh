#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FESTIVAL_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$FESTIVAL_REPO_ROOT"

echo "Starting the repository-local Supabase stack."
echo "This script never logs in, links a remote project, or pushes migrations."
npx supabase start
npx supabase status

echo "Local Festival Supabase is ready."
echo "Use scripts/demo/reset-demo.sh to apply the canonical local demo fixtures."
