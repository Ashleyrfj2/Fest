# Agent Operating Guide — Festival / FestNest

Last thesis synchronization: 2026-08-27 CDT

This file is required reading for agent work in `Ashleyrfj2/Fest`.

## Start every task here

1. Inspect `git status --short` and preserve existing user changes.
2. Read `README.md`, `docs/README.md`, and the relevant feature/module docs.
3. On Riley's Windows PC/WSL, read `docs/setup/cross-platform-workspace.md` before installing dependencies or starting services.
4. For thesis-demo work, read `docs/QA_PLATFORM_INTEGRATION.md`, `docs/thesis-demo/festival-virtual-qa-environment.md`, and `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`.
5. When the sibling Demo checkout exists, read its `AGENTS.md` and `docs/agent-logs/CURRENT.md`.
6. Resolve roots dynamically with `git rev-parse --show-toplevel`; never depend on `/Users/...`, `C:\...`, or developer-specific paths.
7. Use local/synthetic data for thesis work. Never reset or seed a shared/production Festival project without explicit approval.
8. Treat historical reports/session notes as point-in-time receipts, not current thesis status.

## Riley native-WSL contract

Riley's supported active clone is:

```text
~/repos/Fest
```

with sibling Demo at:

```text
~/repos/Demo
```

Never use `/mnt/c`, `/mnt/e`, or another Windows-mounted checkout for active work.

Both repositories pin:

```text
Node 22.21.0
npm  10.9.4
```

Use WSL-local Git/Node/npm/Bash and Docker Desktop's WSL2 integration. GitHub authentication must work inside WSL because both repositories are private.

Do not copy Ashley's `.env`, credentials, `node_modules`, Playwright cache, Docker volumes, Supabase state, or Demo database state.

Native WSL composed-runtime proof remains unverified until Riley actually runs it. A clean clone/install or static test pass is not runtime proof.

## Project description

FestNest is an Expo/React Native/TypeScript application for coordinating group camping-festival trips. Festival is also the controlled source application for the QA thesis demo.

Festival owns application behavior, local Supabase state, authorization/RLS/RPC behavior, deterministic seed/reset tooling, activity/audit source records, and the rendered browser target.

The sibling Demo repository owns validation-evidence semantics, reconciliation, routing, recommendation feedback/progression, and experiment metrics.

## Current thesis-demo status

Do not redo these shared milestones unless a regression requires it:

```text
Gate 1   PASS
Gate 2   PASS
Gate 3   PASS  fresh exact-tip runtime receipt Aug 27
M4A      PASS
M4B      PASS
M4C      PASS
M4D      PASS
M5A      PASS  merged in Demo
M5B      PASS  merged in Demo (#20)
Live M5B PASS  frozen composed-runtime proof Aug 27
M6       PASS  deeper heterogeneous Playwright/backend verifier — Demo PR #23
NEXT           M7 accelerator-demo recording
```

M6 is complete. It proves a real Festival action can create depth-1 human evidence, an independent Playwright reload + authoritative Festival Supabase backend check can create depth-3 agent evidence, Demo reconciliation can move the controlled claim **Weak → Solid**, restart can reconstruct it, failed verification can submit no stronger evidence, and a controlled contradiction derives **Conflicted**.

Festival's current declared baseline is **49/49 deterministic tests**, **5/5 browser tests**, TypeScript PASS, and lint 0 errors with 3 pre-existing warnings.

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

The controlled set contains 8 behavioral claims for the group-equipment handoff scenario.

Canonical deterministic roles:

```text
leader         leader
editor-a       editor
viewer-b       viewer
late-tester-d  editor
```

Do not use Safety/Emergency data in the thesis demo.

## Cross-repository semantics Festival must preserve

- Compatible contradict-only evidence intentionally derives `Conflicted` in Demo.
- An expected database-enforced `denied_mutation` may support a permission claim; `Blocked` requires an explicit blocked assessment.
- Recommendation scope preserves run/build/environment/scenario/device/region/feature-flags/actor/role.
- Festival supplies behavior/evidence; it must not embed Demo ranking or sufficiency logic.
- M6's deeper verifier is an evidence source, not classification authority.
- Do not modify Festival behavior merely to make Demo ranking or proof scripts easier.

## Current roadmap

```text
M5A  Transparent information-value router V0 — PASS
M5B  Recommendation feedback / explicit override — PASS
      Live override/retry/restart/frozen proof — PASS
M6   Deeper heterogeneous Playwright/backend evidence — PASS
M7   Accelerator demo recording — NEXT
M8   Fixed-budget guided/control experiment
M9   Explicit build invalidation V0
```

## Git workflow

Before editing:

```bash
git status --short
git branch --show-current
git fetch origin
git diff origin/main...HEAD --name-only
```

Preserve unrelated changes. When starting from `main`:

```bash
git switch main
git pull --ff-only origin main
```

Use a purpose branch for milestone/runtime/configuration work. Documentation-only cleanup may use a docs branch. Do not merge without explicit user authorization.

Never force-push `main` or bypass branch protection.

## Portable paths

Repositories:

```text
Festival  https://github.com/Ashleyrfj2/Fest
Demo      https://github.com/Ashleyrfj2/Demo
```

Code/scripts must resolve repository roots instead of hard-coding checkout paths. Manual composition through a Codespaces forwarded browser is unsupported unless separately implemented.

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

On a configured machine:

```bash
nvm install
nvm use
npm ci
npx playwright install --with-deps chromium  # WSL; macOS uses install chromium
npm run workspace:check
./scripts/demo/start-local-supabase.sh
./scripts/demo/reset-demo.sh
npx supabase status
```

Use only the repository-pinned CLI through `npx supabase`.

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

Strict producer identity:

```text
schemaVersion    1
service          festnest-browser-export
buildId          festnest-demo-001
scenarioId       equipment-handoff-v1
controlledRoute  /trips/10000000-0000-4000-8000-000000000001/camp-grid
artifactId       sha256:<64 lowercase hex characters>
```

Festival owns the export process and cleanup. Demo never kills an unknown or Festival-owned listener.

## Evidence-source boundary

Festival activity/audit records, database-owned denials, browser interactions, and Playwright checks are evidence sources. They must not embed Demo sufficiency/routing logic.

The Festival adapter should normalize reviewed fields and omit arbitrary sensitive descriptions/bodies.

## Port coordination

```text
4173   Festival browser
5173   Demo UI
8080   Demo API
54321  Festival Supabase API
54322  Festival PostgreSQL
54332  Demo PostgreSQL
```

Do not change Festival's database port to solve Demo conflicts. Keep the trust domains separate.

## Validation commands

```bash
npm ci
npm run workspace:check
npm run lint -- --no-cache
npx tsc --noEmit
npm test
npm run test:browser
```

Static checks do not prove browser, realtime, offline, authorization, cross-repository runtime behavior, or native WSL composition. Verify affected runtime boundaries when practical.

## Privacy and security

- synthetic accounts/data only for thesis work;
- never capture passwords, auth tokens, cookies, raw sensitive bodies, or Safety/Emergency content;
- never expose service-role keys in Expo/browser code, extensions, logs, screenshots, or prompts;
- if a restricted mutation succeeds when it should be denied, stop and investigate.

## Definition of done

A Festival task handoff must state:

- branch/base and files changed;
- exact validation commands/results;
- verified vs inferred behavior;
- database/RLS implications;
- unresolved risks;
- thesis boundary preserved;
- next logical step;
- commit/push/PR/merge status.
