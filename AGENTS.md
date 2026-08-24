# Agent Operating Guide — Festival / FestNest

Last thesis synchronization: 2026-08-24 CDT

This file is required reading for agent work in `Ashleyrfj2/Fest`.

## Start every task here

1. Inspect `git status --short` and preserve existing user changes.
2. Read `README.md`, `docs/README.md`, and the relevant feature/module docs.
3. For thesis-demo work, read `docs/QA_PLATFORM_INTEGRATION.md`, `docs/thesis-demo/festival-virtual-qa-environment.md`, and `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`.
4. When the sibling Demo checkout exists, read its `AGENTS.md` and `docs/agent-logs/CURRENT.md`.
5. Resolve roots dynamically with `git rev-parse --show-toplevel`; never depend on `/Users/...` paths.
6. Use local/synthetic data for thesis work. Never reset or seed a shared/production Festival project without explicit approval.
7. Treat historical reports/session notes as point-in-time receipts, not current thesis status.

## Project description

FestNest is an Expo/React Native/TypeScript application for coordinating group camping-festival trips. Festival is also the controlled source application for the QA thesis demo.

Festival owns application behavior, local Supabase state, authorization/RLS/RPC behavior, deterministic seed/reset tooling, activity/audit source records, and the rendered browser target.

The sibling Demo repository owns validation-evidence semantics, reconciliation, routing, and experiment metrics.

## Current thesis-demo status

Do not redo these shared milestones:

```text
Gate 1  PASS
Gate 2  PASS
Gate 3  PASS
M4A     PASS
M4B     PASS
M4C     PASS
M4D     PASS
M5A     NEXT
```

Current Demo milestone commits on `main`:

```text
31a5a18 feat: add evidence reconciliation v0
4d75c1f feat: add M4D evidence ledger UI (#9)
28bb48c Fix/cross platform browser workflow (#14)
```

M4C verification before commit: **25/25 backend integration tests PASS** and **7/7 Gate 3 preflight checks PASS**.

## Current thesis model

```text
ClaimDefinition = Target + StateSignature + ActorContext + ValidationIntent

EvidenceContext = Build + Environment + Tenant/Data Context
                + Feature Flags + optional Device/Region + time

Observation = validator result linked to claim/context/run
```

Festival does not decide whether a claim is Solid, Weak, Stale, Conflicted, Untouched, or Blocked. Those classes are backend-derived in Demo.

## Controlled claim catalog

Use:

```text
docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md
```

The current controlled set contains 8 behavioral claims for the group-equipment handoff scenario.

Canonical deterministic roles:

```text
leader         leader
editor-a       editor
viewer-b       viewer
late-tester-d  editor
```

Do not use Safety/Emergency data in the thesis demo.

## Resolved Demo M4C semantics

Festival behavior remains normative. Compatible contradict-only evidence intentionally derives `Conflicted`. An expected database-enforced `denied_mutation` may support a permission claim; `Blocked` requires an explicit blocked assessment. These semantics are implemented and covered by Demo tests.

## Next shared milestone

**M5A — Information-Value Router V0** is next in Demo.

Remaining roadmap:

```text
M5A  Information-value router V0
M5B  Recommendation feedback
M6   Deeper Playwright/agent/backend source
M7   Accelerator demo
M8   Fixed-budget guided/control experiment
M9   Explicit build invalidation V0
```

## Cross-platform browser workflow — merged August 24, 2026

The browser hardening work is now on `main` in both repositories:

```text
Fest PR #10  ->  681b8c94c5dfa881c9631dbfaefb3ef32ea3cee7
Demo PR #14  ->  28bb48c855f2bdaf5cd9fe7d6be5d54152c59487
```

The producer was merged before the consumer. Both PRs passed their final branch checks before merge, and the merge trees matched the audited PR-head trees.

Strict producer identity:

```text
schemaVersion    1
service          festnest-browser-export
buildId          festnest-demo-001
scenarioId       equipment-handoff-v1
controlledRoute  /trips/10000000-0000-4000-8000-000000000001/camp-grid
artifactId       sha256:<64 lowercase hex characters>
```

Festival owns the export process and cleanup. Demo is a strict consumer and never stops an existing listener. The August 23 Gate 3 receipt remains historical. No new exact-tip live Festival -> extension -> Demo API -> PostgreSQL composition, repeated browser workflow, native-WSL replay, or Codespaces forwarded-browser composition was executed on the merged `main` trees. Native WSL remains unverified, and Codespaces manual forwarded-browser composition remains unsupported unless separately implemented.

## Portable paths and Codespaces

Repositories:

```text
Festival  https://github.com/Ashleyrfj2/Fest
Demo      https://github.com/Ashleyrfj2/Demo
```

Typical Codespaces paths may be `/workspaces/Fest` and `/workspaces/Demo`, but code/scripts must use resolved roots rather than literal paths. Manual composition through a Codespaces forwarded browser is unsupported unless separately implemented.

## Technical conventions

- TypeScript strict mode.
- Expo Router navigation.
- Supabase Auth/PostgreSQL/RLS/realtime for shared state.
- SQLite/Secure Store for offline-critical or sensitive local paths.
- Integer cents for money.
- Lucide icons rather than emoji UI icons.
- Preserve fail-closed authorization and destructive-save behavior.
- Never expose service-role keys in client/browser code.

## Local Supabase

```bash
cd "$FESTIVAL_REPO_ROOT"
npx supabase start
npx supabase status
./scripts/demo/reset-demo.sh
```

Festival local ports:

```text
54321  API
54322  PostgreSQL
54323  Studio
54324  local inbox
```

Rules:

- local reset is destructive and must remain loopback-guarded;
- never aim destructive commands at shared/production projects;
- service-role keys are server/admin only;
- never commit `.env` or `.env.local`;
- do not weaken RLS/security to make tests pass.

## Thesis-demo environment

Fixed identifiers:

```text
tenant_id       festival-thesis-demo
build_id        festnest-demo-001
environment_id  festnest-local-browser
scenario_id     equipment-handoff-v1
```

Browser target:

```text
http://127.0.0.1:4173
```

Controlled Gate 3 route:

```text
/trips/10000000-0000-4000-8000-000000000001/camp-grid
```

Verified natural interaction: `Start Building`.

## Evidence-source boundary

Festival activity/audit records, database-owned denials, browser interactions, and Playwright checks are evidence sources. They must not embed Demo sufficiency/routing logic.

The Festival adapter should normalize reviewed fields and omit arbitrary sensitive descriptions/bodies.

## Port coordination

```text
4173   Festival browser
5173   Demo UI
8080   Demo API
54322  Festival PostgreSQL
54332  Demo PostgreSQL
```

Do not change Festival's database port to solve Demo conflicts. Keep the trust domains separate.

## Validation commands

```bash
npm ci
npm run lint -- --no-cache
npx tsc --noEmit
npm test
npm run test:browser
```

For local Supabase changes:

```bash
npx supabase start
./scripts/demo/reset-demo.sh
npx supabase status
```

Static checks do not prove browser, realtime, offline, or authorization runtime behavior. Verify affected runtime boundaries when practical.

## Privacy and security

- synthetic accounts/data only for thesis work;
- never capture passwords, auth tokens, cookies, raw sensitive bodies, or Safety/Emergency content;
- never expose service-role keys in Expo/browser code, extensions, logs, screenshots, or prompts;
- if a restricted mutation succeeds when it should be denied, stop and investigate.

## Definition of done

A Festival task is complete only when the final handoff states:

- files changed;
- exact validation commands/results;
- verified vs inferred behavior;
- database/RLS implications;
- unresolved risks;
- thesis boundary preserved;
- next logical step.
