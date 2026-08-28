# Festival Virtual QA Environment — Festival-Side Runbook

Last synchronized with Demo: 2026-08-27 CDT

Use this with the sibling Demo repository's `docs/agent-logs/CURRENT.md`, `docs/architecture.md`, and `docs/festival-virtual-qa-environment.md`.

## Current truth boundary

```text
Gate 1  PASS
Gate 2  PASS
Gate 3  PASS  fresh exact-tip runtime receipt Aug 27
M4A     PASS
M4B     PASS
M4C     PASS
M4D     PASS
M5A     PASS  test-verified and merged in Demo
M5B     PASS  merged in Demo (#20)
Live M5B PASS override/retry/restart/frozen receipt Aug 27
M6      PASS  deeper heterogeneous Playwright/backend verifier — merged/live-verified
NEXT    M7 accelerator-demo recording
```

Festival remains the controlled application/evidence source. Demo owns claim identity, evidence contexts, observation linkage, reconciliation, routing, corrections, UI evidence semantics, recommendation feedback, and experiment metrics.

## Current merged baseline

Browser workflow hardening:

```text
Fest PR #10  ->  681b8c94c5dfa881c9631dbfaefb3ef32ea3cee7
Demo PR #14  ->  28bb48c855f2bdaf5cd9fe7d6be5d54152c59487
```

Declared test-suite reliability hardening:

```text
Fest PR #12  ->  9365daf69212812cc3555274e09018b872cd84c0
Demo PR #15  ->  19b014a10788644f558c78a9d2cc72039063c281
```

Demo M5A:

```text
Demo PR #17  ->  b354de9 feat: implement transparent information-value router v0 (M5A)
Demo PR #18  ->  merge receipt
Demo PR #20  ->  25574015 feat: add recommendation feedback and override flow (M5B)
Demo PR #23  ->  cebce76 feat: add deeper heterogeneous verifier evidence (M6)
```

Festival's current declared baseline is **49/49 deterministic tests**, **5/5 browser tests**, TypeScript PASS, and lint 0 errors with 3 pre-existing warnings.

Strict producer identity:

```text
schemaVersion    1
service          festnest-browser-export
buildId          festnest-demo-001
scenarioId       equipment-handoff-v1
controlledRoute  /trips/10000000-0000-4000-8000-000000000001/camp-grid
artifactId       sha256:<64 lowercase hex characters>
```

Festival owns the export process and cleanup. Demo is a strict consumer and never stops an existing listener.

## Current runtime evidence boundary

The August 23 receipt remains historical evidence. Fresh exact-tip Gate 3 and live M5B composed verification from August 27 are the current runtime truth:

```text
Festival rendered DOM
-> unpacked Demo Chrome MV3 extension
-> normalized ValidationEvent
-> durable queue
-> authenticated Demo Go API
-> candidate-scope canonicalization
-> Demo PostgreSQL persistence
-> exact session/event correlation
-> queue drain to zero
```

Historical August 23 receipt:

```text
session = session-gate3-final-1787473951348
event   = 6671ec3f-a50e-4ab0-9d7f-701701ed17ea
```

Current August 27 composed receipt:

```text
run       festival-runtime-replay-1787868328744-48e763
session   session-runtime-replay-1787868328744-48e763
event     511142f2-f6b1-4402-94e7-8a27ffec6dce
A         FEST-CLAIM-04
override  FEST-CLAIM-04 -> FEST-CLAIM-08
B         FEST-CLAIM-08
retry     HTTP 200; no duplicate progression
restart   same promoted progression reconstructed
freeze    b8cfb075e1dd55189e342dbd91dfe43ce61e84e2526ed2c565a33ff466911f9a
```

Native WSL composition remains unverified. Codespaces manual forwarded-browser composition remains unsupported unless separately implemented.

Current M6 composed proof:

```text
late-tester-d packs the controlled canopy
-> human/chrome-mv3 depth-1 supports
-> Weak
-> independent Playwright reload assertion
-> authoritative Festival Supabase REST assertion
-> agent/playwright depth-3 supports
-> Solid
-> Demo API restart
-> same Solid reconstruction
```

The negative guard proves failed authoritative verification submits no deeper observation; a controlled contradictory verifier observation derives `Conflicted`.

## Controlled V1 scope

Use only the shared group-equipment handoff for the accelerator demo.

```text
tenant_id       festival-thesis-demo
build_id        festnest-demo-001
environment_id  festnest-local-browser
scenario_id     equipment-handoff-v1
human actors    leader, editor-a, viewer-b, late-tester-d
agent actor     playwright-agent-c
```

Do not use Safety/Emergency data.

The controlled behavior catalog is:

```text
docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md
```

## Claim model

```text
ClaimDefinition = Target + StateSignature + ActorContext + ValidationIntent

EvidenceContext = Build + Environment + Tenant/Data Context
                + Feature Flags + optional Device/Region + time

Observation = validator result linked to claim/context/run
```

A Festival state visit or click is not automatically proof that a behavioral claim is valid.

## Demo claim ledger/reconciliation — implemented

Demo has persisted claim definitions, evidence contexts, observations, backend evidence reconciliation, derived `Solid / Weak / Stale / Conflicted / Untouched / Blocked` classes, context/freshness/depth/source-independence/conflict handling, deterministic reason text, and read API:

