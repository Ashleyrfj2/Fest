# QA Platform Integration Guide

Last synchronized with Demo: 2026-08-23 18:04 CDT

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
Gate 3  PASS
M4A     PASS
M4B     PASS
M4C     PASS
M4D     NEXT
```

Current Demo M4C commit:

```text
31a5a18 feat: add evidence reconciliation v0
```

M4C verification before commit: **25/25 backend integration tests PASS** and **7/7 Gate 3 preflight checks PASS**.

## Local integration target

- Repository: `Ashleyrfj2/Fest`
- Browser export:

```bash
cd "$FESTIVAL_REPO_ROOT"
node scripts/export-browser-app.mjs
```

- Festival web: `http://127.0.0.1:4173`
- Controlled route: `/trips/10000000-0000-4000-8000-000000000001/camp-grid`
- Verified Gate 3 natural interaction: `Start Building`

## Gate 3 verification

Verified on 2026-08-23:

```text
Festival rendered DOM
→ unpacked Demo Chrome MV3 extension
→ capture-phase click handling
→ normalized ValidationEvent
→ durable extension queue
→ authenticated Demo Go API
→ candidate-scope canonicalization
→ Demo PostgreSQL persistence
→ exact session/event correlation
→ queue drain to 0
```

Final receipt:

```text
session = session-gate3-final-1787473951348
event   = 6671ec3f-a50e-4ab0-9d7f-701701ed17ea
```

Gate 3 proves capture/provenance/delivery/persistence. It does not by itself prove the claim-level economic thesis.

## Claim and evidence model

```text
ClaimDefinition = Target + StateSignature + ActorContext + ValidationIntent

EvidenceContext = Build + Environment + Tenant/Data Context
                + Feature Flags + optional Device/Region + time

Observation = validator result linked to claim/context/run
```

Festival provides application behavior and evidence sources. Demo decides evidence sufficiency/classification.

## M4A/M4B now implemented in Demo

Demo now persists claim definitions, evidence contexts, and observations. These are no longer future schema work.

Important migration history:

- Demo `0006_claim_evidence_ledger.sql` is empty in committed history.
- Demo `0007_reconciliation_v0.sql` is the first reproducible migration containing the claim-ledger schema and includes a forward repair for pre-existing M4B observations constraints.

Festival must not copy or apply Demo migrations.

## M4C now implemented in Demo

Demo exposes:

```text
GET /api/v1/claims/evidence
```

and computes backend-derived classifications:

```text
Solid / Weak / Stale / Conflicted / Untouched / Blocked
```

The current summary includes verification depth, freshness/context, source/observation counts, conflicts, reason text, and a nullable non-probabilistic heuristic score.

Verification depth:

```text
1  surface / DOM
2  client interaction/mutation
3  backend/persistence/reload-requery
4  cross-system/asynchronous
```

## Controlled Festival claim catalog

Use:

```text
docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md
```

The current controlled set contains 8 behavioral claims for the group-equipment handoff scenario.

Festival behavior claims remain normative for expected application behavior. Source independence/classification belongs to Demo.

## Known M4C cross-repository semantic follow-ups

Before the final demo relies on authorization/conflict edge cases:

1. Demo currently labels contradict-only compatible evidence `Conflicted` even if there is no supporting observation.
2. Demo currently treats `verifier_result` containing `denied_mutation` as `Blocked` before evaluating a supporting assessment. Festival authorization claims intentionally treat database-enforced denial as positive evidence that permission enforcement worked.

These are Demo reconciliation implementation follow-ups. Do not weaken Festival authorization behavior or rewrite the claim catalog to hide them.

## Next milestone

**M4D — Shared Build Validation / Evidence Ledger UI** in Demo.

The UI should consume Demo's M4C API rather than recompute evidence classifications.

The eventual accelerator sequence remains:

1. human shallow observation → **Weak**;
2. deeper verifier → **Solid** or meaningful disagreement → **Conflicted**;
3. information-value router recommends a high-value unresolved claim with explicit rationale;
4. late human accepts or overrides;
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
