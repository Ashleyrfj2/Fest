# Docs Index

Last synchronized with Demo: 2026-08-27 CDT

## Latest thesis-demo status

The sibling Demo repository is currently at:

```text
Gate 1  PASS  Evidence Authority
Gate 2  PASS  Lifecycle & PostgreSQL Enforcement
Gate 3  PASS  Live Browser Extension Ingestion — fresh exact-tip receipt Aug 27
M4A     PASS  Claim vocabulary/model semantics
M4B     PASS  Claim ledger persistence
M4C     PASS  Evidence Reconciliation V0
M4D     PASS  Shared Build Validation / Evidence Ledger UI
M5A     PASS  Transparent Information-Value Router V0 — test-verified and merged
M5B     PASS  Recommendation feedback / explicit override — merged in Demo
Live M5B PASS Override/retry/restart/frozen composed receipt Aug 27
```

Current Demo milestone commits include:

```text
31a5a18 feat: add evidence reconciliation v0
4d75c1f feat: add M4D evidence ledger UI (#9)
28bb48c Fix/cross platform browser workflow (#14)
b354de9 feat: implement transparent information-value router v0 (M5A) (#17)
```

M5A passed Demo's complete local validation, PostgreSQL integration **19/19**, frontend **12/12** plus production build, backend unit **29/29**, and extension/contract/safety/trust-boundary checks.

## Current merged cross-repository baseline

Browser hardening is merged to `main` in both repositories:

```text
Fest PR #10  ->  681b8c94c5dfa881c9631dbfaefb3ef32ea3cee7
Demo PR #14  ->  28bb48c855f2bdaf5cd9fe7d6be5d54152c59487
```

Declared test-suite reliability hardening is also merged:

```text
Fest PR #12  ->  9365daf69212812cc3555274e09018b872cd84c0
Demo PR #15  ->  19b014a10788644f558c78a9d2cc72039063c281
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

The August 23 Gate 3 receipt remains valid historical evidence, but fresh August 27 receipts now prove the current exact-tip Festival → unpacked Demo extension → authenticated Demo API → PostgreSQL spine and the live M5B override/progression workflow through exact retry, API restart, and frozen receipt reconstruction. Native WSL composition remains outstanding. Codespaces manual forwarded-browser composition remains unsupported unless separately implemented.

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

All four layers now have an implemented and composed-runtime-verified MVP foundation through M5B. M6 is next and has not started.

M5B preserves M5A's exact feature-flag-aware recommendation scope and adds immutable accept/dismiss/override feedback, backend-approved alternatives, progression snapshots, and promotion linkage. The live proof exercised explicit alternative-claim override + reason without changing Festival-owned routing semantics.

## Current controlled Festival claim catalog

Use:

```text
docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md
```

The current catalog contains 8 controlled behavioral claims for the group-equipment handoff scenario. Source independence and recommendation ranking are Demo concerns, not Festival behavior claims.

## Accelerator-demo direction

Target sequence:

1. human performs a shallow Festival action;
2. Demo records the observation and the claim remains **Weak**;
3. deeper Playwright/agent/backend verification adds stronger evidence;
4. claim becomes **Solid** or meaningful disagreement becomes **Conflicted**;
5. M5A recommends a high-value unresolved claim with explicit rationale;
6. M5B lets the late-arriving human accept, dismiss, or explicitly override to another claim with a reason;
7. evidence ledger and recommendation order update.

Primary UI language should be **Build Validation**, **Validation Evidence**, or **Evidence Ledger**.

## Where to read first

For thesis-demo work:

1. Demo `docs/agent-logs/CURRENT.md` — authoritative implementation status.
2. Demo `docs/CANONICAL_MVP.md` — current product/MVP definition.
3. Demo `docs/architecture.md` — current architecture and M4C/M5A semantics.
4. Demo `docs/festival-virtual-qa-environment.md` — Demo-side runbook.
5. Demo `docs/EXPERIMENT_METRICS.md` — experiment definitions.
6. Festival `docs/QA_PLATFORM_INTEGRATION.md` — cross-repository boundary.
7. Festival `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md` — controlled behavior claims.
8. Festival `docs/thesis-demo/festival-virtual-qa-environment.md` — Festival-side runbook.
9. Festival `docs/setup/cross-platform-workspace.md` — macOS/native-WSL compatibility contract.

## Historical documentation rule

Dated reports, test notes, session notes, and older handoffs are point-in-time evidence. Preserve them. Do not rewrite historical receipts merely because later work changed status.

For normal Festival product work, continue using `docs/handoffs/feature-handoff-index.md`, `docs/test-notes.md`, and the relevant feature/module docs.
