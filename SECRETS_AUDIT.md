# FestNest Secrets Audit Report

**Audit date:** August 21, 2026
**Status:** ⚠️ **NOT CLEARED — reachable Git history still contains credential-shaped material**

## Scope

This report covers the current checkout and reachable Git history. It does not rewrite history, revoke credentials, force-push, or change application/security code.

## Current-tree result

- No `sbp_*` access-token pattern is present in the current tree.
- No tracked private-key marker was found.
- The actual Supabase anon JWT was removed from `docs/sessions/session-notes-2026-03-19.md`.
- Anon keys are client-public configuration, but they are not preserved in audit or session notes.
- Generic JWT-shaped matches are not treated as secrets without confirmation; setup examples and package-integrity strings can match that broad pattern.

The current tree is therefore cleaner, but it must not be described as fully secure while the reachable-history finding remains unresolved.

## Reachable-history result

The scan covered **42 reachable commits** across the repository's local refs:

- `sbp_*` credential-shaped material appears in **40 reachable commits**.
- JWT-shaped material appears in **42 reachable commits**. This broader result includes public anon-key material and other non-credential strings, so it is not by itself proof of a secret.

The reachable `sbp_*` finding must be treated as an exposed Supabase access token until the token is revoked and the history is purged. The token is intentionally not reproduced here.

## Required remediation

1. Revoke the exposed Supabase access token in the Supabase account/dashboard.
2. Issue a replacement token only after confirming the old token is no longer valid, and update any authorized local or CI tooling that used it.
3. Purge the token from every affected Git commit and ref using an approved history-rewrite procedure such as `git filter-repo` or BFG.
4. Coordinate the required force-push and update or invalidate affected clones, caches, mirrors, and pull-request artifacts.
5. Re-run the current-tree and reachable-history scans after the purge. A release clearance requires no remaining real credential match.

These actions are intentionally documented but were **not** performed by this audit.

## Documentation hygiene

- `SECRETS_AUDIT.md` contains no credential value.
- `docs/sessions/session-notes-2026-03-19.md` records that the local anon-key configuration was updated, but does not record the key value.
- Public anon configuration may remain in setup examples when clearly labeled as a placeholder; real values do not belong in audit or session notes.

## Final disposition

**Current-tree documentation hygiene: PASS.**
**Repository secret hygiene: BLOCKED** until the exposed `sbp_*` token is revoked/rotated and reachable Git history is purged and rescanned.
