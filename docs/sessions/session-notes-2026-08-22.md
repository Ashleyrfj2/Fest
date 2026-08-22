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
