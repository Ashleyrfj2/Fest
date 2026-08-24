# Festival Virtual QA Environment — Festival-Side Runbook

Last synchronized with Demo: 2026-08-23 18:04 CDT

Use this with the sibling Demo repository's `docs/agent-logs/CURRENT.md`, `docs/architecture.md`, and `docs/festival-virtual-qa-environment.md`.

## Current truth boundary

```text
Gate 1  PASS
Gate 2  PASS
Gate 3  PASS
M4A     PASS
M4B     PASS
M4C     PASS
M4D     PASS
M5A     NEXT
```

Festival remains the controlled application/evidence source. Demo owns claim identity, evidence contexts, observation linkage, reconciliation, routing, corrections, UI evidence semantics, and experiment metrics.

Gate 3 verified:

```text
Festival rendered DOM
→ unpacked Demo Chrome MV3 extension
→ normalized ValidationEvent
→ durable queue
→ authenticated Demo Go API
→ candidate-scope canonicalization
→ Demo PostgreSQL persistence
→ exact session/event correlation
→ queue drain to zero
```

Final receipt:

```text
session = session-gate3-final-1787473951348
event   = 6671ec3f-a50e-4ab0-9d7f-701701ed17ea
```

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

Observation = validator result linked to a claim/context/run
```

A Festival state visit or click is not automatically proof that a behavioral claim is valid.

## Demo claim ledger/reconciliation now implemented

M4A/M4B/M4C are no longer future work in the sibling Demo repository.

Demo now has:

- persisted claim definitions;
- persisted evidence contexts;
- persisted observations;
- backend evidence reconciliation;
- derived `Solid / Weak / Stale / Conflicted / Untouched / Blocked` classes;
- context/freshness/depth/source-independence/conflict handling;
- deterministic reason text;
- read API `GET /api/v1/claims/evidence`.

The next primary Demo milestone is **M5A — transparent information-value router V0**.

## Verification depth

```text
1  surface / DOM
2  interaction / client mutation
3  backend/persistence / reload-requery
4  cross-system / asynchronous
```

A shallow successful click should generally remain Weak when the claim requires persistence/backend proof.

## Cross-repository evidence semantics

Demo intentionally labels contradict-only compatible evidence as `Conflicted`.
An expected database-enforced `denied_mutation` may positively support a permission
claim; `Blocked` requires an explicit blocked assessment. Festival behavior must remain
aligned with the controlled claim catalog.

## Canonical accelerator story

1. Start with a Build Validation / Evidence Ledger view.
2. Human naturally performs a shallow Festival action.
3. Demo attaches the observation to a controlled claim and shows **Weak** evidence.
4. Playwright/agent/backend verification provides deeper evidence.
5. Claim becomes **Solid** or meaningful disagreement becomes **Conflicted**.
6. The future information-value router recommends a high-value unresolved claim with explicit reason.
7. `late-tester-d` accepts or overrides.
8. Ledger and recommendation order update.

M4D is the next implementation milestone; the information-value router remains M5A.

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

Verified natural interaction target: `Start Building`.

## Seed/reset requirements

The controlled environment should preserve:

- four confirmed synthetic accounts;
- role matrix `leader=leader`, `editor-a=editor`, `viewer-b=viewer`, `late-tester-d=editor`;
- stable thesis-demo trip/scenario identity;
- controlled Supply List items including the canopy;
- synthetic activity only;
- ignored generated manifest;
- deterministic reset verification.

Reset/seed tooling must refuse unsafe remote destinations unless the explicit approved guard is supplied.

## Evidence sources

### Human browser capture

Demo's Chrome extension captures bounded minimal interaction evidence. Exclude credentials, cookies, raw request bodies, Safety/Emergency values, and arbitrary sensitive user text.

### Festival activity / authorization evidence

Festival activity/audit records and database-owned authorization denials can provide authoritative evidence for selected claims. The adapter normalizes source evidence but must not decide final Demo classification.

### Playwright/agent verifier

Use one deeper source in M6. Prefer persistence/backend/authorization verification over repeating the same DOM oracle.

## Trust boundaries

- Festival app data remains in Festival Supabase/Postgres.
- Demo evidence remains in Demo PostgreSQL on host port `54332`.
- Never copy credentials, migrations, JWTs, reset commands, database URLs, or service-role keys between repositories.
- A privileged mutation that should be denied but succeeds is a security failure; stop and investigate.

## Remaining shared roadmap

```text
M5A  Information-value router V0
M5B  Recommendation feedback
M6   Deeper Playwright/agent/backend source
M7   Accelerator demo
M8   Fixed-budget guided/control experiment
M9   Explicit build invalidation V0
```

Historical reports/session notes remain point-in-time receipts and should not be rewritten as current status.
