# QA Next-Steps Agent Instructions

These are ready-to-run dispatch instructions for the ordered plan in `docs/reports/qa-next-steps-plan-2026-08-21.md`.

## Instructions for every agent

1. Read the plan and inspect the current worktree before editing. Start with `git status --short --branch` and `git diff --stat`.
2. Preserve unrelated user changes. Never use `git reset --hard`, broad cleanup, or destructive deletion.
3. Treat current files, migrations, generated types, and command output as authoritative. Do not promote old reports or comments into current facts.
4. Keep trip IDs, user IDs, invite codes, encrypted fields, and credentials out of logs and reports unless they are synthetic test fixtures.
5. Prefer root-cause fixes and deterministic tests. Keep UI checks subordinate to backend authorization.
6. Run relevant validation after each change and report exact commands, exit status, and limitations.
7. Do not apply migrations to production or use real personal data without explicit approval.

## Dispatch 1 — Isolated Supabase authorization validation

Best-fit agent: Privacy and Security-minded Mobile Engineer  
Support: Collaboration Approval Queue Backend Engineer and Senior QA Engineer

### Prompt

Validate the current branch’s Supabase trust boundaries in an isolated local or staging environment. Inspect and, only where necessary, correct:

- `supabase/migrations/20260823000000_secure_invite_join.sql`
- `supabase/migrations/20260822000000_harden_public_security.sql`
- `supabase/migrations/20260405000000_change_proposals.sql`
- `supabase/migrations/20260405000002_create_budget_tables.sql`
- `app/join/[code].tsx`
- `app/auth/guest-setup.tsx`
- `app/onboarding/set-profile.tsx`

Apply migrations only to an explicitly isolated target. Test anonymous access, authenticated users, two trips, expired invites, duplicate joins, leader creation, safety ownership, emergency PIN access, viewer/editor/leader proposal behavior, and budget isolation. Add or update deterministic integration tests if the project has a supported database harness. Do not claim live verification from source inspection.

### Acceptance criteria

- Invite joining is possible only through a valid, unexpired invite and authenticated RPC path.
- A user cannot read or mutate another user’s safety profile through ordinary CRUD.
- Emergency access returns only the permitted envelope after membership and PIN checks.
- Viewers cannot propose or resolve approval items; editors are module-scoped; leaders can resolve.
- User A cannot read or mutate trip B data.
- Migration application and test target are documented without secrets.

### Handoff

Return changed files, migration receipt, test matrix, exact commands, failures, and whether the result is PASS, CONDITIONAL, or FAIL.

## Dispatch 2 — Transactional leadership transfer

Best-fit agent: Collaboration Hub Engineer or Collaboration Approval Queue Backend Engineer  
Support: Senior QA Engineer

### Prompt

Replace the sequential leadership transfer path in `lib/hooks/useCollaboration.ts` with an atomic database operation. Inspect `group_members`, `trips`, existing triggers, RLS, and activity logging before choosing an RPC or migration design. Preserve leader-only authorization and same-trip target validation. Add tests for success, missing target, self-transfer, nonleader caller, concurrent transfer, and rollback after an injected failure.

### Acceptance criteria

- One transaction guarantees exactly one leader.
- `trips.leader_id` and the leader membership cannot diverge.
- Failed transfers leave the original state unchanged.
- Activity logging occurs once after successful transfer, not for partial steps.
- The client refreshes authoritative state after success.

### Handoff

Return migration/RPC design, hook changes, tests, invariant evidence, and unresolved concurrency assumptions.

## Dispatch 3 — Realtime and offline integration harness

Best-fit agent: Full-stack Mobile Engineer with offline/synchronization focus  
Support: Senior QA Engineer and Privacy/Security-minded Mobile Engineer for Safety paths

### Prompt

Build the smallest reusable integration harness for the existing synchronization behavior. Start with:

