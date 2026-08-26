# QA Platform Integration Guide

Last synchronized with Demo: 2026-08-26 CDT

This document describes how Festival integrates with the sibling Demo QA Platform.

## Product and repository boundary

Festival is the real rendered **source application and controlled validation environment**.

Demo is the vendor-neutral **Validation-Evidence System of Record + Information-Value Router** and owns:

- `ClaimDefinition` identity;
- `EvidenceContext` identity;
- observation-to-claim linkage;
- evidence provenance and reconciliation;
- derived evidence labels;
- next-validation routing;
- recommendation feedback/corrections;
- experiment metrics.

A Festival route/state visit is not automatically proof that a behavior is valid.

## Current shared milestone status

```text
Gate 1  PASS
Gate 2  PASS
Gate 3  PASS  historical live receipt from Aug 23
M4A     PASS
M4B     PASS
M4C     PASS
M4D     PASS
M5A     PASS  test-verified and merged in Demo
M5B     NEXT
```

Current Demo milestone commits include:

```text
31a5a18 feat: add evidence reconciliation v0
4d75c1f feat: add M4D evidence ledger UI (#9)
28bb48c Fix/cross platform browser workflow (#14)
b354de9 feat: implement transparent information-value router v0 (M5A) (#17)
```

## Current merged browser/test status

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

Festival's merged declared baseline is **49/49 deterministic tests**, **5/5 browser tests**, TypeScript PASS, and lint 0 errors / 3 pre-existing warnings.

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

Historical Gate 3 live verification from August 23:

```text
Festival rendered DOM
-> unpacked Demo Chrome MV3 extension
-> capture-phase click handling
-> normalized ValidationEvent
-> durable extension queue
-> authenticated Demo Go API
-> candidate-scope canonicalization
-> Demo PostgreSQL persistence
-> exact session/event correlation
-> queue drain to 0
```

Receipt:

```text
session = session-gate3-final-1787473951348
event   = 6671ec3f-a50e-4ab0-9d7f-701701ed17ea
```

A new exact-tip live Festival → extension → Demo API → PostgreSQL composed replay has not yet been recorded after the latest browser/test-hardening and M5A merges. Repeated live workflow and native WSL composition remain unverified.

## Local integration target

- Repository: `Ashleyrfj2/Fest`
- Browser export:

```bash
cd "$FESTIVAL_REPO_ROOT"
node scripts/export-browser-app.mjs
```

- Festival web: `http://127.0.0.1:4173`
- Controlled route: `/trips/10000000-0000-4000-8000-000000000001/camp-grid`
- Historical Gate 3 natural interaction: `Start Building`

## Claim and evidence model

```text
ClaimDefinition = Target + StateSignature + ActorContext + ValidationIntent

EvidenceContext = Build + Environment + Tenant/Data Context
                + Feature Flags + optional Device/Region + time

Observation = validator result linked to claim/context/run
```

Festival provides application behavior and evidence sources. Demo decides evidence sufficiency/classification and recommendation ranking.

## Demo claim ledger/reconciliation — implemented

Demo persists claim definitions, evidence contexts, and observations and exposes:

```text
GET /api/v1/claims/evidence
```

with backend-derived:

```text
Solid / Weak / Stale / Conflicted / Untouched / Blocked
```

Verification depth:

```text
1  surface / DOM
2  client interaction/mutation
3  backend/persistence/reload-requery
4  cross-system/asynchronous
```

Migration history relevant to integration:

- Demo `0006_claim_evidence_ledger.sql` is empty in committed history.
- Demo `0007_reconciliation_v0.sql` is the first reproducible claim-ledger migration and forward-repairs the M4B `blocked` constraint.
- Demo `0008_information_value_router_v0.sql` is the M5A recommendation persistence/scope/immutability migration.

Festival must not copy or apply Demo migrations.

## Demo Information-Value Router V0 — implemented

M5A ranks eligible claims with:

```text
ΔUncertainty × BusinessRisk × DiffImpact × SmoothedFailurePrior ÷ ExpectedCost
```

M5A includes versioned manual policy, novelty floor, role filtering, deterministic tie-breaking, exact run/build/environment/scenario/device/region/**feature-flag**/actor/role scope, deterministic evidence-snapshot identity, immutable recommendation persistence, and reason/factor display in the UI.

Existing accept/dismiss behavior is preserved. Explicit alternative-claim override + reason remains M5B.

## Controlled Festival claim catalog

Use:

```text
docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md
```

The current controlled set contains 8 behavioral claims for the group-equipment handoff scenario. Festival behavior claims remain normative; source independence/classification/ranking belong to Demo.

## Cross-repository semantics

- Compatible contradict-only evidence intentionally derives `Conflicted`.
- An expected database-enforced `denied_mutation` may support a permission claim; `Blocked` requires an explicit blocked assessment.
- Incompatible feature-flag configurations must not be mixed into one M5A recommendation scope.
- Festival should never be modified merely to satisfy Demo's ranking assumptions.

## Next milestone

**M5B — Recommendation Feedback** in Demo, preferably after a fresh exact-tip composed runtime verification of the current merged trees.

The intended accelerator sequence is:

1. human shallow observation -> **Weak**;
2. deeper verifier -> **Solid** or meaningful disagreement -> **Conflicted**;
3. M5A recommends a high-value unresolved claim with explicit rationale;
4. M5B lets the late human accept, dismiss, or explicitly override to another claim with a reason;
5. ledger and recommendation order update.

## Trust boundaries and ports

### Festival local Supabase

```text
54321  Supabase API
54322  Festival PostgreSQL
54323  Studio
54324  local email inbox
```

### Demo

```text
5173   Demo frontend
8080   Demo API
54332  Demo PostgreSQL
```

Mandatory rules:

- Festival application data stays in Festival Supabase/Postgres.
- Demo evidence stays in Demo PostgreSQL.
- Festival does not own Demo bearer credentials, reconciliation tables, recommendations, or metrics.
- Demo tools must not reset Festival Supabase except through approved controlled application/test interfaces.
- Never copy keys, JWTs, database URLs, migrations, reset commands, or bearer tokens between repositories.
- Safety/Emergency data is outside the controlled thesis-demo scope.

## Source-of-truth reading order

1. Demo `docs/agent-logs/CURRENT.md`
2. Demo `docs/CANONICAL_MVP.md`
3. Demo `docs/architecture.md`
4. Demo `docs/festival-virtual-qa-environment.md`
5. Demo `docs/EXPERIMENT_METRICS.md`
6. Festival `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`
7. Festival `docs/thesis-demo/festival-virtual-qa-environment.md`

Older dated reports remain historical verification receipts, not current implementation status.
