# Festival Virtual QA Environment — Agent Implementation Runbook

This is the Festival-side operational source of truth for the controlled thesis demo. It should be used with the sibling Demo repository's `docs/agent-logs/CURRENT.md`, `docs/architecture.md`, and `docs/festival-virtual-qa-environment.md`.

## Current truth boundary — August 23, 2026

Gate 1, Gate 2, and Gate 3 are **PASS**.

Verified live chain:

```text
Festival rendered DOM
→ unpacked Demo Chrome MV3 extension
→ capture-phase browser event
→ normalized ValidationEvent envelope
→ durable extension queue
→ authenticated Demo Go API
→ candidate-scope canonicalization
→ Demo PostgreSQL persistence
→ exact session/event correlation
→ queue drain to zero
```

Do **not** rebuild this spine. Gate 3 proves capture, provenance, delivery, candidate-state/context identity, and persistence. It does not by itself prove the refined claim-reconciliation or information-value-routing thesis.

## Product boundary

Festival is the controlled **application environment and evidence source**.

Demo is the **Validation-Evidence System of Record + Information-Value Router** and owns:

- `ClaimDefinition` identity;
- `EvidenceContext` identity;
- observation-to-claim linkage;
- evidence reconciliation;
- confidence/freshness/verification-depth/source-independence/context/conflict semantics;
- derived evidence labels;
- next-validation recommendations;
- correction and recommendation-response history;
- experiment metrics.

A Festival state visit is not automatically proof that the behavior is valid. Candidate states remain useful infrastructure, but the primary demo unit is a behavioral claim plus observations collected under a specific evidence context.

## Fixed V1 accelerator scope

Use the shared group-equipment handoff. Do not expand the accelerator demo across all Festival modules and do not use Safety/Emergency data.

```text
tenant_id       festival-thesis-demo
build_id        festnest-demo-001
environment_id  festnest-local-browser
scenario_id     equipment-handoff-v1
human actors    leader, editor-a, viewer-b, late-tester-d
agent actor     playwright-agent-c
```

Use approximately **6–10 predefined behavioral claims**. The controlled catalog lives in:

`docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`

## Claim model

### ClaimDefinition

```text
Target + StateSignature + ActorContext + ValidationIntent
```

### EvidenceContext

```text
BuildHash + Environment + Tenant/Data Context
+ Feature Flags + optional Device/Region + Timestamp
```

### Observation

A human, Playwright/agent, database verifier, application adapter, CI assertion, or later operational signal linked to a claim in an evidence context.

An observation may support, weaken, contradict, or invalidate the claim.

## Evidence depth

Use the following V1 interpretation when deciding how strong an observation is:

1. **Depth 1 — surface**: visual/DOM presence or shallow observation.
2. **Depth 2 — interaction**: action/transition succeeds in the client.
3. **Depth 3 — persistence/backend**: persisted data or backend truth is verified and survives reload/requery.
4. **Depth 4 — cross-system/asynchronous**: an expected audit/webhook/async/system-side effect is verified.

A shallow successful click does not automatically make a claim Solid.

## Derived demo labels

Demo may present simple labels derived from underlying evidence dimensions:

- **Solid** — sufficiently strong/current/context-compatible evidence, adequate depth, no unresolved hard conflict.
- **Weak** — shallow or low-confidence evidence.
- **Stale** — prior evidence weakened by build/context change or explicit invalidation.
- **Conflicted** — credible observations disagree.
- **Untouched** — no relevant evidence for the required claim/context.
- **Blocked** — validation cannot currently be completed.

These are presentation classes, not the primitive stored truth.

## Canonical accelerator story

The demo should prove that the ledger changes what the next validator should do, not simply that the system can draw a coverage map.

### Step 1 — Start with Build Validation

Show a small claim list grouped by evidence state. Example:

