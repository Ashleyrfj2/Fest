# Session Notes — August 22, 2026

Date: August 22, 2026  
Focus: Festival virtual QA environment implementation, expert audit, and Demo/QAthesis log synchronization  
Status: In progress — narrow checks passed; composed synthetic V1 and empirical experiment remain blocked

---

## Purpose and source of truth

This is Festival's repository-specific operational handoff for the shared thesis demo. The sibling Demo repository owns the canonical shared issue IDs and statuses in `docs/agent-logs/CURRENT.md`. Do not create duplicate Festival IDs for the same shared defect.

Festival owns application state, RLS and supply behavior, deterministic seed/reset, the stale-condition proxy, activity adaptation, and the browser target. Demo owns normalized evidence ingestion, persistence, correction, sufficiency/routing, extension transport, UI, experiment runs, and metrics.

## Changes implemented before the audit

Festival's active `Seed,-Weights` branch includes:

- Fixed `equipment-handoff-v1` scenario identifiers and hidden ground truth.
- Local-only deterministic seed/reset/verification for four synthetic users, one trip, and four supplies.
- Browser export that prefers caller-provided local Supabase configuration and removes the service-role key.
- Supply realtime publication plus a browser refetch fallback.
- A stale-response proxy, Festival activity-log adapter, direct Supabase/RLS Playwright test, and live two-session browser test.
- Accessibility/test identifiers for stable canopy assertions.
- Demo manifest/cursor outputs under ignored `demo/.generated/`.

The sibling Demo worktree contains the uncommitted API/database, evidence pipeline, correction/routing/metrics, extension, frontend, fixtures, and synthetic experiment driver described in its dated agent log.

## Verified narrow receipts

- Consecutive Festival resets previously produced fingerprint `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a`.
- The direct viewer DELETE request returned no deleted canopy row and the item remained present.
- A separate two-browser test observed the shared claim and packed state.
- The isolated proxy test returned one cached supply response and then the current upstream response.
- Festival lint, normal TypeScript, deterministic tests, browser smoke tests, demo proxy test, direct demo test, and live browser test passed during the implementation session.
- Browser export strips the service-role variable; generated artifacts remain ignored.

These receipts do not prove atomic Demo persistence, authoritative provenance, actor-scoped stale behavior, valid experiment metrics, extension reliability, or the fully composed workflow.

## Expert-audit corrections agents must preserve

- Demo raw event insertion and derived persistence are non-atomic; duplicate retry cannot repair a partial projection failure (`BUG-20260822-001`).
- Corrections are not transactionally durable, scope-safe, or stable for future evidence (`BUG-20260822-002`).
- Build/run/replay behavior can misstate freshness and scope (`BUG-20260822-003`).
- Current exported counters do not implement the declared experiment metrics or freezing (`BUG-20260822-004`).
- Festival-generated actor UUIDs, fixed fixture actors, client-writable activity logs, late-tester role, and Playwright actor provenance do not agree (`BUG-20260822-005`).
- The stale proxy uses one global cache/flag and was not composed with the live two-browser test (`BUG-20260822-006`).
- Demo extension queue/outcome semantics can lose or overstate evidence (`BUG-20260822-007`).
- Festival viewer UPDATE is broader than documented, and the generic delete hook treats an HTTP-200 RLS no-op as success (`BUG-20260822-008`).
- Both local stacks were observed listening on all host interfaces; Demo evidence routes are unauthenticated (`ISSUE-20260822-006`).
- Contracts, CI, setup/status documents, and current implementation claims have material drift (`ISSUE-20260822-007`).
- Festival retains unsafe legacy remote setup paths and 12 unrelated tracked personal cleanup scripts (`ISSUE-20260822-008`).

## Security and experiment blockers

- `BLOCK-20260822-001`: do not run or interpret baseline/guided human experiments until `BUG-20260822-001` through `BUG-20260822-007` close and the composed workflow passes.
- `BLOCK-20260822-002`: Festival history contains documented credential-shaped Supabase token material. Public onboarding/release waits for verified revocation and approved history remediation.
- Never run obsolete remote setup/reset scripts as part of demo work. Continue using local/synthetic environments only.
- Do not expose the currently unauthenticated services on an untrusted network.

## Ownership and coordination

