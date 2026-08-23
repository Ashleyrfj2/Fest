# QA Platform Integration Guide

This document describes how the Festival application integrates with the sibling Demo QA Platform.

## 1. Product and repository boundary

Festival is the real, rendered **source application and controlled validation environment**. Demo is the vendor-neutral **Validation-Evidence System of Record + Information-Value Router**.

Festival provides application behavior and source observations. Demo owns the validation-evidence semantics above those observations:

- `ClaimDefinition` identity;
- `EvidenceContext` identity;
- observation-to-claim linkage;
- evidence provenance and reconciliation;
- confidence, freshness, verification depth, source independence, context compatibility, and conflict handling;
- derived evidence labels such as **Solid / Weak / Stale / Conflicted / Untouched / Blocked**;
- recommendation events, accept/override feedback, and experiment metrics.

A Festival route or state visit is **not automatically knowledge that a behavior is valid**. Candidate-state identity remains useful capture/canonicalization infrastructure, while the refined product model reasons about behavioral claims and the evidence that supports or contradicts them.

## 2. Local integration target

- **Target Application**: Festival (React Native / Expo Web Export)
- **Browser Build Command**:

```bash
cd /Users/ashley/code/Festival
node scripts/export-browser-app.mjs
```

- **Local Application Target**: `http://127.0.0.1:4173`
- **Controlled Integration Route**: `/trips/10000000-0000-4000-8000-000000000001/camp-grid`
- **Verified Interaction Target**: `<BUTTON role="button">Start Building</BUTTON>`

## 3. Gate 3 integration verification

The live cross-repository Gate 3 integration between Festival and Demo was **successfully verified on August 23, 2026** (**STATUS: PASS**).

### Verified chain

1. Real Festival rendered DOM on `http://127.0.0.1:4173/trips/10000000-0000-4000-8000-000000000001/camp-grid`.
2. Real unpacked Demo Chrome MV3 extension with capture-phase click handling.
3. Event normalization and durable extension queue.
4. Authenticated delivery to `http://127.0.0.1:8080/api/v1/events`.
5. Demo candidate-scope canonicalization and `validation_events` persistence in PostgreSQL.
6. Exact session/event correlation.
7. Extension queue drain to `0`.

Final verified receipt:

- session: `session-gate3-final-1787473951348`
- event: `6671ec3f-a50e-4ab0-9d7f-701701ed17ea`

### What Gate 3 proves

Gate 3 proves the **Layer 1 ingestion foundation plus foundational Layer 2 plumbing**:

- passive unscripted browser capture;
- local masking/minimal payload behavior;
- durable delivery;
- authenticated source provenance;
- deterministic normalized event ingestion;
- candidate-state/context canonicalization;
- PostgreSQL persistence;
- exact source/session correlation.

Gate 3 does **not** by itself prove that Demo can accurately reconcile claim-level evidence, detect conflicts, or improve validation allocation. The August 23 refinement extends upward from this verified foundation rather than replacing it.

## 4. Refined four-layer relationship

```text
Festival / human / Playwright / agent / CI
        ↓
Layer 1 — Demo Ingestion + Normalization
        ↓
Layer 2 — Claim-Based Validation Ledger
  ClaimDefinition + EvidenceContext + Observation
        ↓
Layer 3 — Evidence Reconciliation
        ↓
Layer 4 — Information-Value Router
        ↓
Build Validation / Evidence Ledger UI
```

Festival remains an execution environment and source of observations. It does not decide whether evidence is sufficient or what should be validated next.

## 5. Accelerator-demo interpretation

The accelerator demo should use approximately **6–10 predefined Festival behavioral claims** rather than present generic state coverage as the product.

Target sequence:

1. a human performs a shallow action in Festival;
2. Demo records that observation and the relevant claim becomes **Weak**, not automatically Solid;
3. Playwright, an agent, a database verifier, or another independent source provides deeper evidence;
4. the claim becomes **Solid** or **Conflicted** depending on the result;
5. Demo recommends the highest-value weak/untouched/conflicted claim with explicit rationale;
6. a late-arriving human accepts or overrides the recommendation;
7. the ledger and recommendation order update.

Festival's controlled claim definitions are documented in `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`.

## 6. Trust boundaries and database isolation

The Festival and Demo repositories operate across strict, independent trust boundaries.

### Festival application database

`postgres/Supabase` on `127.0.0.1:54321`:

- stores Festival trip/application data, users, roles, equipment, invites, and application-side audit/activity data;
- is owned by Festival;
- must remain independent of Demo persistence and migrations.

### Demo QA database

`qa_platform` on `127.0.0.1:54332`:

- stores Demo validation events and derived QA-platform state;
- is owned by Demo;
- is the persistence boundary for the validation-evidence system.

### Mandatory rules

- Festival does **not** own Demo claim/evidence semantics, extension bearer tokens, recommendation state, or Demo database tables.
- Demo tools must not reset or mutate Festival Supabase except through the explicitly controlled application/test interfaces designed for the scenario.
- **Never** copy Supabase URLs, keys, JWTs, database credentials, migrations, reset commands, or bearer tokens between Festival and Demo.
- Never hardcode environment credentials or secrets in documentation or source files.
- Safety/Emergency data is outside the controlled thesis-demo scope.

## 7. Source-of-truth docs

Read in this order for thesis work:

1. Demo `docs/agent-logs/CURRENT.md` — current verified implementation state.
2. Demo `docs/architecture.md` — canonical four-layer product/data architecture.
3. Demo `docs/festival-virtual-qa-environment.md` — cross-repository execution runbook.
4. Festival `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md` — controlled behavioral claim vocabulary.
5. Festival `docs/thesis-demo/festival-virtual-qa-environment.md` — Festival-side environment/runbook.

Older dated reports remain historical verification receipts, not the current product architecture.