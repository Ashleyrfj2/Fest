# Docs Index

## Latest Thesis-Demo Status — August 23, 2026

- **Gate 1 — Evidence Authority:** **PASS**.
- **Gate 2 — Experiment Lifecycle / PostgreSQL Enforcement:** **PASS**.
- **Gate 3 — Live Browser Extension Ingestion:** **PASS**, verified August 23, 2026.
- The verified cross-repository chain is Festival rendered DOM → unpacked Demo Chrome MV3 extension → normalized event → durable queue → authenticated Demo Go API → candidate-scope canonicalization → Demo PostgreSQL persistence → exact session/event correlation → queue drain to zero.
- Gate 3 proves the capture/provenance/persistence foundation. It does **not** by itself prove the August 23 claim-reconciliation or information-value-routing thesis.
- The current MVP direction is to **extend upward from Gate 3**, not rebuild it.

## Current Product Framing

The sibling Demo platform is a **Validation-Evidence System of Record + Information-Value Router**.

A state visit is not treated as knowledge. Candidate-state identity remains useful supporting infrastructure, but the primary product model is:

```text
ClaimDefinition + EvidenceContext + Observation
```

The current four-layer model is:

```text
Layer 1 — Ingestion + Normalization
Layer 2 — Claim-Based Validation Ledger
Layer 3 — Evidence Reconciliation
Layer 4 — Information-Value Router
```

Festival remains the controlled source application/environment. Demo owns claim identity, evidence contexts, observation linkage, evidence reconciliation, conflict/freshness/depth/source-independence semantics, recommendations, correction history, and experiment metrics.

## Current Accelerator-Demo Direction

The accelerator demo should use approximately **6–10 predefined Festival behavioral claims** rather than treating a generic coverage map as the centerpiece.

Target demo sequence:

1. a human performs a shallow action in Festival;
2. the relevant claim becomes **Weak**, not automatically Solid;
3. Playwright/agent/backend verification adds deeper evidence, producing **Solid** or **Conflicted**;
4. the router recommends a high-risk Weak/Untouched/Conflicted claim with explicit reason text;
5. a late-arriving human accepts or overrides;
6. the evidence ledger and recommendation order update.

Prefer **Build Validation**, **Validation Evidence**, or **Evidence Ledger** as primary product/UI language. State maps and heatmaps may remain supporting visualizations.

## Where to Read First

For shared thesis-demo work, use this order:

1. sibling Demo `docs/agent-logs/CURRENT.md` — authoritative current verification state and immediate next work;
2. sibling Demo `docs/CANONICAL_MVP.md` — compact canonical product/MVP definition;
3. sibling Demo `docs/architecture.md` — claim-ledger / reconciliation / router architecture;
4. sibling Demo `docs/EXPERIMENT_METRICS.md` — fixed-budget experiment and metric definitions;
5. sibling Demo `docs/festival-virtual-qa-environment.md` — executable cross-repository demo runbook;
6. this repo's `docs/QA_PLATFORM_INTEGRATION.md` — Festival ↔ Demo trust boundary and verified Gate 3 integration;
7. this repo's `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md` — controlled Festival claim catalog;
8. this repo's `docs/thesis-demo/festival-virtual-qa-environment.md` — Festival-side controlled environment guidance;
9. this repo's `docs/thesis-demo/TEST_NOTES_ADDENDUM_2026-08-23.md` when reading older chronological thesis entries in `docs/test-notes.md`.

Older reports, test-note blocks, agent dispatch documents, and dated session notes remain useful historical receipts. Do not use superseded point-in-time status language from them as the current product architecture or gate truth.

## Historical Thesis-Work Rule

Do not rewrite dated receipts merely because later work changed the status. Add a superseding addendum or direct readers to the canonical current docs instead. This preserves evidence of what was known and verified at each point in time without allowing old prose to mislead future agents.

The August 21 QA follow-up plan and its agent dispatch instructions are general Festival QA history, not the current thesis-demo roadmap. For thesis implementation, follow the current Demo roadmap and Festival claim/runbook documents listed above.

## Historical Product/App Documentation

Safety PIN rehydration and stale-cache unlock mitigations were implemented in June; April priority text is historical.

Documentation is organized by purpose:

- `product/` — Festival product and system specs
  - `data-model.md`
  - `design-spec.md`
  - `feature-completion.md`
  - `features.md`
  - `onboarding.md`
  - `trip-system.md`
  - `ui-decisions.md`
  - `stretch.md`
- `setup/` — setup and infrastructure guides
  - `auth-system.md`
  - `notion-mcp-setup.md`
  - `supabase-setup.md`
  - `testing-database.md`
- `handoffs/` — implementation handoff docs by feature
- `reports/` — implementation reports and checklists
- `sessions/` — dated session notes
- `modules/` — module-specific deep docs
  - `camp-grid/`
- `thesis-demo/` — controlled Festival environment and current thesis-specific docs

If you are starting a normal Festival feature, begin with `handoffs/feature-handoff-index.md`. If you are working on the thesis demo, begin with the shared current-status and architecture sources listed above.