| Workstream | Festival responsibility | Demo responsibility |
| --- | --- | --- |
| Exposure and identity | Loopback/isolate Festival services; stable synthetic actor registry | Bind/authenticate API; derive source identity; reject conflicting duplicate payloads |
| Permission evidence | Harden supply transitions and generate authoritative denial evidence | Preserve honest provenance and reconcile role/context sufficiency |
| Persistence/corrections | Supply deterministic source events for integration tests | Transactional ingestion/projections/corrections and deterministic replay |
| Stale condition | Scope proxy by actor/session/trip/query and log activation/deactivation | Create/close the matching verification request without cross-state leakage |
| Extension | Provide the allowlisted Festival browser target | Serialize queue, expose drops/failures, configure actor/session, avoid click-as-pass |
| Metrics | Provide controlled condition and identical reset/run inputs | Implement declared definitions, scoped inputs, timestamps, and immutable freeze |
| Documentation | Correct unsafe setup/product status and remove unrelated scripts separately | Keep canonical shared IDs, contracts, API docs, CI status, and current handoff |

## Work still required, in order

1. Verify credential revocation/remediation and restrict both stacks to trusted loopback access.
2. Authenticate Demo sources and make ingest/projection/correction persistence atomic and repairable.
3. Add PostgreSQL failure, duplicate-conflict, restart, concurrency, correction-chain, and scope integration tests.
4. Reconcile fixed actors, late-tester role, Playwright identity, and authoritative permission-denial provenance.
5. Actor-scope and compose the Festival stale proxy with the two-browser workflow.
6. Repair extension queue/configuration/outcome semantics and manually exercise it against Festival.
7. Implement the predeclared metric definitions and immutable baseline/guided freeze.
8. Align JSON Schema, OpenAPI, Go, TypeScript, fixtures, CI, and current setup/product docs.
9. Separately review removal/quarantine of legacy remote/destructive setup material and unrelated personal cleanup scripts.
10. Re-run the complete synthetic V1 before screenshots, recording, or equally timeboxed human runs.

## Documentation map for the next agent

Festival:

- `docs/sessions/session-notes-2026-08-22.md` — this operational handoff.
- `docs/reports/thesis-demo-expert-audit-2026-08-22.md` — detailed findings and remediation order.
- `docs/reports/thesis-demo-implementation-report-2026-08-22.md` — historical implementation receipts with an audit correction.
- `docs/test-notes.md` — concise QA/status index.
- `docs/thesis-demo/festival-virtual-qa-environment.md` — normative runbook, not proof of completion.

Demo:

- `docs/agent-logs/CURRENT.md` — canonical shared IDs, statuses, ownership, and priorities.
- `docs/agent-logs/entries/2026-08-22.md` — append-only implementation, audit, and synchronization history.
- `docs/festival-virtual-qa-environment.md` — matching normative runbook.

## Validation and handoff

- Four independent read-only audit agents completed security, engineering, stale-code, and documentation truth reviews.
- Current branch/worktree status and listening sockets were inspected without mutating services.
- Strict unused-code checking reported 58 Festival diagnostics; this is a cleanup finding, not a failure of the prior normal TypeScript gate.
- Documentation synchronization passed `git diff --check` in both repositories.
- No implementation code, service/database state, credential, remote resource, commit, push, PR, or deployment was changed by the audit/log synchronization.

## 18:02 CDT — Evidence-integrity milestones 1–3 implementation

### Cross-repository changes

- Demo work was preserved on local branch `remediation/evidence-integrity`. Festival remained on `Seed,-Weights`; neither repository was committed or pushed.
- Demo now authenticates evidence sources, derives tenant/stable actor/role/source identity from local bearer credentials, rejects identity forgery, and returns `409` for conflicting reuse of an event ID.
- Demo event and derived projection persistence is atomic. Corrections are scope-safe, append-only, restart-durable, and retained for future event identity.
- Isolated PostgreSQL failure/retry/concurrency/restart/correction-chain tests and JSON Schema/OpenAPI/Go/TypeScript/fixture conformance gates were added to CI.
- Festival's activity adapter maps generated Supabase user UUIDs to stable scenario actor IDs and uses actor-specific automation credentials. The Playwright source uses its own agent credential.

### Verification

