# Thesis Demo Test-Notes Addendum — August 23, 2026

This addendum exists because `docs/test-notes.md` is a long chronological QA record containing many intentionally preserved August 22 status snapshots. Those entries remain useful historical receipts, but several statements about Gate 3 and the product model are now superseded.

## Current gate status

- **Gate 1 — Evidence Authority:** **PASS**
- **Gate 2 — Lifecycle & PostgreSQL Enforcement:** **PASS**
- **Gate 3 — Live Browser Extension Ingestion:** **PASS**

Final Gate 3 receipt:

```text
session = session-gate3-final-1787473951348
event   = 6671ec3f-a50e-4ab0-9d7f-701701ed17ea
```

Verified live chain:

```text
Festival rendered DOM
→ unpacked Demo Chrome MV3 extension
→ capture-phase browser interaction
→ normalized ValidationEvent
→ durable extension queue
→ authenticated Demo Go API
→ candidate-scope canonicalization
→ Demo PostgreSQL persistence
→ exact session/event correlation
→ queue drain to zero
```

Any older `docs/test-notes.md` entry saying that live browser DOM + unpacked extension verification is still pending should be read as historical context for the point in time when it was written.

## Current product interpretation

The thesis is now a **Validation-Evidence System of Record + Information-Value Router**.

A state visit is not knowledge. The primary product model is:

```text
ClaimDefinition + EvidenceContext + Observation
```

Candidate-state and transition records remain useful infrastructure and historical experiment data, but they are not the final unit of evidence sufficiency.

Current layers:

```text
1. Ingestion + Normalization
2. Claim-Based Validation Ledger
3. Evidence Reconciliation
4. Information-Value Router
```

## Festival role

Festival remains the controlled source application and evidence environment. Demo owns:

- claim identity;
- evidence contexts;
- observation-to-claim linkage;
- evidence depth/freshness/source-independence/context/conflict semantics;
- derived labels such as Solid / Weak / Stale / Conflicted / Untouched / Blocked;
- next-validation recommendations;
- recommendation feedback;
- experiment metrics.

## Current controlled claim scope

Use the controlled catalog:

`docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`

The accelerator demo should use roughly 6–10 predefined claims rather than attempt to enumerate every semantic application state.

## Current visible demo sequence

```text
human shallow evidence
→ claim = Weak
→ deeper Playwright/agent/backend verification
→ claim = Solid or Conflicted
→ information-value recommendation + reason
→ late human accepts or overrides
→ ledger and ranking update
```

## Experiment interpretation

The current primary metric is **Useful Validation Yield**:

```text
preregistered evidence points / actor-hours
```

Additional guardrails/diagnostics include:

- false-confidence rate;
- low-information actor-minutes;
- high-risk/deep-state recall;
- recommendation acceptance / override / dismissal;
- evidence produced after recommendation response;
- correction/error rates in claim linkage and reconciliation;
- capture/transport overhead.

Do not treat every repeat as waste and do not define success using an undefined denominator such as “90% of all semantic states.”

## Historical-record rule

Do not rewrite older chronological test-note blocks solely to make their old point-in-time statements sound current. Preserve them as receipts and use this addendum plus the current canonical docs for present truth.

Current reading order:

1. sibling Demo `docs/agent-logs/CURRENT.md`;
2. sibling Demo `docs/CANONICAL_MVP.md`;
3. sibling Demo `docs/architecture.md`;
4. sibling Demo `docs/EXPERIMENT_METRICS.md`;
5. Festival `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`;
6. Festival `docs/thesis-demo/festival-virtual-qa-environment.md`;
7. this addendum when reading historical `docs/test-notes.md` entries.
