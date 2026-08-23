# Thesis Demo Expert Audit — 2026-08-22

## Conclusion

Four independent read-only expert passes audited security/privacy, engineering correctness, stale/dead code, and documentation/log truth across Festival and the sibling Demo repository.

The bounded implementation has useful plumbing and several valid narrow receipts, but it is not ready for an empirical baseline/guided experiment. The human study is blocked by evidence-integrity, persistence, correction, metric, provenance, stale-condition, extension, and exposure defects. No implementation code was changed by this audit.

Shared durable IDs and statuses are owned by the sibling Demo repository's `docs/agent-logs/CURRENT.md`. Festival's repository-specific operational handoff is `docs/sessions/session-notes-2026-08-22.md`; agents should update both sides when a shared status changes.

## Critical and high-priority findings

1. **Historical credential blocker:** Festival's existing `SECRETS_AUDIT.md` documents credential-shaped Supabase token material in reachable Git history. Revocation/rotation and approved history remediation remain unverified.
2. **Local-only exposure mismatch:** Demo publishes unauthenticated API and PostgreSQL ports on all interfaces, and live inspection found Festival Supabase ports listening on all interfaces. CORS is not authentication.
3. **Forgeable evidence provenance:** actor, source, role, scope, and masking are client-asserted. Two forged actors can create strong evidence, and a conflicting payload can preempt a deterministic event ID.
4. **Untrusted permission evidence:** any trip member can insert selected `activity_logs`; the adapter relabels them as automation and permission-denial actions become strong without authoritative database audit proof.
5. **Non-atomic ingestion:** raw events commit before derived persistence. A partial failure returns 500, while retry reports duplicate and cannot repair missing derived rows.
6. **Unsafe correction semantics:** corrections mutate memory before persistence, are not scope/self safe, can silently persist no history, and do not remain identity rules for later events.
7. **Replay/build/run defects:** restart replay changes freshness and recommendation identity; build staleness follows arrival order; run IDs can mix tenant/build/environment evidence.
8. **Invalid experiment measurements:** current formulas do not implement the predeclared metrics or immutable freezing and cannot support the thesis comparison.
9. **Actor drift:** the live Festival adapter emits generated user UUIDs while fixtures use stable actor names. Late Tester D is seeded as editor but routed as viewer; the Playwright test authenticates Editor A while asserting agent actor provenance.
10. **Globally scoped stale proxy:** one cache and suppression flag serve all sessions and supply queries. The live two-browser test bypasses it.
11. **Extension evidence loss/overclaim:** queue operations are unsynchronized, silent truncation is possible, and every click is normalized as a pass without a business-state verifier.
12. **Broader Supply List authorization:** viewer UPDATE policy permits arbitrary item-column updates beyond documented claim/own-item transitions. The generic delete hook also treats an RLS no-op as success.

## Stale-code and documentation findings

- Festival retains a legacy remote Supabase bootstrap script without the current local-only approval guard, destructive troubleshooting guidance, obsolete remote testing docs, and 12 tracked personal filesystem cleanup scripts unrelated to Festival.
- Festival's current setup and feature-status rollups contradict newer migrations and verified Safety notes.
- Strict `noUnusedLocals`/`noUnusedParameters` checking reports 58 diagnostics, including dormant mock/outfit, food-planner, lineup, and hook paths.
- Demo JSON Schema, OpenAPI, Go validation, TypeScript types, and fixtures have material drift; the schema is not enforced by runtime or conformance tests.
- Prior `CURRENT.md` branch/ref and readiness claims were stale and have been corrected in the append-only Demo log.

## Narrow checks that remain valid

- Festival reset/seed produced the recorded deterministic fingerprint in prior runs.
- Viewer DELETE was denied at the database boundary in the direct test.
- A separate two-session browser test observed claim/packed convergence.
- Browser export removes the service-role key and its static server binds loopback with traversal protection.
- Event HTTP decoding has a 64 KiB cap, unknown-field/trailing-object rejection, enum checks, required masking, and selected sensitive-key/route exclusions.
- `validation_events` rejects UPDATE/DELETE through a database trigger.
- Generated demo artifacts are ignored and written with restrictive local permissions.
- The documentation continues to distinguish synthetic fixture output from a completed human study.

## Required remediation order

1. Verify credential revocation and bind services to loopback; authenticate API/source identities and reject event-ID payload conflicts.
2. Make ingestion/projection and corrections transactional, repairable, deterministic, and scope-safe.
3. Add PostgreSQL failure/restart/concurrency and contract-conformance tests.
4. Reconcile stable actors and authoritative permission-denial evidence.
5. Implement the declared metric definitions and immutable freeze.
6. Scope the stale proxy by actor/session/query and serialize/test extension delivery; do not treat clicks as pass evidence.
7. Harden Supply List database transitions and fail closed on RLS no-op mutations.
8. Retire unsafe stale setup paths, separately review removal of unrelated personal scripts, align contracts/docs, and expand CI.
9. Re-run one fully composed synthetic workflow before any extension rehearsal or human experiment.

## Audit limits

The expert passes were read-only. They did not attempt a mutating exploit, change service state, test remote token validity, load the extension manually, or run human subjects. Host firewall/router isolation and dependency CVEs were not assessed.

---

## Dated Correction Addendum — 2026-08-22 23:45 CDT

### ORIGINAL AUDIT FINDING vs CORRECTED CURRENT STATE

| Topic | Original Audit Finding (Historical) | Corrected Current State (Verified) |
| --- | --- | --- |
| **Gate 2 PostgreSQL Lifecycle Tests** | Reported as missing Go-level integration coverage for experiment lifecycle, freeze, and restart. | **Stale / Corrected**: Demo PR #6 (`c558767`) was already merged into `main` prior to the audit. `backend/internal/store/postgres_integration_test.go` provides full Go integration coverage for experiment creation idempotency, conflict rejection, run isolation, `festival-v1.1` metrics preview, deterministic freeze receipt SHA-256 computation, database-enforced post-freeze write/correction rejection, snapshot immutability triggers, and store restart durability. All tests execute against isolated ephemeral schemas. |
| **Gate 3 Stale Proxy Composition** | Reported as an unwired global mock test that was bypassed by the live equipment test. | **Resolved**: Festival PR #8 (`0d555e1`) wired `scripts/demo/stale-proxy.mjs` (scoped by actor/session/credential/query with TTL) directly into `scripts/demo/run-equipment-test.sh` and `tests/demo/equipment-handoff.spec.ts`. Live two-session isolation was proven against local Supabase. |
| **Gate 3 Browser Extension Interception** | Reported as untested in live browser context. | **Current Status**: Extension queue serialization and transport status classification pass automated unit tests in Node. Live browser DOM + real rendered UI + unpacked Chrome extension exercise remains the final outstanding verification step. |
| **Metric Telemetry Inputs** | Formula implementation question. | **Documented Limitation**: 4.5 of 11 declared definitions return explicit undefined receipts because required input telemetry is not collected. This is an experimental methodology/input boundary, not a lifecycle integrity defect. |