- Demo Go/PostgreSQL suite passed twice; contract conformance, frontend build, and extension build passed.
- Live Demo API returned health `200`, unauthenticated evidence `401`, and authenticated evidence `200`; Demo ports `8080` and `54332` are loopback-only.
- Festival lint, TypeScript, and 41 deterministic tests passed.
- The authenticated cross-repository equipment-handoff Playwright test passed.
- The authenticated Festival activity adapter then posted four stable-actor events to Demo; actor identity remained source-independent while each immutable event retained its human/agent/automation provenance.
- Festival was reset after the test; verification restored fingerprint `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a`.
- The two normative runbooks remain byte-identical and both worktrees pass `git diff --check`.

### Status and remaining limits

- `BUG-20260822-001` and `BUG-20260822-002` are **Closed — verified** in canonical Demo `CURRENT.md`.
- `BUG-20260822-003` is **In progress**: run-scope and replay freshness defects are repaired, but explicit build-recency semantics remain open.
- `BUG-20260822-005` is **In progress**: stable authenticated actors are repaired, but permission-denial evidence is not yet database-authoritative.
- `ISSUE-20260822-006` is **In progress**: Demo is loopback/authenticated, while Festival Supabase remains all-interface on this Docker Desktop runtime. Supabase's documented loopback network did not change the bindings and broke reset-time DNS, so the default network was restored. Use a trusted/offline network for this private recording.
- The user confirmed the project is private and screen-recording-only. No public-release or Git-history rewrite work was performed; `BLOCK-20260822-002` remains relevant only to any future public onboarding/release.
- Human experiments, extension rehearsal, metrics claims, and full composed-V1 readiness remain blocked by the other open audit items.

## 18:27 CDT — Cross-repository PR publication and Demo merge

### Publication receipt