- `lib/sqlite/useCampGridDB.ts`
- `lib/campGridSync.ts`
- `lib/hooks/useSafetyProfile.ts`
- `lib/hooks/usePackingList.ts`
- one shared subscription hook such as `lib/hooks/useTravel.ts` or `lib/hooks/useApprovalQueue.ts`

Test local-first writes, remote hydration, newer/older snapshots, malformed timestamps, remote-load failure, reconnect, duplicate realtime events, unsubscribe cleanup, stale Safety PIN data, and cross-trip rejection. Use synthetic users/trips only.

### Acceptance criteria

- No covered path overwrites newer data with older data.
- Failed remote loads do not trigger destructive deletes.
- Reconnect does not duplicate rows or subscriptions.
- Offline writes remain available and later reconcile predictably.
- Safety failures fail closed without exposing encrypted payloads.

### Handoff

Return harness architecture, scenarios covered, commands, timing/race limitations, and manual device cases still required.

## Dispatch 4 — Browser smoke suite

Best-fit agent: Senior QA Engineer with browser automation focus

### Prompt

Add a minimal browser smoke suite only if the dependency and runtime cost are acceptable. Prefer one framework, ideally Playwright. Exercise the successful static export or a controlled dev server:

- app startup and static route load;
- malformed and repeated trip/invite route parameters;
- sign-in/welcome navigation;
- trip dashboard to module navigation;
- budget invalid-input rejection;
- web meetup coordinate fallback rendering and editor action.

Use deterministic fixtures or an isolated test backend. Never use production accounts. Capture screenshots or traces only for failures.

### Acceptance criteria

- One documented command runs the suite from a clean install.
- Tests distinguish route/render failures from backend-auth failures.
- No personal data or secret values are committed.
- The suite is not presented as native-device coverage.

### Handoff

Return new scripts/dependencies, fixture strategy, test count, command output, and browser-specific limitations.

## Dispatch 5 — Native map replay and web-map decision

Best-fit agent: Travel Module Maps Engineer + Travel Module QA Engineer

### Prompt

Replay the native `components/Travel/MeetupMap.tsx` behavior on an approved iOS/Android simulator or device: render, pan/zoom, add, drag, edit, remove, role gating, and persistence/realtime refresh. Separately review `components/Travel/MeetupMap.web.tsx` and decide whether coordinate-only web behavior satisfies the product requirement. If not, write a bounded implementation proposal before adding a web mapping provider.

### Acceptance criteria

- Native behavior has evidence for editor and viewer roles.
- Map API keys/provider configuration are checked without exposing secrets.
- Web support is explicitly classified as interactive, coordinate-only, or deferred.
- Any proposed provider/dependency change includes privacy, cost, and bundle-size impact.

### Handoff

Return device/simulator, platform, build version, scenario results, screenshots where useful, and the product decision.

## Dispatch 6 — CI and worktree release hygiene

Best-fit agent: Full-stack Engineer or DevOps-capable QA Engineer

### Prompt

Extend the existing `.github/workflows/lint.yml` into a reproducible quality gate. Run from a clean checkout with `npm ci`:

```sh
npm run lint
npx tsc --noEmit
npm test
git diff --check
```

Evaluate whether the web export belongs in CI based on runtime and artifact size. Add isolated integration/E2E jobs only when their environment and secrets are documented. Review the dirty worktree and separate pre-existing user changes from this follow-up before commit.

### Acceptance criteria

- A clean checkout reproduces the static gates.
- CI reports unit/static, integration, browser, and manual/native coverage separately.
- No job silently targets production data.
- The pull request or handoff identifies every changed file and any intentional pre-existing change.

### Handoff

Return workflow diffs, clean-checkout results, artifact links, environment requirements, and final ship/conditional/block recommendation.

## Required agent report format

```text
Action: [1-6]
Overall: PASS / CONDITIONAL / FAIL
Owner / support:
Changed files:
Evidence commands:
Tests and results:
Security or data-integrity impact:
Remaining issues:
Blocked by:
Next action:
```
