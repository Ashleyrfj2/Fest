# QA Next-Steps Agent Instructions — Historical

> **Superseded for thesis-demo work on August 23, 2026.**
>
> This file was the ready-to-run dispatch companion to `docs/reports/qa-next-steps-plan-2026-08-21.md`. It is retained as a historical record of the August 21 general Festival QA plan. Do **not** use it as the current QA-thesis implementation roadmap.

## Current thesis-demo reading order

For work on the sibling Demo QA thesis and its controlled Festival environment, read:

1. sibling Demo `docs/agent-logs/CURRENT.md`;
2. sibling Demo `docs/CANONICAL_MVP.md`;
3. sibling Demo `docs/architecture.md`;
4. sibling Demo `docs/EXPERIMENT_METRICS.md`;
5. sibling Demo `docs/festival-virtual-qa-environment.md`;
6. Festival `docs/QA_PLATFORM_INTEGRATION.md`;
7. Festival `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`;
8. Festival `docs/thesis-demo/festival-virtual-qa-environment.md`.

## Why this dispatch is no longer current

The August 21 dispatch predated both the final Gate 3 verification and the August 23 thesis refinement.

Current verified thesis infrastructure:

- Gate 1: PASS
- Gate 2: PASS
- Gate 3: PASS

The current product is a **Validation-Evidence System of Record + Information-Value Router**, centered on:

```text
ClaimDefinition + EvidenceContext + Observation
```

The next thesis work is not the old generic Festival QA queue. It is to extend the verified ingestion/persistence spine upward into:

```text
claim ledger
→ evidence reconciliation
→ Build Validation / Evidence Ledger UI
→ deeper Playwright/agent evidence
→ transparent information-value routing
→ human accept/override feedback
→ accelerator demo
→ fixed-budget guided/control experiment
```

## Historical August 21 dispatch scope

The original dispatch covered six broad Festival application-quality workstreams:

1. isolated Supabase authorization validation;
2. transactional leadership transfer;
3. realtime/offline integration coverage;
4. browser smoke coverage;
5. native map replay and web-map product decision;
6. CI and worktree release hygiene.

Those may still be useful as **general Festival product QA ideas**, but each must be re-evaluated against the current code and current product priorities before execution. They are not prerequisites for the accelerator thesis demo unless the current canonical runbook explicitly makes them so.

## Historical execution rules worth preserving

The following principles from the original dispatch remain valid for any future Festival work:

- inspect the current worktree before editing;
- preserve unrelated user changes;
- use isolated/local data for destructive testing;
- do not infer live authorization from static source inspection;
- keep credentials and private data out of logs/reports;
- prefer root-cause fixes and deterministic validation;
- report exact commands, results, limitations, and remaining risk;
- do not apply migrations to production without explicit approval.

## Archive rule

Do not recreate the old six-dispatch sequence merely because this file exists. Treat `docs/reports/qa-next-steps-plan-2026-08-21.md` and this file as dated historical planning artifacts.

For current thesis-demo tasks, follow the canonical documents listed at the top of this file.
