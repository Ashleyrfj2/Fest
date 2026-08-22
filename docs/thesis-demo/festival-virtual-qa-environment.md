# Festival Virtual QA Environment — Agent Implementation Runbook

This tracked document mirrors the private Notion tutorial's operational requirements. It is the GitHub/Codespaces source for Riley and all agents. The private Notion page and Ashley's local filesystem are not required.

## Truth boundary and goal

The repositories are not a working end-to-end demo until every relevant gate in this runbook passes. Festival currently provides collaborative workflows and browser fixtures; the thesis repository begins as an evidence-system scaffold. Passing lint, type checking, or a health check alone does not prove the demo.

The outcome is a controlled, synthetic Festival environment in which two humans and one Playwright agent explore the same seeded build, a late tester receives an explainable evidence-based area recommendation, and baseline/guided metrics test whether routing closes uncertainty without suppressing useful independent verification.

Festival is the application environment and evidence source. The thesis remains the vendor-neutral evidence ledger, state/evidence reconciler, information-gain router, UI, and metrics system. Keep Festival application data in local Supabase and thesis evidence in the thesis PostgreSQL database.

## Fixed V1 scope

Use only the shared group-equipment handoff. Do not expand V1 across Festival's other modules and do not use Safety/Emergency data.

```text
tenant_id       festival-thesis-demo
build_id        festnest-demo-001
environment_id  festnest-local-browser
scenario_id     equipment-handoff-v1
human actors    leader, editor-a, viewer-b, late-tester-d
agent actor     playwright-agent-c
```

Canonical trajectory:

1. Leader creates a shared canopy item.
2. Editor A claims it.
3. A second human independently observes the claimed state.
4. Editor A marks it packed while the controlled stale/offline condition is active.
5. Viewer B attempts a restricted mutation and must be denied.
6. The environment returns online and shared state reconciles.
7. The Playwright agent examines a different context.
8. Late Tester D receives the highest-value unresolved area, explores naturally, and updates the shared evidence model.

Evidence meaning:

| Action | Candidate evidence | Value |
| --- | --- | --- |
| Create canopy | item exists / unassigned | new state evidence |
| Claim canopy | unassigned to claimed | new transition evidence |
| Independent claimed-state check | claimed state corroborated | useful once |
| Viewer mutation attempt | viewer mutation denied | high-value role-context evidence |
| Pack during stale/offline condition | claimed to packed with conflicting freshness | high uncertainty |
| Reconciliation check | targeted verification | closes prioritized gap |

## Portable repositories and expected files

Resolve both roots dynamically. In Codespaces they are normally `/workspaces/Demo` and `/workspaces/Fest`, but no implementation may depend on those literal paths.

Festival files to extend or create:

```text
scripts/export-browser-app.mjs
tests/browser/app.spec.ts
lib/hooks/useSupplyList.ts
scripts/demo/seed-demo.mjs
scripts/demo/reset-demo.sh
scripts/demo/verify-seed.mjs
scripts/demo/activity-log-adapter.mjs
scripts/demo/run-agent.mjs or tests/demo/equipment-handoff.spec.ts
demo/scenarios/equipment-handoff-v1.json
demo/.generated/manifest.json              # generated and ignored
```

Thesis files to extend or create:

```text
docker-compose.yml
backend/internal/httpapi/router.go
backend/internal/state/service.go
backend/internal/evidence/service.go
backend/internal/sufficiency/service.go
backend/internal/routing/service.go
backend/internal/store/postgres.go
backend/internal/experiment/metrics.go
supabase/migrations/*
extension/manifest.json
extension/src/config.ts
extension/src/normalize.ts
extension/src/content.ts
extension/src/background.ts
frontend/src/App.tsx
frontend/src/api.ts
```

The existing Festival Playwright fixture is useful smoke infrastructure but is per-page and largely canned. Do not use it as the shared multi-user store; use local Supabase.

