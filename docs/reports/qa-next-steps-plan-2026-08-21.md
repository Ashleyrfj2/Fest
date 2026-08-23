# Festival QA Follow-up Execution Plan

> **Historical Status Note (2026-08-22):** This document is preserved as a historical QA follow-up plan from 2026-08-21. Current authoritative statuses, verification receipts, and active execution plans are maintained in `docs/sessions/session-notes-2026-08-22.md`, `docs/test-notes.md`, and sibling Demo `docs/agent-logs/CURRENT.md`.

Date: 2026-08-21  
Source: Senior QA pass completed in the current Festival worktree  
Scope: Close the remaining backend, synchronization, web smoke, native, and release-gate gaps without weakening the existing security or data-integrity protections.

## Current baseline

The current static baseline is green:

- `npm run lint` passes.
- `npx tsc --noEmit` passes.
- `npm test` passes 21 deterministic tests.
- `npx expo export --platform web --output-dir /tmp/festnest-qa-final` exports all 35 static routes.
- `git diff --check` passes.

The remaining release risks are not proven closed by those checks:

- Supabase migrations and RLS/RPC behavior have not been executed against an isolated live or local database.
- `transferLeadership` still uses multiple sequential writes rather than one transaction.
- Realtime ordering, reconnect behavior, and native SQLite synchronization lack integration coverage.
- No browser smoke/E2E suite exists.
- Native iOS/Android behavior has not been replayed; the web meetup surface is intentionally coordinate-based while native retains the interactive map.
- The worktree contains pre-existing user modifications and must be separated before commit.

## Ordered execution plan

### 0. Preflight and change isolation

Before every action, capture `git status --short --branch`, preserve unrelated user changes, confirm the target Supabase environment, and record the exact commands and artifacts produced. Do not reset, clean, or deploy production state without explicit authorization.

### 1. Validate migrations and authorization in an isolated Supabase environment

Best fit: Privacy and Security-minded Mobile Engineer + Collaboration Approval Queue Backend Engineer, with Senior QA Engineer acceptance review.

Scope:

- Apply the current branch migrations to a disposable local or staging Supabase database.
- Exercise invite preview/join, expiry, duplicate join, leader membership creation, safety-profile ownership, emergency PIN access, approval queue roles, and budget trip scoping.
- Test at least anonymous, authenticated user A, authenticated user B, two separate trips, viewer/editor/leader roles, and an expired invite.
- Keep production credentials and private data out of logs.

Exit gate:

- All expected allow/deny cases pass against the database, or each failure has a reproducible issue with severity and migration location.
- The migration receipt identifies the database target, migration set, timestamp, and rollback/cleanup approach.
- No “static source verification” claim is upgraded to “live authorization verified” without this evidence.

### 2. Make leadership transfer transactional

Best fit: Collaboration Hub Engineer or Collaboration Approval Queue Backend Engineer, with Senior QA Engineer review.

Scope:

- Replace the sequential demote/promote/trip-update sequence in `lib/hooks/useCollaboration.ts` with one database transaction/RPC.
- Preserve the current leader-only and same-trip checks.
- Ensure exactly one leader exists and `trips.leader_id` agrees with that membership after success.
- Define behavior for missing target members, already-current leader, concurrent transfers, and mid-operation failure.

Exit gate:

- Database-level tests prove atomic success and rollback on failure.
- No intermediate state can expose zero leaders, two leaders, or a stale `trips.leader_id`.
- The hook reports safe user-facing errors and refreshes member/trip state after success.

### 3. Add realtime, reconnect, and offline integration coverage

Best fit: Full-stack Mobile Engineer with offline/synchronization focus, supported by Senior QA Engineer.

Scope:

- Build the lightest reusable harness for Supabase event delivery and Expo SQLite persistence.
- Cover Camp Grid remote/local timestamp conflicts, failed remote load, destructive-save confirmation, reconnect hydration, and duplicate events.
- Cover Safety profile local-first writes, remote refresh, stale encrypted cache, PIN rotation, and offline fallback.
- Cover at least one shared module subscription path such as Travel, Food Planner, or Approval Queue.
- Verify event ordering, repeated events, deletion events, and unsubscribe cleanup.

Exit gate:

- Tests prove no data loss, duplicate rows, stale overwrite, or unauthorized cross-trip hydration in the covered paths.
- Each intentionally untestable native/device behavior is recorded as a manual replay case rather than implied to be covered.

### 4. Add browser smoke coverage

Best fit: Senior QA Engineer with a web/browser automation focus.

Scope:

- Add one browser test framework only if the project accepts the dependency; prefer a minimal Playwright setup rather than multiple test stacks.
- Smoke test static export startup, sign-in/welcome navigation, invite route validation, trip dashboard navigation, budget entry validation, and the web meetup fallback.
- Add failure-path checks for malformed route parameters and expired/invalid invite presentation where a test environment can supply deterministic data.

Exit gate:

- A documented command runs the smoke suite against the exported web app or a controlled dev server.
- Tests do not require production accounts or hard-coded personal data.
- Failures identify route, browser, and captured artifact.

### 5. Resolve web-map and native-map product coverage

Best fit: Travel Module Maps Engineer + Travel Module QA Engineer, with product approval for any scope change.

Scope:

- Replay native meetup-map render, pan/zoom, marker drag, marker edit, remove, and role-gated mutation behavior on iOS and Android or an approved simulator.
- Confirm the web coordinate fallback is acceptable product behavior.
- If web interactivity is required, propose and evaluate a web-compatible map implementation separately; do not silently replace the native map or add a provider dependency.

Exit gate:

- Native map behavior has a dated evidence record.
- The product decision explicitly labels web mapping as supported, coordinate-only, or deferred.
- Any provider/API-key requirement is documented without committing secrets.

### 6. Complete CI and release hygiene

Best fit: Full-stack Engineer or DevOps-capable QA Engineer.

Scope:

- Extend the existing `.github/workflows/lint.yml` or add a narrowly scoped workflow for lint, app typecheck, deterministic tests, and `git diff --check`.
- Add the successful web export as a CI job only if runtime and artifact size are acceptable.
- Keep database integration tests opt-in to an isolated environment with secret-backed configuration.
- Separate the current worktree into intentional commits or clearly document pre-existing changes before review.

Exit gate:

- A clean checkout can reproduce all required static gates with `npm ci`.
- CI reports unit/static, integration, E2E, and manual/native coverage separately.
- No release sign-off depends on an undocumented local-only command.

## Release decision rules

- Do not ship if live RLS/RPC checks fail, leadership transfer can leave inconsistent state, or a Critical/High security finding remains unmitigated.
- A missing native device replay is a documented conditional gap, not a pass.
- Static SQL/source tests are evidence of contract drift prevention, not proof that a deployed Supabase project has the migration.
- Every action must return changed files, commands, pass/fail results, artifacts, and remaining gaps.

## Definition of done

The follow-up is complete when the six ordered actions have either passed their exit gates or have explicit owner-approved risk acceptance, the current worktree is reviewable, and the final report distinguishes verified live behavior from static, integration, E2E, and manual evidence.
