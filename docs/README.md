# Docs Index

Last synchronized with Demo: 2026-08-23 18:04 CDT

## Latest thesis-demo status

The sibling Demo repository is currently at:

```text
Gate 1  PASS  Evidence Authority
Gate 2  PASS  Lifecycle & PostgreSQL Enforcement
Gate 3  PASS  Live Browser Extension Ingestion
M4A     PASS  Claim vocabulary/model semantics
M4B     PASS  Claim ledger persistence
M4C     PASS  Evidence Reconciliation V0
M4D     NEXT  Shared Build Validation / Evidence Ledger UI
```

Current Demo M4C commit:

```text
31a5a18 feat: add evidence reconciliation v0
```

M4C was verified before commit with **25/25 backend integration tests** and **7/7 Gate 3 preflight checks**.

## Product framing

Demo is the **Validation-Evidence System of Record + Information-Value Router**.

Festival remains the controlled source application/environment and evidence source.

The core evidence model is:

```text
ClaimDefinition + EvidenceContext + Observation
```

A Festival route/state visit is not automatically proof that a behavior is valid.

## Current four-layer model

```text
Layer 1 — Ingestion + Normalization
Layer 2 — Claim-Based Validation Ledger
Layer 3 — Evidence Reconciliation
Layer 4 — Information-Value Router
```

Layers 1–3 now have an implemented backend foundation in Demo. M4D is the next UI milestone. The router remains future work.

## Current controlled Festival claim catalog

Use:

```text
docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md
```

The current catalog contains 8 controlled behavioral claims for the group-equipment handoff scenario. Source independence is an evidence-reconciliation concern in Demo, not a Festival behavior claim.

## Accelerator-demo direction

Target sequence:

1. human performs a shallow Festival action;
2. Demo records the observation and the claim remains **Weak**;
3. deeper Playwright/agent/backend verification adds stronger evidence;
4. claim becomes **Solid** or meaningful disagreement becomes **Conflicted**;
5. the router later recommends a high-value unresolved claim with explicit rationale;
6. late-arriving human accepts or overrides;
7. evidence ledger and recommendation order update.

Primary UI language should be **Build Validation**, **Validation Evidence**, or **Evidence Ledger**.

## Cross-repository M4C semantic follow-ups

Do not rewrite Festival claim semantics to match these current Demo implementation quirks. Resolve them in Demo code/tests before the final demo relies on them:

1. Demo currently classifies contradict-only compatible evidence as `Conflicted` even when no supporting observation exists.
2. Demo currently treats a `verifier_result` containing `denied_mutation` as `Blocked` before evaluating a supporting assessment. Festival permission/ownership claims intentionally treat a database-enforced denial as positive evidence that authorization worked.

The Festival claim catalog remains the normative description of expected Festival behavior.

## Where to read first

For thesis-demo work:

1. Demo `docs/agent-logs/CURRENT.md` — authoritative implementation status.
2. Demo `docs/CANONICAL_MVP.md` — current product/MVP definition.
3. Demo `docs/architecture.md` — architecture and M4C semantics.
4. Demo `docs/festival-virtual-qa-environment.md` — Demo-side runbook.
5. Demo `docs/EXPERIMENT_METRICS.md` — experiment definitions.
6. Festival `docs/QA_PLATFORM_INTEGRATION.md` — cross-repository boundary.
7. Festival `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md` — controlled behavior claims.
8. Festival `docs/thesis-demo/festival-virtual-qa-environment.md` — Festival-side runbook.

## Historical documentation rule

Dated reports, test notes, session notes, and older handoffs are point-in-time evidence. Preserve them. Do not rewrite historical receipts merely because later work changed status.

For normal Festival product work, continue using `docs/handoffs/feature-handoff-index.md`, `docs/test-notes.md`, and the relevant feature/module docs.
