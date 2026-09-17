# Festival QA Follow-up Execution Plan — Historical

> **Archived August 23, 2026.** This file records the broad Festival QA follow-up plan created on August 21. It is no longer the active QA-thesis roadmap.

## Current authority for thesis-demo work

Use, in order:

1. sibling Demo `docs/agent-logs/CURRENT.md`;
2. sibling Demo `docs/CANONICAL_MVP.md`;
3. sibling Demo `docs/architecture.md`;
4. sibling Demo `docs/EXPERIMENT_METRICS.md`;
5. sibling Demo `docs/festival-virtual-qa-environment.md`;
6. Festival `docs/QA_PLATFORM_INTEGRATION.md`;
7. Festival `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`;
8. Festival `docs/thesis-demo/festival-virtual-qa-environment.md`.

## Historical context

Date: 2026-08-21

The original plan followed a senior QA pass over Festival and proposed six broad application-quality workstreams:

1. validate migrations and authorization in an isolated Supabase environment;
2. make leadership transfer transactional;
3. add realtime/reconnect/offline integration coverage;
4. add browser smoke coverage;
5. replay native map behavior and decide the web-map product boundary;
6. improve CI and worktree/release hygiene.

The plan correctly emphasized that static lint/type/test success was not proof of live authorization or runtime correctness. It also required isolated test environments, explicit evidence receipts, and separation between static, integration, E2E, and manual/native validation.

Those principles remain useful for general Festival product QA.

## Why it is not the current thesis roadmap

The August 21 plan predates two major changes:

### 1. Gate 3 is now verified

Current thesis infrastructure status:

- Gate 1 — PASS
- Gate 2 — PASS
- Gate 3 — PASS

The real Festival DOM → unpacked Demo Chrome extension → authenticated Go API → Demo PostgreSQL persistence chain has been verified end to end.

### 2. The thesis was refined on August 23

The product is now a **Validation-Evidence System of Record + Information-Value Router**.

The primary product model is:

```text
ClaimDefinition + EvidenceContext + Observation
```

The current work extends the verified foundation into:

```text
claim-level persistence
→ evidence reconciliation
→ Build Validation / Evidence Ledger UI
→ deeper human + agent/Playwright evidence
→ transparent information-value routing
→ recommendation feedback
→ accelerator demo
→ fixed-budget guided/control experiment
```

General Festival work from the August 21 plan should be scheduled only when it is independently valuable to the application or when the current thesis runbook explicitly requires it.

## Historical release principles retained

For any future Festival QA work:

- do not claim live RLS/RPC verification from source inspection alone;
- do not use production credentials or real private data for destructive testing;
- preserve unrelated user changes;
- test security and data-integrity boundaries at the authoritative backend when applicable;
- distinguish verified live behavior from static/source assertions;
- record exact commands, pass/fail results, artifacts, and limitations;
- do not convert an untested native/device gap into a PASS.

## Archive note

The old detailed dispatch companion is preserved at:

`docs/agents/qa-next-steps-agent-instructions-2026-08-21.md`

It is also marked historical and must not be treated as the active thesis-demo execution queue.