| Claim | Initial evidence |
| --- | --- |
| Shared equipment item can be created | Solid or previously established |
| Equipment state persists after refresh | Weak |
| Viewer cannot perform privileged delete | Untouched |
| Packed state reconciles after stale/offline condition | Untouched or Conflicted |

Explain that these are claims about behavior, not URLs or raw visited states.

### Step 2 — Human creates shallow evidence

A human naturally interacts with Festival. The existing Chrome extension captures the event through the verified Gate 3 path.

Example:

```text
Claim: equipment state persists after update
Human observation: edit/pack action succeeds in UI
Result: Weak
```

The claim stays Weak because the interaction succeeded but persistence has not yet been verified.

### Step 3 — Deeper verifier or agent observation

Use Playwright, the Festival activity/audit adapter, or a database/backend verification path to collect deeper evidence.

Example:

```text
pack → refresh/requery → persisted packed state verified
```

If the deeper observation agrees, evidence can move **Weak → Solid**.

If the UI says success while the persisted/backend state disagrees, the claim should become **Conflicted** rather than falsely Solid.

### Step 4 — Information-value recommendation

Demo recommends a claim/area, never a click-by-click script.

Example:

> Recommended next validation: verify viewer permission enforcement on shared equipment. High business risk · untouched on this build · role boundary · estimated low validation cost.

The recommendation should expose explicit reason factors rather than black-box wording.

### Step 5 — Late-arriving human accepts or overrides

`late-tester-d` may accept the recommendation or override it. Record the response and reason. The resulting observation updates the ledger and recommendation order.

This is the accelerator-demo endpoint: a late validator becomes smarter about **what is worth checking next** because the system reconciled what other validators actually established.

## Controlled Festival scenario

The existing shared-equipment environment remains useful because it provides role, persistence, realtime, stale/offline, and database-authoritative behavior.

Possible source events include:

- leader/editor creates equipment;
- editor claims an unassigned item;
- another signed-in session observes shared state;
- owner packs/unpacks equipment;
- viewer attempts a restricted delete and is denied at the database boundary;
- the controlled stale proxy suppresses the first refresh after packing and later returns authoritative persisted state;
- activity/audit records provide a second source of evidence;
- Playwright verifies a deeper persistence or permission claim.

These actions are inputs to claims; they are not themselves the claim model.

## Deterministic Festival setup

Resolve repository roots dynamically. Do not depend on one developer's absolute path.

From `FESTIVAL_REPO_ROOT`:

```bash
npm install
npm run lint -- --no-cache
npx tsc --noEmit
npm test
npx supabase start
npx supabase status
./scripts/demo/reset-demo.sh
```

Local Festival services use the existing local Supabase configuration. Demo PostgreSQL is a separate trust domain on `54332`.

### Reset/seed requirements

The controlled reset remains responsible for producing the stable synthetic environment:

- four confirmed synthetic users;
- leader/editor/viewer/editor role matrix;
- one stable thesis-demo trip;
- canopy, stakes, first-aid kit, and water records;
- synthetic activity only;
- ignored generated manifest for generated IDs;
- deterministic reset verification.

Reset/seed tooling must refuse unsafe remote destinations unless the explicit guard intended for controlled remote demo reset is supplied.

Never expose a service-role key in browser/Expo public variables, extension configuration, documentation, logs, screenshots, or agent responses.

## Browser environment

Festival remains served as the real rendered browser target on `4173`.

The controlled Gate 3 route is:

`/trips/10000000-0000-4000-8000-000000000001/camp-grid`

The verified natural interaction target is `Start Building`.

The Festival browser gate should preserve:

- real sign-in with synthetic users;
- seeded trip visibility;
- meaningful role differences;
- shared state between sessions;
- deterministic reset behavior;
- no production Supabase destination.

## Hidden ground truth and controlled condition

`demo/scenarios/equipment-handoff-v1.json` remains experiment ground truth, not a tester-facing checklist.

It may contain:

- stable scenario/build IDs;
- expected application behavior;
- business-risk weights;
- seeded stale/offline condition;
- known experimental findings;
- role/permission expectations;
- stop/safety conditions;
- scoring metadata for the later controlled experiment.

The stale/offline condition remains bounded to the controlled local build and must not alter production behavior or data. Discoveries are **seeded experimental findings**, not production defects.

## Festival evidence sources

### Passive browser capture

The Demo Chrome extension captures bounded local interaction envelopes from Festival. It should exclude passwords, tokens, cookies, request bodies, Safety values, and arbitrary sensitive user-entered text.

The browser event is a source observation. Demo decides how it relates to a claim and what evidence depth it provides.

### Festival activity/audit adapter

Festival activity records and database-owned permission-denial audits can provide a more authoritative source for selected claims.

Permission denial must remain database-owned; do not manufacture client-side denial evidence. The adapter should normalize reviewed fields only and omit arbitrary descriptions and sensitive before/after bodies.

The adapter does **not** decide whether a claim is Solid, Weak, or Conflicted.

### Playwright agent/verifier

Playwright can provide deeper evidence by checking a claim at a higher verification depth, such as:

- action succeeds and persisted state survives refresh;
- a restricted mutation remains denied;
- authoritative backend state agrees/disagrees with the UI;
- a fresh independent context resolves a stale/realtime conflict.

It should emit through the same Demo source contract with distinct source provenance.

## Claim-level recommendation behavior

The V0 router should prioritize claim/area validation using transparent factors such as:

```text
uncertainty reduction
× business risk
× diff impact
× smoothed failure prior
÷ expected validation cost
```

Use manual/explicit weights first. Include a novelty/floor so new workflows are not starved because they lack failure history.

Every recommendation should explain why it was selected and allow accept/override with reason.

## Build Validation UI expectation

Prefer **Build Validation**, **Validation Evidence**, or **Evidence Ledger** as the main screen language.

The UI should make it possible to understand:

- the current claim catalog;
- derived evidence class;
- evidence provenance;
- verification depth;
- freshness/context;
- conflicts;
- recommendation factors/reason;
- accept/override feedback;
- correction history where relevant.

A state graph or heatmap may remain a supporting visualization, not the centerpiece.

## Experiment boundary

The accelerator demo and the later fixed-budget experiment are different milestones.

The demo proves the product interaction loop. The controlled study tests the causal hypothesis:

> Given the same fixed validation budget, teams using reconciled shared evidence plus information-value recommendations will produce more valuable validation evidence than unguided teams, without increasing false confidence.

The later experiment should use pre-registered matched scenarios, fixed actor time, evaluator-blinded scoring, and claim/evidence metrics such as Useful Validation Yield, high-severity seeded recall, low-information actor-minutes, false-confidence rate, recommendation outcomes, and claim/evidence correction rates.

Do not present one synthetic demo as proof of the market thesis.

## Trust boundaries and privacy

- Festival application data remains in Festival Supabase.
- Demo validation evidence remains in Demo PostgreSQL.
- Never copy credentials, migrations, JWTs, database URLs, reset commands, or bearer tokens between repositories.
- Use synthetic data only for the controlled environment.
- Exclude Safety/Emergency from V1.
- If a viewer performs a privileged mutation that should be denied, stop and investigate the authorization boundary.

## Readiness for the accelerator recording

The recording-ready product loop is:

1. Festival claim catalog loaded.
2. Human shallow observation enters Demo through verified Gate 3 capture.
3. Claim displays **Weak**.
4. Playwright/agent/backend source adds deeper evidence.
5. Claim becomes **Solid** or **Conflicted**.
6. Router recommends a high-value Weak/Untouched/Conflicted claim with explicit rationale.
7. Late-arriving human accepts or overrides.
8. Ledger and recommendation order update.

Infrastructure receipts and older reports remain valid historical evidence, but the sequence above is the current product story.