## Prerequisites and safety

- Node.js 20+, npm, Docker, Chrome/Chromium, Supabase CLI through `npx`, and Playwright Chromium.
- Go 1.23+ is optional when Docker is used for the backend.
- Work only against local Supabase or an explicitly approved disposable demo project.
- Reset and seed scripts must refuse non-loopback Supabase URLs unless `ALLOW_REMOTE_DEMO_RESET=true` is deliberately supplied.
- Never commit passwords, tokens, service-role keys, generated user IDs, or the manifest.
- Never place a service-role key in an `EXPO_PUBLIC_` variable, browser bundle, extension, log, screenshot, or agent response.

Preflight:

```bash
node --version
npm --version
docker --version
docker compose version
npx supabase --version
```

## Deterministic Festival setup

From `FESTIVAL_REPO_ROOT`:

```bash
npm install
npm run lint -- --no-cache
npx tsc --noEmit
npm test
npx supabase start
npx supabase status
npx supabase db reset
```

Local Festival ports are API `54321`, PostgreSQL `54322`, Studio `54323`, and inbox `54324`. Obtain the local anon and service-role values from `npx supabase status` without printing them in handoffs.

`scripts/demo/seed-demo.mjs` must:

1. Read `EXPO_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the environment.
2. Enforce the loopback safety rule.
3. Create confirmed synthetic accounts `leader@example.test`, `editor-a@example.test`, `viewer-b@example.test`, and `late-d@example.test` through the admin API.
4. Let the existing auth trigger create corresponding `public.users` records.
5. Create one stable trip named `Thesis Demo Festival Trip` with a stable UUID and invite code.
6. Assign roles in order: leader, editor, viewer, editor.
7. Seed canopy, stakes, first-aid kit, and water.
8. Insert only synthetic activity records.
9. Write generated user IDs and stable record IDs to ignored `demo/.generated/manifest.json`.
10. Print only the four local login emails and one local-only password.

`scripts/demo/reset-demo.sh` must run reset, seed, and verification in that order. Verification must fail unless exactly one demo trip, all four users, the exact role matrix, and the fixed initial records exist. Run reset twice when validating determinism.

The browser export must prefer caller-provided values:

```javascript
EXPO_PUBLIC_SUPABASE_URL:
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
EXPO_PUBLIC_SUPABASE_ANON_KEY:
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'festnest-browser-fixture-anon-key',
```

Never pass the service-role key to the export. Export to a temporary directory and serve at port `4173`. In Codespaces use the forwarded Festival URL when a browser cannot reach container loopback directly.

Browser gate:

- Welcome/sign-in render and all four users authenticate.
- Seeded trip appears and roles behave differently.
- Supply changes appear in a second session after realtime/refetch.
- Reset restores the exact original data.
- No request targets production Supabase.

## Hidden ground truth and controlled condition

`demo/scenarios/equipment-handoff-v1.json` must contain stable scenario/build IDs, expected states and transitions, risk weights, useful independent-verification rules, low-information same-context repeat rules, expected viewer RLS denial, the seeded stale/offline condition, known failure IDs, and success/stop conditions.

Do not bundle this file into the tester-facing application. It is research ground truth, not an authored exploratory checklist.

V1 uses one controlled condition: delay or suppress the first realtime refresh after Editor A marks the canopy packed, using Requestly or a demo-only local proxy rule against local Supabase.

- Activate only for `festnest-demo-001`.
- Record activation and deactivation time.
- Keep it hidden from testers until debrief.
- Never alter production logic or production data.
- Call discoveries `seeded experimental findings`, not production defects.

## Thesis database and API

Festival owns host DB port `54322`; map thesis PostgreSQL as `54332:5432`. The thesis API connects inside Docker to `postgres:5432`.

Migrations must create immutable `validation_events`, `candidate_states`, `state_corrections`, `evidence_records`, `verification_requests`, `recommendation_events`, `recommendation_responses`, `experiment_runs`, and versioned `experiment_metrics`. Index tenant/build/environment; actor/session/run; route/state fingerprint; source type; outcome; and occurrence time.

`POST /api/v1/events` must enforce the normalized contract and allowed values, reject oversized/malformed input, preserve immutable raw evidence, enforce `event_id` idempotency, trigger recomputation, return `202` for new input, and return a stable duplicate response without duplicating evidence.

Required reads/actions:

```text
GET  /api/v1/evidence?tenant_id=&build_id=&environment_id=
GET  /api/v1/recommendations/next?actor_id=&role=&build_id=
POST /api/v1/recommendations/{id}/responses
POST /api/v1/states/{id}/merge
POST /api/v1/states/{id}/split
POST /api/v1/states/{id}/rename
GET  /api/v1/experiments/{id}/metrics
```

## Three evidence sources

### Passive browser capture

The extension may match only local Festival port `4173` and post only to the local QA API on `8080`. Configuration in `chrome.storage.local` must include tenant/build/environment/scenario, actor/role/session, API base URL, and capture enabled state. Do not hardcode secrets.

Capture bounded envelopes: route, stable control identity, action type, step index, and masking metadata. Exclude auth routes, passwords, tokens, cookies, request bodies, Safety values, and arbitrary user-entered text. Batch and normalize events, use bounded exponential backoff, preserve event IDs across retries, and expose transport failure visibly.

### Festival activity adapter

Read new `activity_logs` for the seeded trip and map at least `supply_item_added`, `supply_item_claimed`, `supply_item_packed`, and permission failures to the shared vocabulary. Add actor, role, build, environment, route, target, and timestamp. Derive deterministic fingerprints such as `supply-list:item:<id>:status:<status>`, deterministic event IDs, and a durable local cursor. Post once and exclude unreviewed descriptions. The adapter never decides sufficiency or routing.

### Playwright agent

Sign in with a synthetic agent/editor context, explore an area not already assigned to a human, emit `source_type=agent` and `source_adapter=playwright`, record steps/verifier results under the fixed build/environment, and produce a targeted human verification request for high-risk or ambiguous results.

## State, sufficiency, and recommendation behavior

Start with a coarse, correctable state key:

```text
build x environment x role x module x record x business-state
```

Support: strongly represented, weak/uncertain, conflicting, stale, blocked, untouched, and needs independent verification. Preserve the first independent confirmation; changes in role, build, browser/device, or online/offline context; intermittent/high-risk reproduction; and fix verification. Deprioritize only same-build, same-role, same-context repeats after evidence is sufficient.

The recommendation is an area plus rationale, never a click script. Initial expected example:

> High-value area: verify the canopy's packed state after reconnect as viewer-b. The claim path is already represented, but the offline/realtime result is conflicting and the viewer context is missing.

## Evidence UI and metrics

The API-backed UI must show tenant/build/environment/scenario, status by Festival area, source provenance, role/context, freshness, conflicts, verification requests, recommendation factors/rationale, required-reason accept/dismiss controls, state merge/split/rename controls, and baseline/guided status with a metrics link. Polling is acceptable; do not add realtime infrastructure only for visual effect.

Compute and export the same versioned definitions for both runs:

- Low-information overlap rate.
- Useful independent verification preserved.
- Novel or risk-relevant evidence per tester-hour.
- Late tester time-to-next-useful-area.
- High-risk gap closure time.
- Accepted defect/evidence yield.
- Recommendation acceptance and dismissal reasons.
- Seeded-condition discovery rate.
- Evidence completeness for build/environment/role/source/time.
- State correction and false merge/split rate.
- Capture/adapter overhead and failure rate.

Keep raw activity, code coverage, exploratory evidence, accepted findings, and allocation efficiency distinct.

## Validation gates

Festival: lint, types, deterministic tests, and browser tests pass; migrations apply; reset succeeds twice identically; four accounts sign in; roles/RLS work; two sessions share state; and no production destination appears.

Thesis: health passes; valid events persist; invalid events fail closed; duplicates remain idempotent; human/adapter/agent events share the contract; state grouping is explainable/correctable; build changes make affected evidence stale; viewer denial is role-context evidence; rationale matches factors; responses persist; and metrics reproduce.

Privacy: only local allowlisted origins and synthetic data; auth routes/passwords/cookies/tokens/keys/raw bodies/Safety values excluded; descriptions masked or omitted. If a viewer mutation succeeds, stop the demo and investigate RLS.

## Baseline and guided runs

Baseline `festival-baseline-001`: reset; create the run; hide evidence/recommendations from testers; give the broad mission “Explore how a group prepares and tracks shared equipment”; allow normal coordination for the fixed timebox; capture evidence/findings; freeze metrics.

Guided `festival-guided-001`: reset to identical ground truth; enable shared evidence and area recommendations; let two humans explore; run the agent through the same contract; introduce Human D only after meaningful evidence exists; persist the recommendation, rationale, response, and reason; let D explore naturally; stop at the identical timebox; freeze metrics.

Continue the thesis claim only if routing improves information allocation without suppressing useful verification or lowering accepted yield. One demo does not prove the market thesis, every repeat is not waste, and seeded findings are not production defects.

## Startup after implementation

Use separate terminals and dynamically resolved roots:

```bash
# Festival services and deterministic data
cd "$FESTIVAL_REPO_ROOT"
npx supabase start
./scripts/demo/reset-demo.sh