- Demo remediation was rebased onto the latest upstream `main`, preserving the newly committed full tutorial and logging-policy changes.
- [Demo PR #2](https://github.com/Ashleyrfj2/Demo/pull/2) passed both post-rebase CI runs and was squash-merged into `main` as `af9ac0b` (`fix: harden evidence ingestion integrity`).
- Both repositories are private and retain active `Protect main` rulesets. The configured owner bypass was used only because the owner is the sole collaborator and therefore cannot obtain a separate approving review; no ruleset or collaborator setting was changed.
- [Festival PR #4](https://github.com/Ashleyrfj2/Fest/pull/4) remains the dependent PR and must retain the open limitations below.

### Fresh post-merge validation

- Demo `main` contract conformance: PASS.
- Festival ESLint with `--no-cache`: PASS.
- Festival TypeScript `--noEmit`: PASS.
- Festival deterministic test suite: PASS, 41 of 41 tests.
- Demo and Festival normative runbooks: byte-identical SHA-256 `76adf0eacdd4de3595472011308e64bf521c0200960918223e9ddb8ba59d55a4`.
- This publication step did not rerun the authenticated Playwright/activity-adapter runtime; its earlier verified receipt remains historical evidence, not a new post-merge runtime claim.

### Remaining limits

- The Demo merge closes only the verified atomic-ingestion and correction milestones. It does not close explicit build recency, authoritative permission-denial provenance, metrics/freezing, actor-scoped stale behavior, extension reliability, Festival Supply List authorization hardening, or the empirical-study blocker.
- Festival Supabase remains broadly published by this Docker Desktop runtime. Use a trusted or offline network for the private screen recording.

## 18:33 CDT — Festival PR merge completion

- [Festival PR #4](https://github.com/Ashleyrfj2/Fest/pull/4) passed the final GitHub workflow, including lint, typecheck, deterministic tests, whitespace, and web export.
- PR #4 was squash-merged into Festival `main` as `4479bde` with title `feat: add controlled Festival thesis-demo environment`; the remote feature branch was deleted.
- The dependent Demo integrity work remains merged at `af9ac0b`. Both local `main` branches were fast-forwarded to the merge commits before this final documentation synchronization.
- The owner/admin bypass was used only for the required approving review because the owner is the sole collaborator. Repository rulesets, visibility, and collaborator settings were not changed.
- All open limitations in the 18:27 entry remain open. This merge is not a composed-V1, extension, metric, empirical-study, public-release, or broad-network readiness claim.

## 20:01 CDT — Gate 1 evidence authority accepted

### Implemented and verified

- Demo now requires immutable, controller-authenticated build registration with explicit sequence/predecessor ordering. Unknown builds fail closed, and delayed old-build events remain stale without affecting newer evidence.
- Festival Supply List workflow changes now use database-owned RPCs. Any member may claim an unassigned item and may unclaim, pack, or unpack only an item they own; only leaders/editors may delete. Direct authenticated workflow-column mutation is unavailable.
- Expected authorization denials return a non-applied result and persist one immutable private audit. Clients cannot write the reserved denial activity or read/write the private audit.
- The adapter requires `FESTNEST_EXPERIMENT_RUN_ID` and emits deterministic authenticated blocked evidence only from database-owned audits.

### Accepted receipts

- Demo containerized unit suite, PostgreSQL suite, and contract conformance: PASS.
- Festival lint, TypeScript, and deterministic tests: PASS; 43 of 43 tests.
- Festival reset/migrate/seed and final reset: PASS with canonical fingerprint `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a`.
- Live equipment test: PASS, 1 of 1, including transition ownership, denied deletion, reserved-log rejection, and private-audit access checks.
- Adapter reconciliation: four private denial audits produced exactly four distinct authoritative Demo events before final reset.
- Both repositories passed `git diff --check`.

### Shared status boundary

- Canonical Demo statuses now mark `BUG-20260822-003`, `BUG-20260822-005`, and `BUG-20260822-008` **Closed — verified**.
- Gate 2 metrics/run lifecycle and Gate 3 stale-proxy/extension/composed validation remain pending. This focused receipt is not experiment readiness, a composed workflow receipt, or permission to begin human runs.
- `BLOCK-20260822-001` remains blocked until Bugs 001–008 are closed and a fresh composed workflow gate passes. Public onboarding remains separately blocked by `BLOCK-20260822-002`.

## 20:12 CDT — Gate 1 documentation truth synchronization

### Current-facing documentation corrections

- Replaced obsolete remote/global Supabase setup with guarded loopback local-first `npx supabase` and repository reset-wrapper guidance.
- Updated the documentation index, feature status, Supply List handoff correction, and user audit checklist to match database-owned Supply RPCs, exact owner/state transition limits, private denial audits, and the authoritative adapter path.
- Mirrored Demo's canonical Gate 1 status without claiming Gate 2, Gate 3, composed-workflow, experiment, public-onboarding, or human-study readiness.
- Preserved historical session/report/handoff bodies; the completed Supply List handoff received a dated correction rather than a rewritten history.

### Validation and limits

- **Phase B verified:** approved documentation scans for obsolete personal paths, global Supabase installation, remote link/push/reset examples, broad destructive test cleanup, stale role wording, and outdated static/scaffold claims passed.
- The Demo and Festival normative runbooks are byte-identical, use the guarded Festival reset wrapper, and preserve `late-tester-d` as editor and `viewer-b` as the viewer-denial actor.
- The two runbooks are byte-identical at SHA-256 `4ae5fc379ea5cf5a89e95cb263f575863692b65dc68cb29bffb6ce289fc70ee8`; `git diff --check` passed in both repositories after the documentation edits.
- `ISSUE-20260822-007` remains **In progress**. Closure still requires the broader current-facing scan, command/path verification, final byte-identical runbooks, and the documentation updates triggered by accepted Gate 2 and Gate 3 receipts. `ISSUE-20260822-008`, both blockers, Gate 2, and Gate 3 retain their canonical Demo statuses.
- This documentation pass changed no code, contracts, migrations, tests, scripts, packages, credentials, generated state, services, remote resources, commits, pushes, PRs, or deployments.

## 20:45 CDT — Unlogged `next3` implementation reconciliation

### Ref correction

- This repository is checked out on `next3` at `740dbc1` (`clean: document cleanup`), pushed to `origin/next3`, with no open pull request. `main` remains `4479bde`, so the earlier merge receipts stay accurate for `main`.
- Despite its commit message, `740dbc1` carries implementation: the Gate 1 authoritative supply-mutation migration and adapter work already described in the 20:01 note, plus previously unlogged Gate 3 stale-proxy work.

### Previously unlogged Festival change

- `scripts/demo/stale-proxy.mjs` now derives an identity from the request bearer token (`sub`, `session_id`, and a digest of the opaque token), arms only for `editor-a` on one exact canonicalized `supply_items` read, keys the cached response on identity plus canonical query, and expires the armed condition on a TTL so the condition fails open.
- `tests/demo/stale-proxy.test.mjs` covers session and query isolation and TTL expiry against a spawned mock upstream.

### Gap found by reading the code

- The proxy is scoped but not composed. `tests/demo/equipment-handoff.spec.ts` still targets `EXPO_PUBLIC_SUPABASE_URL` / `127.0.0.1:54321`, and `scripts/demo/run-equipment-test.sh` never launches the proxy. The documented two-session stale condition is unwired, not merely unverified. This is a static observation; nothing was executed.

### Shared status boundary

- Canonical Demo `docs/agent-logs/CURRENT.md` now records `BUG-20260822-006` as **In progress** rather than Open, and moves the Demo-owned `BUG-20260822-004` and `BUG-20260822-007` to **Implemented — awaiting verification**. Do not mint a separate Festival ID for the proxy defect.
- No bug is closed. Gate 2, Gate 3, composed-workflow, experiment, public-onboarding, and human-study readiness are all unchanged, and `BLOCK-20260822-001` and `BLOCK-20260822-002` still stand.
- Next Festival-owned task: route the live two-session equipment test through the proxy and prove per-session isolation, restoring canonical fingerprint `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a` before and after. That task holds the Festival stack exclusively; the Demo manual extension exercise must wait until it releases.

### Validation

- Read-only pass. Branch, ref, remote, pull-request, and commit-content inspection only. No lint, TypeScript, deterministic test, reset, seed, browser test, or service start was run, and no code, migration, script, test, credential, generated state, or remote resource was changed.

## 21:15 CDT — Ref reality, restored notes, and the Demo `0005` repair

This section supersedes the ref statements in the 20:45 section above, which described this repository as sitting on an unmerged `next3`.

### What actually happened to the branches

- Festival `next3` was merged and its remote branch deleted. Festival `main` is now `14df183` (`Next3 (#6)`) and does contain the scoped stale proxy and the Gate 1 authoritative supply-mutation migration, verified against the merged tree.
- The merge did **not** include local commit `1f05ea8` (`docs: sesstion notes`), so the 20:01 and 20:12 session-note sections above were absent from `main`. This branch restores them; they are unchanged from the local commit and are not new claims.
- Demo is the opposite case: its `next3` is **not** merged. Demo `main` does not yet contain the Gate 2/Gate 3 implementation, which reaches `main` only through open Demo PR #4.
- New Festival work branches from `main`, which is ready today and independent of Demo PR #4.

### Corrected shared status

- The Demo-owned `BUG-20260822-004` is **Implemented — awaiting verification**. It was briefly recorded as failing because Demo's suite was red; the cause is fixed. See the Demo log for the receipt.
- Demo's `0005_experiment_lifecycle.sql` pinned `set search_path = pg_catalog, public` on a trigger function whose body declares `experiment_runs%rowtype`, which the PL/pgSQL validator resolves at `CREATE FUNCTION` time. On a clean database the migration failed outright; on a database whose `public` schema already held the tables it applied but resolved the wrong table at runtime. The pin was removed and Demo's suite is green again. Nothing in this repository was involved.
- `BUG-20260822-006` remains **In progress** and Festival-owned. Do not mint a separate Festival ID for it.
- No bug is closed. Gate 2, Gate 3, composed-workflow, experiment, public-onboarding, and human-study readiness are unchanged, and both blockers stand.

### Next Festival task, unchanged

- Route the live two-session equipment test through the stale proxy and prove one session consumes the armed condition while a concurrent session does not, restoring canonical fingerprint `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a` before and after. That task holds the Festival stack exclusively.
- Establish a lint, TypeScript, and deterministic-test baseline first. No current receipt covers the proxy code now on `main`; the 43-test receipt predates it.

### Validation

- Documentation only. Branch, ref, and merged-tree inspection in this repository; no lint, TypeScript, deterministic test, reset, seed, browser test, or service start was run here, and no Festival code, migration, script, test, credential, generated state, or remote resource was changed.
- The Demo repair referenced above was verified in the Demo repository against a clean database: all migrations apply into an isolated schema, `go test -count=2 ./...` passes, and the contract conformance gate passes.

## 21:45 CDT — Gate 3 stale-proxy composition with the live two-session workflow

Festival-owned work on `BUG-20260822-006`. Branch `gate3/stale-proxy-composition`, cut from `main` at `525e121`.

### Baseline before any change

Taken first, because no current receipt covered the stale-proxy code already on `main`; the 43-test receipt predates it.

- `npm run lint -- --no-cache`: PASS, no findings.
- `npx tsc --noEmit`: PASS, no diagnostics.
- `npm test`: PASS, 43 of 43 deterministic tests.
- `npm run test:demo-proxy`: PASS, 2 of 2 isolated mock-upstream tests.

Nothing was already failing, so every result below is attributable to this change.

### What was actually wired

The defect was composition, not proxy scoping. The proxy was correct and untested against the real application; nothing routed the live workflow through it.

- `scripts/demo/run-equipment-test.sh` now derives the upstream Supabase host/port from `supabase status`, refuses a non-loopback upstream, requires the generated demo manifest, launches `scripts/demo/stale-proxy.mjs`, waits for it to accept connections, and only then runs Playwright with `EXPO_PUBLIC_SUPABASE_URL` pointed at the proxy. A trap terminates the proxy on any exit path. The real upstream stays available to callers as `FESTNEST_SUPABASE_DIRECT_URL`.
- `tests/demo/equipment-handoff.spec.ts` now fails closed when `FESTNEST_STALE_PROXY_LOG` is absent. This is deliberate: without it the spec would silently revert to a direct Supabase run and the composition could regress unnoticed, which is exactly how the original defect survived.
- The spec's supply-list read mirrors the query `lib/hooks/useSupplyList.ts` actually issues (`select=*,claimedByUser:...`, `trip_id=eq.<trip>`, `order=created_at.asc`) rather than inventing a query shaped to satisfy the proxy.
- Scenario step 4 is now genuinely two-session. A second independent password sign-in for `editor-a@example.test` yields the same `sub` with a different `session_id`; both were asserted. Session A primes the read, packs the canopy, and the two sessions then issue the identical query concurrently via `Promise.all`.
- `.gitignore` now excludes `test-results/` and `playwright-report/`, which the failure-trace setting produces.

### Verified — composed two-session condition passed

- `npm run test:demo`: PASS, 1 of 1, run twice from a freshly reset database.
- Application-layer isolation, live against local Supabase through the proxy: the concurrent session B read `packed` (fresh), the arming session A read `claimed` (stale) in the same concurrent pair, session A's next read returned `packed` (fails open after a single delivery), and an independent authoritative read confirmed the database itself was never stale.
- Proxy-layer isolation, from the proxy's own event log: exactly one `stale_condition_activated`, one `stale_response_served`, and one `stale_condition_deactivated` with reason `delivered`, all carrying the arming session's selector digest. No event carried session B's selector. No access token or anon key appeared in the log.
- **Negative control.** The same spec run with `EXPO_PUBLIC_SUPABASE_URL` pointed straight at `127.0.0.1:54321` fails at `expect(canopyStatus(armingView)).toBe('claimed')` with received `"packed"`. The stale assertion is produced by the composed proxy and is not vacuous.
- Post-change gate re-run: lint PASS, `tsc --noEmit` PASS, 43 of 43 deterministic tests PASS, 2 of 2 proxy mock tests PASS.
- Sibling Demo API confirmed up before it was relied on: `demo-api-1` published on `127.0.0.1:8080`, `/healthz` `200`, unauthenticated evidence POST `401`, authenticated POST distinguishable at `403` on a deliberately invalid payload. The composed run's final authenticated agent-event ingest was accepted.

### Reset fingerprints

`./scripts/demo/reset-demo.sh` was run before the work and again after the final run.

- Starting fingerprint: `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a`
- Final fingerprint: `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a`

Both match the canonical value. Intermediate resets between the positive runs and the negative control reproduced the same fingerprint. No mismatch was observed and nothing was papered over.

### Not verified by this work

- **Browser composition.** `tests/demo/equipment-handoff.spec.ts` is an HTTP-level two-session test, not a two-browser-context test. The Expo browser export at `127.0.0.1:4173` was never started and `playwright.live-demo.config.ts` was not run, so the proxy has not been composed with the rendered Supply List UI or with realtime. The proxy forwards WebSocket upgrades but that path is still unexercised.
- **Adapter reconciliation.** `scripts/demo/activity-log-adapter.mjs` was not run in this session; no claim is made about stale evidence reaching Demo verification or routing.
- **Demo-side consumption.** Demo owns creating and closing the matching verification request without cross-state leakage. That half of the stale workstream is untouched here.
- **Demo container currency.** `demo-api-1` answers `404` on `/api/v1/builds`, `/runs`, `/metrics`, and `/candidates`, so the running image predates the Gate 2/Gate 3 routes. Only `/api/v1/events` was exercised.
- No metric, extension, recording, or human-run activity was performed.

### Shared status boundary

- `BUG-20260822-006` remains **In progress** and Festival-owned under canonical Demo `docs/agent-logs/CURRENT.md`. No Festival-specific ID was minted and Demo's log was not edited.
- This is **not** Gate 3 acceptance and **not** a composed-workflow readiness claim. It closes the specific unwired-composition gap recorded at 20:45 and 21:15, at the HTTP layer only.
- `BLOCK-20260822-001` stays **Blocked** regardless of this result. `BLOCK-20260822-002`, Gate 2, and the extension work are unchanged.
- `DEC-20260822-006` de-scopes production security posture but not evidence integrity. Nothing here weakens RLS: the proxy forwards all non-armed traffic untouched, every existing authorization assertion in the spec still runs through it and still passes, and no viewer mutation succeeded.

### Validation

- Local and synthetic data only. Local Supabase and the loopback Demo API. No production Festival data, no remote reset or seed, no credential printed into any artifact or document.
- Festival stack held exclusively for the duration; the Demo manual extension exercise may proceed once this releases it.
- Changed files: `scripts/demo/run-equipment-test.sh`, `tests/demo/equipment-handoff.spec.ts`, `.gitignore`, `docs/sessions/session-notes-2026-08-22.md`, `docs/test-notes.md`.
- Committed and pushed to `gate3/stale-proxy-composition`. Not merged; no pull request opened.

## 23:45 CDT — Gate audit correction, Gate 2/3 status, database incident documentation, and branch cleanup

### Gate audit correction

The previous audit incorrectly reported that Demo lacked PostgreSQL Gate 2 experiment lifecycle integration coverage. That finding was stale/false: Demo PR #6 (`c558767`) was merged into `main` before the audit occurred.

Demo's `backend/internal/store/postgres_integration_test.go` exercises the complete PostgreSQL experiment lifecycle against isolated throwaway schemas (`qa_test_<pid>_<nanos>`):
- Experiment creation idempotency and duplicate retry
- Conflicting registration and unregistered build rejection
- Run-partitioned evidence isolation across concurrent baseline and guided runs
- Run-scope mismatch rejection
- Metrics preview under `festival-v1.1`
- Deterministic freeze receipt SHA-256 computation and idempotent retry
- Database-enforced post-freeze write and state correction rejection (`ErrRunFrozen`)
- Snapshot immutability triggers on `experiment_metrics` and lifecycle immutability triggers on `experiment_runs`
- Store restart durability with stable receipt digests and continued post-freeze write denial

Gate 2 lifecycle and database enforcement is **PASS**.

### Gate 3 status and remaining verification

- Festival PR #8 (`0d555e1`) merged the composed stale proxy (`scripts/demo/stale-proxy.mjs`) with the live two-session equipment test (`tests/demo/equipment-handoff.spec.ts`), verifying application-layer and proxy-layer isolation against local Supabase.
- Gate 3 stale proxy composition is **PASS (HTTP/RPC layer)**.
- **Outstanding verification**: Live browser + real rendered DOM + unpacked Chrome extension. Automated unit tests in Demo verify extension queue serialization and transport status classification; live browser execution remains the pending Gate 3 verification step.

### Local database incident documentation

During a prior agent remediation session, Festival's local Supabase PostgreSQL instance was unexpectedly reinitialized:
- Schema and test fixtures were cleanly rebuilt using the deterministic seed tooling (`scripts/demo/reset-demo.sh`), restoring canonical seed fingerprint `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a`.
- No critical user data was lost; the database contained synthetic test and local development state only.
- The incident was an operational/environment scoping failure during automated execution, not evidence of defect or invalidity in the Gate code or migrations.
- **Strict safety rule**: Persistent Demo (`demo_qa_postgres`) and Festival local Supabase databases must never be destructively manipulated, reset, or stopped without explicit verification of repository context and database target. Integration tests must exclusively use isolated ephemeral schemas.

### Branch cleanup results

Both repositories were inspected and stale merged branches were cleaned up conservatively:
- Festival local branches deleted: `gate3/stale-proxy-composition` (merged in PR #8), `next3` (merged in PR #6/#7), `docs/merge-receipts-2026-08-22` (merged in PR #5).
- Festival remote branches pruned/deleted: `gate3/stale-proxy-composition`, `docs/log-reconciliation-2026-08-22`.
- Retained: `main` (active), worktree branches (`copilot/worktree-*`), and security audit branch (`copilot/full-security-audit`).
