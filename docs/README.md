# Docs Index

Last synchronized with Demo: 2026-08-24 CDT

## Latest thesis-demo status

The sibling Demo repository is currently at:

```text
Gate 1  PASS  Evidence Authority
Gate 2  PASS  Lifecycle & PostgreSQL Enforcement
Gate 3  PASS  Live Browser Extension Ingestion
M4A     PASS  Claim vocabulary/model semantics
M4B     PASS  Claim ledger persistence
M4C     PASS  Evidence Reconciliation V0
M4D     PASS  Shared Build Validation / Evidence Ledger UI
M5A     NEXT  Information-value router V0
```

Current Demo milestone commits:

```text
31a5a18 feat: add evidence reconciliation v0
4d75c1f feat: add M4D evidence ledger UI (#9)
28bb48c Fix/cross platform browser workflow (#14)
```

## Cross-platform browser workflow — merged August 24, 2026

The browser hardening work is merged to `main` in both repositories:

```text
Fest PR #10  ->  681b8c94c5dfa881c9631dbfaefb3ef32ea3cee7
Demo PR #14  ->  28bb48c855f2bdaf5cd9fe7d6be5d54152c59487
```

Both PRs passed their final branch checks before merge, and the merge trees matched the audited PR-head trees. Festival now has local-environment validation, bounded owned-process cleanup, fail-closed export readiness, ambient Supabase-source protection, and deterministic artifact identity.

Strict producer identity:

```text
schemaVersion    1
service          festnest-browser-export
buildId          festnest-demo-001
scenarioId       equipment-handoff-v1
controlledRoute  /trips/10000000-0000-4000-8000-000000000001/camp-grid
artifactId       sha256:<64 lowercase hex characters>
```

Festival owns the export process and cleanup. Demo is a strict consumer and never stops an existing listener. No new exact-tip live browser, repeated workflow, native-WSL replay, or Festival -> Demo composed-runtime replay has been recorded on the merged `main` trees. The August 23 Gate 3 receipt remains historical. Codespaces manual forwarded-browser composition remains unsupported unless separately implemented.

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

Layers 1–3 and the M4D evidence-ledger UI are implemented in Demo. M5A, the router, remains the next milestone.

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

## Cross-repository evidence semantics

Demo's reconciled semantics intentionally classify contradict-only compatible evidence as
`Conflicted`. An expected database-enforced `denied_mutation` may positively support a
permission claim; `Blocked` requires an explicit blocked assessment. The Festival claim
catalog remains the normative description of expected Festival behavior.

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
9. Festival `docs/setup/cross-platform-workspace.md` — macOS/native-WSL compatibility contract.

## Historical documentation rule

Dated reports, test notes, session notes, and older handoffs are point-in-time evidence. Preserve them. Do not rewrite historical receipts merely because later work changed status.

For normal Festival product work, continue using `docs/handoffs/feature-handoff-index.md`, `docs/test-notes.md`, and the relevant feature/module docs.