# Festival browser export
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
EXPO_PUBLIC_SUPABASE_ANON_KEY='<local-anon-key>' \
FESTNEST_BROWSER_EXPORT_DIR=/tmp/festnest-thesis-browser \
node scripts/export-browser-app.mjs

# Thesis API/database
cd "$THESIS_REPO_ROOT"
docker compose up --build

# Activity adapter
cd "$FESTIVAL_REPO_ROOT"
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY='<local-service-role-key>' \
QA_API_BASE_URL=http://127.0.0.1:8080 \
node scripts/demo/activity-log-adapter.mjs

# UI when not containerized
cd "$THESIS_REPO_ROOT/frontend"
npm install
npm run dev
```

Open Festival `4173`, thesis UI `5173`, thesis API `8080`, and local Studio `54323`. In Codespaces use forwarded URLs and keep non-UI/database ports private.

## Readiness and presentation boundary

Ready means: Festival is the only target; scope stays bounded; reset and hidden truth work; human/agent identities remain distinct; all evidence carries build/environment/context/source/time; useful verification is preserved; redundant overlap can be deprioritized; stale/offline uncertainty creates a verification request; a late tester receives an explainable recommendation; evidence/routing update after action; metrics export automatically; backup dataset/screenshots/recording exist; and no production or sensitive data is used.

For the five-minute demo: state the problem, show the synthetic environment and hidden-condition boundary, let humans explore, show shared evidence, add the agent, route the late tester, show evidence/routing update, compare the runs, and finish with the narrow thesis claim.

## Troubleshooting

- Supabase start fails: ensure Docker runs and ports `54321`–`54324` are free.
- Port `54322` conflicts: map thesis PostgreSQL to `54332`; do not move Festival mid-run.
- Export uses fixture configuration: ensure caller environment values win and rebuild.
- Browser smoke passes but shared state fails: replace canned per-page data with local Supabase sessions.
- Extension cannot post: check its narrow host permission, local configuration, worker errors, and API health.
- Duplicate Festival activity: inspect adapter cursor and API idempotency.
- Evidence remains static: inspect persistence, recomputation, and frontend API/polling integration.
- Viewer can mutate: stop; verify current RLS migrations at the database boundary.
- Old-build evidence appears current: treat as evidence correctness failure.
- Recommendation reads like a script: reduce it to an area and transparent rationale.