```text
GET /api/v1/claims/evidence
```

Verification depth:

```text
1  surface / DOM
2  interaction / client mutation
3  backend/persistence / reload-requery
4  cross-system / asynchronous
```

A shallow successful click should generally remain Weak when the claim requires persistence/backend proof.

## Demo Information-Value Router V0 — implemented

M5A ranks eligible claims using:

```text
ΔUncertainty × BusinessRisk × DiffImpact × SmoothedFailurePrior ÷ ExpectedCost
```

Current properties include versioned manual policy, novelty floor, role filtering, deterministic tie-breaking, exact feature-flag-aware scope, deterministic evidence-snapshot identity, immutable recommendation persistence, and reason/factor display in the Demo UI.

M5B preserves accept/dismiss behavior and adds explicit alternative-claim override + reason, backend-approved alternatives, immutable progression, and promotion linkage.

## Cross-repository evidence semantics

- Demo intentionally labels contradict-only compatible evidence as `Conflicted`.
- An expected database-enforced `denied_mutation` may positively support a permission claim; `Blocked` requires an explicit blocked assessment.
- Incompatible feature-flag contexts must not be blended into one M5A recommendation scope.
- Festival behavior must remain aligned with the controlled claim catalog; do not modify product behavior merely to satisfy Demo ranking assumptions.

## Canonical accelerator story

1. Start with a Build Validation / Evidence Ledger view.
2. Human naturally performs a shallow Festival action.
3. Demo attaches the observation to a controlled claim and shows **Weak** evidence.
4. Playwright/agent/backend verification provides deeper evidence.
5. Claim becomes **Solid** or meaningful disagreement becomes **Conflicted**.
6. M5A recommends a high-value unresolved claim with explicit reason.
7. M5B lets `late-tester-d` accept, dismiss, or explicitly override to another claim with a reason.
8. Ledger and recommendation order update.

The live M5B and M6 proofs are complete. **M7 accelerator-demo recording is next.** M7 packages and records this existing proof rather than inventing another backend milestone.

## Controlled Festival scenario

Useful behavior paths include:

- leader/editor creates shared equipment;
- editor claims an item;
- second signed-in session observes shared assignment;
- owner packs/unpacks equipment;
- viewer/non-owner attempts a restricted mutation and is denied at the database boundary;
- stale/offline presentation later converges to authoritative state;
- activity/audit records provide backend-owned evidence;
- Playwright verifies persistence or authorization at a deeper level.

These actions are sources of observations attached to claims, not the claim model itself.

## Deterministic Festival setup

A fresh browser-test run requires local Supabase to be running and reset before `npm run test:browser`; the browser exporter fails closed if the expected local Supabase environment is absent.

```bash
cd "$FESTIVAL_REPO_ROOT"
nvm install
nvm use
npm ci
npm run workspace:check
npm run lint -- --no-cache
npx tsc --noEmit
npm test
./scripts/demo/start-local-supabase.sh
npx supabase status
./scripts/demo/reset-demo.sh
npm run test:browser
```

Festival local ports:

```text
54321  Supabase API
54322  PostgreSQL
54323  Studio
54324  local inbox
```

Browser target:

```text
http://127.0.0.1:4173
```

Controlled Gate 3 route:

```text
/trips/10000000-0000-4000-8000-000000000001/camp-grid
```

## Seed/reset requirements

The controlled environment should preserve four confirmed synthetic accounts, the deterministic role matrix, stable thesis-demo trip/scenario identity, controlled Supply List items, synthetic activity only, ignored generated manifest, and deterministic reset verification.

Reset/seed tooling must refuse unsafe remote destinations unless the explicit approved guard is supplied.

## Evidence sources

### Human browser capture

Demo's Chrome extension captures bounded minimal interaction evidence. Exclude credentials, cookies, raw request bodies, Safety/Emergency values, and arbitrary sensitive user text.

### Festival activity / authorization evidence

Festival activity/audit records and database-owned authorization denials can provide authoritative evidence for selected claims. The adapter normalizes source evidence but must not decide final Demo classification.

### Playwright/agent verifier

M6 uses Playwright reload plus authoritative Festival Supabase verification for `FEST-CLAIM-04`. The deeper observation is submitted only after both assertions pass. Preserve that fail-closed boundary and prefer persistence/backend/authorization verification over repeating the same DOM oracle.

## Trust boundaries

- Festival app data remains in Festival Supabase/Postgres.
- Demo evidence remains in Demo PostgreSQL on host port `54332`.
- Never copy credentials, migrations, JWTs, reset commands, database URLs, or service-role keys between repositories.
- A privileged mutation that should be denied but succeeds is a security failure; stop and investigate.

## Remaining shared roadmap

```text
M5A  Transparent Information-Value Router V0 — PASS
M5B  Recommendation feedback / explicit override — PASS
      Live override/retry/restart/frozen receipt — PASS
M6   Deeper Playwright/agent/backend source — PASS, merged/live-verified
M7   Accelerator demo recording — NEXT
M8   Fixed-budget guided/control experiment
M9   Explicit build invalidation V0
```

Historical reports/session notes remain point-in-time receipts and should not be rewritten as current status.
